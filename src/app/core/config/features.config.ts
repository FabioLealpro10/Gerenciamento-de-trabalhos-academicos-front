import { FeatureItem } from '../models/user.model';

export const FEATURES: FeatureItem[] = [
  {
    id: 'usuarios',
    titulo: 'Gerenciar Alunos',
    descricao: 'Listar, cadastrar, editar e excluir alunos.',
    roles: ['ADMIN'],
  },
  {
    id: 'professores',
    titulo: 'Gerenciar Professores',
    descricao: 'Listar, cadastrar, editar e excluir professores.',
    roles: ['ADMIN'],
  },
  {
    id: 'disciplinas',
    titulo: 'Gerenciar Disciplinas',
    descricao: 'Listar e cadastrar disciplinas vinculadas a professores.',
    roles: ['ADMIN'],
  },
  {
    id: 'todos-trabalhos',
    titulo: 'Todos os Trabalhos',
    descricao: 'Visualizar e acompanhar todos os trabalhos acadêmicos.',
    roles: ['ADMIN'],
  },
  {
    id: 'relatorios',
    titulo: 'Relatórios',
    descricao: 'Gerar relatórios gerais do sistema.',
    roles: ['ADMIN'],
  },
  {
    id: 'avaliar-entregas',
    titulo: 'Avaliar Entregas',
    descricao: 'Corrigir e atribuir notas às entregas dos alunos.',
    roles: ['PROFESSOR'],
  },
  {
    id: 'alunos-orientandos',
    titulo: 'Alunos Orientandos',
    descricao: 'Acompanhar alunos sob sua orientação.',
    roles: ['PROFESSOR'],
  },
  {
    id: 'temas-pesquisa',
    titulo: 'Temas de Pesquisa',
    descricao: 'Definir e gerenciar temas disponíveis para TCC.',
    roles: ['PROFESSOR'],
  },
  {
    id: 'meus-trabalhos',
    titulo: 'Meus Trabalhos',
    descricao: 'Consultar trabalhos atribuídos e prazos.',
    roles: ['ALUNO'],
  },
  {
    id: 'entregar-trabalho',
    titulo: 'Entregar Trabalho',
    descricao: 'Enviar arquivos e registrar entregas.',
    roles: ['ALUNO'],
  },
  {
    id: 'minhas-notas',
    titulo: 'Minhas Notas',
    descricao: 'Visualizar notas e feedback dos professores.',
    roles: ['ALUNO'],
  },
  {
    id: 'orientador',
    titulo: 'Meu Orientador',
    descricao: 'Ver dados do professor orientador.',
    roles: ['ALUNO'],
  },
];
