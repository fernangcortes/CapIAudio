import React, { useState } from 'react';
import { motion } from 'motion/react';
import { CustomButton, MarkerType } from '../types';
import { Plus, User, MapPin, Image as ImageIcon, Maximize2, Minimize2 } from 'lucide-react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  rectSortingStrategy,
  useSortable
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

interface MarkerGridProps {
  buttons: CustomButton[];
  setButtons?: (buttons: CustomButton[]) => void;
  onMark: (button: CustomButton, data?: any) => void;
  onAddCustomButton: (icon: string, label: string, type?: MarkerType) => void;
  currentTime: number;
  speakers?: {id: string, name: string}[];
  onAddSpeaker?: (name: string) => void;
}

interface SortableButtonProps {
  key?: string;
  btn: CustomButton;
  onMark: any;
  onResize: any;
}

function SortableButton({ btn, onMark, onResize }: SortableButtonProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
  } = useSortable({ id: btn.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  // Determine colors based on the button's color property
  let colorClasses = "bg-zinc-800 border-zinc-700 hover:border-emerald-500/50 hover:bg-zinc-700/50";
  if (btn.color === 'Red') {
    colorClasses = "bg-red-900/30 border-red-800/50 hover:border-red-500/50 hover:bg-red-800/40 text-red-100";
  } else if (btn.color === 'Green') {
    colorClasses = "bg-emerald-900/30 border-emerald-800/50 hover:border-emerald-500/50 hover:bg-emerald-800/40 text-emerald-100";
  } else if (btn.color === 'Orange') {
    colorClasses = "bg-orange-900/30 border-orange-800/50 hover:border-orange-500/50 hover:bg-orange-800/40 text-orange-100";
  } else if (btn.color === 'Cyan') {
    colorClasses = "bg-cyan-900/30 border-cyan-800/50 hover:border-cyan-500/50 hover:bg-cyan-800/40 text-cyan-100";
  }

  return (
    <div ref={setNodeRef} style={style} className={`relative group ${btn.span === 2 ? 'col-span-2 sm:col-span-2' : 'col-span-1'}`}>
      <motion.button
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => onMark(btn)}
        {...attributes}
        {...listeners}
        className={`w-full flex flex-col items-center justify-center p-4 rounded-2xl border transition-colors shadow-sm touch-none ${colorClasses}`}
      >
        <span className="text-3xl mb-2">{btn.icon}</span>
        <span className={`text-sm font-medium ${btn.color ? '' : 'text-zinc-300'}`}>{btn.label}</span>
      </motion.button>
      <button 
        onClick={(e) => { e.stopPropagation(); onResize(btn.id); }}
        className="absolute top-2 right-2 text-zinc-500 hover:text-white p-1.5 bg-zinc-900/80 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity"
        title="Redimensionar"
      >
        {btn.span === 2 ? <Minimize2 size={14} /> : <Maximize2 size={14} />}
      </button>
    </div>
  );
}

