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