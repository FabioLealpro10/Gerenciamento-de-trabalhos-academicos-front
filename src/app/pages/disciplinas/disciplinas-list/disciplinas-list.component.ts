import { Component, ChangeDetectorRef, inject, OnInit } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';
import { Subject, debounceTime, distinctUntilChanged, finalize } from 'rxjs';
import { DisciplinasService } from '../../../core/services/disciplinas.service';
import { AuthService } from '../../../core/services/auth.service';
import { DisciplinaListItem } from '../../../core/models/disciplina.model';
import { PAGINA_INICIAL, PageQuery } from '../../../core/models/page.model';
import { mensagemErroHttp } from '../../../core/utils/http-error.util';
import { PaginacaoComponent } from '../../../shared/paginacao/paginacao.component';
import { DataBrPipe } from '../../../shared/pipes/data-br.pipe';

@Component({
  selector: 'app-disciplinas-list',
  standalone: true,
  imports: [RouterLink, FormsModule, PaginacaoComponent, DataBrPipe],
  templateUrl: './disciplinas-list.component.html',
  styleUrl: './disciplinas-list.component.css',
})
export class DisciplinasListComponent implements OnInit {
  private readonly disciplinasService = inject(DisciplinasService);
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly cdr = inject(ChangeDetectorRef);

  disciplinas: DisciplinaListItem[] = [];
  loading = false;
  errorMessage = '';
  successMessage = '';

  paginacao: PageQuery = { ...PAGINA_INICIAL };
  totalPages = 0;
  totalElements = 0;
  pesquisa = '';

  private readonly pesquisaDigitada$ = new Subject<string>();

  constructor() {
    // Pesquisa automática: dispara a cada caractere, com pequeno atraso
    this.pesquisaDigitada$
      .pipe(debounceTime(350), distinctUntilChanged(), takeUntilDestroyed())
      .subscribe(() => this.aplicarPesquisa());
  }

  aoDigitarPesquisa(valor: string): void {
    this.pesquisa = valor;
    this.pesquisaDigitada$.next(valor.trim());
  }

  aplicarPesquisa(): void {
    this.paginacao = { ...this.paginacao, page: 0 };
    this.carregar();
  }

  limparPesquisa(): void {
    this.pesquisa = '';
    this.aplicarPesquisa();
  }

  ngOnInit(): void {
    this.route.queryParamMap.subscribe((params) => {
      const msg = params.get('msg');
      if (msg === 'cadastro') {
        this.successMessage = 'Disciplina cadastrada com sucesso!';
      } else if (msg === 'edicao') {
        this.successMessage = 'Disciplina atualizada com sucesso!';
      } else if (msg === 'exclusao') {
        this.successMessage = 'Disciplina excluída com sucesso!';
      } else {
        this.successMessage = '';
      }
      this.cdr.detectChanges();
    });

    this.carregar();
  }

  carregar(): void {
    this.errorMessage = '';

    if (!this.authService.getToken()) {
      this.errorMessage =
        'Token não encontrado. Faça logout, login como ADMIN e acesse novamente.';
      this.cdr.detectChanges();
      return;
    }

    this.loading = true;
    this.cdr.detectChanges();

    const termo = this.pesquisa.trim();
    const fonte$ = termo
      ? this.disciplinasService.pesquisarPagina(termo, this.paginacao)
      : this.disciplinasService.listarPagina(this.paginacao);

    fonte$
      .pipe(
        finalize(() => {
          this.loading = false;
          this.cdr.detectChanges();
        }),
      )
      .subscribe({
        next: (pagina) => {
          this.disciplinas = pagina.itens;
          this.totalPages = pagina.totalPages;
          this.totalElements = pagina.totalElements;
        },
        error: (err: HttpErrorResponse) => {
          this.errorMessage = mensagemErroHttp(err, {
            temToken: !!this.authService.getToken(),
            contexto: 'listar',
            entidade: 'disciplinas',
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

  irParaCadastro(): void {
    this.router.navigate(['/disciplinas/novo']);
  }

  editar(disciplina: DisciplinaListItem): void {
    if (disciplina.id == null) {
      this.errorMessage = 'Esta disciplina não possui ID para edição.';
      this.cdr.detectChanges();
      return;
    }

    this.router.navigate(['/disciplinas', disciplina.id, 'editar'], {
      state: { disciplina },
    });
  }

  matricular(disciplina: DisciplinaListItem): void {
    if (disciplina.id == null) {
      this.errorMessage = 'Esta disciplina não possui ID para matrícula.';
      this.cdr.detectChanges();
      return;
    }

    this.router.navigate(['/disciplinas', disciplina.id, 'matricular'], {
      state: { disciplina },
    });
  }

  verAlunosMatriculados(disciplina: DisciplinaListItem): void {
    if (disciplina.id == null) {
      this.errorMessage = 'Esta disciplina não possui ID.';
      this.cdr.detectChanges();
      return;
    }

    this.router.navigate(['/disciplinas', disciplina.id, 'alunos'], {
      state: { disciplina },
    });
  }

  excluir(disciplina: DisciplinaListItem): void {
    if (disciplina.id == null) {
      this.errorMessage = 'Esta disciplina não possui ID para exclusão.';
      this.cdr.detectChanges();
      return;
    }

    const confirmar = confirm(`Deseja excluir a disciplina "${disciplina.nome}"?`);
    if (!confirmar) {
      return;
    }

    if (!this.authService.getToken()) {
      this.errorMessage =
        'Token não encontrado. Faça logout, login como ADMIN e tente novamente.';
      this.cdr.detectChanges();
      return;
    }

    this.errorMessage = '';
    this.successMessage = '';
    this.loading = true;
    this.cdr.detectChanges();

    this.disciplinasService
      .excluir(disciplina.id)
      .pipe(
        finalize(() => {
          this.loading = false;
          this.cdr.detectChanges();
        }),
      )
      .subscribe({
        next: () => {
          this.successMessage = 'Disciplina excluída com sucesso!';
          this.carregar();
        },
        error: (err: HttpErrorResponse) => {
          this.errorMessage = mensagemErroHttp(err, {
            temToken: !!this.authService.getToken(),
            contexto: 'excluir',
            entidade: 'disciplina',
          });
        },
      });
  }

  formatarAlunos(alunos?: string[]): string {
    if (!alunos?.length) {
      return '-';
    }
    return alunos.join(', ');
  }
}
