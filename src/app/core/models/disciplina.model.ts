export interface DisciplinaCreateRequest {
  nome: string;
  dataInicio: string;
  dataFim: string;
  idProfessor: number;
}

export interface DisciplinaUpdateRequest extends DisciplinaCreateRequest {}

export interface DisciplinaListItem {
  id?: number | string;
  nome: string;
  dataInicio?: string;
  dataFim?: string;
  /** Nome do professor retornado pela API */
  professor?: string;
  idProfessor?: number;
  alunosMatriculados?: string[];
}

export interface MatriculaRequest {
  alunoId: number;
  disciplinaId: number;
}
