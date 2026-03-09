import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Mic, Square, Pause, Play, Clapperboard, Loader2 } from 'lucide-react';
import { Waveform } from './Waveform';

interface RecorderProps {
  isRecording: boolean;
  isPaused: boolean;
  currentTime: number;
  onStart: () => void;
  onStop: () => void;
  onPause: () => void;
  modeName?: string;
  mediaStream?: MediaStream | null;
  filename: string;
  setFilename: (name: string) => void;
  onAutoClaquete?: () => Promise<void>;
}

export function Recorder({ isRecording, isPaused, currentTime, onStart, onStop, onPause, modeName, mediaStream, filename, setFilename, onAutoClaquete }: RecorderProps) {
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60).toString().padStart(2, '0');
    const s = Math.floor(seconds % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  const handleAutoClaquete = async () => {
    if (onAutoClaquete) {
      setIsAnalyzing(true);
      await onAutoClaquete();
      setIsAnalyzing(false);
    }
  };

  if (isRecording) {
    return (
      <motion.div 
        initial={{ y: 100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex flex-col items-center gap-2 bg-zinc-900/95 backdrop-blur-md border border-zinc-800 px-6 py-4 rounded-3xl shadow-2xl"
      >
        <div className="w-full flex justify-center mb-2">
          <Waveform stream={mediaStream || null} isRecording={isRecording && !isPaused} />
        </div>
        
        <div className="flex items-center gap-6 w-full justify-between">
          <div className="flex flex-col items-start">
            <span className="text-2xl font-mono text-white font-medium tracking-wider">{formatTime(currentTime)}</span>
            <span className={`text-xs font-medium flex items-center gap-1.5 ${isPaused ? 'text-amber-400' : 'text-red-400'}`}>
              <span className={`w-1.5 h-1.5 rounded-full ${isPaused ? 'bg-amber-500' : 'bg-red-500 animate-pulse'}`} />
              {isPaused ? 'Pausado' : (modeName || 'Gravando')}
            </span>
          </div>
          
          {onAutoClaquete && (
            <button
              onClick={handleAutoClaquete}
              disabled={isAnalyzing}
              className="flex items-center gap-2 px-3 py-1.5 bg-indigo-500/10 text-indigo-400 rounded-lg border border-indigo-500/20 hover:bg-indigo-500/20 transition-colors text-sm font-medium disabled:opacity-50"
            >
              {isAnalyzing ? <Loader2 size={16} className="animate-spin" /> : <Clapperboard size={16} />}
              Auto-Claquete
            </button>
          )}

          <div className="w-px h-10 bg-zinc-800" />
          
          <div className="flex items-center gap-3">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={onPause}
              className={`relative flex items-center justify-center w-12 h-12 rounded-full transition-colors border ${isPaused ? 'bg-amber-500/10 text-amber-500 border-amber-500/20 hover:bg-amber-500/20' : 'bg-zinc-800 text-zinc-300 border-zinc-700 hover:bg-zinc-700'}`}
            >
              {isPaused ? <Play size={20} fill="currentColor" /> : <Pause size={20} fill="currentColor" />}
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={onStop}
              className="relative flex items-center justify-center w-14 h-14 rounded-full bg-red-500/10 text-red-500 hover:bg-red-500/20 transition-colors border border-red-500/20"
            >
              {!isPaused && (
                <motion.div
                  animate={{ opacity: [0.3, 0.8, 0.3] }}
                  transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
                  className="absolute inset-0 rounded-full bg-red-500/20"
                />
              )}
              <Square size={20} fill="currentColor" className="relative z-10" />
            </motion.button>
          </div>
        </div>
      </motion.div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center p-8 bg-zinc-900 rounded-3xl border border-zinc-800 shadow-2xl relative overflow-hidden w-full max-w-sm mx-auto">
      <div className="text-5xl font-mono text-zinc-300 mb-10 z-10 font-light tracking-wider">
        {formatTime(currentTime)}
      </div>

      <div className="w-full mb-8 z-10">
        <input
          type="text"
          value={filename}
          onChange={(e) => setFilename(e.target.value)}
          placeholder="Nome da gravação..."
          className="w-full bg-zinc-800/50 border border-zinc-700 rounded-xl px-4 py-3 text-center text-white placeholder-zinc-500 focus:outline-none focus:border-emerald-500 transition-colors"
        />
      </div>

      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={onStart}
        className="relative z-10 flex items-center justify-center w-28 h-28 rounded-full shadow-[0_0_40px_rgba(239,68,68,0.3)] transition-colors bg-red-500 text-white hover:bg-red-600"
      >
        <Mic size={48} />
      </motion.button>
      
      <div className="mt-6 text-sm text-zinc-500 z-10 font-medium tracking-wide uppercase">
        Toque para gravar
      </div>
    </div>
  );
}
