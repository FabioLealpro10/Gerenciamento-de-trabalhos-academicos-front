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

  const mensagemBackend = extrairMensagemBackend(erro);
  if (mensagemBackend && !isMensagemAutenticacao(mensagemBackend)) {
    return mensagemBackend;
  }

  if (isErroSessaoInvalida(erro)) {
    return MENSAGEM_SESSAO_EXPIRADA;
  }

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
  if (corpo instanceof Blob) {
    return null;
  }

  if (typeof corpo === 'string') {
    const texto = corpo.trim();
    if (!texto) {
      return null;
    }

    if (texto.startsWith('{') || texto.startsWith('[')) {
      try {
        return extrairMensagemApi(JSON.parse(texto));
      } catch {
        const parcial = extrairMensagemJsonParcial(texto);
        return parcial ?? texto;
      }
    }

    const parcial = extrairMensagemJsonParcial(texto);
    if (parcial) {
      return parcial;
    }

    return texto;
  }

  if (corpo && typeof corpo === 'object') {
    const dados = corpo as Record<string, unknown>;
    for (const chave of ['mensagem', 'message', 'detail', 'error', 'title']) {
      const valor = dados[chave];
      if (typeof valor === 'string' && valor.trim()) {
        return valor.trim();
      }
    }
  }

  return null;
}

function extrairMensagemJsonParcial(texto: string): string | null {
  const match = texto.match(/"mensagem"\s*:\s*"((?:\\.|[^"\\])*)"/i);
  if (match?.[1]) {
    return match[1].replace(/\\"/g, '"').trim();
  }

  const matchMessage = texto.match(/"message"\s*:\s*"((?:\\.|[^"\\])*)"/i);
  if (matchMessage?.[1]) {
    return matchMessage[1].replace(/\\"/g, '"').trim();
  }

  return null;
}

export function isMensagemAutenticacao(
  mensagem: string | null | undefined,
): boolean {
  if (!mensagem) {
    return false;
  }

  const normalizada = mensagem.trim().toLowerCase();
  const mensagensAutenticacao = new Set([
    'access denied',
    'forbidden',
    'acesso negado.',
    'acesso negado',
    'unauthorized',
    'nao autorizado',
    'não autorizado',
    'token expirado',
    'token inválido',
    'token invalido',
    'sessão expirada',
    'sessao expirada',
    'sessão expirada. faça login novamente.',
    'sessao expirada. faca login novamente.',
  ]);

  return mensagensAutenticacao.has(normalizada);
}

/** @deprecated Use isMensagemAutenticacao */
export function isMensagemAcessoNegado(mensagem: string | null | undefined): boolean {
  return isMensagemAutenticacao(mensagem);
}

export function isErroSessaoInvalida(erro: HttpErrorResponse): boolean {
  if (erro.status === 401) {
    return true;
  }

  if (erro.status === 403) {
    const mensagem = extrairMensagemApi(erro.error);
    if (!mensagem) {
      return true;
    }

    return isMensagemAutenticacao(mensagem);
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
