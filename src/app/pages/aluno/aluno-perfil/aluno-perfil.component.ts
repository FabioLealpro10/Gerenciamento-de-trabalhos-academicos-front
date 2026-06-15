import { ChangeDetectorRef, Component, inject, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';
import { finalize, switchMap } from 'rxjs';
import { AuthService } from '../../../core/services/auth.service';
import { AlunosService } from '../../../core/services/alunos.service';
import { AlunoContextService } from '../../../core/services/aluno-context.service';
import { AlunoCreateRequest } from '../../../core/models/aluno.model';
import {
  montarPayloadEdicaoAluno,
  validarEdicaoAlunoPerfil,
} from '../../../core/utils/aluno-form.validation';
import { mensagemErroHttp } from '../../../core/utils/http-error.util';

@Component({
  selector: 'app-aluno-perfil',
  standalone: true,
  imports: [FormsModule, RouterLink],
  templateUrl: './aluno-perfil.component.html',
  styleUrl: './aluno-perfil.component.css',
})
export class AlunoPerfilComponent implements OnInit {
  private readonly alunosService = inject(AlunosService);
  private readonly alunoContext = inject(AlunoContextService);
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);
  private readonly cdr = inject(ChangeDetectorRef);

  alunoId: number | null = null;

  form: AlunoCreateRequest = {
    nome: '',
    email: '',
    password: '',
    role: 'ALUNO',
    turma: '',
  };

  loading = false;
  loadingDados = false;
  errorMessage = '';
  successMessage = '';

  ngOnInit(): void {
    if (this.authService.getTipoUsuario() !== 'ALUNO') {
      this.router.navigate(['/dashboard']);
      return;
    }

    this.carregarDados();
  }

  salvar(): void {
    this.errorMessage = '';
    this.successMessage = '';

    const validacao = validarEdicaoAlunoPerfil(this.form);
    if (validacao) {
      this.errorMessage = validacao;
      this.cdr.detectChanges();
      return;
    }

    if (this.alunoId == null) {
      this.errorMessage = 'ID do aluno não encontrado.';
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

    this.alunosService
      .atualizar(this.alunoId, montarPayloadEdicaoAluno(this.alunoId, this.form))
      .pipe(
        finalize(() => {
          this.loading = false;
          this.cdr.detectChanges();
        }),
      )
      .subscribe({
        next: () => {
          this.authService.atualizarDadosUsuario({
            nome: this.form.nome.trim(),
            email: this.form.email.trim(),
          });
          this.form.password = '';
          this.successMessage = 'Dados atualizados com sucesso!';
        },
        error: (err: HttpErrorResponse) => {
          this.errorMessage = mensagemErroHttp(err, {
            temToken: !!this.authService.getToken(),
            contexto: 'salvar',
            entidade: 'aluno',
            modoEdicao: true,
          });
        },
      });
  }

  private carregarDados(): void {
    if (!this.authService.getToken()) {
      this.errorMessage =
        'Token não encontrado. Faça logout, login como ALUNO e tente novamente.';
      this.cdr.detectChanges();
      return;
    }

    this.loadingDados = true;
    this.cdr.detectChanges();

    this.alunoContext
      .obterIdAluno()
      .pipe(
        switchMap((id) => {
          this.alunoId = id;
          return this.alunosService.buscarPorId(id);
        }),
        finalize(() => {
          this.loadingDados = false;
          this.cdr.detectChanges();
        }),
      )
      .subscribe({
        next: (aluno) => {
          this.form = {
            nome: aluno.nome,
            email: aluno.email,
            password: '',
            role: aluno.role ?? 'ALUNO',
            turma: aluno.turma ?? '',
          };
        },
        error: (err: unknown) => {
          if (err instanceof Error && !(err instanceof HttpErrorResponse)) {
            this.errorMessage = err.message;
            return;
          }

          this.errorMessage = mensagemErroHttp(err as HttpErrorResponse, {
            temToken: !!this.authService.getToken(),
            contexto: 'listar',
            entidade: 'aluno',
          });
        },
      });
  }
}
