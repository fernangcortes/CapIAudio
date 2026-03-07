import { ModeConfig } from './types';

export const APP_MODES: Record<string, ModeConfig> = {
  interview: {
    id: 'interview',
    name: 'Entrevistas & Podcasts',
    icon: '🎙️',
    description: 'Para jornalistas e criadores de conteúdo.',
    defaultButtons: [
      { id: 'int-1', icon: '🔥', label: 'Citação', type: 'quote' },
      { id: 'int-2', icon: '😢', label: 'Emoção', type: 'emotion' },
      { id: 'int-3', icon: '⚠️', label: 'Off-the-Record', type: 'action' },
      { id: 'int-4', icon: '🤥', label: 'Fact-Check', type: 'action' },
      { id: 'int-5', icon: '✂️', label: 'Cortar', type: 'cut' },
      { id: 'int-6', icon: '🤫', label: 'Silêncio', type: 'action' },
    ],
  },
  lecture: {
    id: 'lecture',
    name: 'Palestras & Aulas',
    icon: '👨‍🏫',
    description: 'Foco em retenção de conhecimento acadêmico.',
    defaultButtons: [
      { id: 'lec-1', icon: '🚨', label: 'Cai na Prova', type: 'action' },
      { id: 'lec-2', icon: '❓', label: 'Não Entendi', type: 'action' },
      { id: 'lec-3', icon: '📚', label: 'Referência', type: 'action' },
      { id: 'lec-4', icon: '📅', label: 'Data da Prova', type: 'action' },
      { id: 'lec-5', icon: '🖼️', label: 'Novo Slide', type: 'action' },
    ],
  },
  meeting: {
    id: 'meeting',
    name: 'Reuniões Corporativas',
    icon: '💼',
    description: 'Gera atas automáticas e delega tarefas.',
    defaultButtons: [
      { id: 'mtg-1', icon: '✅', label: 'Decisão', type: 'decision' },
      { id: 'mtg-2', icon: '📌', label: 'Action Item', type: 'action' },
      { id: 'mtg-3', icon: '👤', label: 'Delegação', type: 'person' },
      { id: 'mtg-4', icon: '💰', label: 'Orçamento', type: 'action' },
      { id: 'mtg-5', icon: '🧱', label: 'Blocker', type: 'action' },
    ],
  },
  medical: {
    id: 'medical',
    name: 'Consulta Médica',
    icon: '🩺',
    description: 'Transforma a conversa em prontuário.',
    defaultButtons: [
      { id: 'med-1', icon: '💊', label: 'Prescrição', type: 'action' },
      { id: 'med-2', icon: '🤧', label: 'Sintoma', type: 'action' },
      { id: 'med-3', icon: '🩺', label: 'Diagnóstico', type: 'decision' },
      { id: 'med-4', icon: '📅', label: 'Retorno', type: 'action' },
      { id: 'med-5', icon: '📋', label: 'Pedir Exame', type: 'action' },
    ],
  },
  writing: {
    id: 'writing',
    name: 'Criação Literária',
    icon: '✍️',
    description: 'Para roteiristas e autores construírem a história.',
    defaultButtons: [
      { id: 'wrt-1', icon: '👤', label: 'Personagem', type: 'person' },
      { id: 'wrt-2', icon: '🗺️', label: 'Worldbuilding', type: 'location' },
      { id: 'wrt-3', icon: '🤯', label: 'Plot Twist', type: 'action' },
      { id: 'wrt-4', icon: '🕳️', label: 'Furo de Roteiro', type: 'action' },
    ],
  },
  journalism: {
    id: 'journalism',
    name: 'Jornalismo de Campo',
    icon: '🎤',
    description: 'Acelera a ilha de edição na TV.',
    defaultButtons: [
      { id: 'jor-1', icon: '🎥', label: 'B-Roll', type: 'action' },
      { id: 'jor-2', icon: '🌟', label: 'VIP', type: 'person' },
      { id: 'jor-3', icon: '🎙️', label: 'Polêmica', type: 'action' },
      { id: 'jor-4', icon: '💥', label: 'Tumulto', type: 'action' },
      { id: 'jor-5', icon: '📝', label: 'Stand-up', type: 'action' },
    ],
  },
};
