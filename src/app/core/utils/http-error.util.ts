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

  if (status === 403 && opcoes.contexto === 'salvar' && !opcoes.modoEdicao) {
    return 'Este e-mail já está em uso. Utilize outro e-mail para cadastrar.';
  }

  if (status === 403 && opcoes.contexto === 'salvar' && opcoes.modoEdicao) {
    return 'Este e-mail já está em uso por outro usuário.';
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
