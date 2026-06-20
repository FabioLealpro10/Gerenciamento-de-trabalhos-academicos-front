import { HttpErrorResponse } from '@angular/common/http';

export const MENSAGEM_SESSAO_EXPIRADA = 'Sessão expirada. Faça login novamente.';

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
    return 'Não foi possível conectar ao servidor.';
  }

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

  if (isErroSessaoInvalida(erro)) {
    return MENSAGEM_SESSAO_EXPIRADA;
  }

  const mensagemBackend = extrairMensagemBackend(erro);
  if (mensagemBackend) {
    return mensagemBackend;
  }

  if (status === 401 || status === 403) {
    if (!opcoes.temToken) {
      return MENSAGEM_SESSAO_EXPIRADA;
    }

    return 'Acesso negado.';
  }

  if (opcoes.contexto === 'listar') {
    return `Erro ao carregar ${opcoes.entidade}.`;
  }

  if (opcoes.contexto === 'excluir') {
    return `Erro ao excluir ${opcoes.entidade}.`;
  }

  return `Erro ao salvar ${opcoes.entidade}.`;
}

export function extrairMensagemApi(corpo: unknown): string | null {
  if (typeof corpo === 'string') {
    const texto = corpo.trim();
    if (!texto) {
      return null;
    }

    if (texto.startsWith('{') || texto.startsWith('[')) {
      try {
        return extrairMensagemApi(JSON.parse(texto));
      } catch {
        return texto;
      }
    }

    return texto;
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

export function isMensagemAcessoNegado(mensagem: string | null | undefined): boolean {
  if (!mensagem) {
    return false;
  }

  const normalizada = mensagem.trim().toLowerCase();
  return (
    normalizada.includes('access denied') ||
    normalizada.includes('acesso negado') ||
    normalizada.includes('token expirado') ||
    normalizada.includes('token inválido') ||
    normalizada.includes('token invalido') ||
    normalizada.includes('sessão expirada') ||
    normalizada.includes('sessao expirada')
  );
}

export function isErroSessaoInvalida(erro: HttpErrorResponse): boolean {
  if (erro.status === 401) {
    return true;
  }

  if (erro.status === 403) {
    return isMensagemAcessoNegado(extrairMensagemApi(erro.error));
  }

  return false;
}

export function mensagemRespostaApi(
  resposta: unknown,
  fallback = '',
): string {
  return extrairMensagemApi(resposta) ?? fallback;
}

function extrairMensagemBackend(erro: HttpErrorResponse): string | null {
  return extrairMensagemApi(erro.error);
}
