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
    
    // Smooth high-visibility sync flash
    setTimeout(() => {
      setIsFlashing(true);
    }, 15);

    setTimeout(() => {
      setIsFlashing(false);
    }, 150);

    setTimeout(() => {
      setIsClapping(false);
    }, 250);
  };

  const getAdaptiveFontSize = (text: string, baseVmin: number) => {
    if (!text) return `${baseVmin}vmin`;
    const length = text.toString().length;
    if (length > 20) return `${baseVmin * 0.55}vmin`;
    if (length > 15) return `${baseVmin * 0.65}vmin`;
    if (length > 10) return `${baseVmin * 0.75}vmin`;
    if (length > 6) return `${baseVmin * 0.9}vmin`;
    return `${baseVmin}vmin`;
  };

  const content = (
    <div className="fixed inset-0 z-[9999] bg-[#090a0f] text-white flex flex-col items-stretch justify-between p-0 overflow-hidden font-mono select-none w-screen h-screen">
      {/* Flash Overlay for Equipment/Video Sync */}
      <AnimatePresence>
        {isFlashing && (
          <motion.div
            initial={{ opacity: 1 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.12 }}
            className="absolute inset-0 bg-white z-50 pointer-events-none"
          />
        )}
      </AnimatePresence>
 
      {/* Close Button */}
      <button 
        type="button"
        onClick={onClose}
        className="absolute top-3 right-3 sm:top-5 sm:right-5 p-2 bg-zinc-900/90 hover:bg-zinc-800 rounded-full transition-all border border-zinc-800/80 z-50 text-zinc-400 hover:text-white cursor-pointer active:scale-95 shadow-md"
        id="btn-close-clapperboard"
      >
        <X size={20} className="sm:w-5 sm:h-5" />
      </button>

      {/* Interactive Main Fullscreen Frame wrapper */}
      <div 
        onClick={handleClap}
        className="w-full h-full flex-1 flex flex-col items-stretch justify-between cursor-pointer relative"
      >
        {/* SLATE BOARD CORE (Takes maximum possible space, borderless & zero rounded corners) */}
        <div className="w-full h-full flex-1 bg-[#090a0f] p-[3vmin] sm:p-[4vmin] flex flex-col justify-between select-none relative shadow-[inset_0_4px_40px_rgba(0,0,0,0.95)]">
          
          {/* Top Row: Flash indicator status light / sync info */}
          <div className="flex items-center justify-between border-b border-zinc-800/80 pb-[1.2vmin] mb-[1.2vmin] shrink-0">
            <span className="text-[1.8vmin] font-bold tracking-widest text-[#5d627c]">
              CAPIAUDIO SMART SYNC
            </span>
            <div className="flex items-center gap-[1.2vmin] mr-10 sm:mr-12">
              <span className={`w-[1.6vmin] h-[1.6vmin] rounded-full transition-all duration-100 ${isClapping ? 'bg-red-500 shadow-md shadow-red-500/50 animate-ping' : 'bg-emerald-500 shadow-md shadow-emerald-500/20'}`} />
              <span className="text-[1.5vmin] font-bold text-zinc-400 uppercase">
                {isClapping ? 'SINC' : 'PRONTO'}
              </span>
            </div>
          </div>

          {/* Main Title Section: Production / Movie Title */}
          <div className="border-b border-zinc-800/60 pb-[1.2vmin] mb-[1.2vmin] flex flex-col justify-center shrink-0">
            <span className="text-[1.5vmin] text-[#5d627c] uppercase tracking-widest mb-[0.25vh] font-bold">PROD. / FILME</span>
            <h1 
              style={{ fontSize: getAdaptiveFontSize(metadata.movieName || 'PROJETO SEM NOME', 7.5) }}
              className="font-black tracking-tight uppercase text-emerald-400 font-sans break-words whitespace-normal leading-tight line-clamp-1"
            >
              {metadata.movieName || 'PROJETO SEM NOME'}
            </h1>
          </div>

          {/* Major Compartments Grid: Scene, Shot, Take - Massive Scale with Adaptive Typo */}
          <div className="grid grid-cols-3 border-b border-zinc-800/60 pb-[1.5vmin] mb-[1.5vmin] gap-[2vmin] flex-1 items-center min-h-0">
            
            <div className="border-r border-zinc-800/80 pr-[1.5vmin] flex flex-col justify-center h-full min-w-0">
              <span className="text-[1.6vmin] text-[#5d627c] uppercase tracking-wider mb-[0.5vh] font-semibold text-center truncate">SCENE / CENA</span>
              <span 
                style={{ fontSize: getAdaptiveFontSize(metadata.scene || '-', 18) }}
                className="font-extrabold font-sans tracking-tight text-center break-words text-slate-100 leading-[1.1]"
              >
                {metadata.scene || '-'}
              </span>
            </div>
            
            <div className="border-r border-zinc-800/80 px-[1.5vmin] flex flex-col justify-center h-full min-w-0">
              <span className="text-[1.6vmin] text-[#5d627c] uppercase tracking-wider mb-[0.5vh] font-semibold text-center truncate">SHOT / PLANO</span>
              <span 
                style={{ fontSize: getAdaptiveFontSize(metadata.shot || '-', 18) }}
                className="font-extrabold font-sans tracking-tight text-center break-words text-slate-100 leading-[1.1]"
              >
                {metadata.shot || '-'}
              </span>
            </div>
            
            <div className="pl-[1.5vmin] flex flex-col justify-center h-full min-w-0">
              <span className="text-[1.6vmin] text-[#5d627c] uppercase tracking-wider mb-[0.5vh] font-semibold text-center truncate">TAKE / TAKE</span>
              <span 
                style={{ fontSize: getAdaptiveFontSize(metadata.take || '01', 24) }}
                className="font-black font-sans tracking-tight text-center break-words leading-[1.1] text-amber-400"
              >
                {metadata.take || '01'}
              </span>
            </div>

          </div>

          {/* Technical Specs Banner: Camera, Lens, Media Roll and Exposure Settings */}
          <div className="grid grid-cols-4 border-b border-zinc-800/60 pb-[1.2vmin] mb-[1.2vmin] gap-[2vmin] shrink-0">
            
            <div className="border-r border-zinc-800/80 pr-[1vmin] flex flex-col min-w-0 justify-center">
              <span className="text-[1.6vmin] text-[#5d627c] uppercase tracking-wider mb-[0.25vh] font-semibold truncate">CAM / LENS</span>
              <span className="text-[3.2vmin] font-bold tracking-tight text-slate-200 truncate animate-fade-in">
                {metadata.camera || '-'}{metadata.lens ? ` | ${metadata.lens}` : ''}
              </span>
            </div>
            
            <div className="border-r border-zinc-800/80 px-[1vmin] flex flex-col min-w-0 justify-center">
              <span className="text-[1.6vmin] text-[#5d627c] uppercase tracking-wider mb-[0.25vh] font-semibold truncate">ROLL / SOUND</span>
              <span className="text-[3.2vmin] font-bold tracking-tight text-slate-200 truncate">
                {metadata.rollCard || '-'}{metadata.soundRoll ? ` | ${metadata.soundRoll}` : ''}
              </span>
            </div>

            <div className="border-r border-zinc-800/80 px-[1vmin] flex flex-col min-w-0 justify-center">
              <span className="text-[1.6vmin] text-[#5d627c] uppercase tracking-wider mb-[0.25vh] font-semibold truncate">SETTINGS</span>
              <span className="text-[3.2vmin] font-bold tracking-tight text-slate-200 truncate">
                {metadata.iso ? `ISO ${metadata.iso}` : '-'}{metadata.fps ? ` | ${metadata.fps}` : ''}
              </span>
            </div>
            
            <div className="pl-[1vmin] flex flex-col min-w-0 justify-center">
              <span className="text-[1.6vmin] text-[#5d627c] uppercase tracking-wider mb-[0.25vh] font-semibold truncate">DATE / DATA</span>
              <span className="text-[3.2vmin] font-extrabold tracking-tight text-sky-400 truncate">
                {new Date().toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: '2-digit' })}
              </span>
            </div>

          </div>

          {/* Bottom Row: Director & Director of Photography */}
          <div className="grid grid-cols-2 gap-[2vmin] shrink-0">
            
            <div className="border-r border-zinc-800/80 pr-[1vmin] flex flex-col justify-center min-w-0">
              <span className="text-[1.6vmin] text-[#5d627c] uppercase tracking-widest mb-[0.25vh] font-semibold truncate">DIRECTOR / DIRETOR(A)</span>
              <span className="text-[3.6vmin] font-bold tracking-tight text-slate-200 truncate">
                {metadata.director || '-'}
              </span>
            </div>
            
            <div className="pl-[1vmin] flex flex-col justify-center min-w-0">
              <span className="text-[1.6vmin] text-[#5d627c] uppercase tracking-widest mb-[0.25vh] font-semibold truncate">DOP / DIR. FOTOGRAFIA</span>
              <span className="text-[3.6vmin] font-bold tracking-tight text-slate-200 truncate">
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
