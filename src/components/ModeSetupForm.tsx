import React from 'react';
import { FormField } from '../types';

export const defaultFields: Record<string, FormField[]> = {
  meeting: [
    { key: 'title', label: 'Título da Reunião', placeholder: 'Ex: Alinhamento de Diretoria', type: 'text' },
    { key: 'description', label: 'Pauta e Objetivos', placeholder: 'Ex: Orçamento anual e contratação de consultores', type: 'textarea' },
    { key: 'participants', label: 'Diretores Presentes', placeholder: 'Ex: Diretor Financeiro, CEO, CTO', type: 'text' },
  ],
  medical_doctor: [
    { key: 'patientName', label: 'Nome do Paciente', placeholder: 'Ex: João da Silva', type: 'text' },
    { key: 'patientInfo', label: 'Idade / Sexo', placeholder: 'Ex: 34 anos, Masculino', type: 'text' },
    { key: 'chiefComplaint', label: 'Motivo da Consulta', placeholder: 'Ex: Dor nas costas há 3 dias', type: 'textarea' },
  ],
  medical_patient: [
    { key: 'doctorName', label: 'Nome do Médico', placeholder: 'Ex: Dra. Ana Souza', type: 'text' },
    { key: 'specialty', label: 'Especialidade', placeholder: 'Ex: Cardiologista', type: 'text' },
    { key: 'symptoms', label: 'Sintomas Atuais', placeholder: 'Ex: Palpitações leves à noite', type: 'textarea' },
  ],
  interview: [
    { key: 'interviewee', label: 'Nome do Entrevistado', placeholder: 'Ex: Fernando Pessoa', type: 'text' },
    { key: 'company', label: 'Veículo / Empresa', placeholder: 'Ex: Jornal CapI', type: 'text' },
    { key: 'topics', label: 'Tópicos Principais', placeholder: 'Ex: Novo livro, inspirações', type: 'textarea' },
  ],
  lecture: [
    { key: 'subject', label: 'Disciplina / Matéria', placeholder: 'Ex: Álgebra Linear', type: 'text' },
    { key: 'professor', label: 'Nome do Professor', placeholder: 'Ex: Prof. Carlos', type: 'text' },
    { key: 'content', label: 'Conteúdo da Aula', placeholder: 'Ex: Vetores e matrizes de projeção', type: 'textarea' },
  ],
  writing: [
    { key: 'title', label: 'Título do Livro/Artigo', placeholder: 'Ex: As Crônicas de CapI', type: 'text' },
    { key: 'chapter', label: 'Capítulo / Seção', placeholder: 'Ex: Capítulo 1: A Descoberta', type: 'text' },
    { key: 'synopsis', label: 'Ideia Central / Sinopse', placeholder: 'Ex: O protagonista descobre o gravador mágico', type: 'textarea' },
  ],
  journalism: [
    { key: 'story', label: 'Pauta / Matéria', placeholder: 'Ex: Cobertura da Manifestação', type: 'text' },
    { key: 'location', label: 'Local / Evento', placeholder: 'Ex: Praça Central', type: 'text' },
    { key: 'focus', label: 'Perguntas Chave / Foco', placeholder: 'Ex: Qual a reivindicação principal?', type: 'textarea' },
  ],
  cinema: [
    { key: 'project', label: 'Projeto / Filme', placeholder: 'Ex: Curta-Metragem CapI', type: 'text' },
    { key: 'scene', label: 'Cena', placeholder: 'Ex: 12A', type: 'text' },
    { key: 'shot', label: 'Plano', placeholder: 'Ex: 3', type: 'text' },
    { key: 'action', label: 'Ação / Observações', placeholder: 'Ex: Personagem entra pela esquerda', type: 'textarea' },
  ],
  table_read: [
    { key: 'project', label: 'Projeto / Filme', placeholder: 'Ex: Operação Claquete', type: 'text' },
    { key: 'scenes', label: 'Cenas em Leitura', placeholder: 'Ex: Cenas 1 a 15 (Foco em Diálogo)', type: 'text' },
    { key: 'cast', label: 'Elenco Escutado', placeholder: 'Ex: Glória Pires, Wagner Moura', type: 'text' },
    { key: 'notes', label: 'Intenções Principais', placeholder: 'Ex: Analisar ritmo cômico e repetição de falas', type: 'textarea' },
  ],
  dept_heads: [
    { key: 'project', label: 'Projeto de Produção', placeholder: 'Ex: Longa O Destino', type: 'text' },
    { key: 'crew', label: 'Chefes Presentes (Dep.)', placeholder: 'Ex: DP Fotografia, Arte, Figurinos', type: 'text' },
    { key: 'agenda', label: 'Pauta Técnica Principal', placeholder: 'Ex: Lentes anamórficas de diurna e paleta monocromática', type: 'textarea' },
  ],
  decupagem: [
    { key: 'project', label: 'Filme / Seq.', placeholder: 'Ex: Sequência de Ação #2', type: 'text' },
    { key: 'scenes', label: 'Cena Decupada', placeholder: 'Ex: Cena 45 B (Fuga)', type: 'text' },
    { key: 'equipment', label: 'Lente/Eq. Previstos', placeholder: 'Ex: Lente 50mm Anamórfica, Steadicam Acto', type: 'text' },
    { key: 'style', label: 'Estilo Visual e Clima', placeholder: 'Ex: Luz alta fria de contra, névoa densa ao fundo', type: 'textarea' },
  ],
  scouting: [
    { key: 'location', label: 'Nome da Locação', placeholder: 'Ex: Fábrica Abandonada Set F', type: 'text' },
    { key: 'schedule', label: 'Data e Hora da Visita', placeholder: 'Ex: 22 de Maio às 14h (Sol Alto)', type: 'text' },
    { key: 'checklist', label: 'Desafios Técnicos', placeholder: 'Ex: Verificar acústica de ecos altos e caixa trifásica', type: 'textarea' },
  ],
  briefing_montagem: [
    { key: 'project', label: 'Projeto / Montagem', placeholder: 'Ex: Ep. #1 - Temporada de Câmera', type: 'text' },
    { key: 'focus', label: 'Sequência em Edição', placeholder: 'Ex: Conflito Final de Atributos', type: 'text' },
    { key: 'style', label: 'Referências de Pacing/Linguagem', placeholder: 'Ex: Ritmo frenético de corte seco com trilha sob batidas', type: 'textarea' },
  ],
  filme_comentado: [
    { key: 'film', label: 'Obra / Filme Base', placeholder: 'Ex: Crônicas de CapI - O Corte', type: 'text' },
    { key: 'commentators', label: 'Quem Comenta a Faixa', placeholder: 'Ex: Diretor Fernando, Roteirista e Ator Principal', type: 'text' },
    { key: 'focus', label: 'Foco Narrativo das Notas', placeholder: 'Ex: Destacar easter eggs do set e gambiarras de luz', type: 'textarea' },
  ],
  research: [
    { key: 'subject', label: 'Tema da Pesquisa / Objetivo', placeholder: 'Ex: Eficácia de novas vacinas', type: 'text' },
    { key: 'researcher', label: 'Pesquisador Responsável', placeholder: 'Ex: Dr. Marcelo', type: 'text' },
    { key: 'description', label: 'Hipótese ou Metodologia', placeholder: 'Ex: Grupo controle de 50 indivíduos em dublagem cega', type: 'textarea' },
  ],
  bar_conversa: [
    { key: 'title', label: 'Local / Bar', placeholder: 'Ex: Bar da Esquina', type: 'text' },
    { key: 'participants', label: 'Galera', placeholder: 'Ex: Bruno, Caio, Dani', type: 'text' },
  ],
  party_planning: [
    { key: 'title', label: 'Nome do Evento', placeholder: 'Ex: Churrasco do Brunão', type: 'text' },
    { key: 'budget', label: 'Verba / Orçamento', placeholder: 'Ex: R$ 500 total', type: 'text' },
  ],
  brainstorm: [
    { key: 'title', label: 'Tema Principal', placeholder: 'Ex: Novo app de áudio', type: 'text' },
    { key: 'description', label: 'Anotações Iniciais', placeholder: 'Ex: Focar em jornalistas', type: 'textarea' },
  ],
  podcast: [
    { key: 'show', label: 'Nome do Podcast / Show', placeholder: 'Ex: Cafofo Podcast', type: 'text' },
    { key: 'episode', label: 'Número/Título do Episódio', placeholder: 'Ex: Ep. #42 - O Futuro das IAs', type: 'text' },
    { key: 'guest', label: 'Convidado(s)', placeholder: 'Ex: Marina Silva, Felipe Neto', type: 'text' },
  ],
  vlog: [
    { key: 'title', label: 'Título do Vlog/Tópico', placeholder: 'Ex: Um Dia Comigo na Obra', type: 'text' },
    { key: 'platform', label: 'Plataforma Distribuidor', placeholder: 'Ex: TikTok / YouTube Shorts', type: 'text' },
    { key: 'keyIdeas', label: 'Roteiro prévio/Análise', placeholder: 'Ex: Gravar transições pulando e focar no hook nos primeiros 3s', type: 'textarea' },
  ],
  recruitment: [
    { key: 'candidate', label: 'Nome do Candidato', placeholder: 'Ex: Alice Vasconcelos', type: 'text' },
    { key: 'role', label: 'Vaga Desejada', placeholder: 'Ex: Desenvolvedor Front-End Sênior', type: 'text' },
    { key: 'requirements', label: 'Hard/Soft Skills Foco', placeholder: 'Ex: Experiência forte com React, liderança técnica de projetos', type: 'textarea' },
  ],
  pitch: [
    { key: 'client', label: 'Lead / Investidor', placeholder: 'Ex: Fundo de Capital Semente', type: 'text' },
    { key: 'product', label: 'Invenção ou Serviço', placeholder: 'Ex: Gravador de Voz CapI', type: 'text' },
    { key: 'offering', label: 'Valor do Contrato/Proposta', placeholder: 'Ex: Rodada de Investimento de R$ 300 mil por 10%', type: 'textarea' },
  ],
  support: [
    { key: 'client', label: 'Nome do Cliente / Conta', placeholder: 'Ex: Banco CapI S.A.', type: 'text' },
    { key: 'ticketId', label: 'ID do Ticket / Chamado', placeholder: 'Ex: #88432 - Travamento', type: 'text' },
    { key: 'symptoms', label: 'Problema / Incêndio', placeholder: 'Ex: Banco de dados com alta latência nas segundas', type: 'textarea' },
  ],
  workshop: [
    { key: 'topic', label: 'Tema do Workshop', placeholder: 'Ex: Curso Prático de Cozinha', type: 'text' },
    { key: 'instructor', label: 'Instrutor / Facilitador', placeholder: 'Ex: Chef Jacquin', type: 'text' },
    { key: 'agenda', label: 'Syllabus / Metas', placeholder: 'Ex: Amassar o pão italiano, sovar e assar por 30min', type: 'textarea' },
  ],
  construction: [
    { key: 'site', label: 'Nome da Obra / Local', placeholder: 'Ex: Edifício Bella Vista', type: 'text' },
    { key: 'contractor', label: 'Responsável em Campo', placeholder: 'Ex: Mestre de Obras Geraldo', type: 'text' },
    { key: 'status', label: 'Fase do Cronograma', placeholder: 'Ex: Lançamento de fundação e fiação', type: 'textarea' },
  ],
  inspection: [
    { key: 'target', label: 'Objeto de Vistoria', placeholder: 'Ex: Apartamento 303 Bloco B', type: 'text' },
    { key: 'inspector', label: 'Vistoriador / Engenheiro', placeholder: 'Ex: Inspetor Rogério', type: 'text' },
    { key: 'checklist', label: 'Padrão / Pontos de Atenção', placeholder: 'Ex: Verificar fiação, portas, rachaduras nas vigas', type: 'textarea' },
  ],
  travel_diary: [
    { key: 'destination', label: 'Nome da Cidade / Destino', placeholder: 'Ex: Paris, França', type: 'text' },
    { key: 'hotel', label: 'Acomodação / Hotel', placeholder: 'Ex: Hostal Petit Paris', type: 'text' },
    { key: 'coTravelers', label: 'Quem viaja com você', placeholder: 'Ex: Maria Cecília, Felipe', type: 'text' },
  ],
  family_history: [
    { key: 'storyteller', label: 'Narrador / Ancião', placeholder: 'Ex: Vó Sofia', type: 'text' },
    { key: 'epoch', label: 'Época / Décadas Foco', placeholder: 'Ex: Anos 50 e 60 na fazenda de café', type: 'text' },
    { key: 'keywords', label: 'Árvore Relativa', placeholder: 'Ex: Tronco de famílias Silva e Vasconcellos históricos', type: 'textarea' },
  ],
  default: [
    { key: 'title', label: 'Título da Gravação', placeholder: 'Ex: Gravação Sem Nome', type: 'text' },
    { key: 'description', label: 'Descrição / Contexto', placeholder: 'Ex: Anotações diversas de áudio', type: 'textarea' },
  ]
};

