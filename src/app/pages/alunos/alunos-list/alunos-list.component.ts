import { Component, ChangeDetectorRef, inject, OnInit } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';
import { finalize } from 'rxjs';
import { AlunosService } from '../../../core/services/alunos.service';
import { AuthService } from '../../../core/services/auth.service';
import { UsuarioListItem } from '../../../core/models/aluno.model';
import { mensagemErroHttp } from '../../../core/utils/http-error.util';

@Component({
  selector: 'app-alunos-list',
  standalone: true,
  imports: [RouterLink],
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

    this.alunosService
      .listar()
      .pipe(
        finalize(() => {
          this.loading = false;
          this.cdr.detectChanges();
        }),
      )
      .subscribe({
        next: (alunos) => {
          this.alunos = alunos ?? [];
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
