import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';
import { AuthService } from '../services/auth.service';
import { isErroSessaoInvalida } from '../utils/http-error.util';

const PREFIXOS_COM_TOKEN = [
  '/api',
  '/alunos',
  '/auth',
  '/disciplinas',
  '/trabalhos',
  '/entregas',
];

function requerToken(url: string): boolean {
  if (
    url.includes('/auth/login') ||
    url.includes('/auth/esqueci-senha') ||
    url.includes('/auth/verificar-codigo')
  ) {
    return false;
  }

  return (
    PREFIXOS_COM_TOKEN.some((prefixo) => url.startsWith(prefixo)) ||
    url.startsWith('http://localhost:8080')
  );
}

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  if (!requerToken(req.url)) {
    return next(req);
  }

  const auth = inject(AuthService);
  const router = inject(Router);

  const token = auth.getToken();
  if (!token) {
    return next(req);
  }

  const headers: Record<string, string> = {
    Authorization: `Bearer ${token}`,
  };

  const temBody =
    req.body != null &&
    !(typeof req.body === 'string' && req.body.length === 0);

  // FormData (upload de PDF): o navegador define o Content-Type
  // multipart/form-data com boundary — forçar JSON quebra o upload
  const ehFormData =
    typeof FormData !== 'undefined' && req.body instanceof FormData;

  if (!req.headers.has('Content-Type') && temBody && !ehFormData) {
    headers['Content-Type'] = 'application/json';
  }

  return next(
    req.clone({
      setHeaders: headers,
    }),
  ).pipe(
    catchError((erro: unknown) => {
      if (erro instanceof HttpErrorResponse && isErroSessaoInvalida(erro)) {
        auth.logout();
        void router.navigate(['/login']);
      }

      return throwError(() => erro);
    }),
  );
};