export function MarkerGrid({ buttons, setButtons, onMark, onAddCustomButton, currentTime }: MarkerGridProps) {
  const [showPersonModal, setShowPersonModal] = useState(false);
  const [showCustomModal, setShowCustomModal] = useState(false);
  const [showAddSpeakerModal, setShowAddSpeakerModal] = useState(false);
  const [showNoteModal, setShowNoteModal] = useState(false);
  const [personName, setPersonName] = useState('');
  const [speakerName, setSpeakerName] = useState('');
  const [customIcon, setCustomIcon] = useState('📌');
  const [customLabel, setCustomLabel] = useState('');
  const [noteText, setNoteText] = useState('');
  const [noteType, setNoteType] = useState<MarkerType>('cinema_note');
  const [noteButton, setNoteButton] = useState<CustomButton | null>(null);
  const [savedTime, setSavedTime] = useState(0);
  const [speakers, setSpeakers] = useState<{id: string, name: string}[]>([]);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8, // 8px movement required before drag starts
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleMark = (btn: CustomButton) => {
    if (btn.type === 'cinema_note' || btn.type === 'cinema_error') {
      setSavedTime(currentTime);
      setNoteType(btn.type);
      setNoteButton(btn);
      setShowNoteModal(true);
    } else {
      onMark(btn);
    }
  };

  const saveNoteMarker = () => {
    if (noteText.trim() && noteButton) {
      onMark(noteButton, noteText);
    }
    setShowNoteModal(false);
    setNoteText('');
    setNoteButton(null);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    
    if (over && active.id !== over.id && setButtons) {
      const oldIndex = buttons.findIndex((btn) => btn.id === active.id);
      const newIndex = buttons.findIndex((btn) => btn.id === over.id);
      
      setButtons(arrayMove(buttons, oldIndex, newIndex));
    }
  };

  const toggleButtonSize = (id: string) => {
    if (setButtons) {
      setButtons(buttons.map(btn => {
        if (btn.id === id) {
          return { ...btn, span: btn.span === 2 ? 1 : 2 };
        }
        return btn;
      }));
    }
  };

  const handlePersonClick = () => {
    setSavedTime(currentTime);
    setShowPersonModal(true);
  };

  const handleCustomClick = () => {
    setSavedTime(currentTime);
    setShowCustomModal(true);
  };

  const savePersonMarker = () => {
    if (personName.trim()) {
      onMark({ id: 'temp-person', icon: '👤', label: 'Pessoa', type: 'person' }, personName);
    }
    setShowPersonModal(false);
    setPersonName('');
  };

  const saveSpeaker = () => {
    if (speakerName.trim()) {
      setSpeakers(prev => [...prev, { id: Math.random().toString(36).substr(2, 9), name: speakerName.trim() }]);
    }
    setShowAddSpeakerModal(false);
    setSpeakerName('');
  };

  const saveCustomButton = () => {
    if (customLabel.trim()) {
      onAddCustomButton(customIcon, customLabel);
      onMark({ id: 'temp-custom', icon: customIcon, label: customLabel, type: 'custom' });
    }
    setShowCustomModal(false);
    setCustomLabel('');
    setCustomIcon('📌');
  };

  return (
    <div className="w-full">
      <DndContext 
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <SortableContext 
          items={buttons.map(b => b.id)}
          strategy={rectSortingStrategy}
        >
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-6">
            {buttons.map((btn) => (
              <SortableButton 
                key={btn.id} 
                btn={btn} 
                onMark={handleMark} 
                onResize={toggleButtonSize} 
              />
            ))}
          </div>
        </SortableContext>
      </DndContext>

      {/* Speakers Section */}
      <div className="mb-6 p-4 bg-zinc-800/30 rounded-2xl border border-zinc-800">
        <h3 className="text-xs font-medium text-zinc-500 mb-3 uppercase tracking-wider flex items-center justify-between">
          <span>Participantes (Quem está falando)</span>
        </h3>
        <div className="flex flex-wrap gap-2">
          {speakers.map(speaker => (
            <button 
              key={speaker.id}
              onClick={() => onMark({ id: `speaker-${speaker.id}`, icon: '🗣️', label: speaker.name, type: 'person' }, `Falando: ${speaker.name}`)}
              className="px-4 py-2 bg-indigo-500/10 text-indigo-300 rounded-xl border border-indigo-500/20 hover:bg-indigo-500/20 hover:border-indigo-500/40 transition-colors flex items-center gap-2 text-sm font-medium"
            >
              🗣️ {speaker.name}
            </button>
          ))}
          <button 
            onClick={() => setShowAddSpeakerModal(true)}
            className="px-4 py-2 bg-zinc-800 text-zinc-400 rounded-xl border border-zinc-700 hover:bg-zinc-700 hover:text-white transition-colors flex items-center gap-2 text-sm"
          >
            <Plus size={14} /> Adicionar Participante
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 border-t border-zinc-800 pt-6">
        <button
          onClick={handlePersonClick}
          className="flex items-center justify-center gap-2 p-3 bg-zinc-800/50 rounded-xl text-zinc-400 hover:text-white hover:bg-zinc-700 transition-colors text-sm"
        >
          <User size={16} /> Marcar Pessoa
        </button>
        <button
          onClick={() => onMark({ id: 'loc', icon: '📍', label: 'Local', type: 'location' })}
          className="flex items-center justify-center gap-2 p-3 bg-zinc-800/50 rounded-xl text-zinc-400 hover:text-white hover:bg-zinc-700 transition-colors text-sm"
        >
          <MapPin size={16} /> Local
        </button>
        <button
          onClick={() => onMark({ id: 'img', icon: '🖼️', label: 'Imagem', type: 'image' })}
          className="flex items-center justify-center gap-2 p-3 bg-zinc-800/50 rounded-xl text-zinc-400 hover:text-white hover:bg-zinc-700 transition-colors text-sm"
        >
          <ImageIcon size={16} /> Descrever Visual
        </button>
        <button
          onClick={handleCustomClick}
          className="flex items-center justify-center gap-2 p-3 bg-emerald-500/10 text-emerald-400 rounded-xl hover:bg-emerald-500/20 transition-colors text-sm font-medium"
        >
          <Plus size={16} /> Criar Botão
        </button>
      </div>

      {/* Modals */}
      {showPersonModal && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
          <div className="bg-zinc-900 p-6 rounded-2xl border border-zinc-800 w-full max-w-sm">
            <h3 className="text-lg font-medium text-white mb-4">Marcar Pessoa (Tempo: {Math.floor(savedTime)}s)</h3>
            <input
              autoFocus
              type="text"
              placeholder="Nome da pessoa..."
              value={personName}
              onChange={(e) => setPersonName(e.target.value)}
              className="w-full bg-zinc-800 border border-zinc-700 rounded-xl p-3 text-white mb-4 focus:outline-none focus:border-emerald-500"
            />
            <div className="flex justify-end gap-3">
              <button onClick={() => setShowPersonModal(false)} className="px-4 py-2 text-zinc-400 hover:text-white">Cancelar</button>
              <button onClick={savePersonMarker} className="px-4 py-2 bg-emerald-500 text-zinc-900 font-medium rounded-xl hover:bg-emerald-400">Salvar</button>
            </div>
          </div>
        </div>
      )}

      {showAddSpeakerModal && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
          <div className="bg-zinc-900 p-6 rounded-2xl border border-zinc-800 w-full max-w-sm">
            <h3 className="text-lg font-medium text-white mb-4">Adicionar Participante</h3>
            <p className="text-sm text-zinc-400 mb-4">Adicione o nome de quem vai falar na gravação.</p>
            <input
              autoFocus
              type="text"
              placeholder="Nome (ex: João)"
              value={speakerName}
              onChange={(e) => setSpeakerName(e.target.value)}
              className="w-full bg-zinc-800 border border-zinc-700 rounded-xl p-3 text-white mb-4 focus:outline-none focus:border-emerald-500"
            />
            <div className="flex justify-end gap-3">
              <button onClick={() => setShowAddSpeakerModal(false)} className="px-4 py-2 text-zinc-400 hover:text-white">Cancelar</button>
              <button onClick={saveSpeaker} className="px-4 py-2 bg-indigo-500 text-white font-medium rounded-xl hover:bg-indigo-400">Adicionar</button>
            </div>
          </div>
        </div>
      )}

      {showCustomModal && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
          <div className="bg-zinc-900 p-6 rounded-2xl border border-zinc-800 w-full max-w-sm">
            <h3 className="text-lg font-medium text-white mb-4">Novo Botão (Tempo: {Math.floor(savedTime)}s)</h3>
            <div className="flex gap-3 mb-4">
              <input
                type="text"
                placeholder="Ícone (ex: 🚀)"
                value={customIcon}
                onChange={(e) => setCustomIcon(e.target.value)}
                className="w-16 bg-zinc-800 border border-zinc-700 rounded-xl p-3 text-center text-xl text-white focus:outline-none focus:border-emerald-500"
              />
              <input
                autoFocus
                type="text"
                placeholder="Nome do Botão..."
                value={customLabel}
                onChange={(e) => setCustomLabel(e.target.value)}
                className="flex-1 bg-zinc-800 border border-zinc-700 rounded-xl p-3 text-white focus:outline-none focus:border-emerald-500"
              />
            </div>
            <div className="flex justify-end gap-3">
              <button onClick={() => setShowCustomModal(false)} className="px-4 py-2 text-zinc-400 hover:text-white">Cancelar</button>
              <button onClick={saveCustomButton} className="px-4 py-2 bg-emerald-500 text-zinc-900 font-medium rounded-xl hover:bg-emerald-400">Criar e Marcar</button>
            </div>
          </div>
        </div>
      )}

      {showNoteModal && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
          <div className="bg-zinc-900 p-6 rounded-2xl border border-zinc-800 w-full max-w-sm">
            <h3 className="text-lg font-medium text-white mb-4">
              {noteType === 'cinema_error' ? 'Registrar Problema' : 'Nota de Continuidade'} (Tempo: {Math.floor(savedTime)}s)
            </h3>
            <textarea
              autoFocus
              placeholder={noteType === 'cinema_error' ? "Descreva o problema (ex: Avião passou, foco perdido)..." : "Descreva a nota de continuidade..."}
              value={noteText}
              onChange={(e) => setNoteText(e.target.value)}
              className="w-full bg-zinc-800 border border-zinc-700 rounded-xl p-3 text-white mb-4 focus:outline-none focus:border-emerald-500 min-h-[100px] resize-none"
            />
            <div className="flex justify-end gap-3">
              <button onClick={() => setShowNoteModal(false)} className="px-4 py-2 text-zinc-400 hover:text-white">Cancelar</button>
              <button onClick={saveNoteMarker} className="px-4 py-2 bg-emerald-500 text-zinc-900 font-medium rounded-xl hover:bg-emerald-400">Salvar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
