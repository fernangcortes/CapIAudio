import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Check, Plus, Trash2, ListTodo, AlertCircle } from 'lucide-react';
import { ChecklistItem } from '../types';

interface ChecklistCardProps {
  checklist: ChecklistItem[];
  onToggle: (id: string) => void;
  onAdd: (text: string) => void;
  onDelete: (id: string) => void;
  isRecording: boolean;
}

export function ChecklistCard({ checklist, onToggle, onAdd, onDelete, isRecording }: ChecklistCardProps) {
  const [newItemText, setNewItemText] = useState('');

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newItemText.trim()) return;
    onAdd(newItemText.trim());
    setNewItemText('');
  };

  const completedCount = checklist.filter(item => item.completed).length;
  const totalCount = checklist.length;
  const percentage = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  const [isCollapsed, setIsCollapsed] = useState(false);

  return (
    <div className="subtle-card relative overflow-hidden font-sans !p-2">
      {/* Background radial accent */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 rounded-none filter blur-2xl pointer-events-none" />

      <div 
        className="flex items-center justify-between mb-2 cursor-pointer select-none"
        onClick={() => setIsCollapsed(!isCollapsed)}
      >
        <div className="flex items-center gap-2">
          <ListTodo size={14} className="text-emerald-400" />
          <h3 className="text-xs font-bold tracking-wider uppercase text-zinc-400/90 flex items-center gap-2">
            Checklist de Fluxo
            <span className="text-[9px] text-zinc-500 font-normal normal-case">
              {isCollapsed ? '[+] abrir' : '[-] fechar'}
            </span>
          </h3>
        </div>
        <span className="subtle-badge !py-0.5 !px-1.5 text-[10px] rounded-none">
          {completedCount}/{totalCount}
        </span>
      </div>

      {!isCollapsed && (
        <>
          {/* Progress Bar */}
          <div className="mb-2 space-y-1">
            <div className="flex justify-between items-center text-xs">
              <span className="text-zinc-500 font-medium text-[10px]">Progresso da Diária</span>
              <span className="text-emerald-400/90 font-bold text-[10px]">{percentage}%</span>
            </div>
            <div className="w-full h-1 bg-black/40 rounded-none overflow-hidden border border-white/5">
              <motion.div 
                className="h-full bg-gradient-to-r from-emerald-500/80 to-teal-400/80 rounded-none"
                initial={{ width: 0 }}
                animate={{ width: `${percentage}%` }}
                transition={{ type: 'spring', stiffness: 80, damping: 15 }}
              />
            </div>
          </div>

          {/* Add New Item Input */}
          <form onSubmit={handleAdd} className="flex gap-2 mb-2">
            <input
              type="text"
              value={newItemText}
              onChange={(e) => setNewItemText(e.target.value)}
              placeholder="Adicionar tarefa..."
              className="flex-1 subtle-input !py-1 text-xs !rounded-none"
            />
            <button
              type="submit"
              className="p-1 or-px bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/10 rounded-none transition-all cursor-pointer flex items-center justify-center shrink-0 w-7 h-7"
              title="Adicionar item"
            >
              <Plus size={12} className="stroke-[2.5]" />
            </button>
          </form>

          {/* Checklist list */}
          {totalCount === 0 ? (
            <div className="text-center py-3 border border-dashed border-white/5 rounded-none">
              <AlertCircle size={16} className="mx-auto text-zinc-600 mb-1" />
              <p className="text-[10px] text-zinc-500 font-medium">Nenhum item cadastrado.</p>
            </div>
          ) : (
            <div className="space-y-1 max-h-[140px] overflow-y-auto pr-1 subtle-scrollbar">
          <AnimatePresence initial={false}>
            {checklist.map((item) => (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, x: -10 }}
                className={`flex items-center justify-between gap-2 p-1 rounded-none border transition-all ${
                  item.completed 
                    ? 'bg-emerald-500/5 border-emerald-500/10 text-zinc-500 line-through' 
                    : 'bg-black/15 border-white/5 hover:border-white/10 text-white'
                }`}
              >
                <div 
                  onClick={() => onToggle(item.id)}
                  className="flex items-center gap-2 flex-1 cursor-pointer select-none group"
                >
                  <div className={`w-3.5 h-3.5 rounded-none border flex items-center justify-center transition-all shrink-0 ${
                    item.completed 
                      ? 'bg-emerald-500 border-transparent text-black' 
                      : 'border-white/20 group-hover:border-emerald-500/60'
                  }`}>
                    {item.completed && <Check size={10} className="stroke-[3.5]" />}
                  </div>
                  <span className="text-[11px] font-semibold leading-relaxed break-words pr-2">
                    {item.text}
                  </span>
                </div>

                <button
                  type="button"
                  onClick={() => onDelete(item.id)}
                  className="p-1 text-zinc-500 hover:text-red-400 hover:bg-red-500/10 rounded-none transition-colors"
                  title="Excluir item"
                >
                  <Trash2 size={11} />
                </button>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}
        </>
      )}
    </div>
  );
}
