import React, { useState, useEffect } from 'react';
import { Download, Share2, Plus, Smartphone, X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { getTranslation, LanguageType } from '../services/translationService';

interface InstallAppPromptProps {
  language: LanguageType;
}

export function InstallAppPrompt({ language }: InstallAppPromptProps) {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isInstallable, setIsInstallable] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);
  const [showIosGuide, setShowIosGuide] = useState(false);
  const [isIosDevice, setIsIosDevice] = useState(false);
  const [isVisible, setIsVisible] = useState(true);

  const t = (key: any) => getTranslation(key, language);

  useEffect(() => {
    // Check if running in standalone mode (already installed)
    const isStandaloneMode = window.matchMedia('(display-mode: standalone)').matches 
      || (window.navigator as any).standalone 
      || document.referrer.includes('android-app://');
    
    setIsStandalone(!!isStandaloneMode);

    // Detect iOS
    const userAgent = window.navigator.userAgent.toLowerCase();
    const isIos = /iphone|ipad|ipod/.test(userAgent);
    setIsIosDevice(isIos);

    if (isStandaloneMode) return;

    // Listen to standard beforeinstallprompt
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setIsInstallable(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    // Local storage check to let user dismiss the banner for 1 day
    const dismissedTime = localStorage.getItem('PWA_PROMPT_DISMISSED');
    if (dismissedTime) {
      const now = new Date().getTime();
      const oneDay = 24 * 60 * 60 * 1000;
      if (now - parseInt(dismissedTime, 10) < oneDay) {
        setIsVisible(false);
      }
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallClick = async () => {
    if (isIosDevice) {
      setShowIosGuide(true);
      return;
    }

    if (!deferredPrompt) {
      // Fallback for browsers that don't support or fire the event
      alert(
        language === 'pt' 
          ? 'Para instalar, abra as configurações do seu navegador (três pontinhos) e selecione "Instalar aplicativo" ou "Adicionar à tela de início".' 
          : 'To install, open your browser options menu and choose "Install app" or "Add to Home Screen".'
      );
      return;
    }

    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      setDeferredPrompt(null);
      setIsInstallable(false);
      setIsStandalone(true);
    }
  };

  const handleDismiss = () => {
    localStorage.setItem('PWA_PROMPT_DISMISSED', new Date().getTime().toString());
    setIsVisible(false);
  };

  if (isStandalone || !isVisible) {
    return null;
  }

  // We show prompt if compatible, OR if the user is on iOS and want manual installation instructions
  const shouldShow = isInstallable || isIosDevice;
  if (!shouldShow) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -20, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: -20, scale: 0.95 }}
        className="w-full max-w-xl bg-[#131622] border border-emerald-500/25 rounded-2xl p-5 shadow-2xl relative overflow-hidden text-left"
      >
        {/* Subtle background glow */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 rounded-full blur-3xl pointer-events-none" />

        <div className="flex gap-4 items-start relative z-10 w-full">
          <div className="p-3 bg-emerald-500/10 text-emerald-400 rounded-xl shrink-0">
            <Download size={20} className="stroke-[2.5]" />
          </div>

          <div className="flex-1 space-y-1 w-full">
            <div className="flex items-center justify-between w-full">
              <h4 className="font-bold text-white text-sm flex items-center gap-1.5">
                {t('installApp')}
                <span className="text-[9px] bg-emerald-500/15 text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded-full uppercase font-bold tracking-widest animate-pulse">
                  PWA
                </span>
              </h4>
              <button 
                onClick={handleDismiss} 
                className="text-zinc-500 hover:text-zinc-300 transition-colors p-1 rounded-md hover:bg-white/5 cursor-pointer"
              >
                <X size={15} />
              </button>
            </div>
            
            <p className="text-zinc-400 text-xs leading-relaxed font-light">
              {t('installAppDescription')}
            </p>

            <div className="flex flex-wrap gap-2.5 pt-3">
              <button
                onClick={handleInstallClick}
                className="flex items-center gap-1.5 px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-black font-bold text-xs rounded-xl shadow-lg shadow-emerald-500/10 cursor-pointer transition-all active:scale-95"
              >
                {isIosDevice ? <Smartphone size={13} /> : <Download size={13} />}
                {isIosDevice ? t('addHome') : t('installNow')}
              </button>
              
              <button
                onClick={handleDismiss}
                className="px-3 py-2 text-zinc-400 hover:text-white text-xs font-semibold cursor-pointer transition-colors"
              >
                {language === 'pt' ? 'Depois' : 'Later'}
              </button>
            </div>
          </div>
        </div>

        {/* Swipe-up modal or elegant drawer for iOS instruction walkthrough */}
        {showIosGuide && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            className="mt-4 pt-4 border-t border-zinc-800/80 space-y-3 relative z-10"
          >
            <div className="flex items-center justify-between">
              <h5 className="text-[10px] font-bold text-zinc-400 flex items-center gap-1.5 uppercase tracking-wider">
                📱 {language === 'pt' ? 'Manual de instalação iOS / Safari:' : 'Manual steps for iOS / Safari:'}
              </h5>
              <button 
                onClick={() => setShowIosGuide(false)}
                className="text-[10px] text-zinc-500 hover:text-zinc-300 underline cursor-pointer"
              >
                {language === 'pt' ? 'Fechar' : 'Close'}
              </button>
            </div>
            
            <div className="grid grid-cols-1 gap-2">
              <div className="flex items-center gap-3 bg-zinc-950/40 p-2.5 rounded-xl border border-white/5">
                <div className="w-5 h-5 rounded bg-zinc-800 flex items-center justify-center text-xs font-bold text-emerald-400 shrink-0">
                  1
                </div>
                <p className="text-zinc-350 text-xs leading-normal font-light flex items-center gap-1.5 flex-wrap">
                  {t('iosStep1')}
                  <span className="p-1 bg-zinc-800 text-zinc-300 rounded inline-flex items-center justify-center">
                    <Share2 size={12} className="stroke-[2.5]" />
                  </span>
                </p>
              </div>

              <div className="flex items-center gap-3 bg-zinc-950/40 p-2.5 rounded-xl border border-white/5">
                <div className="w-5 h-5 rounded bg-zinc-800 flex items-center justify-center text-xs font-bold text-emerald-400 shrink-0">
                  2
                </div>
                <p className="text-zinc-350 text-xs leading-normal font-light flex items-center gap-1.5 flex-wrap">
                  {t('iosStep2')}
                  <span className="p-1 bg-zinc-800 text-zinc-300 rounded inline-flex items-center justify-center font-bold text-emerald-400">
                    <Plus size={12} className="stroke-[2.5]" />
                  </span>
                </p>
              </div>

              <div className="flex items-center gap-3 bg-zinc-950/40 p-2.5 rounded-xl border border-white/5">
                <div className="w-5 h-5 rounded bg-zinc-800 flex items-center justify-center text-xs font-bold text-emerald-400 shrink-0">
                  3
                </div>
                <p className="text-zinc-350 text-xs leading-normal font-light">
                  {t('iosStep3')}
                </p>
              </div>
            </div>

            <div className="bg-emerald-500/5 p-3 rounded-xl border border-emerald-500/10 text-[10px] text-zinc-400 leading-relaxed font-light">
              💡 {language === 'pt' 
                ? 'Nota: Abra o app no Safari para ver a opção de instalar na tela do seu iPhone ou iPad.' 
                : 'Note: Please open this app inside iOS Safari browser to properly trigger the native install options.'}
            </div>
          </motion.div>
        )}
      </motion.div>
    </AnimatePresence>
  );
}
