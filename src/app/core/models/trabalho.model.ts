export interface TrabalhoListItem {
  id?: number | string;
  titulo: string;
  descricao?: string;
  caminhoArquivoPdf?: string;
  dataInicio?: string;
  dataFim?: string;
  disciplinaId?: number;
  disciplinaNome?: string;
}

export interface EntregaCorrigirRequest {
  nota: number;
  feedback: string;
}

export interface EntregaListItem {
  id?: number | string;
  caminhoArquivoPdf?: string;
  dataEntrega?: string;
  nota?: number;
  feedback?: string;
  trabalhoId?: number;
  trabalhoTitulo?: string;
  alunoId?: number;
  alunoNome?: string;
}
