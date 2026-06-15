import { AlunoUpdateRequest } from '../models/aluno.model';

export interface AlunoFormFields {
  nome: string;
  email: string;
  password: string;
  turma: string;
}

export function validarCadastroAluno(
  form: AlunoFormFields,
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

  if (!campoPreenchido(form.turma)) {
    return 'Preencha a turma.';
  }

  return null;
}

export function validarEdicaoAluno(form: AlunoFormFields): string | null {
  if (!campoPreenchido(form.nome)) {
    return 'Preencha o nome.';
  }

  if (!campoPreenchido(form.email)) {
    return 'Preencha o email.';
  }

  if (!campoPreenchido(form.turma)) {
    return 'Preencha a turma.';
  }

  const senha = form.password.trim();
  if (senha.length > 0 && senha.length < 8) {
    return 'Se informar senha, use no mínimo 8 caracteres.';
  }

  return null;
}

export function validarEdicaoAlunoPerfil(
  form: Pick<AlunoFormFields, 'nome' | 'email' | 'password'>,
): string | null {
  if (!campoPreenchido(form.nome)) {
    return 'Preencha o nome.';
  }

  if (!campoPreenchido(form.email)) {
    return 'Preencha o email.';
  }

  const senha = form.password.trim();
  if (senha.length > 0 && senha.length < 8) {
    return 'Se informar senha, use no mínimo 8 caracteres.';
  }

  return null;
}

export function montarPayloadEdicaoAluno(
  id: number | string,
  form: AlunoFormFields & { role?: string },
): AlunoUpdateRequest {
  const payload: AlunoUpdateRequest = {
    id: Number(id),
    nome: form.nome.trim(),
    email: form.email.trim(),
    role: form.role ?? 'ALUNO',
    turma: form.turma.trim(),
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
