import { Component, ChangeDetectorRef, inject, OnInit } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';
import { finalize } from 'rxjs';
import { ProfessoresService } from '../../../core/services/professores.service';
import { AuthService } from '../../../core/services/auth.service';
import { ProfessorListItem } from '../../../core/models/professor.model';
import { mensagemErroHttp } from '../../../core/utils/http-error.util';

@Component({
  selector: 'app-professores-list',
  standalone: true,
  imports: [RouterLink],
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

    this.professoresService
      .listar()
      .pipe(
        finalize(() => {
          this.loading = false;
          this.cdr.detectChanges();
        }),
      )
      .subscribe({
        next: (professores) => {
          this.professores = professores ?? [];
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

    const confirmar = confirm(`Deseja excluir o professor "${professor.nome}"?`);
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

    this.professoresService
      .excluir(professor.id)
      .pipe(
        finalize(() => {
          this.loading = false;
          this.cdr.detectChanges();
        }),
      )
      .subscribe({
        next: () => {
          this.successMessage = 'Professor excluído com sucesso!';
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
