import { PageResult } from '../models/page.model';

/**
 * Converte a resposta paginada da API (PageResponseDTO) em PageResult,
 * normalizando cada item com a função recebida.
 */
export function extrairPaginaApi<T>(
  body: unknown,
  normalizar: (item: Record<string, unknown>) => T,
): PageResult<T> {
  const itens = extrairListaApi(body).map(normalizar);

  const objeto =
    body && typeof body === 'object' && !Array.isArray(body)
      ? (body as Record<string, unknown>)
      : {};

  const numero = (chave: string, padrao: number): number => {
    const valor = objeto[chave];
    return valor != null && !Number.isNaN(Number(valor))
      ? Number(valor)
      : padrao;
  };

  const totalElements = numero('totalElements', itens.length);
  const size = numero('size', itens.length || 10);
  const totalPages = numero(
    'totalPages',
    size > 0 ? Math.max(1, Math.ceil(totalElements / size)) : 1,
  );
  const page = numero('page', 0);

  return {
    itens,
    page,
    size,
    totalElements,
    totalPages,
    first: objeto['first'] != null ? Boolean(objeto['first']) : page === 0,
    last:
      objeto['last'] != null ? Boolean(objeto['last']) : page >= totalPages - 1,
  };
}

/** Extrai array da resposta GET (lista direta ou paginada). */
export function extrairListaApi(body: unknown): Record<string, unknown>[] {
  if (Array.isArray(body)) {
    return body;
  }

  if (!body || typeof body !== 'object') {
    return [];
  }

  const objeto = body as Record<string, unknown>;
  const chaves = [
    'content',
    'data',
    'items',
    'results',
    'professores',
    'alunos',
    'disciplinas',
    'trabalhos',
    'entregas',
    'lista',
  ];

  for (const chave of chaves) {
    const valor = objeto[chave];
    if (Array.isArray(valor)) {
      return valor as Record<string, unknown>[];
    }
  }

  return [];
}