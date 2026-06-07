export interface DisciplinaFormFields {
  nome: string;
  dataInicio: string;
  dataFim: string;
  idProfessor: number | null;
}

export function validarCadastroDisciplina(
  form: DisciplinaFormFields,
): string | null {
  if (!campoPreenchido(form.nome)) {
    return 'Preencha o nome da disciplina.';
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

  if (form.idProfessor == null || form.idProfessor <= 0) {
    return 'Selecione um professor.';
  }

  return null;
}

export function validarEdicaoDisciplina(
  form: DisciplinaFormFields,
): string | null {
  return validarCadastroDisciplina(form);
}

function campoPreenchido(valor: string): boolean {
  return valor.trim().length > 0;
}
