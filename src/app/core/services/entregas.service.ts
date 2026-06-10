import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { catchError, map, Observable, of, throwError } from 'rxjs';
import { ENTREGAS_URL } from '../config/api.config';
import {
  EntregaCorrigirRequest,
  EntregaCreateRequest,
  EntregaListItem,
  EntregaUpdateRequest,
} from '../models/trabalho.model';
import { extrairListaApi } from '../utils/api-list.util';
import { AuthService } from './auth.service';

@Injectable({ providedIn: 'root' })
export class EntregasService {
  private readonly http = inject(HttpClient);
  private readonly auth = inject(AuthService);

  listarPorTrabalho(trabalhoId: number | string): Observable<EntregaListItem[]> {
    return this.http
      .get<unknown>(`${ENTREGAS_URL}/trabalho/${trabalhoId}`, this.auth.getAuthOptions())
      .pipe(
        map((body) =>
          extrairListaApi(body).map((item) => this.normalizarEntrega(item)),
        ),
      );
  }

  buscarPorAlunoTrabalho(
    alunoId: number | string,
    trabalhoId: number | string,
  ): Observable<EntregaListItem | null> {
    return this.http
      .get<unknown>(
        `${ENTREGAS_URL}/aluno/${alunoId}/trabalho/${trabalhoId}`,
        this.auth.getAuthOptions(),
      )
      .pipe(
        map((body) => {
          if (body == null || typeof body !== 'object') {
            return null;
          }

          return this.normalizarEntrega(body as Record<string, unknown>);
        }),
        catchError((err: HttpErrorResponse) => {
          if (err.status === 404) {
            return of(null);
          }
          return throwError(() => err);
        }),
      );
  }

  cadastrar(payload: EntregaCreateRequest): Observable<EntregaListItem> {
    return this.http
      .post<unknown>(ENTREGAS_URL, payload, this.auth.getAuthOptions())
      .pipe(
        map((body) => {
          if (body != null && typeof body === 'object') {
            return this.normalizarEntrega(body as Record<string, unknown>);
          }

          return {
            linkArquivo: payload.linkArquivo,
            dataEntrega: payload.dataEntrega,
            trabalhoId: payload.trabalhoId,
            alunoId: payload.alunoId,
          };
        }),
      );
  }

  atualizar(
    alunoId: number | string,
    trabalhoId: number | string,
    payload: EntregaUpdateRequest,
  ): Observable<EntregaListItem> {
    return this.http
      .put<unknown>(
        `${ENTREGAS_URL}/aluno/${alunoId}/trabalho/${trabalhoId}`,
        payload,
        this.auth.getAuthOptions(),
      )
      .pipe(
        map((body) => {
          if (body != null && typeof body === 'object') {
            return this.normalizarEntrega(body as Record<string, unknown>);
          }

          return {
            linkArquivo: payload.linkArquivo,
            dataEntrega: payload.dataEntrega,
            trabalhoId: Number(trabalhoId),
            alunoId: Number(alunoId),
          };
        }),
      );
  }

  corrigir(
    trabalhoId: number | string,
    alunoId: number | string,
    payload: EntregaCorrigirRequest,
  ): Observable<unknown> {
    return this.http.patch(
      `${ENTREGAS_URL}/trabalho/${trabalhoId}/aluno/${alunoId}/corrigir`,
      payload,
      this.auth.getAuthOptions(),
    );
  }

  private normalizarEntrega(item: Record<string, unknown>): EntregaListItem {
    const id = item['id'] ?? item['idEntrega'];

    return {
      id: id as number | string | undefined,
      linkArquivo:
        item['linkArquivo'] != null ? String(item['linkArquivo']) : undefined,
      dataEntrega:
        item['dataEntrega'] != null ? String(item['dataEntrega']) : undefined,
      nota: item['nota'] != null ? Number(item['nota']) : undefined,
      feedback:
        item['feedback'] != null ? String(item['feedback']) : undefined,
      trabalhoId:
        item['trabalhoId'] != null ? Number(item['trabalhoId']) : undefined,
      trabalhoTitulo:
        item['trabalhoTitulo'] != null
          ? String(item['trabalhoTitulo'])
          : undefined,
      alunoId: item['alunoId'] != null ? Number(item['alunoId']) : undefined,
      alunoNome:
        item['alunoNome'] != null ? String(item['alunoNome']) : undefined,
    };
  }
}
