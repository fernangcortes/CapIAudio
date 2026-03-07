import React, { useState, useEffect } from 'react';
import { useAudioRecorder } from './hooks/useAudioRecorder';
import { useMarkers } from './hooks/useMarkers';
import { Recorder } from './components/Recorder';
import { MarkerGrid } from './components/MarkerGrid';
import { ResultScreen } from './components/ResultScreen';
import { HistoryScreen } from './components/HistoryScreen';
import { APP_MODES } from './constants';
import { AppMode } from './types';
import { motion, AnimatePresence } from 'motion/react';
import { Settings2, History } from 'lucide-react';

export default function App() {
  const [currentMode, setCurrentMode] = useState<AppMode>('meeting');
  const [view, setView] = useState<'recorder' | 'results' | 'history'>('recorder');
  const [showSettings, setShowSettings] = useState(false);
  const [apiKeyInput, setApiKeyInput] = useState('');
  
  const {
    isRecording,
    currentTime,
    audioBlob,
    audioUrl,
    mediaStream,
    startRecording,
    stopRecording,
    resetRecording
  } = useAudioRecorder();

  const {
    markers,
    customButtons,
    addMarker,
    addCustomButton,
    resetMarkers,
    setButtons
  } = useMarkers(APP_MODES[currentMode].defaultButtons);

  useEffect(() => {
    if (!isRecording && !audioBlob) {
      setButtons(APP_MODES[currentMode].defaultButtons);
    }
  }, [currentMode, isRecording, audioBlob, setButtons]);

  useEffect(() => {
    const key = localStorage.getItem('GEMINI_API_KEY');
    if (key) setApiKeyInput(key);
  }, []);

  const saveApiKey = () => {
    localStorage.setItem('GEMINI_API_KEY', apiKeyInput);
    setShowSettings(false);
  };

  const handleStop = () => {
    stopRecording();
    setView('results');
  };

  const handleReset = () => {
    resetRecording();
    resetMarkers();
    setView('recorder');
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
          </div>
          
          <div className="flex items-center gap-4">
            {!isRecording && !audioBlob && view === 'recorder' && (
              <select
                value={currentMode}
                onChange={(e) => setCurrentMode(e.target.value as AppMode)}
                className="bg-[#1e2130] border border-white/10 text-white text-sm rounded-xl px-4 py-2.5 outline-none focus:border-emerald-500 transition-colors appearance-none cursor-pointer pr-10 relative"
                style={{ backgroundImage: `url("data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='white' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3e%3cpolyline points='6 9 12 15 18 9'%3e%3c/polyline%3e%3c/svg%3e")`, backgroundRepeat: 'no-repeat', backgroundPosition: 'right 1rem center', backgroundSize: '1em' }}
              >
                {Object.values(APP_MODES).map((mode) => (
                  <option key={mode.id} value={mode.id}>
                    {mode.icon} {mode.name}
                  </option>
                ))}
              </select>
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

            <div className="relative group">
              <button onClick={() => setShowSettings(true)} className="p-2.5 text-zinc-400 hover:text-white hover:bg-white/5 rounded-xl transition-colors">
                <Settings2 size={20} />
              </button>
              <div className="absolute top-full mt-2 right-0 px-2 py-1 bg-zinc-800 text-xs text-white rounded opacity-0 group-hover:opacity-100 pointer-events-none whitespace-nowrap z-50">
                Configurações (API Key)
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
            <p className="text-sm text-zinc-400 mb-6">Insira sua chave de API do Google Gemini para habilitar os recursos de IA.</p>
            
            <div className="mb-6">
              <label className="block text-sm font-medium text-zinc-300 mb-2">Gemini API Key</label>
              <input
                type="password"
                value={apiKeyInput}
                onChange={(e) => setApiKeyInput(e.target.value)}
                placeholder="AIzaSy..."
                className="w-full bg-zinc-800 border border-zinc-700 rounded-xl p-3 text-white focus:outline-none focus:border-emerald-500"
              />
            </div>
            
            <div className="flex justify-end gap-3">
              <button onClick={() => setShowSettings(false)} className="px-4 py-2 text-zinc-400 hover:text-white transition-colors">Cancelar</button>
              <button onClick={saveApiKey} className="px-4 py-2 bg-emerald-500 text-zinc-900 font-medium rounded-xl hover:bg-emerald-400 transition-colors">Salvar</button>
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
              className="flex flex-col md:flex-row gap-12 items-start justify-center min-h-[60vh]"
            >
              {/* Left Column: Recorder (Only takes space when NOT recording) */}
              {!isRecording && (
                <div className="w-full md:w-1/3 flex flex-col items-center justify-center">
                  <Recorder
                    isRecording={isRecording}
                    currentTime={currentTime}
                    onStart={startRecording}
                    onStop={handleStop}
                    modeName={APP_MODES[currentMode].name}
                    mediaStream={mediaStream}
                  />
                </div>
              )}

              {/* Recorder fixed at bottom when recording */}
              {isRecording && (
                <Recorder
                  isRecording={isRecording}
                  currentTime={currentTime}
                  onStart={startRecording}
                  onStop={handleStop}
                  modeName={APP_MODES[currentMode].name}
                  mediaStream={mediaStream}
                />
              )}

              {/* Right Column: Markers */}
              <div className={`w-full ${isRecording ? 'md:w-full max-w-3xl mx-auto pb-32' : 'md:w-2/3'}`}>
                <div className="mb-8">
                  <h2 className="text-2xl font-semibold mb-2">Marcadores</h2>
                  <p className="text-zinc-400 text-sm">
                    Clique nos botões abaixo durante a gravação para registrar momentos importantes.
                  </p>
                </div>
                
                <div className={`transition-opacity duration-500 ${isRecording ? 'opacity-100' : 'opacity-50 pointer-events-none'}`}>
                  <MarkerGrid
                    buttons={customButtons}
                    currentTime={currentTime}
                    onMark={(btn, data) => addMarker(currentTime, btn, data)}
                    onAddCustomButton={addCustomButton}
                  />
                </div>

                {/* Timeline Preview (Optional) */}
                {markers.length > 0 && (
                  <div className="mt-12 p-6 bg-[#1e2130] rounded-3xl border border-white/5">
                    <h3 className="text-sm font-medium text-zinc-400 mb-4 uppercase tracking-wider">Timeline</h3>
                    <div className="space-y-3">
                      {markers.slice(-3).reverse().map((m) => (
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
            </motion.div>
          )}

          {view === 'results' && (
            <motion.div
              key="results-view"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              {audioBlob && audioUrl && (
                <ResultScreen
                  audioBlob={audioBlob}
                  audioUrl={audioUrl}
                  markers={markers}
                  onReset={handleReset}
                  currentMode={currentMode}
                  duration={currentTime}
                />
              )}
            </motion.div>
          )}

          {view === 'history' && (
            <motion.div
              key="history-view"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <HistoryScreen onBack={() => setView('recorder')} />
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}
