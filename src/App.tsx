import React, { useState, useEffect, useCallback } from 'react';
import { useAudioRecorder } from './hooks/useAudioRecorder';
import { useMarkers } from './hooks/useMarkers';
import { useSync } from './hooks/useSync';
import { Recorder } from './components/Recorder';
import { MarkerGrid } from './components/MarkerGrid';
import { ResultScreen } from './components/ResultScreen';
import { HistoryScreen } from './components/HistoryScreen';
import { APP_MODES } from './constants';
import { CinemaHeader } from './components/CinemaHeader';
import { Documentation } from './components/Documentation';
import { FormFieldsEditor } from './components/FormFieldsEditor';
import { ModulesCatalog } from './components/ModulesCatalog';
import { defaultFields } from './components/ModeSetupForm';
import { AppMode, RecordingSession, ModeConfig, CinemaMetadata, ChecklistItem } from './types';
import { ChecklistCard } from './components/ChecklistCard';
import { DEFAULT_CHECKLISTS } from './defaultChecklists';
import { motion, AnimatePresence } from 'motion/react';
import { Settings2, History, Edit3, Save, Plus, Wifi, Book, BookOpen, Trash2, LogOut, Undo2, Redo2, AlertCircle } from 'lucide-react';
import { getAllModes, saveCustomModes, saveSession, syncCustomModesFromCloud } from './services/storageService';
import { getTranslation, modeTranslations, translations, LanguageType } from './services/translationService';
import { auth, signInWithGoogle, logOut, testConnection } from './services/firebase';
import { onAuthStateChanged, User } from 'firebase/auth';

export const getPopulatedModes = (rawModes: Record<string, ModeConfig>): Record<string, ModeConfig> => {
  const populated: Record<string, ModeConfig> = {};
  Object.entries(rawModes).forEach(([id, mode]) => {
    populated[id] = {
      ...mode,
      formFields: mode.formFields && mode.formFields.length > 0
        ? mode.formFields
        : (defaultFields[id] || defaultFields['default'])
    };
  });
  return populated;
};

