import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { catchError, map, Observable, of, throwError } from 'rxjs';
import { ENTREGAS_URL } from '../config/api.config';
import {
  EntregaCorrigirRequest,
  EntregaListItem,
} from '../models/trabalho.model';
import { PageQuery, PageResult } from '../models/page.model';
import { extrairListaApi, extrairPaginaApi } from '../utils/api-list.util';
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

  listarPorTrabalhoPagina(
    trabalhoId: number | string,
    query: PageQuery,
  ): Observable<PageResult<EntregaListItem>> {
    return this.http
      .get<unknown>(
        `${ENTREGAS_URL}/trabalho/${trabalhoId}?page=${query.page}&size=${query.size}`,
        this.auth.getAuthOptions(),
      )
      .pipe(
        map((body) =>
          extrairPaginaApi(body, (item) => this.normalizarEntrega(item)),
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
          if (err.status === 404 || err.status === 403) {
            return of(null);
          }
          return throwError(() => err);
        }),
      );
  }

  /** Registra a entrega com o PDF (multipart: trabalhoId, alunoId, dataEntrega, arquivo). */
  cadastrar(dados: FormData): Observable<EntregaListItem> {
    return this.http
      .post<unknown>(ENTREGAS_URL, dados, this.auth.getAuthOptions())
      .pipe(
        map((body) =>
          this.normalizarEntrega((body ?? {}) as Record<string, unknown>),
        ),
      );
  }

  /** Atualiza a entrega; o arquivo é opcional (mantém o PDF atual se não enviado). */
  atualizar(
    alunoId: number | string,
    trabalhoId: number | string,
    dados: FormData,
  ): Observable<EntregaListItem> {
    return this.http
      .put<unknown>(
        `${ENTREGAS_URL}/aluno/${alunoId}/trabalho/${trabalhoId}`,
        dados,
        this.auth.getAuthOptions(),
      )
      .pipe(
        map((body) =>
          this.normalizarEntrega((body ?? {}) as Record<string, unknown>),
        ),
      );
  }

  /** Baixa o PDF da entrega como blob (a rota exige o token no header). */
  baixarPdf(id: number | string): Observable<Blob> {
    return this.http.get(`${ENTREGAS_URL}/${id}/pdf`, {
      headers: this.auth.getAuthHeaders(),
      responseType: 'blob',
    });
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
      caminhoArquivoPdf:
        item['caminhoArquivoPdf'] != null
          ? String(item['caminhoArquivoPdf'])
          : undefined,
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
