export type TipoUsuario = 'ADMIN' | 'PROFESSOR' | 'ALUNO';

export interface Usuario {
  id?: number | string;
  nome: string;
  email: string;
  tipo: TipoUsuario;
}

export interface LoginResponse {
  token?: string;
  accessToken?: string;
  access_token?: string;
  jwt?: string;
  nome?: string;
  email?: string;
  tipo?: string;
  role?: string;
  tipoUsuario?: string;
  id?: number | string;
  idUsuario?: number | string;
  idProfessor?: number | string;
  idAluno?: number | string;
  usuario?: {
    id?: number | string;
    nome?: string;
    email?: string;
    tipo?: string;
    role?: string;
    tipoUsuario?: string;
  };
}

export interface FeatureItem {
  id: string;
  titulo: string;
  descricao: string;
  icone: string;
  roles: TipoUsuario[];
  /** Visível apenas para o administrador principal (id 1). */
  superAdminOnly?: boolean;
}

export type LoginResult =
  | { ok: true }
  | { ok: false; message: string };
