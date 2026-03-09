import React, { useEffect, useState } from 'react';
import { RecordingSession } from '../types';
import { transcribeAudio, generateSummaryAndTasks, fetchLocationData, generateVisualDescription } from '../services/aiService';
import { saveSession } from '../services/storageService';
import { RecordingViewer } from './RecordingViewer';
import { Loader2, Play, FileText, Mic } from 'lucide-react';

interface ResultScreenProps {
  session: RecordingSession;
  onReset: () => void;
  onResume: () => void;
}

export function ResultScreen({ session, onReset, onResume }: ResultScreenProps) {
  const [loading, setLoading] = useState(false);
  const [statusText, setStatusText] = useState('');
  const [currentSession, setCurrentSession] = useState<RecordingSession>(session);
  const [audioUrl, setAudioUrl] = useState<string>('');
  const [combinedBlob, setCombinedBlob] = useState<Blob | null>(null);

  useEffect(() => {
    if (currentSession.audioBlobs.length > 0) {
      const blob = new Blob(currentSession.audioBlobs, { type: 'audio/webm' });
      setCombinedBlob(blob);
      const url = URL.createObjectURL(blob);
      setAudioUrl(url);
      return () => URL.revokeObjectURL(url);
    }
  }, [currentSession.audioBlobs]);

  const handleTranscribe = async () => {
    setLoading(true);
    try {
      // 1. Transcribe
      setStatusText('Transcrevendo áudio...');
      const text = await transcribeAudio(currentSession.audioBlobs, currentSession.markers);
      
      // 2. Summary & Tasks
      setStatusText('Gerando resumo e tarefas...');
      const data = await generateSummaryAndTasks(text, currentSession.markers);

      // 3. Process Locations
      const locMarkers = currentSession.markers.filter(m => m.type === 'location');
      let locData: any[] = [];
      if (locMarkers.length > 0) {
        setStatusText('Buscando dados de localização...');
        const results = await Promise.all(
          locMarkers.map(async m => {
            const res = await fetchLocationData(m.data || m.label);
            return { marker: m, data: res };
          })
        );
        locData = results.filter(l => l.data);
      }

      // 4. Process Images
      const imgModel = localStorage.getItem('IMAGE_MODEL') || 'gemini-3.1-flash-image-preview';
      const imgSize = localStorage.getItem('IMAGE_SIZE') || '512px';
      const imgMarkers = currentSession.markers.filter(m => m.type === 'image');
      let imgData: any[] = [];
      
      if (imgMarkers.length > 0) {
        setStatusText('Gerando descrições visuais...');
        const results = await Promise.all(
          imgMarkers.map(async m => {
            const res = await generateVisualDescription(
              m.data || `Momento chave aos ${Math.floor(m.time)}s: ${text.substring(0, 100)}...`,
              imgModel,
              imgSize
            );
            return { marker: m, url: res };
          })
        );
        imgData = results.filter(i => i.url);
      }

      // 5. Update Session
      setStatusText('Salvando gravação...');
      const updatedSession = {
        ...currentSession,
        transcription: text,
        summary: data?.summary,
        tasks: data?.tasks,
        images: imgData,
        // we might need to store locations in session if we want to persist them, but for now we can just pass them or add to session type
      };
      
      setCurrentSession(updatedSession);
      await saveSession(updatedSession);
      setLoading(false);
    } catch (error) {
      console.error('Erro no processamento:', error);
      setStatusText('Erro ao processar dados.');
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <Loader2 className="w-12 h-12 text-emerald-500 animate-spin mb-6" />
        <h2 className="text-xl font-medium text-zinc-300">{statusText}</h2>
        <p className="text-zinc-500 mt-2">Isso pode levar alguns segundos dependendo do tamanho do áudio.</p>
      </div>
    );
  }

  if (!currentSession.transcription) {
    return (
      <div className="flex flex-col items-center justify-center py-20 max-w-2xl mx-auto text-center">
        <div className="w-20 h-20 bg-zinc-800 rounded-full flex items-center justify-center mb-6">
          <FileText size={32} className="text-zinc-400" />
        </div>
        <h2 className="text-2xl font-semibold text-white mb-2">Gravação Salva</h2>
        <p className="text-zinc-400 mb-8">
          Sua gravação de {Math.floor(currentSession.duration / 60)}:{(currentSession.duration % 60).toString().padStart(2, '0')} foi salva com sucesso. 
          Você pode continuar gravando ou gerar a transcrição agora.
        </p>
        
        <div className="flex flex-col sm:flex-row gap-4 w-full justify-center">
          <button
            onClick={onResume}
            className="flex items-center justify-center gap-2 px-6 py-3 bg-zinc-800 text-white rounded-xl hover:bg-zinc-700 transition-colors font-medium"
          >
            <Mic size={20} />
            Continuar Gravação
          </button>
          <button
            onClick={handleTranscribe}
            className="flex items-center justify-center gap-2 px-6 py-3 bg-emerald-500 text-zinc-900 rounded-xl hover:bg-emerald-400 transition-colors font-medium"
          >
            <FileText size={20} />
            Gerar Transcrição e Relatório
          </button>
        </div>
        
        <button
          onClick={onReset}
          className="mt-8 text-sm text-zinc-500 hover:text-white transition-colors"
        >
          Voltar para o Início
        </button>
      </div>
    );
  }

  return (
    <div className="relative">
      <div className="absolute top-0 right-0 z-10 flex gap-2">
        <button
          onClick={onResume}
          className="flex items-center gap-2 px-4 py-2 bg-zinc-800 text-white rounded-xl hover:bg-zinc-700 transition-colors text-sm font-medium"
        >
          <Mic size={16} />
          Continuar Gravação
        </button>
      </div>
      <RecordingViewer
        audioBlob={combinedBlob!}
        audioUrl={audioUrl}
        markers={currentSession.markers}
        transcription={currentSession.transcription || ''}
        aiData={{ summary: currentSession.summary, tasks: currentSession.tasks }}
        locations={[]} // Locations not persisted in session yet, but can be added
        images={currentSession.images || []}
        onReset={onReset}
        title={currentSession.title}
        cinemaMetadata={currentSession.cinemaMetadata}
        onTitleChange={async (newTitle) => {
          const updatedSession = { ...currentSession, title: newTitle };
          setCurrentSession(updatedSession);
          await saveSession(updatedSession);
        }}
        onTranscriptionChange={async (newTranscription) => {
          const updatedSession = { ...currentSession, transcription: newTranscription };
          setCurrentSession(updatedSession);
          await saveSession(updatedSession);
        }}
      />
    </div>
  );
}
