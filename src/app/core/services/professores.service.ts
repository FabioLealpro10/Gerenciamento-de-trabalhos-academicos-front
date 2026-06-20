import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { map, Observable } from 'rxjs';
import { PROFESSORES_URL } from '../config/api.config';
import {
  ProfessorCreateRequest,
  ProfessorListItem,
  ProfessorUpdateRequest,
} from '../models/professor.model';
import { PageQuery, PageResult } from '../models/page.model';
import { MensagemResponse } from '../models/api-response.model';
import { extrairListaApi, extrairPaginaApi } from '../utils/api-list.util';
import { AuthService } from './auth.service';

const API_URL = PROFESSORES_URL;

@Injectable({ providedIn: 'root' })
export class ProfessoresService {
  private readonly http = inject(HttpClient);
  private readonly auth = inject(AuthService);

  listar(): Observable<ProfessorListItem[]> {
    return this.http
      .get<unknown>(API_URL, { headers: this.auth.getAuthHeaders() })
      .pipe(
        map((body) =>
          extrairListaApi(body).map((item) => this.normalizarProfessor(item)),
        ),
      );
  }

  listarPagina(query: PageQuery): Observable<PageResult<ProfessorListItem>> {
    return this.http
      .get<unknown>(`${API_URL}?page=${query.page}&size=${query.size}`, {
        headers: this.auth.getAuthHeaders(),
      })
      .pipe(
        map((body) =>
          extrairPaginaApi(body, (item) => this.normalizarProfessor(item)),
        ),
      );
  }

  /** Pesquisa por subpalavra do nome (GET /api/professores/pesquisar). */
  pesquisarPagina(
    nome: string,
    query: PageQuery,
  ): Observable<PageResult<ProfessorListItem>> {
    return this.http
      .get<unknown>(
        `${API_URL}/pesquisar?nome=${encodeURIComponent(nome)}&page=${query.page}&size=${query.size}`,
        { headers: this.auth.getAuthHeaders() },
      )
      .pipe(
        map((body) =>
          extrairPaginaApi(body, (item) => this.normalizarProfessor(item)),
        ),
      );
  }

  buscarPorId(id: number | string): Observable<ProfessorListItem> {
    return this.http
      .get<unknown>(`${API_URL}/${id}`, { headers: this.auth.getAuthHeaders() })
      .pipe(
        map((body) =>
          this.normalizarProfessor(body as Record<string, unknown>),
        ),
      );
  }

  cadastrar(payload: ProfessorCreateRequest): Observable<unknown> {
    return this.http.post(API_URL, payload, {
      headers: this.auth.getAuthHeaders(),
    });
  }

  atualizar(
    id: number | string,
    payload: ProfessorUpdateRequest,
  ): Observable<unknown> {
    return this.http.put(`${API_URL}/${id}`, payload, {
      headers: this.auth.getAuthHeaders(),
    });
  }

  excluir(id: number | string): Observable<MensagemResponse> {
    return this.http.delete<MensagemResponse>(`${API_URL}/${id}`, {
      headers: this.auth.getAuthHeaders(),
    });
  }

  private normalizarProfessor(item: Record<string, unknown>): ProfessorListItem {
    const id =
      item['id'] ??
      item['idProfessor'] ??
      item['usuarioId'] ??
      item['idUsuario'];

    const area =
      item['areaAtuacao'] ??
      item['area_atuacao'] ??
      item['areaDeAtuacao'];

    return {
      id: id as number | string | undefined,
      nome: String(item['nome'] ?? ''),
      email: String(item['email'] ?? ''),
      role: item['role'] != null ? String(item['role']) : 'PROFESSOR',
      areaAtuacao: area != null ? String(area) : undefined,
    };
  }
}
