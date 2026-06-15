import { ProfessorUpdateRequest } from '../models/professor.model';

export interface ProfessorFormFields {
  nome: string;
  email: string;
  password: string;
  areaAtuacao: string;
}

export function validarCadastroProfessor(
  form: ProfessorFormFields,
): string | null {
  if (!campoPreenchido(form.nome)) {
    return 'Preencha o nome.';
  }

  if (!campoPreenchido(form.email)) {
    return 'Preencha o email.';
  }

  if (!campoPreenchido(form.password)) {
    return 'Preencha a senha.';
  }

  if (form.password.trim().length < 8) {
    return 'A senha deve ter no mínimo 8 caracteres.';
  }

  if (!campoPreenchido(form.areaAtuacao)) {
    return 'Preencha a área de atuação.';
  }

  return null;
}

export function validarEdicaoProfessor(
  form: ProfessorFormFields,
): string | null {
  if (!campoPreenchido(form.nome)) {
    return 'Preencha o nome.';
  }

  if (!campoPreenchido(form.email)) {
    return 'Preencha o email.';
  }

  if (!campoPreenchido(form.areaAtuacao)) {
    return 'Preencha a área de atuação.';
  }

  const senha = form.password.trim();
  if (senha.length > 0 && senha.length < 8) {
    return 'Se informar senha, use no mínimo 8 caracteres.';
  }

  return null;
}

export function montarPayloadEdicaoProfessor(
  id: number | string,
  form: ProfessorFormFields & { role?: string },
): ProfessorUpdateRequest {
  const payload: ProfessorUpdateRequest = {
    id: Number(id),
    nome: form.nome.trim(),
    email: form.email.trim(),
    role: form.role ?? 'PROFESSOR',
    areaAtuacao: form.areaAtuacao.trim(),
  };

  const senha = form.password.trim();
  if (senha.length >= 8) {
    payload.password = senha;
  }

  return payload;
}

function campoPreenchido(valor: string): boolean {
  return valor.trim().length > 0;
}
