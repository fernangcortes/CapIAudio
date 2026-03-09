import React, { useEffect, useState } from 'react';
import { getAllSessions, deleteSession, getAllModes, getCinemaProjects } from '../services/storageService';
import { RecordingSession, ModeConfig, CinemaProject } from '../types';
import { ResultScreen } from './ResultScreen';
import { motion, AnimatePresence } from 'motion/react';
import { Clock, Calendar, ChevronLeft, Trash2, PlayCircle, Folder, Download, Sparkles, Loader2 } from 'lucide-react';
import { exportProjectToZip } from '../services/exportService';
import { generateDailySummary } from '../services/aiService';
import Markdown from 'react-markdown';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

interface HistoryScreenProps {
  onBack: () => void;
  onResumeSession: (session: RecordingSession) => void;
}

export function HistoryScreen({ onBack, onResumeSession }: HistoryScreenProps) {
  const [sessions, setSessions] = useState<RecordingSession[]>([]);
  const [projects, setProjects] = useState<CinemaProject[]>([]);
  const [selectedSession, setSelectedSession] = useState<RecordingSession | null>(null);
  const [activeTab, setActiveTab] = useState<'sessions' | 'projects' | 'diarias'>('sessions');
  const [isExporting, setIsExporting] = useState(false);
  const [isGeneratingSummary, setIsGeneratingSummary] = useState<string | null>(null);
  const [dailySummaries, setDailySummaries] = useState<Record<string, string>>({});
  const modes = getAllModes();

  useEffect(() => {
    loadSessions();
    loadProjects();
  }, []);

  const loadSessions = async () => {
    try {
      const data = await getAllSessions();
      setSessions(data);
    } catch (error) {
      console.error('Erro ao carregar histórico:', error);
    }
  };

  const loadProjects = async () => {
    try {
      const data = await getCinemaProjects();
      setProjects(data);
    } catch (error) {
      console.error('Erro ao carregar projetos:', error);
    }
  };

  const handleExportProject = async (project: CinemaProject) => {
    try {
      setIsExporting(true);
      await exportProjectToZip(project);
    } catch (error) {
      console.error('Erro ao exportar projeto:', error);
      alert('Erro ao exportar projeto. Verifique o console para mais detalhes.');
    } finally {
      setIsExporting(false);
    }
  };

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm('Tem certeza que deseja excluir esta gravação?')) {
      await deleteSession(id);
      await loadSessions();
      if (selectedSession?.id === id) {
        handleBackToHistory();
      }
    }
  };

  const handleSelect = (session: RecordingSession) => {
    setSelectedSession(session);
  };

  const handleBackToHistory = () => {
    setSelectedSession(null);
  };

  const formatDuration = (seconds: number) => {
    const m = Math.floor(seconds / 60).toString().padStart(2, '0');
    const s = Math.floor(seconds % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (selectedSession) {
    return (
      <motion.div 
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: -20 }}
      >
        <button 
          onClick={handleBackToHistory}
          className="mb-6 flex items-center gap-2 text-zinc-400 hover:text-white transition-colors"
        >
          <ChevronLeft size={20} /> Voltar para Histórico
        </button>
        
        <ResultScreen
          session={selectedSession}
          onReset={onBack}
          onResume={() => {
            onResumeSession(selectedSession);
          }}
        />
      </motion.div>
    );
  }

  const handleExportBoletim = (date: string, daySessions: RecordingSession[]) => {
    const doc = new jsPDF('landscape');
    
    // Title
    doc.setFontSize(20);
    doc.text(`Boletim de Câmera (Daily Report)`, 14, 22);
    
    // Subtitle / Date
    doc.setFontSize(12);
    doc.setTextColor(100);
    doc.text(`Data: ${date}`, 14, 30);
    
    // Project Name (if available from the first session)
    const projectName = daySessions[0]?.cinemaMetadata?.movieName || 'Projeto Desconhecido';
    doc.text(`Projeto: ${projectName}`, 14, 36);

    // Table Data
    const tableColumn = ["Cena", "Plano", "Take", "Duração", "Good Take?", "Notas de Continuidade", "Erros/Problemas"];
    const tableRows: any[] = [];

    daySessions.forEach(s => {
      const meta = s.cinemaMetadata;
      if (!meta) return;
      
      const goodTake = meta.goodTake ? "SIM" : "NÃO";
      const duration = formatDuration(s.duration);
      
      const notas = s.markers
        .filter(m => m.type === 'cinema_note' || m.type === 'cinema_good')
        .map(m => m.data || m.label)
        .join('\n');
        
      const problemas = s.markers
        .filter(m => m.type === 'cinema_error')
        .map(m => m.data || m.label)
        .join('\n');

      tableRows.push([
        meta.scene || '-',
        meta.shot || '-',
        meta.take || '-',
        duration,
        goodTake,
        notas || '-',
        problemas || '-'
      ]);
    });

    autoTable(doc, {
      head: [tableColumn],
      body: tableRows,
      startY: 45,
      styles: { fontSize: 10, cellPadding: 3 },
      headStyles: { fillColor: [16, 185, 129] }, // Emerald 500
      columnStyles: {
        0: { cellWidth: 20 }, // Cena
        1: { cellWidth: 20 }, // Plano
        2: { cellWidth: 20 }, // Take
        3: { cellWidth: 25 }, // Duração
        4: { cellWidth: 25 }, // Good Take
        5: { cellWidth: 'auto' }, // Notas
        6: { cellWidth: 'auto' }  // Problemas
      },
      didParseCell: function(data) {
        // Highlight Good Takes
        if (data.section === 'body' && data.column.index === 4) {
          if (data.cell.raw === 'SIM') {
            data.cell.styles.textColor = [16, 185, 129]; // Emerald
            data.cell.styles.fontStyle = 'bold';
          }
        }
      }
    });

    // Save the PDF
    doc.save(`Boletim_Camera_${date.replace(/\//g, '-')}.pdf`);
  };

  // Group sessions by day for 'diarias' tab
  const diarias = sessions.reduce((acc, session) => {
    if (session.modeId !== 'cinema') return acc;
    const dateStr = new Date(session.date).toLocaleDateString('pt-BR');
    if (!acc[dateStr]) acc[dateStr] = [];
    acc[dateStr].push(session);
    return acc;
  }, {} as Record<string, RecordingSession[]>);

  const handleGenerateSummary = async (date: string, daySessions: RecordingSession[]) => {
    setIsGeneratingSummary(date);
    const summary = await generateDailySummary(daySessions);
    setDailySummaries(prev => ({ ...prev, [date]: summary }));
    setIsGeneratingSummary(null);
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-4xl mx-auto pb-20"
    >
      <div className="flex items-center justify-between mb-8">
        <h2 className="text-3xl font-semibold text-white flex items-center gap-3">
          <Clock className="text-emerald-500" size={32} />
          Histórico
        </h2>
        <button 
          onClick={onBack}
          className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-white rounded-xl transition-colors font-medium"
        >
          Voltar
        </button>
      </div>

      <div className="flex gap-4 mb-8 border-b border-zinc-800 pb-4">
        <button
          onClick={() => setActiveTab('sessions')}
          className={`px-4 py-2 rounded-xl font-medium transition-colors ${activeTab === 'sessions' ? 'bg-emerald-500/20 text-emerald-400' : 'text-zinc-400 hover:text-white hover:bg-zinc-800'}`}
        >
          Todas as Gravações
        </button>
        <button
          onClick={() => setActiveTab('projects')}
          className={`px-4 py-2 rounded-xl font-medium transition-colors ${activeTab === 'projects' ? 'bg-emerald-500/20 text-emerald-400' : 'text-zinc-400 hover:text-white hover:bg-zinc-800'}`}
        >
          Projetos de Cinema
        </button>
        <button
          onClick={() => setActiveTab('diarias')}
          className={`px-4 py-2 rounded-xl font-medium transition-colors ${activeTab === 'diarias' ? 'bg-emerald-500/20 text-emerald-400' : 'text-zinc-400 hover:text-white hover:bg-zinc-800'}`}
        >
          Diárias (Boletim)
        </button>
      </div>

      {activeTab === 'sessions' && (
        sessions.length === 0 ? (
          <div className="text-center py-20 bg-zinc-900/50 rounded-3xl border border-zinc-800">
            <p className="text-zinc-500 text-lg">Nenhuma gravação encontrada.</p>
          </div>
        ) : (
          <div className="grid gap-4">
            {sessions.map((session) => {
              const mode = modes[session.modeId];
              return (
                <motion.div
                  key={session.id}
                  layoutId={session.id}
                  onClick={() => handleSelect(session)}
                  className="group bg-zinc-900/50 hover:bg-zinc-800 border border-zinc-800 hover:border-emerald-500/30 p-5 rounded-2xl cursor-pointer transition-all flex items-center justify-between"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full bg-zinc-800 group-hover:bg-emerald-500/10 flex items-center justify-center text-2xl transition-colors">
                      {mode?.icon || '🎤'}
                    </div>
                    <div>
                      <h3 className="text-white font-medium text-lg flex items-center gap-2">
                        {session.title || mode?.name || 'Gravação'}
                        <span className="text-xs text-zinc-500 bg-zinc-800 px-2 py-0.5 rounded-full border border-zinc-700">
                          {formatDuration(session.duration || 0)}
                        </span>
                      </h3>
                      <p className="text-zinc-500 text-sm flex items-center gap-2 mt-1">
                        <Calendar size={14} />
                        {formatDate(session.date)}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    <div className="hidden sm:block text-right mr-4">
                      <p className="text-xs text-zinc-500 uppercase tracking-wider mb-1">Resumo</p>
                      <p className="text-zinc-400 text-sm max-w-[200px] truncate">
                        {session.summary || 'Sem resumo'}
                      </p>
                    </div>
                    
                    <button 
                      onClick={(e) => handleDelete(session.id, e)}
                      className="p-3 text-zinc-500 hover:text-red-500 hover:bg-red-500/10 rounded-xl transition-colors"
                      title="Excluir"
                    >
                      <Trash2 size={20} />
                    </button>
                    
                    <div className="p-3 text-emerald-500 bg-emerald-500/10 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity">
                      <PlayCircle size={24} />
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )
      )}

      {activeTab === 'projects' && (
        projects.length === 0 ? (
          <div className="text-center py-20 bg-zinc-900/50 rounded-3xl border border-zinc-800">
            <p className="text-zinc-500 text-lg">Nenhum projeto de cinema encontrado.</p>
          </div>
        ) : (
          <div className="grid gap-4">
            {projects.map((project) => {
              const projectSessions = sessions.filter(s => s.cinemaMetadata?.projectId === project.id);
              return (
                <motion.div
                  key={project.id}
                  className="bg-zinc-900/50 border border-zinc-800 p-5 rounded-2xl flex items-center justify-between"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-zinc-800 rounded-xl flex items-center justify-center text-2xl text-emerald-500">
                      <Folder size={24} />
                    </div>
                    <div>
                      <h3 className="text-lg font-medium text-white mb-1">
                        {project.name}
                      </h3>
                      <div className="flex items-center gap-4 text-sm text-zinc-500">
                        <span>{project.scenes.length} Cenas</span>
                        <span>{project.scenes.reduce((acc, s) => acc + s.shots.length, 0)} Planos</span>
                        <span>{projectSessions.length} Takes (Gravações)</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    <button 
                      onClick={() => handleExportProject(project)}
                      disabled={isExporting}
                      className="flex items-center gap-2 px-4 py-2 bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500/20 rounded-xl transition-colors font-medium disabled:opacity-50"
                      title="Exportar Projeto (ZIP)"
                    >
                      <Download size={18} />
                      {isExporting ? 'Exportando...' : 'Exportar ZIP'}
                    </button>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )
      )}

      {activeTab === 'diarias' && (
        Object.keys(diarias).length === 0 ? (
          <div className="text-center py-20 bg-zinc-900/50 rounded-3xl border border-zinc-800">
            <p className="text-zinc-500 text-lg">Nenhuma diária de cinema encontrada.</p>
          </div>
        ) : (
          <div className="grid gap-4">
            {Object.entries(diarias).map(([date, daySessions]) => (
              <motion.div
                key={date}
                className="bg-zinc-900/50 border border-zinc-800 p-5 rounded-2xl flex flex-col gap-4"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-zinc-800 rounded-xl flex items-center justify-center text-2xl text-emerald-500">
                      <Calendar size={24} />
                    </div>
                    <div>
                      <h3 className="text-lg font-medium text-white mb-1">
                        Diária - {date}
                      </h3>
                      <div className="flex items-center gap-4 text-sm text-zinc-500">
                        <span>{daySessions.length} Takes Gravados</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    <button 
                      onClick={() => handleGenerateSummary(date, daySessions)}
                      disabled={isGeneratingSummary === date}
                      className="flex items-center gap-2 px-4 py-2 bg-indigo-500/10 text-indigo-400 hover:bg-indigo-500/20 rounded-xl transition-colors font-medium disabled:opacity-50"
                      title="Gerar Resumo da Diária com IA"
                    >
                      {isGeneratingSummary === date ? <Loader2 size={18} className="animate-spin" /> : <Sparkles size={18} />}
                      Resumo IA
                    </button>
                    <button 
                      onClick={() => handleExportBoletim(date, daySessions)}
                      className="flex items-center gap-2 px-4 py-2 bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500/20 rounded-xl transition-colors font-medium"
                      title="Exportar Boletim de Continuidade (CSV)"
                    >
                      <Download size={18} />
                      Exportar Boletim
                    </button>
                  </div>
                </div>

                {dailySummaries[date] && (
                  <div className="mt-4 p-6 bg-zinc-800/50 rounded-xl border border-zinc-700/50">
                    <h4 className="text-emerald-400 font-medium mb-4 flex items-center gap-2">
                      <Sparkles size={16} /> Resumo da Diária (IA)
                    </h4>
                    <div className="prose prose-invert prose-sm max-w-none text-zinc-300">
                      <Markdown>{dailySummaries[date]}</Markdown>
                    </div>
                  </div>
                )}
              </motion.div>
            ))}
          </div>
        )
      )}
    </motion.div>
  );
}
