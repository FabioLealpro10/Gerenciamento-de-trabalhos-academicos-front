import { ChangeDetectorRef, Component, inject, OnInit } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';
import { finalize, switchMap } from 'rxjs';
import { DisciplinasService } from '../../../core/services/disciplinas.service';
import { ProfessorContextService } from '../../../core/services/professor-context.service';
import { AuthService } from '../../../core/services/auth.service';
import { DisciplinaListItem } from '../../../core/models/disciplina.model';
import { mensagemErroHttp } from '../../../core/utils/http-error.util';

@Component({
  selector: 'app-professor-disciplinas-list',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './professor-disciplinas-list.component.html',
  styleUrl: './professor-disciplinas-list.component.css',
})
export class ProfessorDisciplinasListComponent implements OnInit {
  private readonly disciplinasService = inject(DisciplinasService);
  private readonly professorContext = inject(ProfessorContextService);
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);
  private readonly cdr = inject(ChangeDetectorRef);

  disciplinas: DisciplinaListItem[] = [];
  loading = false;
  errorMessage = '';

  ngOnInit(): void {
    if (!this.authService.isAuthenticated()) {
      void this.router.navigate(['/login']);
      return;
    }

    this.carregar();
  }

  carregar(): void {
    this.errorMessage = '';

    if (!this.authService.getToken()) {
      this.errorMessage =
        'Token não encontrado. Faça logout, login como PROFESSOR e acesse novamente.';
      this.cdr.detectChanges();
      return;
    }

    this.loading = true;
    this.cdr.detectChanges();

    this.professorContext
      .obterIdProfessor()
      .pipe(
        switchMap((idProfessor) =>
          this.disciplinasService.listarPorProfessor(idProfessor),
        ),
        finalize(() => {
          this.loading = false;
          this.cdr.detectChanges();
        }),
      )
      .subscribe({
        next: (disciplinas) => {
          this.disciplinas = disciplinas ?? [];
        },
        error: (err: unknown) => {
          if (err instanceof Error && !(err instanceof HttpErrorResponse)) {
            this.errorMessage = err.message;
            return;
          }

          this.errorMessage = mensagemErroHttp(err as HttpErrorResponse, {
            temToken: !!this.authService.getToken(),
            contexto: 'listar',
            entidade: 'disciplinas do professor',
          });
        },
      });
  }

  verAlunosMatriculados(disciplina: DisciplinaListItem): void {
    if (disciplina.id == null) {
      this.errorMessage = 'Esta disciplina não possui ID.';
      this.cdr.detectChanges();
      return;
    }

    this.router.navigate(
      ['/professor/disciplinas', disciplina.id, 'alunos'],
      { state: { disciplina } },
    );
  }

  gerenciarTrabalhos(disciplina: DisciplinaListItem): void {
    if (disciplina.id == null) {
      this.errorMessage = 'Esta disciplina não possui ID.';
      this.cdr.detectChanges();
      return;
    }

    this.router.navigate(
      ['/professor/disciplinas', disciplina.id, 'trabalhos'],
      { state: { disciplina } },
    );
  }
}
