import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { map, Observable } from 'rxjs';
import { TRABALHOS_URL } from '../config/api.config';
import { TrabalhoListItem } from '../models/trabalho.model';
import { PageQuery, PageResult } from '../models/page.model';
import { extrairListaApi, extrairPaginaApi } from '../utils/api-list.util';
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

  listarPagina(query: PageQuery): Observable<PageResult<TrabalhoListItem>> {
    return this.http
      .get<unknown>(
        `${API_URL}?page=${query.page}&size=${query.size}`,
        this.auth.getAuthOptions(),
      )
      .pipe(
        map((body) =>
          extrairPaginaApi(body, (item) => this.normalizarTrabalho(item)),
        ),
      );
  }

  /** Pesquisa por subpalavra do título (GET /trabalhos/pesquisar). */
  pesquisarPagina(
    nome: string,
    query: PageQuery,
  ): Observable<PageResult<TrabalhoListItem>> {
    return this.http
      .get<unknown>(
        `${API_URL}/pesquisar?nome=${encodeURIComponent(nome)}&page=${query.page}&size=${query.size}`,
        this.auth.getAuthOptions(),
      )
      .pipe(
        map((body) =>
          extrairPaginaApi(body, (item) => this.normalizarTrabalho(item)),
        ),
      );
  }

  listarPorDisciplinaPagina(
    disciplinaId: number | string,
    query: PageQuery,
  ): Observable<PageResult<TrabalhoListItem>> {
    return this.http
      .get<unknown>(
        `${API_URL}/disciplina/${disciplinaId}?page=${query.page}&size=${query.size}`,
        this.auth.getAuthOptions(),
      )
      .pipe(
        map((body) =>
          extrairPaginaApi(body, (item) => this.normalizarTrabalho(item)),
        ),
      );
  }

  buscarPorId(id: number | string): Observable<TrabalhoListItem> {
    return this.http
      .get<Record<string, unknown>>(`${API_URL}/${id}`, this.auth.getAuthOptions())
      .pipe(map((item) => this.normalizarTrabalho(item)));
  }

  cadastrar(dados: FormData) {
    return this.http.post(API_URL, dados, this.auth.getAuthOptions());
  }

  atualizar(
    id: string,
    dados: FormData
  ) {

    return this.http.put(
      `${API_URL}/${id}`,
      dados,
      this.auth.getAuthOptions()
    );
  }

  excluir(id: number | string): Observable<void> {
    return this.http.delete<void>(`${API_URL}/${id}`, this.auth.getAuthOptions());
  }

  /** Baixa o PDF do trabalho como blob (a rota exige o token no header). */
  baixarPdf(id: number | string): Observable<Blob> {
    return this.http.get(`${API_URL}/${id}/pdf`, {
      headers: this.auth.getAuthHeaders(),
      responseType: 'blob',
    });
  }

  private normalizarTrabalho(item: Record<string, unknown>): TrabalhoListItem {
    const id = item['id'] ?? item['idTrabalho'];

    return {
      id: id as number | string | undefined,
      titulo: String(item['titulo'] ?? ''),
      descricao:
        item['descricao'] != null ? String(item['descricao']) : undefined,
      caminhoArquivoPdf:
        item['caminhoArquivoPdf'] != null
          ? String(item['caminhoArquivoPdf'])
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
