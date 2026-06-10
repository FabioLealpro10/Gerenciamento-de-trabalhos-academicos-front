import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { map, Observable } from 'rxjs';
import { DISCIPLINAS_URL } from '../config/api.config';
import {
  DisciplinaCreateRequest,
  DisciplinaListItem,
  DisciplinaUpdateRequest,
  MatriculaRequest,
} from '../models/disciplina.model';
import { extrairListaApi } from '../utils/api-list.util';
import { AuthService } from './auth.service';

const API_URL = DISCIPLINAS_URL;

@Injectable({ providedIn: 'root' })
export class DisciplinasService {
  private readonly http = inject(HttpClient);
  private readonly auth = inject(AuthService);

  listar(): Observable<DisciplinaListItem[]> {
    return this.http
      .get<unknown>(API_URL, this.auth.getAuthOptions())
      .pipe(
        map((body) =>
          extrairListaApi(body).map((item) => this.normalizarDisciplina(item)),
        ),
      );
  }

  listarPorProfessor(
    idProfessor: number | string,
  ): Observable<DisciplinaListItem[]> {
    return this.http
      .get<unknown>(`${API_URL}/professor/${idProfessor}`, this.auth.getAuthOptions())
      .pipe(
        map((body) =>
          extrairListaApi(body).map((item) => this.normalizarDisciplina(item)),
        ),
      );
  }

  listarPorAluno(idAluno: number | string): Observable<DisciplinaListItem[]> {
    return this.http
      .get<unknown>(`${API_URL}/aluno/${idAluno}`, this.auth.getAuthOptions())
      .pipe(
        map((body) =>
          extrairListaApi(body).map((item) => this.normalizarDisciplina(item)),
        ),
      );
  }

  buscarPorId(id: number | string): Observable<DisciplinaListItem> {
    return this.http
      .get<Record<string, unknown>>(`${API_URL}/${id}`, {
        headers: this.auth.getAuthHeaders(),
      })
      .pipe(map((item) => this.normalizarDisciplina(item)));
  }

  cadastrar(payload: DisciplinaCreateRequest): Observable<unknown> {
    return this.http.post(API_URL, payload, {
      headers: this.auth.getAuthHeaders(),
    });
  }

  atualizar(
    id: number | string,
    payload: DisciplinaUpdateRequest,
  ): Observable<unknown> {
    return this.http.put(`${API_URL}/${id}`, payload, {
      headers: this.auth.getAuthHeaders(),
    });
  }

  excluir(id: number | string): Observable<void> {
    return this.http.delete<void>(`${API_URL}/${id}`, {
      headers: this.auth.getAuthHeaders(),
    });
  }

  matricular(payload: MatriculaRequest): Observable<unknown> {
    return this.http.post(`${API_URL}/matricular`, payload, {
      headers: this.auth.getAuthHeaders(),
    });
  }

  private normalizarDisciplina(
    item: Record<string, unknown>,
  ): DisciplinaListItem {
    const id = item['id'] ?? item['idDisciplina'];
    const professorRaw = item['professor'];

    let professor: string | undefined;
    let idProfessor: number | undefined;

    if (typeof professorRaw === 'string') {
      professor = professorRaw;
    } else if (professorRaw && typeof professorRaw === 'object') {
      const profObj = professorRaw as Record<string, unknown>;
      professor =
        profObj['nome'] != null ? String(profObj['nome']) : undefined;
      idProfessor =
        profObj['id'] != null
          ? Number(profObj['id'])
          : profObj['idProfessor'] != null
            ? Number(profObj['idProfessor'])
            : undefined;
    }

    if (item['idProfessor'] != null) {
      idProfessor = Number(item['idProfessor']);
    }

    if (!professor && item['nomeProfessor'] != null) {
      professor = String(item['nomeProfessor']);
    }

    const alunosRaw = item['alunosMatriculados'];
    const alunosMatriculados = Array.isArray(alunosRaw)
      ? alunosRaw.map((nome) => String(nome))
      : [];

    return {
      id: id as number | string | undefined,
      nome: String(item['nome'] ?? ''),
      dataInicio:
        item['dataInicio'] != null ? String(item['dataInicio']) : undefined,
      dataFim: item['dataFim'] != null ? String(item['dataFim']) : undefined,
      professor,
      idProfessor,
      alunosMatriculados,
    };
  }
  desmatricular(
    alunoId: number | string,
    disciplinaId: number | string,
  ): Observable<void> {
    return this.http.delete<void>(
      `${API_URL}/matricular/aluno/${alunoId}/disciplina/${disciplinaId}`,
      {
        headers: this.auth.getAuthHeaders(),
      },
    );
  }
}
