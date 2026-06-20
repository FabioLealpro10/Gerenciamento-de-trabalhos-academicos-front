import { ChangeDetectorRef, Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { finalize } from 'rxjs';
import { AuthService } from '../../core/services/auth.service';
import { CampoSenhaComponent } from '../../shared/campo-senha/campo-senha.component';

type ModoLogin = 'login' | 'esqueci-email' | 'esqueci-codigo';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [FormsModule, CampoSenhaComponent],
  templateUrl: './login.component.html',
  styleUrl: './login.component.css',
})
export class LoginComponent {
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);
  private readonly cdr = inject(ChangeDetectorRef);

  modo: ModoLogin = 'login';

  email = '';
  password = '';
  codigo = '';

  errorMessage = '';
  infoMessage = '';
  loading = false;

  get titulo(): string {
    if (this.modo === 'esqueci-email') {
      return 'Esqueci a senha';
    }

    if (this.modo === 'esqueci-codigo') {
      return 'Verificar código';
    }

    return 'Login';
  }

  login(): void {
    this.errorMessage = '';
    this.infoMessage = '';
    this.loading = true;
    this.atualizarTela();

    this.authService
      .login(this.email, this.password)
      .pipe(
        finalize(() => {
          this.loading = false;
          this.atualizarTela();
        }),
      )
      .subscribe((resultado) => {
        if (resultado.ok) {
          this.router.navigate(['/dashboard']);
          return;
        }

        this.errorMessage = resultado.message;
        this.atualizarTela();
      });
  }

  solicitarCodigo(): void {
    this.errorMessage = '';
    this.infoMessage = '';

    if (!this.email.trim()) {
      this.errorMessage = 'Informe o e-mail cadastrado.';
      this.atualizarTela();
      return;
    }

    this.loading = true;
    this.atualizarTela();

    this.authService
      .esqueciSenha(this.email)
      .pipe(
        finalize(() => {
          this.loading = false;
          this.atualizarTela();
        }),
      )
      .subscribe((resultado) => {
        if (!resultado.ok) {
          this.errorMessage = resultado.message;
          this.atualizarTela();
          return;
        }

        this.infoMessage = resultado.data.mensagem;

        if (resultado.data.emailCadastrado) {
          this.codigo = '';
          this.modo = 'esqueci-codigo';
        } else {
          this.errorMessage = resultado.data.mensagem || 'E-mail não cadastrado.';
          this.infoMessage = '';
        }

        this.atualizarTela();
      });
  }

  verificarCodigo(): void {
    this.errorMessage = '';
    this.infoMessage = '';

    if (!this.email.trim()) {
      this.errorMessage = 'Informe o e-mail cadastrado.';
      this.atualizarTela();
      return;
    }

    if (!this.codigo.trim()) {
      this.errorMessage = 'Informe o código recebido.';
      this.atualizarTela();
      return;
    }

    this.loading = true;
    this.atualizarTela();

    this.authService
      .verificarCodigo(this.email, this.codigo)
      .pipe(
        finalize(() => {
          this.loading = false;
          this.atualizarTela();
        }),
      )
      .subscribe((resultado) => {
        if (resultado.ok) {
          this.router.navigate(['/dashboard']);
          return;
        }

        this.errorMessage = resultado.message;
        this.atualizarTela();
      });
  }

  abrirEsqueciSenha(): void {
    this.modo = 'esqueci-email';
    this.password = '';
    this.codigo = '';
    this.errorMessage = '';
    this.infoMessage = '';
    this.atualizarTela();
  }

  voltarParaLogin(): void {
    this.modo = 'login';
    this.codigo = '';
    this.errorMessage = '';
    this.infoMessage = '';
    this.atualizarTela();
  }

  voltarParaEmail(): void {
    this.modo = 'esqueci-email';
    this.codigo = '';
    this.errorMessage = '';
    this.infoMessage = '';
    this.atualizarTela();
  }

  private atualizarTela(): void {
    this.cdr.detectChanges();
  }
}
