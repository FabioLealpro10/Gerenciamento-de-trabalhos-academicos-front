import { ChangeDetectorRef, Component, inject, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';
import { finalize } from 'rxjs';
import { EntregasService } from '../../../core/services/entregas.service';
import { AuthService } from '../../../core/services/auth.service';
import {
  EntregaListItem,
  TrabalhoListItem,
} from '../../../core/models/trabalho.model';
import { PAGINA_INICIAL, PageQuery } from '../../../core/models/page.model';
import { mensagemErroHttp } from '../../../core/utils/http-error.util';
import { PaginacaoComponent } from '../../../shared/paginacao/paginacao.component';
import { DataBrPipe } from '../../../shared/pipes/data-br.pipe';

@Component({
  selector: 'app-trabalhos-entregas',
  standalone: true,
  imports: [FormsModule, RouterLink, PaginacaoComponent, DataBrPipe],
  templateUrl: './trabalhos-entregas.component.html',
  styleUrl: './trabalhos-entregas.component.css',
})
export class TrabalhosEntregasComponent implements OnInit {
  private readonly entregasService = inject(EntregasService);
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly cdr = inject(ChangeDetectorRef);

  trabalhoId: string | null = null;
  disciplinaId: string | null = null;
  modoProfessor = false;
  trabalho: TrabalhoListItem | null = null;
  entregas: EntregaListItem[] = [];
  entregaSelecionada: EntregaListItem | null = null;

  notaCorrecao: number | null = null;
  feedbackCorrecao = '';

  loading = false;
  loadingCorrecao = false;
  errorMessage = '';
  successMessage = '';

  paginacao: PageQuery = { ...PAGINA_INICIAL };
  totalPages = 0;
  totalElements = 0;

  get linkVoltar(): string {
    if (this.modoProfessor && this.disciplinaId) {
      return `/professor/disciplinas/${this.disciplinaId}/trabalhos`;
    }
    return '/trabalhos';
  }

  ngOnInit(): void {
    if (!this.authService.isAuthenticated()) {
      void this.router.navigate(['/login']);
      return;
    }

    this.modoProfessor = this.router.url.includes('/professor/');
    this.disciplinaId = this.route.snapshot.paramMap.get('disciplinaId');

    const id = this.route.snapshot.paramMap.get('id');
    if (!id) {
      void this.router.navigate([this.linkVoltar]);
      return;
    }

    this.trabalhoId = id;
    this.trabalho =
      (history.state?.['trabalho'] as TrabalhoListItem | undefined) ?? null;

    this.carregar();
  }

  get tituloPagina(): string {
    return this.trabalho?.titulo ?? `Trabalho #${this.trabalhoId}`;
  }

  carregar(): void {
    this.errorMessage = '';

    if (!this.authService.getToken()) {
      this.errorMessage = 'Sessão expirada. Faça login novamente.';
      this.cdr.detectChanges();
      return;
    }

    if (!this.trabalhoId) {
      return;
    }

    this.loading = true;
    this.cdr.detectChanges();

    this.entregasService
      .listarPorTrabalhoPagina(this.trabalhoId, this.paginacao)
      .pipe(
        finalize(() => {
          this.loading = false;
          this.cdr.detectChanges();
        }),
      )
      .subscribe({
        next: (pagina) => {
          this.entregas = pagina.itens;
          this.totalPages = pagina.totalPages;
          this.totalElements = pagina.totalElements;
          if (!this.trabalho && this.entregas.length > 0) {
            const primeira = this.entregas[0];
            this.trabalho = {
              id: this.trabalhoId!,
              titulo: primeira.trabalhoTitulo ?? `Trabalho #${this.trabalhoId}`,
            };
          }

          if (this.entregaSelecionada) {
            const atualizada = this.entregas.find(
              (e) => e.alunoId === this.entregaSelecionada?.alunoId,
            );
            if (atualizada) {
              this.abrirCorrecao(atualizada, false);
            } else {
              this.entregaSelecionada = null;
            }
          }
        },
        error: (err: HttpErrorResponse) => {
          this.errorMessage = mensagemErroHttp(err, {
            temToken: !!this.authService.getToken(),
            contexto: 'listar',
            entidade: 'entregas',
          });
        },
      });
  }

  mudarPagina(page: number): void {
    this.paginacao = { ...this.paginacao, page };
    this.carregar();
  }

  mudarTamanhoPagina(size: number): void {
    this.paginacao = { page: 0, size };
    this.carregar();
  }

  abrirPdf(entrega: EntregaListItem): void {
    if (entrega.id == null) {
      return;
    }

    this.entregasService.baixarPdf(entrega.id).subscribe({
      next: (blob) => {
        window.open(URL.createObjectURL(blob), '_blank');
      },
      error: () => {
        this.errorMessage = 'Erro ao abrir o PDF da entrega.';
        this.cdr.detectChanges();
      },
    });
  }

  abrirCorrecao(entrega: EntregaListItem, limparMensagens = true): void {
    if (entrega.alunoId == null) {
      this.errorMessage = 'Esta entrega não possui ID do aluno para correção.';
      this.cdr.detectChanges();
      return;
    }

    if (limparMensagens) {
      this.errorMessage = '';
      this.successMessage = '';
    }

    this.entregaSelecionada = entrega;
    this.notaCorrecao = entrega.nota != null ? entrega.nota : null;
    this.feedbackCorrecao = entrega.feedback ?? '';
    this.cdr.detectChanges();
  }

  fecharCorrecao(): void {
    this.entregaSelecionada = null;
    this.notaCorrecao = null;
    this.feedbackCorrecao = '';
    this.cdr.detectChanges();
  }

  salvarCorrecao(): void {
    this.errorMessage = '';
    this.successMessage = '';

    if (!this.entregaSelecionada?.alunoId || !this.trabalhoId) {
      this.errorMessage = 'Dados insuficientes para corrigir a entrega.';
      this.cdr.detectChanges();
      return;
    }

    if (this.notaCorrecao == null || this.notaCorrecao < 0) {
      this.errorMessage = 'Informe uma nota válida (0 ou maior).';
      this.cdr.detectChanges();
      return;
    }

    if (!this.authService.getToken()) {
      this.errorMessage = 'Sessão expirada. Faça login novamente.';
      this.cdr.detectChanges();
      return;
    }

    this.loadingCorrecao = true;
    this.cdr.detectChanges();

    this.entregasService
      .corrigir(this.trabalhoId, this.entregaSelecionada.alunoId, {
        nota: this.notaCorrecao,
        feedback: this.feedbackCorrecao.trim(),
      })
      .pipe(
        finalize(() => {
          this.loadingCorrecao = false;
          this.cdr.detectChanges();
        }),
      )
      .subscribe({
        next: () => {
          this.successMessage = `Correção salva para ${this.entregaSelecionada?.alunoNome ?? 'o aluno'}.`;
          this.carregar();
        },
        error: (err: HttpErrorResponse) => {
          this.errorMessage = mensagemErroHttp(err, {
            temToken: !!this.authService.getToken(),
            contexto: 'salvar',
            entidade: 'correção da entrega',
          });
        },
      });
  }
}
