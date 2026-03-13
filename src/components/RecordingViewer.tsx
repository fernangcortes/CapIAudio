import React, { useState } from 'react';
import { Marker, RecordingSession } from '../types';
import { downloadAudio, generatePremiereXML, generateDaVinciCSV, exportSessionToZip } from '../services/exportService';
import { motion, AnimatePresence } from 'motion/react';
import { Download, FileVideo, FileCode2, MapPin, Image as ImageIcon, CheckCircle2, Trash2, Edit2, Check, MessageSquare, Archive, X } from 'lucide-react';

interface RecordingViewerProps {
  audioBlob: Blob;
  audioUrl: string;
  markers: Marker[];
  transcription: string;
  aiData: any;
  locations: any[];
  images: any[];
  onReset: () => void;
  onDelete?: () => void;
  isProcessing?: boolean;
  statusText?: string;
  title?: string;
  onTitleChange?: (newTitle: string) => void;
  onTranscriptionChange?: (newTranscription: string) => void;
  cinemaMetadata?: any;
  setupData?: Record<string, any>;
  modeId?: string;
}

export function RecordingViewer({ 
  audioBlob, 
  audioUrl, 
  markers, 
  transcription, 
  aiData, 
  locations, 
  images, 
  onReset,
  onDelete,
  isProcessing,
  statusText,
  title,
  onTitleChange,
  onTranscriptionChange,
  cinemaMetadata,
  setupData,
  modeId
}: RecordingViewerProps) {
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [editedTitle, setEditedTitle] = useState(title || '');
  const [editingSpeaker, setEditingSpeaker] = useState<string | null>(null);
  const [newSpeakerName, setNewSpeakerName] = useState('');
  const [showExportModal, setShowExportModal] = useState(false);
  const [exportOptions, setExportOptions] = useState({
    audio: true,
    transcription: true,
    summary: true,
    markersCsv: true,
    premiereXml: false,
    davinciCsv: false
  });

  const handleSaveTitle = () => {
    if (onTitleChange && editedTitle.trim()) {
      onTitleChange(editedTitle.trim());
    }
    setIsEditingTitle(false);
  };

  const handleReplaceSpeaker = () => {
    if (editingSpeaker && newSpeakerName.trim() && onTranscriptionChange) {
      // Escape special characters in the speaker name
      const escapeRegExp = (string: string) => string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      // Replace all occurrences of "SpeakerName:" at the beginning of a line or paragraph
      const regex = new RegExp(`^${escapeRegExp(editingSpeaker)}:`, 'gm');
      const newTranscription = transcription.replace(regex, `${newSpeakerName.trim()}:`);
      onTranscriptionChange(newTranscription);
    }
    setEditingSpeaker(null);
    setNewSpeakerName('');
  };

  const handleExportZip = async () => {
    const tempSession: RecordingSession = {
      id: 'temp',
      title: title || 'Gravacao',
      date: new Date().toISOString(),
      modeId: 'temp',
      audioBlobs: [audioBlob],
      markers: markers,
      duration: 0,
      transcription: transcription,
      summary: aiData?.summary,
      tasks: aiData?.tasks,
      cinemaMetadata: cinemaMetadata
    };
    await exportSessionToZip(tempSession, exportOptions);
    setShowExportModal(false);
  };

  // Extract unique speakers from markers
  const knownSpeakers = Array.from(new Set(
    markers
      .filter(m => m.type === 'person' && typeof m.data === 'string' && m.data.startsWith('Falando:'))
      .map(m => m.data.replace('Falando: ', '').trim())
  ));

  const getTasksLabel = () => {
    if (modeId === 'cinema') return 'Observações para Edição';
    if (modeId === 'medical_doctor') return 'Plano (Condutas e Prescrições)';
    if (modeId === 'medical_patient') return 'Próximos Passos';
    return 'Action Items';
  };

  const getTasksEmptyLabel = () => {
    if (modeId === 'cinema') return 'Nenhuma observação identificada.';
    if (modeId === 'medical_doctor') return 'Nenhuma conduta identificada.';
    if (modeId === 'medical_patient') return 'Nenhum passo identificado.';
    return 'Nenhuma tarefa identificada.';
  };

  const getDecisionsLabel = () => {
    if (modeId === 'cinema') return 'Decisões de Direção / Continuidade';
    if (modeId === 'medical_doctor') return 'Avaliação (Diagnósticos)';
    if (modeId === 'medical_patient') return 'Conclusões / Diagnósticos';
    return 'Decisões';
  };

  const getDecisionsEmptyLabel = () => {
    if (modeId === 'medical_doctor') return 'Nenhum diagnóstico identificado.';
    if (modeId === 'medical_patient') return 'Nenhuma conclusão identificada.';
    return 'Nenhuma decisão identificada.';
  };

  const getIndexLabel = () => {
    if (modeId === 'cinema') return 'Log de Decupagem';
    if (modeId === 'medical_doctor') return 'Tópicos da Anamnese/Exame';
    if (modeId === 'medical_patient') return 'Orientações e Dúvidas';
    return 'Índice Inteligente de Assuntos';
  };

  const getExportSummaryLabel = () => {
    if (modeId === 'cinema') return 'Relatório de Edição (.txt)';
    if (modeId === 'medical_doctor') return 'Prontuário Médico (.txt)';
    if (modeId === 'medical_patient') return 'Resumo para Paciente (.txt)';
    return 'Resumo e Tarefas (.txt)';
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="w-full max-w-4xl mx-auto space-y-8 pb-20"
    >
      <div className="flex items-center justify-between border-b border-zinc-800 pb-6">
        <div className="flex items-center gap-3 flex-1">
          {isProcessing ? (
            <span className="w-8 h-8 rounded-full border-4 border-emerald-500/30 border-t-emerald-500 animate-spin flex-shrink-0" />
          ) : (
            <CheckCircle2 className="text-emerald-500 flex-shrink-0" size={32} />
          )}
          
          {isEditingTitle ? (
            <div className="flex items-center gap-2 flex-1 max-w-md">
              <input
                type="text"
                value={editedTitle}
                onChange={(e) => setEditedTitle(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSaveTitle()}
                className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-1.5 text-2xl font-semibold text-white focus:outline-none focus:border-emerald-500"
                autoFocus
              />
              <button onClick={handleSaveTitle} className="p-2 text-emerald-500 hover:bg-emerald-500/10 rounded-lg transition-colors">
                <Check size={20} />
              </button>
            </div>
          ) : (
            <h2 className="text-3xl font-semibold text-white flex items-center gap-3 group">
              {title || (isProcessing ? statusText : 'Processamento Concluído')}
              {!isProcessing && onTitleChange && (
                <button 
                  onClick={() => {
                    setEditedTitle(title || '');
                    setIsEditingTitle(true);
                  }}
                  className="p-1.5 text-zinc-500 opacity-0 group-hover:opacity-100 hover:text-white hover:bg-zinc-800 rounded-lg transition-all"
                >
                  <Edit2 size={18} />
                </button>
              )}
            </h2>
          )}
        </div>
        <div className="flex gap-2">
          {onDelete && (
            <button 
              onClick={onDelete}
              className="px-4 py-2 bg-red-500/10 hover:bg-red-500/20 text-red-500 rounded-xl transition-colors font-medium flex items-center gap-2"
            >
              <Trash2 size={18} />
              Excluir
            </button>
          )}
          <button 
            onClick={onReset}
            className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-white rounded-xl transition-colors font-medium"
          >
            Nova Gravação
          </button>
        </div>
      </div>

      {/* Export Actions */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
        <button onClick={() => setShowExportModal(true)} className="flex items-center justify-center gap-2 p-4 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 rounded-2xl transition-colors border border-emerald-500/20">
          <Archive size={20} /> Baixar ZIP
        </button>
        <button onClick={() => downloadAudio(audioUrl)} className="flex items-center justify-center gap-2 p-4 bg-zinc-800 hover:bg-zinc-700 rounded-2xl text-zinc-300 transition-colors border border-zinc-700/50">
          <Download size={20} /> Áudio (.webm)
        </button>
        <button onClick={() => generatePremiereXML(markers, cinemaMetadata)} className="flex items-center justify-center gap-2 p-4 bg-zinc-800 hover:bg-zinc-700 rounded-2xl text-zinc-300 transition-colors border border-zinc-700/50">
          <FileVideo size={20} /> XML (Premiere)
        </button>
        <button onClick={() => generateDaVinciCSV(markers, cinemaMetadata)} className="flex items-center justify-center gap-2 p-4 bg-zinc-800 hover:bg-zinc-700 rounded-2xl text-zinc-300 transition-colors border border-zinc-700/50">
          <FileCode2 size={20} /> CSV (DaVinci)
        </button>
      </div>

      {/* AI Summary */}
      <div className="bg-zinc-900/50 border border-zinc-800 rounded-3xl p-8">
        <h3 className="text-xl font-medium text-emerald-400 mb-4">Resumo Executivo</h3>
        <p className="text-zinc-300 leading-relaxed mb-8">{aiData?.summary || 'Gerando resumo...'}</p>

        {setupData && Object.keys(setupData).length > 0 && (
          <div className="mb-8">
            <h4 className="text-lg font-medium text-white mb-4 flex items-center gap-2">
              <span className="text-indigo-400">📋</span> Dados do Formulário
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {Object.entries(setupData).map(([key, value]) => (
                <div key={key} className="bg-zinc-800/30 p-4 rounded-xl border border-zinc-700/30">
                  <div className="text-xs text-zinc-500 uppercase tracking-wider mb-1">{key}</div>
                  <div className="text-zinc-300">{value as React.ReactNode}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div>
            <h4 className="text-lg font-medium text-white mb-4 flex items-center gap-2">
              <span className="text-blue-400">📌</span> {getTasksLabel()}
            </h4>
            <ul className="space-y-3">
              {aiData?.tasks?.map((task: string, i: number) => (
                <li key={i} className="flex items-start gap-3 text-zinc-400 bg-zinc-800/30 p-3 rounded-xl">
                  <div className="w-1.5 h-1.5 rounded-full bg-blue-500 mt-2 flex-shrink-0" />
                  <span>{task}</span>
                </li>
              ))}
              {(!aiData?.tasks || aiData.tasks.length === 0) && <li className="text-zinc-600">{getTasksEmptyLabel()}</li>}
            </ul>
          </div>
          
          <div>
            <h4 className="text-lg font-medium text-white mb-4 flex items-center gap-2">
              <span className="text-green-400">✅</span> {getDecisionsLabel()}
            </h4>
            <ul className="space-y-3">
              {aiData?.decisions?.map((dec: string, i: number) => (
                <li key={i} className="flex items-start gap-3 text-zinc-400 bg-zinc-800/30 p-3 rounded-xl">
                  <div className="w-1.5 h-1.5 rounded-full bg-green-500 mt-2 flex-shrink-0" />
                  <span>{dec}</span>
                </li>
              ))}
              {(!aiData?.decisions || aiData.decisions.length === 0) && <li className="text-zinc-600">{getDecisionsEmptyLabel()}</li>}
            </ul>
          </div>
        </div>
      </div>

      {/* Intelligent Index */}
      {aiData?.intelligentIndex && aiData.intelligentIndex.length > 0 && (
        <div className="bg-zinc-900/50 border border-zinc-800 rounded-3xl p-8">
          <h3 className="text-xl font-medium text-purple-400 mb-6 flex items-center gap-2">
            <span className="text-2xl">🧠</span> {getIndexLabel()}
          </h3>
          <div className="space-y-4">
            {aiData.intelligentIndex.map((item: any, i: number) => (
              <div key={i} className="flex flex-col sm:flex-row sm:items-center gap-3 bg-zinc-800/30 p-4 rounded-xl border border-zinc-700/30">
                <div className="bg-purple-500/20 text-purple-300 px-3 py-1 rounded-lg text-sm font-mono whitespace-nowrap">
                  {item.timeframe}
                </div>
                <div className="text-zinc-300">
                  {item.topic}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Locations */}
      {locations.length > 0 && (
        <div className="bg-zinc-900/50 border border-zinc-800 rounded-3xl p-8">
          <h3 className="text-xl font-medium text-white mb-6 flex items-center gap-2">
            <MapPin className="text-red-400" /> Locais Mencionados
          </h3>
          <div className="space-y-6">
            {locations.map((loc, i) => (
              <div key={i} className="bg-zinc-800/50 p-5 rounded-2xl border border-zinc-700/50">
                <p className="text-zinc-300 mb-3">{loc.data.text}</p>
                <div className="flex flex-wrap gap-3">
                  {loc.data.links.map((link: any, j: number) => (
                    <a key={j} href={link.uri} target="_blank" rel="noopener noreferrer" className="text-sm text-blue-400 hover:text-blue-300 underline underline-offset-4">
                      {link.title || 'Ver no Google Maps'}
                    </a>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Generated Images */}
      {images.length > 0 && (
        <div className="bg-zinc-900/50 border border-zinc-800 rounded-3xl p-8">
          <h3 className="text-xl font-medium text-white mb-6 flex items-center gap-2">
            <ImageIcon className="text-purple-400" /> Descrições Visuais (Nano Banana 2)
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {images.map((img, i) => (
              <div key={i} className="rounded-2xl overflow-hidden border border-zinc-700/50 bg-zinc-800/30">
                <img src={img.url} alt={`Visualização ${i}`} className="w-full h-auto object-cover aspect-video" referrerPolicy="no-referrer" />
                <div className="p-4">
                  <p className="text-sm text-zinc-400">Gerado a partir do marcador em {Math.floor(img.marker.time)}s</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Markers & Comments */}
      {markers.length > 0 && (
        <div className="bg-zinc-900/50 border border-zinc-800 rounded-3xl p-8">
          <h3 className="text-xl font-medium text-white mb-6 flex items-center gap-2">
            <MessageSquare className="text-emerald-400" /> Marcadores e Comentários
          </h3>
          <div className="space-y-4">
            {markers.map((marker, i) => (
              <div key={i} className="flex items-start gap-4 bg-zinc-800/30 p-4 rounded-2xl border border-zinc-700/30">
                <div className="flex-shrink-0 w-12 h-12 bg-zinc-800 rounded-xl flex items-center justify-center text-2xl">
                  {marker.icon}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-medium text-white">{marker.label}</span>
                    <span className="text-xs text-zinc-500 bg-zinc-800 px-2 py-0.5 rounded-md">
                      {Math.floor(marker.time / 60)}:{(Math.floor(marker.time % 60)).toString().padStart(2, '0')}
                    </span>
                  </div>
                  {marker.data && (
                    <p className="text-zinc-400 text-sm">{marker.data}</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Full Transcription */}
      <div className="bg-zinc-900/50 border border-zinc-800 rounded-3xl p-8">
        <h3 className="text-xl font-medium text-white mb-6">Transcrição Completa</h3>
        <div className="prose prose-invert prose-zinc max-w-none">
          {transcription ? transcription.split('\n').map((paragraph, i) => {
            if (!paragraph.trim()) return null;
            
            // Extract speaker label if exists
            const speakerMatch = paragraph.match(/^([^:]+):(.*)/);
            let speaker = '';
            let restOfParagraph = paragraph;
            
            if (speakerMatch) {
              speaker = speakerMatch[1];
              restOfParagraph = speakerMatch[2];
            }
            
            // Render **word** as red text
            const parts = restOfParagraph.split(/(\*\*.*?\*\*)/g);
            
            return (
              <p key={i} className="text-zinc-400 leading-relaxed mb-4">
                {speaker && (
                  <span 
                    onClick={() => {
                      setEditingSpeaker(speaker);
                      setNewSpeakerName(speaker);
                    }}
                    className="font-semibold text-indigo-400 cursor-pointer hover:text-indigo-300 hover:underline mr-1"
                    title="Clique para renomear este locutor em toda a transcrição"
                  >
                    {speaker}:
                  </span>
                )}
                {parts.map((part, j) => {
                  if (part.startsWith('**') && part.endsWith('**')) {
                    return <span key={j} className="text-red-400 font-medium">{part.slice(2, -2)}</span>;
                  }
                  return <span key={j}>{part}</span>;
                })}
              </p>
            );
          }) : (
            <p className="text-zinc-500 italic">Transcrição indisponível ou em processamento...</p>
          )}
        </div>
      </div>
      {/* Speaker Replacement Modal */}
      {editingSpeaker && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
          <div className="bg-zinc-900 p-6 rounded-2xl border border-zinc-800 w-full max-w-sm">
            <h3 className="text-lg font-medium text-white mb-4">Renomear Locutor</h3>
            <p className="text-sm text-zinc-400 mb-4">
              Substituir <strong>{editingSpeaker}</strong> por:
            </p>
            
            {knownSpeakers.length > 0 && (
              <div className="mb-4">
                <label className="block text-xs font-medium text-zinc-500 uppercase tracking-wider mb-2">Participantes Conhecidos</label>
                <div className="flex flex-wrap gap-2">
                  {knownSpeakers.map((name, idx) => (
                    <button
                      key={idx}
                      onClick={() => setNewSpeakerName(name)}
                      className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                        newSpeakerName === name 
                          ? 'bg-indigo-500 text-white' 
                          : 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700'
                      }`}
                    >
                      {name}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div className="mb-6">
              <label className="block text-xs font-medium text-zinc-500 uppercase tracking-wider mb-2">Ou digite um novo nome</label>
              <input
                autoFocus
                type="text"
                value={newSpeakerName}
                onChange={(e) => setNewSpeakerName(e.target.value)}
                placeholder="Nome do locutor..."
                className="w-full bg-zinc-800 border border-zinc-700 rounded-xl p-3 text-white focus:outline-none focus:border-emerald-500"
                onKeyDown={(e) => e.key === 'Enter' && handleReplaceSpeaker()}
              />
            </div>

            <div className="flex justify-end gap-3">
              <button 
                onClick={() => {
                  setEditingSpeaker(null);
                  setNewSpeakerName('');
                }} 
                className="px-4 py-2 text-zinc-400 hover:text-white"
              >
                Cancelar
              </button>
              <button 
                onClick={handleReplaceSpeaker} 
                disabled={!newSpeakerName.trim() || newSpeakerName === editingSpeaker}
                className="px-4 py-2 bg-emerald-500 text-zinc-900 font-medium rounded-xl hover:bg-emerald-400 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Substituir Todos
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Export ZIP Modal */}
      {showExportModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-6 w-full max-w-md shadow-2xl">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-semibold text-white flex items-center gap-2">
                <Archive className="text-emerald-500" /> Exportar ZIP
              </h3>
              <button 
                onClick={() => setShowExportModal(false)}
                className="p-2 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-xl transition-colors"
              >
                <X size={20} />
              </button>
            </div>
            
            <p className="text-zinc-400 text-sm mb-6">
              Selecione os arquivos que deseja incluir no pacote ZIP:
            </p>

            <div className="space-y-3 mb-8">
              <label className="flex items-center gap-3 p-3 bg-zinc-800/50 rounded-xl border border-zinc-700/50 cursor-pointer hover:bg-zinc-800 transition-colors">
                <input 
                  type="checkbox" 
                  checked={exportOptions.audio}
                  onChange={(e) => setExportOptions({...exportOptions, audio: e.target.checked})}
                  className="w-5 h-5 rounded border-zinc-600 text-emerald-500 focus:ring-emerald-500 bg-zinc-700"
                />
                <span className="text-zinc-200">Áudio Original (.webm)</span>
              </label>
              <label className="flex items-center gap-3 p-3 bg-zinc-800/50 rounded-xl border border-zinc-700/50 cursor-pointer hover:bg-zinc-800 transition-colors">
                <input 
                  type="checkbox" 
                  checked={exportOptions.transcription}
                  onChange={(e) => setExportOptions({...exportOptions, transcription: e.target.checked})}
                  className="w-5 h-5 rounded border-zinc-600 text-emerald-500 focus:ring-emerald-500 bg-zinc-700"
                />
                <span className="text-zinc-200">Transcrição Completa (.txt)</span>
              </label>
              <label className="flex items-center gap-3 p-3 bg-zinc-800/50 rounded-xl border border-zinc-700/50 cursor-pointer hover:bg-zinc-800 transition-colors">
                <input 
                  type="checkbox" 
                  checked={exportOptions.summary}
                  onChange={(e) => setExportOptions({...exportOptions, summary: e.target.checked})}
                  className="w-5 h-5 rounded border-zinc-600 text-emerald-500 focus:ring-emerald-500 bg-zinc-700"
                />
                <span className="text-zinc-200">{getExportSummaryLabel()}</span>
              </label>
              <label className="flex items-center gap-3 p-3 bg-zinc-800/50 rounded-xl border border-zinc-700/50 cursor-pointer hover:bg-zinc-800 transition-colors">
                <input 
                  type="checkbox" 
                  checked={exportOptions.markersCsv}
                  onChange={(e) => setExportOptions({...exportOptions, markersCsv: e.target.checked})}
                  className="w-5 h-5 rounded border-zinc-600 text-emerald-500 focus:ring-emerald-500 bg-zinc-700"
                />
                <span className="text-zinc-200">Marcadores Genéricos (.csv)</span>
              </label>
              <label className="flex items-center gap-3 p-3 bg-zinc-800/50 rounded-xl border border-zinc-700/50 cursor-pointer hover:bg-zinc-800 transition-colors">
                <input 
                  type="checkbox" 
                  checked={exportOptions.premiereXml}
                  onChange={(e) => setExportOptions({...exportOptions, premiereXml: e.target.checked})}
                  className="w-5 h-5 rounded border-zinc-600 text-emerald-500 focus:ring-emerald-500 bg-zinc-700"
                />
                <span className="text-zinc-200">Marcadores Premiere (.xml)</span>
              </label>
              <label className="flex items-center gap-3 p-3 bg-zinc-800/50 rounded-xl border border-zinc-700/50 cursor-pointer hover:bg-zinc-800 transition-colors">
                <input 
                  type="checkbox" 
                  checked={exportOptions.davinciCsv}
                  onChange={(e) => setExportOptions({...exportOptions, davinciCsv: e.target.checked})}
                  className="w-5 h-5 rounded border-zinc-600 text-emerald-500 focus:ring-emerald-500 bg-zinc-700"
                />
                <span className="text-zinc-200">Marcadores DaVinci (.csv)</span>
              </label>
            </div>

            <div className="flex justify-end gap-3">
              <button 
                onClick={() => setShowExportModal(false)} 
                className="px-4 py-2 text-zinc-400 hover:text-white"
              >
                Cancelar
              </button>
              <button 
                onClick={handleExportZip} 
                className="px-6 py-2 bg-emerald-500 text-zinc-900 font-medium rounded-xl hover:bg-emerald-400 transition-colors flex items-center gap-2"
              >
                <Download size={18} /> Baixar
              </button>
            </div>
          </div>
        </div>
      )}
    </motion.div>
  );
}
