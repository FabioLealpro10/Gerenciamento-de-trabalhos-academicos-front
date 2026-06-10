import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { map, Observable } from 'rxjs';
import { ALUNOS_URL } from '../config/api.config';
import {
  AlunoCreateRequest,
  AlunoUpdateRequest,
  UsuarioListItem,
} from '../models/aluno.model';
import { extrairListaApi } from '../utils/api-list.util';
import { AuthService } from './auth.service';

const API_URL = ALUNOS_URL;

@Injectable({ providedIn: 'root' })
export class AlunosService {
  private readonly http = inject(HttpClient);
  private readonly auth = inject(AuthService);

  listar(): Observable<UsuarioListItem[]> {
    return this.http
      .get<unknown>(API_URL, { headers: this.auth.getAuthHeaders() })
      .pipe(
        map((body) =>
          extrairListaApi(body).map((item) => this.normalizarUsuario(item)),
        ),
      );
  }

  cadastrar(payload: AlunoCreateRequest): Observable<unknown> {
    return this.http.post(API_URL, payload, {
      headers: this.auth.getAuthHeaders(),
    });
  }

  atualizar(id: number | string, payload: AlunoUpdateRequest): Observable<unknown> {
    return this.http.put(`${API_URL}/${id}`, payload, {
      headers: this.auth.getAuthHeaders(),
    });
  }

  excluir(id: number | string): Observable<void> {
    return this.http.delete<void>(`${API_URL}/${id}`, {
      headers: this.auth.getAuthHeaders(),
    });
  }

  private normalizarUsuario(item: Record<string, unknown>): UsuarioListItem {
    const id =
      item['id'] ??
      item['idAluno'] ??
      item['usuarioId'] ??
      item['idUsuario'];

    const turma = item['turma'] ?? item['Turma'];

    return {
      id: id as number | string | undefined,
      nome: String(item['nome'] ?? ''),
      email: String(item['email'] ?? ''),
      role: item['role'] != null ? String(item['role']) : 'ALUNO',
      turma: turma != null ? String(turma) : undefined,
    };
  }
}
