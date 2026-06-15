import { ChangeDetectorRef, Component, inject, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';
import { finalize } from 'rxjs';
import { TrabalhosService } from '../../../core/services/trabalhos.service';
import { AuthService } from '../../../core/services/auth.service';
import { TrabalhoListItem } from '../../../core/models/trabalho.model';
import { DisciplinaListItem } from '../../../core/models/disciplina.model';
import { PAGINA_INICIAL, PageQuery } from '../../../core/models/page.model';
import { mensagemErroHttp } from '../../../core/utils/http-error.util';
import { filtrarPorTextoLocal } from '../../../core/utils/local-search.util';
import { PaginacaoComponent } from '../../../shared/paginacao/paginacao.component';
import { DataBrPipe } from '../../../shared/pipes/data-br.pipe';
import { MaterialIconComponent } from '../../../shared/icons/material-icon.component';

@Component({
  selector: 'app-professor-trabalhos-list',
  standalone: true,
  imports: [RouterLink, FormsModule, PaginacaoComponent, DataBrPipe, MaterialIconComponent],
  templateUrl: './professor-trabalhos-list.component.html',
  styleUrl: './professor-trabalhos-list.component.css',
})
export class ProfessorTrabalhosListComponent implements OnInit {
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
  successMessage = '';

  paginacao: PageQuery = { ...PAGINA_INICIAL };
  totalPages = 0;
  totalElements = 0;
  pesquisaLocal = '';

  get trabalhosFiltrados(): TrabalhoListItem[] {
    return filtrarPorTextoLocal(this.trabalhos, this.pesquisaLocal, [
      (t) => t.titulo,
      (t) => t.descricao,
    ]);
  }

  ngOnInit(): void {
    if (!this.authService.isAuthenticated()) {
      void this.router.navigate(['/login']);
      return;
    }

    const id = this.route.snapshot.paramMap.get('disciplinaId');
    if (!id) {
      void this.router.navigate(['/professor/disciplinas']);
      return;
    }

    this.disciplinaId = id;
    this.disciplina =
      (history.state?.['disciplina'] as DisciplinaListItem | undefined) ?? null;

    this.route.queryParamMap.subscribe((params) => {
      const msg = params.get('msg');
      if (msg === 'cadastro') {
        this.successMessage = 'Trabalho cadastrado com sucesso!';
      } else if (msg === 'edicao') {
        this.successMessage = 'Trabalho atualizado com sucesso!';
      } else if (msg === 'exclusao') {
        this.successMessage = 'Trabalho excluído com sucesso!';
      } else {
        this.successMessage = '';
      }
      this.cdr.detectChanges();
    });

    this.carregar();
  }

  get tituloDisciplina(): string {
    return this.disciplina?.nome ?? `Disciplina #${this.disciplinaId}`;
  }

  carregar(): void {
    this.errorMessage = '';

    if (!this.authService.getToken()) {
      this.errorMessage =
        'Token não encontrado. Faça logout, login como PROFESSOR e acesse novamente.';
      this.cdr.detectChanges();
      return;
    }

    if (!this.disciplinaId) {
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

  verAlunosMatriculados(): void {
    if (!this.disciplinaId) {
      return;
    }

    this.router.navigate(
      ['/professor/disciplinas', this.disciplinaId, 'alunos'],
      { state: { disciplina: this.disciplina } },
    );
  }

  irParaCadastro(): void {
    if (!this.disciplinaId) {
      return;
    }

    this.router.navigate(
      ['/professor/disciplinas', this.disciplinaId, 'trabalhos', 'novo'],
      { state: { disciplina: this.disciplina } },
    );
  }

  editar(trabalho: TrabalhoListItem): void {
    if (trabalho.id == null || !this.disciplinaId) {
      this.errorMessage = 'Este trabalho não possui ID para edição.';
      this.cdr.detectChanges();
      return;
    }

    this.router.navigate(
      ['/professor/disciplinas', this.disciplinaId, 'trabalhos', trabalho.id, 'editar'],
      { state: { trabalho, disciplina: this.disciplina } },
    );
  }

  excluir(trabalho: TrabalhoListItem): void {
    if (trabalho.id == null) {
      this.errorMessage = 'Este trabalho não possui ID para exclusão.';
      this.cdr.detectChanges();
      return;
    }

    const confirmar = confirm(`Deseja excluir o trabalho "${trabalho.titulo}"?`);
    if (!confirmar) {
      return;
    }

    if (!this.authService.getToken()) {
      this.errorMessage =
        'Token não encontrado. Faça logout, login como PROFESSOR e tente novamente.';
      this.cdr.detectChanges();
      return;
    }

    this.errorMessage = '';
    this.successMessage = '';
    this.loading = true;
    this.cdr.detectChanges();

    this.trabalhosService
      .excluir(trabalho.id)
      .pipe(
        finalize(() => {
          this.loading = false;
          this.cdr.detectChanges();
        }),
      )
      .subscribe({
        next: () => {
          this.successMessage = 'Trabalho excluído com sucesso!';
          this.carregar();
        },
        error: (err: HttpErrorResponse) => {
          this.errorMessage = mensagemErroHttp(err, {
            temToken: !!this.authService.getToken(),
            contexto: 'excluir',
            entidade: 'trabalho',
          });
        },
      });
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

  verEntregas(trabalho: TrabalhoListItem): void {
    if (trabalho.id == null || !this.disciplinaId) {
      this.errorMessage = 'Este trabalho não possui ID para consultar entregas.';
      this.cdr.detectChanges();
      return;
    }

    this.router.navigate(
      ['/professor/disciplinas', this.disciplinaId, 'trabalhos', trabalho.id, 'entregas'],
      { state: { trabalho, disciplina: this.disciplina } },
    );
  }
}
