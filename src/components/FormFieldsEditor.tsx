import React, { useState } from 'react';
import { FormField } from '../types';
import { X, Plus, Trash2, ChevronUp, ChevronDown, ListPlus, Type, AlignLeft, Save } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface FormFieldsEditorProps {
  initialFields: FormField[];
  onSave: (fields: FormField[]) => void;
  onClose: () => void;
  modeName: string;
}

export function FormFieldsEditor({ initialFields, onSave, onClose, modeName }: FormFieldsEditorProps) {
  // Deep copy so edits don't mutate parent state until saved
  const [fields, setFields] = useState<FormField[]>(() => {
    return initialFields.length > 0 
      ? JSON.parse(JSON.stringify(initialFields))
      : [{ key: 'title', label: 'Campo Clave', placeholder: 'Exemplo de anotação', type: 'text' }];
  });

  const [validationError, setValidationError] = useState<string | null>(null);

  // Helper to slugify standard labels into safe unique object keys
  const generateSafeKey = (label: string, fieldsList: FormField[], existingKey?: string): string => {
    let base = label
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '') // remove accents
      .replace(/[^a-z0-9_]/g, '_')     // replace non-alphanumeric with underscore
      .replace(/^_+|_+$/g, '');        // trim underscores
    
    if (!base) base = 'campo';
    
    // Ensure it doesn't start with digits
    if (/^[0-9]/.test(base)) {
      base = 'f_' + base;
    }

    let candidate = base;
    let counter = 1;

    // Check collision, skipping current field if has existing key
    while (fieldsList.some(f => f.key === candidate && f.key !== existingKey)) {
      candidate = `${base}_${counter}`;
      counter++;
    }

    return candidate;
  };

  const handleAddField = () => {
    const newLabel = `Novo Campo ${fields.length + 1}`;
    const safeKey = generateSafeKey(newLabel, fields);
    
    const newField: FormField = {
      key: safeKey,
      label: newLabel,
      placeholder: 'Digite aqui...',
      type: 'text'
    };

    setFields([...fields, newField]);
    setValidationError(null);
  };

  const handleDeleteField = (index: number) => {
    if (fields.length <= 1) {
      setValidationError('O formulário deve ter no mínimo 1 campo para identificação.');
      return;
    }
    const newFields = [...fields];
    newFields.splice(index, 1);
    setFields(newFields);
    setValidationError(null);
  };

  const handleMoveUp = (index: number) => {
    if (index === 0) return;
    const newFields = [...fields];
    const temp = newFields[index];
    newFields[index] = newFields[index - 1];
    newFields[index - 1] = temp;
    setFields(newFields);
  };

  const handleMoveDown = (index: number) => {
    if (index === fields.length - 1) return;
    const newFields = [...fields];
    const temp = newFields[index];
    newFields[index] = newFields[index + 1];
    newFields[index + 1] = temp;
    setFields(newFields);
  };

  const handleFieldChange = (index: number, property: keyof FormField, value: any) => {
    const newFields = [...fields];
    const currentItem = { ...newFields[index] };

    if (property === 'label') {
      currentItem.label = value;
      // Auto-update safe key in sync with label
      currentItem.key = generateSafeKey(value, newFields, currentItem.key);
    } else {
      (currentItem as any)[property] = value;
    }

    newFields[index] = currentItem;
    setFields(newFields);
    setValidationError(null);
  };

  const handleSave = () => {
    // Basic validation
    const emptyKeys = fields.some(f => !f.key.trim() || !f.label.trim());
    if (emptyKeys) {
      setValidationError('Todos os campos devem ter um rótulo preenchido.');
      return;
    }

    // Check unique keys
    const keysSet = new Set(fields.map(f => f.key));
    if (keysSet.size !== fields.length) {
      setValidationError('Ocorreu um problema de colisão de chaves internas. Por favor, ajuste os nomes.');
      return;
    }

    onSave(fields);
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-[110] p-4 overflow-y-auto">
      {/* Backdrop Area */}
      <div className="absolute inset-0 cursor-default" onClick={onClose} />

      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 15 }}
        transition={{ duration: 0.25, ease: "easeOut" }}
        className="w-full max-w-lg bg-[#121420] border border-zinc-800 rounded-[32px] p-6 sm:p-7 shadow-3xl relative z-10 overflow-hidden flex flex-col my-auto max-h-[90vh] sm:max-h-[85vh]"
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-5 shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-emerald-500/10 text-emerald-400">
              <ListPlus size={20} />
            </div>
            <div>
              <h3 className="text-base font-bold text-white tracking-tight leading-tight">Editar Formulário</h3>
              <p className="text-[11px] text-zinc-400 font-medium mt-0.5">Template: <span className="text-emerald-400 font-semibold">{modeName}</span></p>
            </div>
          </div>
          <button 
            type="button"
            onClick={onClose}
            className="p-2 text-zinc-400 hover:text-white hover:bg-white/5 rounded-full transition-all cursor-pointer border border-transparent hover:border-zinc-800"
          >
            <X size={18} />
          </button>
        </div>

        {/* Validation Errors */}
        {validationError && (
          <div className="mb-4 text-xs font-semibold px-4 py-3 bg-red-500/10 border border-red-500/20 text-red-400 rounded-2xl shrink-0">
            {validationError}
          </div>
        )}

        {/* Dynamic Fields Scroll Area */}
        <div className="space-y-4 overflow-y-auto pr-1 flex-1 scrollbar-thin scrollbar-thumb-zinc-800 scrollbar-track-transparent">
          <AnimatePresence initial={false}>
            {fields.map((field, idx) => (
              <motion.div 
                key={idx}
                layout
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.2 }}
                className="p-4 bg-[#181a26]/90 border border-zinc-800/80 rounded-2xl relative group hover:border-zinc-700 transition-[border-color]"
              >
                <div className="flex items-stretch justify-between gap-4">
                  {/* Inputs Container */}
                  <div className="flex-grow space-y-4">
                    <div className="flex flex-col sm:flex-row gap-3">
                      {/* Label Input */}
                      <div className="flex-1 space-y-1">
                        <label className="text-[9px] font-bold text-zinc-500 pl-1 uppercase tracking-wider block">Rótulo / Nome do Campo</label>
                        <input 
                          type="text"
                          value={field.label}
                          onChange={(e) => handleFieldChange(idx, 'label', e.target.value)}
                          className="w-full bg-[#11121d] border border-zinc-800 hover:border-zinc-700 focus:border-emerald-500 rounded-xl px-3.5 py-2 text-xs text-white placeholder-zinc-650 focus:outline-none transition-all font-medium h-10"
                          placeholder="Ex: Nome do Projeto"
                        />
                      </div>

                      {/* Typology Choice Toggle */}
                      <div className="w-full sm:w-28 space-y-1 shrink-0">
                        <label className="text-[9px] font-bold text-zinc-500 pl-1 uppercase tracking-wider block">Tipo de Caixa</label>
                        <div className="flex gap-1 bg-[#11121d] border border-zinc-800 rounded-xl p-0.5 h-10">
                          <button 
                            type="button"
                            onClick={() => handleFieldChange(idx, 'type', 'text')}
                            className={`flex-grow hover:text-white flex items-center justify-center rounded-lg transition-all cursor-pointer ${
                              field.type === 'text' 
                                ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/10 font-bold shadow-sm' 
                                : 'text-zinc-500 hover:bg-white/5'
                            }`}
                            title="Texto Curto"
                          >
                            <Type size={14} className="mr-1" />
                            <span className="text-[10px]">Curto</span>
                          </button>
                          <button 
                            type="button"
                            onClick={() => handleFieldChange(idx, 'type', 'textarea')}
                            className={`flex-grow hover:text-white flex items-center justify-center rounded-lg transition-all cursor-pointer ${
                              field.type === 'textarea' 
                                ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/10 font-bold shadow-sm' 
                                : 'text-zinc-500 hover:bg-white/5'
                            }`}
                            title="Texto Longo / Parágrafo"
                          >
                            <AlignLeft size={14} className="mr-1" />
                            <span className="text-[10px]">Longo</span>
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Placeholder input */}
                    <div className="space-y-1">
                      <label className="text-[9px] font-bold text-zinc-500 pl-1 uppercase tracking-wider block">Texto Dica (Dica no campo)</label>
                      <input 
                        type="text"
                        value={field.placeholder || ''}
                        onChange={(e) => handleFieldChange(idx, 'placeholder', e.target.value)}
                        className="w-full bg-[#11121d] border border-zinc-800 hover:border-zinc-700 focus:border-emerald-500 rounded-xl px-3.5 py-2 text-xs text-white placeholder-zinc-650 focus:outline-none transition-all font-medium h-10"
                        placeholder="Ex: Qual o número do take..."
                      />
                    </div>
                  </div>

                  {/* Vertical actions block */}
                  <div className="flex flex-col gap-1 items-center justify-between min-h-max py-0.5 border-l border-zinc-800/80 pl-3">
                    <div className="flex flex-col gap-1">
                      <button 
                        type="button"
                        onClick={() => handleMoveUp(idx)}
                        disabled={idx === 0}
                        className="p-1 text-zinc-400 hover:text-white disabled:opacity-20 disabled:pointer-events-none rounded hover:bg-white/5 cursor-pointer transition-colors"
                        title="Mover para cima"
                      >
                        <ChevronUp size={16} />
                      </button>
                      <button 
                        type="button"
                        onClick={() => handleMoveDown(idx)}
                        disabled={idx === fields.length - 1}
                        className="p-1 text-zinc-400 hover:text-white disabled:opacity-20 disabled:pointer-events-none rounded hover:bg-white/5 cursor-pointer transition-colors"
                        title="Mover para baixo"
                      >
                        <ChevronDown size={16} />
                      </button>
                    </div>

                    <button 
                      type="button"
                      onClick={() => handleDeleteField(idx)}
                      className="p-1.5 text-zinc-500 hover:text-red-400 rounded-xl hover:bg-red-500/10 cursor-pointer transition-colors"
                      title="Excluir este campo"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>

        {/* Footer Actions (Fully scalable, prevents overflows) */}
        <div className="mt-5 pt-4 border-t border-zinc-800 flex flex-col sm:flex-row items-center justify-between gap-4 shrink-0 bg-[#121420]">
          <button 
            type="button"
            onClick={handleAddField}
            className="w-full sm:w-auto flex items-center justify-center gap-1.5 text-xs text-emerald-400 hover:text-emerald-300 hover:bg-emerald-500/10 font-bold border border-emerald-500/20 rounded-xl px-4 py-2.5 cursor-pointer transition-all"
          >
            <Plus size={14} />
            Adicionar Campo
          </button>

          <div className="flex items-center gap-2.5 w-full sm:w-auto">
            <button 
              type="button"
              onClick={onClose}
              className="flex-1 sm:flex-initial text-xs text-zinc-400 hover:text-white font-semibold rounded-xl px-4 py-2.5 hover:bg-white/5 cursor-pointer transition-all text-center"
            >
              Cancelar
            </button>
            <button 
              type="button"
              onClick={handleSave}
              className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 text-xs bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-bold rounded-xl px-4.5 py-2.5 cursor-pointer transition-all shadow-[0_0_15px_rgba(16,185,129,0.2)]"
            >
              <Save size={14} />
              Salvar Alterações
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
