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

  return (
    <div className="bg-[#1e2130] border border-white/5 rounded-3xl p-5 md:p-6 shadow-xl relative overflow-hidden font-sans">
      {/* Background radial accent */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 rounded-full filter blur-2xl pointer-events-none" />

      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <ListTodo size={18} className="text-emerald-400" />
          <h3 className="text-sm font-bold tracking-wider uppercase text-zinc-300">
            Checklist de Fluxo
          </h3>
        </div>
        <span className="text-[11px] font-mono text-zinc-400 font-semibold bg-white/5 px-2 py-1 rounded-md">
          {completedCount}/{totalCount}
        </span>
      </div>

      {/* Progress Bar */}
      <div className="mb-5 space-y-1.5">
        <div className="flex justify-between items-center text-xs">
          <span className="text-zinc-400 font-medium">Progresso da Diária</span>
          <span className="text-emerald-400 font-bold">{percentage}%</span>
        </div>
        <div className="w-full h-2 bg-black/40 rounded-full overflow-hidden border border-white/5">
          <motion.div 
            className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 rounded-full"
            initial={{ width: 0 }}
            animate={{ width: `${percentage}%` }}
            transition={{ type: 'spring', stiffness: 80, damping: 15 }}
          />
        </div>
      </div>

      {/* Add New Item Input */}
      <form onSubmit={handleAdd} className="flex gap-2 mb-4">
        <input
          type="text"
          value={newItemText}
          onChange={(e) => setNewItemText(e.target.value)}
          placeholder="Adicionar tarefa customizada..."
          className="flex-1 bg-black/35 border border-white/5 text-xs text-white placeholder-zinc-500 px-3 py-2.5 rounded-xl outline-none focus:border-emerald-500/50 focus:bg-black/50 transition-all font-medium"
        />
        <button
          type="submit"
          className="p-2.5 bg-emerald-500 hover:bg-emerald-400 text-black rounded-xl transition-all cursor-pointer flex items-center justify-center shrink-0"
          title="Adicionar item"
        >
          <Plus size={14} className="stroke-[3]" />
        </button>
      </form>

      {/* Checklist list */}
      {totalCount === 0 ? (
        <div className="text-center py-6 border border-dashed border-white/5 rounded-2xl">
          <AlertCircle size={20} className="mx-auto text-zinc-600 mb-1.5" />
          <p className="text-xs text-zinc-500 font-medium">Nenhum item cadastrado.</p>
        </div>
      ) : (
        <div className="space-y-2 max-h-[220px] overflow-y-auto pr-1">
          <AnimatePresence initial={false}>
            {checklist.map((item) => (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, x: -10 }}
                className={`flex items-center justify-between gap-3 p-2.5 rounded-xl border transition-all ${
                  item.completed 
                    ? 'bg-emerald-500/5 border-emerald-500/10 text-zinc-500 line-through' 
                    : 'bg-black/15 border-white/5 hover:border-white/10 text-white'
                }`}
              >
                <div 
                  onClick={() => onToggle(item.id)}
                  className="flex items-center gap-3 flex-1 cursor-pointer select-none group"
                >
                  <div className={`w-4 h-4 rounded border flex items-center justify-center transition-all shrink-0 ${
                    item.completed 
                      ? 'bg-emerald-500 border-transparent text-black' 
                      : 'border-white/20 group-hover:border-emerald-500/60'
                  }`}>
                    {item.completed && <Check size={11} className="stroke-[3.5]" />}
                  </div>
                  <span className="text-xs font-semibold leading-relaxed break-words pr-2">
                    {item.text}
                  </span>
                </div>

                <button
                  type="button"
                  onClick={() => onDelete(item.id)}
                  className="p-1 text-zinc-500 hover:text-red-400 hover:bg-red-500/10 rounded transition-colors"
                  title="Excluir item"
                >
                  <Trash2 size={12} />
                </button>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}
