export interface AdminListItem {
  id?: number | string;
  nome: string;
  email: string;
  role?: string;
}

export interface AdminCreateRequest {
  nome: string;
  email: string;
  password: string;
}

export interface AdminCredenciaisRequest {
  email: string;
  password?: string;
}
