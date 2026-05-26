import React, { useState, useEffect, useRef } from 'react';
import { CinemaMetadata, CinemaProject, CinemaScene, CinemaShot } from '../types';
import { Film, Camera, Hash, AlignLeft, Plus, Folder, Radio, Maximize, Mic, MicOff, AlertCircle, ChevronDown, Trash2 } from 'lucide-react';
import { getCinemaProjects, saveCinemaProjects } from '../services/storageService';
import { timecodeGenerator } from '../services/timecodeService';
import { FullScreenClapperboard } from './FullScreenClapperboard';

interface CinemaAutocompleteInputProps {
  label?: string;
  value: string;
  onChange: (value: string) => void;
  options: string[];
  placeholder?: string;
  onSaveOption?: (value: string) => void;
  onDeleteOption?: (value: string) => void;
  disabled?: boolean;
  inputClassName?: string;
}

export function CinemaAutocompleteInput({
  label,
  value,
  onChange,
  options = [],
  placeholder,
  onSaveOption,
  onDeleteOption,
  disabled,
  inputClassName = "subtle-input w-full px-3.5 !py-2 text-white disabled:opacity-50 disabled:cursor-not-allowed !text-xs font-semibold"
}: CinemaAutocompleteInputProps) {
  const [isOpen, setIsOpen] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const filteredOptions = (options || []).filter(opt => 
    opt && opt.toLowerCase().includes((value || '').toLowerCase())
  );

  const showSaveOption = onSaveOption && value && value.trim() && !(options || []).some(opt => opt && opt.toLowerCase() === value.trim().toLowerCase());

  return (
    <div ref={wrapperRef} className="relative w-full text-left">
      {label && (
        <label className="block text-xs font-medium text-zinc-500 uppercase tracking-wider mb-1.5">
          {label}
        </label>
      )}
      <div className="relative flex items-center">
        <input
          type="text"
          value={value}
          onChange={(e) => {
            onChange(e.target.value);
            setIsOpen(true);
          }}
          onFocus={() => setIsOpen(true)}
          disabled={disabled}
          placeholder={placeholder}
          className={inputClassName}
        />
        <button
          type="button"
          onClick={() => !disabled && setIsOpen(!isOpen)}
          className="absolute right-3.5 text-zinc-500 hover:text-zinc-300 cursor-pointer animate-reveal"
          disabled={disabled}
        >
          <ChevronDown size={14} />
        </button>
      </div>

      {isOpen && (
        <div className="absolute left-0 right-0 mt-1.5 bg-zinc-950/95 backdrop-blur-md border border-white/[0.05] rounded-xl shadow-2xl p-1.5 z-50 max-h-60 overflow-y-auto subtle-scrollbar">
          {showSaveOption && (
            <button
              type="button"
              onClick={() => {
                onSaveOption(value.trim());
                setIsOpen(false);
              }}
              className="w-full text-left px-3 py-2 text-xs text-emerald-400 hover:bg-emerald-500/10 rounded-lg font-semibold flex items-center gap-1.5 cursor-pointer transition-colors"
            >
              <Plus size={11} /> Salvar "{value.trim()}" como opção
            </button>
          )}

          {filteredOptions.length === 0 && !showSaveOption && (
            <div className="px-3 py-2 text-xs text-zinc-600 italic">
              Nenhuma opção cadastrada
            </div>
          )}

          {filteredOptions.map((opt) => (
            <div
              key={opt}
              className="flex items-center justify-between px-3 py-1.5 hover:bg-white/[0.03] rounded-lg group text-xs text-zinc-200 transition-colors"
            >
              <button
                type="button"
                onClick={() => {
                  onChange(opt);
                  setIsOpen(false);
                }}
                className="flex-1 text-left py-0.5 text-zinc-300 hover:text-white cursor-pointer"
              >
                {opt}
              </button>
              {onDeleteOption && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onDeleteOption(opt);
                  }}
                  className="p-1 text-zinc-500 hover:text-red-400 rounded transition-colors cursor-pointer opacity-0 group-hover:opacity-100 focus:opacity-100"
                  title="Excluir opção"
                >
                  <Trash2 size={11} />
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

interface CinemaHeaderProps {
  metadata: CinemaMetadata;
  onChange: (metadata: CinemaMetadata) => void;
  isRecording: boolean;
}

export function CinemaHeader({ metadata, onChange, isRecording }: CinemaHeaderProps) {
  const [projects, setProjects] = useState<CinemaProject[]>([]);
  const [isLtcPlaying, setIsLtcPlaying] = useState(false);
  const [isFullScreenClapperboardOpen, setIsFullScreenClapperboardOpen] = useState(false);

  const [lenses, setLenses] = useState<string[]>(() => {
    const saved = localStorage.getItem('cinema-lenses');
    return saved ? JSON.parse(saved) : ['18mm', '24mm', '35mm', '50mm', '85mm', '100mm'];
  });
  const [directors, setDirectors] = useState<string[]>(() => {
    const saved = localStorage.getItem('cinema-directors');
    return saved ? JSON.parse(saved) : ['Fernando', 'Stanley Kubrick', 'Quentin Tarantino', 'Christopher Nolan'];
  });
  const [dops, setDops] = useState<string[]>(() => {
    const saved = localStorage.getItem('cinema-dops');
    return saved ? JSON.parse(saved) : ['Roger Deakins', 'Emmanuel Lubezki', 'Rodrigo Prieto'];
  });

  const [isListening, setIsListening] = useState(false);
  const [voiceError, setVoiceError] = useState<string | null>(null);
  const [lastSpeech, setLastSpeech] = useState<string>('');
  const [isProcessingVoice, setIsProcessingVoice] = useState(false);
  const recognitionRef = useRef<any>(null);

  const [activeAssistantTab, setActiveAssistantTab] = useState<'voice' | 'vision'>('voice');
  const [isScanningImage, setIsScanningImage] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Fallback testing dialog for visual verification in iframe / dev environments
  const [showSimulateInput, setShowSimulateInput] = useState(false);
  const [simulateValue, setSimulateValue] = useState('');

  const playAckBeep = (isSuccess: boolean) => {
    try {
      const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      
      osc.type = 'sine';
      osc.frequency.setValueAtTime(isSuccess ? 880 : 250, ctx.currentTime);
      gain.gain.setValueAtTime(0.12, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.15);
      
      osc.connect(gain);
      gain.connect(ctx.destination);
      
      osc.start();
      osc.stop(ctx.currentTime + 0.15);
    } catch (err) {
      console.warn("Autoplay audio blocked or error:", err);
    }
  };

  const processVoiceCommand = async (transcript: string) => {
    setIsProcessingVoice(true);
    setVoiceError(null);
    setLastSpeech(transcript);
    
    try {
      // 1. DUAL CHANNEL: Local Regex Parser (latency-free matching!)
      const cleaned = transcript.toLowerCase();
      
      // Matchers
      const sceneMatch = cleaned.match(/(?:cena|scene)\s*([a-z0-9]+)/i);
      const shotMatch = cleaned.match(/(?:plano|shot|quadro)\s*([a-z0-9]+)/i);
      const takeMatch = cleaned.match(/(?:take|têique|gravação|gravação número)\s*(\d+)/i);
      const isoMatch = cleaned.match(/(?:iso)\s*(\d+)/i);
      const fpsMatch = cleaned.match(/(?:fps|quadros|frame\s*rate)\s*(\d+)/i);
      const soundRollMatch = cleaned.match(/(?:sound\s*roll|rolo\s*de\s*som|som\s*rolo)\s*([a-z0-9]+)/i);
      const rollCardMatch = cleaned.match(/(?:roll|cartão|card\s*roll|rolo\s*da\s*câmera)\s*([a-z0-9]+)/i);
      const lensMatch = cleaned.match(/(?:lente|lens|objetiva|objetivas)\s*([\d-]+mm|[\d.-]+)/i);
      const cameraMatch = cleaned.match(/(?:câmera|camera|cam)\s*([abcde])/i);
      const apertureMatch = cleaned.match(/(?:abertura|aperture|f-stop|t-stop|f\/|t\/)\s*([\d.]+)/i);
      const shutterMatch = cleaned.match(/(?:obturador|shutter|obtura)\s*([\w/]+)/i);
      
      let localUpdates: Partial<CinemaMetadata> = {};
      let matchedRegex = false;
      
      if (sceneMatch) {
        let extractedScene = sceneMatch[1].toUpperCase();
        if (extractedScene === "UM" || extractedScene === "ONE") extractedScene = "1";
        if (extractedScene === "DOIS" || extractedScene === "TWO") extractedScene = "2";
        if (extractedScene === "TRÊS" || extractedScene === "THREE") extractedScene = "3";
        if (extractedScene === "QUATRO" || extractedScene === "FOUR") extractedScene = "4";
        if (extractedScene === "CINCO" || extractedScene === "FIVE") extractedScene = "5";
        localUpdates.scene = extractedScene;
        matchedRegex = true;
      }
      
      if (shotMatch) {
        let extractedShot = shotMatch[1].toUpperCase();
        if (extractedShot === "UM" || extractedShot === "ONE") extractedShot = "1";
        if (extractedShot === "DOIS" || extractedShot === "TWO") extractedShot = "2";
        if (extractedShot === "TRÊS" || extractedShot === "THREE") extractedShot = "3";
        if (extractedShot === "QUATRO" || extractedShot === "FOUR") extractedShot = "4";
        if (extractedShot === "CINCO" || extractedShot === "FIVE") extractedShot = "5";
        localUpdates.shot = extractedShot;
        matchedRegex = true;
      }
      
      if (takeMatch) {
        const extractedTake = parseInt(takeMatch[1], 10);
        if (!isNaN(extractedTake)) {
          localUpdates.take = extractedTake.toString().padStart(2, '0');
          matchedRegex = true;
        }
      }

      if (isoMatch) {
        localUpdates.iso = isoMatch[1];
        matchedRegex = true;
      }

      if (fpsMatch) {
        localUpdates.fps = fpsMatch[1] + "fps";
        matchedRegex = true;
      }

      if (soundRollMatch) {
        localUpdates.soundRoll = soundRollMatch[1].toUpperCase();
        matchedRegex = true;
      }

      if (rollCardMatch) {
        localUpdates.rollCard = rollCardMatch[1].toUpperCase();
        matchedRegex = true;
      }

      if (lensMatch) {
        let l = lensMatch[1];
        if (!l.endsWith('mm') && !isNaN(Number(l))) l = l + 'mm';
        localUpdates.lens = l;
        matchedRegex = true;
      }

      if (cameraMatch) {
        localUpdates.camera = cameraMatch[1].toUpperCase();
        matchedRegex = true;
      }

      if (apertureMatch) {
        localUpdates.aperture = 'f/' + apertureMatch[1];
        matchedRegex = true;
      }

      if (shutterMatch) {
        localUpdates.shutter = shutterMatch[1];
        matchedRegex = true;
      }
      
      if (matchedRegex) {
        playAckBeep(true);
        onChange({ ...metadata, ...localUpdates });
        setIsProcessingVoice(false);
        return;
      }

      // 2. FALLBACK/SMART AI: Call Server-Side Gemini endpoint
      const response = await fetch("/api/parse-clapperboard-command", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: transcript })
      });
      
      if (response.ok) {
        const data = await response.json();
        const updates: Partial<CinemaMetadata> = {};
        let adjusted = false;
        
        if (data.scene !== undefined) { updates.scene = data.scene.toString().toUpperCase(); adjusted = true; }
        if (data.shot !== undefined) { updates.shot = data.shot.toString().toUpperCase(); adjusted = true; }
        if (data.take !== undefined) { updates.take = data.take.toString().padStart(2, '0'); adjusted = true; }
        if (data.camera !== undefined) { updates.camera = data.camera.toString().toUpperCase(); adjusted = true; }
        if (data.rollCard !== undefined) { updates.rollCard = data.rollCard.toString().toUpperCase(); adjusted = true; }
        if (data.lens !== undefined) { updates.lens = data.lens.toString(); adjusted = true; }
        if (data.soundRoll !== undefined) { updates.soundRoll = data.soundRoll.toString().toUpperCase(); adjusted = true; }
        if (data.fps !== undefined) { updates.fps = data.fps.toString(); adjusted = true; }
        if (data.aperture !== undefined) { updates.aperture = data.aperture.toString(); adjusted = true; }
        if (data.shutter !== undefined) { updates.shutter = data.shutter.toString(); adjusted = true; }
        if (data.iso !== undefined) { updates.iso = data.iso.toString(); adjusted = true; }
        
        if (adjusted) {
          playAckBeep(true);
          onChange({ ...metadata, ...updates });
        } else {
          playAckBeep(false);
          setVoiceError("Nenhum dado de claquete identificado. Ex: 'Cena 4, Plano B, Take 2, ISO 800'");
        }
      } else {
        const errText = await response.text();
        console.error("Erro na API da claquete de voz:", errText);
        playAckBeep(false);
        setVoiceError("Erro ao processar áudio com IA.");
      }
    } catch (err: any) {
      console.error(err);
      playAckBeep(false);
      setVoiceError("Falta de resposta ou erro de rede.");
    } finally {
      setIsProcessingVoice(false);
    }
  };

  const startListening = () => {
    setVoiceError(null);
    const SpeechRecObj = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecObj) {
      setVoiceError("Reconhecimento de voz não suportado neste navegador.");
      return;
    }

    try {
      const recognition = new SpeechRecObj();
      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.lang = 'pt-BR'; // default to Brazilian Portuguese

      recognition.onstart = () => {
        setIsListening(true);
      };

      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        processVoiceCommand(transcript);
      };

      recognition.onerror = (event: any) => {
        console.error("Speech recognition error:", event.error);
        if (event.error === 'not-allowed') {
          setVoiceError("Permissão de gravação negada. Use a simulação abaixo.");
          setShowSimulateInput(true);
        } else {
          setVoiceError(`Erro de voz: ${event.error}`);
        }
        setIsListening(false);
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current = recognition;
      recognition.start();
    } catch (err: any) {
      console.error("Failed to start SpeechRecognition:", err);
      setVoiceError("Falha ao iniciar escuta.");
      setIsListening(false);
    }
  };

  const stopListening = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }
    setIsListening(false);
  };

  const toggleListening = () => {
    if (isListening) {
      stopListening();
    } else {
      startListening();
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsScanningImage(true);
    setVoiceError(null);
    setLastSpeech(`Carregando imagem: ${file.name}`);

    try {
      const reader = new FileReader();
      reader.onloadend = async () => {
        const base64String = reader.result as string;
        try {
          const response = await fetch("/api/parse-clapperboard-image", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              image: base64String,
              mimeType: file.type
            })
          });

          if (response.ok) {
            const data = await response.json();
            const updates: Partial<CinemaMetadata> = {};
            let adjusted = false;

            if (data.scene !== undefined) { updates.scene = data.scene.toString().toUpperCase(); adjusted = true; }
            if (data.shot !== undefined) { updates.shot = data.shot.toString().toUpperCase(); adjusted = true; }
            if (data.take !== undefined) { updates.take = data.take.toString().padStart(2, '0'); adjusted = true; }
            if (data.camera !== undefined) { updates.camera = data.camera.toString().toUpperCase(); adjusted = true; }
            if (data.rollCard !== undefined) { updates.rollCard = data.rollCard.toString().toUpperCase(); adjusted = true; }
            if (data.lens !== undefined) { updates.lens = data.lens.toString(); adjusted = true; }
            if (data.soundRoll !== undefined) { updates.soundRoll = data.soundRoll.toString().toUpperCase(); adjusted = true; }
            if (data.fps !== undefined) { updates.fps = data.fps.toString(); adjusted = true; }
            if (data.aperture !== undefined) { updates.aperture = data.aperture.toString(); adjusted = true; }
            if (data.shutter !== undefined) { updates.shutter = data.shutter.toString(); adjusted = true; }
            if (data.iso !== undefined) { updates.iso = data.iso.toString(); adjusted = true; }
            
            // Check if movie name has projects to map into
            if (data.movieName !== undefined) {
              const matchedProj = projects.find(p => p.name.toLowerCase().includes(data.movieName.toString().toLowerCase()));
              if (matchedProj) {
                updates.projectId = matchedProj.id;
                updates.movieName = matchedProj.name;
              } else {
                updates.movieName = data.movieName.toString();
              }
              adjusted = true;
            }

            if (adjusted) {
              playAckBeep(true);
              onChange({ ...metadata, ...updates });
              setLastSpeech(`Painel lido! Dados sincronizados.`);
            } else {
              playAckBeep(false);
              setVoiceError("Gemini leu a imagem, mas não encontrou marcas de câmera/áudio reconhecidas.");
            }
          } else {
            const errVal = await response.text();
            console.error(errVal);
            playAckBeep(false);
            setVoiceError("O servidor não pôde concluir o processamento visual da imagem.");
          }
        } catch (err: any) {
          console.error(err);
          playAckBeep(false);
          setVoiceError("Falha de rede ao conectar com OCR de IA.");
        } finally {
          setIsScanningImage(false);
        }
      };
      reader.readAsDataURL(file);
    } catch (err) {
      console.error(err);
      setVoiceError("Erro ao carregar o arquivo.");
      setIsScanningImage(false);
    }
  };

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

  // --- Handlers for Autocomplete Saving ---
  const handleSaveProjectOption = async (val: string) => {
    const trimmed = val.trim();
    if (!trimmed) return;
    const matched = projects.find(p => p.name.toLowerCase() === trimmed.toLowerCase());
    if (matched) return;
    const newProject: CinemaProject = {
      id: `proj-${Date.now()}`,
      name: trimmed,
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
  };

  const handleDeleteProjectOption = async (val: string) => {
    const updated = projects.filter(p => p.name !== val);
    await handleSaveProjects(updated);
    if (metadata.movieName === val) {
      handleChanges({
        projectId: undefined,
        movieName: '',
        sceneId: undefined,
        scene: undefined,
        shotId: undefined,
        shot: undefined
      });
    }
  };

  const handleSaveSceneOption = async (val: string) => {
    const trimmed = val.trim();
    if (!trimmed) return;
    let projId = metadata.projectId;
    let currentProjects = [...projects];

    if (!projId) {
      // Auto-create a project if editing scene without a project
      const projName = (metadata.movieName || 'PROJETO SEQUÊNCIA').trim();
      const newProj: CinemaProject = {
        id: `proj-${Date.now()}`,
        name: projName,
        scenes: []
      };
      projId = newProj.id;
      currentProjects.push(newProj);
      handleChanges({
        projectId: projId,
        movieName: projName
      });
    }

    const matchedScene = currentProjects.find(p => p.id === projId)?.scenes.some(s => s.name.toLowerCase() === trimmed.toLowerCase());
    if (matchedScene) return;

    const newScene: CinemaScene = {
      id: `scene-${Date.now()}`,
      name: trimmed,
      shots: []
    };

    const updated = currentProjects.map(p => {
      if (p.id === projId) {
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
  };

  const handleDeleteSceneOption = async (val: string) => {
    if (!metadata.projectId) return;
    const updated = projects.map(p => {
      if (p.id === metadata.projectId) {
        return {
          ...p,
          scenes: p.scenes.filter(s => s.name !== val)
        };
      }
      return p;
    });
    await handleSaveProjects(updated);
    if (metadata.scene === val) {
      handleChanges({
        sceneId: undefined,
        scene: '',
        shotId: undefined,
        shot: undefined
      });
    }
  };

  const handleSaveShotOption = async (val: string) => {
    const trimmed = val.trim();
    if (!trimmed) return;
    let projId = metadata.projectId;
    let sceneId = metadata.sceneId;
    let currentProjects = [...projects];

    if (!projId) {
      const projName = (metadata.movieName || 'PROJETO SEQUÊNCIA').trim();
      const newProj: CinemaProject = {
        id: `proj-${Date.now()}`,
        name: projName,
        scenes: []
      };
      projId = newProj.id;
      currentProjects.push(newProj);
      handleChanges({ projectId: projId, movieName: projName });
    }

    if (!sceneId) {
      const sceneName = (metadata.scene || 'CENA 1').trim();
      const newScene: CinemaScene = {
        id: `scene-${Date.now()}`,
        name: sceneName,
        shots: []
      };
      sceneId = newScene.id;
      currentProjects = currentProjects.map(p => {
        if (p.id === projId) {
          return { ...p, scenes: [...p.scenes, newScene] };
        }
        return p;
      });
      handleChanges({ sceneId: sceneId, scene: sceneName });
    }

    const matchedShot = currentProjects.find(p => p.id === projId)?.scenes.find(s => s.id === sceneId)?.shots.some(sh => sh.name.toLowerCase() === trimmed.toLowerCase());
    if (matchedShot) return;

    const newShot: CinemaShot = {
      id: `shot-${Date.now()}`,
      name: trimmed
    };

    const updated = currentProjects.map(p => {
      if (p.id === projId) {
        return {
          ...p,
          scenes: p.scenes.map(s => {
            if (s.id === sceneId) {
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
  };

  const handleDeleteShotOption = async (val: string) => {
    if (!metadata.projectId || !metadata.sceneId) return;
    const updated = projects.map(p => {
      if (p.id === metadata.projectId) {
        return {
          ...p,
          scenes: p.scenes.map(s => {
            if (s.id === metadata.sceneId) {
              return {
                ...s,
                shots: s.shots.filter(sh => sh.name !== val)
              };
            }
            return s;
          })
        };
      }
      return p;
    });
    await handleSaveProjects(updated);
    if (metadata.shot === val) {
      handleChanges({
        shotId: undefined,
        shot: ''
      });
    }
  };

  const handleSaveLens = (val: string) => {
    const trimmed = val.trim();
    if (!trimmed) return;
    if (!lenses.includes(trimmed)) {
      const next = [...lenses, trimmed];
      setLenses(next);
      localStorage.setItem('cinema-lenses', JSON.stringify(next));
    }
    handleChange('lens', trimmed);
  };

  const handleDeleteLens = (val: string) => {
    const next = lenses.filter(l => l !== val);
    setLenses(next);
    localStorage.setItem('cinema-lenses', JSON.stringify(next));
    if (metadata.lens === val) {
      handleChange('lens', '');
    }
  };

  const handleSaveDirector = (val: string) => {
    const trimmed = val.trim();
    if (!trimmed) return;
    if (!directors.includes(trimmed)) {
      const next = [...directors, trimmed];
      setDirectors(next);
      localStorage.setItem('cinema-directors', JSON.stringify(next));
    }
    handleChange('director', trimmed);
  };

  const handleDeleteDirector = (val: string) => {
    const next = directors.filter(d => d !== val);
    setDirectors(next);
    localStorage.setItem('cinema-directors', JSON.stringify(next));
    if (metadata.director === val) {
      handleChange('director', '');
    }
  };

  const handleSaveDop = (val: string) => {
    const trimmed = val.trim();
    if (!trimmed) return;
    if (!dops.includes(trimmed)) {
      const next = [...dops, trimmed];
      setDops(next);
      localStorage.setItem('cinema-dops', JSON.stringify(next));
    }
    handleChange('dop', trimmed);
  };

  const handleDeleteDop = (val: string) => {
    const next = dops.filter(d => d !== val);
    setDops(next);
    localStorage.setItem('cinema-dops', JSON.stringify(next));
    if (metadata.dop === val) {
      handleChange('dop', '');
    }
  };

  // --- Find active items ---
  const activeProject = projects.find(p => p.id === metadata.projectId);
  const activeScene = activeProject?.scenes.find(s => s.id === metadata.sceneId);
  const activeShot = activeScene?.shots.find(s => s.id === metadata.shotId);

  return (
    <div className="w-full subtle-card !p-3 shadow-none border-b-0">
      <div className="flex items-center gap-2.5 mb-3 border-b border-white/[0.05] pb-2">
        <Film className="text-emerald-500" size={20} />
        <h2 className="text-base font-bold text-white">Claquete Digital</h2>
        
        <div className="ml-auto flex items-center gap-2">
          <button
            onClick={() => setIsFullScreenClapperboardOpen(true)}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-colors bg-white/[0.02] border border-white/[0.04] text-zinc-300 hover:bg-white/[0.06] hover:text-white"
            title="Claquete em Tela Cheia"
          >
            <Maximize size={12} />
            Tela Cheia
          </button>
          <button
            onClick={handleToggleLtc}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-colors border ${isLtcPlaying ? 'bg-red-500/10 text-red-500 border-red-500/20' : 'bg-white/[0.02] border-white/[0.04] text-zinc-400 hover:bg-white/[0.06] hover:text-white'}`}
            title="Emitir sinal de Timecode (LTC)"
          >
            <Radio size={12} className={isLtcPlaying ? 'animate-pulse' : ''} />
            {isLtcPlaying ? 'LTC Ativo' : 'Emitir LTC'}
          </button>
        </div>
      </div>

      {/* Smart Set Sync: Voice & Visual OCR Gear Scanner */}
      <div className="mb-3 p-3 bg-zinc-950/25 rounded-xl border border-white/[0.03] flex flex-col gap-3">
        {/* Header Tabs */}
        <div className="flex border-b border-white/[0.02] pb-3 gap-6">
          <button 
            type="button"
            onClick={() => setActiveAssistantTab('voice')}
            className={`text-xs font-bold uppercase tracking-wider transition-all pb-1.5 cursor-pointer border-b-2 flex items-center gap-1.5 ${
              activeAssistantTab === 'voice' ? 'border-emerald-500 text-emerald-400' : 'border-transparent text-zinc-500 hover:text-zinc-300'
            }`}
          >
            🎙️ Comando de Voz
          </button>
          <button 
            type="button"
            onClick={() => setActiveAssistantTab('vision')}
            className={`text-xs font-bold uppercase tracking-wider transition-all pb-1.5 cursor-pointer border-b-2 flex items-center gap-1.5 ${
              activeAssistantTab === 'vision' ? 'border-emerald-500 text-emerald-400' : 'border-transparent text-zinc-500 hover:text-zinc-300'
            }`}
          >
            📸 Scanner de Tela / Painel / Print
          </button>
        </div>

        {activeAssistantTab === 'voice' ? (
          <div className="flex flex-col gap-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <div className={`p-1.5 rounded-lg shrink-0 ${isListening ? 'bg-red-500/10 text-red-500 animate-pulse' : 'bg-emerald-500/10 text-emerald-400'}`}>
                  <Mic size={16} />
                </div>
                <div>
                  <h3 className="text-xs font-semibold text-white tracking-wide uppercase">Comando de Voz da Claquete</h3>
                  <p className="text-[10px] text-zinc-500">Diga "Cena [X], Plano [Y], Take [Z], ISO 850, FPS 24, Lente 35mm" para atualizar automaticamente.</p>
                </div>
              </div>
              
              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => setShowSimulateInput(!showSimulateInput)}
                  className="px-2.5 py-1.5 text-[10px] font-bold text-zinc-400 hover:text-white bg-zinc-800/60 rounded-lg transition-all uppercase border border-zinc-700/40 cursor-pointer"
                >
                  Simular Comando
                </button>
                <button
                  type="button"
                  onClick={toggleListening}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                    isListening 
                    ? 'bg-red-600 text-white shadow-lg shadow-red-600/20' 
                    : 'bg-emerald-500 hover:bg-emerald-400 text-zinc-950 shadow-lg shadow-emerald-500/10'
                  }`}
                >
                  {isListening ? (
                    <>
                      <span className="w-1.5 h-1.5 rounded-full bg-white animate-ping mr-0.5" />
                      Ouvindo...
                    </>
                  ) : (
                    <>
                      <Mic size={13} />
                      Ativar Voz
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Live Audio Waves and Status Indicators */}
            {(isListening || isProcessingVoice || lastSpeech || voiceError) && (
              <div className="text-xs p-3 bg-zinc-900/40 rounded-xl border border-zinc-800/30">
                {isListening && (
                  <div className="flex items-center gap-2 text-[11px] text-zinc-400">
                    <div className="flex items-center gap-0.5 h-3 shrink-0">
                      <span className="w-0.5 bg-red-400 h-1 animate-[ping_0.6s_infinite_alternate]" />
                      <span className="w-0.5 bg-red-400 h-2 animate-[ping_0.5s_infinite_alternate_0.1s]" />
                      <span className="w-0.5 bg-red-400 h-3 animate-[ping_0.7s_infinite_alternate_0.2s]" />
                    </div>
                    <span>Fale no microfone do set (ex: <i>"Cena 15, Plano C, Take 3, ISO oitocentos"</i>)</span>
                  </div>
                )}
                
                {isProcessingVoice && (
                  <div className="text-[11px] text-emerald-400 flex items-center gap-1.5 animate-pulse">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />
                    <span>Analisando áudio com IA do CapIAudio...</span>
                  </div>
                )}

                {!isProcessingVoice && lastSpeech && (
                  <div className="text-[11px] text-zinc-300 mt-1">
                    <span className="text-zinc-500 font-bold uppercase mr-1">Escutado:</span> 
                    <span className="italic">"{lastSpeech}"</span>
                  </div>
                )}

                {voiceError && (
                  <div className="text-[10px] text-red-400 mt-1.5 flex items-center gap-1 bg-red-500/5 px-2 py-1 rounded-md border border-red-500/10">
                    <AlertCircle size={10} />
                    <span>{voiceError}</span>
                  </div>
                )}
              </div>
            )}

            {/* Manual Simulation Option (critical fallback for iframe blocks) */}
            {showSimulateInput && (
              <div className="flex gap-2 p-2.5 bg-zinc-900/60 rounded-xl border border-zinc-800">
                <input
                  type="text"
                  value={simulateValue}
                  onChange={(e) => setSimulateValue(e.target.value)}
                  placeholder="Digite o comando falado (ex: Cena 12, Plano B, Take 3, ISO 800)"
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-2.5 py-1 text-xs text-white placeholder-zinc-600 focus:outline-none focus:border-emerald-500"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      processVoiceCommand(simulateValue);
                      setSimulateValue('');
                    }
                  }}
                />
                <button
                  type="button"
                  onClick={() => {
                    processVoiceCommand(simulateValue);
                    setSimulateValue('');
                  }}
                  className="bg-emerald-500 text-zinc-950 px-3 py-1 rounded-lg text-xs font-bold hover:bg-emerald-400 shrink-0 transition-all font-mono cursor-pointer"
                >
                  Parse IA
                </button>
              </div>
            )}
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
              <div>
                <h3 className="text-xs font-semibold text-white uppercase tracking-wider">Scanner de Equipamento Inteligente</h3>
                <p className="text-[10px] text-zinc-500 mt-0.5">Tire uma foto do monitor, câmera, gravador de som ou envie um print para atualizar a claquete instantaneamente via IA (FPS, ISO, Lente, Abertura, Shutter e Cartões).</p>
              </div>

              <div className="shrink-0">
                <input 
                  type="file" 
                  accept="image/*" 
                  capture="environment"
                  ref={fileInputRef}
                  onChange={handleImageUpload}
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isScanningImage}
                  className="px-4 py-2 bg-emerald-500 hover:bg-emerald-400 disabled:bg-zinc-800 text-zinc-950 disabled:text-zinc-500 rounded-xl text-xs font-bold shadow-lg shadow-emerald-500/10 cursor-pointer transition-all flex items-center gap-1.5"
                >
                  {isScanningImage ? (
                    <>
                      <span className="w-1.5 h-1.5 rounded-full bg-zinc-500 animate-ping mr-1" />
                      Analisando Visor...
                    </>
                  ) : (
                    <>
                      📸 Capturar ou Enviar Foto
                    </>
                  )}
                </button>
              </div>
            </div>

            {(isScanningImage || lastSpeech || voiceError) && (
              <div className="text-xs p-3 bg-zinc-900/40 rounded-xl border border-zinc-800/30">
                {isScanningImage && (
                  <div className="text-[11px] text-emerald-400 flex items-center gap-1.5 animate-pulse">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />
                    <span>Lendo visor com inteligência multimodal do Gemini 3.5...</span>
                  </div>
                )}
                {!isScanningImage && lastSpeech && (
                  <div className="text-[11px] text-zinc-300 mt-1">
                    <span className="text-zinc-500 font-bold uppercase mr-1">Status Scanner:</span> 
                    <span className="font-medium text-emerald-400">{lastSpeech}</span>
                  </div>
                )}
                {voiceError && (
                  <div className="text-[10px] text-red-400 mt-1.5 flex items-center gap-1 bg-red-500/5 px-2 py-1 rounded-md border border-red-500/10">
                    <AlertCircle size={10} />
                    <span>{voiceError}</span>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-3">
        {/* Projeto */}
        <div>
          <CinemaAutocompleteInput
            label="Projeto / Filme"
            value={metadata.movieName || ''}
            onChange={(val) => {
              const matched = projects.find(p => p.name.toLowerCase() === val.trim().toLowerCase());
              handleChanges({
                movieName: val,
                projectId: matched?.id,
                sceneId: undefined,
                scene: undefined,
                shotId: undefined,
                shot: undefined
              });
            }}
            options={projects.map(p => p.name)}
            placeholder="Nome ou selecione..."
            onSaveOption={handleSaveProjectOption}
            onDeleteOption={handleDeleteProjectOption}
            disabled={isRecording}
          />
        </div>

        {/* Cena */}
        <div>
          <CinemaAutocompleteInput
            label="Cena"
            value={metadata.scene || ''}
            onChange={(val) => {
              const matched = activeProject?.scenes.find(s => s.name.toLowerCase() === val.trim().toLowerCase());
              handleChanges({
                scene: val,
                sceneId: matched?.id,
                shotId: undefined,
                shot: undefined
              });
            }}
            options={activeProject ? activeProject.scenes.map(s => s.name) : []}
            placeholder="Escreva ou selecione..."
            onSaveOption={handleSaveSceneOption}
            onDeleteOption={handleDeleteSceneOption}
            disabled={isRecording}
          />
        </div>

        {/* Plano */}
        <div>
          <CinemaAutocompleteInput
            label="Plano"
            value={metadata.shot || ''}
            onChange={(val) => {
              const matched = activeScene?.shots.find(sh => sh.name.toLowerCase() === val.trim().toLowerCase());
              handleChanges({
                shot: val,
                shotId: matched?.id
              });
            }}
            options={activeScene ? activeScene.shots.map(sh => sh.name) : []}
            placeholder="Escreva ou selecione..."
            onSaveOption={handleSaveShotOption}
            onDeleteOption={handleDeleteShotOption}
            disabled={isRecording}
          />
        </div>
      </div>

      {/* Take & Camera Settings */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-3 border-t border-white/[0.05]">
        {/* Take */}
        <div>
          <label className="block text-[10px] font-bold text-zinc-500 uppercase tracking-wider mb-1">Take Atual</label>
          <div className="flex gap-2">
            <input
              type="text"
              value={metadata.take || ''}
              onChange={(e) => handleChange('take', e.target.value)}
              disabled={isRecording}
              placeholder="01"
              className="subtle-input w-full px-3 !py-1 text-white disabled:opacity-50 disabled:cursor-not-allowed font-mono text-base text-center font-bold h-8.5"
            />
            <button
              onClick={handleTakeIncrement}
              disabled={isRecording}
              className="subtle-button px-4 !py-1 bg-emerald-500/10 border border-emerald-500/20 hover:bg-emerald-500/20 text-emerald-400 disabled:opacity-50 disabled:cursor-not-allowed font-bold text-sm hover:scale-[1.02] active:scale-[0.98] h-8.5"
              title="Próximo Take"
            >
              +1
            </button>
          </div>
        </div>

        {/* Câmera & Lente */}
        <div>
          <label className="block text-[10px] font-bold text-zinc-500 uppercase tracking-wider mb-1">Cam / Lente</label>
          <div className="flex gap-2 items-center">
            <input
              type="text"
              value={metadata.camera || ''}
              onChange={(e) => handleChange('camera', e.target.value.toUpperCase())}
              disabled={isRecording}
              placeholder="Cam A"
              maxLength={1}
              className="subtle-input w-1/3 px-2 !py-1 text-white disabled:opacity-50 disabled:cursor-not-allowed text-center uppercase font-mono text-sm font-bold h-8.5"
            />
            <div className="w-2/3">
              <CinemaAutocompleteInput
                value={metadata.lens || ''}
                onChange={(val) => handleChange('lens', val)}
                options={lenses}
                placeholder="50mm"
                onSaveOption={handleSaveLens}
                onDeleteOption={handleDeleteLens}
                disabled={isRecording}
                inputClassName="subtle-input w-full px-3 !py-1.5 text-white disabled:opacity-50 disabled:cursor-not-allowed text-center font-mono text-sm font-bold h-8.5"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Equipe */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-3 border-t border-zinc-800/50">
        <div>
          <CinemaAutocompleteInput
            label="Diretor(a)"
            value={metadata.director || ''}
            onChange={(val) => handleChange('director', val)}
            options={directors}
            placeholder="Nome do Diretor"
            onSaveOption={handleSaveDirector}
            onDeleteOption={handleDeleteDirector}
            disabled={isRecording}
          />
        </div>
        <div>
          <CinemaAutocompleteInput
            label="Diretor(a) de Fotografia"
            value={metadata.dop || ''}
            onChange={(val) => handleChange('dop', val)}
            options={dops}
            placeholder="Nome do Dir. Fotografia"
            onSaveOption={handleSaveDop}
            onDeleteOption={handleDeleteDop}
            disabled={isRecording}
          />
        </div>
      </div>

      {/* Dados Estendidos de Mídia e Câmera */}
      <div className="grid grid-cols-2 lg:grid-cols-6 gap-2 pt-2.5 mt-1 border-t border-white/[0.05]">
        <div>
          <label className="block text-[9px] font-bold text-zinc-500 uppercase tracking-wider mb-0.5 text-center">Cartão (Roll)</label>
          <input
            type="text"
            value={metadata.rollCard || ''}
            onChange={(e) => handleChange('rollCard', e.target.value.toUpperCase())}
            disabled={isRecording}
            placeholder="A001"
            className="subtle-input w-full px-2 !py-1 text-white placeholder-zinc-700 text-[11px] font-mono text-center h-7 focus:border-emerald-500"
          />
        </div>
        <div>
          <label className="block text-[9px] font-bold text-zinc-500 uppercase tracking-wider mb-0.5 text-center">Som (Sound)</label>
          <input
            type="text"
            value={metadata.soundRoll || ''}
            onChange={(e) => handleChange('soundRoll', e.target.value.toUpperCase())}
            disabled={isRecording}
            placeholder="S001"
            className="subtle-input w-full px-2 !py-1 text-white placeholder-zinc-700 text-[11px] font-mono text-center h-7 focus:border-emerald-500"
          />
        </div>
        <div>
          <label className="block text-[9px] font-bold text-zinc-500 uppercase tracking-wider mb-0.5 text-center">Taxa (FPS)</label>
          <input
            type="text"
            value={metadata.fps || ''}
            onChange={(e) => handleChange('fps', e.target.value)}
            disabled={isRecording}
            placeholder="24fps"
            className="subtle-input w-full px-2 !py-1 text-white placeholder-zinc-700 text-[11px] font-mono text-center h-7 focus:border-emerald-500"
          />
        </div>
        <div>
          <label className="block text-[9px] font-bold text-zinc-500 uppercase tracking-wider mb-0.5 text-center">Abertura</label>
          <input
            type="text"
            value={metadata.aperture || ''}
            onChange={(e) => handleChange('aperture', e.target.value)}
            disabled={isRecording}
            placeholder="f/2.8"
            className="subtle-input w-full px-2 !py-1 text-white placeholder-zinc-700 text-[11px] font-mono text-center h-7 focus:border-emerald-500"
          />
        </div>
        <div>
          <label className="block text-[9px] font-bold text-zinc-500 uppercase tracking-wider mb-0.5 text-center">Obturador</label>
          <input
            type="text"
            value={metadata.shutter || ''}
            onChange={(e) => handleChange('shutter', e.target.value)}
            disabled={isRecording}
            placeholder="1/50"
            className="subtle-input w-full px-2 !py-1 text-white placeholder-zinc-700 text-[11px] font-mono text-center h-7 focus:border-emerald-500"
          />
        </div>
        <div>
          <label className="block text-[9px] font-bold text-zinc-500 uppercase tracking-wider mb-0.5 text-center">Sensib. (ISO)</label>
          <input
            type="text"
            value={metadata.iso || ''}
            onChange={(e) => handleChange('iso', e.target.value)}
            disabled={isRecording}
            placeholder="800"
            className="subtle-input w-full px-2 !py-1 text-white placeholder-zinc-700 text-[11px] font-mono text-center h-7 focus:border-emerald-500"
          />
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
