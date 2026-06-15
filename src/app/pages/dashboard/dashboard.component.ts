import { ChangeDetectorRef, Component, inject, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';
import { finalize, switchMap } from 'rxjs';
import { FEATURES } from '../../core/config/features.config';
import { AuthService } from '../../core/services/auth.service';
import { DisciplinasService } from '../../core/services/disciplinas.service';
import { ProfessorContextService } from '../../core/services/professor-context.service';
import { AlunoContextService } from '../../core/services/aluno-context.service';
import { DisciplinaListItem } from '../../core/models/disciplina.model';
import { FeatureItem, TipoUsuario } from '../../core/models/user.model';
import { mensagemErroHttp } from '../../core/utils/http-error.util';
import { filtrarPorTextoLocal } from '../../core/utils/local-search.util';
import { DataBrPipe } from '../../shared/pipes/data-br.pipe';
import { MaterialIconComponent } from '../../shared/icons/material-icon.component';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [DataBrPipe, RouterLink, FormsModule, MaterialIconComponent],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.css',
})
export class DashboardComponent implements OnInit {
  private readonly authService = inject(AuthService);
  private readonly disciplinasService = inject(DisciplinasService);
  private readonly professorContext = inject(ProfessorContextService);
  private readonly alunoContext = inject(AlunoContextService);
  private readonly router = inject(Router);
  private readonly cdr = inject(ChangeDetectorRef);

  get usuario() {
    return this.authService.getUsuario();
  }

  tipoUsuario: TipoUsuario | null = null;
  funcionalidades: FeatureItem[] = [];
  disciplinas: DisciplinaListItem[] = [];
  loadingDisciplinas = false;
  errorMessage = '';
  pesquisaDisciplinas = '';

  get disciplinasFiltradas(): DisciplinaListItem[] {
    return filtrarPorTextoLocal(this.disciplinas, this.pesquisaDisciplinas, [
      (d) => d.nome,
      (d) => d.professor,
    ]);
  }

  get ehProfessor(): boolean {
    return this.tipoUsuario === 'PROFESSOR';
  }

  get ehAluno(): boolean {
    return this.tipoUsuario === 'ALUNO';
  }

  get ehAdmin(): boolean {
    return this.tipoUsuario === 'ADMIN';
  }

  get rotaMeusDados(): string {
    if (this.ehProfessor) {
      return '/professor/meus-dados';
    }
    if (this.ehAluno) {
      return '/aluno/meus-dados';
    }
    return '/admin/meus-dados';
  }

  ngOnInit(): void {
    const tipo = this.authService.getTipoUsuario();

    if (!tipo) {
      this.router.navigate(['/login']);
      return;
    }

    this.tipoUsuario = tipo;

    if (tipo === 'PROFESSOR') {
      this.carregarDisciplinasProfessor();
      return;
    }

    if (tipo === 'ALUNO') {
      this.carregarDisciplinasAluno();
      return;
    }

    this.funcionalidades = FEATURES.filter(
      (feature) =>
        feature.roles.includes(tipo) &&
        (!feature.superAdminOnly || this.authService.isAdminMaster()),
    );
  }

  carregarDisciplinasProfessor(): void {
    this.errorMessage = '';

    if (!this.authService.getToken()) {
      this.errorMessage =
        'Token não encontrado. Faça logout, login como PROFESSOR e acesse novamente.';
      this.cdr.detectChanges();
      return;
    }

    this.loadingDisciplinas = true;
    this.cdr.detectChanges();

    this.professorContext
      .obterIdProfessor()
      .pipe(
        switchMap((idProfessor) =>
          this.disciplinasService.listarPorProfessor(idProfessor),
        ),
        finalize(() => {
          this.loadingDisciplinas = false;
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
            entidade: 'disciplinas',
          });
        },
      });
  }

  carregarDisciplinasAluno(): void {
    this.errorMessage = '';

    if (!this.authService.getToken()) {
      this.errorMessage =
        'Token não encontrado. Faça logout, login como ALUNO e acesse novamente.';
      this.cdr.detectChanges();
      return;
    }

    this.loadingDisciplinas = true;
    this.cdr.detectChanges();

    this.alunoContext
      .obterIdAluno()
      .pipe(
        switchMap((idAluno) => this.disciplinasService.listarPorAluno(idAluno)),
        finalize(() => {
          this.loadingDisciplinas = false;
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
            entidade: 'disciplinas',
          });
        },
      });
  }

  limparPesquisaDisciplinas(): void {
    this.pesquisaDisciplinas = '';
  }

  abrirDisciplina(disciplina: DisciplinaListItem): void {
    if (disciplina.id == null) {
      this.errorMessage = 'Esta disciplina não possui ID.';
      this.cdr.detectChanges();
      return;
    }

    if (this.ehAluno) {
      this.router.navigate(
        ['/aluno/disciplinas', disciplina.id, 'trabalhos'],
        { state: { disciplina } },
      );
      return;
    }

    this.router.navigate(
      ['/professor/disciplinas', disciplina.id, 'trabalhos'],
      { state: { disciplina } },
    );
  }

  verAlunosMatriculados(disciplina: DisciplinaListItem, event: Event): void {
    event.stopPropagation();

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

  getTipoLabel(tipo: TipoUsuario): string {
    const labels: Record<TipoUsuario, string> = {
      ADMIN: 'Administrador',
      PROFESSOR: 'Professor',
      ALUNO: 'Aluno',
    };

    return labels[tipo];
  }

  abrirFuncionalidade(feature: FeatureItem): void {
    const rotas: Record<string, string> = {
      admins: '/admins',
      usuarios: '/alunos',
      alunos: '/alunos',
      professores: '/professores',
      disciplinas: '/disciplinas',
      'todos-trabalhos': '/trabalhos',
    };

    const destino = rotas[feature.id];
    if (destino) {
      this.router.navigate([destino]);
      return;
    }

    alert(`A funcionalidade "${feature.titulo}" será implementada em breve.`);
  }

  logout(): void {
    this.authService.logout();
    this.router.navigate(['/login']);
  }
}
