import { HttpErrorResponse } from '@angular/common/http';

export function mensagemErroHttp(
  erro: HttpErrorResponse,
  opcoes: {
    temToken: boolean;
    contexto: 'listar' | 'salvar' | 'excluir';
    entidade: string;
    modoEdicao?: boolean;
  },
): string {
  const status = erro.status;

  if (status === 0) {
    return 'Não foi possível conectar ao servidor. Verifique se a API está em execução.';
  }

  // Mensagem de e-mail duplicado só faz sentido para cadastros de usuários
  const entidadeComEmail = ['aluno', 'professor', 'usuário', 'usuario'].some(
    (nome) => opcoes.entidade.toLowerCase().includes(nome),
  );

  if (
    status === 403 &&
    opcoes.contexto === 'salvar' &&
    entidadeComEmail &&
    !opcoes.modoEdicao
  ) {
    return 'Este e-mail já está em uso. Utilize outro e-mail para cadastrar.';
  }

  if (
    status === 403 &&
    opcoes.contexto === 'salvar' &&
    entidadeComEmail &&
    opcoes.modoEdicao
  ) {
    return 'Este e-mail já está em uso por outro usuário.';
  }

  // Mensagem enviada pelo backend (ex.: "Arquivo PDF excede o limite de 8 MB")
  const mensagemBackend = extrairMensagemBackend(erro);
  if (mensagemBackend) {
    return mensagemBackend;
  }

  if (status === 401 || status === 403) {
    if (!opcoes.temToken) {
      return 'Token não encontrado. Faça logout, login novamente como ADMIN e tente de novo.';
    }

    if (opcoes.contexto === 'listar') {
      return `Acesso negado ao listar ${opcoes.entidade}. Faça login como ADMIN (o token precisa ser enviado no header Authorization).`;
    }

    return `Acesso negado. Faça login como ADMIN — o token foi enviado, mas a API recusou a operação.`;
  }

  if (opcoes.contexto === 'listar') {
    return `Erro ao carregar ${opcoes.entidade}. Verifique se a API está em execução.`;
  }

  if (opcoes.contexto === 'excluir') {
    return `Erro ao excluir ${opcoes.entidade}. Tente novamente.`;
  }

  return `Erro ao salvar ${opcoes.entidade}. Verifique os dados e tente novamente.`;
}

function extrairMensagemBackend(erro: HttpErrorResponse): string | null {
  const corpo = erro.error;

  if (typeof corpo === 'string' && corpo.trim()) {
    return corpo.trim();
  }

  if (corpo && typeof corpo === 'object') {
    const dados = corpo as Record<string, unknown>;
    for (const chave of ['mensagem', 'message', 'error']) {
      const valor = dados[chave];
      if (typeof valor === 'string' && valor.trim()) {
        return valor.trim();
      }
    }
  }

  return null;
}
