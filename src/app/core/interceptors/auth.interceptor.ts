import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { AuthService } from '../services/auth.service';

const PREFIXOS_COM_TOKEN = [
  '/api',
  '/alunos',
  '/auth',
  '/disciplinas',
  '/trabalhos',
  '/entregas',
];

function requerToken(url: string): boolean {
  if (url.includes('/auth/login')) {
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

  const token = inject(AuthService).getToken();
  if (!token) {
    return next(req);
  }

  const headers: Record<string, string> = {
    Authorization: `Bearer ${token}`,
  };

  const temBody =
    req.body != null &&
    !(typeof req.body === 'string' && req.body.length === 0);

  if (!req.headers.has('Content-Type') && temBody) {
    headers['Content-Type'] = 'application/json';
  }

  return next(
    req.clone({
      setHeaders: headers,
    }),
  );
};
