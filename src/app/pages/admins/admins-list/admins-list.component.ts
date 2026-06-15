import { ChangeDetectorRef, Component, inject, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';
import { finalize } from 'rxjs';
import { ADMIN_MASTER_ID } from '../../../core/services/auth.service';
import { AdminsService } from '../../../core/services/admins.service';
import { AuthService } from '../../../core/services/auth.service';
import { AdminListItem } from '../../../core/models/admin.model';
import { PAGINA_INICIAL, PageQuery } from '../../../core/models/page.model';
import { mensagemErroHttp } from '../../../core/utils/http-error.util';
import { PaginacaoComponent } from '../../../shared/paginacao/paginacao.component';

@Component({
  selector: 'app-admins-list',
  standalone: true,
  imports: [RouterLink, FormsModule, PaginacaoComponent],
  templateUrl: './admins-list.component.html',
  styleUrl: './admins-list.component.css',
})
export class AdminsListComponent implements OnInit {
  private readonly adminsService = inject(AdminsService);
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly cdr = inject(ChangeDetectorRef);

  admins: AdminListItem[] = [];
  loading = false;
  errorMessage = '';
  successMessage = '';

  paginacao: PageQuery = { ...PAGINA_INICIAL };
  totalPages = 0;
  totalElements = 0;

  ngOnInit(): void {
    if (!this.authService.isAdminMaster()) {
      this.router.navigate(['/dashboard']);
      return;
    }

    this.route.queryParamMap.subscribe((params) => {
      const msg = params.get('msg');
      if (msg === 'cadastro') {
        this.successMessage = 'Administrador cadastrado com sucesso!';
      } else if (msg === 'edicao') {
        this.successMessage = 'Credenciais atualizadas com sucesso!';
      } else if (msg === 'exclusao') {
        this.successMessage = 'Administrador excluído com sucesso!';
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
        'Token não encontrado. Faça logout, login como ADMIN principal e tente novamente.';
      this.cdr.detectChanges();
      return;
    }

    this.loading = true;
    this.cdr.detectChanges();

    this.adminsService
      .listarPagina(this.paginacao)
      .pipe(
        finalize(() => {
          this.loading = false;
          this.cdr.detectChanges();
        }),
      )
      .subscribe({
        next: (pagina) => {
          this.admins = pagina.itens;
          this.totalPages = pagina.totalPages;
          this.totalElements = pagina.totalElements;
        },
        error: (err: HttpErrorResponse) => {
          this.errorMessage = mensagemErroHttp(err, {
            temToken: !!this.authService.getToken(),
            contexto: 'listar',
            entidade: 'administradores',
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
    this.router.navigate(['/admins/novo']);
  }

  editarCredenciais(admin: AdminListItem): void {
    if (admin.id == null) {
      this.errorMessage = 'Este administrador não possui ID para edição.';
      this.cdr.detectChanges();
      return;
    }

    this.router.navigate(['/admins', admin.id, 'credenciais'], {
      state: { admin },
    });
  }

  podeExcluir(admin: AdminListItem): boolean {
    return admin.id != null && Number(admin.id) !== ADMIN_MASTER_ID;
  }

  excluir(admin: AdminListItem): void {
    if (admin.id == null) {
      this.errorMessage = 'Este administrador não possui ID para exclusão.';
      this.cdr.detectChanges();
      return;
    }

    if (Number(admin.id) === ADMIN_MASTER_ID) {
      this.errorMessage = 'O administrador principal não pode ser excluído.';
      this.cdr.detectChanges();
      return;
    }

    const confirmar = confirm(
      `Deseja excluir o administrador "${admin.nome}"?`,
    );
    if (!confirmar) {
      return;
    }

    this.errorMessage = '';
    this.successMessage = '';
    this.loading = true;
    this.cdr.detectChanges();

    this.adminsService
      .excluir(admin.id)
      .pipe(
        finalize(() => {
          this.loading = false;
          this.cdr.detectChanges();
        }),
      )
      .subscribe({
        next: () => {
          this.successMessage = 'Administrador excluído com sucesso!';
          this.carregar();
        },
        error: (err: HttpErrorResponse) => {
          this.errorMessage = mensagemErroHttp(err, {
            temToken: !!this.authService.getToken(),
            contexto: 'excluir',
            entidade: 'administrador',
          });
        },
      });
  }
}
