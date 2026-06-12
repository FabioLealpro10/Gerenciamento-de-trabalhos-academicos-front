import { ChangeDetectorRef, Component, inject, OnInit } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';
import { finalize } from 'rxjs';
import { TrabalhosService } from '../../../core/services/trabalhos.service';
import { AuthService } from '../../../core/services/auth.service';
import { TrabalhoListItem } from '../../../core/models/trabalho.model';
import { DisciplinaListItem } from '../../../core/models/disciplina.model';
import { PAGINA_INICIAL, PageQuery } from '../../../core/models/page.model';
import { mensagemErroHttp } from '../../../core/utils/http-error.util';
import { PaginacaoComponent } from '../../../shared/paginacao/paginacao.component';
import { DataBrPipe } from '../../../shared/pipes/data-br.pipe';

@Component({
  selector: 'app-aluno-trabalhos-list',
  standalone: true,
  imports: [RouterLink, PaginacaoComponent, DataBrPipe],
  templateUrl: './aluno-trabalhos-list.component.html',
  styleUrl: './aluno-trabalhos-list.component.css',
})
export class AlunoTrabalhosListComponent implements OnInit {
  private readonly trabalhosService = inject(TrabalhosService);
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly cdr = inject(ChangeDetectorRef);

  disciplinaId: string | null = null;
  disciplina: DisciplinaListItem | null = null;
  trabalhos: TrabalhoListItem[] = [];
  loading = false;
  errorMessage = '';

  paginacao: PageQuery = { ...PAGINA_INICIAL };
  totalPages = 0;
  totalElements = 0;

  ngOnInit(): void {
    if (!this.authService.isAuthenticated()) {
      void this.router.navigate(['/login']);
      return;
    }

    const id = this.route.snapshot.paramMap.get('disciplinaId');
    if (!id) {
      void this.router.navigate(['/dashboard']);
      return;
    }

    this.disciplinaId = id;
    this.disciplina =
      (history.state?.['disciplina'] as DisciplinaListItem | undefined) ?? null;

    this.carregar();
  }

  get tituloDisciplina(): string {
    return this.disciplina?.nome ?? `Disciplina #${this.disciplinaId}`;
  }

  carregar(): void {
    this.errorMessage = '';

    if (!this.authService.getToken() || !this.disciplinaId) {
      this.errorMessage = 'Sessão expirada. Faça login novamente.';
      this.cdr.detectChanges();
      return;
    }

    this.loading = true;
    this.cdr.detectChanges();

    this.trabalhosService
      .listarPorDisciplinaPagina(this.disciplinaId, this.paginacao)
      .pipe(
        finalize(() => {
          this.loading = false;
          this.cdr.detectChanges();
        }),
      )
      .subscribe({
        next: (pagina) => {
          this.trabalhos = pagina.itens;
          this.totalPages = pagina.totalPages;
          this.totalElements = pagina.totalElements;
        },
        error: (err: HttpErrorResponse) => {
          this.errorMessage = mensagemErroHttp(err, {
            temToken: !!this.authService.getToken(),
            contexto: 'listar',
            entidade: 'trabalhos',
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

  abrirPdf(trabalho: TrabalhoListItem): void {
    if (trabalho.id == null) {
      return;
    }

    this.trabalhosService.baixarPdf(trabalho.id).subscribe({
      next: (blob) => {
        window.open(URL.createObjectURL(blob), '_blank');
      },
      error: () => {
        this.errorMessage = 'Erro ao abrir o PDF do trabalho.';
        this.cdr.detectChanges();
      },
    });
  }

  abrirEntrega(trabalho: TrabalhoListItem): void {
    if (trabalho.id == null || !this.disciplinaId) {
      this.errorMessage = 'Este trabalho não possui ID.';
      this.cdr.detectChanges();
      return;
    }

    this.router.navigate(
      [
        '/aluno/disciplinas',
        this.disciplinaId,
        'trabalhos',
        trabalho.id,
        'entrega',
      ],
      { state: { trabalho, disciplina: this.disciplina } },
    );
  }
}
