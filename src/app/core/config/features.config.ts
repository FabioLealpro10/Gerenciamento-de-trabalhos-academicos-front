import { FeatureItem } from '../models/user.model';

export const FEATURES: FeatureItem[] = [
  {
    id: 'admins',
    titulo: 'Gerenciar Administradores',
    icone: 'admin_panel_settings',
    roles: ['ADMIN'],
    superAdminOnly: true,
  },
  {
    id: 'usuarios',
    titulo: 'Gerenciar Alunos',
    icone: 'groups',
    roles: ['ADMIN'],
  },
  {
    id: 'professores',
    titulo: 'Gerenciar Professores',
    icone: 'school',
    roles: ['ADMIN'],
  },
  {
    id: 'disciplinas',
    titulo: 'Gerenciar Disciplinas',
    icone: 'menu_book',
    roles: ['ADMIN'],
  },
  {
    id: 'todos-trabalhos',
    titulo: 'Todos os Trabalhos',
    icone: 'assignment',
    roles: ['ADMIN'],
  },
  {
    id: 'avaliar-entregas',
    titulo: 'Avaliar Entregas',
    icone: 'grading',
    roles: ['PROFESSOR'],
  },
  {
    id: 'alunos-orientandos',
    titulo: 'Alunos Orientandos',
    icone: 'supervisor_account',
    roles: ['PROFESSOR'],
  },
  {
    id: 'temas-pesquisa',
    titulo: 'Temas de Pesquisa',
    icone: 'lightbulb',
    roles: ['PROFESSOR'],
  },
  {
    id: 'meus-trabalhos',
    titulo: 'Meus Trabalhos',
    icone: 'assignment_turned_in',
    roles: ['ALUNO'],
  },
  {
    id: 'entregar-trabalho',
    titulo: 'Entregar Trabalho',
    icone: 'upload_file',
    roles: ['ALUNO'],
  },
  {
    id: 'minhas-notas',
    titulo: 'Minhas Notas',
    icone: 'star_rate',
    roles: ['ALUNO'],
  },
  {
    id: 'orientador',
    titulo: 'Meu Orientador',
    icone: 'person_search',
    roles: ['ALUNO'],
  },
];
