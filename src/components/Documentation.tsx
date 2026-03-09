import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Book, Image as ImageIcon, Download, ArrowLeft, CheckCircle2, Mic, Settings2, Share2, Users, Clapperboard } from 'lucide-react';
import { generateVisualDescription } from '../services/aiService';

export function Documentation({ onBack }: { onBack: () => void }) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [coverUrl, setCoverUrl] = useState<string | null>(null);
  const [faviconUrl, setFaviconUrl] = useState<string | null>(null);

  const handleGenerateAssets = async () => {
    setIsGenerating(true);
    try {
      const cover = await generateVisualDescription(
        'A professional cover image for an audio recording and transcription web application called CapIAudio. Features a sleek dark mode interface, audio waveforms, and AI transcription concepts. Emerald green and cyan accents. Cinematic lighting, high quality.',
        'gemini-3.1-flash-image-preview',
        '1K'
      );
      
      const favicon = await generateVisualDescription(
        'A minimalist, modern app icon for an audio recording and transcription app called CapIAudio. Clean lines, emerald green and cyan colors, dark background, vector style, simple.',
        'gemini-3.1-flash-image-preview',
        '512px'
      );

      if (cover) setCoverUrl(cover);
      if (favicon) setFaviconUrl(favicon);
    } catch (error) {
      console.error('Erro ao gerar assets:', error);
      alert('Erro ao gerar imagens. Verifique sua API Key.');
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto pb-20">
      <button 
        onClick={onBack}
        className="flex items-center gap-2 text-zinc-400 hover:text-white mb-8 transition-colors"
      >
        <ArrowLeft size={20} />
        Voltar para o App
      </button>

      <div className="bg-[#1e2130] rounded-3xl p-8 md:p-12 border border-white/5 shadow-2xl">
        <div className="flex items-center gap-4 mb-8">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-emerald-400 to-cyan-500 flex items-center justify-center shadow-lg shadow-emerald-500/20">
            <Book size={32} className="text-black" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-white">Documentação CapIAudio</h1>
            <p className="text-zinc-400 mt-1">Guia completo de uso e ferramentas</p>
          </div>
        </div>

        <div className="prose prose-invert max-w-none">
          <p className="text-lg text-zinc-300 leading-relaxed mb-8">
            O <strong>CapIAudio</strong> é um gravador inteligente projetado para entrevistas, reuniões e sets de filmagem. Ele permite marcar momentos importantes em tempo real e utiliza Inteligência Artificial para transcrever e resumir o conteúdo.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
            <FeatureCard 
              icon={<Mic className="text-emerald-400" />}
              title="Gravação e Marcação"
              description="Grave áudio de alta qualidade e use botões personalizáveis para marcar momentos-chave (ex: 'Boa Resposta', 'Erro')."
            />
            <FeatureCard 
              icon={<Settings2 className="text-cyan-400" />}
              title="Layouts Personalizáveis"
              description="Crie seus próprios modos de gravação com botões específicos para o seu fluxo de trabalho."
            />
            <FeatureCard 
              icon={<Users className="text-purple-400" />}
              title="Sincronização em Rede"
              description="Conecte múltiplos dispositivos na mesma sala para sincronizar marcadores e metadados em tempo real."
            />
            <FeatureCard 
              icon={<Clapperboard className="text-pink-400" />}
              title="Modo Cinema & Auto-Claquete"
              description="Metadados de cena/plano/take e detecção automática do som da claquete via IA."
            />
          </div>

          <h2 className="text-2xl font-semibold text-white mb-6 border-b border-white/10 pb-4">Gerador de Assets (Nano Banana 2)</h2>
          <div className="bg-black/30 rounded-2xl p-6 mb-12 border border-white/5">
            <p className="text-zinc-300 mb-6">
              Utilize o modelo <strong>Gemini 3.1 Flash Image Preview (Nano Banana 2)</strong> para gerar a imagem de capa e o favicon oficiais do projeto.
            </p>
            
            <button
              onClick={handleGenerateAssets}
              disabled={isGenerating}
              className="flex items-center gap-2 px-6 py-3 bg-emerald-500 text-zinc-900 font-medium rounded-xl hover:bg-emerald-400 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isGenerating ? (
                <><div className="w-5 h-5 border-2 border-zinc-900 border-t-transparent rounded-full animate-spin" /> Gerando Imagens...</>
              ) : (
                <><ImageIcon size={20} /> Gerar Capa e Favicon</>
              )}
            </button>

            {(coverUrl || faviconUrl) && (
              <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-8">
                {coverUrl && (
                  <div>
                    <h3 className="text-sm font-medium text-zinc-400 mb-3">Imagem de Capa (cover.png)</h3>
                    <img src={coverUrl} alt="Cover" className="w-full rounded-xl border border-white/10" />
                    <a href={coverUrl} download="cover.png" className="mt-3 flex items-center justify-center gap-2 w-full py-2 bg-white/10 hover:bg-white/20 rounded-lg text-sm transition-colors">
                      <Download size={16} /> Baixar Capa
                    </a>
                  </div>
                )}
                {faviconUrl && (
                  <div>
                    <h3 className="text-sm font-medium text-zinc-400 mb-3">Favicon (favicon.png)</h3>
                    <div className="bg-zinc-800 p-8 rounded-xl border border-white/10 flex items-center justify-center">
                      <img src={faviconUrl} alt="Favicon" className="w-32 h-32 rounded-2xl shadow-2xl" />
                    </div>
                    <a href={faviconUrl} download="favicon.png" className="mt-3 flex items-center justify-center gap-2 w-full py-2 bg-white/10 hover:bg-white/20 rounded-lg text-sm transition-colors">
                      <Download size={16} /> Baixar Favicon
                    </a>
                  </div>
                )}
              </div>
            )}
          </div>

          <h2 className="text-2xl font-semibold text-white mb-6 border-b border-white/10 pb-4">Mapa do App</h2>
          <div className="space-y-4 mb-12">
            <MapItem title="1. Tela de Gravação" desc="Interface principal onde você inicia a gravação, visualiza o tempo e clica nos botões de marcação." />
            <MapItem title="2. Tela de Resultados" desc="Aparece após parar a gravação. Permite ouvir o áudio, ver a timeline de marcadores e gerar a transcrição/resumo com IA." />
            <MapItem title="3. Histórico" desc="Lista de todas as gravações anteriores salvas no navegador, com opções para rever, exportar ou excluir." />
            <MapItem title="4. Configurações" desc="Modal para inserir a API Key do Gemini, escolher modelos de imagem e definir a Sala de Sincronização." />
          </div>

          <h2 className="text-2xl font-semibold text-white mb-6 border-b border-white/10 pb-4">Compartilhamento (WhatsApp & Redes Sociais)</h2>
          <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-2xl p-6">
            <p className="text-emerald-100 mb-4">
              O aplicativo já está configurado com as <strong>Meta Tags Open Graph</strong> corretas para ficar bonito ao ser compartilhado no WhatsApp, Facebook e Twitter.
            </p>
            <ul className="list-disc list-inside text-emerald-200/80 space-y-2">
              <li>Título e Descrição otimizados.</li>
              <li>Imagem de capa (cover.png) no tamanho ideal (1200x630).</li>
              <li>Favicon configurado.</li>
              <li>Cor de tema adaptada para o modo escuro.</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}

function FeatureCard({ icon, title, description }: { icon: React.ReactNode, title: string, description: string }) {
  return (
    <div className="bg-black/20 p-6 rounded-2xl border border-white/5 hover:border-white/10 transition-colors">
      <div className="w-12 h-12 rounded-xl bg-white/5 flex items-center justify-center mb-4">
        {icon}
      </div>
      <h3 className="text-lg font-medium text-white mb-2">{title}</h3>
      <p className="text-sm text-zinc-400 leading-relaxed">{description}</p>
    </div>
  );
}

function MapItem({ title, desc }: { title: string, desc: string }) {
  return (
    <div className="flex gap-4 items-start">
      <div className="mt-1 text-emerald-500">
        <CheckCircle2 size={20} />
      </div>
      <div>
        <h4 className="text-white font-medium">{title}</h4>
        <p className="text-sm text-zinc-400">{desc}</p>
      </div>
    </div>
  );
}
