import { Routes } from '@angular/router';
import {
  adminGuard,
  authGuard,
  loginGuard,
  professorGuard,
  alunoGuard,
} from './core/guards/auth.guard';

export const routes: Routes = [
  {
    path: '',
    pathMatch: 'full',
    redirectTo: 'login',
  },
  {
    path: 'login',
    canActivate: [loginGuard],
    loadComponent: () =>
      import('./pages/login/login.component').then((m) => m.LoginComponent),
  },
  {
    path: 'dashboard',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./pages/dashboard/dashboard.component').then(
        (m) => m.DashboardComponent,
      ),
  },
  {
    path: 'alunos/novo',
    canActivate: [adminGuard],
    loadComponent: () =>
      import('./pages/alunos/alunos-create/alunos-create.component').then(
        (m) => m.AlunosCreateComponent,
      ),
  },
  {
    path: 'alunos/:id/editar',
    canActivate: [adminGuard],
    loadComponent: () =>
      import('./pages/alunos/alunos-create/alunos-create.component').then(
        (m) => m.AlunosCreateComponent,
      ),
  },
  {
    path: 'alunos',
    canActivate: [adminGuard],
    loadComponent: () =>
      import('./pages/alunos/alunos-list/alunos-list.component').then(
        (m) => m.AlunosListComponent,
      ),
  },
  {
    path: 'professores/novo',
    canActivate: [adminGuard],
    loadComponent: () =>
      import('./pages/professores/professores-create/professores-create.component').then(
        (m) => m.ProfessoresCreateComponent,
      ),
  },
  {
    path: 'professores/:id/editar',
    canActivate: [adminGuard],
    loadComponent: () =>
      import('./pages/professores/professores-create/professores-create.component').then(
        (m) => m.ProfessoresCreateComponent,
      ),
  },
  {
    path: 'professores',
    canActivate: [adminGuard],
    loadComponent: () =>
      import('./pages/professores/professores-list/professores-list.component').then(
        (m) => m.ProfessoresListComponent,
      ),
  },
  {
    path: 'disciplinas/novo',
    canActivate: [adminGuard],
    loadComponent: () =>
      import('./pages/disciplinas/disciplinas-create/disciplinas-create.component').then(
        (m) => m.DisciplinasCreateComponent,
      ),
  },
  {
    path: 'disciplinas/:id/editar',
    canActivate: [adminGuard],
    loadComponent: () =>
      import('./pages/disciplinas/disciplinas-create/disciplinas-create.component').then(
        (m) => m.DisciplinasCreateComponent,
      ),
  },
  {
    path: 'disciplinas/:id/alunos',
    canActivate: [adminGuard],
    loadComponent: () =>
      import('./pages/disciplinas/disciplinas-alunos-matriculados/disciplinas-alunos-matriculados.component').then(
        (m) => m.DisciplinasAlunosMatriculadosComponent,
      ),
  },
  {
    path: 'disciplinas/:id/matricular',
    canActivate: [adminGuard],
    loadComponent: () =>
      import('./pages/disciplinas/disciplinas-matricular/disciplinas-matricular.component').then(
        (m) => m.DisciplinasMatricularComponent,
      ),
  },
  {
    path: 'disciplinas',
    canActivate: [adminGuard],
    loadComponent: () =>
      import('./pages/disciplinas/disciplinas-list/disciplinas-list.component').then(
        (m) => m.DisciplinasListComponent,
      ),
  },
  {
    path: 'aluno/disciplinas/:disciplinaId/trabalhos/:trabalhoId/entrega',
    canActivate: [alunoGuard],
    loadComponent: () =>
      import('./pages/aluno/aluno-entrega/aluno-entrega.component').then(
        (m) => m.AlunoEntregaComponent,
      ),
  },
  {
    path: 'aluno/disciplinas/:disciplinaId/trabalhos',
    canActivate: [alunoGuard],
    loadComponent: () =>
      import('./pages/aluno/aluno-trabalhos-list/aluno-trabalhos-list.component').then(
        (m) => m.AlunoTrabalhosListComponent,
      ),
  },
  {
    path: 'professor/disciplinas/:disciplinaId/alunos',
    canActivate: [professorGuard],
    loadComponent: () =>
      import('./pages/disciplinas/disciplinas-alunos-matriculados/disciplinas-alunos-matriculados.component').then(
        (m) => m.DisciplinasAlunosMatriculadosComponent,
      ),
  },
  {
    path: 'professor/disciplinas/:disciplinaId/trabalhos/novo',
    canActivate: [professorGuard],
    loadComponent: () =>
      import('./pages/trabalhos/trabalhos-create/trabalhos-create.component').then(
        (m) => m.TrabalhosCreateComponent,
      ),
  },
  {
    path: 'professor/disciplinas/:disciplinaId/trabalhos/:id/editar',
    canActivate: [professorGuard],
    loadComponent: () =>
      import('./pages/trabalhos/trabalhos-create/trabalhos-create.component').then(
        (m) => m.TrabalhosCreateComponent,
      ),
  },
  {
    path: 'professor/disciplinas/:disciplinaId/trabalhos/:id/entregas',
    canActivate: [professorGuard],
    loadComponent: () =>
      import('./pages/trabalhos/trabalhos-entregas/trabalhos-entregas.component').then(
        (m) => m.TrabalhosEntregasComponent,
      ),
  },
  {
    path: 'professor/disciplinas/:disciplinaId/trabalhos',
    canActivate: [professorGuard],
    loadComponent: () =>
      import('./pages/professor/professor-trabalhos-list/professor-trabalhos-list.component').then(
        (m) => m.ProfessorTrabalhosListComponent,
      ),
  },
  {
    path: 'professor/disciplinas',
    canActivate: [professorGuard],
    loadComponent: () =>
      import('./pages/professor/professor-disciplinas-list/professor-disciplinas-list.component').then(
        (m) => m.ProfessorDisciplinasListComponent,
      ),
  },
  {
    path: 'trabalhos/novo',
    canActivate: [adminGuard],
    loadComponent: () =>
      import('./pages/trabalhos/trabalhos-create/trabalhos-create.component').then(
        (m) => m.TrabalhosCreateComponent,
      ),
  },
  {
    path: 'trabalhos/:id/editar',
    canActivate: [adminGuard],
    loadComponent: () =>
      import('./pages/trabalhos/trabalhos-create/trabalhos-create.component').then(
        (m) => m.TrabalhosCreateComponent,
      ),
  },
  {
    path: 'trabalhos/:id/entregas',
    canActivate: [adminGuard],
    loadComponent: () =>
      import('./pages/trabalhos/trabalhos-entregas/trabalhos-entregas.component').then(
        (m) => m.TrabalhosEntregasComponent,
      ),
  },
  {
    path: 'trabalhos',
    canActivate: [adminGuard],
    loadComponent: () =>
      import('./pages/trabalhos/trabalhos-list/trabalhos-list.component').then(
        (m) => m.TrabalhosListComponent,
      ),
  },
  {
    path: '**',
    redirectTo: 'login',
  },
];
