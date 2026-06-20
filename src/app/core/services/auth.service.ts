import { Injectable, PLATFORM_ID, inject } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { HttpClient, HttpErrorResponse, HttpHeaders } from '@angular/common/http';
import { Observable, catchError, map, of } from 'rxjs';
import { AUTH_ESQUECI_SENHA_URL, AUTH_LOGIN_URL, AUTH_VERIFICAR_CODIGO_URL } from '../config/api.config';
import {
  EsqueciSenhaResponse,
  EsqueciSenhaResult,
  LoginResponse,
  LoginResult,
  TipoUsuario,
  Usuario,
} from '../models/user.model';

/** ID do administrador principal com permissão de gerenciar outros admins. */
export const ADMIN_MASTER_ID = 1;
const TOKEN_KEY = 'token';
const USER_KEY = 'usuario';
const API_URL = AUTH_LOGIN_URL;

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly platformId = inject(PLATFORM_ID);
  private usuarioAtual: Usuario | null = null;
  private tokenMemoria: string | null = null;

  login(email: string, password: string): Observable<LoginResult> {
    return this.http
      .post<LoginResponse>(API_URL, { email, password }, { observe: 'response' })
      .pipe(
        map((response) => {
          const headerAuth =
            response.headers.get('Authorization') ??
            response.headers.get('authorization');

          const salvou = this.salvarSessao(
            response.body ?? {},
            email,
            headerAuth,
          );

          if (!salvou) {
            return {
              ok: false as const,
              message:
                'Token não retornado pela API. Verifique o endpoint de login.',
            };
          }

          return { ok: true as const };
        }),
        catchError((erro: HttpErrorResponse) =>
          of({ ok: false as const, message: this.mensagemErroLogin(erro) }),
        ),
      );
  }

  esqueciSenha(email: string): Observable<EsqueciSenhaResult> {
    return this.http
      .post<EsqueciSenhaResponse>(AUTH_ESQUECI_SENHA_URL, { email: email.trim() })
      .pipe(
        map((body) => ({
          ok: true as const,
          data: {
            emailCadastrado: Boolean(body.emailCadastrado),
            mensagem: String(body.mensagem ?? ''),
          },
        })),
        catchError((erro: HttpErrorResponse) =>
          of({
            ok: false as const,
            message: this.mensagemErroRecuperacao(erro, 'solicitar recuperação'),
          }),
        ),
      );
  }

  verificarCodigo(email: string, codigo: string): Observable<LoginResult> {
    return this.http
      .post<LoginResponse>(
        AUTH_VERIFICAR_CODIGO_URL,
        { email: email.trim(), codigo: codigo.trim() },
        { observe: 'response' },
      )
      .pipe(
        map((response) => {
          const headerAuth =
            response.headers.get('Authorization') ??
            response.headers.get('authorization');

          const salvou = this.salvarSessao(
            response.body ?? {},
            email,
            headerAuth,
          );

          if (!salvou) {
            return {
              ok: false as const,
              message:
                'Token não retornado pela API. Verifique o código informado.',
            };
          }

          return { ok: true as const };
        }),
        catchError((erro: HttpErrorResponse) =>
          of({
            ok: false as const,
            message: this.mensagemErroRecuperacao(erro, 'verificar código'),
          }),
        ),
      );
  }

  private mensagemErroRecuperacao(
    erro: HttpErrorResponse,
    contexto: string,
  ): string {
    const mensagemApi = this.extrairMensagemErro(erro);

    if (mensagemApi) {
      return mensagemApi;
    }

    if (erro.status === 0) {
      return 'Não foi possível conectar ao servidor. Verifique se a API está em execução.';
    }

    return `Erro ao ${contexto}. Tente novamente.`;
  }

  private extrairMensagemErro(erro: HttpErrorResponse): string | null {
    const body = erro.error;

    if (typeof body === 'string' && body.trim()) {
      return body.trim();
    }

    if (body && typeof body === 'object') {
      const objeto = body as Record<string, unknown>;
      const chaves = ['mensagem', 'message', 'erro', 'error'];

      for (const chave of chaves) {
        const valor = objeto[chave];
        if (typeof valor === 'string' && valor.trim()) {
          return valor.trim();
        }
      }
    }

    return null;
  }

  private mensagemErroLogin(erro: HttpErrorResponse): string {
    if (erro.status === 401 || erro.status === 403) {
      return 'Email ou senha inválidos';
    }

    if (erro.status === 0) {
      return 'Não foi possível conectar ao servidor. Verifique se a API está em execução.';
    }

    return 'Falha de autenticação';
  }

  logout(): void {
    this.usuarioAtual = null;
    this.tokenMemoria = null;
    this.getStorage()?.removeItem(TOKEN_KEY);
    this.getStorage()?.removeItem(USER_KEY);
  }

  isAuthenticated(): boolean {
    return this.sessaoValida();
  }

  sessaoValida(): boolean {
    const token = this.getToken();
    if (!token) {
      return false;
    }

    if (this.isTokenExpirado(token)) {
      this.logout();
      return false;
    }

    return true;
  }

  isTokenExpirado(token: string): boolean {
    try {
      const partes = token.split('.');
      if (partes.length < 2) {
        return false;
      }

      const payload = JSON.parse(this.decodificarBase64Url(partes[1])) as {
        exp?: number;
      };

      if (payload.exp == null) {
        return false;
      }

      return Date.now() >= payload.exp * 1000;
    } catch {
      return false;
    }
  }

  getToken(): string | null {
    if (this.tokenMemoria) {
      return this.tokenMemoria;
    }

    const valor = this.getStorage()?.getItem(TOKEN_KEY);
    if (!valor) {
      return null;
    }

    const token = valor.replace(/^Bearer\s+/i, '').trim() || null;
    this.tokenMemoria = token;
    return token;
  }

  /** Token salvo no login (localStorage) — header Authorization para a API */
  getAuthHeaders(): HttpHeaders {
    const token = this.getToken();
    if (!token) {
      return new HttpHeaders();
    }

    return new HttpHeaders({
      Authorization: `Bearer ${token}`,
    });
  }

  /** Opções HTTP com Bearer — use em todas as chamadas autenticadas */
  getAuthOptions(): { headers: HttpHeaders } {
    return { headers: this.getAuthHeaders() };
  }

  getUsuario(): Usuario | null {
    if (this.usuarioAtual) {
      return this.usuarioAtual;
    }

    const dados = this.getStorage()?.getItem(USER_KEY);
    if (!dados) {
      return null;
    }

    try {
      this.usuarioAtual = JSON.parse(dados) as Usuario;
      return this.usuarioAtual;
    } catch {
      return null;
    }
  }

  getTipoUsuario(): TipoUsuario | null {
    return this.getUsuario()?.tipo ?? null;
  }

  isAdminMaster(): boolean {
    if (this.getTipoUsuario() !== 'ADMIN') {
      return false;
    }

    const id = this.getUsuarioId();
    return id != null && Number(id) === ADMIN_MASTER_ID;
  }

  getUsuarioId(): number | string | null {
    const id = this.getUsuario()?.id;
    if (id != null) {
      return id;
    }

    return this.getIdFromToken();
  }

  atualizarDadosUsuario(dados: Partial<Pick<Usuario, 'nome' | 'email'>>): void {
    const usuario = this.getUsuario();
    if (!usuario) {
      return;
    }

    const atualizado: Usuario = {
      ...usuario,
      ...dados,
    };

    this.usuarioAtual = atualizado;
    this.getStorage()?.setItem(USER_KEY, JSON.stringify(atualizado));
  }

  /** ID do usuário dentro do JWT (quando o login não devolve id no JSON). */
  getIdFromToken(): number | string | null {
    const token = this.getToken();
    if (!token) {
      return null;
    }

    const id = this.extrairIdDoJwt(token);
    return id != null ? id : null;
  }

  private salvarSessao(
    resposta: LoginResponse,
    emailLogin: string,
    headerAuth?: string | null,
  ): boolean {
    const storage = this.getStorage();
    if (!storage) {
      return false;
    }

    let token =
      this.extrairToken(resposta as Record<string, unknown>) ??
      this.tokenDoHeader(headerAuth);

    if (!token) {
      return false;
    }

    this.tokenMemoria = token;
    storage.setItem(TOKEN_KEY, token);

    let id = this.extrairIdUsuario(resposta as Record<string, unknown>);
    if (id == null) {
      id = this.extrairIdDoJwt(token) ?? undefined;
    }

    const usuario: Usuario = {
      id,
      nome: resposta.usuario?.nome ?? resposta.nome ?? emailLogin,
      email: resposta.usuario?.email ?? resposta.email ?? emailLogin,
      tipo: this.normalizarTipo(
        resposta.usuario?.tipo ??
          resposta.usuario?.role ??
          resposta.usuario?.tipoUsuario ??
          resposta.tipo ??
          resposta.role ??
          resposta.tipoUsuario,
      ),
    };

    this.usuarioAtual = usuario;
    storage.setItem(USER_KEY, JSON.stringify(usuario));
    return true;
  }

  private extrairIdDoJwt(token: string): number | string | undefined {
    try {
      const partes = token.split('.');
      if (partes.length < 2) {
        return undefined;
      }

      const payload = JSON.parse(this.decodificarBase64Url(partes[1])) as Record<
        string,
        unknown
      >;

      return this.extrairIdUsuario(payload);
    } catch {
      return undefined;
    }
  }

  private decodificarBase64Url(valor: string): string {
    const base64 = valor.replace(/-/g, '+').replace(/_/g, '/');
    const padding = '='.repeat((4 - (base64.length % 4)) % 4);
    return atob(base64 + padding);
  }

  private extrairIdUsuario(resposta: Record<string, unknown>): number | string | undefined {
    const chaves = [
      'id',
      'idUsuario',
      'idProfessor',
      'idAluno',
      'usuarioId',
      'userId',
    ];

    for (const chave of chaves) {
      const valor = resposta[chave];
      if (valor != null && valor !== '') {
        return valor as number | string;
      }
    }

    for (const aninhado of ['usuario', 'user', 'data']) {
      const inner = resposta[aninhado];
      if (inner && typeof inner === 'object' && !Array.isArray(inner)) {
        const id = this.extrairIdUsuario(inner as Record<string, unknown>);
        if (id != null) {
          return id;
        }
      }
    }

    return undefined;
  }

  private tokenDoHeader(headerAuth?: string | null): string | null {
    if (!headerAuth?.trim()) {
      return null;
    }

    return headerAuth.replace(/^Bearer\s+/i, '').trim() || null;
  }

  private extrairToken(resposta: Record<string, unknown>): string | null {
    const chaves = [
      'token',
      'accessToken',
      'access_token',
      'jwt',
      'Token',
      'JWT',
    ];

    for (const chave of chaves) {
      const valor = resposta[chave];
      if (typeof valor === 'string' && valor.trim()) {
        return valor.replace(/^Bearer\s+/i, '').trim();
      }
    }

    for (const aninhado of ['data', 'usuario', 'user', 'auth']) {
      const inner = resposta[aninhado];
      if (inner && typeof inner === 'object' && !Array.isArray(inner)) {
        const token = this.extrairToken(inner as Record<string, unknown>);
        if (token) {
          return token;
        }
      }
    }

    return null;
  }

  private normalizarTipo(tipo?: string): TipoUsuario {
    const valor = (tipo ?? 'ALUNO').toUpperCase();

    if (valor.includes('ADMIN')) {
      return 'ADMIN';
    }

    if (valor.includes('PROF') || valor.includes('ORIENT')) {
      return 'PROFESSOR';
    }

    return 'ALUNO';
  }

  private getStorage(): Storage | null {
    if (isPlatformBrowser(this.platformId)) {
      return localStorage;
    }

    return null;
  }
}
