import { Injectable, inject } from '@angular/core';
import { Observable, map, of, take } from 'rxjs';
import { AuthService } from './auth.service';
import { ProfessoresService } from './professores.service';

@Injectable({ providedIn: 'root' })
export class ProfessorContextService {
  private readonly auth = inject(AuthService);
  private readonly professoresService = inject(ProfessoresService);

  obterIdProfessor(): Observable<number> {
    const idSalvo = this.auth.getUsuarioId();
    if (idSalvo != null) {
      return of(Number(idSalvo));
    }

    const email = this.auth.getUsuario()?.email?.trim().toLowerCase();
    if (!email) {
      throw new Error('E-mail do professor não encontrado na sessão.');
    }

    return this.professoresService.listar().pipe(
      take(1),
      map((professores) => {
        const professor = professores.find(
          (p) => p.email.trim().toLowerCase() === email,
        );

        if (professor?.id == null) {
          throw new Error(
            'ID do professor não encontrado. Verifique se o login retorna o id ou cadastre o professor com este e-mail.',
          );
        }

        return Number(professor.id);
      }),
    );
  }
}
