import { Injectable, inject } from '@angular/core';
<<<<<<< HEAD
import { Observable, map, of, take } from 'rxjs';
import { AuthService } from './auth.service';
import { AlunosService } from './alunos.service';
=======
import { Observable, of, throwError } from 'rxjs';
import { AuthService } from './auth.service';
>>>>>>> origin/main

@Injectable({ providedIn: 'root' })
export class AlunoContextService {
  private readonly auth = inject(AuthService);
<<<<<<< HEAD
  private readonly alunosService = inject(AlunosService);

  obterIdAluno(): Observable<number> {
    const idSalvo = this.auth.getUsuarioId();
    if (idSalvo != null && !Number.isNaN(Number(idSalvo))) {
      return of(Number(idSalvo));
    }

    const email = this.auth.getUsuario()?.email?.trim().toLowerCase();
    if (!email) {
      throw new Error(
        'E-mail do aluno não encontrado na sessão. Faça logout e login novamente.',
      );
    }

    return this.alunosService.listar().pipe(
      take(1),
      map((alunos) => {
        const aluno = alunos.find(
          (item) => item.email.trim().toLowerCase() === email,
        );

        if (aluno?.id == null) {
          throw new Error(
            'ID do aluno não encontrado. Verifique se o login retorna o id ou se o aluno está cadastrado com este e-mail.',
          );
        }

        return Number(aluno.id);
      }),
=======

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
>>>>>>> origin/main
    );
  }
}
