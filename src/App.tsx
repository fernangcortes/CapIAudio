import React, { useState, useEffect } from 'react';
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
import { AppMode, RecordingSession, ModeConfig, CinemaMetadata } from './types';
import { motion, AnimatePresence } from 'motion/react';
import { Settings2, History, Edit3, Save, Plus, Wifi, Book } from 'lucide-react';
import { getAllModes, saveCustomModes, saveSession } from './services/storageService';

export default function App() {
  const [modes, setModes] = useState<Record<string, ModeConfig>>(getAllModes());
  const [currentModeId, setCurrentModeId] = useState<AppMode>('interview');
  const currentMode = modes[currentModeId] || modes['interview'];
  
  const [view, setView] = useState<'recorder' | 'results' | 'history' | 'docs'>('recorder');
  const [showSettings, setShowSettings] = useState(false);
  const [isEditingLayout, setIsEditingLayout] = useState(false);
  const [isEditingModeName, setIsEditingModeName] = useState(false);
  const [editedModeName, setEditedModeName] = useState('');
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
  const [apiKeyInput, setApiKeyInput] = useState('');
  const [imageModel, setImageModel] = useState(localStorage.getItem('IMAGE_MODEL') || 'gemini-3.1-flash-image-preview');
  const [imageSize, setImageSize] = useState(localStorage.getItem('IMAGE_SIZE') || '512px');
  
  const [currentSession, setCurrentSession] = useState<RecordingSession | null>(null);
  const [filename, setFilename] = useState('');

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
  } = useAudioRecorder();

  const {
    markers,
    customButtons,
    speakers,
    addMarker,
    addCustomButton,
    addSpeaker,
    resetMarkers,
    setButtons,
    setMarkers
  } = useMarkers(currentMode.defaultButtons);

  useEffect(() => {
    if (!isRecording && !audioBlob && !isEditingLayout) {
      setButtons(currentMode.defaultButtons);
    }
  }, [currentModeId, isRecording, audioBlob, setButtons, isEditingLayout]);

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
    startRecording();
  };

  const handleStop = async () => {
    const newBlob = await stopRecording();
    
    let session = currentSession;
    if (!session) {
      session = {
        id: Math.random().toString(36).substr(2, 9),
        title: filename.trim() || `Gravação - ${new Date().toLocaleString()}`,
        date: new Date().toISOString(),
        modeId: currentModeId,
        audioBlobs: [newBlob],
        markers: markers,
        duration: currentTime,
        cinemaMetadata: currentModeId === 'cinema' ? cinemaMetadata : undefined
      };
    } else {
      session = {
        ...session,
        title: filename.trim() || session.title,
        audioBlobs: [...session.audioBlobs, newBlob],
        markers: markers,
        duration: currentTime,
        cinemaMetadata: currentModeId === 'cinema' ? cinemaMetadata : undefined
      };
    }
    
    setCurrentSession(session);
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
      <header className="sticky top-0 z-50 bg-[#0f111a]/80 backdrop-blur-md border-b border-white/5">
        <div className="max-w-5xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3 cursor-pointer" onClick={() => setView('recorder')}>
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-400 to-cyan-500 flex items-center justify-center shadow-lg shadow-emerald-500/20">
              <span className="text-xl font-bold text-black">C</span>
            </div>
            <h1 className="text-xl font-semibold tracking-tight">CapIAudio</h1>
            {syncRoomId && (
              <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${isConnected ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'bg-red-500/20 text-red-400 border border-red-500/30'}`}>
                <Wifi size={12} className={isConnected ? 'animate-pulse' : ''} />
                {syncRoomId}
              </div>
            )}
          </div>
          
          <div className="flex items-center gap-4">
            {!isRecording && !audioBlob && view === 'recorder' && (
              <div className="flex items-center gap-2">
                {isEditingModeName ? (
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      value={editedModeName}
                      onChange={(e) => setEditedModeName(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleSaveModeName()}
                      className="bg-[#1e2130] border border-emerald-500 text-white text-sm rounded-xl px-4 py-2.5 outline-none w-40"
                      autoFocus
                    />
                    <button onClick={handleSaveModeName} className="p-2 text-emerald-500 hover:bg-emerald-500/10 rounded-xl transition-colors">
                      <Save size={18} />
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center gap-1">
                    <select
                      value={currentModeId}
                      onChange={(e) => {
                        const newModeId = e.target.value;
                        setCurrentModeId(newModeId);
                        setButtons(modes[newModeId].defaultButtons);
                      }}
                      className="bg-[#1e2130] border border-white/10 text-white text-sm rounded-xl px-4 py-2.5 outline-none focus:border-emerald-500 transition-colors appearance-none cursor-pointer pr-10 relative"
                      style={{ backgroundImage: `url("data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='white' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3e%3cpolyline points='6 9 12 15 18 9'%3e%3c/polyline%3e%3c/svg%3e")`, backgroundRepeat: 'no-repeat', backgroundPosition: 'right 1rem center', backgroundSize: '1em' }}
                    >
                      {(Object.values(modes) as ModeConfig[]).map((mode) => (
                        <option key={mode.id} value={mode.id}>
                          {mode.icon} {mode.name}
                        </option>
                      ))}
                    </select>
                    {currentMode.custom && (
                      <button 
                        onClick={() => {
                          setEditedModeName(currentMode.name);
                          setIsEditingModeName(true);
                        }}
                        className="p-2 text-zinc-400 hover:text-white hover:bg-white/5 rounded-xl transition-colors"
                        title="Renomear Modo"
                      >
                        <Edit3 size={16} />
                      </button>
                    )}
                  </div>
                )}
                <button 
                  onClick={handleCreateMode}
                  className="p-2.5 text-zinc-400 hover:text-white hover:bg-white/5 rounded-xl transition-colors"
                  title="Criar Novo Modo"
                >
                  <Plus size={20} />
                </button>
              </div>
            )}
            
            {view !== 'history' && (
              <div className="relative group">
                <button 
                  onClick={() => setView('history')}
                  className="p-2.5 text-zinc-400 hover:text-white hover:bg-white/5 rounded-xl transition-colors"
                >
                  <History size={20} />
                </button>
                <div className="absolute top-full mt-2 left-1/2 -translate-x-1/2 px-2 py-1 bg-zinc-800 text-xs text-white rounded opacity-0 group-hover:opacity-100 pointer-events-none whitespace-nowrap z-50">
                  Histórico
                </div>
              </div>
            )}

            {view !== 'docs' && (
              <div className="relative group">
                <button 
                  onClick={() => setView('docs')}
                  className="p-2.5 text-zinc-400 hover:text-white hover:bg-white/5 rounded-xl transition-colors"
                >
                  <Book size={20} />
                </button>
                <div className="absolute top-full mt-2 left-1/2 -translate-x-1/2 px-2 py-1 bg-zinc-800 text-xs text-white rounded opacity-0 group-hover:opacity-100 pointer-events-none whitespace-nowrap z-50">
                  Documentação
                </div>
              </div>
            )}

            <div className="relative group">
              <button onClick={() => setShowSettings(true)} className="p-2.5 text-zinc-400 hover:text-white hover:bg-white/5 rounded-xl transition-colors">
                <Settings2 size={20} />
              </button>
              <div className="absolute top-full mt-2 right-0 px-2 py-1 bg-zinc-800 text-xs text-white rounded opacity-0 group-hover:opacity-100 pointer-events-none whitespace-nowrap z-50">
                Configurações
              </div>
            </div>
          </div>
        </div>
      </header>

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

      {/* Main Content */}
      <main className="max-w-5xl mx-auto px-6 py-12">
        <AnimatePresence mode="wait">
          {view === 'recorder' && (
            <motion.div
              key="recorder-view"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 1.05 }}
              className="flex flex-col gap-12 items-center justify-center min-h-[60vh]"
            >
              {currentModeId === 'cinema' && (
                <CinemaHeader 
                  metadata={cinemaMetadata} 
                  onChange={setCinemaMetadata} 
                  isRecording={isRecording} 
                />
              )}

              <div className="flex flex-col md:flex-row gap-12 items-start justify-center w-full">
                {/* Left Column: Recorder (Only takes space when NOT recording) */}
                {!isRecording && (
                  <div className="w-full md:w-1/3 flex flex-col items-center justify-center">
                    <Recorder
                      isRecording={isRecording}
                      isPaused={isPaused}
                      currentTime={currentTime}
                      onStart={handleStartRecording}
                      onStop={handleStop}
                      onPause={pauseRecording}
                      modeName={currentMode.name}
                      mediaStream={mediaStream}
                      filename={filename}
                      setFilename={setFilename}
                    />
                  </div>
                )}

                {/* Recorder fixed at bottom when recording */}
                {isRecording && (
                  <Recorder
                    isRecording={isRecording}
                    isPaused={isPaused}
                    currentTime={currentTime}
                    onStart={handleStartRecording}
                    onStop={handleStop}
                    onPause={pauseRecording}
                    modeName={currentMode.name}
                    mediaStream={mediaStream}
                    filename={filename}
                    setFilename={setFilename}
                    onAutoClaquete={currentModeId === 'cinema' ? handleAutoClaquete : undefined}
                  />
                )}

                {/* Right Column: Markers */}
                <div className={`w-full ${isRecording ? 'md:w-full max-w-3xl mx-auto pb-32' : 'md:w-2/3'}`}>
                <div className="mb-8 flex items-center justify-between">
                  <div>
                    <h2 className="text-2xl font-semibold mb-2">Marcadores</h2>
                    <p className="text-zinc-400 text-sm">
                      {isEditingLayout ? 'Arraste para reordenar, clique no ícone para redimensionar.' : 'Clique nos botões abaixo durante a gravação para registrar momentos importantes.'}
                    </p>
                  </div>
                  {!isRecording && !audioBlob && (
                    <button
                      onClick={() => isEditingLayout ? handleSaveLayout() : setIsEditingLayout(true)}
                      className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-colors ${isEditingLayout ? 'bg-emerald-500 text-zinc-900 hover:bg-emerald-400' : 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700 hover:text-white'}`}
                    >
                      {isEditingLayout ? <><Save size={16} /> Salvar Layout</> : <><Edit3 size={16} /> Editar Layout</>}
                    </button>
                  )}
                </div>
                
                <div className={`transition-opacity duration-500 ${isRecording || isEditingLayout ? 'opacity-100' : 'opacity-50 pointer-events-none'}`}>
                  <MarkerGrid
                    buttons={customButtons}
                    onMark={(btn, data) => {
                      if (!isEditingLayout) {
                        const marker = addMarker(currentTime, btn, data);
                        if (syncRoomId) syncAddMarker(marker);
                      }
                    }}
                    onAddCustomButton={addCustomButton}
                    currentTime={currentTime}
                    setButtons={isEditingLayout ? setButtons : undefined}
                  />
                </div>

                {/* Timeline Preview (Optional) */}
                {(markers.length > 0 || remoteMarkers.length > 0) && (
                  <div className="mt-12 p-6 bg-[#1e2130] rounded-3xl border border-white/5">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-sm font-medium text-zinc-400 uppercase tracking-wider">Timeline</h3>
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
                          className="flex items-center gap-4 text-sm bg-black/20 p-3 rounded-xl"
                        >
                          <span className="font-mono text-emerald-400 bg-emerald-400/10 px-2 py-1 rounded-md">
                            {Math.floor(m.time / 60).toString().padStart(2, '0')}:{Math.floor(m.time % 60).toString().padStart(2, '0')}
                          </span>
                          <span className="text-xl">{m.icon}</span>
                          <span className="text-zinc-300 font-medium">{m.label}</span>
                          {m.data && <span className="text-zinc-500 truncate">({m.data})</span>}
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
                  setView('recorder');
                }}
              />
            </motion.div>
          )}

          {view === 'docs' && (
            <motion.div
              key="docs-view"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <Documentation onBack={() => setView('recorder')} />
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}
