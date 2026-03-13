import React from 'react';

interface ModeSetupFormProps {
  modeId: string;
  setupData: Record<string, any>;
  onChange: (data: Record<string, any>) => void;
}

export function ModeSetupForm({ modeId, setupData, onChange }: ModeSetupFormProps) {
  const handleChange = (field: string, value: string) => {
    onChange({ ...setupData, [field]: value });
  };

  switch (modeId) {
    case 'meeting':
      return (
        <div className="space-y-4 w-full">
          <input
            type="text"
            placeholder="Título da Reunião"
            value={setupData.title || ''}
            onChange={(e) => handleChange('title', e.target.value)}
            className="w-full bg-zinc-800/50 border border-zinc-700 rounded-xl px-4 py-3 text-white placeholder-zinc-500 focus:outline-none focus:border-emerald-500 transition-colors"
          />
          <textarea
            placeholder="Pauta / Descrição"
            value={setupData.description || ''}
            onChange={(e) => handleChange('description', e.target.value)}
            className="w-full bg-zinc-800/50 border border-zinc-700 rounded-xl px-4 py-3 text-white placeholder-zinc-500 focus:outline-none focus:border-emerald-500 transition-colors h-24 resize-none"
          />
          <input
            type="text"
            placeholder="Participantes (separados por vírgula)"
            value={setupData.participants || ''}
            onChange={(e) => handleChange('participants', e.target.value)}
            className="w-full bg-zinc-800/50 border border-zinc-700 rounded-xl px-4 py-3 text-white placeholder-zinc-500 focus:outline-none focus:border-emerald-500 transition-colors"
          />
        </div>
      );
    case 'medical_doctor':
      return (
        <div className="space-y-4 w-full">
          <input
            type="text"
            placeholder="Nome do Paciente"
            value={setupData.patientName || ''}
            onChange={(e) => handleChange('patientName', e.target.value)}
            className="w-full bg-zinc-800/50 border border-zinc-700 rounded-xl px-4 py-3 text-white placeholder-zinc-500 focus:outline-none focus:border-emerald-500 transition-colors"
          />
          <input
            type="text"
            placeholder="Idade / Sexo"
            value={setupData.patientInfo || ''}
            onChange={(e) => handleChange('patientInfo', e.target.value)}
            className="w-full bg-zinc-800/50 border border-zinc-700 rounded-xl px-4 py-3 text-white placeholder-zinc-500 focus:outline-none focus:border-emerald-500 transition-colors"
          />
          <textarea
            placeholder="Motivo da Consulta / Queixa Principal"
            value={setupData.chiefComplaint || ''}
            onChange={(e) => handleChange('chiefComplaint', e.target.value)}
            className="w-full bg-zinc-800/50 border border-zinc-700 rounded-xl px-4 py-3 text-white placeholder-zinc-500 focus:outline-none focus:border-emerald-500 transition-colors h-24 resize-none"
          />
        </div>
      );
    case 'medical_patient':
      return (
        <div className="space-y-4 w-full">
          <input
            type="text"
            placeholder="Nome do Médico"
            value={setupData.doctorName || ''}
            onChange={(e) => handleChange('doctorName', e.target.value)}
            className="w-full bg-zinc-800/50 border border-zinc-700 rounded-xl px-4 py-3 text-white placeholder-zinc-500 focus:outline-none focus:border-emerald-500 transition-colors"
          />
          <input
            type="text"
            placeholder="Especialidade"
            value={setupData.specialty || ''}
            onChange={(e) => handleChange('specialty', e.target.value)}
            className="w-full bg-zinc-800/50 border border-zinc-700 rounded-xl px-4 py-3 text-white placeholder-zinc-500 focus:outline-none focus:border-emerald-500 transition-colors"
          />
          <textarea
            placeholder="Sintomas Atuais / Dúvidas"
            value={setupData.symptoms || ''}
            onChange={(e) => handleChange('symptoms', e.target.value)}
            className="w-full bg-zinc-800/50 border border-zinc-700 rounded-xl px-4 py-3 text-white placeholder-zinc-500 focus:outline-none focus:border-emerald-500 transition-colors h-24 resize-none"
          />
        </div>
      );
    case 'interview':
      return (
        <div className="space-y-4 w-full">
          <input
            type="text"
            placeholder="Nome do Entrevistado"
            value={setupData.interviewee || ''}
            onChange={(e) => handleChange('interviewee', e.target.value)}
            className="w-full bg-zinc-800/50 border border-zinc-700 rounded-xl px-4 py-3 text-white placeholder-zinc-500 focus:outline-none focus:border-emerald-500 transition-colors"
          />
          <input
            type="text"
            placeholder="Veículo / Empresa"
            value={setupData.company || ''}
            onChange={(e) => handleChange('company', e.target.value)}
            className="w-full bg-zinc-800/50 border border-zinc-700 rounded-xl px-4 py-3 text-white placeholder-zinc-500 focus:outline-none focus:border-emerald-500 transition-colors"
          />
          <textarea
            placeholder="Tópicos Principais"
            value={setupData.topics || ''}
            onChange={(e) => handleChange('topics', e.target.value)}
            className="w-full bg-zinc-800/50 border border-zinc-700 rounded-xl px-4 py-3 text-white placeholder-zinc-500 focus:outline-none focus:border-emerald-500 transition-colors h-24 resize-none"
          />
        </div>
      );
    case 'lecture':
      return (
        <div className="space-y-4 w-full">
          <input
            type="text"
            placeholder="Disciplina / Matéria"
            value={setupData.subject || ''}
            onChange={(e) => handleChange('subject', e.target.value)}
            className="w-full bg-zinc-800/50 border border-zinc-700 rounded-xl px-4 py-3 text-white placeholder-zinc-500 focus:outline-none focus:border-emerald-500 transition-colors"
          />
          <input
            type="text"
            placeholder="Nome do Professor"
            value={setupData.professor || ''}
            onChange={(e) => handleChange('professor', e.target.value)}
            className="w-full bg-zinc-800/50 border border-zinc-700 rounded-xl px-4 py-3 text-white placeholder-zinc-500 focus:outline-none focus:border-emerald-500 transition-colors"
          />
          <textarea
            placeholder="Conteúdo da Aula"
            value={setupData.content || ''}
            onChange={(e) => handleChange('content', e.target.value)}
            className="w-full bg-zinc-800/50 border border-zinc-700 rounded-xl px-4 py-3 text-white placeholder-zinc-500 focus:outline-none focus:border-emerald-500 transition-colors h-24 resize-none"
          />
        </div>
      );
    case 'writing':
      return (
        <div className="space-y-4 w-full">
          <input
            type="text"
            placeholder="Título do Livro/Artigo"
            value={setupData.title || ''}
            onChange={(e) => handleChange('title', e.target.value)}
            className="w-full bg-zinc-800/50 border border-zinc-700 rounded-xl px-4 py-3 text-white placeholder-zinc-500 focus:outline-none focus:border-emerald-500 transition-colors"
          />
          <input
            type="text"
            placeholder="Capítulo / Seção"
            value={setupData.chapter || ''}
            onChange={(e) => handleChange('chapter', e.target.value)}
            className="w-full bg-zinc-800/50 border border-zinc-700 rounded-xl px-4 py-3 text-white placeholder-zinc-500 focus:outline-none focus:border-emerald-500 transition-colors"
          />
          <textarea
            placeholder="Ideia Central / Sinopse"
            value={setupData.synopsis || ''}
            onChange={(e) => handleChange('synopsis', e.target.value)}
            className="w-full bg-zinc-800/50 border border-zinc-700 rounded-xl px-4 py-3 text-white placeholder-zinc-500 focus:outline-none focus:border-emerald-500 transition-colors h-24 resize-none"
          />
        </div>
      );
    case 'journalism':
      return (
        <div className="space-y-4 w-full">
          <input
            type="text"
            placeholder="Pauta / Matéria"
            value={setupData.story || ''}
            onChange={(e) => handleChange('story', e.target.value)}
            className="w-full bg-zinc-800/50 border border-zinc-700 rounded-xl px-4 py-3 text-white placeholder-zinc-500 focus:outline-none focus:border-emerald-500 transition-colors"
          />
          <input
            type="text"
            placeholder="Local / Evento"
            value={setupData.location || ''}
            onChange={(e) => handleChange('location', e.target.value)}
            className="w-full bg-zinc-800/50 border border-zinc-700 rounded-xl px-4 py-3 text-white placeholder-zinc-500 focus:outline-none focus:border-emerald-500 transition-colors"
          />
          <textarea
            placeholder="Perguntas Chave / Foco"
            value={setupData.focus || ''}
            onChange={(e) => handleChange('focus', e.target.value)}
            className="w-full bg-zinc-800/50 border border-zinc-700 rounded-xl px-4 py-3 text-white placeholder-zinc-500 focus:outline-none focus:border-emerald-500 transition-colors h-24 resize-none"
          />
        </div>
      );
    case 'cinema':
      return (
        <div className="space-y-4 w-full">
          <input
            type="text"
            placeholder="Projeto / Filme"
            value={setupData.project || ''}
            onChange={(e) => handleChange('project', e.target.value)}
            className="w-full bg-zinc-800/50 border border-zinc-700 rounded-xl px-4 py-3 text-white placeholder-zinc-500 focus:outline-none focus:border-emerald-500 transition-colors"
          />
          <div className="flex gap-4">
            <input
              type="text"
              placeholder="Cena"
              value={setupData.scene || ''}
              onChange={(e) => handleChange('scene', e.target.value)}
              className="w-1/2 bg-zinc-800/50 border border-zinc-700 rounded-xl px-4 py-3 text-white placeholder-zinc-500 focus:outline-none focus:border-emerald-500 transition-colors"
            />
            <input
              type="text"
              placeholder="Plano"
              value={setupData.shot || ''}
              onChange={(e) => handleChange('shot', e.target.value)}
              className="w-1/2 bg-zinc-800/50 border border-zinc-700 rounded-xl px-4 py-3 text-white placeholder-zinc-500 focus:outline-none focus:border-emerald-500 transition-colors"
            />
          </div>
          <textarea
            placeholder="Ação / Observações"
            value={setupData.action || ''}
            onChange={(e) => handleChange('action', e.target.value)}
            className="w-full bg-zinc-800/50 border border-zinc-700 rounded-xl px-4 py-3 text-white placeholder-zinc-500 focus:outline-none focus:border-emerald-500 transition-colors h-24 resize-none"
          />
        </div>
      );
    default:
      return (
        <div className="space-y-4 w-full">
          <input
            type="text"
            placeholder="Título da Gravação"
            value={setupData.title || ''}
            onChange={(e) => handleChange('title', e.target.value)}
            className="w-full bg-zinc-800/50 border border-zinc-700 rounded-xl px-4 py-3 text-white placeholder-zinc-500 focus:outline-none focus:border-emerald-500 transition-colors"
          />
          <textarea
            placeholder="Descrição / Contexto"
            value={setupData.description || ''}
            onChange={(e) => handleChange('description', e.target.value)}
            className="w-full bg-zinc-800/50 border border-zinc-700 rounded-xl px-4 py-3 text-white placeholder-zinc-500 focus:outline-none focus:border-emerald-500 transition-colors h-24 resize-none"
          />
        </div>
      );
  }
}
