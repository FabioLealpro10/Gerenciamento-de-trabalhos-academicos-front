import { ChangeDetectorRef, Component, inject, OnInit } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';
import { finalize } from 'rxjs';
import { DisciplinasService } from '../../../core/services/disciplinas.service';
import { AuthService } from '../../../core/services/auth.service';
import { DisciplinaListItem } from '../../../core/models/disciplina.model';
import { mensagemErroHttp } from '../../../core/utils/http-error.util';

@Component({
  selector: 'app-disciplinas-alunos-matriculados',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './disciplinas-alunos-matriculados.component.html',
  styleUrl: './disciplinas-alunos-matriculados.component.css',
})
export class DisciplinasAlunosMatriculadosComponent implements OnInit {
  private readonly disciplinasService = inject(DisciplinasService);
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly cdr = inject(ChangeDetectorRef);

  disciplinaId: string | null = null;
  disciplina: DisciplinaListItem | null = null;
  alunosMatriculados: string[] = [];
  modoProfessor = false;
  loading = false;
  errorMessage = '';

  get linkVoltar(): string {
    return this.modoProfessor ? '/dashboard' : '/disciplinas';
  }

  ngOnInit(): void {
    if (!this.authService.isAuthenticated()) {
      void this.router.navigate(['/login']);
      return;
    }

    this.modoProfessor = this.router.url.includes('/professor/');
    this.disciplinaId =
      this.route.snapshot.paramMap.get('disciplinaId') ??
      this.route.snapshot.paramMap.get('id');

    if (!this.disciplinaId) {
      void this.router.navigate([this.linkVoltar]);
      return;
    }

    this.disciplina =
      (history.state?.['disciplina'] as DisciplinaListItem | undefined) ?? null;

    this.carregar();
  }

  carregar(): void {
    this.errorMessage = '';

    if (!this.authService.getToken() || !this.disciplinaId) {
      this.errorMessage = 'Sessão expirada. Faça login novamente.';
      this.cdr.detectChanges();
      return;
    }

    this.loading = true;
    this.cdr.detectChanges();

    this.disciplinasService
      .buscarPorId(this.disciplinaId)
      .pipe(
        finalize(() => {
          this.loading = false;
          this.cdr.detectChanges();
        }),
      )
      .subscribe({
        next: (disciplina) => {
          this.disciplina = disciplina;
          this.alunosMatriculados = disciplina.alunosMatriculados ?? [];
        },
        error: (err: HttpErrorResponse) => {
          this.errorMessage = mensagemErroHttp(err, {
            temToken: !!this.authService.getToken(),
            contexto: 'listar',
            entidade: 'alunos matriculados',
          });
        },
      });
  }
}
