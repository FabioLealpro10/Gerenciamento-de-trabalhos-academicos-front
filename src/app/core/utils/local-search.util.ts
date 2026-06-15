/** Filtra itens por subpalavra em um ou mais campos de texto. */
export function filtrarPorTextoLocal<T>(
  itens: T[],
  termo: string,
  campos: Array<(item: T) => string | undefined | null>,
): T[] {
  const busca = termo.trim().toLowerCase();
  if (!busca) {
    return itens;
  }

  return itens.filter((item) =>
    campos.some((campo) => {
      const valor = campo(item);
      return valor != null && String(valor).toLowerCase().includes(busca);
    }),
  );
}