interface ModeSetupFormProps {
  modeId: string;
  setupData: Record<string, any>;
  onChange: (data: Record<string, any>) => void;
  formFields?: FormField[];
}

export function ModeSetupForm({ modeId, setupData, onChange, formFields }: ModeSetupFormProps) {
  let fields = formFields || defaultFields[modeId] || defaultFields['default'];

  // Omit project, scene, shot fields in cinema mode because they are already present as richer inputs in CinemaHeader!
  if (modeId === 'cinema') {
    fields = fields.filter(f => f.key !== 'project' && f.key !== 'scene' && f.key !== 'shot');
  }

  const handleChange = (field: string, value: string) => {
    onChange({ ...setupData, [field]: value });
  };

  return (
    <div className="space-y-2 w-full">
      {fields.map((field) => (
        <div key={field.key} className="space-y-0.5 w-full text-left">
          <label className="text-[10px] font-bold text-zinc-500 pl-1 uppercase tracking-wider block">
            {field.label}
          </label>
          {field.type === 'textarea' ? (
            <textarea
              placeholder={field.placeholder}
              value={setupData[field.key] || ''}
              onChange={(e) => handleChange(field.key, e.target.value)}
              className="w-full bg-[#161825] border border-white/5 hover:border-white/10 rounded-xl px-3 py-1.5 text-xs text-white placeholder-zinc-700 focus:outline-none focus:border-emerald-500 hover:focus:border-emerald-500 transition-colors h-14 resize-none font-medium leading-normal shadow-inner"
            />
          ) : (
            <input
              type="text"
              placeholder={field.placeholder}
              value={setupData[field.key] || ''}
              onChange={(e) => handleChange(field.key, e.target.value)}
              className="w-full bg-[#161825] border border-white/5 hover:border-white/10 rounded-xl px-3 py-1.5 text-xs text-white placeholder-zinc-700 focus:outline-none focus:border-emerald-500 hover:focus:border-emerald-500 transition-colors font-medium h-8 shadow-inner"
            />
          )}
        </div>
      ))}
    </div>
  );
}
