import React, { useState, useEffect, useRef } from 'react';
import { CinemaMetadata } from '../types';
import { motion, AnimatePresence } from 'motion/react';
import { X, Maximize } from 'lucide-react';

interface FullScreenClapperboardProps {
  metadata: CinemaMetadata;
  onClose: () => void;
}

export function FullScreenClapperboard({ metadata, onClose }: FullScreenClapperboardProps) {
  const [isFlashing, setIsFlashing] = useState(false);
  const audioContextRef = useRef<AudioContext | null>(null);

  useEffect(() => {
    // Initialize AudioContext on mount (might need user interaction to actually play, but we'll do it on click)
    audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
    
    // Request full screen when opened
    const elem = document.documentElement;
    if (elem.requestFullscreen) {
      elem.requestFullscreen().catch((err) => {
        console.warn(`Error attempting to enable full-screen mode: ${err.message} (${err.name})`);
      });
    }

    return () => {
      // Exit full screen when closed
      if (document.fullscreenElement) {
        document.exitFullscreen().catch((err) => {
          console.warn(`Error attempting to exit full-screen mode: ${err.message} (${err.name})`);
        });
      }
      if (audioContextRef.current) {
        audioContextRef.current.close();
      }
    };
  }, []);

  const playBeep = () => {
    if (!audioContextRef.current) return;
    
    // Resume context if suspended (browser policy)
    if (audioContextRef.current.state === 'suspended') {
      audioContextRef.current.resume();
    }

    const oscillator = audioContextRef.current.createOscillator();
    const gainNode = audioContextRef.current.createGain();

    oscillator.type = 'sine';
    oscillator.frequency.setValueAtTime(1000, audioContextRef.current.currentTime); // 1kHz beep
    
    gainNode.gain.setValueAtTime(1, audioContextRef.current.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.001, audioContextRef.current.currentTime + 0.1); // Short beep

    oscillator.connect(gainNode);
    gainNode.connect(audioContextRef.current.destination);

    oscillator.start();
    oscillator.stop(audioContextRef.current.currentTime + 0.1);
  };

  const handleClap = () => {
    playBeep();
    setIsFlashing(true);
    setTimeout(() => {
      setIsFlashing(false);
    }, 100); // 100ms flash
  };

  return (
    <div className="fixed inset-0 z-[100] bg-black text-white flex flex-col items-center justify-center overflow-hidden font-mono">
      {/* Flash Overlay */}
      <AnimatePresence>
        {isFlashing && (
          <motion.div
            initial={{ opacity: 1 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.1 }}
            className="absolute inset-0 bg-white z-50 pointer-events-none"
          />
        )}
      </AnimatePresence>

      {/* Close Button */}
      <button 
        onClick={onClose}
        className="absolute top-6 right-6 p-4 bg-zinc-900/50 hover:bg-zinc-800 rounded-full transition-colors z-40"
      >
        <X size={32} />
      </button>

      {/* Clapperboard Content */}
      <div 
        className="w-full h-full flex flex-col p-8 cursor-pointer select-none"
        onClick={handleClap}
      >
        {/* Top Section: Movie Name */}
        <div className="flex-1 flex items-center justify-center border-b-8 border-white/20">
          <h1 className="text-[8vw] font-bold tracking-tighter uppercase text-center leading-none">
            {metadata.movieName || 'PROJETO SEM NOME'}
          </h1>
        </div>

        {/* Middle Section: Scene, Shot, Take */}
        <div className="flex-[2] flex flex-row border-b-8 border-white/20">
          <div className="flex-1 border-r-8 border-white/20 flex flex-col items-center justify-center p-4">
            <span className="text-[3vw] text-zinc-400 uppercase tracking-widest mb-2">Cena</span>
            <span className="text-[12vw] font-bold leading-none">{metadata.scene || '-'}</span>
          </div>
          <div className="flex-1 border-r-8 border-white/20 flex flex-col items-center justify-center p-4">
            <span className="text-[3vw] text-zinc-400 uppercase tracking-widest mb-2">Plano</span>
            <span className="text-[12vw] font-bold leading-none">{metadata.shot || '-'}</span>
          </div>
          <div className="flex-1 flex flex-col items-center justify-center p-4">
            <span className="text-[3vw] text-zinc-400 uppercase tracking-widest mb-2">Take</span>
            <span className="text-[12vw] font-bold leading-none text-emerald-400">{metadata.take || '01'}</span>
          </div>
        </div>

        {/* Bottom Section: Camera, Lens, Date */}
        <div className="flex-1 flex flex-row">
          <div className="flex-1 border-r-8 border-white/20 flex flex-col items-center justify-center p-4">
            <span className="text-[2vw] text-zinc-400 uppercase tracking-widest mb-1">Câmera</span>
            <span className="text-[6vw] font-bold leading-none">{metadata.camera || '-'}</span>
          </div>
          <div className="flex-1 border-r-8 border-white/20 flex flex-col items-center justify-center p-4">
            <span className="text-[2vw] text-zinc-400 uppercase tracking-widest mb-1">Lente</span>
            <span className="text-[6vw] font-bold leading-none">{metadata.lens || '-'}</span>
          </div>
          <div className="flex-1 flex flex-col items-center justify-center p-4">
            <span className="text-[2vw] text-zinc-400 uppercase tracking-widest mb-1">Data</span>
            <span className="text-[4vw] font-bold leading-none">
              {new Date().toLocaleDateString('pt-BR')}
            </span>
          </div>
        </div>

        {/* Instructions */}
        <div className="absolute bottom-6 left-0 right-0 text-center text-zinc-500 text-xl uppercase tracking-widest pointer-events-none">
          Toque na tela para Bater a Claquete (Flash + Beep)
        </div>
      </div>
    </div>
  );
}
