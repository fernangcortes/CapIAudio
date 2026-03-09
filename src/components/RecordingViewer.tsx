import React, { useState } from 'react';
import { Marker } from '../types';
import { downloadAudio, generatePremiereXML, generateDaVinciCSV } from '../services/exportService';
import { motion } from 'motion/react';
import { Download, FileVideo, FileCode2, MapPin, Image as ImageIcon, CheckCircle2, Trash2, Edit2, Check } from 'lucide-react';

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
  cinemaMetadata
}: RecordingViewerProps) {
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [editedTitle, setEditedTitle] = useState(title || '');
  const [editingSpeaker, setEditingSpeaker] = useState<string | null>(null);
  const [newSpeakerName, setNewSpeakerName] = useState('');

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

  // Extract unique speakers from markers
  const knownSpeakers = Array.from(new Set(
    markers
      .filter(m => m.type === 'person' && typeof m.data === 'string' && m.data.startsWith('Falando:'))
      .map(m => m.data.replace('Falando: ', '').trim())
  ));

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
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <button onClick={() => downloadAudio(audioUrl)} className="flex items-center justify-center gap-2 p-4 bg-zinc-800 hover:bg-zinc-700 rounded-2xl text-zinc-300 transition-colors border border-zinc-700/50">
          <Download size={20} /> Baixar Áudio (.webm)
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

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div>
            <h4 className="text-lg font-medium text-white mb-4 flex items-center gap-2">
              <span className="text-blue-400">📌</span> Action Items
            </h4>
            <ul className="space-y-3">
              {aiData?.tasks?.map((task: string, i: number) => (
                <li key={i} className="flex items-start gap-3 text-zinc-400 bg-zinc-800/30 p-3 rounded-xl">
                  <div className="w-1.5 h-1.5 rounded-full bg-blue-500 mt-2 flex-shrink-0" />
                  <span>{task}</span>
                </li>
              ))}
              {(!aiData?.tasks || aiData.tasks.length === 0) && <li className="text-zinc-600">Nenhuma tarefa identificada.</li>}
            </ul>
          </div>
          
          <div>
            <h4 className="text-lg font-medium text-white mb-4 flex items-center gap-2">
              <span className="text-green-400">✅</span> Decisões
            </h4>
            <ul className="space-y-3">
              {aiData?.decisions?.map((dec: string, i: number) => (
                <li key={i} className="flex items-start gap-3 text-zinc-400 bg-zinc-800/30 p-3 rounded-xl">
                  <div className="w-1.5 h-1.5 rounded-full bg-green-500 mt-2 flex-shrink-0" />
                  <span>{dec}</span>
                </li>
              ))}
              {(!aiData?.decisions || aiData.decisions.length === 0) && <li className="text-zinc-600">Nenhuma decisão identificada.</li>}
            </ul>
          </div>
        </div>
      </div>

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
    </motion.div>
  );
}
