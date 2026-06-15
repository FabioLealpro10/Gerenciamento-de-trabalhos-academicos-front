import { ChangeDetectorRef, Component, inject, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';
import { finalize, switchMap } from 'rxjs';
import { AuthService } from '../../../core/services/auth.service';
import { ProfessoresService } from '../../../core/services/professores.service';
import { ProfessorContextService } from '../../../core/services/professor-context.service';
import { ProfessorCreateRequest } from '../../../core/models/professor.model';
import {
  montarPayloadEdicaoProfessor,
  validarEdicaoProfessor,
} from '../../../core/utils/professor-form.validation';
import { mensagemErroHttp } from '../../../core/utils/http-error.util';

@Component({
  selector: 'app-professor-perfil',
  standalone: true,
  imports: [FormsModule, RouterLink],
  templateUrl: './professor-perfil.component.html',
  styleUrl: './professor-perfil.component.css',
})
export class ProfessorPerfilComponent implements OnInit {
  private readonly professoresService = inject(ProfessoresService);
  private readonly professorContext = inject(ProfessorContextService);
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);
  private readonly cdr = inject(ChangeDetectorRef);

  professorId: number | null = null;

  form: ProfessorCreateRequest = {
    nome: '',
    email: '',
    password: '',
    role: 'PROFESSOR',
    areaAtuacao: '',
  };

  loading = false;
  loadingDados = false;
  errorMessage = '';
  successMessage = '';

  ngOnInit(): void {
    if (this.authService.getTipoUsuario() !== 'PROFESSOR') {
      this.router.navigate(['/dashboard']);
      return;
    }

    this.carregarDados();
  }

  salvar(): void {
    this.errorMessage = '';
    this.successMessage = '';

    const validacao = validarEdicaoProfessor(this.form);
    if (validacao) {
      this.errorMessage = validacao;
      this.cdr.detectChanges();
      return;
    }

    if (this.professorId == null) {
      this.errorMessage = 'ID do professor não encontrado.';
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

    this.professoresService
      .atualizar(
        this.professorId,
        montarPayloadEdicaoProfessor(this.professorId, this.form),
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
            entidade: 'professor',
            modoEdicao: true,
          });
        },
      });
  }

  private carregarDados(): void {
    if (!this.authService.getToken()) {
      this.errorMessage =
        'Token não encontrado. Faça logout, login como PROFESSOR e tente novamente.';
      this.cdr.detectChanges();
      return;
    }

    this.loadingDados = true;
    this.cdr.detectChanges();

    this.professorContext
      .obterIdProfessor()
      .pipe(
        switchMap((id) => {
          this.professorId = id;
          return this.professoresService.buscarPorId(id);
        }),
        finalize(() => {
          this.loadingDados = false;
          this.cdr.detectChanges();
        }),
      )
      .subscribe({
        next: (professor) => {
          this.form = {
            nome: professor.nome,
            email: professor.email,
            password: '',
            role: professor.role ?? 'PROFESSOR',
            areaAtuacao: professor.areaAtuacao ?? '',
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
            entidade: 'professor',
          });
        },
      });
  }
}
