import { ChangeDetectorRef, Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { finalize } from 'rxjs';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './login.component.html',
  styleUrl: './login.component.css',
})
export class LoginComponent {
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);
  private readonly cdr = inject(ChangeDetectorRef);

  email = '';
  password = '';
  errorMessage = '';
  loading = false;

  login() {
    this.errorMessage = '';
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

  private atualizarTela(): void {
    this.cdr.detectChanges();
  }
}
