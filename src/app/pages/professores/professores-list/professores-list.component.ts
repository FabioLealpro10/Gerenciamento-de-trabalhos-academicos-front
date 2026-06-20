import { Component, ChangeDetectorRef, inject, OnInit } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';
import { Subject, debounceTime, distinctUntilChanged, finalize } from 'rxjs';
import { ProfessoresService } from '../../../core/services/professores.service';
import { AuthService } from '../../../core/services/auth.service';
import { ProfessorListItem } from '../../../core/models/professor.model';
import { PAGINA_INICIAL, PageQuery } from '../../../core/models/page.model';
import { mensagemErroHttp, mensagemRespostaApi } from '../../../core/utils/http-error.util';
import { PaginacaoComponent } from '../../../shared/paginacao/paginacao.component';
import { ConfirmacaoExclusaoComponent } from '../../../shared/confirmacao-exclusao/confirmacao-exclusao.component';

@Component({
  selector: 'app-professores-list',
  standalone: true,
  imports: [RouterLink, FormsModule, PaginacaoComponent, ConfirmacaoExclusaoComponent],
  templateUrl: './professores-list.component.html',
  styleUrl: './professores-list.component.css',
})
export class ProfessoresListComponent implements OnInit {
  private readonly professoresService = inject(ProfessoresService);
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly cdr = inject(ChangeDetectorRef);

  professores: ProfessorListItem[] = [];
  loading = false;
  errorMessage = '';
  successMessage = '';

  paginacao: PageQuery = { ...PAGINA_INICIAL };
  totalPages = 0;
  totalElements = 0;
  pesquisa = '';
  confirmacaoAberta = false;
  confirmacaoDetalhe = '';
  private professorPendenteExclusao: ProfessorListItem | null = null;

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
        this.successMessage = 'Cadastro realizado com sucesso!';
      } else if (msg === 'edicao') {
        this.successMessage = 'Professor atualizado com sucesso!';
      } else if (msg === 'exclusao') {
        this.successMessage = 'Professor excluído com sucesso!';
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
      ? this.professoresService.pesquisarPagina(termo, this.paginacao)
      : this.professoresService.listarPagina(this.paginacao);

    fonte$
      .pipe(
        finalize(() => {
          this.loading = false;
          this.cdr.detectChanges();
        }),
      )
      .subscribe({
        next: (pagina) => {
          this.professores = pagina.itens;
          this.totalPages = pagina.totalPages;
          this.totalElements = pagina.totalElements;
        },
        error: (err: HttpErrorResponse) => {
          this.errorMessage = mensagemErroHttp(err, {
            temToken: !!this.authService.getToken(),
            contexto: 'listar',
            entidade: 'professores',
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
    this.router.navigate(['/professores/novo']);
  }

  editar(professor: ProfessorListItem): void {
    if (professor.id == null) {
      this.errorMessage = 'Este professor não possui ID para edição.';
      this.cdr.detectChanges();
      return;
    }

    this.router.navigate(['/professores', professor.id, 'editar'], {
      state: { professor },
    });
  }

  excluir(professor: ProfessorListItem): void {
    if (professor.id == null) {
      this.errorMessage = 'Este professor não possui ID para exclusão.';
      this.cdr.detectChanges();
      return;
    }

    this.professorPendenteExclusao = professor;
    this.confirmacaoDetalhe = `Professor: ${professor.nome}`;
    this.confirmacaoAberta = true;
    this.cdr.detectChanges();
  }

  cancelarExclusao(): void {
    this.confirmacaoAberta = false;
    this.professorPendenteExclusao = null;
    this.confirmacaoDetalhe = '';
    this.cdr.detectChanges();
  }

  confirmarExclusao(): void {
    const professor = this.professorPendenteExclusao;
    this.cancelarExclusao();

    if (!professor?.id) {
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

    this.professoresService
      .excluir(professor.id)
      .pipe(
        finalize(() => {
          this.loading = false;
          this.cdr.detectChanges();
        }),
      )
      .subscribe({
        next: (resposta) => {
          this.successMessage = mensagemRespostaApi(
            resposta,
            'Professor excluído com sucesso!',
          );
          this.carregar();
        },
        error: (err: HttpErrorResponse) => {
          this.errorMessage = mensagemErroHttp(err, {
            temToken: !!this.authService.getToken(),
            contexto: 'excluir',
            entidade: 'professor',
          });
        },
      });
  }
}
