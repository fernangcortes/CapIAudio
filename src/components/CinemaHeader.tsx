import React, { useState, useEffect } from 'react';
import { CinemaMetadata, CinemaProject, CinemaScene, CinemaShot } from '../types';
import { Film, Camera, Hash, AlignLeft, Plus, Folder, Radio, Maximize } from 'lucide-react';
import { getCinemaProjects, saveCinemaProjects } from '../services/storageService';
import { timecodeGenerator } from '../services/timecodeService';
import { FullScreenClapperboard } from './FullScreenClapperboard';

interface CinemaHeaderProps {
  metadata: CinemaMetadata;
  onChange: (metadata: CinemaMetadata) => void;
  isRecording: boolean;
}

export function CinemaHeader({ metadata, onChange, isRecording }: CinemaHeaderProps) {
  const [projects, setProjects] = useState<CinemaProject[]>([]);
  const [isLtcPlaying, setIsLtcPlaying] = useState(false);
  const [isFullScreenClapperboardOpen, setIsFullScreenClapperboardOpen] = useState(false);
  
  // Local state for new item inputs
  const [isCreatingProject, setIsCreatingProject] = useState(false);
  const [newProjectName, setNewProjectName] = useState('');
  
  const [isCreatingScene, setIsCreatingScene] = useState(false);
  const [newSceneName, setNewSceneName] = useState('');
  
  const [isCreatingShot, setIsCreatingShot] = useState(false);
  const [newShotName, setNewShotName] = useState('');

  useEffect(() => {
    getCinemaProjects().then(setProjects);
    return () => {
      timecodeGenerator.stop();
    };
  }, []);

  const handleToggleLtc = () => {
    const playing = timecodeGenerator.toggle();
    setIsLtcPlaying(playing);
  };

  const handleSaveProjects = async (newProjects: CinemaProject[]) => {
    setProjects(newProjects);
    await saveCinemaProjects(newProjects);
  };

  const handleChanges = (updates: Partial<CinemaMetadata>) => {
    onChange({ ...metadata, ...updates });
  };

  const handleChange = (field: keyof CinemaMetadata, value: any) => {
    onChange({ ...metadata, [field]: value });
  };

  const handleTakeIncrement = () => {
    const currentTake = parseInt(metadata.take || '0', 10);
    handleChange('take', (isNaN(currentTake) ? 1 : currentTake + 1).toString().padStart(2, '0'));
  };

  // --- Creation Handlers ---

  const handleCreateProject = async () => {
    if (!newProjectName.trim()) return;
    const newProject: CinemaProject = {
      id: `proj-${Date.now()}`,
      name: newProjectName.trim(),
      scenes: []
    };
    const updated = [...projects, newProject];
    await handleSaveProjects(updated);
    handleChanges({
      projectId: newProject.id,
      movieName: newProject.name,
      sceneId: undefined,
      scene: undefined,
      shotId: undefined,
      shot: undefined
    });
    setIsCreatingProject(false);
    setNewProjectName('');
  };

  const handleCreateScene = async () => {
    if (!newSceneName.trim() || !metadata.projectId) return;
    const newScene: CinemaScene = {
      id: `scene-${Date.now()}`,
      name: newSceneName.trim(),
      shots: []
    };
    const updated = projects.map(p => {
      if (p.id === metadata.projectId) {
        return { ...p, scenes: [...p.scenes, newScene] };
      }
      return p;
    });
    await handleSaveProjects(updated);
    handleChanges({
      sceneId: newScene.id,
      scene: newScene.name,
      shotId: undefined,
      shot: undefined
    });
    setIsCreatingScene(false);
    setNewSceneName('');
  };

  const handleCreateShot = async () => {
    if (!newShotName.trim() || !metadata.projectId || !metadata.sceneId) return;
    const newShot: CinemaShot = {
      id: `shot-${Date.now()}`,
      name: newShotName.trim()
    };
    const updated = projects.map(p => {
      if (p.id === metadata.projectId) {
        return {
          ...p,
          scenes: p.scenes.map(s => {
            if (s.id === metadata.sceneId) {
              return { ...s, shots: [...s.shots, newShot] };
            }
            return s;
          })
        };
      }
      return p;
    });
    await handleSaveProjects(updated);
    handleChanges({
      shotId: newShot.id,
      shot: newShot.name,
      take: '01'
    });
    setIsCreatingShot(false);
    setNewShotName('');
  };

  // --- Find active items ---
  const activeProject = projects.find(p => p.id === metadata.projectId);
  const activeScene = activeProject?.scenes.find(s => s.id === metadata.sceneId);
  const activeShot = activeScene?.shots.find(s => s.id === metadata.shotId);

  return (
    <div className="w-full max-w-4xl mx-auto bg-zinc-900/80 backdrop-blur-md border border-zinc-800 rounded-3xl p-6 mb-8 shadow-xl">
      <div className="flex items-center gap-3 mb-6 border-b border-zinc-800 pb-4">
        <Film className="text-emerald-500" size={24} />
        <h2 className="text-xl font-semibold text-white">Claquete Digital</h2>
        
        <div className="ml-auto flex items-center gap-3">
          <button
            onClick={() => setIsFullScreenClapperboardOpen(true)}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors bg-zinc-800 text-zinc-300 hover:bg-zinc-700 hover:text-white border border-zinc-700"
            title="Claquete em Tela Cheia"
          >
            <Maximize size={14} />
            Tela Cheia
          </button>
          <button
            onClick={handleToggleLtc}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors border ${isLtcPlaying ? 'bg-red-500/20 text-red-500 border-red-500/30' : 'bg-zinc-800 text-zinc-400 border-zinc-700 hover:bg-zinc-700 hover:text-white'}`}
            title="Emitir sinal de Timecode (LTC)"
          >
            <Radio size={14} className={isLtcPlaying ? 'animate-pulse' : ''} />
            {isLtcPlaying ? 'LTC Ativo' : 'Emitir LTC'}
          </button>
          <span className="text-xs text-zinc-500 bg-zinc-800 px-2 py-1 rounded-md">
            Organização em Pastas Ativada
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        {/* Projeto */}
        <div>
          <label className="block text-xs font-medium text-zinc-500 uppercase tracking-wider mb-1.5">Projeto / Filme</label>
          {isCreatingProject ? (
            <div className="flex gap-2">
              <input
                autoFocus
                type="text"
                value={newProjectName}
                onChange={(e) => setNewProjectName(e.target.value)}
                placeholder="Nome do Projeto"
                className="w-full bg-zinc-800/50 border border-zinc-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-emerald-500 text-sm"
                onKeyDown={(e) => e.key === 'Enter' && handleCreateProject()}
              />
              <button onClick={handleCreateProject} className="bg-emerald-500 text-zinc-900 px-3 rounded-xl text-sm font-medium hover:bg-emerald-400">OK</button>
              <button onClick={() => setIsCreatingProject(false)} className="bg-zinc-800 text-zinc-400 px-3 rounded-xl text-sm hover:text-white">X</button>
            </div>
          ) : (
            <div className="flex gap-2">
              <select
                value={metadata.projectId || ''}
                onChange={(e) => {
                  const p = projects.find(x => x.id === e.target.value);
                  handleChanges({
                    projectId: p?.id,
                    movieName: p?.name,
                    sceneId: undefined,
                    scene: undefined,
                    shotId: undefined,
                    shot: undefined
                  });
                }}
                disabled={isRecording}
                className="w-full bg-zinc-800/50 border border-zinc-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-emerald-500 text-sm appearance-none"
              >
                <option value="">Selecione...</option>
                {projects.map(p => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
              <button
                onClick={() => setIsCreatingProject(true)}
                disabled={isRecording}
                className="bg-zinc-800 text-zinc-300 px-3 rounded-xl hover:bg-zinc-700 disabled:opacity-50"
                title="Novo Projeto"
              >
                <Plus size={16} />
              </button>
            </div>
          )}
        </div>

        {/* Cena */}
        <div>
          <label className="block text-xs font-medium text-zinc-500 uppercase tracking-wider mb-1.5">Cena</label>
          {isCreatingScene ? (
            <div className="flex gap-2">
              <input
                autoFocus
                type="text"
                value={newSceneName}
                onChange={(e) => setNewSceneName(e.target.value)}
                placeholder="Nome da Cena"
                className="w-full bg-zinc-800/50 border border-zinc-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-emerald-500 text-sm"
                onKeyDown={(e) => e.key === 'Enter' && handleCreateScene()}
              />
              <button onClick={handleCreateScene} className="bg-emerald-500 text-zinc-900 px-3 rounded-xl text-sm font-medium hover:bg-emerald-400">OK</button>
              <button onClick={() => setIsCreatingScene(false)} className="bg-zinc-800 text-zinc-400 px-3 rounded-xl text-sm hover:text-white">X</button>
            </div>
          ) : (
            <div className="flex gap-2">
              <select
                value={metadata.sceneId || ''}
                onChange={(e) => {
                  const s = activeProject?.scenes.find(x => x.id === e.target.value);
                  handleChanges({
                    sceneId: s?.id,
                    scene: s?.name,
                    shotId: undefined,
                    shot: undefined
                  });
                }}
                disabled={isRecording || !metadata.projectId}
                className="w-full bg-zinc-800/50 border border-zinc-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-emerald-500 text-sm appearance-none disabled:opacity-50"
              >
                <option value="">Selecione...</option>
                {activeProject?.scenes.map(s => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
              <button
                onClick={() => setIsCreatingScene(true)}
                disabled={isRecording || !metadata.projectId}
                className="bg-zinc-800 text-zinc-300 px-3 rounded-xl hover:bg-zinc-700 disabled:opacity-50"
                title="Nova Cena"
              >
                <Plus size={16} />
              </button>
            </div>
          )}
        </div>

        {/* Plano */}
        <div>
          <label className="block text-xs font-medium text-zinc-500 uppercase tracking-wider mb-1.5">Plano</label>
          {isCreatingShot ? (
            <div className="flex gap-2">
              <input
                autoFocus
                type="text"
                value={newShotName}
                onChange={(e) => setNewShotName(e.target.value)}
                placeholder="Nome do Plano"
                className="w-full bg-zinc-800/50 border border-zinc-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-emerald-500 text-sm"
                onKeyDown={(e) => e.key === 'Enter' && handleCreateShot()}
              />
              <button onClick={handleCreateShot} className="bg-emerald-500 text-zinc-900 px-3 rounded-xl text-sm font-medium hover:bg-emerald-400">OK</button>
              <button onClick={() => setIsCreatingShot(false)} className="bg-zinc-800 text-zinc-400 px-3 rounded-xl text-sm hover:text-white">X</button>
            </div>
          ) : (
            <div className="flex gap-2">
              <select
                value={metadata.shotId || ''}
                onChange={(e) => {
                  const s = activeScene?.shots.find(x => x.id === e.target.value);
                  handleChanges({
                    shotId: s?.id,
                    shot: s?.name
                  });
                }}
                disabled={isRecording || !metadata.sceneId}
                className="w-full bg-zinc-800/50 border border-zinc-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-emerald-500 text-sm appearance-none disabled:opacity-50"
              >
                <option value="">Selecione...</option>
                {activeScene?.shots.map(s => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
              <button
                onClick={() => setIsCreatingShot(true)}
                disabled={isRecording || !metadata.sceneId}
                className="bg-zinc-800 text-zinc-300 px-3 rounded-xl hover:bg-zinc-700 disabled:opacity-50"
                title="Novo Plano"
              >
                <Plus size={16} />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Take & Camera Settings */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-6 border-t border-zinc-800/50">
        {/* Take */}
        <div>
          <label className="block text-xs font-medium text-zinc-500 uppercase tracking-wider mb-1.5">Take Atual</label>
          <div className="flex gap-2">
            <input
              type="text"
              value={metadata.take || ''}
              onChange={(e) => handleChange('take', e.target.value)}
              disabled={isRecording}
              placeholder="01"
              className="w-full bg-zinc-800/50 border border-zinc-700 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-emerald-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-mono text-xl text-center"
            />
            <button
              onClick={handleTakeIncrement}
              disabled={isRecording}
              className="px-6 py-2.5 bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 rounded-xl text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium text-lg"
              title="Próximo Take"
            >
              +1
            </button>
          </div>
        </div>

        {/* Câmera & Lente */}
        <div>
          <label className="block text-xs font-medium text-zinc-500 uppercase tracking-wider mb-1.5">Cam / Lente</label>
          <div className="flex gap-2">
            <input
              type="text"
              value={metadata.camera || ''}
              onChange={(e) => handleChange('camera', e.target.value.toUpperCase())}
              disabled={isRecording}
              placeholder="Cam A"
              maxLength={1}
              className="w-1/3 bg-zinc-800/50 border border-zinc-700 rounded-xl px-2 py-2.5 text-white focus:outline-none focus:border-emerald-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-center uppercase font-mono text-lg"
            />
            <input
              type="text"
              value={metadata.lens || ''}
              onChange={(e) => handleChange('lens', e.target.value)}
              disabled={isRecording}
              placeholder="50mm"
              className="w-2/3 bg-zinc-800/50 border border-zinc-700 rounded-xl px-3 py-2.5 text-white focus:outline-none focus:border-emerald-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-center font-mono text-lg"
            />
          </div>
        </div>
      </div>

      {isFullScreenClapperboardOpen && (
        <FullScreenClapperboard 
          metadata={metadata} 
          onClose={() => setIsFullScreenClapperboardOpen(false)} 
        />
      )}
    </div>
  );
}
