import { Injectable, inject } from '@angular/core';
import { catchError, map, Observable, of, throwError } from 'rxjs';
import { AuthService } from './auth.service';
import { AlunosService } from './alunos.service';

@Injectable({ providedIn: 'root' })
export class AlunoContextService {
  private readonly auth = inject(AuthService);
  private readonly alunosService = inject(AlunosService);

  obterIdAluno(): Observable<number> {
    const idAluno = this.auth.getAlunoId();
    if (idAluno != null) {
      return of(idAluno);
    }

    const idUsuario = this.auth.getUsuarioId();
    if (idUsuario != null && this.auth.getTipoUsuario() === 'ALUNO') {
      return this.alunosService.buscarPorId(idUsuario).pipe(
        map((aluno) => {
          const id = aluno.id ?? idUsuario;
          return Number(id);
        }),
        catchError(() =>
          throwError(
            () =>
              new Error(
                'Não foi possível identificar seu cadastro de aluno. Faça logout e login novamente.',
              ),
          ),
        ),
      );
    }

    return throwError(
      () =>
        new Error(
          'Não foi possível identificar seu cadastro de aluno. Faça logout e login novamente.',
        ),
    );
  }
}
