/** Página devolvida pela API (PageResponseDTO do backend). */
export interface PageResult<T> {
  itens: T[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
  first: boolean;
  last: boolean;
}

/** Parâmetros de paginação enviados nos GETs. */
export interface PageQuery {
  page: number;
  size: number;
}

export const TAMANHOS_PAGINA = [5, 10, 20, 50];

export const PAGINA_INICIAL: PageQuery = { page: 0, size: 10 };
