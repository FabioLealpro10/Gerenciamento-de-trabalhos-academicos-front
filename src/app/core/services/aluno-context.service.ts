import { Injectable, inject } from '@angular/core';
import { Observable, of, throwError } from 'rxjs';
import { AuthService } from './auth.service';

@Injectable({ providedIn: 'root' })
export class AlunoContextService {
  private readonly auth = inject(AuthService);

  obterIdAluno(): Observable<number> {
    const id = this.auth.getUsuarioId();

    if (id != null) {
      return of(Number(id));
    }

    return throwError(
      () =>
        new Error(
          'ID do aluno não encontrado. Faça logout, login novamente e tente de novo.',
        ),
    );
  }
}
