import React, { useEffect, useState } from 'react';
import { Marker } from '../types';
import { transcribeAudio, generateSummaryAndTasks, fetchLocationData, generateVisualDescription } from '../services/aiService';
import { saveRecording } from '../services/storageService';
import { RecordingViewer } from './RecordingViewer';
import { Loader2 } from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';

interface ResultScreenProps {
  audioBlob: Blob;
  audioUrl: string;
  markers: Marker[];
  onReset: () => void;
  currentMode: string;
  duration: number;
}

export function ResultScreen({ audioBlob, audioUrl, markers, onReset, currentMode, duration }: ResultScreenProps) {
  const [loading, setLoading] = useState(true);
  const [transcription, setTranscription] = useState('');
  const [aiData, setAiData] = useState<any>(null);
  const [locations, setLocations] = useState<any[]>([]);
  const [images, setImages] = useState<any[]>([]);
  const [statusText, setStatusText] = useState('Analisando áudio com Gemini 3 Flash...');
  const processedRef = React.useRef(false);

  useEffect(() => {
    if (processedRef.current) return;
    processedRef.current = true;

    async function processData() {
      try {
        // 1. Transcribe
        setStatusText('Transcrevendo áudio...');
        const text = await transcribeAudio(audioBlob);
        setTranscription(text);

        // 2. Summary & Tasks
        setStatusText('Gerando resumo e tarefas...');
        const data = await generateSummaryAndTasks(text, markers);
        setAiData(data);

        // 3. Process Locations
        const locMarkers = markers.filter(m => m.type === 'location');
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
          setLocations(locData);
        }

        // 4. Process Images
        const imgMarkers = markers.filter(m => m.type === 'image');
        let imgData: any[] = [];
        if (imgMarkers.length > 0) {
          setStatusText('Gerando descrições visuais...');
          const results = await Promise.all(
            imgMarkers.map(async m => {
              const res = await generateVisualDescription(m.data || `Momento chave aos ${Math.floor(m.time)}s: ${text.substring(0, 100)}...`);
              return { marker: m, url: res };
            })
          );
          imgData = results.filter(i => i.url);
          setImages(imgData);
        }

        // 5. Save to Storage
        setStatusText('Salvando gravação...');
        await saveRecording({
          id: uuidv4(),
          date: Date.now(),
          mode: currentMode,
          duration,
          audioBlob,
          transcription: text,
          aiData: data,
          locations: locData,
          images: imgData,
          markers
        });

        setLoading(false);
      } catch (error) {
        console.error('Erro no processamento:', error);
        setStatusText('Erro ao processar dados.');
        setLoading(false);
      }
    }

    processData();
  }, [audioBlob, markers, currentMode, duration]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <Loader2 className="w-12 h-12 text-emerald-500 animate-spin mb-6" />
        <h2 className="text-xl font-medium text-zinc-300">{statusText}</h2>
        <p className="text-zinc-500 mt-2">Isso pode levar alguns segundos dependendo do tamanho do áudio.</p>
      </div>
    );
  }

  return (
    <RecordingViewer
      audioBlob={audioBlob}
      audioUrl={audioUrl}
      markers={markers}
      transcription={transcription}
      aiData={aiData}
      locations={locations}
      images={images}
      onReset={onReset}
    />
  );
}
