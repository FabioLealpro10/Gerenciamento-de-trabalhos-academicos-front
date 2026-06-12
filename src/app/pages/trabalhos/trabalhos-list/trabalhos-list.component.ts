import { Component, ChangeDetectorRef, inject, OnInit } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';
import { Subject, debounceTime, distinctUntilChanged, finalize } from 'rxjs';
import { TrabalhosService } from '../../../core/services/trabalhos.service';
import { AuthService } from '../../../core/services/auth.service';
import { TrabalhoListItem } from '../../../core/models/trabalho.model';
import { PAGINA_INICIAL, PageQuery } from '../../../core/models/page.model';
import { mensagemErroHttp } from '../../../core/utils/http-error.util';
import { PaginacaoComponent } from '../../../shared/paginacao/paginacao.component';
import { DataBrPipe } from '../../../shared/pipes/data-br.pipe';

@Component({
  selector: 'app-trabalhos-list',
  standalone: true,
  imports: [RouterLink, FormsModule, PaginacaoComponent, DataBrPipe],
  templateUrl: './trabalhos-list.component.html',
  styleUrl: './trabalhos-list.component.css',
})
export class TrabalhosListComponent implements OnInit {
  private readonly trabalhosService = inject(TrabalhosService);
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly cdr = inject(ChangeDetectorRef);

  trabalhos: TrabalhoListItem[] = [];
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
    if (!this.authService.isAuthenticated()) {
      void this.router.navigate(['/login']);
      return;
    }

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
      ? this.trabalhosService.pesquisarPagina(termo, this.paginacao)
      : this.trabalhosService.listarPagina(this.paginacao);

    fonte$
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

  irParaCadastro(): void {
    this.router.navigate(['/trabalhos/novo']);
  }

  editar(trabalho: TrabalhoListItem): void {
    if (trabalho.id == null) {
      this.errorMessage = 'Este trabalho não possui ID para edição.';
      this.cdr.detectChanges();
      return;
    }

    this.router.navigate(['/trabalhos', trabalho.id, 'editar'], {
      state: { trabalho },
    });
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
        'Token não encontrado. Faça logout, login como ADMIN e tente novamente.';
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
    if (!this.authService.getToken()) {
      this.errorMessage =
        'Token não encontrado. Faça logout, login como ADMIN e acesse novamente.';
      this.cdr.detectChanges();
      return;
    }

    if (trabalho.id == null) {
      this.errorMessage = 'Este trabalho não possui ID para consultar entregas.';
      this.cdr.detectChanges();
      return;
    }

    this.router.navigate(['/trabalhos', trabalho.id, 'entregas'], {
      state: { trabalho },
    });
  }
}
