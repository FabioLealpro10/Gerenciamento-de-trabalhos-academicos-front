import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { map, Observable } from 'rxjs';
import { ADMINS_URL } from '../config/api.config';
import {
  AdminCreateRequest,
  AdminCredenciaisRequest,
  AdminListItem,
} from '../models/admin.model';
import { PageQuery, PageResult } from '../models/page.model';
import { MensagemResponse } from '../models/api-response.model';
import { extrairPaginaApi } from '../utils/api-list.util';
import { AuthService } from './auth.service';

const API_URL = ADMINS_URL;

@Injectable({ providedIn: 'root' })
export class AdminsService {
  private readonly http = inject(HttpClient);
  private readonly auth = inject(AuthService);

  listarPagina(query: PageQuery): Observable<PageResult<AdminListItem>> {
    return this.http
      .get<unknown>(`${API_URL}?page=${query.page}&size=${query.size}`, {
        headers: this.auth.getAuthHeaders(),
      })
      .pipe(
        map((body) =>
          extrairPaginaApi(body, (item) => this.normalizarAdmin(item)),
        ),
      );
  }

  cadastrar(payload: AdminCreateRequest): Observable<unknown> {
    return this.http.post(API_URL, payload, {
      headers: this.auth.getAuthHeaders(),
    });
  }

  excluir(id: number | string): Observable<MensagemResponse> {
    return this.http.delete<MensagemResponse>(`${API_URL}/${id}`, {
      headers: this.auth.getAuthHeaders(),
    });
  }

  atualizarCredenciais(
    id: number | string,
    payload: AdminCredenciaisRequest,
  ): Observable<unknown> {
    return this.http.patch(`${API_URL}/${id}/credenciais`, payload, {
      headers: this.auth.getAuthHeaders(),
    });
  }

  private normalizarAdmin(item: Record<string, unknown>): AdminListItem {
    return {
      id: item['id'] as number | string | undefined,
      nome: String(item['nome'] ?? ''),
      email: String(item['email'] ?? ''),
      role: item['role'] != null ? String(item['role']) : 'ADMIN',
    };
  }
}
