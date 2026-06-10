export interface ProfessorCreateRequest {
  nome: string;
  email: string;
  password: string;
  role: string;
  areaAtuacao: string;
}

export interface ProfessorUpdateRequest {
  nome: string;
  email: string;
  role: string;
  areaAtuacao: string;
  password?: string;
}

export interface ProfessorListItem {
  id?: number | string;
  nome: string;
  email: string;
  role?: string;
  areaAtuacao?: string;
}
