import { Component, ChangeDetectorRef, inject, OnInit } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';
import { finalize } from 'rxjs';
import { TrabalhosService } from '../../../core/services/trabalhos.service';
import { AuthService } from '../../../core/services/auth.service';
import { TrabalhoListItem } from '../../../core/models/trabalho.model';
import { mensagemErroHttp } from '../../../core/utils/http-error.util';

@Component({
  selector: 'app-trabalhos-list',
  standalone: true,
  imports: [RouterLink],
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

    this.trabalhosService
      .listar()
      .pipe(
        finalize(() => {
          this.loading = false;
          this.cdr.detectChanges();
        }),
      )
      .subscribe({
        next: (trabalhos) => {
          this.trabalhos = trabalhos ?? [];
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
