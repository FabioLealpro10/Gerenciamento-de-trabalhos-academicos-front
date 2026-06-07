import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { map, Observable } from 'rxjs';
import { TRABALHOS_URL } from '../config/api.config';
import {
  TrabalhoCreateRequest,
  TrabalhoListItem,
  TrabalhoUpdateRequest,
} from '../models/trabalho.model';
import { extrairListaApi } from '../utils/api-list.util';
import { AuthService } from './auth.service';

const API_URL = TRABALHOS_URL;

@Injectable({ providedIn: 'root' })
export class TrabalhosService {
  private readonly http = inject(HttpClient);
  private readonly auth = inject(AuthService);

  listarPorDisciplina(
    disciplinaId: number | string,
  ): Observable<TrabalhoListItem[]> {
    return this.http
      .get<unknown>(`${API_URL}/disciplina/${disciplinaId}`, this.auth.getAuthOptions())
      .pipe(
        map((body) =>
          extrairListaApi(body).map((item) => this.normalizarTrabalho(item)),
        ),
      );
  }

  listar(): Observable<TrabalhoListItem[]> {
    return this.http
      .get<unknown>(API_URL, this.auth.getAuthOptions())
      .pipe(
        map((body) =>
          extrairListaApi(body).map((item) => this.normalizarTrabalho(item)),
        ),
      );
  }

  buscarPorId(id: number | string): Observable<TrabalhoListItem> {
    return this.http
      .get<Record<string, unknown>>(`${API_URL}/${id}`, this.auth.getAuthOptions())
      .pipe(map((item) => this.normalizarTrabalho(item)));
  }

  cadastrar(payload: TrabalhoCreateRequest): Observable<unknown> {
    return this.http.post(API_URL, payload, this.auth.getAuthOptions());
  }

  atualizar(
    id: number | string,
    payload: TrabalhoUpdateRequest,
  ): Observable<unknown> {
    return this.http.put(`${API_URL}/${id}`, payload, this.auth.getAuthOptions());
  }

  excluir(id: number | string): Observable<void> {
    return this.http.delete<void>(`${API_URL}/${id}`, this.auth.getAuthOptions());
  }

  private normalizarTrabalho(item: Record<string, unknown>): TrabalhoListItem {
    const id = item['id'] ?? item['idTrabalho'];

    return {
      id: id as number | string | undefined,
      titulo: String(item['titulo'] ?? ''),
      descricao:
        item['descricao'] != null ? String(item['descricao']) : undefined,
      linkArquivoTrabalho:
        item['linkArquivoTrabalho'] != null
          ? String(item['linkArquivoTrabalho'])
          : undefined,
      dataInicio:
        item['dataInicio'] != null ? String(item['dataInicio']) : undefined,
      dataFim: item['dataFim'] != null ? String(item['dataFim']) : undefined,
      disciplinaId:
        item['disciplinaId'] != null
          ? Number(item['disciplinaId'])
          : undefined,
      disciplinaNome:
        item['disciplinaNome'] != null
          ? String(item['disciplinaNome'])
          : undefined,
    };
  }
}
