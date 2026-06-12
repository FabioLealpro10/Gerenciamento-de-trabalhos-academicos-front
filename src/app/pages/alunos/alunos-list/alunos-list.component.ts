import { Component, ChangeDetectorRef, inject, OnInit } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';
import { Subject, debounceTime, distinctUntilChanged, finalize } from 'rxjs';
import { AlunosService } from '../../../core/services/alunos.service';
import { AuthService } from '../../../core/services/auth.service';
import { UsuarioListItem } from '../../../core/models/aluno.model';
import { PAGINA_INICIAL, PageQuery } from '../../../core/models/page.model';
import { mensagemErroHttp } from '../../../core/utils/http-error.util';
import { PaginacaoComponent } from '../../../shared/paginacao/paginacao.component';

@Component({
  selector: 'app-alunos-list',
  standalone: true,
  imports: [RouterLink, FormsModule, PaginacaoComponent],
  templateUrl: './alunos-list.component.html',
  styleUrl: './alunos-list.component.css',
})
export class AlunosListComponent implements OnInit {
  private readonly alunosService = inject(AlunosService);
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly cdr = inject(ChangeDetectorRef);

  alunos: UsuarioListItem[] = [];
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

  ngOnInit(): void {
    this.route.queryParamMap.subscribe((params) => {
      const msg = params.get('msg');
      if (msg === 'cadastro') {
        this.successMessage = 'Cadastro realizado com sucesso!';
      } else if (msg === 'edicao') {
        this.successMessage = 'Aluno atualizado com sucesso!';
      } else if (msg === 'exclusao') {
        this.successMessage = 'Aluno excluído com sucesso!';
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
      ? this.alunosService.pesquisarPagina(termo, this.paginacao)
      : this.alunosService.listarPagina(this.paginacao);

    fonte$
      .pipe(
        finalize(() => {
          this.loading = false;
          this.cdr.detectChanges();
        }),
      )
      .subscribe({
        next: (pagina) => {
          this.alunos = pagina.itens;
          this.totalPages = pagina.totalPages;
          this.totalElements = pagina.totalElements;
        },
        error: (err: HttpErrorResponse) => {
          this.errorMessage = mensagemErroHttp(err, {
            temToken: !!this.authService.getToken(),
            contexto: 'listar',
            entidade: 'alunos',
          });
        },
      });
  }

  aplicarPesquisa(): void {
    this.paginacao = { ...this.paginacao, page: 0 };
    this.carregar();
  }

  limparPesquisa(): void {
    this.pesquisa = '';
    this.aplicarPesquisa();
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
    this.router.navigate(['/alunos/novo']);
  }

  editar(aluno: UsuarioListItem): void {
    if (aluno.id == null) {
      this.errorMessage = 'Este aluno não possui ID para edição.';
      this.cdr.detectChanges();
      return;
    }

    this.router.navigate(['/alunos', aluno.id, 'editar'], {
      state: { aluno },
    });
  }

  excluir(aluno: UsuarioListItem): void {
    if (aluno.id == null) {
      this.errorMessage = 'Este aluno não possui ID para exclusão.';
      this.cdr.detectChanges();
      return;
    }

    const confirmar = confirm(`Deseja excluir o aluno "${aluno.nome}"?`);
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

    this.alunosService
      .excluir(aluno.id)
      .pipe(
        finalize(() => {
          this.loading = false;
          this.cdr.detectChanges();
        }),
      )
      .subscribe({
        next: () => {
          this.successMessage = 'Aluno excluído com sucesso!';
          this.carregar();
        },
        error: (err: HttpErrorResponse) => {
          this.errorMessage = mensagemErroHttp(err, {
            temToken: !!this.authService.getToken(),
            contexto: 'excluir',
            entidade: 'aluno',
          });
        },
      });
  }
}
