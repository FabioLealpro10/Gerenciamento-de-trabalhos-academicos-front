import { ChangeDetectorRef, Component, inject, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';
import { finalize } from 'rxjs';
import { AdminsService } from '../../../core/services/admins.service';
import { AuthService } from '../../../core/services/auth.service';
import {
  AdminCredenciaisFields,
  montarPayloadCredenciaisAdmin,
  validarCredenciaisAdmin,
} from '../../../core/utils/admin-form.validation';
import { mensagemErroHttp } from '../../../core/utils/http-error.util';

@Component({
  selector: 'app-admin-perfil',
  standalone: true,
  imports: [FormsModule, RouterLink],
  templateUrl: './admin-perfil.component.html',
  styleUrl: './admin-perfil.component.css',
})
export class AdminPerfilComponent implements OnInit {
  private readonly adminsService = inject(AdminsService);
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);
  private readonly cdr = inject(ChangeDetectorRef);

  adminId: number | string | null = null;
  nome = '';

  form: AdminCredenciaisFields = {
    email: '',
    password: '',
  };

  loading = false;
  errorMessage = '';
  successMessage = '';

  ngOnInit(): void {
    if (this.authService.getTipoUsuario() !== 'ADMIN') {
      this.router.navigate(['/dashboard']);
      return;
    }

    const usuario = this.authService.getUsuario();
    this.adminId = this.authService.getUsuarioId();
    this.nome = usuario?.nome ?? '';
    this.form.email = usuario?.email ?? '';

    if (this.adminId == null) {
      this.errorMessage =
        'ID do administrador não encontrado na sessão. Faça logout e login novamente.';
    }
  }

  salvar(): void {
    this.errorMessage = '';
    this.successMessage = '';

    const validacao = validarCredenciaisAdmin(this.form);
    if (validacao) {
      this.errorMessage = validacao;
      this.cdr.detectChanges();
      return;
    }

    if (this.adminId == null || !this.authService.getToken()) {
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
          this.authService.atualizarDadosUsuario({
            email: this.form.email.trim(),
          });
          this.form.password = '';
          this.successMessage = 'Dados atualizados com sucesso!';
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
}
