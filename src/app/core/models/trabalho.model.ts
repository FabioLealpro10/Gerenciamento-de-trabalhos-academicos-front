export interface TrabalhoCreateRequest {
  titulo: string;
  descricao: string;
  linkArquivoTrabalho: string;
  dataInicio: string;
  dataFim: string;
  disciplinaId: number;
}

export interface TrabalhoUpdateRequest extends TrabalhoCreateRequest {}

export interface TrabalhoListItem {
  id?: number | string;
  titulo: string;
  descricao?: string;
  linkArquivoTrabalho?: string;
  dataInicio?: string;
  dataFim?: string;
  disciplinaId?: number;
  disciplinaNome?: string;
}

export interface EntregaCorrigirRequest {
  nota: number;
  feedback: string;
}

export interface EntregaCreateRequest {
  linkArquivo: string;
  dataEntrega: string;
  trabalhoId: number;
  alunoId: number;
}

export interface EntregaUpdateRequest {
  linkArquivo: string;
  dataEntrega: string;
}

export interface EntregaListItem {
  id?: number | string;
  linkArquivo?: string;
  dataEntrega?: string;
  nota?: number;
  feedback?: string;
  trabalhoId?: number;
  trabalhoTitulo?: string;
  alunoId?: number;
  alunoNome?: string;
}
