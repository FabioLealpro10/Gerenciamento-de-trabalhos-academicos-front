/** Data local no formato yyyy-MM-dd (dia/mês/ano para APIs Java). */
export function dataEntregaHoje(): string {
  const hoje = new Date();
  const ano = hoje.getFullYear();
  const mes = String(hoje.getMonth() + 1).padStart(2, '0');
  const dia = String(hoje.getDate()).padStart(2, '0');
  return `${ano}-${mes}-${dia}`;
}

/** Exibe data em dd/MM/yyyy quando vier como yyyy-MM-dd ou ISO. */
export function formatarDataBr(data?: string): string {
  if (!data?.trim()) {
    return '-';
  }

  const parte = data.slice(0, 10);
  const [ano, mes, dia] = parte.split('-');
  if (ano && mes && dia) {
    return `${dia}/${mes}/${ano}`;
  }

  return data;
}
