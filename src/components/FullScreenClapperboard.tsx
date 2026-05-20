import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { CinemaMetadata } from '../types';
import { motion, AnimatePresence } from 'motion/react';
import { X } from 'lucide-react';

interface FullScreenClapperboardProps {
  metadata: CinemaMetadata;
  onClose: () => void;
}

export function FullScreenClapperboard({ metadata, onClose }: FullScreenClapperboardProps) {
  const [isFlashing, setIsFlashing] = useState(false);
  const [isClapping, setIsClapping] = useState(false);
  const audioContextRef = useRef<AudioContext | null>(null);

  useEffect(() => {
    audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
    
    const elem = document.documentElement;
    if (elem.requestFullscreen) {
      elem.requestFullscreen().catch((err) => {
        console.warn(`Error attempting to enable full-screen mode: ${err.message} (${err.name})`);
      });
    }

    return () => {
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
    
    if (audioContextRef.current.state === 'suspended') {
      audioContextRef.current.resume();
    }

    const oscillator = audioContextRef.current.createOscillator();
    const gainNode = audioContextRef.current.createGain();

    oscillator.type = 'sine';
    oscillator.frequency.setValueAtTime(1000, audioContextRef.current.currentTime);
    
    gainNode.gain.setValueAtTime(1, audioContextRef.current.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.001, audioContextRef.current.currentTime + 0.15);

    oscillator.connect(gainNode);
    gainNode.connect(audioContextRef.current.destination);

    oscillator.start();
    oscillator.stop(audioContextRef.current.currentTime + 0.15);
  };

  const handleClap = () => {
    if (isClapping) return;
    setIsClapping(true);
    playBeep();
    
    setTimeout(() => {
      setIsFlashing(true);
    }, 60);

    setTimeout(() => {
      setIsFlashing(false);
    }, 180);

    setTimeout(() => {
      setIsClapping(false);
    }, 450);
  };

  const content = (
    <div className="fixed inset-0 z-[9999] bg-[#0c0d12] text-white flex flex-col items-center justify-center p-4 md:p-8 overflow-hidden font-mono select-none">
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
        className="absolute top-4 right-4 md:top-6 md:right-6 p-3 md:p-4 bg-zinc-900/85 hover:bg-zinc-800 rounded-full transition-all border border-zinc-800 z-50 text-zinc-400 hover:text-white"
        id="btn-close-clapperboard"
      >
        <X size={28} />
      </button>

      {/* Clapperboard Container Frame */}
      <div 
        onClick={handleClap}
        className="w-full max-w-4xl h-full max-h-[85vh] flex flex-col items-center justify-center cursor-pointer p-2 rounded-2xl md:p-4 bg-[#14151f]/40 relative"
      >
        {/* CLAPPER STICKS (ARM & BODY BAR) */}
        <div className="w-full max-w-3xl flex flex-col relative" style={{ marginBottom: '-2px' }}>
          
          {/* Animated Movable ARM */}
          <motion.div 
            className="w-full origin-bottom-left z-20 relative"
            animate={{ rotate: isClapping ? 0 : -25 }}
            transition={{
              type: "spring",
              stiffness: isClapping ? 500 : 120,
              damping: isClapping ? 12 : 15
            }}
          >
            {/* The Arm stick */}
            <div className="w-[102%] -ml-[1%] h-12 md:h-16 bg-[#16171d] relative rounded-t-xl overflow-hidden shadow-2xl border-t border-l border-r border-[#3a3d52]/30 flex flex-col justify-end">
              <svg className="w-full h-full" viewBox="0 0 800 60" preserveAspectRatio="none">
                <defs>
                  <pattern id="stick-stripes-top" width="100" height="60" patternUnits="userSpaceOnUse">
                    <path d="M 0,60 L 40,0 L 70,0 L 30,60 Z" fill="#ffffff" />
                    <rect width="100" height="60" fill="none" />
                  </pattern>
                </defs>
                <rect width="100%" height="100%" fill="#121216" />
                <rect width="100%" height="100%" fill="url(#stick-stripes-top)" opacity="0.9" />
              </svg>
            </div>
          </motion.div>

          {/* Stationary LOWER BAR */}
          <div className="w-full h-12 md:h-16 bg-[#121318] z-10 relative overflow-hidden border-b-2 border-zinc-900 flex flex-col justify-end shadow-md">
            <svg className="w-full h-full" viewBox="0 0 800 60" preserveAspectRatio="none">
              <defs>
                <pattern id="stick-stripes-bottom" width="100" height="60" patternUnits="userSpaceOnUse">
                  <path d="M 30,60 L 70,0 L 40,0 L 0,60 Z" fill="#ffffff" />
                  <rect width="100" height="60" fill="none" />
                </pattern>
              </defs>
              <rect width="100%" height="100%" fill="#121216" />
              <rect width="100%" height="100%" fill="url(#stick-stripes-bottom)" opacity="0.9" />
            </svg>
            
            {/* Real Hinge Circle on Left */}
            <div className="absolute left-2 top-[35%] w-5 h-5 md:w-6 md:h-6 rounded-full bg-zinc-800 border-2 border-zinc-600 shadow-inner z-30" />
            
            {/* Interactivity Indicator */}
            <div className="absolute right-4 top-1/2 -translate-y-1/2 text-[9px] text-[#5d627c] tracking-widest font-sans uppercase animate-pulse">
              TOQUE PARA BATER CLAQUETE / TAP TO CLAP
            </div>
          </div>
        </div>

        {/* SLATE BOARD CORE */}
        <div className="w-full max-w-3xl bg-[#0e0f14] border-4 md:border-[6px] border-[#181924] rounded-b-2xl md:rounded-b-3xl p-4 md:p-6 shadow-2xl flex flex-col justify-between select-none relative [box-shadow:inset_0_4px_30px_rgba(0,0,0,0.8)]">
          
          {/* Top Section: Production / Movie Title */}
          <div className="border-b-2 border-zinc-800/80 pb-3 mb-4 flex flex-col">
            <span className="text-[10px] md:text-sm text-[#5d627c] uppercase tracking-widest mb-1">PROD. / FILME</span>
            <h1 className="text-xl sm:text-2xl md:text-4xl font-bold tracking-tight uppercase text-emerald-400 font-sans line-clamp-1 leading-none">
              {metadata.movieName || 'PROJETO SEM NOME'}
            </h1>
          </div>

          {/* Major Compartments Grid: Scene, Shot, Take */}
          <div className="grid grid-cols-3 border-b-2 border-zinc-800/80 pb-4 mb-4 gap-4">
            <div className="border-r border-zinc-800/80 pr-2 flex flex-col justify-center">
              <span className="text-[10px] md:text-xs text-[#5d627c] uppercase tracking-wider mb-2">SCENE / CENA</span>
              <span className="text-3xl sm:text-5xl md:text-7xl font-bold font-sans tracking-tighter text-center truncate py-1 text-slate-100">
                {metadata.scene || '-'}
              </span>
            </div>
            
            <div className="border-r border-zinc-800/80 px-2 flex flex-col justify-center">
              <span className="text-[10px] md:text-xs text-[#5d627c] uppercase tracking-wider mb-2">SHOT / PLANO</span>
              <span className="text-3xl sm:text-5xl md:text-7xl font-bold font-sans tracking-tighter text-center truncate py-1 text-slate-100">
                {metadata.shot || '-'}
              </span>
            </div>
            
            <div className="pl-2 flex flex-col justify-center">
              <span className="text-[10px] md:text-xs text-[#5d627c] uppercase tracking-wider mb-2">TAKE / TAKE</span>
              <span className="text-4xl sm:text-6xl md:text-8xl font-black font-sans tracking-tighter text-center py-1 text-amber-400">
                {metadata.take || '01'}
              </span>
            </div>
          </div>

          {/* Technical Specs: Camera, Lens, Date */}
          <div className="grid grid-cols-3 border-b-2 border-zinc-800/80 pb-4 mb-4 gap-4">
            <div className="border-r border-zinc-800/80 pr-2 flex flex-col">
              <span className="text-[9px] md:text-xs text-[#5d627c] uppercase tracking-wider mb-1">CAMERA / CÂMERA</span>
              <span className="text-lg sm:text-2xl md:text-4xl font-medium tracking-tight text-slate-200">
                {metadata.camera || '-'}
              </span>
            </div>
            
            <div className="border-r border-zinc-800/80 px-2 flex flex-col">
              <span className="text-[9px] md:text-xs text-[#5d627c] uppercase tracking-wider mb-1">LENS / LENTE</span>
              <span className="text-lg sm:text-2xl md:text-4xl font-medium tracking-tight text-slate-200">
                {metadata.lens || '-'}
              </span>
            </div>
            
            <div className="pl-2 flex flex-col">
              <span className="text-[9px] md:text-xs text-[#5d627c] uppercase tracking-wider mb-1">DATE / DATA</span>
              <span className="text-lg sm:text-2xl md:text-4xl font-bold tracking-tight text-sky-400">
                {new Date().toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: '2-digit' })}
              </span>
            </div>
          </div>

          {/* Bottom Row: Director & Director of Photography */}
          <div className="grid grid-cols-2 gap-4">
            <div className="border-r border-zinc-800/80 pr-4 flex flex-col justify-center">
              <span className="text-[9px] md:text-xs text-[#5d627c] uppercase tracking-widest mb-1">DIRECTOR / DIRETOR(A)</span>
              <span className="text-base sm:text-xl md:text-3xl font-medium tracking-tight text-slate-100 line-clamp-1 py-1">
                {metadata.director || '-'}
              </span>
            </div>
            
            <div className="pl-2 flex flex-col justify-center">
              <span className="text-[9px] md:text-xs text-[#5d627c] uppercase tracking-widest mb-1">DOP / DIR. FOTOGRAFIA</span>
              <span className="text-base sm:text-xl md:text-3xl font-medium tracking-tight text-slate-100 line-clamp-1 py-1">
                {metadata.dop || '-'}
              </span>
            </div>
          </div>

        </div>
      </div>
    </div>
  );

  return createPortal(content, document.body);
}
