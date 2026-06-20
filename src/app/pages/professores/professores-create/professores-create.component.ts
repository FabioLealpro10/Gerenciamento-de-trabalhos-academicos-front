import { ChangeDetectorRef, Component, inject, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';
import { finalize } from 'rxjs';
import { ProfessoresService } from '../../../core/services/professores.service';
import { AuthService } from '../../../core/services/auth.service';
import {
  ProfessorCreateRequest,
  ProfessorListItem,
} from '../../../core/models/professor.model';
import {
  validarCadastroProfessor,
  validarEdicaoProfessor,
  montarPayloadEdicaoProfessor,
} from '../../../core/utils/professor-form.validation';
import { mensagemErroHttp } from '../../../core/utils/http-error.util';
import { CampoSenhaComponent } from '../../../shared/campo-senha/campo-senha.component';

@Component({
  selector: 'app-professores-create',
  standalone: true,
  imports: [FormsModule, RouterLink, CampoSenhaComponent],
  templateUrl: './professores-create.component.html',
  styleUrl: './professores-create.component.css',
})
export class ProfessoresCreateComponent implements OnInit {
  private readonly professoresService = inject(ProfessoresService);
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly cdr = inject(ChangeDetectorRef);

  form: ProfessorCreateRequest = {
    nome: '',
    email: '',
    password: '',
    role: 'PROFESSOR',
    areaAtuacao: '',
  };

  modoEdicao = false;
  professorId: string | null = null;
  loading = false;
  errorMessage = '';
  successMessage = '';

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (!id) {
      return;
    }

    this.modoEdicao = true;
    this.professorId = id;

    const professor = history.state?.['professor'] as ProfessorListItem | undefined;
    if (professor) {
      this.preencherFormulario(professor);
      return;
    }

    this.carregarProfessorDaLista(id);
  }

  salvar(): void {
    this.errorMessage = '';
    this.successMessage = '';

    const validacao = this.modoEdicao
      ? validarEdicaoProfessor(this.form)
      : validarCadastroProfessor(this.form);

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
      ? this.professoresService.atualizar(
          this.professorId!,
          montarPayloadEdicaoProfessor(this.professorId!, this.form),
        )
      : this.professoresService.cadastrar(this.montarPayloadCadastro());

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
            this.router.navigate(['/professores'], { queryParams: { msg: 'edicao' } });
            return;
          }

          this.successMessage = 'Cadastro realizado com sucesso!';
          this.limparFormulario();
        },
        error: (err: HttpErrorResponse) => {
          this.errorMessage = mensagemErroHttp(err, {
            temToken: !!this.authService.getToken(),
            contexto: 'salvar',
            entidade: 'professor',
            modoEdicao: this.modoEdicao,
          });
        },
      });
  }

  private montarPayloadCadastro(): ProfessorCreateRequest {
    return {
      nome: this.form.nome.trim(),
      email: this.form.email.trim(),
      password: this.form.password.trim(),
      role: 'PROFESSOR',
      areaAtuacao: this.form.areaAtuacao.trim(),
    };
  }

  private limparFormulario(): void {
    this.form = {
      nome: '',
      email: '',
      password: '',
      role: 'PROFESSOR',
      areaAtuacao: '',
    };
  }

  private preencherFormulario(professor: ProfessorListItem): void {
    this.form = {
      nome: professor.nome,
      email: professor.email,
      password: '',
      role: professor.role ?? 'PROFESSOR',
      areaAtuacao: professor.areaAtuacao ?? '',
    };
  }

  private carregarProfessorDaLista(id: string): void {
    if (!this.authService.getToken()) {
      this.errorMessage =
        'Token não encontrado. Faça logout, login como ADMIN e tente novamente.';
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
          const professor = professores.find((item) => String(item.id) === id);
          if (!professor) {
            this.errorMessage = 'Professor não encontrado.';
            return;
          }
          this.preencherFormulario(professor);
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
}
