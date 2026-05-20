import React, { useState } from 'react';
import { motion } from 'motion/react';
import { CustomButton, MarkerType } from '../types';
import { Plus, User, MapPin, Image as ImageIcon, Maximize2, Minimize2, MessageSquare, Volume2 } from 'lucide-react';
import { getTranslation, buttonTranslations, LanguageType } from '../services/translationService';
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
  onMark: (button: CustomButton, data?: any, explicitTime?: number) => void;
  onAddCustomButton: (icon: string, label: string, type?: MarkerType) => void;
  currentTime: number;
  speakers?: {id: string, name: string}[];
  onAddSpeaker?: (name: string) => void;
  isEditing?: boolean;
  language?: LanguageType;
}

interface SortableButtonProps {
  key?: string;
  btn: CustomButton;
  onMark: any;
  onResize: any;
  onEdit?: (btn: CustomButton) => void;
  onDelete?: (id: string) => void;
  isEditing?: boolean;
  language: LanguageType;
}

function SortableButton({ btn, onMark, onResize, onEdit, onDelete, isEditing, language }: SortableButtonProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
  } = useSortable({ id: btn.id, disabled: !isEditing });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  // Determine colors based on the button's color property
  let colorClasses = "bg-zinc-800 border-zinc-700 hover:border-emerald-500/50 hover:bg-zinc-700/50";
  if (btn.color === 'Red') {
    colorClasses = "bg-red-900/40 border-red-800/80 hover:border-red-500 hover:bg-red-900/60 text-red-100";
  } else if (btn.color === 'Green') {
    colorClasses = "bg-[#064e3b]/40 border-emerald-800/80 hover:border-emerald-500 hover:bg-[#064e3b]/60 text-emerald-100";
  } else if (btn.color === 'Orange') {
    colorClasses = "bg-amber-950/40 border-amber-800/80 hover:border-amber-500 hover:bg-amber-950/60 text-amber-100";
  } else if (btn.color === 'Cyan') {
    colorClasses = "bg-cyan-950/40 border-cyan-800/80 hover:border-cyan-500 hover:bg-cyan-950/60 text-cyan-100";
  }

  // Handle dynamic translation
  const trans = buttonTranslations[btn.id];
  const finalLabel = language === 'en' && trans ? trans.label : btn.label;
  const finalTooltip = language === 'en' && trans ? trans.tooltip : (btn.tooltip || btn.label);

  return (
    <div ref={setNodeRef} style={style} className={`relative group ${btn.span === 2 ? 'col-span-2' : 'col-span-1'}`}>
      <motion.button
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.96 }}
        onClick={() => onMark(btn)}
        {...attributes}
        {...listeners}
        className={`w-full h-20 sm:h-24 flex flex-col items-center justify-center p-2 rounded-xl border transition-all duration-200 shadow-md touch-none ${colorClasses}`}
        title={finalTooltip}
        id={`btn-marker-${btn.id}`}
      >
        <span className="text-xl sm:text-2xl mb-1 select-none pointer-events-none">{btn.icon}</span>
        <span className={`text-[10px] sm:text-xs font-semibold text-center leading-tight line-clamp-2 w-full px-1 select-none pointer-events-none ${btn.color ? '' : 'text-zinc-300'}`}>
          {finalLabel}
        </span>
      </motion.button>
      
      {isEditing && (
        <div className="absolute top-1 right-1 flex flex-col gap-1 opacity-100 transition-opacity z-10">
          <button 
            onClick={(e) => { e.stopPropagation(); onResize(btn.id); }}
            className="text-zinc-500 hover:text-white p-1 bg-zinc-900/90 rounded-lg hover:scale-110 transition-transform"
            title="Redimensionar"
          >
            {btn.span === 2 ? <Minimize2 size={12} /> : <Maximize2 size={12} />}
          </button>
          {onEdit && (
            <button 
              onClick={(e) => { e.stopPropagation(); onEdit(btn); }}
              className="text-zinc-500 hover:text-white p-1 bg-zinc-900/90 rounded-lg hover:scale-110 transition-transform"
              title="Editar"
            >
              <span className="text-[10px]">✏️</span>
            </button>
          )}
          {onDelete && (
            <button 
              onClick={(e) => { e.stopPropagation(); onDelete(btn.id); }}
              className="text-red-500 hover:text-red-400 p-1 bg-zinc-900/90 rounded-lg hover:scale-110 transition-transform"
              title="Excluir"
            >
              <span className="text-[10px]">🗑️</span>
            </button>
          )}
        </div>
      )}
    </div>
  );
}

