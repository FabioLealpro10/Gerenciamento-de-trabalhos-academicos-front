export interface TrabalhoFormFields {
  titulo: string;
  descricao: string;
  dataInicio: string;
  dataFim: string;
  disciplinaId: number | null;
}

export function validarCadastroTrabalho(
  form: TrabalhoFormFields,
): string | null {
  if (!campoPreenchido(form.titulo)) {
    return 'Preencha o título do trabalho.';
  }

  if (!campoPreenchido(form.descricao)) {
    return 'Preencha a descrição.';
  }

  if (!campoPreenchido(form.dataInicio)) {
    return 'Preencha a data de início.';
  }

  if (!campoPreenchido(form.dataFim)) {
    return 'Preencha a data de fim.';
  }

  if (form.dataFim < form.dataInicio) {
    return 'A data de fim não pode ser anterior à data de início.';
  }

  if (form.disciplinaId == null || form.disciplinaId <= 0) {
    return 'Selecione uma disciplina.';
  }

  return null;
}

export function validarEdicaoTrabalho(form: TrabalhoFormFields): string | null {
  return validarCadastroTrabalho(form);
}

function campoPreenchido(valor: string): boolean {
  return valor.trim().length > 0;
}
