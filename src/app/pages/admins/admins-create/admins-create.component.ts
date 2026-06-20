import { ChangeDetectorRef, Component, inject, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';
import { finalize } from 'rxjs';
import { AdminsService } from '../../../core/services/admins.service';
import { AuthService } from '../../../core/services/auth.service';
import { AdminCreateRequest } from '../../../core/models/admin.model';
import { validarCadastroAdmin } from '../../../core/utils/admin-form.validation';
import { mensagemErroHttp } from '../../../core/utils/http-error.util';
import { CampoSenhaComponent } from '../../../shared/campo-senha/campo-senha.component';

@Component({
  selector: 'app-admins-create',
  standalone: true,
  imports: [FormsModule, RouterLink, CampoSenhaComponent],
  templateUrl: './admins-create.component.html',
  styleUrl: './admins-create.component.css',
})
export class AdminsCreateComponent implements OnInit {
  private readonly adminsService = inject(AdminsService);
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);
  private readonly cdr = inject(ChangeDetectorRef);

  form: AdminCreateRequest = {
    nome: '',
    email: '',
    password: '',
  };

  loading = false;
  errorMessage = '';
  successMessage = '';

  ngOnInit(): void {
    if (!this.authService.isAdminMaster()) {
      this.router.navigate(['/dashboard']);
    }
  }

  salvar(): void {
    this.errorMessage = '';
    this.successMessage = '';

    const validacao = validarCadastroAdmin(this.form);
    if (validacao) {
      this.errorMessage = validacao;
      this.cdr.detectChanges();
      return;
    }

    if (!this.authService.getToken()) {
      this.errorMessage = 'Sessão expirada. Faça login novamente.';
      this.cdr.detectChanges();
      return;
    }

    this.loading = true;
    this.cdr.detectChanges();

    this.adminsService
      .cadastrar({
        nome: this.form.nome.trim(),
        email: this.form.email.trim(),
        password: this.form.password.trim(),
      })
      .pipe(
        finalize(() => {
          this.loading = false;
          this.cdr.detectChanges();
        }),
      )
      .subscribe({
        next: () => {
          this.successMessage = 'Cadastro realizado com sucesso!';
          this.form = {
            nome: '',
            email: '',
            password: '',
          };
        },
        error: (err: HttpErrorResponse) => {
          this.errorMessage = mensagemErroHttp(err, {
            temToken: !!this.authService.getToken(),
            contexto: 'salvar',
            entidade: 'administrador',
            modoEdicao: false,
          });
        },
      });
  }
}
