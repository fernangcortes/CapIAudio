import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
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

  const content = (
    <div className="fixed inset-0 z-[9999] bg-black text-white flex flex-col items-center justify-center overflow-hidden font-mono">
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
        className="w-full h-full flex flex-col p-2 sm:p-8 cursor-pointer select-none"
        onClick={handleClap}
      >
        {/* Top Section: Movie Name */}
        <div className="flex-[0.5] flex items-center justify-center border-b-4 sm:border-b-8 border-white/20 p-2">
          <h1 className="text-3xl sm:text-5xl md:text-7xl font-bold tracking-tighter uppercase text-center leading-none line-clamp-1">
            {metadata.movieName || 'PROJETO SEM NOME'}
          </h1>
        </div>

        {/* Middle Section: Scene, Shot, Take */}
        <div className="flex-[2] grid grid-cols-3 border-b-4 sm:border-b-8 border-white/20">
          <div className="border-r-4 sm:border-r-8 border-white/20 flex flex-col items-center justify-center p-2">
            <span className="text-[10px] sm:text-sm md:text-xl text-zinc-400 uppercase tracking-widest mb-1 sm:mb-2">Cena</span>
            <span className="text-4xl sm:text-7xl md:text-9xl font-bold leading-none text-center break-all">{metadata.scene || '-'}</span>
          </div>
          <div className="border-r-4 sm:border-r-8 border-white/20 flex flex-col items-center justify-center p-2">
            <span className="text-[10px] sm:text-sm md:text-xl text-zinc-400 uppercase tracking-widest mb-1 sm:mb-2">Plano</span>
            <span className="text-4xl sm:text-7xl md:text-9xl font-bold leading-none text-center break-all">{metadata.shot || '-'}</span>
          </div>
          <div className="flex flex-col items-center justify-center p-2">
            <span className="text-[10px] sm:text-sm md:text-xl text-zinc-400 uppercase tracking-widest mb-1 sm:mb-2">Take</span>
            <span className="text-5xl sm:text-8xl md:text-[10rem] font-bold leading-none text-emerald-400 text-center">{metadata.take || '01'}</span>
          </div>
        </div>

        {/* Bottom Section: Camera, Lens, Date */}
        <div className="flex-1 grid grid-cols-3 border-b-4 sm:border-b-8 border-white/20">
          <div className="border-r-4 sm:border-r-8 border-white/20 flex flex-col items-center justify-center p-2">
            <span className="text-[8px] sm:text-xs md:text-lg text-zinc-400 uppercase tracking-widest mb-1 text-center">Câmera</span>
            <span className="text-xl sm:text-4xl md:text-6xl font-bold leading-none text-center">{metadata.camera || '-'}</span>
          </div>
          <div className="border-r-4 sm:border-r-8 border-white/20 flex flex-col items-center justify-center p-2">
            <span className="text-[8px] sm:text-xs md:text-lg text-zinc-400 uppercase tracking-widest mb-1 text-center">Lente</span>
            <span className="text-xl sm:text-4xl md:text-6xl font-bold leading-none text-center">{metadata.lens || '-'}</span>
          </div>
          <div className="flex flex-col items-center justify-center p-2">
            <span className="text-[8px] sm:text-xs md:text-lg text-zinc-400 uppercase tracking-widest mb-1 text-center">Data</span>
            <span className="text-lg sm:text-3xl md:text-5xl font-bold leading-none text-center">
              {new Date().toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: '2-digit' })}
            </span>
          </div>
        </div>

        {/* Crew Section: Director, DOP */}
        <div className="flex-1 grid grid-cols-2">
          <div className="border-r-4 sm:border-r-8 border-white/20 flex flex-col items-center justify-center p-2">
            <span className="text-[8px] sm:text-xs md:text-lg text-zinc-400 uppercase tracking-widest mb-1 text-center">Diretor(a)</span>
            <span className="text-sm sm:text-2xl md:text-4xl font-bold leading-none text-center line-clamp-2">{metadata.director || '-'}</span>
          </div>
          <div className="flex flex-col items-center justify-center p-2">
            <span className="text-[8px] sm:text-xs md:text-lg text-zinc-400 uppercase tracking-widest mb-1 text-center">Dir. Fotografia</span>
            <span className="text-sm sm:text-2xl md:text-4xl font-bold leading-none text-center line-clamp-2">{metadata.dop || '-'}</span>
          </div>
        </div>
      </div>
    </div>
  );

  return createPortal(content, document.body);
}
