import { EntregaListItem } from '../models/trabalho.model';

/** Entrega já corrigida pelo professor (nota ou feedback informado). */
export function entregaFoiCorrigida(entrega: EntregaListItem | null): boolean {
  if (!entrega) {
    return false;
  }

  if (entrega.nota != null) {
    return true;
  }

  return !!entrega.feedback?.trim();
}