export function MarkerGrid({ 
  buttons, 
  setButtons, 
  onMark, 
  onAddCustomButton, 
  currentTime, 
  isEditing,
  language = 'pt'
}: MarkerGridProps) {
  const [showPersonModal, setShowPersonModal] = useState(false);
  const [showCustomModal, setShowCustomModal] = useState(false);
  const [showAddSpeakerModal, setShowAddSpeakerModal] = useState(false);
  const [showNoteModal, setShowNoteModal] = useState(false);
  const [showAskSpeakerModal, setShowAskSpeakerModal] = useState(false);
  
  const [personName, setPersonName] = useState('');
  const [speakerName, setSpeakerName] = useState('');
  const [customIcon, setCustomIcon] = useState('📌');
  const [customLabel, setCustomLabel] = useState('');
  
  const [noteText, setNoteText] = useState('');
  const [noteType, setNoteType] = useState<MarkerType>('cinema_note');
  const [noteButton, setNoteButton] = useState<CustomButton | null>(null);
  
  const [savedTime, setSavedTime] = useState(0);
  const [speakers, setSpeakers] = useState<{id: string, name: string}[]>([]);
  const [activeSpeakerId, setActiveSpeakerId] = useState<string>('none');
  const [askSpeakerOnMark, setAskSpeakerOnMark] = useState<boolean>(false);
  const [pendingButton, setPendingButton] = useState<CustomButton | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleMark = (btn: CustomButton) => {
    setSavedTime(currentTime);
    
    if (askSpeakerOnMark && speakers.length > 0) {
      setPendingButton(btn);
      setShowAskSpeakerModal(true);
    } else {
      executeMark(btn);
    }
  };

  const executeMark = (btn: CustomButton, speakerPrefix?: string, dataText?: string) => {
    // Determine active speaker prefix if any
    let activePrefix = '';
    if (speakerPrefix) {
      activePrefix = speakerPrefix;
    } else if (activeSpeakerId !== 'none') {
      const activeSpk = speakers.find(s => s.id === activeSpeakerId);
      if (activeSpk) {
        activePrefix = `${activeSpk.name}: `;
      }
    }

    if (btn.type === 'cinema_note' || btn.type === 'cinema_error' || btn.type === 'comment') {
      setNoteType(btn.type);
      setNoteButton(btn);
      setNoteText(dataText || '');
      setShowNoteModal(true);
    } else {
      const labelText = activePrefix ? `${activePrefix}${btn.label}` : btn.label;
      const finalButton = { ...btn, label: labelText };
      onMark(finalButton, dataText || undefined, savedTime);
    }
  };

  const handleSelectSpeakerOnMark = (spkName: string | null) => {
    if (!pendingButton) return;
    const prefix = spkName ? `${spkName}: ` : '';
    executeMark(pendingButton, prefix);
    setShowAskSpeakerModal(false);
    setPendingButton(null);
  };

  const saveNoteMarker = () => {
    if (noteText.trim() && noteButton) {
      // Add active speaker info if available
      let activePrefix = '';
      if (activeSpeakerId !== 'none') {
        const activeSpk = speakers.find(s => s.id === activeSpeakerId);
        if (activeSpk) {
          activePrefix = `${activeSpk.name}: `;
        }
      }

      const finalLabel = activePrefix ? `${activePrefix}${noteButton.label}` : noteButton.label;
      onMark({ ...noteButton, label: finalLabel }, noteText, savedTime);
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

  const [editingButton, setEditingButton] = useState<CustomButton | null>(null);

  const handleEditButton = (btn: CustomButton) => {
    setEditingButton(btn);
    setCustomIcon(btn.icon);
    setCustomLabel(btn.label);
    setShowCustomModal(true);
  };

  const handleDeleteButton = (id: string) => {
    if (setButtons) {
      setButtons(buttons.filter(b => b.id !== id));
    }
  };

  const savePersonMarker = () => {
    if (personName.trim()) {
      let activePrefix = '';
      if (activeSpeakerId !== 'none') {
        const activeSpk = speakers.find(s => s.id === activeSpeakerId);
        if (activeSpk) {
          activePrefix = `${activeSpk.name}: `;
        }
      }
      onMark({ id: 'temp-person', icon: '👤', label: `${activePrefix}${getTranslation('markPerson', language)}`, type: 'person' }, personName, savedTime);
    }
    setShowPersonModal(false);
    setPersonName('');
  };

  const saveSpeaker = () => {
    if (speakerName.trim()) {
      const newSpk = { id: Math.random().toString(36).substr(2, 9), name: speakerName.trim() };
      setSpeakers(prev => [...prev, newSpk]);
      // Auto set as active speaker
      setActiveSpeakerId(newSpk.id);
    }
    setShowAddSpeakerModal(false);
    setSpeakerName('');
  };

  const saveCustomButton = () => {
    if (customLabel.trim()) {
      if (editingButton && setButtons) {
        setButtons(buttons.map(b => 
          b.id === editingButton.id 
            ? { ...b, icon: customIcon, label: customLabel }
            : b
        ));
      } else {
        onAddCustomButton(customIcon, customLabel);
        onMark({ id: 'temp-custom', icon: customIcon, label: customLabel, type: 'custom' }, undefined, savedTime);
      }
    }
    setShowCustomModal(false);
    setCustomLabel('');
    setCustomIcon('📌');
    setEditingButton(null);
  };

  const handleCustomClick = () => {
    setSavedTime(currentTime);
    setEditingButton(null);
    setCustomIcon('📌');
    setCustomLabel('');
    setShowCustomModal(true);
  };

  const t = (key: Parameters<typeof getTranslation>[0]) => getTranslation(key, language);

  return (
    <div className="w-full">
      
      {/* Interactive Speakers & Recognition Area */}
      <div className="mb-6 p-4 md:p-5 bg-zinc-900/60 rounded-2xl border border-zinc-850 shadow-md">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
          <div className="flex items-center gap-2">
            <Volume2 className="text-indigo-400" size={18} />
            <h3 className="text-xs md:text-sm font-bold text-zinc-300 uppercase tracking-widest font-sans">
              {t('whoIsSpeaking')}
            </h3>
            {activeSpeakerId !== 'none' && (
              <span className="flex h-2 w-2 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
            )}
          </div>
          
          {/* Ask Speaker Option Checkbox */}
          <label className="flex items-center gap-2 text-xs text-zinc-400 cursor-pointer pr-1 hover:text-zinc-200 transition-colors">
            <input 
              type="checkbox" 
              checked={askSpeakerOnMark} 
              onChange={(e) => setAskSpeakerOnMark(e.target.checked)}
              className="w-4 h-4 rounded border-zinc-700 bg-zinc-800 text-indigo-500 focus:ring-indigo-500/50"
              id="chk-ask-speaker"
            />
            {t('askSpeakerOnMark')}
          </label>
        </div>

        <div className="flex flex-wrap gap-2 items-center">
          {/* Default "Nenhum/None" button to reset active speaker */}
          <button 
            onClick={() => setActiveSpeakerId('none')}
            className={`px-3 py-2 rounded-xl border text-xs font-semibold transition-all flex items-center gap-1.5 ${
              activeSpeakerId === 'none'
                ? 'bg-zinc-700 text-white border-zinc-600 shadow-inner'
                : 'bg-zinc-800/40 text-zinc-400 border-zinc-800/80 hover:bg-zinc-800 hover:text-zinc-300'
            }`}
          >
            ❌ {t('none')}
          </button>

          {speakers.map(speaker => {
            const isActive = activeSpeakerId === speaker.id;
            return (
              <button 
                key={speaker.id}
                onClick={() => {
                  setActiveSpeakerId(isActive ? 'none' : speaker.id);
                  // Registered a fast marker timeline update to interact directly with report
                  onMark({ 
                    id: `speaker-${speaker.id}`, 
                    icon: '🗣️', 
                    label: `${t('activeSpeaker')}: ${speaker.name}`, 
                    type: 'person' 
                  }, undefined, currentTime);
                }}
                className={`px-4 py-2 rounded-xl border text-xs sm:text-sm font-semibold transition-all flex items-center gap-2 ${
                  isActive
                    ? 'bg-indigo-600 text-white border-indigo-500 shadow-md ring-2 ring-indigo-500/40 scale-[1.03]'
                    : 'bg-indigo-500/10 text-indigo-300 border-indigo-500/20 hover:bg-indigo-500/20 hover:border-indigo-500/30'
                }`}
                id={`btn-speaker-${speaker.id}`}
              >
                🗣️ {speaker.name}
              </button>
            );
          })}
          
          <button 
            type="button"
            onClick={() => setShowAddSpeakerModal(true)}
            className="px-3.5 py-2 bg-zinc-800 text-zinc-400 rounded-xl border border-zinc-700 hover:bg-zinc-750 hover:text-white transition-all text-xs font-medium flex items-center gap-1.5"
            id="btn-add-speaker"
          >
            <Plus size={14} /> {t('addSpeaker')}
          </button>
        </div>
      </div>

      {/* Reorderable Button Grid */}
      <DndContext 
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <SortableContext 
          items={buttons.map(b => b.id)}
          strategy={rectSortingStrategy}
        >
          <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-5 gap-2.5 sm:gap-3 mb-6">
            {buttons.map((btn) => (
              <SortableButton 
                key={btn.id} 
                btn={btn} 
                onMark={handleMark} 
                onResize={toggleButtonSize} 
                onEdit={isEditing ? handleEditButton : undefined}
                onDelete={isEditing ? handleDeleteButton : undefined}
                isEditing={isEditing}
                language={language}
              />
            ))}
          </div>
        </SortableContext>
      </DndContext>

      {/* Core Universal Action Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 border-t border-zinc-850 pt-5">
        <button
          onClick={handlePersonClick}
          className="flex items-center justify-center gap-2 p-3 bg-zinc-850/60 rounded-xl text-zinc-300 border border-zinc-800 hover:bg-zinc-800 hover:text-white hover:border-zinc-700 transition-colors text-sm font-medium"
          id="btn-action-person"
        >
          <User size={16} className="text-[#38bdf8]" /> {t('markPerson')}
        </button>
        <button
          onClick={() => onMark({ id: 'loc', icon: '📍', label: t('location'), type: 'location' })}
          className="flex items-center justify-center gap-2 p-3 bg-zinc-850/60 rounded-xl text-zinc-300 border border-zinc-800 hover:bg-zinc-800 hover:text-white hover:border-zinc-700 transition-colors text-sm font-medium"
          id="btn-action-location"
        >
          <MapPin size={16} className="text-red-400" /> {t('location')}
        </button>
        <button
          onClick={() => onMark({ id: 'img', icon: '🖼️', label: t('describeVisual'), type: 'image' })}
          className="flex items-center justify-center gap-2 p-3 bg-zinc-850/60 rounded-xl text-zinc-300 border border-zinc-800 hover:bg-zinc-800 hover:text-white hover:border-zinc-700 transition-colors text-sm font-medium"
          id="btn-action-image"
        >
          <ImageIcon size={16} className="text-[#c084fc]" /> {t('describeVisual')}
        </button>
        <button
          onClick={handleCustomClick}
          className="flex items-center justify-center gap-2 p-3 bg-emerald-500/10 text-emerald-400 rounded-xl border border-emerald-500/15 hover:bg-emerald-500/25 transition-colors text-sm font-semibold"
          id="btn-action-create"
        >
          <Plus size={16} /> {t('createButton')}
        </button>
      </div>

      {/* --- MODALS --- */}
      
      {/* Ask Who Spoke Query Modal */}
      {showAskSpeakerModal && pendingButton && (
        <div className="fixed inset-0 bg-black/85 flex items-center justify-center z-[99999] p-4 backdrop-blur-sm">
          <div className="bg-zinc-900 border border-zinc-800 p-6 rounded-2xl w-full max-w-md shadow-2xl relative animate-in fade-in zoom-in duration-200">
            <h3 className="text-xl font-bold text-white mb-2 flex items-center gap-2">
              <span>🗣️</span> {t('askWhoSpeakingTitle')}
            </h3>
            <p className="text-sm text-zinc-400 mb-5">
              {t('clickToSelect')}
            </p>
            
            <div className="grid grid-cols-2 gap-2.5 mb-6 max-h-[180px] overflow-y-auto pr-1">
              {speakers.map(spk => (
                <button
                  key={spk.id}
                  onClick={() => handleSelectSpeakerOnMark(spk.name)}
                  className="px-4 py-3 bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 hover:bg-indigo-600 hover:text-white rounded-xl transition-all text-sm font-semibold text-left truncate flex items-center gap-2"
                >
                  👤 {spk.name}
                </button>
              ))}
            </div>

            <div className="flex justify-end gap-3.5 border-t border-zinc-800 pt-4">
              <button 
                onClick={() => handleSelectSpeakerOnMark(null)} 
                className="px-4 py-2 text-sm text-zinc-400 hover:text-white font-medium hover:bg-zinc-800/50 rounded-lg"
              >
                ⏩ {t('none')} (Skip)
              </button>
              <button 
                onClick={() => { setShowAskSpeakerModal(false); setPendingButton(null); }} 
                className="px-4 py-2 text-sm text-zinc-500 hover:text-zinc-300"
              >
                {t('cancel')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Person Marker Modal */}
      {showPersonModal && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-[99999] p-4 backdrop-blur-sm">
          <div className="bg-zinc-900 p-6 rounded-2xl border border-zinc-800 w-full max-w-sm">
            <h3 className="text-lg font-bold text-white mb-3">{t('markPerson')} ({Math.floor(savedTime)}s)</h3>
            <input
              autoFocus
              type="text"
              placeholder={t('personNamePlaceholder')}
              value={personName}
              onChange={(e) => setPersonName(e.target.value)}
              className="w-full bg-zinc-800 border border-zinc-700 rounded-xl p-3 text-white mb-5 focus:outline-none focus:border-indigo-500 text-sm"
              onKeyDown={(e) => e.key === 'Enter' && savePersonMarker()}
            />
            <div className="flex justify-end gap-3 font-sans">
              <button onClick={() => setShowPersonModal(false)} className="px-4 py-2 text-sm text-zinc-400 hover:text-white">{t('cancel')}</button>
              <button onClick={savePersonMarker} className="px-4 py-2 text-sm bg-indigo-500 text-white font-semibold rounded-xl hover:bg-indigo-400">{t('save')}</button>
            </div>
          </div>
        </div>
      )}

      {/* Add Speaker / Participant Modal */}
      {showAddSpeakerModal && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-[99999] p-4 backdrop-blur-sm">
          <div className="bg-zinc-900 p-6 rounded-2xl border border-zinc-800 w-full max-w-sm">
            <h3 className="text-lg font-bold text-white mb-2">{t('addSpeaker')}</h3>
            <input
              autoFocus
              type="text"
              placeholder={t('speakerNamePlaceholder')}
              value={speakerName}
              onChange={(e) => setSpeakerName(e.target.value)}
              className="w-full bg-zinc-800 border border-zinc-700 rounded-xl p-3 text-white mb-5 focus:outline-none focus:border-indigo-500 text-sm"
              onKeyDown={(e) => e.key === 'Enter' && saveSpeaker()}
            />
            <div className="flex justify-end gap-3 font-sans">
              <button onClick={() => setShowAddSpeakerModal(false)} className="px-4 py-2 text-sm text-zinc-400 hover:text-white">{t('cancel')}</button>
              <button onClick={saveSpeaker} className="px-4 py-2 text-sm bg-indigo-500 text-white font-semibold rounded-xl hover:bg-indigo-400">{t('add')}</button>
            </div>
          </div>
        </div>
      )}

      {/* Add / Edit Custom Button Modal */}
      {showCustomModal && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-[99999] p-4 backdrop-blur-sm">
          <div className="bg-zinc-900 p-6 rounded-2xl border border-zinc-800 w-full max-w-sm">
            <h3 className="text-lg font-bold text-white mb-4">
              {editingButton ? t('editButton') : `${t('newButton')} (${Math.floor(savedTime)}s)`}
            </h3>
            <div className="flex gap-3 mb-5">
              <input
                type="text"
                placeholder={t('iconPlaceholder')}
                value={customIcon}
                onChange={(e) => setCustomIcon(e.target.value)}
                className="w-16 bg-zinc-800 border border-zinc-700 rounded-xl p-3 text-center text-xl text-white focus:outline-none focus:border-emerald-500"
              />
              <input
                autoFocus
                type="text"
                placeholder={t('buttonNamePlaceholder')}
                value={customLabel}
                onChange={(e) => setCustomLabel(e.target.value)}
                className="flex-1 bg-zinc-800 border border-zinc-700 rounded-xl p-3 text-white text-sm focus:outline-none focus:border-emerald-500"
                onKeyDown={(e) => e.key === 'Enter' && saveCustomButton()}
              />
            </div>
            <div className="flex justify-end gap-3 font-sans">
              <button onClick={() => { setShowCustomModal(false); setEditingButton(null); }} className="px-4 py-2 text-sm text-zinc-400 hover:text-white">{t('cancel')}</button>
              <button onClick={saveCustomButton} className="px-4 py-2 text-sm bg-emerald-500 text-zinc-900 font-semibold rounded-xl hover:bg-emerald-400">
                {editingButton ? t('save') : t('createAndMark')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Note / Comment Description Modal */}
      {showNoteModal && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-[99999] p-4 backdrop-blur-sm">
          <div className="bg-zinc-900 p-6 rounded-2xl border border-zinc-800 w-full max-w-sm">
            <h3 className="text-lg font-bold text-white mb-3">
              {noteType === 'cinema_error' ? '⚠️ Registrar Ocorrência / Issue' : noteType === 'comment' ? '💬 Comentário / Comment' : '📝 Nota / Note'} ({Math.floor(savedTime)}s)
            </h3>
            <textarea
              autoFocus
              placeholder={t('writeNotePlaceholder')}
              value={noteText}
              onChange={(e) => setNoteText(e.target.value)}
              className="w-full bg-zinc-800 border border-zinc-700 rounded-xl p-3 text-white mb-5 focus:outline-none focus:border-indigo-500 min-h-[100px] text-sm resize-none"
              onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && (e.preventDefault(), saveNoteMarker())}
            />
            <div className="flex justify-end gap-3 font-sans">
              <button 
                onClick={() => {
                  setShowNoteModal(false);
                  setNoteText('');
                  setNoteButton(null);
                }} 
                className="px-4 py-2 text-sm text-zinc-400 hover:text-white"
              >
                {t('cancel')}
              </button>
              <button onClick={saveNoteMarker} className="px-4 py-2 text-sm bg-indigo-500 text-white font-semibold rounded-xl hover:bg-indigo-400">{t('save')}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
