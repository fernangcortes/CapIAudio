import React, { useState, useEffect, useCallback, useRef } from 'react';
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
import { InstallAppPrompt } from './components/InstallAppPrompt';
import { defaultFields } from './components/ModeSetupForm';
import { AppMode, RecordingSession, ModeConfig, CinemaMetadata, ChecklistItem } from './types';
import { ChecklistCard } from './components/ChecklistCard';
import { DEFAULT_CHECKLISTS } from './defaultChecklists';
import { motion, AnimatePresence } from 'motion/react';
import { Settings2, History, Edit3, Save, Plus, Wifi, Book, BookOpen, Trash2, LogOut, Undo2, Redo2, AlertCircle, RefreshCw, Radio, Zap, Shield, Key, Youtube, UploadCloud, Sparkles, FileText, Link, ChevronDown, ChevronLeft, ChevronRight, Menu, Globe } from 'lucide-react';
import { 
  getAISettings, 
  PROVIDER_OPTIONS, 
  TRANSCRIPTION_MODEL_OPTIONS, 
  ANALYSIS_MODEL_OPTIONS, 
  testModelLatency,
  analyzeYouTubeVideo,
  AISettings
} from './services/aiService';
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
  const [isSelectDropdownOpen, setIsSelectDropdownOpen] = useState(false);
  const [isRightSidebarCollapsed, setIsRightSidebarCollapsed] = useState<boolean>(false);
  const [isMarkersCollapsed, setIsMarkersCollapsed] = useState<boolean>(false);
  const [isSourcesCollapsed, setIsSourcesCollapsed] = useState<boolean>(true);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState<boolean>(() => {
    return localStorage.getItem('SIDEBAR_COLLAPSED') === 'true';
  });
  const sidebarModeDropdownRef = useRef<HTMLDivElement>(null);
  const modeDropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      const clickedOutsideMain = modeDropdownRef.current && !modeDropdownRef.current.contains(event.target as Node);
      const clickedOutsideSidebar = sidebarModeDropdownRef.current && !sidebarModeDropdownRef.current.contains(event.target as Node);
      
      if (
        (clickedOutsideMain || !modeDropdownRef.current) && 
        (clickedOutsideSidebar || !sidebarModeDropdownRef.current)
      ) {
        setIsSelectDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);
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
  const [apiKeyInput, setApiKeyInput] = useState(() => localStorage.getItem('GEMINI_API_KEY') || '');
  const [imageModel, setImageModel] = useState(localStorage.getItem('IMAGE_MODEL') || 'gemini-3.1-flash-image-preview');
  const [imageSize, setImageSize] = useState(localStorage.getItem('IMAGE_SIZE') || '512px');
  
  // AI Models & Providers Settings
  const [aiProvider, setAiProvider] = useState<string>(() => localStorage.getItem('AI_PROVIDER') || 'gemini');
  const [transModel, setTransModel] = useState<string>(() => localStorage.getItem('TRANSCRIPTION_MODEL') || 'gemini-3.5-flash');
  const [analysModel, setAnalysModel] = useState<string>(() => localStorage.getItem('ANALYSIS_MODEL') || 'gemini-3.5-flash');
  
  const [openaiKey, setOpenaiKey] = useState<string>(() => localStorage.getItem('OPENAI_API_KEY') || '');
  const [openaiUrl] = useState<string>(() => localStorage.getItem('OPENAI_URL') || 'https://api.openai.com/v1');
  const [deepseekKey, setDeepseekKey] = useState<string>(() => localStorage.getItem('DEEPSEEK_API_KEY') || '');
  const [deepseekUrl, setDeepseekUrl] = useState<string>(() => localStorage.getItem('DEEPSEEK_URL') || 'https://api.deepseek.com');
  const [openrouterKey, setOpenrouterKey] = useState<string>(() => localStorage.getItem('OPENROUTER_API_KEY') || '');
  const [customKey, setCustomKey] = useState<string>(() => localStorage.getItem('CUSTOM_API_KEY') || '');
  const [customUrl, setCustomUrl] = useState<string>(() => localStorage.getItem('CUSTOM_URL') || 'http://localhost:3000/v1');

  // Interactive settings state controls
  const [settingsTab, setSettingsTab] = useState<'general' | 'ai'>('general');
  const [latencyResults, setLatencyResults] = useState<Record<string, { ms: number; rating: string; message: string; testing?: boolean }>>({});
  
  const [currentSession, setCurrentSession] = useState<RecordingSession | null>(null);
  const [setupData, setSetupData] = useState<Record<string, any>>({});
  const [pendingBlobs, setPendingBlobs] = useState<Blob[]>([]);
  const [checklist, setChecklist] = useState<ChecklistItem[]>([]);
  const [isStopWarningOpen, setIsStopWarningOpen] = useState(false);
  const [importTab, setImportTab] = useState<'text' | 'youtube'>('text');
  const [importText, setImportText] = useState('');
  const [youtubeInputUrl, setYoutubeInputUrl] = useState('');
  const [isImporting, setIsImporting] = useState(false);
  const [importFeedback, setImportFeedback] = useState('');

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
    chunkDurationMs: 300000 // 5 minutes
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
    
    // Auto-align transcription and analysis models if they are not stored
    if (!localStorage.getItem('AI_PROVIDER')) {
      localStorage.setItem('AI_PROVIDER', 'gemini');
      localStorage.setItem('TRANSCRIPTION_MODEL', 'gemini-3.5-flash');
      localStorage.setItem('ANALYSIS_MODEL', 'gemini-3.5-flash');
    }
  }, []);

  const saveSettings = () => {
    localStorage.setItem('GEMINI_API_KEY', apiKeyInput);
    localStorage.setItem('OPENAI_API_KEY', openaiKey);
    localStorage.setItem('OPENAI_URL', openaiUrl);
    localStorage.setItem('AI_PROVIDER', aiProvider);
    localStorage.setItem('TRANSCRIPTION_MODEL', transModel);
    localStorage.setItem('ANALYSIS_MODEL', analysModel);
    localStorage.setItem('DEEPSEEK_API_KEY', deepseekKey);
    localStorage.setItem('DEEPSEEK_URL', deepseekUrl);
    localStorage.setItem('OPENROUTER_API_KEY', openrouterKey);
    localStorage.setItem('CUSTOM_API_KEY', customKey);
    localStorage.setItem('CUSTOM_URL', customUrl);
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

  // Two-way synchronization between cinemaMetadata and setupData for matching fields in Cinema mode
  useEffect(() => {
    if (currentModeId === 'cinema') {
      setSetupData(prev => {
        const next = { ...prev };
        let changed = false;
        if (next.project !== cinemaMetadata.movieName) {
          next.project = cinemaMetadata.movieName || '';
          changed = true;
        }
        if (next.scene !== cinemaMetadata.scene) {
          next.scene = cinemaMetadata.scene || '';
          changed = true;
        }
        if (next.shot !== cinemaMetadata.shot) {
          next.shot = cinemaMetadata.shot || '';
          changed = true;
        }
        return changed ? next : prev;
      });
    }
  }, [cinemaMetadata.movieName, cinemaMetadata.scene, cinemaMetadata.shot, currentModeId]);

  useEffect(() => {
    if (currentModeId === 'cinema') {
      setCinemaMetadata(prev => {
        let changed = false;
        const next = { ...prev };
        if (setupData.project !== undefined && setupData.project !== prev.movieName) {
          next.movieName = setupData.project;
          changed = true;
        }
        if (setupData.scene !== undefined && setupData.scene !== prev.scene) {
          next.scene = setupData.scene;
          changed = true;
        }
        if (setupData.shot !== undefined && setupData.shot !== prev.shot) {
          next.shot = setupData.shot;
          changed = true;
        }
        return changed ? next : prev;
      });
    }
  }, [setupData.project, setupData.scene, setupData.shot, currentModeId]);

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
    
    let sessionTitle = setupData.title || setupData.project || setupData.story || setupData.subject || setupData.interviewee || setupData.doctorName || `Gravação - ${new Date().toLocaleString()}`;
    if (currentModeId === 'cinema') {
      const pName = cinemaMetadata.movieName || 'Projeto';
      const sName = cinemaMetadata.scene ? `Cena ${cinemaMetadata.scene}` : '';
      const shName = cinemaMetadata.shot ? `Plano ${cinemaMetadata.shot}` : '';
      const tkName = cinemaMetadata.take ? `Take ${cinemaMetadata.take}` : '';
      sessionTitle = [pName, sName, shName, tkName].filter(Boolean).join(' - ');
    }
    
    let session = currentSession;
    const sessionId = session?.id || Math.random().toString(36).substr(2, 9);
    const audioName = `cap-audio-${sessionId}.webm`;
    const finalBlobs = session ? [...session.audioBlobs, ...pendingBlobs, newBlob] : [...pendingBlobs, newBlob];
    const totalSize = finalBlobs.reduce((acc, b) => acc + b.size, 0);

    if (!session) {
      session = {
        id: sessionId,
        title: sessionTitle,
        date: new Date().toISOString(),
        modeId: currentModeId,
        audioBlobs: finalBlobs,
        markers: markers,
        duration: currentTime,
        cinemaMetadata: currentModeId === 'cinema' ? cinemaMetadata : undefined,
        setupData: setupData,
        checklist: checklist,
        localFileName: audioName,
        localFileSize: totalSize
      };
    } else {
      session = {
        ...session,
        title: sessionTitle,
        audioBlobs: finalBlobs,
        markers: markers,
        duration: currentTime,
        cinemaMetadata: currentModeId === 'cinema' ? cinemaMetadata : undefined,
        setupData: setupData,
        checklist: checklist,
        localFileName: audioName,
        localFileSize: totalSize
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

  const handleTextTranscriptImport = async () => {
    if (!importText.trim()) {
      setImportFeedback('Por favor, cole sua transcrição ou faça o upload de um arquivo para continuar.');
      return;
    }

    setIsImporting(true);
    setImportFeedback('Criando sessão com base no texto...');

    try {
      let sessionTitle = setupData.title || setupData.project || setupData.story || setupData.subject || setupData.interviewee || setupData.doctorName || `Texto Importado - ${new Date().toLocaleString()}`;
      if (currentModeId === 'cinema') {
        const pName = cinemaMetadata.movieName || 'Projeto';
        const sName = cinemaMetadata.scene ? `Cena ${cinemaMetadata.scene}` : '';
        const shName = cinemaMetadata.shot ? `Plano ${cinemaMetadata.shot}` : '';
        const tkName = cinemaMetadata.take ? `Take ${cinemaMetadata.take}` : '';
        sessionTitle = [pName, sName, shName, tkName].filter(Boolean).join(' - ');
      }

      const sessionId = Math.random().toString(36).substr(2, 9);
      const session: RecordingSession = {
        id: sessionId,
        title: sessionTitle,
        date: new Date().toISOString(),
        modeId: currentModeId,
        audioBlobs: [],
        markers: [],
        duration: 0,
        transcription: importText,
        cinemaMetadata: currentModeId === 'cinema' ? cinemaMetadata : undefined,
        setupData: setupData,
        checklist: [],
        isManualUpload: true
      };

      setCurrentSession(session);
      await saveSession(session);
      setImportText('');
      setImportFeedback('');
      setView('results');
    } catch (e: any) {
      setImportFeedback(`Erro ao importar texto: ${e.message || e}`);
    } finally {
      setIsImporting(false);
    }
  };

  const handleYoutubeImport = async () => {
    if (!youtubeInputUrl.trim() || (!youtubeInputUrl.includes('youtube.com') && !youtubeInputUrl.includes('youtu.be'))) {
      setImportFeedback('Por favor, informe um URL válido do YouTube.');
      return;
    }

    setIsImporting(true);
    setImportFeedback('IA analisando o vídeo do Youtube e estruturando transcrição...');

    try {
      const result = await analyzeYouTubeVideo(youtubeInputUrl, currentModeId);
      
      const sessionId = Math.random().toString(36).substr(2, 9);
      const session: RecordingSession = {
        id: sessionId,
        title: result.title,
        date: new Date().toISOString(),
        modeId: currentModeId,
        audioBlobs: [],
        markers: [],
        duration: 0,
        transcription: result.transcription,
        youtubeUrl: youtubeInputUrl,
        cinemaMetadata: currentModeId === 'cinema' ? cinemaMetadata : undefined,
        setupData: setupData,
        checklist: []
      };

      setCurrentSession(session);
      await saveSession(session);
      setYoutubeInputUrl('');
      setImportFeedback('');
      setView('results');
    } catch (e: any) {
      setImportFeedback(`Erro ao processar o YouTube: ${e.message || e}`);
    } finally {
      setIsImporting(false);
    }
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
    <div className="min-h-screen bg-[#08080c] text-white font-sans selection:bg-emerald-500/30 flex flex-col md:flex-row overflow-x-hidden">
      
      {/* --- COLLAPSIBLE SIDEBAR WITH FULL CONTROLS FOR DESKTOP (MD+) --- */}
      <aside 
        className={`hidden md:flex flex-col border-r border-white/5 bg-[#090a0f] h-screen sticky top-0 shrink-0 z-40 transition-all duration-300 relative ${
          isSidebarCollapsed ? 'w-16' : 'w-64'
        }`}
      >
        {/* Toggle Collapse Button */}
        <button
          onClick={() => {
            const nextVal = !isSidebarCollapsed;
            setIsSidebarCollapsed(nextVal);
            localStorage.setItem('SIDEBAR_COLLAPSED', String(nextVal));
          }}
          className="absolute -right-3 top-5 bg-zinc-900 border border-white/10 hover:border-emerald-500/55 p-1 rounded-full text-zinc-400 hover:text-emerald-400 transition-all cursor-pointer z-55 shadow-md shadow-black"
          title={isSidebarCollapsed ? "Expandir Menu" : "Recolher Menu"}
        >
          {isSidebarCollapsed ? <ChevronRight size={12} /> : <ChevronLeft size={12} />}
        </button>

        {/* Sidebar Header: Logo & Sync Badge */}
        <div className={`p-4 flex items-center gap-2 border-b border-white/5 ${isSidebarCollapsed ? 'justify-center' : ''}`}>
          <div 
            className="flex items-center gap-2 cursor-pointer shrink-0" 
            onClick={() => setView('recorder')}
          >
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-emerald-400 to-cyan-500 flex items-center justify-center shadow-lg shadow-emerald-500/20 shrink-0">
              <span className="text-sm font-bold text-black">C</span>
            </div>
            {!isSidebarCollapsed && (
              <div className="flex flex-col">
                <h1 className="text-sm font-semibold tracking-tight leading-none">CapIAudio</h1>
                <span className="text-[9px] text-zinc-500">16:9 Cinema Pro</span>
              </div>
            )}
          </div>
        </div>

        {/* Sidebar Content Area */}
        <div className="flex-1 overflow-y-auto p-3 flex flex-col gap-5 scrollbar-thin scrollbar-thumb-zinc-800 scrollbar-track-transparent">
          
          {/* User Sign In and status */}
          {!isSidebarCollapsed ? (
            <div className="flex flex-col gap-2 p-2 rounded-xl bg-zinc-950/40 border border-white/[0.03]">
              {!isAuthLoading && (
                user ? (
                  <div className="flex flex-col gap-2 p-1.5 text-xs">
                    <div className="flex items-center gap-2">
                      {user.photoURL ? (
                        <img 
                          src={user.photoURL} 
                          alt={user.displayName || ''} 
                          className="w-5 h-5 rounded-full object-cover border border-white/10 shrink-0" 
                          referrerPolicy="no-referrer" 
                        />
                      ) : (
                        <div className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold text-[10px] shrink-0">
                          {user.displayName?.charAt(0) || user.email?.charAt(0) || '?'}
                        </div>
                      )}
                      <span className="font-semibold text-emerald-400 truncate flex-1">{user.displayName || user.email}</span>
                    </div>
                    <button
                      onClick={() => logOut()}
                      className="w-full mt-1 py-1 px-2 hover:bg-red-500/10 text-zinc-400 hover:text-red-400 border border-transparent hover:border-red-500/10 rounded-lg text-[10px] font-bold transition-all cursor-pointer flex items-center justify-center gap-1"
                      title={t('signOut')}
                    >
                      <LogOut size={10} />
                      <span>{t('signOut')}</span>
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => signInWithGoogle()}
                    className="flex items-center justify-center gap-1.5 w-full py-2 px-2.5 rounded-lg text-[10px] bg-emerald-500/10 hover:bg-emerald-500 text-emerald-400 hover:text-black border border-emerald-500/20 hover:border-transparent transition-all font-bold cursor-pointer"
                  >
                    <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M12.24 10.285V13.4h6.887C18.2 15.614 15.645 18 12.24 18c-3.86 0-7-3.14-7-7s3.14-7 7-7c1.7 0 3.25.61 4.47 1.625l2.437-2.437C17.312 1.696 14.933 1 12.24 1c-5.523 0-10 4.477-10 10s4.477 10 10 10c5.783 0 9.87-4.062 9.87-10 0-.675-.06-1.313-.18-1.715H12.24z"/>
                    </svg>
                    <span>{t('signInWithGoogle')}</span>
                  </button>
                )
              )}
            </div>
          ) : (
            <div className="flex justify-center">
              {!isAuthLoading && user && (
                <button 
                  onClick={() => logOut()}
                  className="p-1.5 hover:bg-red-500/10 text-zinc-400 hover:text-red-400 rounded-lg transition-colors cursor-pointer"
                  title={`${t('signOut')} (${user.displayName || user.email})`}
                >
                  <LogOut size={14} />
                </button>
              )}
              {!isAuthLoading && !user && (
                <button 
                  onClick={() => signInWithGoogle()}
                  className="p-1.5 hover:bg-emerald-500/10 text-emerald-400 rounded-lg transition-colors cursor-pointer border border-emerald-500/10"
                  title={t('signInWithGoogle')}
                >
                  <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12.24 10.285V13.4h6.887C18.2 15.614 15.645 18 12.24 18c-3.86 0-7-3.14-7-7s3.14-7 7-7c1.7 0 3.25.61 4.47 1.625l2.437-2.437C17.312 1.696 14.933 1 12.24 1c-5.523 0-10 4.477-10 10s4.477 10 10 10c5.783 0 9.87-4.062 9.87-10 0-.675-.06-1.313-.18-1.715H12.24z"/>
                  </svg>
                </button>
              )}
            </div>
          )}

          {/* Module Selector / Customizer Dropdown Box inside Sidebar */}
          {!isSidebarCollapsed && (
            <div className="flex flex-col gap-1.5 p-2 bg-zinc-950/20 border border-white/[0.02] rounded-xl text-xs relative">
              <span className="text-[9px] text-emerald-400/80 uppercase font-semibold tracking-wider ml-1">Modo Ativo</span>
              <div className="flex items-center gap-1.5 w-full">
                <div ref={sidebarModeDropdownRef} className="relative w-full z-40">
                  <button
                    type="button"
                    onClick={() => setIsSelectDropdownOpen(!isSelectDropdownOpen)}
                    className="w-full pl-3 pr-8 py-2 text-xs text-zinc-100 text-left flex items-center gap-1.5 cursor-pointer relative bg-zinc-900 hover:bg-zinc-850/80 border border-zinc-800/80 hover:border-zinc-700 rounded-xl transition-all font-semibold"
                  >
                    <span className="text-xs shrink-0 leading-none">{currentMode.icon}</span>
                    <span className="truncate pr-1.5">{language === 'en' && modeTranslations[currentModeId] ? modeTranslations[currentModeId].name : currentMode.name}</span>
                    <ChevronDown size={12} className="text-zinc-500 absolute right-2 top-2.5" />
                  </button>

                  {/* Options list inside sidebar dropdown */}
                  {isSelectDropdownOpen && (
                    <div className="absolute top-[calc(100%+4px)] left-0 w-56 bg-[#0c0d16] border border-white/[0.08] shadow-[0_15px_40px_rgba(0,0,0,0.95)] rounded-xl p-1.5 z-55 flex flex-col gap-0.5 max-h-60 overflow-y-auto scrollbar-thin scrollbar-thumb-zinc-700 scrollbar-track-transparent">
                      {(Object.values(modes) as ModeConfig[]).map((mode) => {
                        const mTrans = modeTranslations[mode.id];
                        const displayName = language === 'en' && mTrans ? mTrans.name : mode.name;
                        const isSelected = mode.id === currentModeId;
                        return (
                          <button
                            key={mode.id}
                            type="button"
                            onClick={() => {
                              setCurrentModeId(mode.id);
                              setButtons(modes[mode.id].defaultButtons);
                              setIsEditingFormFields(false);
                              setIsSelectDropdownOpen(false);
                            }}
                            className={`flex items-center gap-2 w-full text-left px-2.5 py-1.5 rounded-lg text-[11px] font-semibold cursor-pointer transition-all ${
                              isSelected 
                                ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/15' 
                                : 'text-zinc-300 hover:text-white hover:bg-white/[0.06] border border-transparent'
                            }`}
                          >
                            <span className="text-xs shrink-0">{mode.icon}</span>
                            <span className="truncate">{displayName}</span>
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>

              {/* Sidebar Mode CRUD Buttons */}
              <div className="flex items-center gap-1 justify-between mt-1 pt-1.5 border-t border-white/[0.03]">
                <button 
                  onClick={handleCreateMode}
                  className="flex-1 py-1 px-1 text-[10px] text-zinc-400 hover:text-white hover:bg-white/5 rounded-lg border border-white/5 transition-colors cursor-pointer text-center flex items-center justify-center gap-1 font-medium"
                >
                  <Plus size={11} />
                  <span>Novo Modo</span>
                </button>
                {currentMode.custom && (
                  <div className="flex gap-0.5">
                    <button 
                      onClick={() => {
                        setEditedModeName(currentMode.name);
                        setIsEditingModeName(true);
                      }}
                      className="p-1 px-1.5 text-[10px] text-zinc-400 hover:text-white hover:bg-white/5 rounded-md transition-colors cursor-pointer border border-white/5"
                    >
                      Editar
                    </button>
                    <button 
                      onClick={handleDeleteMode}
                      className="p-1 px-1.5 text-[10px] text-red-500 hover:text-red-400 hover:bg-red-500/10 rounded-md transition-colors cursor-pointer border border-red-500/10"
                    >
                      Limpar
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Navigation and Settings menu inside sidebar */}
          <nav className="flex flex-col gap-1.5 mt-2">
            
            {/* Sync room state info for custom lateral widgets if visible */}
            {!isSidebarCollapsed && syncRoomId && (
              <div className={`flex items-center justify-between p-2 rounded-xl text-[10px] font-semibold mb-2 ${isConnected ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/15' : 'bg-red-500/10 text-red-400 border border-red-500/15'}`}>
                <div className="flex items-center gap-1.5">
                  <Wifi size={11} className={isConnected ? 'animate-pulse text-emerald-400' : 'text-red-400'} />
                  <span className="truncate">Sincronismo: <span className="font-mono text-[9px]">{syncRoomId}</span></span>
                </div>
                <span className="text-[8px] bg-black/40 px-1 py-0.5 rounded uppercase">{isConnected ? 'ON' : 'OFF'}</span>
              </div>
            )}

            {/* Sidebar Active Links */}
            <button
              onClick={() => setView('recorder')}
              className={`flex items-center gap-3 w-full px-3 py-2 rounded-xl text-xs font-semibold cursor-pointer transition-all ${
                view === 'recorder' 
                  ? 'bg-gradient-to-r from-emerald-500/15 to-emerald-500/5 text-emerald-400 border border-emerald-500/15' 
                  : 'text-zinc-300 hover:bg-white/5 border border-transparent'
              } ${isSidebarCollapsed ? 'justify-center' : ''}`}
              title="Gravador & Marcador"
            >
              <Radio size={14} className={view === 'recorder' ? 'text-emerald-400' : 'text-zinc-400'} />
              {!isSidebarCollapsed && <span>{language === 'en' ? 'Recorder' : 'Gravador'}</span>}
            </button>

            <button
              onClick={() => setView('history')}
              className={`flex items-center gap-3 w-full px-3 py-2 rounded-xl text-xs font-semibold cursor-pointer transition-all ${
                view === 'history' 
                  ? 'bg-gradient-to-r from-emerald-500/15 to-emerald-500/5 text-emerald-400 border border-emerald-500/15' 
                  : 'text-zinc-300 hover:bg-white/5 border border-transparent'
              } ${isSidebarCollapsed ? 'justify-center' : ''}`}
              title={t('history')}
            >
              <History size={14} className={view === 'history' ? 'text-emerald-400' : 'text-zinc-400'} />
              {!isSidebarCollapsed && <span>{t('history')}</span>}
            </button>

            <button
              onClick={() => setView('docs')}
              className={`flex items-center gap-3 w-full px-3 py-2 rounded-xl text-xs font-semibold cursor-pointer transition-all ${
                view === 'docs' 
                  ? 'bg-gradient-to-r from-emerald-500/15 to-emerald-500/5 text-emerald-400 border border-emerald-500/15' 
                  : 'text-zinc-300 hover:bg-white/5 border border-transparent'
              } ${isSidebarCollapsed ? 'justify-center' : ''}`}
              title="Documentation Docs"
            >
              <Book size={14} className={view === 'docs' ? 'text-emerald-400' : 'text-zinc-400'} />
              {!isSidebarCollapsed && <span>Documentação</span>}
            </button>

            <button
              onClick={() => setShowSettings(true)}
              className={`flex items-center gap-3 w-full px-3 py-2 rounded-xl text-xs font-semibold cursor-pointer transition-all text-zinc-300 hover:bg-white/5 border border-transparent ${isSidebarCollapsed ? 'justify-center' : ''}`}
              title="Configurações AI & API Key"
            >
              <Settings2 size={14} className="text-zinc-400" />
              {!isSidebarCollapsed && <span>Configurações</span>}
            </button>
          </nav>

          {/* Catalog open CTA in sidebar */}
          {!isSidebarCollapsed && (
            <button
              onClick={() => setIsCatalogOpen(true)}
              className="mt-2 w-full flex items-center justify-center gap-1.5 px-3 py-2 bg-emerald-500/5 hover:bg-emerald-500/10 text-emerald-400 border border-emerald-500/15 text-xs rounded-xl transition-all cursor-pointer font-bold tracking-tight"
            >
              <BookOpen size={12} />
              <span>Ver Catálogo</span>
            </button>
          )}

        </div>

        {/* Footer Language Selection button */}
        <div className={`p-4 border-t border-white/5 ${isSidebarCollapsed ? 'flex justify-center' : ''}`}>
          <button
            onClick={toggleLanguage}
            className="flex items-center gap-1.5 w-full py-1.5 px-2 rounded-lg text-[10px] bg-[#1e2130]/60 hover:bg-[#1e2130] transition-all border border-white/5 font-bold text-zinc-300 cursor-pointer justify-center"
            title={t('language')}
          >
            <span>🌐</span>
            {!isSidebarCollapsed && (
              <span className="truncate">{language === 'pt' ? 'Português' : 'English'}</span>
            )}
          </button>
        </div>
      </aside>

      {/* --- MOBILE HEADER (HIDDEN ON DESKTOP/MD+) --- */}
      <header className={`md:hidden fixed top-0 left-0 right-0 z-50 bg-[#08080c]/95 backdrop-blur-md border-b border-white/5 transition-transform duration-300 ${showHeader ? 'translate-y-0' : '-translate-y-full'}`}>
        <div className="max-w-5xl mx-auto px-4 py-2.5 flex items-center justify-between gap-3">
          {/* Logo and sync badge */}
          <div className="flex items-center gap-2 cursor-pointer shrink-0" onClick={() => setView('recorder')}>
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-emerald-400 to-cyan-500 flex items-center justify-center shadow-lg shadow-emerald-500/20">
              <span className="text-sm font-bold text-black font-semibold">C</span>
            </div>
            <div>
              <h1 className="text-sm font-bold tracking-tight">CapIAudio</h1>
            </div>
            {syncRoomId && (
              <div className={`flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[9px] font-medium ${isConnected ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400'}`}>
                <Wifi size={10} className={isConnected ? 'animate-pulse' : ''} />
              </div>
            )}
          </div>
          
          <div className="flex items-center gap-1.5 shrink-0">
            {/* Language Selection Toggle */}
            <button
              onClick={toggleLanguage}
              className="px-2 py-1 rounded-lg text-[10px] bg-[#1e2130] border border-white/5 font-bold text-zinc-200 cursor-pointer"
            >
              🌐 {language.toUpperCase()}
            </button>
            
            <div className="flex items-center gap-0.5">
              {view !== 'history' && (
                <button 
                  onClick={() => setView('history')}
                  className="p-1.5 text-zinc-400 hover:text-white rounded-lg cursor-pointer"
                >
                  <History size={15} />
                </button>
              )}

              {view !== 'docs' && (
                <button 
                  onClick={() => setView('docs')}
                  className="p-1.5 text-zinc-400 hover:text-white rounded-lg cursor-pointer"
                >
                  <Book size={15} />
                </button>
              )}

              <button onClick={() => setShowSettings(true)} className="p-1.5 text-zinc-400 hover:text-white rounded-lg cursor-pointer">
                <Settings2 size={15} />
              </button>
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
        <div className="fixed inset-0 bg-black/85 flex items-center justify-center z-[100] p-4 overflow-y-auto">
          <div className="bg-zinc-900 border border-zinc-800 w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden my-8">
            
            {/* Modal Header */}
            <div className="px-6 py-5 border-b border-zinc-800 bg-zinc-950/40 flex items-center justify-between">
              <div>
                <h3 className="text-xl font-medium text-white flex items-center gap-2">
                  <Settings2 className="text-emerald-400 stroke-[2]" size={22} />
                  Configurações do Sistema
                </h3>
                <p className="text-zinc-500 text-xs mt-1">Ajuste os parâmetros de sincronização e selecione seus provedores de inteligência artificial.</p>
              </div>
              <button 
                onClick={() => setShowSettings(false)}
                className="text-zinc-400 hover:text-white transition-colors text-xs bg-zinc-800 hover:bg-zinc-700 px-3 py-1.5 rounded-lg font-medium cursor-pointer"
              >
                Fechar (X)
              </button>
            </div>

            {/* Tabs Selector Navigation Header */}
            <div className="flex border-b border-zinc-800 bg-zinc-950/20 px-6">
              <button
                type="button"
                onClick={() => setSettingsTab('general')}
                className={`flex items-center gap-2 py-3 px-4 text-xs font-bold uppercase tracking-wider border-b-2 transition-all cursor-pointer ${
                  settingsTab === 'general'
                    ? 'border-emerald-500 text-emerald-400'
                    : 'border-transparent text-zinc-500 hover:text-zinc-300'
                }`}
              >
                <Radio size={14} />
                Geral & Sincronização
              </button>
              <button
                type="button"
                onClick={() => setSettingsTab('ai')}
                className={`flex items-center gap-2 py-3 px-4 text-xs font-bold uppercase tracking-wider border-b-2 transition-all cursor-pointer ${
                  settingsTab === 'ai'
                    ? 'border-emerald-500 text-emerald-400'
                    : 'border-transparent text-zinc-500 hover:text-zinc-300'
                }`}
              >
                <Zap size={14} />
                IA: Modelos & Provedores
              </button>
            </div>

            {/* Modal Content - Scrollable Form */}
            <div className="p-6 max-h-[62vh] overflow-y-auto space-y-5">
              
              {/* General tab content */}
              {settingsTab === 'general' && (
                <div className="space-y-5 animate-fade-in">
                  
                  {/* Image generator model */}
                  <div className="bg-zinc-950/30 p-4 rounded-xl border border-zinc-800/60 grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-400 mb-2">Modelo de Imagem (Insights)</label>
                      <select
                        value={imageModel}
                        onChange={(e) => setImageModel(e.target.value)}
                        className="w-full bg-zinc-900 border border-zinc-700/80 rounded-xl p-3 text-sm text-white focus:outline-none focus:border-emerald-500 transition-colors"
                      >
                        <option value="gemini-3.1-flash-image-preview">Gemini 3.1 Flash Image (Alta Qualidade)</option>
                        <option value="gemini-2.5-flash-image">Gemini 2.5 Flash Image (Rápido)</option>
                      </select>
                      <p className="text-[10px] text-zinc-500 mt-1.5">Gera representações conceituais para marcadores visuais.</p>
                    </div>

                    {imageModel === 'gemini-3.1-flash-image-preview' && (
                      <div className="animate-fade-in">
                        <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-400 mb-2">Resolução da Imagem</label>
                        <select
                          value={imageSize}
                          onChange={(e) => setImageSize(e.target.value)}
                          className="w-full bg-zinc-900 border border-zinc-700/80 rounded-xl p-3 text-sm text-white focus:outline-none focus:border-emerald-500 transition-colors"
                        >
                          <option value="512px">0.5K (512px) - Padrão e Rápido</option>
                          <option value="1K">1K (Ideal para displays nítidos)</option>
                          <option value="2K">2K (Alta Resolução)</option>
                          <option value="4K">4K (Ultra HD - Lento)</option>
                        </select>
                      </div>
                    )}
                  </div>

                  {/* Room Sincronização */}
                  <div className="bg-zinc-950/30 p-4 rounded-xl border border-zinc-800/60">
                    <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-400 mb-2">ID da Sala de Sincronização (Multi-Dispositivo)</label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={syncRoomId}
                        onChange={(e) => setSyncRoomId(e.target.value)}
                        placeholder="Ex: set-principal"
                        className="w-full bg-zinc-900 border border-zinc-700/80 rounded-xl p-3 text-sm text-white focus:outline-none focus:border-emerald-500 font-mono"
                      />
                    </div>
                    <p className="text-xs text-zinc-500 mt-2 leading-relaxed">
                      Use um ID idêntico em diferentes aparelhos (celulares, tablets e notebooks) para sincronizar o timecode, os cliques da claquete digital, e todos os marcadores de produção em tempo real via Cloud Sync.
                    </p>
                  </div>

                  <div className="bg-emerald-500/5 p-4 rounded-xl border border-emerald-500/15">
                    <h5 className="text-xs font-bold text-emerald-400 flex items-center gap-1.5 mb-1.5">
                      💡 Sincronia Ultra Eficiente
                    </h5>
                    <p className="text-[11px] text-zinc-400 leading-relaxed font-light">
                      O sincronismo do CapIAudio permite que o diretor de fotografia ou o sonoplasta opere a timeline enquanto o assistente bate a claquete no set principal, consolidando as faixas imediatamente após a conclusão do take.
                    </p>
                  </div>

                </div>
              )}

              {/* AI providers and model tab content */}
              {settingsTab === 'ai' && (
                <div className="space-y-5 animate-fade-in">
                  
                  {/* Select AI Active Provider Grid */}
                  <div>
                     <label className="block text-xs font-bold uppercase tracking-wider text-zinc-400 mb-2.5">Provedor Ativo de IA</label>
                     <div className="grid grid-cols-2 md:grid-cols-5 gap-2.5">
                       {PROVIDER_OPTIONS.map((prov) => {
                         let iconTheme = "💎";
                         if (prov.id === 'openai') iconTheme = "🟢";
                         if (prov.id === 'deepseek') iconTheme = "🚀";
                         if (prov.id === 'openrouter') iconTheme = "🌐";
                         if (prov.id === 'custom') iconTheme = "⚙️";
                         
                         const isSelected = aiProvider === prov.id;
                         return (
                           <button
                             type="button"
                             key={prov.id}
                             onClick={() => {
                               setAiProvider(prov.id);
                               // Auto align transcription and analysis selections when provider flips...
                               const transOpt = TRANSCRIPTION_MODEL_OPTIONS.find(o => o.provider === prov.id);
                               const analOpt = ANALYSIS_MODEL_OPTIONS.find(o => o.provider === prov.id);
                               if (transOpt) setTransModel(transOpt.id);
                               if (analOpt) setAnalysModel(analOpt.id);
                             }}
                             className={`p-3 rounded-xl border text-center transition-all cursor-pointer flex flex-col items-center justify-center gap-1.5 ${
                               isSelected
                                 ? 'border-emerald-500 bg-emerald-500/10 text-white shadow-lg'
                                 : 'border-zinc-800 bg-zinc-950/40 text-zinc-400 hover:text-zinc-200 hover:border-zinc-700'
                             }`}
                           >
                             <span className="text-xl">{iconTheme}</span>
                             <span className="text-xs font-bold leading-tight">{prov.name.split(' ')[0]}</span>
                           </button>
                         );
                       })}
                     </div>
                   </div>
 
                   {/* Provider Specific API Key Fields */}
                   <div className="bg-zinc-950/40 p-4 rounded-xl border border-zinc-800 space-y-3.5">
                     
                     {aiProvider === 'gemini' && (
                       <div className="animate-fade-in space-y-1">
                         <div className="flex justify-between items-center mb-1">
                           <label className="text-xs font-semibold text-zinc-300">Google Gemini API Key</label>
                           <a href="https://aistudio.google.com/" target="_blank" rel="noopener noreferrer" className="text-[10px] text-emerald-400 hover:underline">Pegar chave no AI Studio ↗</a>
                         </div>
                         <input
                           type="password"
                           value={apiKeyInput}
                           onChange={(e) => setApiKeyInput(e.target.value)}
                           placeholder="Cole sua chave AIzaSy..."
                           className="w-full bg-zinc-900 border border-zinc-700/80 rounded-xl p-3 text-sm text-white focus:outline-none focus:border-emerald-500 font-mono transition-colors"
                         />
                       </div>
                     )}

                     {aiProvider === 'openai' && (
                       <div className="animate-fade-in space-y-3">
                         <div className="space-y-1">
                           <div className="flex justify-between items-center mb-1">
                             <label className="text-xs font-semibold text-zinc-300">OpenAI API Key</label>
                             <a href="https://platform.openai.com/api-keys" target="_blank" rel="noopener noreferrer" className="text-[10px] text-emerald-400 hover:underline">Plataforma OpenAI ↗</a>
                           </div>
                           <input
                             type="password"
                             value={openaiKey}
                             onChange={(e) => setOpenaiKey(e.target.value)}
                             placeholder="sk-or-v1-... ou sk-proj-..."
                             className="w-full bg-zinc-900 border border-zinc-700/80 rounded-xl p-3 text-sm text-white focus:outline-none focus:border-emerald-500 font-mono transition-colors"
                           />
                         </div>
                       </div>
                     )}
 
                     {aiProvider === 'deepseek' && (
                       <div className="animate-fade-in space-y-3">
                         <div className="space-y-1">
                           <div className="flex justify-between items-center mb-1">
                             <label className="text-xs font-semibold text-zinc-300">DeepSeek API Key</label>
                             <a href="https://platform.deepseek.com/" target="_blank" rel="noopener noreferrer" className="text-[10px] text-emerald-400 hover:underline">Plataforma DeepSeek ↗</a>
                           </div>
                           <input
                             type="password"
                             value={deepseekKey}
                             onChange={(e) => setDeepseekKey(e.target.value)}
                             placeholder="sk-..."
                             className="w-full bg-zinc-900 border border-zinc-700/80 rounded-xl p-3 text-sm text-white focus:outline-none focus:border-emerald-500 font-mono transition-colors"
                           />
                         </div>
                         <div className="space-y-1">
                           <label className="text-xs font-semibold text-zinc-450 block">Endpoint Base URL (Opcional)</label>
                           <input
                             type="text"
                             value={deepseekUrl}
                             onChange={(e) => setDeepseekUrl(e.target.value)}
                             className="w-full bg-zinc-900 border border-zinc-700/80 rounded-xl p-2.5 text-xs text-zinc-300 focus:outline-none focus:border-emerald-500 font-mono"
                           />
                         </div>
                       </div>
                     )}
 
                     {aiProvider === 'openrouter' && (
                       <div className="animate-fade-in space-y-1">
                         <div className="flex justify-between items-center mb-1">
                           <label className="text-xs font-semibold text-zinc-300">OpenRouter API Key (DeepSeek / Qwen)</label>
                           <a href="https://openrouter.ai/keys" target="_blank" rel="noopener noreferrer" className="text-[10px] text-emerald-400 hover:underline">Painel OpenRouter ↗</a>
                         </div>
                         <input
                           type="password"
                           value={openrouterKey}
                           onChange={(e) => setOpenrouterKey(e.target.value)}
                           placeholder="sk-or-v1-..."
                           className="w-full bg-zinc-900 border border-zinc-700/80 rounded-xl p-3 text-sm text-white focus:outline-none focus:border-emerald-500 font-mono transition-colors"
                         />
                         <p className="text-[10px] text-zinc-500 pt-1">Uma única chave para gerenciar o DeepSeek R1, DeepSeek V3 e o modelo Qwen-2.5-Coder de forma rápida.</p>
                       </div>
                     )}
 
                     {aiProvider === 'custom' && (
                       <div className="animate-fade-in space-y-3">
                         <div className="space-y-1">
                           <label className="text-xs font-semibold text-zinc-300 block">Endpoint URL (Ollama / Docker Fast Whisper)</label>
                           <input
                             type="text"
                             value={customUrl}
                             onChange={(e) => setCustomUrl(e.target.value)}
                             placeholder="http://localhost:11434/v1 ou http://localhost:8000"
                             className="w-full bg-zinc-900 border border-zinc-700/80 rounded-xl p-3 text-sm text-white focus:outline-none focus:border-emerald-500 font-mono"
                           />
                           <p className="text-[10px] text-zinc-500 mt-1">Insira a URL base de seu endpoint local compatível com a API do OpenAI (por exemplo, contêiner Docker Local Whisper ou Ollama).</p>
                         </div>
                         <div className="space-y-1">
                           <label className="text-xs font-semibold text-zinc-300 block">Chave Customizada (Opcional)</label>
                           <input
                             type="password"
                             value={customKey}
                             onChange={(e) => setCustomKey(e.target.value)}
                             placeholder="Deixe em branco se rodar local"
                             className="w-full bg-zinc-900 border border-zinc-700/80 rounded-xl p-2.5 text-xs text-white focus:outline-none focus:border-emerald-500 font-mono"
                           />
                         </div>
                       </div>
                     )}
 
                   </div>

                  {/* Active Models Selectors */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    
                    {/* Transcription block */}
                    <div className="bg-zinc-950/30 p-4 rounded-xl border border-zinc-800/60">
                      <label className="block text-xs font-semibold text-zinc-300 mb-2">🎙️ Transcrição do Áudio</label>
                      <select
                        value={transModel}
                        onChange={(e) => setTransModel(e.target.value)}
                        className="w-full bg-zinc-900 border border-zinc-700/80 rounded-xl p-2.5 text-xs text-white focus:outline-none focus:border-emerald-500 transition-colors"
                      >
                        {TRANSCRIPTION_MODEL_OPTIONS.filter(o => o.provider === aiProvider || aiProvider === 'custom').map(opt => (
                          <option key={opt.id} value={opt.id}>{opt.name}</option>
                        ))}
                      </select>
                      <p className="text-[10px] text-zinc-500 mt-2 leading-relaxed">
                        Selecione o modelo que processará o fluxo de áudio para fala em formato de texto.
                      </p>
                    </div>

                    {/* Analysis intelligent report */}
                    <div className="bg-zinc-950/30 p-4 rounded-xl border border-zinc-800/60">
                      <label className="block text-xs font-semibold text-zinc-300 mb-2">✍️ Análise & Sumários (Relatório)</label>
                      <select
                        value={analysModel}
                        onChange={(e) => setAnalysModel(e.target.value)}
                        className="w-full bg-zinc-900 border border-zinc-700/80 rounded-xl p-2.5 text-xs text-white focus:outline-none focus:border-emerald-500 transition-colors"
                      >
                        {ANALYSIS_MODEL_OPTIONS.filter(o => o.provider === aiProvider || aiProvider === 'custom').map(opt => (
                          <option key={opt.id} value={opt.id}>{opt.name}</option>
                        ))}
                      </select>
                      <p className="text-[10px] text-zinc-500 mt-2 leading-relaxed">
                        Seleciona a inteligência encarregada de organizar notas, agendas de decisão, diários de set e tags inteligentes.
                      </p>
                    </div>

                  </div>

                  {/* Latency Tester Interface */}
                  <div className="bg-zinc-950/50 p-4 rounded-xl border border-zinc-800/80 space-y-3">
                    <div className="flex items-center justify-between">
                      <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-300 flex items-center gap-1.5">
                        ⚡ Interface de Latência em Tempo Real
                      </h4>
                      <button
                        type="button"
                        onClick={async () => {
                          const testConfigs = [
                            { id: 'gemini-3.5-flash', provider: 'gemini' },
                            { id: 'gemini-2.5-flash', provider: 'gemini' },
                            { id: 'gpt-4o-mini', provider: 'openai' },
                            { id: 'deepseek-chat', provider: 'deepseek' },
                            { id: 'deepseek/deepseek-chat', provider: 'openrouter' },
                            { id: 'deepseek/deepseek-r1:free', provider: 'openrouter' },
                            { id: 'qwen/qwen-3.5-preview', provider: 'openrouter' },
                            { id: 'qwen/qwen-2.5-coder-32b', provider: 'openrouter' }
                          ];
                          // Batch testing sequentially or in parallel
                          testConfigs.forEach(m => {
                            // invoke testing
                            setLatencyResults(prev => ({
                              ...prev,
                              [m.id]: { ms: 0, rating: 'average', message: 'Testando...', testing: true }
                            }));
                            
                            const options: Partial<AISettings> = {
                              geminiApiKey: apiKeyInput,
                              openaiApiKey: openaiKey,
                              openaiUrl,
                              deepseekApiKey: deepseekKey,
                              deepseekUrl,
                              openrouterApiKey: openrouterKey,
                              customApiKey: customKey,
                              customUrl
                            };
                            
                            testModelLatency(m.provider, m.id, options).then(res => {
                              setLatencyResults(prev => ({
                                ...prev,
                                [m.id]: {
                                  ms: res.ms,
                                  rating: res.rating,
                                  message: res.message,
                                  testing: false
                                }
                              }));
                            });
                          });
                        }}
                        className="text-[10px] bg-emerald-500 hover:bg-emerald-400 text-black font-bold px-2.5 py-1 rounded-md transition-colors cursor-pointer flex items-center gap-1"
                      >
                        <RefreshCw size={10} className="animate-spin-slow" />
                        Testar Todos
                      </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs">
                      {[
                        { id: 'gemini-3.5-flash', provider: 'gemini', label: 'Gemini 3.5 Flash (Foco no Usuário - Novo)' },
                        { id: 'gemini-2.5-flash', provider: 'gemini', label: 'Gemini 2.5 Flash' },
                        { id: 'gpt-4o-mini', provider: 'openai', label: 'GPT-4o Mini (OpenAI Oficial)' },
                        { id: 'deepseek-chat', provider: 'deepseek', label: 'DeepSeek V3 / V4 Chat (Direto)' },
                        { id: 'deepseek/deepseek-chat', provider: 'openrouter', label: 'DeepSeek V3 (OpenRouter)' },
                        { id: 'deepseek/deepseek-r1:free', provider: 'openrouter', label: 'DeepSeek R1 (Grátis)' },
                        { id: 'qwen/qwen-3.5-preview', provider: 'openrouter', label: 'Qwen 3.5 Preview (OpenRouter)' },
                        { id: 'qwen/qwen-2.5-coder-32b', provider: 'openrouter', label: 'Qwen 2.5 Coder (OpenRouter)' }
                      ].map((item) => {
                        const score = latencyResults[item.id];
                        let activeRatingClass = "text-zinc-500 bg-zinc-800/40 border border-zinc-800";
                        
                        if (score) {
                          if (score.testing) {
                            activeRatingClass = "text-yellow-400 bg-yellow-500/10 border border-yellow-500/15 animate-pulse";
                          } else if (score.rating === 'excellent') {
                            activeRatingClass = "text-emerald-400 bg-emerald-500/10 border border-emerald-500/20";
                          } else if (score.rating === 'good') {
                            activeRatingClass = "text-teal-400 bg-teal-500/10 border border-teal-500/20";
                          } else if (score.rating === 'average') {
                            activeRatingClass = "text-amber-400 bg-amber-500/10 border border-amber-500/20";
                          } else if (score.rating === 'slow') {
                            activeRatingClass = "text-orange-400 bg-orange-500/10 border border-orange-500/20";
                          } else {
                            activeRatingClass = "text-red-400 bg-red-500/10 border border-red-500/20";
                          }
                        }

                        return (
                          <div key={item.id} className="bg-zinc-950/40 p-2.5 rounded-lg border border-zinc-800 flex items-center justify-between gap-3 text-left">
                            <div className="truncate-2-lines">
                              <span className="block font-medium text-zinc-300 truncate">{item.label}</span>
                              <span className="text-[9px] uppercase tracking-wider text-zinc-500">{item.provider}</span>
                            </div>
                            
                            <div className="flex items-center gap-1.5 shrink-0">
                              <span className={`px-2 py-0.5 rounded text-[9px] font-bold ${activeRatingClass}`}>
                                {score ? score.message : "Não Testado"}
                              </span>
                              <button
                                type="button"
                                onClick={async () => {
                                  setLatencyResults(prev => ({
                                    ...prev,
                                    [item.id]: { ms: 0, rating: 'average', message: 'Calculando...', testing: true }
                                  }));
                                  
                                  const options: Partial<AISettings> = {
                                    geminiApiKey: apiKeyInput,
                                    openaiApiKey: openaiKey,
                                    openaiUrl,
                                    deepseekApiKey: deepseekKey,
                                    deepseekUrl,
                                    openrouterApiKey: openrouterKey,
                                    customApiKey: customKey,
                                    customUrl
                                  };
                                  
                                  const res = await testModelLatency(item.provider, item.id, options);
                                  setLatencyResults(prev => ({
                                    ...prev,
                                    [item.id]: {
                                      ms: res.ms,
                                      rating: res.rating,
                                      message: res.message,
                                      testing: false
                                    }
                                  }));
                                }}
                                disabled={score?.testing}
                                className="p-1 text-zinc-500 hover:text-white hover:bg-white/5 rounded transition-all cursor-pointer"
                                title="Medir latência individual"
                              >
                                <RefreshCw size={11} className={score?.testing ? "animate-spin" : ""} />
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                </div>
              )}

            </div>

            {/* Modal Footer Controls */}
            <div className="px-6 py-4 border-t border-zinc-800 bg-zinc-950/40 flex justify-end gap-3">
              <button 
                onClick={() => setShowSettings(false)} 
                className="px-4 py-2 text-xs font-semibold text-zinc-400 hover:text-white transition-colors cursor-pointer"
              >
                Cancelar
              </button>
              <button 
                onClick={saveSettings} 
                className="px-5 py-2 bg-emerald-500 hover:bg-emerald-400 text-zinc-900 font-bold text-xs rounded-xl transition-colors cursor-pointer shadow-lg shadow-emerald-500/10 flex items-center gap-1.5"
              >
                <Save size={13} />
                Salvar Configurações
              </button>
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

      {/* Main Content Layout - Takes full screen (ideal for 16:9 display) on desktop */}
      <main className="w-full max-w-[1850px] mx-auto px-2 sm:px-3 lg:px-4 pt-16 md:pt-20 lg:pt-3 pb-2 transition-all h-screen flex flex-col lg:overflow-hidden">
        <AnimatePresence mode="wait">
          {view === 'recorder' && (
            <motion.div
              key="recorder-view"
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 1.02 }}
              className="w-full flex-grow flex flex-col overflow-hidden"
            >
              {!isRecording && !audioBlob && (
                <div className="w-full max-w-xl mx-auto mb-2 stagger-1 shrink-0">
                  <InstallAppPrompt language={language} />
                </div>
              )}

              {/* Mobile-Only Mode Selector bar, kept for mobile alignment */}
              {!isRecording && !audioBlob && (
                <div className="w-full max-w-xl mx-auto subtle-card !p-3 flex flex-col xs:flex-row items-center justify-between gap-3 text-sm shadow-xl mb-3 stagger-2 relative z-40 md:hidden shrink-0">
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
                          className="subtle-input !py-1 flex-1 !border-emerald-500 !text-xs"
                          autoFocus
                          placeholder="Nome do modo..."
                        />
                        <button onClick={handleSaveModeName} className="p-1 px-2 bg-emerald-500/10 border border-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 rounded-lg transition-colors cursor-pointer text-xs flex items-center gap-1 font-bold">
                          <Save size={13} />
                          Salvar
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center gap-1.5 w-full xs:w-auto justify-end">
                        <button
                          type="button"
                          onClick={() => setIsCatalogOpen(true)}
                          className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/15 text-xs rounded-xl transition-all cursor-pointer font-semibold shrink-0"
                          title="Abrir Catálogo Completo de Módulos"
                        >
                          <BookOpen size={13} />
                          <span>Catálogo</span>
                        </button>
                        <div ref={modeDropdownRef} className="relative w-full xs:w-48 z-30">
                          {/* Selected display button */}
                          <button
                            type="button"
                            onClick={() => setIsSelectDropdownOpen(!isSelectDropdownOpen)}
                            className="w-full pl-3.5 pr-8 py-2 text-xs text-zinc-100 text-left flex items-center gap-2 cursor-pointer relative bg-zinc-900 override-solid-opaque border border-zinc-800/80 hover:border-zinc-700 rounded-xl transition-all shadow-md focus:outline-none focus:ring-1 focus:ring-emerald-500/30 font-semibold"
                          >
                            <span className="text-sm shrink-0 leading-none">{currentMode.icon}</span>
                            <span className="truncate pr-2">{language === 'en' && modeTranslations[currentModeId] ? modeTranslations[currentModeId].name : currentMode.name}</span>
                            <ChevronDown size={14} className="text-zinc-400 absolute right-2.5 top-2" />
                          </button>

                          {/* Options dropdown list */}
                          {isSelectDropdownOpen && (
                            <div className="absolute top-[calc(100%+6px)] right-0 w-64 bg-[#0a0c14] border border-white/[0.08] shadow-[0_10px_40px_rgba(0,0,0,0.95)] rounded-xl p-1.5 z-55 flex flex-col gap-0.5 max-h-72 overflow-y-auto scrollbar-thin scrollbar-thumb-zinc-700 scrollbar-track-transparent animate-reveal">
                              {(Object.values(modes) as ModeConfig[]).map((mode) => {
                                const mTrans = modeTranslations[mode.id];
                                const displayName = language === 'en' && mTrans ? mTrans.name : mode.name;
                                const isSelected = mode.id === currentModeId;
                                return (
                                  <button
                                    key={mode.id}
                                    type="button"
                                    onClick={() => {
                                      setCurrentModeId(mode.id);
                                      setButtons(modes[mode.id].defaultButtons);
                                      setIsEditingFormFields(false);
                                      setIsSelectDropdownOpen(false);
                                    }}
                                    className={`flex items-center gap-2.5 w-full text-left px-3 py-2 rounded-lg text-xs font-semibold cursor-pointer transition-all ${
                                      isSelected 
                                        ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/15' 
                                        : 'text-zinc-200 hover:text-white hover:bg-white/[0.06] border border-transparent'
                                    }`}
                                  >
                                    <span className="text-sm shrink-0">{mode.icon}</span>
                                    <span className="truncate">{displayName}</span>
                                  </button>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* --- RESPONSIVE SPLIT WORKSPACE: TWO COLUMNS (STRETCHED TO 16:9 SIZE ON PC) --- */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-2 lg:h-[calc(100vh-6.5rem)] w-full items-stretch overflow-hidden">
                
                {/* 
                  1. LEFT SIDE ELEMENT (PRIMARY WORKSPACE):
                  Holds Cinema settings config boxes, Large Recorder timers & waveforms.
                  Adjusted smoothly to the left part of 16:9 display setup.
                */}
                <div className={`${isRightSidebarCollapsed ? 'col-span-12' : 'col-span-1 lg:col-span-7 xl:col-span-8'} flex flex-col gap-0 w-full lg:h-full lg:overflow-y-auto subtle-scrollbar`}>
                  
                  {/* Workspace top control bar */}
                  <div className="flex items-center justify-between w-full h-8 px-2 border-b border-white/[0.04] mb-2 shrink-0">
                    <div className="flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
                      <span className="text-[10px] text-zinc-400 font-bold uppercase tracking-widest">{language === 'en' ? 'Main View' : 'Visualização Principal'}</span>
                    </div>
                    <button
                      onClick={() => setIsRightSidebarCollapsed(!isRightSidebarCollapsed)}
                      className="hidden lg:flex items-center gap-1 text-[9px] uppercase font-bold text-zinc-350 hover:text-emerald-400 bg-black/45 px-2.5 py-1 transition-all border border-white/5 cursor-pointer"
                      title={isRightSidebarCollapsed ? "Expandir Painel Lateral" : "Recolher Painel Lateral"}
                    >
                      {isRightSidebarCollapsed ? <ChevronLeft size={10} /> : <ChevronRight size={10} />}
                      <span>{isRightSidebarCollapsed ? (language === 'en' ? "Show Sidebar" : "Mostrar Lateral") : (language === 'en' ? "Collapse Sidebar" : "Recolher Lateral")}</span>
                    </button>
                  </div>

                  {currentModeId === 'cinema' && (
                    <div className="w-full stagger-2">
                      <CinemaHeader 
                        metadata={cinemaMetadata} 
                        onChange={setCinemaMetadata} 
                        isRecording={isRecording} 
                      />
                    </div>
                  )}

                  <div className="w-full stagger-3">
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
                  </div>

                  {!isRecording && (
                    <div className="w-full flex justify-center stagger-4 text-center mt-1.5 shrink-0">
                      <button
                        onClick={() => setIsEditingFormFields(true)}
                        className="subtle-button hover:text-emerald-400 hover:border-emerald-500/10 !px-4 !py-1.5 bg-zinc-900/10 text-xs font-bold"
                        id="btn-edit-fields-trigger"
                      >
                        <Settings2 size={13} className="text-zinc-500" />
                        Personalizar Campos de Entrada
                      </button>
                    </div>
                  )}

                  {/* Move Markers Grid here if NOT in cinema mode to perfectly fill the empty center hole */}
                  {currentModeId !== 'cinema' && (
                    <div className="w-full mt-2.5 stagger-3">
                      <div className="subtle-card !p-3.5 border border-zinc-800/80">
                        <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
                          <div className="flex items-center gap-1.5 cursor-pointer select-none" onClick={() => setIsMarkersCollapsed(!isMarkersCollapsed)}>
                            {isMarkersCollapsed ? <ChevronRight size={13} className="text-zinc-400" /> : <ChevronDown size={13} className="text-emerald-400" />}
                            <div>
                              <h2 className="text-xs sm:text-xs font-bold tracking-wider uppercase text-zinc-300 flex items-center gap-1.5">
                                {t('markers')}
                                <span className="text-[9px] text-zinc-500 font-normal normal-case">
                                  {isMarkersCollapsed ? '[+] abrir' : '[-] fechar'}
                                </span>
                              </h2>
                            </div>
                          </div>
                          {!isRecording && !audioBlob && (
                            <button
                              onClick={() => isEditingLayout ? handleSaveLayout() : setIsEditingLayout(true)}
                              className={`p-1 text-[9px] px-2 flex items-center gap-1 transition-all ${isEditingLayout ? 'bg-emerald-500 text-zinc-900 font-bold animate-pulse' : 'text-zinc-400 hover:text-white bg-black/20 border border-zinc-800'}`}
                              title={isEditingLayout ? t('saveLayout') : t('editLayout')}
                            >
                              {isEditingLayout ? <><Save size={10} /> {t('saveLayout')}</> : <><Edit3 size={10} /> {t('editLayout')}</>}
                            </button>
                          )}
                        </div>
                        
                        {!isMarkersCollapsed && (
                          <div className={`transition-opacity duration-300 ${isRecording || isEditingLayout ? 'opacity-100' : 'opacity-40 pointer-events-none'}`}>
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
                        )}
                      </div>
                    </div>
                  )}
                </div>

                {/* 
                  2. RIGHT SIDE ELEMENTS (SECONDARY METRICS, LISTS & TIMELINE):
                  Adjusts seamlessly to the right. Holds interactive markers, checklist metrics,
                  extra alternative transcript utilities or timelines.
                */}
                <div className={`${isRightSidebarCollapsed ? 'hidden' : 'col-span-1 lg:col-span-5 xl:col-span-4'} flex flex-col gap-2 w-full lg:h-full lg:overflow-y-auto pr-1 subtle-scrollbar`}>
                  
                  {/* Interactive Markers Grid (Cinema Mode Only) */}
                  {currentModeId === 'cinema' && (
                    <div className="subtle-card !p-3 stagger-3">
                      <div className="flex items-center justify-between mb-2 flex-wrap gap-2">
                        <div className="flex items-center gap-1.5 cursor-pointer select-none" onClick={() => setIsMarkersCollapsed(!isMarkersCollapsed)}>
                          {isMarkersCollapsed ? <ChevronRight size={13} className="text-zinc-400" /> : <ChevronDown size={13} className="text-emerald-400" />}
                          <div>
                            <h2 className="text-xs sm:text-xs font-bold tracking-wider uppercase text-zinc-300 flex items-center gap-1.5">
                              {t('markers')}
                              <span className="text-[9px] text-zinc-500 font-normal normal-case">
                                {isMarkersCollapsed ? '[+] abrir' : '[-] fechar'}
                              </span>
                            </h2>
                          </div>
                        </div>
                        {!isRecording && !audioBlob && (
                          <button
                            onClick={() => isEditingLayout ? handleSaveLayout() : setIsEditingLayout(true)}
                            className={`p-1 text-[9px] px-2 flex items-center gap-1 transition-all ${isEditingLayout ? 'bg-emerald-500 text-zinc-900 font-bold' : 'text-zinc-400 hover:text-white bg-black/20 border border-zinc-800'}`}
                            title={isEditingLayout ? t('saveLayout') : t('editLayout')}
                          >
                            {isEditingLayout ? <><Save size={10} /> {t('saveLayout')}</> : <><Edit3 size={10} /> {t('editLayout')}</>}
                          </button>
                        )}
                      </div>
                      
                      {!isMarkersCollapsed && (
                        <div className={`transition-opacity duration-300 ${isRecording || isEditingLayout ? 'opacity-100' : 'opacity-40 pointer-events-none'}`}>
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
                      )}
                    </div>
                  )}

                  {/* Checklist Card */}
                  <div className="w-full stagger-4">
                    <ChecklistCard
                      checklist={checklist}
                      onToggle={handleToggleChecklistItem}
                      onAdd={handleAddChecklistItem}
                      onDelete={handleDeleteChecklistItem}
                      isRecording={isRecording}
                    />
                  </div>

                  {/* Alternative Sources imports (Text / YouTube) */}
                  {!isRecording && (
                    <div className="w-full flex flex-col text-left subtle-card !p-3 relative overflow-hidden stagger-4">
                      <div 
                        className="flex items-center justify-between mb-1.5 cursor-pointer select-none"
                        onClick={() => setIsSourcesCollapsed(!isSourcesCollapsed)}
                      >
                        <div className="flex items-center gap-2">
                          <Sparkles size={13} className="text-emerald-400" />
                          <h3 className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest flex items-center gap-2">
                            Fontes Alternativas
                            <span className="text-[9px] text-zinc-550 font-normal normal-case">
                              {isSourcesCollapsed ? '[+] abrir' : '[-] fechar'}
                            </span>
                          </h3>
                        </div>
                      </div>

                      {!isSourcesCollapsed && (
                        <>
                          <p className="text-[11px] text-zinc-450 mb-3">Gere relatórios de textos externos ou YouTube</p>

                          {/* Tabs */}
                          <div className="flex border-b border-zinc-900 mb-3 text-[11px] font-bold">
                            <button
                              type="button"
                              onClick={() => { setImportTab('text'); setImportFeedback(''); }}
                              className={`flex-1 pb-1.5 flex items-center justify-center gap-1 transition-all border-b-2 cursor-pointer ${
                                importTab === 'text' 
                                  ? 'border-emerald-500 text-emerald-400 font-bold' 
                                  : 'border-transparent text-zinc-400 hover:text-zinc-200'
                              }`}
                            >
                              <FileText size={11} />
                              <span>Texto / Arquivo</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => { setImportTab('youtube'); setImportFeedback(''); }}
                              className={`flex-1 pb-1.5 flex items-center justify-center gap-1 transition-all border-b-2 cursor-pointer ${
                                importTab === 'youtube' 
                                  ? 'border-emerald-500 text-emerald-400 font-bold' 
                                  : 'border-transparent text-zinc-400 hover:text-zinc-200'
                              }`}
                            >
                              <Youtube size={11} />
                              <span>YouTube URL</span>
                            </button>
                          </div>

                          {/* Tab Upload text */}
                          {importTab === 'text' && (
                            <div className="flex flex-col gap-2">
                              <div className="flex items-center justify-between">
                                <span className="text-[9px] text-zinc-500 uppercase tracking-wider">Upload de arquivo .txt ou .srt</span>
                                <label className="text-[9px] bg-zinc-900 hover:bg-zinc-800 text-emerald-400 font-semibold px-2 py-0.5 border border-zinc-800 transition-colors cursor-pointer flex items-center gap-1 shrink-0">
                                  <UploadCloud size={9} />
                                  <span>Escolher</span>
                                  <input 
                                    type="file" 
                                    accept=".txt,.srt" 
                                    onChange={(e) => {
                                      const file = e.target.files?.[0];
                                      if (!file) return;
                                      const reader = new FileReader();
                                      reader.onload = (event) => {
                                        const text = event.target?.result;
                                        if (typeof text === 'string') {
                                          setImportText(text);
                                          setImportFeedback(`Sucesso: "${file.name}" carregado.`);
                                        }
                                      };
                                      reader.readAsText(file);
                                    }} 
                                    className="hidden" 
                                  />
                                </label>
                              </div>

                              <textarea
                                value={importText}
                                onChange={(e) => setImportText(e.target.value)}
                                placeholder="Cole o texto de conversa aqui ou faça upload do arquivo..."
                                className="w-full subtle-input h-20 resize-none font-sans leading-relaxed text-xs !p-2 !rounded-none"
                              />

                              <button
                                type="button"
                                disabled={isImporting || !importText.trim()}
                                onClick={handleTextTranscriptImport}
                                className={`w-full py-1.5 rounded-none text-xs font-bold transition-all flex items-center justify-center gap-1 cursor-pointer ${
                                  isImporting || !importText.trim()
                                    ? 'bg-zinc-950/40 text-zinc-600 border border-white/[0.01] cursor-not-allowed'
                                    : 'bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/15 border border-emerald-500/10'
                                }`}
                              >
                                <Sparkles size={11} />
                                <span>Importar Transcrição</span>
                              </button>
                            </div>
                          )}

                          {/* Tab YouTube */}
                          {importTab === 'youtube' && (
                            <div className="flex flex-col gap-2">
                              <span className="text-[9px] text-zinc-500 uppercase tracking-wider">Link do Vídeo do YouTube</span>
                              <div className="relative">
                                <input
                                  type="text"
                                  value={youtubeInputUrl}
                                  onChange={(e) => setYoutubeInputUrl(e.target.value)}
                                  placeholder="https://www.youtube.com/watch?v=..."
                                  className="w-full subtle-input pl-7 pr-3 py-1.5 text-xs !rounded-none"
                                />
                                <Link size={11} className="absolute left-2 top-2.5 text-zinc-500" />
                              </div>

                              <button
                                type="button"
                                disabled={isImporting || !youtubeInputUrl.trim()}
                                onClick={handleYoutubeImport}
                                className={`w-full py-1.5 rounded-none text-xs font-bold transition-all flex items-center justify-center gap-1 cursor-pointer ${
                                  isImporting || !youtubeInputUrl.trim()
                                    ? 'bg-zinc-950/40 text-zinc-600 border border-white/[0.01] cursor-not-allowed'
                                    : 'bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/15 border border-emerald-500/10'
                                }`}
                              >
                                <Sparkles size={11} />
                                <span>Extrair &amp; Analisar de YouTube</span>
                              </button>
                            </div>
                          )}

                          {/* Logs feedbacks */}
                          {importFeedback && (
                            <div className={`mt-2 p-1.5 rounded-none text-[9px] line-clamp-2 leading-normal transition-all ${
                              importFeedback.startsWith('Erro') 
                                ? 'bg-red-500/10 text-red-400 border border-red-500/10' 
                                : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/10'
                            }`}>
                              {importFeedback}
                            </div>
                          )}

                          {isImporting && (
                            <div className="mt-2 flex items-center justify-center gap-1 text-[9px] text-emerald-400 font-semibold">
                              <RefreshCw size={10} className="animate-spin" />
                              <span>Processando dados...</span>
                            </div>
                          )}
                        </>
                      )}
                    </div>
                  )}

                  {/* Timeline History preview */}
                  {(markers.length > 0 || remoteMarkers.length > 0) && (
                    <div className="subtle-card !p-5 md:!p-6 stagger-5">
                      <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
                        <div className="flex items-center gap-3">
                          <h3 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Timeline</h3>
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
                          <span className="flex items-center gap-2 text-[11px] font-medium text-red-400 bg-red-400/10 px-2 py-0.5 rounded-md">
                            <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
                            Gravando Remotamente
                          </span>
                        )}
                      </div>
                      <div className="space-y-2.5">
                        {Array.from(new Map([...remoteMarkers, ...markers].map(m => [m.id, m])).values())
                          .sort((a, b) => a.time - b.time)
                          .slice(-5).reverse().map((m) => (
                          <motion.div 
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            key={m.id} 
                            className="flex items-center justify-between gap-4 text-xs bg-black/20 p-2.5 rounded-xl border border-white/[0.02]"
                          >
                            <div className="flex items-center gap-3 min-w-0">
                              <span className="font-mono text-emerald-400 bg-emerald-400/10 px-2 py-0.5 rounded-md text-[10px] shrink-0">
                                {Math.floor(m.time / 60).toString().padStart(2, '0')}:{Math.floor(m.time % 60).toString().padStart(2, '0')}
                              </span>
                              <span className="text-base shrink-0 select-none">{m.icon}</span>
                              <span className="text-zinc-350 font-medium truncate">{m.label}</span>
                              {m.data && <span className="text-zinc-500 truncate text-[11px] font-medium">({m.data})</span>}
                            </div>
                            <button
                              onClick={() => deleteMarker(m.id)}
                              className="p-1 text-zinc-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors cursor-pointer shrink-0"
                              title="Excluir este marcador"
                            >
                              <Trash2 size={12} />
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
