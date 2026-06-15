export interface AlunoCreateRequest {
  nome: string;
  email: string;
  password: string;
  role: string;
  turma: string;
}

export interface AlunoUpdateRequest {
  id: number;
  nome: string;
  email: string;
  role: string;
  turma: string;
  password?: string;
}

export interface UsuarioListItem {
  id?: number | string;
  nome: string;
  email: string;
  role?: string;
  turma?: string;
}

