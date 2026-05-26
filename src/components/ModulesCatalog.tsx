import React, { useState, useMemo } from 'react';
import { ModeConfig } from '../types';
import { X, Search, Grid, Compass, Sparkles, Check, ArrowUpRight } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface ModulesCatalogProps {
  modes: Record<string, ModeConfig>;
  currentModeId: string;
  onSelectMode: (modeId: string) => void;
  onClose: () => void;
}

export function ModulesCatalog({ modes, currentModeId, onSelectMode, onClose }: ModulesCatalogProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('todos');

  // Convert modes object to list and exclude custom modes unless we want all
  const presetModesList = useMemo(() => {
    return Object.values(modes).filter(m => !m.custom);
  }, [modes]);

  // Extract unique categories (ignoring undefined ones)
  const categories = useMemo(() => {
    const list = new Set<string>();
    presetModesList.forEach(m => {
      if (m.category) list.add(m.category);
    });
    return Array.from(list);
  }, [presetModesList]);

  // Filter modes based on search query & selected category
  const filteredModesList = useMemo(() => {
    return presetModesList.filter(mode => {
      const matchesSearch = 
        mode.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        mode.description.toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchesCategory = 
        selectedCategory === 'todos' || 
        mode.category === selectedCategory;

      return matchesSearch && matchesCategory;
    });
  }, [presetModesList, searchQuery, selectedCategory]);

  // Group filtered modes by category for structured listing
  const groupedModes = useMemo(() => {
    const groups: Record<string, ModeConfig[]> = {};
    filteredModesList.forEach(mode => {
      const cat = mode.category || 'Outros';
      if (!groups[cat]) groups[cat] = [];
      groups[cat].push(mode);
    });
    return groups;
  }, [filteredModesList]);

  return (
    <div className="fixed inset-0 bg-black/90 backdrop-blur-md flex items-center justify-center z-[110] p-4 sm:p-6 overflow-y-auto">
      {/* Backdrop overlay click to close */}
      <div className="absolute inset-0 cursor-default" onClick={onClose} />

      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 15 }}
        transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
        className="w-full max-w-4xl bg-[#08080c] border border-white/[0.05] rounded-[24px] p-5 sm:p-7 shadow-3xl relative z-10 overflow-hidden flex flex-col my-auto max-h-[92vh] sm:max-h-[88vh]"
      >
        {/* Subtle background glow */}
        <div className="absolute -top-32 -right-32 w-80 h-80 bg-emerald-500/5 rounded-full blur-3xl pointer-events-none" />

        {/* Header */}
        <div className="flex items-center justify-between mb-5 shrink-0 relative z-10">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-emerald-500/5 text-emerald-400 border border-emerald-500/10">
              <Compass size={20} className="animate-spin-slow" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white tracking-tight flex items-center gap-2">
                Catálogo de Módulos
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/15">
                  {filteredModesList.length} Presets
                </span>
              </h3>
              <p className="text-zinc-500 text-xs mt-0.5">Selecione e ative instantaneamente um fluxo de trabalho profissional</p>
            </div>
          </div>
          <button 
            type="button"
            onClick={onClose}
            className="p-2 text-zinc-400 hover:text-white hover:bg-white/5 rounded-full transition-all cursor-pointer border border-transparent"
          >
            <X size={18} />
          </button>
        </div>

        {/* Search and Filters Section */}
        <div className="flex flex-col md:flex-row gap-3 mb-6 shrink-0 relative z-10">
          {/* Search Bar */}
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-500" size={15} />
            <input 
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar por módulo ou pauta (Ex: Cinema, Pessoal, Obra...)"
              className="subtle-input w-full pl-10 pr-4 !py-2.5 text-xs text-white placeholder-zinc-600 font-medium h-10"
            />
            {searchQuery && (
              <button 
                onClick={() => setSearchQuery('')}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[10px] hover:text-white text-zinc-500 transition-colors bg-white/5 rounded px-1.5 py-0.5 cursor-pointer"
              >
                Limpar
              </button>
            )}
          </div>

          {/* Quick Filter Categories Carousel */}
          <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-none shrink-0 max-w-full md:max-w-md">
            <button
              onClick={() => setSelectedCategory('todos')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-xl transition-all whitespace-nowrap cursor-pointer border ${
                selectedCategory === 'todos'
                  ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                  : 'bg-white/[0.01] text-zinc-400 hover:bg-white/5 hover:text-zinc-300 border-white/[0.04]'
              }`}
            >
              Todos
            </button>
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-3 py-1.5 text-xs font-semibold rounded-xl transition-all whitespace-nowrap cursor-pointer border ${
                  selectedCategory === cat
                    ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                    : 'bg-white/[0.01] text-zinc-400 hover:bg-white/5 hover:text-zinc-300 border-white/[0.04]'
                }`}
              >
                {cat.split(' ').slice(1).join(' ')} {/* Exclude emoji from tab button to be compact */}
              </button>
            ))}
          </div>
        </div>

        {/* Categories / Modules Scrollable Body */}
        <div className="flex-1 overflow-y-auto pr-1 space-y-6 scrollbar-thin scrollbar-thumb-zinc-800 scrollbar-track-transparent pb-4 relative z-10">
          <AnimatePresence mode="popLayout">
            {Object.keys(groupedModes).length === 0 ? (
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="flex flex-col items-center justify-center p-12 text-center"
              >
                <div className="w-12 h-12 rounded-2xl bg-zinc-950/40 border border-white/[0.03] flex items-center justify-center text-zinc-600 mb-4">
                  <Grid size={18} />
                </div>
                <p className="text-zinc-400 font-semibold text-xs">Nenhum módulo encontrado</p>
                <p className="text-zinc-600 text-[11px] mt-1">Experimente buscar por outros termos ou limpar o campo.</p>
              </motion.div>
            ) : (
              Object.entries(groupedModes).map(([category, items]) => (
                <motion.div 
                  key={category} 
                  layout
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="space-y-3"
                >
                  {/* Category Title bar */}
                  <h4 className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest pl-1 mt-2 flex items-center gap-1.5 font-mono">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                    {category}
                  </h4>

                  {/* Grid of items in Category */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {items.map((mode) => {
                      const isCurrent = mode.id === currentModeId;
                      return (
                        <div
                          key={mode.id}
                          onClick={() => {
                            onSelectMode(mode.id);
                            onClose();
                          }}
                          className={`group relative p-4 rounded-xl border transition-all cursor-pointer flex items-start gap-4 ${
                            isCurrent
                              ? 'bg-emerald-500/5 border-emerald-500/20 shadow-[0_0_20px_rgba(16,185,129,0.03)]'
                              : 'bg-white/[0.015] border-white/[0.03] hover:border-emerald-500/20 hover:bg-white/[0.03]'
                          }`}
                        >
                          {/* Left Column Emoji badge */}
                          <div className={`p-2.5 rounded-xl text-xl shrink-0 self-start transition-all ${
                            isCurrent ? 'bg-emerald-500/10' : 'bg-white/[0.02]'
                          }`}>
                            {mode.icon}
                          </div>

                          {/* Center Description Column */}
                          <div className="flex-1 min-w-0 pr-4 space-y-1">
                            <h5 className="text-[12px] font-bold text-white flex items-center gap-1.5 group-hover:text-emerald-400 transition-colors">
                              {mode.name}
                              {isCurrent && (
                                <span className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/15 p-0.5 rounded-full" title="Modo Ativo">
                                  <Check size={10} className="stroke-[3]" />
                                </span>
                              )}
                            </h5>
                            <p className="text-[11px] text-zinc-500 font-medium leading-relaxed line-clamp-2">
                              {mode.description}
                            </p>

                            {/* Tags overview in small capsule labels */}
                            <div className="flex flex-wrap gap-1 mt-2">
                              {mode.defaultButtons.slice(0, 3).map((btn) => (
                                <span 
                                  key={btn.id} 
                                  className="text-[9px] font-semibold text-zinc-500 bg-white/[0.02] border border-white/[0.03] rounded px-1.5 py-0.5 flex items-center gap-1 shrink-0"
                                >
                                  <span>{btn.icon}</span>
                                  <span className="line-clamp-1">{btn.label}</span>
                                </span>
                              ))}
                              {mode.defaultButtons.length > 3 && (
                                <span className="text-[9px] font-semibold text-zinc-500 bg-white/[0.02] border border-white/[0.03] px-1 rounded flex items-center">
                                  +{mode.defaultButtons.length - 3}
                                </span>
                              )}
                            </div>
                          </div>

                          {/* Quick selection arrow trigger overlay */}
                          <div className="absolute right-3.5 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all text-emerald-400 p-1 bg-emerald-500/5 rounded-full border border-emerald-500/10">
                            <ArrowUpRight size={13} />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </motion.div>
              ))
            )}
          </AnimatePresence>
        </div>

        {/* Footer info banner */}
        <div className="mt-4 pt-4 border-t border-white/[0.04] flex items-center justify-between text-[10px] text-zinc-600 shrink-0">
          <span className="flex items-center gap-1 font-medium select-none">
            <Sparkles size={11} className="text-emerald-500" />
            Cada módulo altera os formulários iniciais e os botões rápidos.
          </span>
          <button 
            type="button"
            onClick={onClose}
            className="text-[11px] text-zinc-500 hover:text-white font-semibold rounded-lg px-2.5 py-1.5 hover:bg-white/5 transition-all text-center cursor-pointer"
          >
            Fechar Catálogo
          </button>
        </div>
      </motion.div>
    </div>
  );
}
