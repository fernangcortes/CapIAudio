import React, { useState } from 'react';
import { motion } from 'motion/react';
import { CustomButton, MarkerType } from '../types';
import { Plus, User, MapPin, Image as ImageIcon } from 'lucide-react';

interface MarkerGridProps {
  buttons: CustomButton[];
  onMark: (button: CustomButton, data?: any) => void;
  onAddCustomButton: (icon: string, label: string, type?: MarkerType) => void;
  currentTime: number;
}

export function MarkerGrid({ buttons, onMark, onAddCustomButton, currentTime }: MarkerGridProps) {
  const [showPersonModal, setShowPersonModal] = useState(false);
  const [showCustomModal, setShowCustomModal] = useState(false);
  const [personName, setPersonName] = useState('');
  const [customIcon, setCustomIcon] = useState('📌');
  const [customLabel, setCustomLabel] = useState('');
  const [savedTime, setSavedTime] = useState(0);

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
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-6">
        {buttons.map((btn) => (
          <motion.button
            key={btn.id}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => onMark(btn)}
            className="flex flex-col items-center justify-center p-4 bg-zinc-800 rounded-2xl border border-zinc-700 hover:border-emerald-500/50 hover:bg-zinc-700/50 transition-colors shadow-sm"
          >
            <span className="text-3xl mb-2">{btn.icon}</span>
            <span className="text-sm font-medium text-zinc-300">{btn.label}</span>
          </motion.button>
        ))}
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
    </div>
  );
}
