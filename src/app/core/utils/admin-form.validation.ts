export interface AdminCadastroFields {
  nome: string;
  email: string;
  password: string;
}

export interface AdminCredenciaisFields {
  email: string;
  password: string;
}

export function validarCadastroAdmin(form: AdminCadastroFields): string | null {
  if (!campoPreenchido(form.nome)) {
    return 'Preencha o nome.';
  }

  if (!campoPreenchido(form.email)) {
    return 'Preencha o e-mail.';
  }

  if (!campoPreenchido(form.password)) {
    return 'Preencha a senha.';
  }

  if (form.password.trim().length < 8) {
    return 'A senha deve ter no mínimo 8 caracteres.';
  }

  return null;
}

export function validarCredenciaisAdmin(
  form: AdminCredenciaisFields,
): string | null {
  if (!campoPreenchido(form.email)) {
    return 'Preencha o e-mail.';
  }

  const senha = form.password.trim();
  if (senha.length > 0 && senha.length < 8) {
    return 'Se informar senha, use no mínimo 8 caracteres.';
  }

  return null;
}

export function montarPayloadCredenciaisAdmin(
  form: AdminCredenciaisFields,
): { email: string; password?: string } {
  const payload: { email: string; password?: string } = {
    email: form.email.trim(),
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
