import { ChangeDetectorRef, Component, inject, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';
import { finalize } from 'rxjs';
import { AlunosService } from '../../../core/services/alunos.service';
import { AuthService } from '../../../core/services/auth.service';
import { AlunoCreateRequest, UsuarioListItem } from '../../../core/models/aluno.model';
import {
  validarCadastroAluno,
  validarEdicaoAluno,
  montarPayloadEdicaoAluno,
} from '../../../core/utils/aluno-form.validation';
import { mensagemErroHttp } from '../../../core/utils/http-error.util';
import { CampoSenhaComponent } from '../../../shared/campo-senha/campo-senha.component';

@Component({
  selector: 'app-alunos-create',
  standalone: true,
  imports: [FormsModule, RouterLink, CampoSenhaComponent],
  templateUrl: './alunos-create.component.html',
  styleUrl: './alunos-create.component.css',
})
export class AlunosCreateComponent implements OnInit {
  private readonly alunosService = inject(AlunosService);
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly cdr = inject(ChangeDetectorRef);

  form: AlunoCreateRequest = {
    nome: '',
    email: '',
    password: '',
    role: 'ALUNO',
    turma: '',
  };

  modoEdicao = false;
  alunoId: string | null = null;
  loading = false;
  errorMessage = '';
  successMessage = '';

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (!id) {
      return;
    }

    this.modoEdicao = true;
    this.alunoId = id;

    const aluno = history.state?.['aluno'] as UsuarioListItem | undefined;
    if (aluno) {
      this.preencherFormulario(aluno);
      return;
    }

    this.carregarAlunoDaLista(id);
  }

  salvar(): void {
    this.errorMessage = '';
    this.successMessage = '';

    const validacao = this.modoEdicao
      ? validarEdicaoAluno(this.form)
      : validarCadastroAluno(this.form);

    if (validacao) {
      this.errorMessage = validacao;
      this.cdr.detectChanges();
      return;
    }

    if (!this.authService.getToken()) {
      this.errorMessage = 'Sessão expirada. Faça login novamente para continuar.';
      this.cdr.detectChanges();
      return;
    }

    this.loading = true;
    this.cdr.detectChanges();

    const request$ = this.modoEdicao
      ? this.alunosService.atualizar(
          this.alunoId!,
          montarPayloadEdicaoAluno(this.alunoId!, this.form),
        )
      : this.alunosService.cadastrar(this.montarPayloadCadastro());

    request$
      .pipe(
        finalize(() => {
          this.loading = false;
          this.cdr.detectChanges();
        }),
      )
      .subscribe({
        next: () => {
          if (this.modoEdicao) {
            this.router.navigate(['/alunos'], { queryParams: { msg: 'edicao' } });
            return;
          }

          this.successMessage = 'Cadastro realizado com sucesso!';
          this.limparFormulario();
        },
        error: (err: HttpErrorResponse) => {
          this.errorMessage = mensagemErroHttp(err, {
            temToken: !!this.authService.getToken(),
            contexto: 'salvar',
            entidade: 'aluno',
            modoEdicao: this.modoEdicao,
          });
        },
      });
  }

  private montarPayloadCadastro(): AlunoCreateRequest {
    return {
      nome: this.form.nome.trim(),
      email: this.form.email.trim(),
      password: this.form.password.trim(),
      role: 'ALUNO',
      turma: this.form.turma.trim(),
    };
  }

  private limparFormulario(): void {
    this.form = {
      nome: '',
      email: '',
      password: '',
      role: 'ALUNO',
      turma: '',
    };
  }

  private preencherFormulario(aluno: UsuarioListItem): void {
    this.form = {
      nome: aluno.nome,
      email: aluno.email,
      password: '',
      role: aluno.role ?? 'ALUNO',
      turma: aluno.turma ?? '',
    };
  }

  private carregarAlunoDaLista(id: string): void {
    if (!this.authService.getToken()) {
      this.errorMessage =
        'Token não encontrado. Faça logout, login como ADMIN e tente novamente.';
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
          const aluno = alunos.find((item) => String(item.id) === id);
          if (!aluno) {
            this.errorMessage = 'Aluno não encontrado.';
            return;
          }
          this.preencherFormulario(aluno);
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
}