export default function App() {
  const [language, setLanguage] = useState<LanguageType>(() => {
    return (localStorage.getItem('APP_LANGUAGE') as LanguageType) || 'pt';
  });

  const [user, setUser] = useState<User | null>(null);
  const [isAuthLoading, setIsAuthLoading] = useState(true);

  const [showHeader, setShowHeader] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      if (currentScrollY > lastScrollY && currentScrollY > 60) {
        setShowHeader(false);
      } else {
        setShowHeader(true);
      }
      setLastScrollY(currentScrollY);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [lastScrollY]);

  const toggleLanguage = () => {
    setLanguage(prev => {
      const next = prev === 'pt' ? 'en' : 'pt';
      localStorage.setItem('APP_LANGUAGE', next);
      return next;
    });
  };

  const t = (key: keyof typeof translations.pt) => getTranslation(key, language);

  const [modes, setModes] = useState<Record<string, ModeConfig>>(() => {
    return getPopulatedModes(getAllModes());
  });
  const [currentModeId, setCurrentModeId] = useState<AppMode>('cinema');
  const currentMode = modes[currentModeId] || modes['cinema'];
  
  const [view, setView] = useState<'recorder' | 'results' | 'history' | 'docs'>('recorder');
  const [showSettings, setShowSettings] = useState(false);
  const [isEditingLayout, setIsEditingLayout] = useState(false);
  const [isEditingModeName, setIsEditingModeName] = useState(false);
  const [editedModeName, setEditedModeName] = useState('');
  const [isEditingFormFields, setIsEditingFormFields] = useState(false);
  const [isCatalogOpen, setIsCatalogOpen] = useState(false);
  const [modeToDelete, setModeToDelete] = useState<string | null>(null);

  const handleSaveFormFields = (updatedFields: any[]) => {
    const updatedMode = { ...currentMode, formFields: updatedFields, custom: true };
    const newModes = { ...modes, [currentModeId]: updatedMode };
    setModes(newModes);
    
    // Save to local storage
    const customModesList = (Object.values(newModes) as ModeConfig[]).filter(m => m.custom);
    saveCustomModes(customModesList);
    setIsEditingFormFields(false);
  };
  const [syncRoomId, setSyncRoomId] = useState(localStorage.getItem('SYNC_ROOM_ID') || '');
  const [cinemaMetadata, setCinemaMetadata] = useState<CinemaMetadata>({
    movieName: '',
    scene: '',
    shot: '',
    take: '01',
    camera: 'A',
    lens: ''
  });

  const { isConnected, remoteState, remoteMarkers, updateState, addMarker: syncAddMarker } = useSync(syncRoomId);

  const handleSaveModeName = () => {
    if (editedModeName.trim() && currentMode.custom) {
      const updatedMode = { ...currentMode, name: editedModeName.trim() };
      const newModes = { ...modes, [currentModeId]: updatedMode };
      setModes(newModes);
      
      const customModesList = (Object.values(newModes) as ModeConfig[]).filter(m => m.custom);
      saveCustomModes(customModesList);
    }
    setIsEditingModeName(false);
  };

  const handleDeleteMode = () => {
    if (currentMode.custom) {
      setModeToDelete(currentModeId);
    }
  };

  const confirmDeleteMode = () => {
    if (modeToDelete) {
      const newModes = { ...modes };
      delete newModes[modeToDelete];
      setModes(newModes);
      setCurrentModeId('cinema');
      
      const customModesList = (Object.values(newModes) as ModeConfig[]).filter(m => m.custom);
      saveCustomModes(customModesList);
      setModeToDelete(null);
    }
  };
  const [apiKeyInput, setApiKeyInput] = useState('');
  const [imageModel, setImageModel] = useState(localStorage.getItem('IMAGE_MODEL') || 'gemini-3.1-flash-image-preview');
  const [imageSize, setImageSize] = useState(localStorage.getItem('IMAGE_SIZE') || '512px');
  
  const [currentSession, setCurrentSession] = useState<RecordingSession | null>(null);
  const [setupData, setSetupData] = useState<Record<string, any>>({});
  const [pendingBlobs, setPendingBlobs] = useState<Blob[]>([]);
  const [checklist, setChecklist] = useState<ChecklistItem[]>([]);
  const [isStopWarningOpen, setIsStopWarningOpen] = useState(false);

  const handleChunkReady = useCallback((blob: Blob, startTime: number) => {
    setPendingBlobs(prev => [...prev, blob]);
  }, []);

  const {
    isRecording,
    isPaused,
    currentTime,
    audioBlob,
    audioUrl,
    mediaStream,
    startRecording,
    pauseRecording,
    stopRecording,
    resetRecording,
    setCurrentTime,
    getAudioChunk
  } = useAudioRecorder({
    onChunkReady: handleChunkReady,
    chunkDurationMs: 600000 // 10 minutes
  });

  const {
    markers,
    redoStack,
    customButtons,
    speakers,
    addMarker,
    undoMarker,
    redoMarker,
    deleteMarker,
    addCustomButton,
    addSpeaker,
    resetMarkers,
    setButtons,
    setMarkers
  } = useMarkers(currentMode.defaultButtons);

  useEffect(() => {
    testConnection();
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      setIsAuthLoading(false);
      
      // Update custom mode layouts
      const updatedModes = getPopulatedModes(getAllModes());
      setModes(updatedModes);
      
      if (currentUser) {
        try {
          const cloudCustomModes = await syncCustomModesFromCloud();
          if (cloudCustomModes.length > 0) {
            const reloadedModes = getPopulatedModes(getAllModes());
            setModes(reloadedModes);
          }
        } catch (e) {
          console.error("Failed to sync cloud custom modes:", e);
        }
      }
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      if (currentScrollY > lastScrollY && currentScrollY > 60) {
        setShowHeader(false);
      } else {
        setShowHeader(true);
      }
      setLastScrollY(currentScrollY);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [lastScrollY]);

  useEffect(() => {
    if (!isRecording && !audioBlob && !isEditingLayout) {
      setButtons(currentMode.defaultButtons);
      setSetupData({}); // Reset setup data when mode changes
    }
  }, [currentModeId, isRecording, audioBlob, setButtons, isEditingLayout]);

  // Load default checklist when mode changes
  useEffect(() => {
    if (!isRecording && !audioBlob) {
      const defaultTexts = DEFAULT_CHECKLISTS[currentModeId] || [
        "Iniciar gravação de teste",
        "Configurar metadados do fluxo",
        "Marcar pontos críticos",
        "Finalizar e salvar sessão"
      ];
      setChecklist(
        defaultTexts.map((text, idx) => ({
          id: `chk-${idx}-${Date.now()}`,
          text,
          completed: false
        }))
      );
    }
  }, [currentModeId, isRecording, audioBlob]);

  useEffect(() => {
    const key = localStorage.getItem('GEMINI_API_KEY');
    if (key) setApiKeyInput(key);
  }, []);

  const saveSettings = () => {
    localStorage.setItem('GEMINI_API_KEY', apiKeyInput);
    localStorage.setItem('IMAGE_MODEL', imageModel);
    localStorage.setItem('IMAGE_SIZE', imageSize);
    localStorage.setItem('SYNC_ROOM_ID', syncRoomId);
    setShowSettings(false);
  };

  const handleSaveLayout = () => {
    const updatedMode = { ...currentMode, defaultButtons: customButtons, custom: true };
    const newModes = { ...modes, [currentModeId]: updatedMode };
    setModes(newModes);
    
    // Save to local storage
    const customModesList = (Object.values(newModes) as ModeConfig[]).filter(m => m.custom);
    saveCustomModes(customModesList);
    setIsEditingLayout(false);
  };

  const handleCreateMode = () => {
    const newId = `custom-${Math.random().toString(36).substr(2, 9)}`;
    const newMode: ModeConfig = {
      id: newId,
      name: 'Novo Modo',
      icon: '✨',
      description: 'Modo personalizado',
      defaultButtons: [],
      custom: true
    };
    const newModes = { ...modes, [newId]: newMode };
    setModes(newModes);
    setCurrentModeId(newId);
    setButtons([]);
    setSetupData({});
    setIsEditingLayout(true);
    
    const customModesList = (Object.values(newModes) as ModeConfig[]).filter(m => m.custom);
    saveCustomModes(customModesList);
  };

  useEffect(() => {
    if (syncRoomId) {
      updateState({ isRecording, metadata: cinemaMetadata });
    }
  }, [isRecording, cinemaMetadata, syncRoomId]);

  useEffect(() => {
    if (syncRoomId && remoteState.metadata && !isRecording) {
      if (JSON.stringify(cinemaMetadata) !== JSON.stringify(remoteState.metadata)) {
        setCinemaMetadata(remoteState.metadata);
      }
    }
  }, [remoteState.metadata, isRecording, syncRoomId, cinemaMetadata]);

  const handleStartRecording = () => {
    if (isEditingLayout) setIsEditingLayout(false);
    setPendingBlobs([]);
    startRecording();
  };

  const handleToggleChecklistItem = (id: string) => {
    setChecklist(prev => prev.map(item => item.id === id ? { ...item, completed: !item.completed } : item));
  };

  const handleAddChecklistItem = (text: string) => {
    setChecklist(prev => [
      ...prev,
      {
        id: `chk-custom-${Math.random().toString(36).substr(2, 9)}`,
        text,
        completed: false
      }
    ]);
  };

  const handleDeleteChecklistItem = (id: string) => {
    setChecklist(prev => prev.filter(item => item.id !== id));
  };

  const handleStopRequest = () => {
    const unfinished = checklist.filter(item => !item.completed);
    if (unfinished.length > 0) {
      setIsStopWarningOpen(true);
    } else {
      handleStop();
    }
  };

  const handleStop = async () => {
    const newBlob = await stopRecording();
    
    const sessionTitle = setupData.title || setupData.project || setupData.story || setupData.subject || setupData.interviewee || setupData.doctorName || `Gravação - ${new Date().toLocaleString()}`;
    
    let session = currentSession;
    if (!session) {
      session = {
        id: Math.random().toString(36).substr(2, 9),
        title: sessionTitle,
        date: new Date().toISOString(),
        modeId: currentModeId,
        audioBlobs: [...pendingBlobs, newBlob],
        markers: markers,
        duration: currentTime,
        cinemaMetadata: currentModeId === 'cinema' ? cinemaMetadata : undefined,
        setupData: setupData,
        checklist: checklist
      };
    } else {
      session = {
        ...session,
        title: sessionTitle,
        audioBlobs: [...session.audioBlobs, ...pendingBlobs, newBlob],
        markers: markers,
        duration: currentTime,
        cinemaMetadata: currentModeId === 'cinema' ? cinemaMetadata : undefined,
        setupData: setupData,
        checklist: checklist
      };
    }
    
    setCurrentSession(session);
    setPendingBlobs([]);
    await saveSession(session);
    setView('results');
  };

  const handleReset = () => {
    resetRecording();
    resetMarkers();
    setCurrentSession(null);
    setView('recorder');
  };

  const handleResumeRecording = () => {
    setView('recorder');
    // We don't call startRecording immediately here because the user might want to edit layout or prepare.
    // They can click the big Mic button to resume.
  };

  const handleAutoClaquete = async () => {
    try {
      const chunk = getAudioChunk();
      if (chunk.size === 0) {
        alert('Nenhum áudio gravado ainda.');
        return;
      }
      
      const { analyzeClapperboardAudio } = await import('./services/aiService');
      const result = await analyzeClapperboardAudio(chunk);
      
      if (result) {
        if (result.scene || result.shot || result.take) {
          setCinemaMetadata(prev => ({
            ...prev,
            scene: result.scene || prev.scene,
            shot: result.shot || prev.shot,
            take: result.take || prev.take
          }));
        }
        
        if (result.clackTime !== undefined && result.clackTime !== null) {
          addMarker(currentTime, { id: 'auto-clack', icon: '🎬', label: 'Clack (Auto)', type: 'cinema_action' }, `Sincronismo detectado em ${result.clackTime}s`, result.clackTime);
        }
      } else {
        alert('Não foi possível identificar a claquete no áudio.');
      }
    } catch (error) {
      console.error('Erro no Auto-Claquete:', error);
      alert('Erro ao analisar o áudio.');
    }
  };

  return (
    <div className="min-h-screen bg-[#0f111a] text-white font-sans selection:bg-emerald-500/30">
      {/* Header */}
      <header className={`fixed top-0 left-0 right-0 z-50 bg-[#0f111a]/90 backdrop-blur-md border-b border-white/5 transition-transform duration-300 ${showHeader ? 'translate-y-0' : '-translate-y-full'}`}>
        <div className="max-w-5xl mx-auto px-4 py-2.5 flex items-center justify-between gap-3">
          {/* Logo and sync badge */}
          <div className="flex items-center gap-2 cursor-pointer shrink-0" onClick={() => setView('recorder')}>
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-emerald-400 to-cyan-500 flex items-center justify-center shadow-lg shadow-emerald-500/20">
              <span className="text-sm font-bold text-black">C</span>
            </div>
            <div>
              <h1 className="text-sm md:text-base font-semibold tracking-tight">CapIAudio</h1>
            </div>
            {syncRoomId && (
              <div className={`flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[9px] font-medium ${isConnected ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'bg-red-500/20 text-red-400 border border-red-500/30'}`}>
                <Wifi size={10} className={isConnected ? 'animate-pulse' : ''} />
                <span className="hidden sm:inline">{syncRoomId}</span>
              </div>
            )}
          </div>
          
          <div className="flex items-center gap-1.5 sm:gap-3 shrink-0">
            {/* Google Authentication */}
            {!isAuthLoading && (
              user ? (
                <div className="flex items-center gap-1.5 bg-[#1e2130] pl-1.5 pr-2 py-1 rounded-lg border border-white/5 text-[11px] text-zinc-200 font-medium shrink-0">
                  {user.photoURL ? (
                    <img 
                      src={user.photoURL} 
                      alt={user.displayName || ''} 
                      className="w-4 h-4 rounded-full object-cover border border-white/10" 
                      referrerPolicy="no-referrer" 
                    />
                  ) : (
                    <div className="w-4 h-4 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold text-[9px]">
                      {user.displayName?.charAt(0) || user.email?.charAt(0) || '?'}
                    </div>
                  )}
                  <span className="font-semibold text-emerald-400 max-w-[60px] md:max-w-[100px] truncate">{user.displayName || user.email}</span>
                  <button
                    onClick={() => logOut()}
                    className="p-0.5 hover:bg-red-500/10 text-zinc-400 hover:text-red-400 rounded transition-colors cursor-pointer"
                    title={t('signOut')}
                    id="btn-google-signout"
                  >
                    <LogOut size={12} />
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => signInWithGoogle()}
                  className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] bg-emerald-500/10 hover:bg-emerald-500 text-emerald-400 hover:text-black border border-emerald-500/20 hover:border-transparent transition-all font-bold cursor-pointer"
                  id="btn-google-signin"
                >
                  <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12.24 10.285V13.4h6.887C18.2 15.614 15.645 18 12.24 18c-3.86 0-7-3.14-7-7s3.14-7 7-7c1.7 0 3.25.61 4.47 1.625l2.437-2.437C17.312 1.696 14.933 1 12.24 1c-5.523 0-10 4.477-10 10s4.477 10 10 10c5.783 0 9.87-4.062 9.87-10 0-.675-.06-1.313-.18-1.715H12.24z"/>
                  </svg>
                  <span className="hidden sm:inline">{t('signInWithGoogle')}</span>
                </button>
              )
            )}

            {/* Language Selection Toggle */}
            <button
              onClick={toggleLanguage}
              className="flex items-center gap-1 px-2 py-1 rounded-lg text-[11px] bg-[#1e2130] hover:bg-zinc-800 transition-all border border-white/5 font-bold text-zinc-200 cursor-pointer"
              title={t('language')}
              id="btn-lang-toggle"
            >
              🌐 <span className="hidden xs:inline">{language === 'pt' ? 'Português' : 'English'}</span><span className="xs:hidden">{language.toUpperCase()}</span>
            </button>
            
            <div className="flex items-center gap-0.5">
              {view !== 'history' && (
                <div className="relative group">
                  <button 
                    onClick={() => setView('history')}
                    className="p-1.5 text-zinc-400 hover:text-white hover:bg-white/5 rounded-lg transition-colors cursor-pointer"
                  >
                    <History size={16} />
                  </button>
                  <div className="absolute top-full mt-2 left-1/2 -translate-x-1/2 px-2 py-1 bg-zinc-800 text-[10px] text-white rounded opacity-0 group-hover:opacity-100 pointer-events-none whitespace-nowrap z-50">
                    {t('history')}
                  </div>
                </div>
              )}

              {view !== 'docs' && (
                <div className="relative group">
                  <button 
                    onClick={() => setView('docs')}
                    className="p-1.5 text-zinc-400 hover:text-white hover:bg-white/5 rounded-lg transition-colors cursor-pointer"
                  >
                    <Book size={16} />
                  </button>
                  <div className="absolute top-full mt-2 left-1/2 -translate-x-1/2 px-2 py-1 bg-zinc-800 text-[10px] text-white rounded opacity-0 group-hover:opacity-100 pointer-events-none whitespace-nowrap z-50">
                    Docs
                  </div>
                </div>
              )}

              <div className="relative group">
                <button onClick={() => setShowSettings(true)} className="p-1.5 text-zinc-400 hover:text-white hover:bg-white/5 rounded-lg transition-colors cursor-pointer">
                  <Settings2 size={16} />
                </button>
                <div className="absolute top-full mt-2 right-0 px-2 py-1 bg-zinc-800 text-[10px] text-white rounded opacity-0 group-hover:opacity-100 pointer-events-none whitespace-nowrap z-50">
                  Configurações
                </div>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Delete Mode Modal */}
      {modeToDelete && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-[100] p-4">
          <div className="bg-zinc-900 p-6 rounded-2xl border border-zinc-800 w-full max-w-sm shadow-2xl">
            <h3 className="text-xl font-medium text-white mb-2">Excluir Modo</h3>
            <p className="text-sm text-zinc-400 mb-6">Tem certeza que deseja excluir o modo "{modes[modeToDelete]?.name}"? Esta ação não pode ser desfeita.</p>
            
            <div className="flex justify-end gap-3 mt-8">
              <button 
                onClick={() => setModeToDelete(null)}
                className="px-4 py-2 text-sm font-medium text-zinc-300 hover:text-white transition-colors"
              >
                Cancelar
              </button>
              <button 
                onClick={confirmDeleteMode}
                className="px-4 py-2 text-sm font-medium bg-red-500 hover:bg-red-600 text-white rounded-lg transition-colors"
              >
                Excluir
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Settings Modal */}
      {showSettings && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-[100] p-4">
          <div className="bg-zinc-900 p-6 rounded-2xl border border-zinc-800 w-full max-w-md shadow-2xl">
            <h3 className="text-xl font-medium text-white mb-2">Configurações</h3>
            <p className="text-sm text-zinc-400 mb-6">Ajuste as preferências de IA e insira sua chave de API.</p>
            
            <div className="mb-4">
              <label className="block text-sm font-medium text-zinc-300 mb-2">Gemini API Key</label>
              <input
                type="password"
                value={apiKeyInput}
                onChange={(e) => setApiKeyInput(e.target.value)}
                placeholder="AIzaSy..."
                className="w-full bg-zinc-800 border border-zinc-700 rounded-xl p-3 text-white focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-zinc-300 mb-2">Modelo de Imagem</label>
              <select
                value={imageModel}
                onChange={(e) => setImageModel(e.target.value)}
                className="w-full bg-zinc-800 border border-zinc-700 rounded-xl p-3 text-white focus:outline-none focus:border-emerald-500"
              >
                <option value="gemini-3.1-flash-image-preview">Gemini 3.1 Flash Image (Alta Qualidade)</option>
                <option value="gemini-2.5-flash-image">Gemini 2.5 Flash Image (Rápido)</option>
              </select>
            </div>

            {imageModel === 'gemini-3.1-flash-image-preview' && (
              <div className="mb-6">
                <label className="block text-sm font-medium text-zinc-300 mb-2">Tamanho da Imagem</label>
                <select
                  value={imageSize}
                  onChange={(e) => setImageSize(e.target.value)}
                  className="w-full bg-zinc-800 border border-zinc-700 rounded-xl p-3 text-white focus:outline-none focus:border-emerald-500"
                >
                  <option value="512px">0.5K (512px) - Padrão</option>
                  <option value="1K">1K</option>
                  <option value="2K">2K</option>
                  <option value="4K">4K</option>
                </select>
              </div>
            )}

            <div className="mb-6">
              <label className="block text-sm font-medium text-zinc-300 mb-2">ID da Sala de Sincronização</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={syncRoomId}
                  onChange={(e) => setSyncRoomId(e.target.value)}
                  placeholder="Ex: set-principal"
                  className="w-full bg-zinc-800 border border-zinc-700 rounded-xl p-3 text-white focus:outline-none focus:border-emerald-500"
                />
              </div>
              <p className="text-xs text-zinc-500 mt-2">
                Use o mesmo ID em dispositivos diferentes para sincronizar marcadores e claquete em tempo real.
              </p>
            </div>
            
            <div className="flex justify-end gap-3 mt-8">
              <button onClick={() => setShowSettings(false)} className="px-4 py-2 text-zinc-400 hover:text-white transition-colors">Cancelar</button>
              <button onClick={saveSettings} className="px-4 py-2 bg-emerald-500 text-zinc-900 font-medium rounded-xl hover:bg-emerald-400 transition-colors">Salvar</button>
            </div>
          </div>
        </div>
      )}

      {/* Form Fields Customization Overlay Modal */}
      {isEditingFormFields && (
        <FormFieldsEditor
          initialFields={currentMode.formFields || defaultFields[currentModeId] || defaultFields['default']}
          onSave={handleSaveFormFields}
          onClose={() => setIsEditingFormFields(false)}
          modeName={currentMode.name}
        />
      )}

      {/* Modules Catalog Overlay Modal */}
      {isCatalogOpen && (
        <ModulesCatalog
          modes={modes}
          currentModeId={currentModeId}
          onSelectMode={(modeId) => {
            setCurrentModeId(modeId);
            setButtons(modes[modeId].defaultButtons);
            setIsEditingFormFields(false);
          }}
          onClose={() => setIsCatalogOpen(false)}
        />
      )}

      {/* Main Content */}
      <main className="max-w-5xl mx-auto px-4 md:px-6 pt-16 md:pt-20 pb-12 w-full">
        <AnimatePresence mode="wait">
          {view === 'recorder' && (
            <motion.div
              key="recorder-view"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 1.05 }}
              className="flex flex-col gap-5 md:gap-8 items-center justify-center min-h-[60vh] w-full"
            >
              {!isRecording && !audioBlob && (
                <div className="w-full max-w-xl p-3 bg-zinc-900/60 border border-zinc-800/80 rounded-xl flex flex-col xs:flex-row items-center justify-between gap-3 text-sm shadow-xl mt-2 animate-fade-in">
                  <div className="flex items-center gap-1.5 self-start xs:self-center">
                    <span className="text-[10px] text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full uppercase font-semibold tracking-wider">MODO</span>
                  </div>
                  <div className="flex items-center gap-1.5 w-full xs:w-auto justify-end">
                    {isEditingModeName ? (
                      <div className="flex items-center gap-1 w-full xs:w-auto">
                        <input
                          type="text"
                          value={editedModeName}
                          onChange={(e) => setEditedModeName(e.target.value)}
                          onKeyDown={(e) => e.key === 'Enter' && handleSaveModeName()}
                          className="bg-[#1e2130] border border-emerald-500 text-white text-xs rounded-lg px-2.5 py-1.5 outline-none w-32 focus:ring-1 focus:ring-emerald-500"
                          autoFocus
                          placeholder="Nome do modo..."
                        />
                        <button onClick={handleSaveModeName} className="p-1 px-2 bg-emerald-500 hover:bg-emerald-400 text-black rounded-lg transition-colors cursor-pointer text-xs flex items-center gap-1 font-bold">
                          <Save size={13} />
                          Salvar
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center gap-1.5 w-full xs:w-auto justify-end">
                        <button
                          type="button"
                          onClick={() => setIsCatalogOpen(true)}
                          className="flex items-center gap-1.5 px-3 py-2 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/15 text-xs rounded-xl transition-all cursor-pointer font-semibold shrink-0"
                          title="Abrir Catálogo Completo de Módulos"
                        >
                          <BookOpen size={13} />
                          <span>Catálogo</span>
                        </button>
                        <div className="relative w-full xs:w-44">
                          <select
                            value={currentModeId}
                            onChange={(e) => {
                              const newModeId = e.target.value;
                              setCurrentModeId(newModeId);
                              setButtons(modes[newModeId].defaultButtons);
                              setIsEditingFormFields(false);
                            }}
                            className="w-full bg-[#1e2130] border border-white/5 text-white text-xs rounded-xl pl-3 pr-8 py-2 outline-none focus:border-emerald-500 transition-all appearance-none cursor-pointer"
                            style={{ backgroundImage: `url("data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='white' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3e%3cpolyline points='6 9 12 15 18 9'%3e%3c/polyline%3e%3c/svg%3e")`, backgroundRepeat: 'no-repeat', backgroundPosition: 'right 0.6rem center', backgroundSize: '0.85em' }}
                          >
                            {(Object.values(modes) as ModeConfig[]).map((mode) => {
                              const mTrans = modeTranslations[mode.id];
                              const displayName = language === 'en' && mTrans ? mTrans.name : mode.name;
                              return (
                                <option key={mode.id} value={mode.id}>
                                  {mode.icon} {displayName}
                                </option>
                              );
                            })}
                          </select>
                        </div>
                        {currentMode.custom && (
                          <div className="flex items-center gap-0.5 shrink-0">
                            <button 
                              onClick={() => {
                                setEditedModeName(currentMode.name);
                                setIsEditingModeName(true);
                              }}
                              className="p-1.5 text-zinc-400 hover:text-white hover:bg-white/5 rounded-lg transition-colors cursor-pointer"
                              title="Renomear Modo"
                            >
                              <Edit3 size={14} />
                            </button>
                            <button 
                              onClick={handleDeleteMode}
                              className="p-1.5 text-red-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors cursor-pointer"
                              title="Excluir Modo"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        )}
                      </div>
                    )}
                    <button 
                      onClick={handleCreateMode}
                      className="p-1.5 text-zinc-400 hover:text-white hover:bg-white/5 rounded-lg transition-colors cursor-pointer border border-white/5 shrink-0"
                      title="Criar Novo Modo"
                    >
                      <Plus size={15} />
                    </button>
                  </div>
                </div>
              )}

              {currentModeId === 'cinema' && (
                <CinemaHeader 
                  metadata={cinemaMetadata} 
                  onChange={setCinemaMetadata} 
                  isRecording={isRecording} 
                />
              )}

              <div className="flex flex-col md:flex-row gap-12 items-start justify-center w-full">
                {/* Left Column: Recorder or Editor (Only takes space when NOT recording) */}
                {!isRecording && (
                  <div className="w-full md:w-1/3 flex flex-col items-center justify-center">
                    <Recorder
                      isRecording={isRecording}
                      isPaused={isPaused}
                      currentTime={currentTime}
                      onStart={handleStartRecording}
                      onStop={handleStopRequest}
                      onPause={pauseRecording}
                      modeName={currentMode.name}
                      modeId={currentModeId}
                      mediaStream={mediaStream}
                      setupData={setupData}
                      setSetupData={setSetupData}
                      formFields={currentMode.formFields}
                    />
                    <button
                      onClick={() => setIsEditingFormFields(true)}
                      className="mt-4 flex items-center gap-1.5 text-xs text-zinc-400 hover:text-emerald-400 hover:bg-emerald-500/10 font-bold border border-zinc-800/80 hover:border-emerald-500/15 rounded-xl px-4 py-2 cursor-pointer transition-all bg-zinc-900/40"
                    >
                      <Settings2 size={13} />
                      Personalizar Campos
                    </button>
                    <div className="w-full mt-6">
                      <ChecklistCard
                        checklist={checklist}
                        onToggle={handleToggleChecklistItem}
                        onAdd={handleAddChecklistItem}
                        onDelete={handleDeleteChecklistItem}
                        isRecording={isRecording}
                      />
                    </div>
                  </div>
                )}

                {/* Recorder fixed at bottom when recording */}
                {isRecording && (
                  <Recorder
                    isRecording={isRecording}
                    isPaused={isPaused}
                    currentTime={currentTime}
                    onStart={handleStartRecording}
                    onStop={handleStopRequest}
                    onPause={pauseRecording}
                    modeName={currentMode.name}
                    modeId={currentModeId}
                    mediaStream={mediaStream}
                    setupData={setupData}
                    setSetupData={setSetupData}
                    onAutoClaquete={currentModeId === 'cinema' ? handleAutoClaquete : undefined}
                    formFields={currentMode.formFields}
                  />
                )}

                {/* Right Column: Markers */}
                <div className={`w-full ${isRecording ? 'md:w-full max-w-3xl mx-auto pb-32' : 'md:w-2/3'}`}>
                <div className="mb-8 font-sans">
                  <div className="flex items-center gap-3 mb-2">
                    <h2 className="text-2xl font-bold tracking-tight">{t('markers')}</h2>
                    {!isRecording && !audioBlob && (
                      <button
                        onClick={() => isEditingLayout ? handleSaveLayout() : setIsEditingLayout(true)}
                        className={`p-2 rounded-xl transition-all hover:scale-105 duration-200 ${isEditingLayout ? 'bg-emerald-500 text-zinc-900 hover:bg-emerald-400 font-semibold' : 'text-zinc-400 hover:text-white hover:bg-zinc-805 bg-zinc-900/40 border border-zinc-800'}`}
                        title={isEditingLayout ? t('saveLayout') : t('editLayout')}
                        id="btn-edit-layout-trigger"
                      >
                        {isEditingLayout ? <Save size={18} /> : <Edit3 size={18} />}
                      </button>
                    )}
                  </div>
                  <p className="text-zinc-400 text-sm">
                    {isEditingLayout ? t('dragToReorder') : t('clickToMark')}
                  </p>
                </div>
                
                <div className={`transition-opacity duration-500 ${isRecording || isEditingLayout ? 'opacity-100' : 'opacity-50 pointer-events-none'}`}>
                  <MarkerGrid
                    buttons={customButtons}
                    onMark={(btn, data, explicitTime) => {
                      if (!isEditingLayout) {
                        const marker = addMarker(currentTime, btn, data, explicitTime);
                        if (syncRoomId) syncAddMarker(marker);
                      }
                    }}
                    onAddCustomButton={addCustomButton}
                    currentTime={currentTime}
                    setButtons={isEditingLayout ? setButtons : undefined}
                    isEditing={isEditingLayout}
                    language={language}
                  />
                </div>

                {isRecording && (
                  <div className="mt-8">
                    <ChecklistCard
                      checklist={checklist}
                      onToggle={handleToggleChecklistItem}
                      onAdd={handleAddChecklistItem}
                      onDelete={handleDeleteChecklistItem}
                      isRecording={isRecording}
                    />
                  </div>
                )}

                {/* Timeline Preview (Optional) */}
                {(markers.length > 0 || remoteMarkers.length > 0) && (
                  <div className="mt-12 p-6 bg-[#1e2130] rounded-3xl border border-white/5 shadow-lg">
                    <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
                      <div className="flex items-center gap-3">
                        <h3 className="text-sm font-semibold text-zinc-400 uppercase tracking-wider">Timeline</h3>
                        {isRecording && (
                          <div className="flex items-center gap-1 bg-black/40 p-1 rounded-xl border border-white/5">
                            <button
                              onClick={undoMarker}
                              disabled={markers.length === 0}
                              className="p-1 px-2 text-[10px] sm:text-xs text-zinc-400 hover:text-white hover:bg-white/5 disabled:opacity-20 disabled:hover:text-zinc-400 disabled:hover:bg-transparent rounded-lg transition-colors flex items-center gap-1 font-medium cursor-pointer"
                              title="Desfazer último marcador (Undo)"
                            >
                              <Undo2 size={12} />
                              <span>Undo</span>
                            </button>
                            <span className="w-px h-3 bg-white/10" />
                            <button
                              onClick={redoMarker}
                              disabled={redoStack.length === 0}
                              className="p-1 px-2 text-[10px] sm:text-xs text-zinc-400 hover:text-white hover:bg-white/5 disabled:opacity-20 disabled:hover:text-zinc-400 disabled:hover:bg-transparent rounded-lg transition-colors flex items-center gap-1 font-medium cursor-pointer"
                              title="Refazer marcador desfeito (Redo)"
                            >
                              <Redo2 size={12} />
                              <span>Redo</span>
                            </button>
                          </div>
                        )}
                      </div>
                      {remoteState.isRecording && !isRecording && (
                        <span className="flex items-center gap-2 text-xs font-medium text-red-400 bg-red-400/10 px-2 py-1 rounded-md">
                          <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                          Gravando Remotamente
                        </span>
                      )}
                    </div>
                    <div className="space-y-3">
                      {Array.from(new Map([...remoteMarkers, ...markers].map(m => [m.id, m])).values())
                        .sort((a, b) => a.time - b.time)
                        .slice(-5).reverse().map((m) => (
                        <motion.div 
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          key={m.id} 
                          className="flex items-center justify-between gap-4 text-sm bg-black/20 p-3 rounded-xl border border-white/[0.02]"
                        >
                          <div className="flex items-center gap-4 min-w-0">
                            <span className="font-mono text-emerald-400 bg-emerald-400/10 px-2 py-0.5 rounded-md text-xs shrink-0">
                              {Math.floor(m.time / 60).toString().padStart(2, '0')}:{Math.floor(m.time % 60).toString().padStart(2, '0')}
                            </span>
                            <span className="text-xl shrink-0 select-none">{m.icon}</span>
                            <span className="text-zinc-300 font-medium truncate">{m.label}</span>
                            {m.data && <span className="text-zinc-500 truncate text-xs">({m.data})</span>}
                          </div>
                          <button
                            onClick={() => deleteMarker(m.id)}
                            className="p-1.5 text-zinc-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors cursor-pointer shrink-0"
                            title="Excluir este marcador"
                          >
                            <Trash2 size={14} />
                          </button>
                        </motion.div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
              </div>
            </motion.div>
          )}

          {view === 'results' && currentSession && (
            <motion.div
              key="results-view"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <ResultScreen
                session={currentSession}
                onReset={handleReset}
                onResume={handleResumeRecording}
              />
            </motion.div>
          )}

          {view === 'history' && (
            <motion.div
              key="history-view"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <HistoryScreen 
                onBack={() => setView('recorder')} 
                onResumeSession={(session) => {
                  setCurrentSession(session);
                  setCurrentModeId(session.modeId);
                  setCurrentTime(session.duration);
                  setMarkers(session.markers);
                  if (session.setupData) setSetupData(session.setupData);
                  setView('recorder');
                }}
                userId={user?.uid}
              />
            </motion.div>
          )}

          {view === 'docs' && (
            <motion.div
              key="docs-view"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <Documentation 
                onBack={() => setView('recorder')} 
                onSelectMode={(modeId) => {
                  setCurrentModeId(modeId);
                  setButtons(modes[modeId].defaultButtons);
                  setIsEditingFormFields(false);
                }}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Checklist Warning Modal */}
      {isStopWarningOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="w-full max-w-sm bg-[#1e2130] rounded-3xl border border-white/5 p-6 shadow-2xl relative animate-in fade-in zoom-in duration-200"
          >
            <div className="text-center mb-4">
              <span className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-amber-500/10 text-amber-500 mb-3">
                <AlertCircle size={22} className="stroke-[2.5]" />
              </span>
              <h3 className="text-lg font-bold text-white tracking-tight">Checklist Incompleto</h3>
              <p className="text-zinc-400 text-xs mt-1.5 leading-relaxed">
                Você solicitou o encerramento da gravação, mas ainda faltam {checklist.filter(i => !i.completed).length} item(ns) pendente(s):
              </p>
            </div>

            <div className="bg-black/20 rounded-2xl p-4 max-h-40 overflow-y-auto space-y-2 mb-6 border border-white/5">
              {checklist.filter(i => !i.completed).map((item) => (
                <div key={item.id} className="flex items-start gap-2 text-zinc-300 text-xs">
                  <span className="text-amber-500 shrink-0 font-bold leading-none select-none">•</span>
                  <span className="font-semibold leading-relaxed text-zinc-300">{item.text}</span>
                </div>
              ))}
            </div>

            <div className="flex flex-col gap-2.5">
              <button
                type="button"
                onClick={() => setIsStopWarningOpen(false)}
                className="w-full py-3 bg-emerald-500 hover:bg-emerald-400 text-black font-bold text-xs rounded-xl transition-all cursor-pointer text-center"
              >
                Voltar e Finalizar Checklist
              </button>
              <button
                type="button"
                onClick={() => {
                  setIsStopWarningOpen(false);
                  handleStop();
                }}
                className="w-full py-3 bg-red-500/10 hover:bg-red-500/20 text-red-400 text-xs font-bold rounded-xl border border-red-500/10 hover:border-red-500/20 transition-all cursor-pointer text-center"
              >
                Ignorar e Encerrar Gravação
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}
