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

  const enterFullScreenMode = () => {
    const elem = document.documentElement;
    const req = elem.requestFullscreen || 
                (elem as any).webkitRequestFullscreen || 
                (elem as any).msRequestFullscreen || 
                (elem as any).mozRequestFullScreen;
    if (req) {
      req.call(elem).catch((err: any) => {
        console.warn(`Error attempting to enable full-screen:`, err);
      });
    }
  };

  const exitFullScreenMode = () => {
    const doc = document as any;
    const exit = doc.exitFullscreen || 
                 doc.webkitExitFullscreen || 
                 doc.msExitFullscreen || 
                 doc.mozCancelFullScreen;
    const isFull = doc.fullscreenElement || 
                   doc.webkitFullscreenElement || 
                   doc.msFullscreenElement || 
                   doc.mozFullScreenElement;
    if (exit && isFull) {
      exit.call(doc).catch((err: any) => {
        console.warn(`Error attempting to exit full-screen:`, err);
      });
    }
  };

  useEffect(() => {
    audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
    
    enterFullScreenMode();

    return () => {
      exitFullScreenMode();
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
    enterFullScreenMode(); // Ensure maximized state if exited by mistake
    if (isClapping) return;
    setIsClapping(true);
    playBeep();
    
    // 2x faster flash and state resets
    setTimeout(() => {
      setIsFlashing(true);
    }, 30);

    setTimeout(() => {
      setIsFlashing(false);
    }, 90);

    setTimeout(() => {
      setIsClapping(false);
    }, 225);
  };

  const content = (
    <div className="fixed inset-0 z-[9999] bg-[#0c0d12] text-white flex flex-col items-center justify-center p-[2vmin] overflow-hidden font-mono select-none">
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
        className="absolute top-4 right-4 md:top-6 md:right-6 p-2 bg-zinc-900/85 hover:bg-zinc-800 rounded-full transition-all border border-zinc-800 z-50 text-zinc-400 hover:text-white cursor-pointer"
        id="btn-close-clapperboard"
      >
        <X size={24} className="sm:w-7 sm:h-7" />
      </button>

      {/* Interactive Main Frame wrapper */}
      <div 
        onClick={handleClap}
        className="w-full max-w-[94vw] sm:max-w-[90vw] md:max-w-[85vw] lg:max-w-[78vw] xl:max-w-[74vw] flex flex-col items-center justify-center cursor-pointer p-2 sm:p-4 md:p-6 relative max-h-[85vh]"
      >
        {/* Relative layout context block */}
        <div className="w-full relative flex flex-col items-center">
          
          {/* Animated Clapper Sticks Overlay (only visible in front during clapping, 2x faster) */}
          <AnimatePresence>
            {isClapping && (
              <motion.div
                initial={{ opacity: 0, scaleY: 0.8, y: -5 }}
                animate={{ opacity: 1, scaleY: 1, y: 0 }}
                exit={{ opacity: 0, scaleY: 0.8, y: -5 }}
                transition={{ duration: 0.08 }}
                className="absolute top-[2px] -translate-y-full left-0 right-0 z-40 flex flex-col origin-bottom pointer-events-none"
              >
                {/* Movable UPPER ARM (extremely fast spring physics) */}
                <motion.div 
                  className="w-full origin-bottom-left z-20 relative"
                  initial={{ rotate: -28 }}
                  animate={{ rotate: 0 }}
                  transition={{
                    type: "spring",
                    stiffness: 1200, // extremely snappy clack down
                    damping: 16
                  }}
                >
                  <div className="w-[102%] -ml-[1%] h-[6vmin] min-h-[24px] bg-[#16171d] relative rounded-t-lg overflow-hidden shadow-2xl border-t border-l border-r border-[#3a3d52]/30 flex flex-col justify-end">
                    <svg className="w-full h-full" viewBox="0 0 800 60" preserveAspectRatio="none">
                      <defs>
                        <pattern id="stick-stripes-top-fs" width="100" height="60" patternUnits="userSpaceOnUse">
                          <path d="M 0,60 L 40,0 L 70,0 L 30,60 Z" fill="#ffffff" />
                          <rect width="100" height="60" fill="none" />
                        </pattern>
                      </defs>
                      <rect width="100%" height="100%" fill="#121216" />
                      <rect width="100%" height="100%" fill="url(#stick-stripes-top-fs)" opacity="0.9" />
                    </svg>
                  </div>
                </motion.div>

                {/* Stationary LOWER BAR */}
                <div className="w-[102%] -ml-[1%] h-[6vmin] min-h-[24px] bg-[#121318] z-10 relative overflow-hidden flex flex-col justify-end shadow-md border-b-2 border-zinc-900">
                  <svg className="w-full h-full" viewBox="0 0 800 60" preserveAspectRatio="none">
                    <defs>
                      <pattern id="stick-stripes-bottom-fs" width="100" height="60" patternUnits="userSpaceOnUse">
                        <path d="M 30,60 L 70,0 L 40,0 L 0,60 Z" fill="#ffffff" />
                        <rect width="100" height="60" fill="none" />
                      </pattern>
                    </defs>
                    <rect width="100%" height="100%" fill="#121216" />
                    <rect width="100%" height="100%" fill="url(#stick-stripes-bottom-fs)" opacity="0.9" />
                  </svg>
                  
                  {/* Real Hinge Circle on Left */}
                  <div className="absolute left-2 top-[30%] w-[2vmin] h-[2vmin] min-w-[8px] min-h-[8px] rounded-full bg-zinc-850 border-[1.5px] border-zinc-650 shadow-inner z-30" />
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* SLATE BOARD CORE (Always visible, clean, perfectly scaled margins) */}
          <div className="w-full bg-[#0e0f14] border-[1.1vmin] border-[#181924] rounded-[2.5vmin] p-[4vmin] shadow-2xl flex flex-col justify-between select-none relative [box-shadow:inset_0_4px_30px_rgba(0,0,0,0.8)] max-h-[72vh]">
            
            {/* Top Section: Production / Movie Title */}
            <div className="border-b border-zinc-800/60 pb-[1.5vmin] mb-[2vmin] flex flex-col">
              <span className="text-[1.8vmin] text-[#5d627c] uppercase tracking-widest mb-[0.6vmin] block font-bold">PROD. / FILME</span>
              <h1 className="text-[3.2vmin] font-black tracking-tight uppercase text-emerald-400 font-sans break-words whitespace-normal leading-tight block">
                {metadata.movieName || 'PROJETO SEM NOME'}
              </h1>
            </div>

            {/* Major Compartments Grid: Scene, Shot, Take (No Cutoffs, Perfect Wrap) */}
            <div className="grid grid-cols-3 border-b border-zinc-800/60 pb-[1.5vmin] mb-[2vmin] gap-[2.5vmin]">
              <div className="border-r border-zinc-800/80 pr-[1.5vmin] flex flex-col justify-center min-w-0">
                <span className="text-[1.7vmin] text-[#5d627c] uppercase tracking-wider mb-[0.8vmin] block font-semibold">SCENE / CENA</span>
                <span className="text-[2.2vmin] font-bold font-sans tracking-tight text-center break-words whitespace-normal leading-snug text-slate-100 block">
                  {metadata.scene || '-'}
                </span>
              </div>
              
              <div className="border-r border-zinc-800/80 px-[1.5vmin] flex flex-col justify-center min-w-0">
                <span className="text-[1.7vmin] text-[#5d627c] uppercase tracking-wider mb-[0.8vmin] block font-semibold">SHOT / PLANO</span>
                <span className="text-[2.2vmin] font-bold font-sans tracking-tight text-center break-words whitespace-normal leading-snug text-slate-100 block">
                  {metadata.shot || '-'}
                </span>
              </div>
              
              <div className="pl-[1.5vmin] flex flex-col justify-center min-w-0">
                <span className="text-[1.7vmin] text-[#5d627c] uppercase tracking-wider mb-[0.8vmin] block font-semibold">TAKE / TAKE</span>
                <span className="text-[5.5vmin] font-black font-sans tracking-tight text-center break-words whitespace-normal leading-none text-amber-400 block">
                  {metadata.take || '01'}
                </span>
              </div>
            </div>

            {/* Technical Specs: Camera, Lens, Date */}
            <div className="grid grid-cols-3 border-b border-zinc-800/60 pb-[1.5vmin] mb-[2vmin] gap-[2.5vmin]">
              <div className="border-r border-zinc-800/80 pr-[1.5vmin] flex flex-col min-w-0">
                <span className="text-[1.5vmin] text-[#5d627c] uppercase tracking-wider mb-[0.6vmin] block font-semibold">CAMERA / CÂMERA</span>
                <span className="text-[2.2vmin] font-bold tracking-tight text-slate-200 break-words whitespace-normal leading-snug block">
                  {metadata.camera || '-'}
                </span>
              </div>
              
              <div className="border-r border-zinc-800/80 px-[1.5vmin] flex flex-col min-w-0">
                <span className="text-[1.5vmin] text-[#5d627c] uppercase tracking-wider mb-[0.6vmin] block font-semibold">LENS / LENTE</span>
                <span className="text-[2.2vmin] font-bold tracking-tight text-slate-200 break-words whitespace-normal leading-snug block">
                  {metadata.lens || '-'}
                </span>
              </div>
              
              <div className="pl-[1.5vmin] flex flex-col min-w-0">
                <span className="text-[1.5vmin] text-[#5d627c] uppercase tracking-wider mb-[0.6vmin] block font-semibold">DATE / DATA</span>
                <span className="text-[2.2vmin] font-extrabold tracking-tight text-sky-400 block">
                  {new Date().toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: '2-digit' })}
                </span>
              </div>
            </div>

            {/* Bottom Row: Director & Director of Photography */}
            <div className="grid grid-cols-2 gap-[2.5vmin]">
              <div className="border-r border-zinc-800/80 pr-[1.5vmin] flex flex-col justify-center min-w-0">
                <span className="text-[1.5vmin] text-[#5d627c] uppercase tracking-widest mb-[0.6vmin] block font-semibold">DIRECTOR / DIRETOR(A)</span>
                <span className="text-[2.2vmin] font-bold tracking-tight text-slate-100 break-words whitespace-normal leading-snug block">
                  {metadata.director || '-'}
                </span>
              </div>
              
              <div className="pl-[1.5vmin] flex flex-col justify-center min-w-0">
                <span className="text-[1.5vmin] text-[#5d627c] uppercase tracking-widest mb-[0.6vmin] block font-semibold">DOP / DIR. FOTOGRAFIA</span>
                <span className="text-[2.2vmin] font-bold tracking-tight text-slate-100 break-words whitespace-normal leading-snug block">
                  {metadata.dop || '-'}
                </span>
              </div>
            </div>

          </div>
        </div>

        {/* Dynamic Horizontal Help Instruction Overlay */}
        <div className="mt-[2.5vmin] text-[1.8vmin] text-[#5d627c] tracking-widest font-sans uppercase animate-pulse text-center">
          TOQUE EM QUALQUER LUGAR PARA BATER CLAQUETE / TAP ANYWHERE TO CLAP
        </div>
      </div>
    </div>
  );

  return createPortal(content, document.body);
}
