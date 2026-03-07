import React, { useEffect, useState } from 'react';
import { getAllRecordings, deleteRecording, RecordingData } from '../services/storageService';
import { RecordingViewer } from './RecordingViewer';
import { motion, AnimatePresence } from 'motion/react';
import { Clock, Calendar, ChevronLeft, Trash2, PlayCircle } from 'lucide-react';
import { APP_MODES } from '../constants';

interface HistoryScreenProps {
  onBack: () => void;
}

export function HistoryScreen({ onBack }: HistoryScreenProps) {
  const [recordings, setRecordings] = useState<RecordingData[]>([]);
  const [selectedRecording, setSelectedRecording] = useState<RecordingData | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);

  useEffect(() => {
    loadRecordings();
  }, []);

  const loadRecordings = async () => {
    try {
      const data = await getAllRecordings();
      setRecordings(data);
    } catch (error) {
      console.error('Erro ao carregar histórico:', error);
    }
  };

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm('Tem certeza que deseja excluir esta gravação?')) {
      await deleteRecording(id);
      await loadRecordings();
      if (selectedRecording?.id === id) {
        handleBackToHistory();
      }
    }
  };

  const handleSelect = (rec: RecordingData) => {
    const url = URL.createObjectURL(rec.audioBlob);
    setAudioUrl(url);
    setSelectedRecording(rec);
  };

  const handleBackToHistory = () => {
    if (audioUrl) URL.revokeObjectURL(audioUrl);
    setAudioUrl(null);
    setSelectedRecording(null);
  };

  const formatDuration = (seconds: number) => {
    const m = Math.floor(seconds / 60).toString().padStart(2, '0');
    const s = Math.floor(seconds % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (selectedRecording && audioUrl) {
    return (
      <motion.div 
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: -20 }}
      >
        <button 
          onClick={handleBackToHistory}
          className="mb-6 flex items-center gap-2 text-zinc-400 hover:text-white transition-colors"
        >
          <ChevronLeft size={20} /> Voltar para Histórico
        </button>
        
        <RecordingViewer
          audioBlob={selectedRecording.audioBlob}
          audioUrl={audioUrl}
          markers={selectedRecording.markers}
          transcription={selectedRecording.transcription}
          aiData={selectedRecording.aiData}
          locations={selectedRecording.locations}
          images={selectedRecording.images}
          onReset={onBack} // "Nova Gravação" volta para o início
          onDelete={() => {
            if (confirm('Tem certeza que deseja excluir esta gravação?')) {
              deleteRecording(selectedRecording.id).then(() => {
                handleBackToHistory();
                loadRecordings();
              });
            }
          }}
          title={`Gravação de ${formatDate(selectedRecording.date)}`}
        />
      </motion.div>
    );
  }

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-4xl mx-auto pb-20"
    >
      <div className="flex items-center justify-between mb-8">
        <h2 className="text-3xl font-semibold text-white flex items-center gap-3">
          <Clock className="text-emerald-500" size={32} />
          Histórico de Gravações
        </h2>
        <button 
          onClick={onBack}
          className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-white rounded-xl transition-colors font-medium"
        >
          Voltar
        </button>
      </div>

      {recordings.length === 0 ? (
        <div className="text-center py-20 bg-zinc-900/50 rounded-3xl border border-zinc-800">
          <p className="text-zinc-500 text-lg">Nenhuma gravação encontrada.</p>
        </div>
      ) : (
        <div className="grid gap-4">
          {recordings.map((rec) => {
            const mode = Object.values(APP_MODES).find(m => m.id === rec.mode);
            return (
              <motion.div
                key={rec.id}
                layoutId={rec.id}
                onClick={() => handleSelect(rec)}
                className="group bg-zinc-900/50 hover:bg-zinc-800 border border-zinc-800 hover:border-emerald-500/30 p-5 rounded-2xl cursor-pointer transition-all flex items-center justify-between"
              >
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-zinc-800 group-hover:bg-emerald-500/10 flex items-center justify-center text-2xl transition-colors">
                    {mode?.icon || '🎤'}
                  </div>
                  <div>
                    <h3 className="text-white font-medium text-lg flex items-center gap-2">
                      {mode?.name || 'Gravação'}
                      <span className="text-xs text-zinc-500 bg-zinc-800 px-2 py-0.5 rounded-full border border-zinc-700">
                        {formatDuration(rec.duration || 0)}
                      </span>
                    </h3>
                    <p className="text-zinc-500 text-sm flex items-center gap-2 mt-1">
                      <Calendar size={14} />
                      {formatDate(rec.date)}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <div className="hidden sm:block text-right mr-4">
                    <p className="text-xs text-zinc-500 uppercase tracking-wider mb-1">Resumo</p>
                    <p className="text-zinc-400 text-sm max-w-[200px] truncate">
                      {rec.aiData?.summary || 'Sem resumo'}
                    </p>
                  </div>
                  
                  <button 
                    onClick={(e) => handleDelete(rec.id, e)}
                    className="p-3 text-zinc-500 hover:text-red-500 hover:bg-red-500/10 rounded-xl transition-colors"
                    title="Excluir"
                  >
                    <Trash2 size={20} />
                  </button>
                  
                  <div className="p-3 text-emerald-500 bg-emerald-500/10 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity">
                    <PlayCircle size={24} />
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}
    </motion.div>
  );
}
