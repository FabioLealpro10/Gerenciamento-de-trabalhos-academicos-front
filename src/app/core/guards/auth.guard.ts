import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

export const authGuard: CanActivateFn = () => {
  const authService = inject(AuthService);
  const router = inject(Router);

  if (authService.isAuthenticated()) {
    return true;
  }

  return router.createUrlTree(['/login']);
};

export const loginGuard: CanActivateFn = () => {
  const authService = inject(AuthService);
  const router = inject(Router);

  if (!authService.isAuthenticated()) {
    return true;
  }

  return router.createUrlTree(['/dashboard']);
};

/** Rotas de gestão (alunos/professores) — somente ADMIN com token válido */
export const adminGuard: CanActivateFn = () => {
  const authService = inject(AuthService);
  const router = inject(Router);

  if (!authService.isAuthenticated()) {
    return router.createUrlTree(['/login']);
  }

  if (authService.getTipoUsuario() !== 'ADMIN') {
    return router.createUrlTree(['/dashboard']);
  }

  return true;
};

/** Rotas exclusivas do administrador principal (id 1). */
export const superAdminGuard: CanActivateFn = () => {
  const authService = inject(AuthService);
  const router = inject(Router);

  if (!authService.isAuthenticated()) {
    return router.createUrlTree(['/login']);
  }

  if (!authService.isAdminMaster()) {
    return router.createUrlTree(['/dashboard']);
  }

  return true;
};

/** Rotas do professor — somente PROFESSOR autenticado */
export const professorGuard: CanActivateFn = () => {
  const authService = inject(AuthService);
  const router = inject(Router);

  if (!authService.isAuthenticated()) {
    return router.createUrlTree(['/login']);
  }

  if (authService.getTipoUsuario() !== 'PROFESSOR') {
    return router.createUrlTree(['/dashboard']);
  }

  return true;
};

/** Rotas do aluno — somente ALUNO autenticado */
export const alunoGuard: CanActivateFn = () => {
  const authService = inject(AuthService);
  const router = inject(Router);

  if (!authService.isAuthenticated()) {
    return router.createUrlTree(['/login']);
  }

  if (authService.getTipoUsuario() !== 'ALUNO') {
    return router.createUrlTree(['/dashboard']);
  }

  return true;
};
