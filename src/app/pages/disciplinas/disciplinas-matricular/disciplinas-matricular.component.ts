import { ChangeDetectorRef, Component, inject, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';
import { finalize, forkJoin } from 'rxjs';
import { DisciplinasService } from '../../../core/services/disciplinas.service';
import { AlunosService } from '../../../core/services/alunos.service';
import { AuthService } from '../../../core/services/auth.service';
import { DisciplinaListItem } from '../../../core/models/disciplina.model';
import { UsuarioListItem } from '../../../core/models/aluno.model';
import { mensagemErroHttp } from '../../../core/utils/http-error.util';

@Component({
  selector: 'app-disciplinas-matricular',
  standalone: true,
  imports: [FormsModule, RouterLink],
  templateUrl: './disciplinas-matricular.component.html',
  styleUrl: './disciplinas-matricular.component.css',
})
export class DisciplinasMatricularComponent implements OnInit {
  private readonly disciplinasService = inject(DisciplinasService);
  private readonly alunosService = inject(AlunosService);
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly cdr = inject(ChangeDetectorRef);

  disciplinaId: string | null = null;
  disciplina: DisciplinaListItem | null = null;
  alunoSelecionadoId: number | null = null;

  alunosDisponiveis: UsuarioListItem[] = [];
<<<<<<< HEAD
  alunosMatriculados: UsuarioListItem[] = [];
=======
  alunosMatriculados: string[] = [];
>>>>>>> origin/main

  loading = false;
  loadingDados = false;
  errorMessage = '';
  successMessage = '';

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (!id) {
      this.router.navigate(['/disciplinas']);
      return;
    }

    this.disciplinaId = id;
    this.carregarDados();
  }

<<<<<<< HEAD
  removerMatricula(aluno: UsuarioListItem): void {
    if (!this.disciplinaId || aluno.id == null) {
      return;
    }

    if (
      !confirm(
        `Deseja remover a matrícula do aluno ${aluno.nome}?`
      )
    ) {
      return;
    }

    this.loading = true;
    this.errorMessage = '';
    this.successMessage = '';

    this.disciplinasService
      .desmatricular(
        aluno.id,
        Number(this.disciplinaId),
      )
      .pipe(
        finalize(() => {
          this.loading = false;
          this.cdr.detectChanges();
        }),
      )
      .subscribe({
        next: () => {
          this.successMessage =
            'Matrícula removida com sucesso!';

          this.carregarDados();
        },

        error: (err: HttpErrorResponse) => {
          this.errorMessage = mensagemErroHttp(err, {
            temToken: !!this.authService.getToken(),
            contexto: 'excluir',
            entidade: 'matrícula',
          });
        },
      });
  }

=======
>>>>>>> origin/main
  matricular(): void {
    this.errorMessage = '';
    this.successMessage = '';

    if (this.alunoSelecionadoId == null || this.alunoSelecionadoId <= 0) {
      this.errorMessage = 'Selecione um aluno para matricular.';
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

    this.disciplinasService
      .matricular({
        alunoId: this.alunoSelecionadoId,
        disciplinaId: Number(this.disciplinaId),
      })
      .pipe(
        finalize(() => {
          this.loading = false;
          this.cdr.detectChanges();
        }),
      )
      .subscribe({
        next: () => {
          this.successMessage = 'Aluno matriculado com sucesso!';
          this.alunoSelecionadoId = null;
          this.carregarDados();
        },
        error: (err: HttpErrorResponse) => {
          this.errorMessage = mensagemErroHttp(err, {
            temToken: !!this.authService.getToken(),
            contexto: 'salvar',
            entidade: 'matrícula',
            modoEdicao: false,
          });
        },
      });
  }

  private carregarDados(): void {
    if (!this.authService.getToken() || !this.disciplinaId) {
      this.errorMessage =
        'Token não encontrado. Faça login como ADMIN para continuar.';
      this.cdr.detectChanges();
      return;
    }

    this.loadingDados = true;
    this.cdr.detectChanges();

    forkJoin({
      disciplina: this.disciplinasService.buscarPorId(this.disciplinaId),
      alunos: this.alunosService.listar(),
    })
      .pipe(
        finalize(() => {
          this.loadingDados = false;
          this.cdr.detectChanges();
        }),
      )
      .subscribe({
        next: ({ disciplina, alunos }) => {
          this.disciplina = disciplina;
<<<<<<< HEAD
          const nomesMatriculados = new Set(
            (disciplina.alunosMatriculados ?? []).map((nome) =>
              nome.trim().toLowerCase(),
            ),
          );

          this.alunosMatriculados = (alunos ?? []).filter(
            (aluno) =>
              aluno.id != null &&
              nomesMatriculados.has(
                aluno.nome.trim().toLowerCase(),
              ),
=======
          this.alunosMatriculados = disciplina.alunosMatriculados ?? [];

          const nomesMatriculados = new Set(
            this.alunosMatriculados.map((nome) => nome.trim().toLowerCase()),
>>>>>>> origin/main
          );

          this.alunosDisponiveis = (alunos ?? []).filter(
            (aluno) =>
              aluno.id != null &&
<<<<<<< HEAD
              !nomesMatriculados.has(
                aluno.nome.trim().toLowerCase(),
              ),
=======
              !nomesMatriculados.has(aluno.nome.trim().toLowerCase()),
>>>>>>> origin/main
          );
        },
        error: (err: HttpErrorResponse) => {
          this.errorMessage = mensagemErroHttp(err, {
            temToken: !!this.authService.getToken(),
            contexto: 'listar',
            entidade: 'dados da matrícula',
          });
        },
      });
  }
}
