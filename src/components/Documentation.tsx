import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Book, Mic, Settings2, Users, Clapperboard, ArrowLeft, CheckCircle2, Server, Brain, Smartphone, Database, Zap, FileAudio, FileText, Network } from 'lucide-react';

export function Documentation({ onBack, onSelectMode }: { onBack: () => void; onSelectMode?: (modeId: string) => void }) {
  const [activeTab, setActiveTab] = useState<'tools' | 'cinema' | 'architecture' | 'tech' | 'catalog'>('tools');

  return (
    <div className="max-w-5xl mx-auto pb-20">
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
            <h1 className="text-3xl font-bold text-white">Manual do CapIAudio</h1>
            <p className="text-zinc-400 mt-1">Guia técnico e prático para profissionais de mídia e facilitadores</p>
          </div>
        </div>

        {/* Navegação Interna */}
        <div className="flex flex-wrap gap-2 mb-8 border-b border-white/10 pb-4">
          <TabButton active={activeTab === 'tools'} onClick={() => setActiveTab('tools')} icon={<Settings2 size={18} />} label="Ferramentas" />
          <TabButton active={activeTab === 'cinema'} onClick={() => setActiveTab('cinema')} icon={<Clapperboard size={18} />} label="Modo Cinema" />
          <TabButton active={activeTab === 'catalog'} onClick={() => setActiveTab('catalog')} icon={<Book size={18} />} label="Catálogo (20 Módulos)" />
          <TabButton active={activeTab === 'architecture'} onClick={() => setActiveTab('architecture')} icon={<Network size={18} />} label="Arquitetura" />
          <TabButton active={activeTab === 'tech'} onClick={() => setActiveTab('tech')} icon={<Zap size={18} />} label="Tecnologias" />
        </div>

        <AnimatePresence mode="wait">
          {activeTab === 'tools' && (
            <motion.div key="tools" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
              <h2 className="text-2xl font-semibold text-white mb-6">Mapa de Ferramentas</h2>
              <p className="text-zinc-300 mb-8 leading-relaxed">
                O CapIAudio foi desenhado para acompanhar o fluxo de trabalho de uma gravação, desde a captação até a pós-produção. Conheça as principais ferramentas:
              </p>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FeatureCard 
                  icon={<Mic className="text-emerald-400" />}
                  title="Gravação com Waveform"
                  description="Captura o áudio diretamente do seu microfone e desenha a onda sonora na tela em tempo real, garantindo que o som está sendo captado corretamente."
                />
                <FeatureCard 
                  icon={<Zap className="text-yellow-400" />}
                  title="Marcação em Tempo Real (Tags)"
                  description="Botões coloridos que você aperta durante a gravação. Eles salvam o tempo exato (ex: 01:23) com uma etiqueta (ex: 'Boa Resposta', 'Erro'). Now supports Undo/Redo e live deletions."
                />
                <FeatureCard 
                  icon={<FileText className="text-cyan-400" />}
                  title="Transcrição com Diarization"
                  description="A Inteligência Artificial ouve o áudio e escreve tudo o que foi dito, separando automaticamente quem está falando (Locutor 1, Locutor 2)."
                />
                <FeatureCard 
                  icon={<Brain className="text-purple-400" />}
                  title="Resumo e Action Items"
                  description="A IA lê a transcrição e os seus marcadores para criar um resumo executivo, listando decisões tomadas e tarefas pendentes."
                />
              </div>
            </motion.div>
          )}

          {activeTab === 'cinema' && (
            <motion.div key="cinema" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
              <h2 className="text-2xl font-semibold text-white mb-6">Deep Dive: Modo Cinema</h2>
              <p className="text-zinc-300 mb-8 leading-relaxed">
                O Modo Cinema foi criado especificamente para sets de filmagem, substituindo o papel e caneta do continuísta e integrando-se diretamente com o diretor.
              </p>

              <div className="bg-black/30 rounded-2xl p-8 border border-white/5 mb-8">
                <div className="flex flex-col md:flex-row gap-8 items-center">
                  <div className="flex-1">
                    <h3 className="text-xl font-medium text-emerald-400 mb-4">A Claquete Digital</h3>
                    <p className="text-zinc-300 text-sm leading-relaxed mb-4">
                      Antes de cada gravação, você preenche os metadados: <strong>Cena</strong>, <strong>Plano</strong> e <strong>Take</strong>. Metadados dinâmicos e customizáveis via Editor de Formulário.
                    </p>
                    <ul className="space-y-3 text-sm text-zinc-400">
                      <li className="flex items-center gap-2"><CheckCircle2 size={16} className="text-emerald-500" /> Sincronização em tempo real com o Diretor.</li>
                      <li className="flex items-center gap-2"><CheckCircle2 size={16} className="text-emerald-500" /> Marcação de "Good Take" (Take Valendo).</li>
                      <li className="flex items-center gap-2"><CheckCircle2 size={16} className="text-emerald-500" /> Relatório diário gerado por IA no final do dia.</li>
                    </ul>
                  </div>
                  <div className="w-full md:w-64 aspect-video bg-zinc-900 rounded-xl border-2 border-zinc-700 flex flex-col overflow-hidden shadow-2xl transform rotate-2">
                    <div className="h-4 bg-stripes-black-white w-full border-b-2 border-zinc-700" style={{ backgroundImage: 'repeating-linear-gradient(45deg, #fff 25%, transparent 25%, transparent 75%, #fff 75%, #fff), repeating-linear-gradient(45deg, #fff 25%, #000 25%, #000 75%, #fff 75%, #fff)', backgroundPosition: '0 0, 10px 10px', backgroundSize: '20px 20px' }}></div>
                    <div className="flex-1 p-3 flex flex-col justify-between">
                      <div className="text-center font-mono text-xs text-zinc-500">PROD. CAPIAUDIO</div>
                      <div className="flex justify-between font-mono text-white">
                        <div><span className="text-[10px] text-zinc-500 block">SCENE</span>12A</div>
                        <div><span className="text-[10px] text-zinc-500 block">SHOT</span>3</div>
                        <div><span className="text-[10px] text-zinc-500 block">TAKE</span>1</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-2xl p-6">
                <h3 className="text-lg font-medium text-emerald-400 mb-2 flex items-center gap-2">
                  <Zap size={20} /> O recurso "Auto-Claquete"
                </h3>
                <p className="text-emerald-100/80 text-sm leading-relaxed">
                  Em vez de anotar manualmente o tempo em que a claquete bateu, você clica no botão "Auto-Claquete" logo após ouvir o "clack". A Inteligência Artificial (Gemini 3.1 Pro) analisa os últimos segundos de áudio, identifica o pico sonoro exato da batida e salva esse milissegundo. Isso permite que o editor de vídeo sincronize imagem e som com precisão cirúrgica na pós-produção.
                </p>
              </div>
            </motion.div>
          )}

          {activeTab === 'catalog' && (
            <motion.div key="catalog" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-8">
              <div>
                <h2 className="text-2xl font-semibold text-white mb-2">Sugestão de 26 Módulos de Fluxo de Trabalho</h2>
                <p className="text-zinc-400 text-sm">Dispostos em categorias funcionais para otimizar suas captações e análises de mídia. Clique para ativar qualquer módulo.</p>
              </div>

              <div className="space-y-6">
                <CategoryGroup title="🎬 Produção de Cinema">
                  <CatalogItem emoji="🎬" name="Set de Filmagem" desc="Específico para gravação de cinema com claquete digital e assistente de continuidade de set." modeId="cinema" onSelect={(id) => { onSelectMode?.(id); onBack(); }} />
                  <CatalogItem emoji="📖" name="Leitura de Roteiro (Table Read)" desc="Anote feedbacks de ritmo, mudanças em falas e atuações de elenco em tempo de leitura." modeId="table_read" onSelect={(id) => { onSelectMode?.(id); onBack(); }} />
                  <CatalogItem emoji="👥" name="Reunião de Direção & Chefes" desc="Gestão visual e alinhamento tático entre Direção, Fotografia (DP), Arte e Figurinos." modeId="dept_heads" onSelect={(id) => { onSelectMode?.(id); onBack(); }} />
                  <CatalogItem emoji="📹" name="Decupagem & Plano de Produção" desc="Análise descritiva de cada plano planejado para as lentes, câmera e pátio." modeId="decupagem" onSelect={(id) => { onSelectMode?.(id); onBack(); }} />
                  <CatalogItem emoji="📍" name="Visitas Técnicas (Scouting)" desc="Mapeamento de fiação, caminho de luz solar e poluição sonora em locações." modeId="scouting" onSelect={(id) => { onSelectMode?.(id); onBack(); }} />
                  <CatalogItem emoji="✂️" name="Briefing de Montagem" desc="Marcas rítmicas de transições de cena e preferências de take para os editores." modeId="briefing_montagem" onSelect={(id) => { onSelectMode?.(id); onBack(); }} />
                  <CatalogItem emoji="🗣️" name="Filme Comentado" desc="Gravação dinâmica para faixas de comentários do diretor, segredos de set e extras." modeId="filme_comentado" onSelect={(id) => { onSelectMode?.(id); onBack(); }} />
                </CategoryGroup>

                <CategoryGroup title="🎥 Audiovisual & Comunicação">
                  <CatalogItem emoji="🎤" name="Jornalismo de Campo" desc="Para reportagens de rua, coletando B-Roll e marcando sonoras de forma a acelerar a edição de vídeo." modeId="journalism" onSelect={(id) => { onSelectMode?.(id); onBack(); }} />
                  <CatalogItem emoji="📻" name="Podcast & Lives" desc="Focado em anfitriões e editores, marcando tópicos principais, risos, inserções e excelentes piadas." modeId="podcast" onSelect={(id) => { onSelectMode?.(id); onBack(); }} />
                  <CatalogItem emoji="📱" name="Criação de Conteúdo (Vlog)" desc="Planejamento de vídeos rápidos para TikTok, Reels ou YouTube, anotando hooks de impacto e transições." modeId="vlog" onSelect={(id) => { onSelectMode?.(id); onBack(); }} />
                </CategoryGroup>

                <CategoryGroup title="👔 Negócios & Trabalho Remoto">
                  <CatalogItem emoji="🤝" name="Reunião de Diretoria" desc="Marcações de ata automática com tarefas (Action Items), responsabilidades e decisões de diretoria." modeId="meeting" onSelect={(id) => { onSelectMode?.(id); onBack(); }} />
                  <CatalogItem emoji="💡" name="Brainstorming & Ideação" desc="Foco na geração de ideias fora da caixa, MVP, descarte rápido e formulação de próximos passos de validação." modeId="brainstorm" onSelect={(id) => { onSelectMode?.(id); onBack(); }} />
                  <CatalogItem emoji="👥" name="Candidato & Recrutamento" desc="Registra entrevistas de emprego, destacando perguntas técnicas, pontos fortes e preocupações identificadas." modeId="recruitment" onSelect={(id) => { onSelectMode?.(id); onBack(); }} />
                  <CatalogItem emoji="📊" name="Apresentações (Sales Pitch)" desc="Acompanha objeções de clientes, destaques do valor da solução e prazos de contrato propostos." modeId="pitch" onSelect={(id) => { onSelectMode?.(id); onBack(); }} />
                </CategoryGroup>

                <CategoryGroup title="🛠️ Operações, Suporte & Vistoria">
                  <CatalogItem emoji="📞" name="Suporte (Sucesso do Cliente)" desc="Captura de relatos de bugs, opiniões sobre UI/UX e citações diretas sobre frustrações do usuário." modeId="support" onSelect={(id) => { onSelectMode?.(id); onBack(); }} />
                  <CatalogItem emoji="📝" name="Workshops & Treinamentos" desc="Dinâmicas presenciais ou virtuais, registrando dúvidas, feedbacks do grupo e exercícios de cooperação." modeId="workshop" onSelect={(id) => { onSelectMode?.(id); onBack(); }} />
                  <CatalogItem emoji="📈" name="Diário de Obra (Engenharia)" desc="Dite relatórios breves de canteiro de obras, catalogando falhas de projeto, avanço físico e uso de insumos." modeId="construction" onSelect={(id) => { onSelectMode?.(id); onBack(); }} />
                  <CatalogItem emoji="🚗" name="Vistoria & Inspeção Técnica" desc="Listas de verificação por voz em inspeções veiculares, prediais ou avaliações de segurança." modeId="inspection" onSelect={(id) => { onSelectMode?.(id); onBack(); }} />
                </CategoryGroup>

                <CategoryGroup title="🧠 Educação, Ciência & Saúde">
                  <CatalogItem emoji="🩺" name="Prontuário Médico (Médico)" desc="Otimização do prontuário eletrônico: sintomas descritos, hipótese diagnóstica e exames solicitados." modeId="medical_doctor" onSelect={(id) => { onSelectMode?.(id); onBack(); }} />
                  <CatalogItem emoji="👨‍🏫" name="Palestras & Aulas" desc="Cai na prova, referências bibliográficas sugeridas, datas de entrega e dúvidas sobre os slides." modeId="lecture" onSelect={(id) => { onSelectMode?.(id); onBack(); }} />
                  <CatalogItem emoji="🔬" name="Pesquisa Laboratorial" desc="Registros de ensaios, hipóteses descartadas, divergência de resultados e dados de alta importância." modeId="research" onSelect={(id) => { onSelectMode?.(id); onBack(); }} />
                  <CatalogItem emoji="✍️" name="Criação Literária" desc="Worldbuilding, criação de personagens, plot twists, furos de roteiro e diálogos memoráveis." modeId="writing" onSelect={(id) => { onSelectMode?.(id); onBack(); }} />
                </CategoryGroup>

                <CategoryGroup title="🏡 Vida Pessoal & Lazer">
                  <CatalogItem emoji="🍻" name="Conversa de Bar" desc="Brinde, gozações, fofocas e aquela filosofia profunda que surge após uma bela cerveja gelada." modeId="bar_conversa" onSelect={(id) => { onSelectMode?.(id); onBack(); }} />
                  <CatalogItem emoji="🎉" name="Planejamento de Festa" desc="Decorações, cardápios, listas de convidados, orçamentos, vaquinhas e atribuições de quem leva o que." modeId="party_planning" onSelect={(id) => { onSelectMode?.(id); onBack(); }} />
                  <CatalogItem emoji="✈️" name="Diário de Bordo (Viagens)" desc="Locais explorados, pratos exóticos, gastos em viagem e impressões imediatas de novos destinos." modeId="travel_diary" onSelect={(id) => { onSelectMode?.(id); onBack(); }} />
                  <CatalogItem emoji="👵" name="Histórias de Família" desc="Entrevistas de história viva, árvore genealógica falada e lembranças de parentesco." modeId="family_history" onSelect={(id) => { onSelectMode?.(id); onBack(); }} />
                </CategoryGroup>
              </div>
            </motion.div>
          )}

          {activeTab === 'architecture' && (
            <motion.div key="architecture" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
              <h2 className="text-2xl font-semibold text-white mb-6">Arquitetura do System</h2>
              <p className="text-zinc-300 mb-8 leading-relaxed">
                Entenda como os dados fluem no CapIAudio, desde a captação no seu dispositivo até o processamento na nuvem.
              </p>

              {/* Diagrama Visual */}
              <div className="relative py-12 mb-12">
                {/* Linhas de conexão */}
                <div className="absolute top-1/2 left-0 w-full h-1 bg-zinc-800 -translate-y-1/2 z-0 hidden md:block"></div>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative z-10">
                  {/* Step 1 */}
                  <div className="bg-zinc-900 p-6 rounded-2xl border border-zinc-700 flex flex-col items-center text-center shadow-xl">
                    <div className="w-16 h-16 bg-blue-500/20 text-blue-400 rounded-full flex items-center justify-center mb-4 border border-blue-500/30">
                      <Smartphone size={32} />
                    </div>
                    <h4 className="text-white font-medium mb-2">1. Cliente (Navegador)</h4>
                    <p className="text-xs text-zinc-400">Captura o áudio (Web Audio API) e registra os cliques nos botões de marcação. Salva tudo localmente no IndexedDB.</p>
                  </div>

                  {/* Step 2 */}
                  <div className="bg-zinc-900 p-6 rounded-2xl border border-zinc-700 flex flex-col items-center text-center shadow-xl">
                    <div className="w-16 h-16 bg-emerald-500/20 text-emerald-400 rounded-full flex items-center justify-center mb-4 border border-emerald-500/30">
                      <Server size={32} />
                    </div>
                    <h4 className="text-white font-medium mb-2">2. Servidor de Sincronia</h4>
                    <p className="text-xs text-zinc-400">Usa WebSockets (Socket.IO) para transmitir os marcadores em tempo real para outros dispositivos na mesma "Sala".</p>
                  </div>

                  {/* Step 3 */}
                  <div className="bg-zinc-900 p-6 rounded-2xl border border-zinc-700 flex flex-col items-center text-center shadow-xl">
                    <div className="w-16 h-16 bg-purple-500/20 text-purple-400 rounded-full flex items-center justify-center mb-4 border border-purple-500/30">
                      <Brain size={32} />
                    </div>
                    <h4 className="text-white font-medium mb-2">3. Google Gemini (IA)</h4>
                    <p className="text-xs text-zinc-400">Recebe o áudio finalizado e os marcadores para gerar a transcrição precisa e os resumos executivos.</p>
                  </div>
                </div>
              </div>

              <div className="bg-black/20 p-6 rounded-2xl border border-white/5">
                <h3 className="text-lg font-medium text-white mb-4 flex items-center gap-2"><Database size={20} className="text-emerald-400" /> Privacidade e Armazenamento</h3>
                <p className="text-sm text-zinc-400 leading-relaxed">
                  Para garantir a segurança dos seus dados, <strong>nenhum áudio é salvo em nossos servidores</strong>. O áudio bruto e os marcadores são salvos no banco de dados interno do seu próprio navegador (IndexedDB). O áudio só sai do seu dispositivo no momento em que você clica em "Gerar Transcrição", sendo enviado de forma criptografada diretamente para a API do Google Gemini, e descartado logo em seguida.
                </p>
              </div>
            </motion.div>
          )}

          {activeTab === 'tech' && (
            <motion.div key="tech" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
              <h2 className="text-2xl font-semibold text-white mb-6">Tecnologias Utilizadas</h2>
              <p className="text-zinc-300 mb-8 leading-relaxed">
                O CapIAudio foi construído utilizando as ferramentas mais modernas do desenvolvimento web para garantir performance e confiabilidade.
              </p>

              <div className="space-y-4">
                <TechItem 
                  title="React 18 & TypeScript" 
                  desc="A base da interface do usuário. O React permite criar componentes interativos, enquanto o TypeScript garante que o código seja seguro e livre de erros inesperados."
                />
                <TechItem 
                  title="Web Audio API & MediaRecorder" 
                  desc="Tecnologias nativas dos navegadores modernos que permitem acessar o microfone, processar o som para desenhar as ondas visuais e gravar o arquivo de áudio de alta qualidade."
                />
                <TechItem 
                  title="Google Gemini AI (@google/genai)" 
                  desc="O cérebro por trás da transcrição e análise. Utilizamos o modelo 'Flash Lite' para transcrições rápidas e o modelo 'Pro' para tarefas complexas como ouvir a batida da claquete."
                />
                <TechItem 
                  title="Socket.IO (WebSockets)" 
                  desc="Permite a comunicação bidirecional em tempo real. É isso que faz com que um marcador criado no notebook do continuísta apareça instantaneamente no tablet do diretor."
                />
                <TechItem 
                  title="IndexedDB (via localforage)" 
                  desc="Um banco de dados robusto que vive dentro do seu navegador. Permite salvar arquivos de áudio pesados (Blobs) sem travar o aplicativo, garantindo que você não perca nada se a internet cair."
                />
                <TechItem 
                  title="Tailwind CSS & Framer Motion" 
                  desc="Responsáveis pelo design elegante e animações fluidas. O Tailwind permite estilizar rapidamente, e o Framer Motion cria as transições suaves entre as telas."
                />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

function TabButton({ active, onClick, icon, label }: { active: boolean, onClick: () => void, icon: React.ReactNode, label: string }) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all ${
        active 
          ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' 
          : 'bg-black/20 text-zinc-400 border border-white/5 hover:bg-white/5 hover:text-white'
      }`}
    >
      {icon}
      {label}
    </button>
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

function TechItem({ title, desc }: { title: string, desc: string }) {
  return (
    <div className="flex gap-4 items-start bg-black/20 p-4 rounded-xl border border-white/5">
      <div className="mt-1 text-emerald-500">
        <CheckCircle2 size={20} />
      </div>
      <div>
        <h4 className="text-white font-medium">{title}</h4>
        <p className="text-sm text-zinc-400 mt-1">{desc}</p>
      </div>
    </div>
  );
}

interface CategoryGroupProps {
  title: string;
  children: React.ReactNode;
}

function CategoryGroup({ title, children }: CategoryGroupProps) {
  return (
    <div className="space-y-3">
      <h3 className="text-sm font-semibold text-zinc-400 tracking-wider uppercase pl-1">{title}</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {children}
      </div>
    </div>
  );
}

interface CatalogItemProps {
  emoji: string;
  name: string;
  desc: string;
  modeId?: string;
  onSelect?: (modeId: string) => void;
}

function CatalogItem({ emoji, name, desc, modeId, onSelect }: CatalogItemProps) {
  const isClickable = !!(modeId && onSelect);
  return (
    <div 
      onClick={() => isClickable && modeId && onSelect(modeId)}
      className={`bg-black/35 border border-white/5 rounded-xl p-4 flex gap-3 transition-all ${
        isClickable
          ? 'cursor-pointer hover:border-emerald-500/40 hover:bg-emerald-500/5 group'
          : 'hover:border-emerald-500/30'
      }`}
    >
      <span className="text-2xl shrink-0 self-start group-hover:scale-105 transition-transform">{emoji}</span>
      <div className="space-y-1 pr-1 relative w-full">
        <h4 className="text-white font-medium text-sm group-hover:text-emerald-400 transition-colors flex items-center gap-2">
          {name}
          {isClickable && (
            <span className="text-[10px] text-emerald-400 font-semibold bg-emerald-500/10 px-1.5 py-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity">
              Ativar
            </span>
          )}
        </h4>
        <p className="text-zinc-400 text-xs leading-relaxed">{desc}</p>
      </div>
    </div>
  );
}
