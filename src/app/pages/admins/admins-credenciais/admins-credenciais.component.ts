import { ChangeDetectorRef, Component, inject, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';
import { finalize } from 'rxjs';
import { AdminsService } from '../../../core/services/admins.service';
import { AuthService } from '../../../core/services/auth.service';
import { AdminListItem } from '../../../core/models/admin.model';
import {
  AdminCredenciaisFields,
  montarPayloadCredenciaisAdmin,
  validarCredenciaisAdmin,
} from '../../../core/utils/admin-form.validation';
import { mensagemErroHttp } from '../../../core/utils/http-error.util';

@Component({
  selector: 'app-admins-credenciais',
  standalone: true,
  imports: [FormsModule, RouterLink],
  templateUrl: './admins-credenciais.component.html',
  styleUrl: './admins-credenciais.component.css',
})
export class AdminsCredenciaisComponent implements OnInit {
  private readonly adminsService = inject(AdminsService);
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly cdr = inject(ChangeDetectorRef);

  adminId: string | null = null;
  adminNome = '';

  form: AdminCredenciaisFields = {
    email: '',
    password: '',
  };

  loading = false;
  errorMessage = '';

  ngOnInit(): void {
    if (!this.authService.isAdminMaster()) {
      this.router.navigate(['/dashboard']);
      return;
    }

    const id = this.route.snapshot.paramMap.get('id');
    if (!id) {
      this.router.navigate(['/admins']);
      return;
    }

    this.adminId = id;

    const admin = history.state?.['admin'] as AdminListItem | undefined;
    if (admin) {
      this.preencherFormulario(admin);
      return;
    }

    this.carregarAdminDaLista(id);
  }

  salvar(): void {
    this.errorMessage = '';

    const validacao = validarCredenciaisAdmin(this.form);
    if (validacao) {
      this.errorMessage = validacao;
      this.cdr.detectChanges();
      return;
    }

    if (!this.adminId || !this.authService.getToken()) {
      this.errorMessage = 'Sessão expirada ou administrador inválido.';
      this.cdr.detectChanges();
      return;
    }

    this.loading = true;
    this.cdr.detectChanges();

    this.adminsService
      .atualizarCredenciais(
        this.adminId,
        montarPayloadCredenciaisAdmin(this.form),
      )
      .pipe(
        finalize(() => {
          this.loading = false;
          this.cdr.detectChanges();
        }),
      )
      .subscribe({
        next: () => {
          this.router.navigate(['/admins'], { queryParams: { msg: 'edicao' } });
        },
        error: (err: HttpErrorResponse) => {
          this.errorMessage = mensagemErroHttp(err, {
            temToken: !!this.authService.getToken(),
            contexto: 'salvar',
            entidade: 'administrador',
            modoEdicao: true,
          });
        },
      });
  }

  private preencherFormulario(admin: AdminListItem): void {
    this.adminNome = admin.nome;
    this.form = {
      email: admin.email,
      password: '',
    };
  }

  private carregarAdminDaLista(id: string): void {
    this.loading = true;
    this.cdr.detectChanges();

    this.adminsService
      .listarPagina({ page: 0, size: 100 })
      .pipe(
        finalize(() => {
          this.loading = false;
          this.cdr.detectChanges();
        }),
      )
      .subscribe({
        next: (pagina) => {
          const admin = pagina.itens.find((item) => String(item.id) === id);
          if (!admin) {
            this.errorMessage = 'Administrador não encontrado.';
            return;
          }
          this.preencherFormulario(admin);
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
}
