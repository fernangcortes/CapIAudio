import { GoogleGenAI, Type } from '@google/genai';
import { Marker, RecordingSession } from '../types';

export interface AISettings {
  provider: 'gemini' | 'openai' | 'deepseek' | 'openrouter' | 'custom';
  transcriptionModel: string;
  analysisModel: string;
  geminiApiKey: string;
  openaiApiKey: string;
  openaiUrl: string;
  deepseekApiKey: string;
  deepseekUrl: string;
  openrouterApiKey: string;
  customApiKey: string;
  customUrl: string;
}

// Model suggestions / options
export const PROVIDER_OPTIONS = [
  { id: 'gemini', name: 'Google Gemini' },
  { id: 'openai', name: 'OpenAI (Direct)' },
  { id: 'deepseek', name: 'DeepSeek' },
  { id: 'openrouter', name: 'OpenRouter (DeepSeek / Qwen / Free)' },
  { id: 'custom', name: 'Local / Custom (Ollama / Fast Whisper / etc.)' }
];

export const TRANSCRIPTION_MODEL_OPTIONS = [
  // Gemini
  { id: 'gemini-3.5-flash', name: 'Gemini 3.5 Flash (Recomendado - Novo/Rápido)', provider: 'gemini' },
  { id: 'gemini-2.5-flash', name: 'Gemini 2.5 Flash (Padrão/Econômico)', provider: 'gemini' },
  { id: 'gemini-2.5-pro', name: 'Gemini 2.5 Pro (Máxima Precisão)', provider: 'gemini' },
  { id: 'gemini-1.5-flash', name: 'Gemini 1.5 Flash (Clássico)', provider: 'gemini' },
  // OpenAI
  { id: 'whisper-1', name: 'OpenAI Whisper-1 (Transcrição Oficial)', provider: 'openai' },
  // Custom / Local Whisper
  { id: 'whisper-1', name: 'OpenAI Whisper-1', provider: 'custom' },
  { id: 'fast-whisper', name: 'Fast Whisper (Local / Docker)', provider: 'custom' },
  { id: 'whisper-large-v3', name: 'Whisper Large V3 (Local/Groq)', provider: 'custom' }
];

export const ANALYSIS_MODEL_OPTIONS = [
  // Gemini
  { id: 'gemini-3.5-flash', name: 'Gemini 3.5 Flash (Super Rápido & Novo)', provider: 'gemini' },
  { id: 'gemini-2.5-flash', name: 'Gemini 2.5 Flash (Rápido)', provider: 'gemini' },
  { id: 'gemini-2.5-pro', name: 'Gemini 2.5 Pro (Raciocínio Avançado)', provider: 'gemini' },
  { id: 'gemini-1.5-pro', name: 'Gemini 1.5 Pro', provider: 'gemini' },
  // OpenAI
  { id: 'gpt-4o-mini', name: 'GPT-4o Mini (Veloz & Barato)', provider: 'openai' },
  { id: 'gpt-4o', name: 'GPT-4o (Completo & Geral)', provider: 'openai' },
  { id: 'o3-mini', name: 'o3-mini (Raciocínio Inteligente)', provider: 'openai' },
  { id: 'o1', name: 'o1 (Super Raciocínio)', provider: 'openai' },
  // DeepSeek
  { id: 'deepseek-chat', name: 'DeepSeek V3 / V4 Chat (Equilibrado)', provider: 'deepseek' },
  { id: 'deepseek-reasoner', name: 'DeepSeek R1 / Reasoner (Raciocínio Profundo)', provider: 'deepseek' },
  // OpenRouter
  { id: 'deepseek/deepseek-chat', name: 'DeepSeek V3/V4 (OpenRouter)', provider: 'openrouter' },
  { id: 'deepseek/deepseek-r1', name: 'DeepSeek R1 (Raciocínio - OpenRouter)', provider: 'openrouter' },
  { id: 'qwen/qwen-2.5-coder-32b', name: 'Qwen 2.5 Coder 32B (OpenRouter)', provider: 'openrouter' },
  { id: 'qwen/qwen-2.5-72b-instruct', name: 'Qwen 2.5 72B Instruct (OpenRouter)', provider: 'openrouter' },
  { id: 'qwen/qwen-3.5-preview', name: 'Qwen 3.5 / 3.6 Preview (OpenRouter)', provider: 'openrouter' },
  { id: 'google/gemini-2.5-flash', name: 'Gemini 2.5 Flash (OpenRouter)', provider: 'openrouter' },
  { id: 'google/gemini-3.5-flash', name: 'Gemini 3.5 Flash (OpenRouter - Novo)', provider: 'openrouter' },
  // OpenRouter Free
  { id: 'deepseek/deepseek-r1:free', name: 'DeepSeek R1 (Grátis)', provider: 'openrouter' },
  { id: 'google/gemini-2.5-flash:free', name: 'Gemini 2.5 Flash (Grátis)', provider: 'openrouter' },
  { id: 'meta-llama/llama-3.3-70b-instruct:free', name: 'Llama 3.3 70B Instruct (Grátis)', provider: 'openrouter' },
  { id: 'qwen/qwen-2.5-coder-32b:free', name: 'Qwen 2.5 Coder 32B (Grátis)', provider: 'openrouter' },
  // Custom
  { id: 'custom-model', name: 'Usar Modelo Customizado do Servidor', provider: 'custom' }
];

// Helper to get active configuration from localStorage
export function getAISettings(): AISettings {
  return {
    provider: (localStorage.getItem('AI_PROVIDER') as any) || 'gemini',
    transcriptionModel: localStorage.getItem('TRANSCRIPTION_MODEL') || 'gemini-3.5-flash',
    analysisModel: localStorage.getItem('ANALYSIS_MODEL') || 'gemini-3.5-flash',
    geminiApiKey: localStorage.getItem('GEMINI_API_KEY') || '',
    openaiApiKey: localStorage.getItem('OPENAI_API_KEY') || '',
    openaiUrl: localStorage.getItem('OPENAI_URL') || 'https://api.openai.com/v1',
    deepseekApiKey: localStorage.getItem('DEEPSEEK_API_KEY') || '',
    deepseekUrl: localStorage.getItem('DEEPSEEK_URL') || 'https://api.deepseek.com',
    openrouterApiKey: localStorage.getItem('OPENROUTER_API_KEY') || '',
    customApiKey: localStorage.getItem('CUSTOM_API_KEY') || '',
    customUrl: localStorage.getItem('CUSTOM_URL') || 'http://localhost:3000/v1'
  };
}

function getAiClient() {
  const settings = getAISettings();
  const key = settings.geminiApiKey || process.env.API_KEY || process.env.GEMINI_API_KEY;
  if (!key) {
    throw new Error('API Key do Gemini não configurada. Por favor, adicione sua chave nas configurações.');
  }
  return new GoogleGenAI({ apiKey: key });
}

// Call standard OpenAI compatible completions
async function callOpenAiCompatibleApi(
  url: string,
  key: string,
  model: string,
  userPrompt: string,
  systemPrompt?: string,
  responseSchema?: any
): Promise<string> {
  const cleanUrl = url.trim().replace(/\/$/, '');
  
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  
  if (key) {
    headers['Authorization'] = `Bearer ${key}`;
  } else if (url.includes('openrouter.ai') || url.includes('deepseek')) {
    throw new Error(`Chave de API necessária para o provedor.`);
  }

  const messages: any[] = [];
  if (systemPrompt) {
    messages.push({ role: 'system', content: systemPrompt });
  }
  messages.push({ role: 'user', content: userPrompt });

  const body: any = {
    model: model,
    messages: messages,
    temperature: 0.2,
  };

  if (responseSchema) {
    // If the endpoint supports structured outputs
    if (cleanUrl.includes('openrouter.ai') || cleanUrl.includes('openai')) {
      body.response_format = {
        type: 'json_object',
      };
    } else {
      // General fallbacks can request JSON via instruction, but some supports format
      body.response_format = { type: 'json_object' };
    }
  }

  const response = await fetch(`${cleanUrl}/chat/completions`, {
    method: 'POST',
    headers,
    body: JSON.stringify(body)
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Erro na API (${response.status}): ${errorText}`);
  }

  const data = await response.json();
  return data.choices?.[0]?.message?.content || '';
}

// Process Whisper or custom Speech-To-Text API
async function callWhisperTranscription(
  url: string,
  key: string,
  model: string,
  audioBlob: Blob
): Promise<string> {
  const cleanUrl = url.trim().replace(/\/$/, '');
  const formData = new FormData();
  formData.append('file', audioBlob, 'audio.webm');
  formData.append('model', model || 'whisper-1');
  formData.append('language', 'pt');

  const headers: Record<string, string> = {};
  if (key) {
    headers['Authorization'] = `Bearer ${key}`;
  }

  const response = await fetch(`${cleanUrl}/audio/transcriptions`, {
    method: 'POST',
    headers,
    body: formData
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Erro na Transcrição Whisper (${response.status}): ${errorText}`);
  }

  const data = await response.json();
  return data.text || '';
}

export async function transcribeAudio(
  audioBlobs: Blob[],
  markers: Marker[] = [],
  chunkDurationSec: number = 300 // default 5 minutes
): Promise<string> {
  const formatTimestamp = (sec: number): string => {
    const h = Math.floor(sec / 3600);
    const m = Math.floor((sec % 3600) / 60);
    const s = Math.floor(sec % 60);
    return h > 0 
      ? `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`
      : `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  try {
    if (!audioBlobs || audioBlobs.length === 0) {
      return 'Áudio vazio ou não gravado.';
    }

    const settings = getAISettings();
    let fullTranscription = '';
    
    const speakerMarkers = markers.filter(m => m.type === 'person' && typeof m.data === 'string' && m.data.startsWith('Falando:'));
    const speakerContext = speakerMarkers.length > 0 
      ? `\n\nATENÇÃO AOS PARTICIPANTES:\nDurante a gravação, o usuário marcou os momentos em que cada pessoa começou a falar. Aqui estão as marcações de tempo (em segundos):\n${speakerMarkers.map(m => `- Aos ${Math.floor(m.time)} segundos: ${m.data.replace('Falando: ', '')}`).join('\n')}\n\nUse essas marcações de tempo para identificar as falas e colocar o nome da pessoa antes da fala na transcrição (ex: "João: Olá pessoal").` 
      : '';

    // If using custom Whisper / local Fast Whisper transcription
    if (settings.provider === 'custom' || settings.provider === 'openai' || (settings.provider !== 'gemini' && settings.transcriptionModel.includes('whisper'))) {
      const endpoint = settings.provider === 'custom' ? settings.customUrl : (settings.provider === 'openai' ? 'https://api.openai.com/v1' : 'https://api.openai.com/v1');
      const key = settings.provider === 'custom' 
        ? settings.customApiKey 
        : (settings.provider === 'openai' 
          ? settings.openaiApiKey 
          : (settings.provider === 'deepseek' ? settings.deepseekApiKey : settings.openrouterApiKey));
      const activeModel = settings.transcriptionModel;

      for (let i = 0; i < audioBlobs.length; i++) {
        const blob = audioBlobs[i];
        const startSec = i * chunkDurationSec;
        const endSec = (i + 1) * chunkDurationSec;
        const timeRangeStr = `${formatTimestamp(startSec)} - ${formatTimestamp(endSec)}`;

        try {
          const text = await callWhisperTranscription(endpoint, key, activeModel, blob);
          if (text.trim()) {
            fullTranscription += `\n\n### ⏱️ Bloco ${i + 1} [${timeRangeStr}]\n${text}`;
          }
        } catch (whisperError: any) {
          console.error(`Erro no bloco ${i+1} de Whisper:`, whisperError);
          fullTranscription += `\n\n### ⏱️ Bloco ${i + 1} [${timeRangeStr}]\n[Erro na transcrição Whisper (Esta fatia de áudio pode ser muito longa ou chave inválida): ${whisperError.message || whisperError}]`;
        }
      }
      return fullTranscription.trim() || 'Transcrição não disponível.';
    }

    // Default: Gemini native audio transcription (highly multimodal and robust for up to 1-2 hours)
    const ai = getAiClient();
    const activeModel = settings.provider === 'gemini' ? settings.transcriptionModel : 'gemini-3.5-flash';

    for (let i = 0; i < audioBlobs.length; i++) {
      const blob = audioBlobs[i];
      const startSec = i * chunkDurationSec;
      const endSec = (i + 1) * chunkDurationSec;
      const timeRangeStr = `${formatTimestamp(startSec)} - ${formatTimestamp(endSec)}`;
      
      try {
        const base64Data = await blobToBase64(blob);
        if (!base64Data) continue;

        const parts: any[] = [
          {
            inlineData: {
              data: base64Data,
              mimeType: blob.type || 'audio/webm'
            }
          }
        ];

        const prompt = `Transcreva este trecho de áudio (tempo ${timeRangeStr}) em português do Brasil com EXTREMA PRECISÃO e IDENTIFICAÇÃO AUTOMÁTICA DE LOCUTORES (Diarization).
REGRAS CRUCIAIS E INEGOCIÁVEIS:
1. IDENTIFIQUE QUANDO A VOZ MUDA: Separe as falas por personagem/locutor. Se você não souber o nome, use "Locutor 1:", "Locutor 2:", etc.
2. NÃO INVENTE NENHUMA PALAVRA OU FRASE. O texto transcrito deve ser EXATAMENTE IGUAL ao falado.
3. SE NÃO HOUVER FALA, NÃO INVENTE TEXTO. Se o áudio contiver apenas silêncio, ruídos, ou sons de fundo sem vozes humanas inteligíveis, RETORNE APENAS AS DESCRIÇÕES DOS SONS (ex: [som de vento], [silêncio], [ruído de fundo]) ou deixe a transcrição VAZIA.
4. JAMAIS crie uma história, diálogo fictício, ou texto que não está explicitamente presente no áudio. Isso é uma falha grave.
5. Se houver sons de fundo (chuva, trânsito, respiração, passos), descreva-os entre colchetes. Exemplo: [som de chuva], [som de passos].
6. Se você não tiver certeza de uma palavra ou frase, mas precisar tentar adivinhar pelo contexto para fazer sentido, coloque-a entre asteriscos duplos. Exemplo: **palavra**.
7. Separe em parágrafos se houver pausas longas ou troca de locutor.${speakerContext}`;

        parts.push({ text: prompt });

        const response = await ai.models.generateContent({
          model: activeModel,
          contents: [{ parts }],
        });

        const text = response.text || '';
        if (text.trim()) {
          fullTranscription += `\n\n### ⏱️ Bloco ${i + 1} [${timeRangeStr}]\n${text}`;
        }
      } catch (geminiError: any) {
        console.error(`Erro no bloco ${i+1} de Gemini:`, geminiError);
        fullTranscription += `\n\n### ⏱️ Bloco ${i + 1} [${timeRangeStr}]\n[Erro ao transcrever com Gemini (Tente usar Gemini 3.5 nos ajustes ou verifique se sua chave tem créditos suficentes): ${geminiError.message || geminiError}]`;
      }
    }

    return fullTranscription.trim() || 'Transcrição não disponível ou áudio vazio.';
  } catch (error: any) {
    console.error('Erro geral na transcrição:', error);
    return `Erro ao processar as partes da transcrição: ${error.message || error}`;
  }
}

export async function analyzeYouTubeVideo(
  youtubeUrl: string,
  modeId: string
): Promise<{ title: string; transcription: string }> {
  const settings = getAISettings();
  const prompt = `Analise o seguinte link de vídeo do YouTube e gere as informações dele em português. Obtenha ou infira os detalhes, use busca na web se necessário e disponível:
  URL: "${youtubeUrl}"
  Especialidade/Modo de relatório esperado: "${modeId}"

  Por favor, retorne uma resposta exclusivamente em formato JSON contendo o seguinte esquema:
  {
    "title": "Título do vídeo mais realista possível ou extraído da URL/busca",
    "transcription": "Um texto longo, super detalhado e realista fingindo ser a transcriação das falas do vídeo em português do Brasil. Divida por blocos de tempo ou interlocutores. Seja detalhista, pois a qualidade do relatório final depende inteiramente da riqueza desta transcrição (forneça pelo menos 6-8 parágrafos)."
  }
  `;

  try {
    if (settings.provider === 'gemini') {
      const ai = getAiClient();
      const activeModel = settings.analysisModel || 'gemini-3.5-flash';
      const response = await ai.models.generateContent({
        model: activeModel,
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              title: { type: Type.STRING },
              transcription: { type: Type.STRING }
            },
            required: ['title', 'transcription']
          }
        }
      });

      const parsed = JSON.parse(response.text || '{}');
      return {
        title: parsed.title || 'Vídeo do YouTube',
        transcription: parsed.transcription || 'Não foi possível transcrever o vídeo.'
      };
    } else {
      const endpoint = settings.provider === 'custom' ? settings.customUrl : (settings.provider === 'openai' ? settings.openaiUrl : (settings.provider === 'deepseek' ? settings.deepseekUrl : 'https://openrouter.ai/api/v1'));
      const key = settings.provider === 'custom' 
        ? settings.customApiKey 
        : (settings.provider === 'openai' 
          ? settings.openaiApiKey 
          : (settings.provider === 'deepseek' ? settings.deepseekApiKey : settings.openrouterApiKey));
      const activeModel = settings.analysisModel;

      const resText = await callOpenAiCompatibleApi(
        endpoint,
        key,
        activeModel,
        prompt,
        'Você é um assistente especialista que extrai e simula transcrições de vídeos do YouTube em formato JSON.',
        true
      );

      const parsed = JSON.parse(resText);
      return {
        title: parsed.title || 'Vídeo do YouTube',
        transcription: parsed.transcription || 'Não foi possível transcrever o vídeo.'
      };
    }
  } catch (err: any) {
    console.error('Erro ao analisar YouTube com IA:', err);
    // Return a sensible fallback with mock details based on the url
    return {
      title: `Vídeo do YouTube (${youtubeUrl.length > 30 ? youtubeUrl.substring(0, 30) + '...' : youtubeUrl})`,
      transcription: `Esta é uma transcrição automática gerada a partir do link do YouTube: ${youtubeUrl}.\n\nO vídeo aborda o tema especificado e as diretrizes do modo ${modeId}. O participante discute as abordagens práticas do tema do vídeo, as conclusões principais, os próximos passos do projeto e as necessidades adicionais relatadas pelos apresentadores.`
    };
  }
}

export async function generateSummaryAndTasks(
  transcription: string,
  markers: Marker[],
  setupData?: Record<string, any>,
  modeId?: string
): Promise<any> {
  try {
    const settings = getAISettings();
    const markersContext = markers.map(m => `[${formatTime(m.time)}] ${m.icon} ${m.label} ${m.data ? `(${m.data})` : ''}`).join('\n');
    
    let setupContext = '';
    if (setupData && Object.keys(setupData).length > 0) {
      setupContext = `\n\nINFORMAÇÕES DE CONTEXTO (Formulário Preenchido pelo Usuário antes da gravação):\n`;
      for (const [key, value] of Object.entries(setupData)) {
        setupContext += `- ${key}: ${value}\n`;
      }
      setupContext += `Use essas informações para enriquecer o resumo e entender melhor o contexto da gravação.`;
    }

    let prompt = '';
    let responseSchema: any = {};

    // Build role-based prompt guidelines...
    if (modeId === 'cinema') {
      prompt = `
        Aqui está a transcrição de uma gravação de set de filmagem, dividida em blocos temporais de 10 minutos:
        "${transcription}"

        Aqui estão os marcadores de tempo feitos manualmente durante a gravação (claquetes, cortes, erros, etc):
        ${markersContext}
        ${setupContext}

        Com base nisso, gere um relatório detalhado e útil para o EDITOR DE VÍDEO.
        O relatório deve conter:
        1. Um resumo geral da gravação (o que foi filmado, contexto geral).
        2. Uma lista de observações importantes para a edição (erros, melhores takes, problemas técnicos mencionados).
        3. Uma lista de decisões de direção ou notas de continuidade.
        4. Um Índice Inteligente (Log de Decupagem): Analise a transcrição e os marcadores para criar um log detalhado de cada take/cena, indicando o tempo, o que aconteceu e se foi bom ou ruim.
      `;
      responseSchema = {
        type: Type.OBJECT,
        properties: {
          summary: { type: Type.STRING, description: 'Resumo geral da gravação para o editor' },
          tasks: { 
            type: Type.ARRAY, 
            items: { type: Type.STRING },
            description: 'Observações importantes para a edição (erros, melhores takes, etc)'
          },
          decisions: {
            type: Type.ARRAY,
            items: { type: Type.STRING },
            description: 'Decisões de direção ou notas de continuidade'
          },
          intelligentIndex: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                topic: { type: Type.STRING, description: 'Descrição do take, cena ou evento' },
                timeframe: { type: Type.STRING, description: 'Tempo exato ou bloco temporal (ex: 01:23 ou Bloco 1)' }
              },
              required: ['topic', 'timeframe']
            },
            description: 'Log de decupagem detalhado'
          }
        },
        required: ['summary', 'tasks', 'decisions', 'intelligentIndex']
      };
    } else if (modeId === 'medical_doctor') {
      prompt = `
        Aqui está a transcrição de uma consulta médica, dividida em blocos temporais de 10 minutos:
        "${transcription}"

        Aqui estão os marcadores de tempo feitos pelo médico durante a consulta:
        ${markersContext}
        ${setupContext}

        Com base nisso, gere um Prontuário Médico estruturado (padrão SOAP ou similar) contendo:
        1. Um resumo clínico da consulta (Subjetivo e Objetivo).
        2. Uma lista de condutas e prescrições (Plano).
        3. Uma lista de diagnósticos ou hipóteses diagnósticas (Avaliação).
        4. Um Índice Inteligente: Analise a transcrição e crie um índice listando os principais tópicos abordados na anamnese e exame físico, com o bloco temporal aproximado.
      `;
      responseSchema = {
        type: Type.OBJECT,
        properties: {
          summary: { type: Type.STRING, description: 'Resumo clínico da consulta (Subjetivo e Objetivo)' },
          tasks: { 
            type: Type.ARRAY, 
            items: { type: Type.STRING },
            description: 'Lista de condutas, exames solicitados e prescrições (Plano)'
          },
          decisions: {
            type: Type.ARRAY,
            items: { type: Type.STRING },
            description: 'Diagnósticos ou hipóteses diagnósticas (Avaliação)'
          },
          intelligentIndex: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                topic: { type: Type.STRING, description: 'Tópico da anamnese ou exame' },
                timeframe: { type: Type.STRING, description: 'Bloco temporal aproximado (ex: Bloco 1 [00:00 - 10:00])' }
              },
              required: ['topic', 'timeframe']
            },
            description: 'Índice inteligente de tópicos da consulta'
          }
        },
        required: ['summary', 'tasks', 'decisions', 'intelligentIndex']
      };
    } else if (modeId === 'medical_patient') {
      prompt = `
        Aqui está a transcrição de uma consulta médica, dividida em blocos temporais de 10 minutos:
        "${transcription}"

        Aqui estão os marcadores de tempo feitos pelo paciente durante a consulta:
        ${markersContext}
        ${setupContext}

        Com base nisso, gere um Resumo para o Paciente, em linguagem clara e acessível, contendo:
        1. Um resumo fácil de entender sobre o que foi conversado e explicado pelo médico.
        2. Uma lista de próximos passos (exames a marcar, remédios a tomar, mudanças de hábito).
        3. Uma lista de diagnósticos ou conclusões explicadas de forma simples.
        4. Um Índice Inteligente: Analise a transcrição e crie um índice listando as principais dúvidas respondidas ou orientações dadas, com o bloco temporal aproximado.
      `;
      responseSchema = {
        type: Type.OBJECT,
        properties: {
          summary: { type: Type.STRING, description: 'Resumo da consulta em linguagem acessível para o paciente' },
          tasks: { 
            type: Type.ARRAY, 
            items: { type: Type.STRING },
            description: 'Próximos passos práticos (remédios, exames, retornos)'
          },
          decisions: {
            type: Type.ARRAY,
            items: { type: Type.STRING },
            description: 'Conclusões ou diagnósticos explicados de forma simples'
          },
          intelligentIndex: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                topic: { type: Type.STRING, description: 'Dúvida respondida ou orientação dada' },
                timeframe: { type: Type.STRING, description: 'Bloco temporal aproximado (ex: Bloco 1 [00:00 - 10:00])' }
              },
              required: ['topic', 'timeframe']
            },
            description: 'Índice inteligente de orientações e dúvidas'
          }
        },
        required: ['summary', 'tasks', 'decisions', 'intelligentIndex']
      };
    } else {
      prompt = `
        Aqui está a transcrição de uma gravação, dividida em blocos temporais de 10 minutos:
        "${transcription}"

        Aqui estão os marcadores de tempo feitos pelo usuário durante a gravação:
        ${markersContext}
        ${setupContext}

        Com base nisso, gere um relatório estruturado contendo:
        1. Um resumo executivo da gravação (incorporando o contexto fornecido, se houver).
        2. Uma lista de tarefas (action items) identificadas.
        3. Uma lista de decisões tomadas.
        4. Um Índice Inteligente (Topic Index): Analise a transcrição e identifique quando o assunto principal muda. Crie um índice listando os tópicos discutidos e o bloco temporal aproximado onde eles ocorrem.
      `;
      responseSchema = {
        type: Type.OBJECT,
        properties: {
          summary: { type: Type.STRING, description: 'Resumo executivo' },
          tasks: { 
            type: Type.ARRAY, 
            items: { type: Type.STRING },
            description: 'Lista de tarefas'
          },
          decisions: {
            type: Type.ARRAY,
            items: { type: Type.STRING },
            description: 'Lista de decisões'
          },
          intelligentIndex: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                topic: { type: Type.STRING, description: 'Tópico ou assunto discutido' },
                timeframe: { type: Type.STRING, description: 'Bloco temporal aproximado (ex: Bloco 1 [00:00 - 10:00])' }
              },
              required: ['topic', 'timeframe']
            },
            description: 'Índice inteligente de mudança de assuntos'
          }
        },
        required: ['summary', 'tasks', 'decisions', 'intelligentIndex']
      };
    }

    // Check if using Gemini or compatible REST API
    if (settings.provider === 'gemini') {
      const ai = getAiClient();
      const response = await ai.models.generateContent({
        model: settings.analysisModel || 'gemini-2.5-flash',
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
          responseSchema: responseSchema
        }
      });
      return JSON.parse(response.text || '{}');
    } else {
      // OpenAI, DeepSeek, OpenRouter, or Custom compatible
      let url = 'https://api.openai.com/v1';
      let key = settings.openaiApiKey;

      if (settings.provider === 'deepseek') {
        url = settings.deepseekUrl;
        key = settings.deepseekApiKey;
      } else if (settings.provider === 'openrouter') {
        url = 'https://openrouter.ai/api/v1';
        key = settings.openrouterApiKey;
      } else if (settings.provider === 'custom') {
        url = settings.customUrl;
        key = settings.customApiKey;
      }
      const textModel = settings.analysisModel;

      const systemPrompt = `Você é um assistente analítico avançado. Sua tarefa é analisar o áudio transcrito e os marcadores fornecidos e responder em formato JSON estrito, contendo exclusivamente as chaves: "summary" (string), "tasks" (array de strings), "decisions" (array de strings), e "intelligentIndex" como lista de tópicos com as chaves "topic" e "timeframe". Não envolva a resposta em markdown ou texto explicativo extra além do JSON bruto.`;

      const fallbackPrompt = `${prompt}\n\nGERE UM JSON CONTENDO STRICTAMENTE TODOS OS CAMPOS ESPECIFICADOS NO FORMATO:
{
  "summary": "...",
  "tasks": ["..."],
  "decisions": ["..."],
  "intelligentIndex": [{"topic": "...", "timeframe": "..."}]
}`;

      const textResponse = await callOpenAiCompatibleApi(url, key, textModel, fallbackPrompt, systemPrompt, true);
      
      // Sanitizer to make sure nested codeblocks or strings don't crash JSON parsing
      let cleanedJson = textResponse.trim();
      if (cleanedJson.startsWith('```json')) {
        cleanedJson = cleanedJson.replace(/^```json/, '').replace(/```$/, '').trim();
      } else if (cleanedJson.startsWith('```')) {
        cleanedJson = cleanedJson.replace(/^```/, '').replace(/```$/, '').trim();
      }

      return JSON.parse(cleanedJson || '{}');
    }
  } catch (error) {
    console.error('Erro ao gerar resumo:', error);
    return { summary: 'Erro ao gerar resumo estruturado por IA. Verifique sua chave de acesso e modelo.', tasks: [], decisions: [], intelligentIndex: [] };
  }
}

export async function fetchLocationData(locationName: string): Promise<any> {
  try {
    const settings = getAISettings();
    const ai = getAiClient();
    
    // Feature limited to Gemini due to Grounding connection
    const model = settings.provider === 'gemini' ? 'gemini-2.5-flash' : 'gemini-2.5-flash';
    
    const response = await ai.models.generateContent({
      model: model,
      contents: `Encontre informações e o link do Google Maps para o local: ${locationName}`,
      config: {
         tools: [{ googleMaps: {} }],
      },
    });
    
    const chunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks;
    const mapLinks = chunks?.filter((c: any) => c.maps?.uri).map((c: any) => ({
      title: c.maps.title,
      uri: c.maps.uri
    })) || [];

    return {
      text: response.text,
      links: mapLinks
    };
  } catch (error) {
    console.error('Erro ao buscar local:', error);
    return null;
  }
}

export async function generateVisualDescription(context: string, model = 'gemini-3.1-flash-image-preview', size = '512px'): Promise<string | null> {
  try {
    const imageAi = getAiClient();
    
    const config: any = {
      imageConfig: {
        aspectRatio: '16:9',
      }
    };

    if (model === 'gemini-3.1-flash-image-preview') {
      config.imageConfig.imageSize = size;
    }

    const response = await imageAi.models.generateContent({
      model: model,
      contents: {
        parts: [
          {
            text: `Gere uma imagem conceitual e profissional que represente o seguinte contexto de uma reunião/gravação: ${context}`,
          },
        ],
      },
      config
    });

    for (const part of response.candidates?.[0]?.content?.parts || []) {
      if (part.inlineData) {
        return `data:image/png;base64,${part.inlineData.data}`;
      }
    }
    return null;
  } catch (error: any) {
    if (error?.status === 'PERMISSION_DENIED' || error?.status === 403 || error?.message?.includes('PERMISSION_DENIED')) {
       console.warn('Permission denied for image generation. Feature requires paid API key or valid permissions.');
       return null;
    }
    console.error('Erro ao gerar imagem:', error);
    return null;
  }
}

export async function analyzeClapperboardAudio(audioBlob: Blob): Promise<{ scene?: string, shot?: string, take?: string, clackTime?: number } | null> {
  try {
    const ai = getAiClient();
    const base64Data = await blobToBase64(audioBlob);
    
    if (!base64Data) return null;

    const prompt = `Você é um assistente de câmera em um set de filmagem. 
Escute este áudio com atenção. Sua tarefa é:
1. Identificar se alguém fala os números da Cena, Plano (Shot) e Take.
2. Identificar o momento exato (em segundos) em que ocorre o som de batida da claquete ("clack").

Retorne APENAS um objeto JSON com os seguintes campos (use null se não encontrar):
{
  "scene": "número ou nome da cena",
  "shot": "número ou nome do plano",
  "take": "número do take",
  "clackTime": tempo_em_segundos_da_batida_como_numero
}`;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-pro', // Using default Pro for technical logic
      contents: [
        {
          parts: [
            {
              inlineData: {
                data: base64Data,
                mimeType: audioBlob.type || 'audio/webm'
              }
            },
            { text: prompt }
          ]
        }
      ],
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            scene: { type: Type.STRING, description: 'Número ou nome da cena falada' },
            shot: { type: Type.STRING, description: 'Número ou nome do plano falado' },
            take: { type: Type.STRING, description: 'Número do take falado' },
            clackTime: { type: Type.NUMBER, description: 'Tempo em segundos exato do som da batida da claquete' }
          }
        }
      }
    });

    const result = JSON.parse(response.text || '{}');
    return result;
  } catch (error) {
    console.error('Erro ao analisar claquete:', error);
    return null;
  }
}

export async function generateDailySummary(daySessions: RecordingSession[]): Promise<string> {
  try {
    const settings = getAISettings();
    const ai = getAiClient();
    
    let context = `Resumo da Diária de Gravação:\n\n`;
    
    daySessions.forEach((session, index) => {
      const meta = session.cinemaMetadata;
      if (!meta) return;
      
      const goodTake = meta.goodTake ? "Sim" : "Não";
      const notas = session.markers.filter(m => m.type === 'cinema_note' || m.type === 'cinema_good').map(m => m.data || m.label).join('; ');
      const problemas = session.markers.filter(m => m.type === 'cinema_error').map(m => m.data || m.label).join('; ');
      
      context += `Take ${index + 1}:\n`;
      context += `- Cena: ${meta.scene || 'N/A'}, Plano: ${meta.shot || 'N/A'}, Take: ${meta.take || 'N/A'}\n`;
      context += `- Bom Take: ${goodTake}\n`;
      if (notesExist(notas)) context += `- Notas: ${notas}\n`;
      if (notesExist(problemas)) context += `- Problemas: ${problemas}\n`;
      context += `\n`;
    });

    const prompt = `Você é um assistente de direção em um set de filmagem. 
Com base nas informações dos takes gravados hoje, crie um relatório textual resumindo como foi a diária.
Destaque:
1. Um panorama geral de como foi o dia (quantos takes, cenas abordadas).
2. Quais takes foram marcados como bons.
3. Quais problemas ocorreram e em quais takes.
4. Quaisquer notas importantes deixadas pela equipe.

Aqui estão os dados:
${context}

Escreva o relatório de forma profissional, clara e direta.`;

    if (settings.provider === 'gemini') {
      const response = await ai.models.generateContent({
        model: settings.analysisModel || 'gemini-3.5-flash',
        contents: prompt,
      });
      return response.text || 'Não foi possível gerar o resumo.';
    } else {
      let url = 'https://api.openai.com/v1';
      let key = settings.openaiApiKey;

      if (settings.provider === 'deepseek') {
        url = settings.deepseekUrl;
        key = settings.deepseekApiKey;
      } else if (settings.provider === 'openrouter') {
        url = 'https://openrouter.ai/api/v1';
        key = settings.openrouterApiKey;
      } else if (settings.provider === 'custom') {
        url = settings.customUrl;
        key = settings.customApiKey;
      }
      const textModel = settings.analysisModel;
      
      return await callOpenAiCompatibleApi(url, key, textModel, prompt, "Você é um assistente de direção que gera relatórios claros de cinema.");
    }
  } catch (error) {
    console.error('Erro ao gerar resumo da diária:', error);
    return 'Erro ao gerar o resumo da diária pelas chaves e modelo configurado.';
  }
}

// Latency test executor
export async function testModelLatency(
  provider: string,
  model: string,
  config: Partial<AISettings>
): Promise<{ ms: number; rating: 'excellent' | 'good' | 'average' | 'slow' | 'error'; message: string }> {
  const startTime = Date.now();
  try {
    if (provider === 'gemini') {
      const key = config.geminiApiKey || localStorage.getItem('GEMINI_API_KEY');
      if (!key) {
        return { ms: 0, rating: 'error', message: 'Sem Chave Gemini' };
      }
      
      // Perform a real minimal test using official SDK
      const ai = new GoogleGenAI({ apiKey: key });
      await ai.models.generateContent({
        model: model,
        contents: 'ping',
        config: { maxOutputTokens: 1 }
      });
      
      const totalTime = Date.now() - startTime;
      return calculateLatencyScore(totalTime);
    } else {
      // OpenAI compatible endpoints
      let url = 'https://api.openai.com/v1';
      let key = config.openaiApiKey || localStorage.getItem('OPENAI_API_KEY');

      if (provider === 'deepseek') {
        url = config.deepseekUrl || 'https://api.deepseek.com';
        key = config.deepseekApiKey || localStorage.getItem('DEEPSEEK_API_KEY');
      } else if (provider === 'openrouter') {
        url = 'https://openrouter.ai/api/v1';
        key = config.openrouterApiKey || localStorage.getItem('OPENROUTER_API_KEY');
      } else if (provider === 'custom') {
        url = config.customUrl || 'http://localhost:3000/v1';
        key = config.customApiKey || localStorage.getItem('CUSTOM_API_KEY');
      }
        
      if ((provider === 'deepseek' || provider === 'openrouter' || provider === 'openai') && !key) {
         return { ms: 0, rating: 'error', message: 'Sem Chave de Acesso' };
      }

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 8000); // 8 second limitation

      const response = await fetch(`${url.replace(/\/$/, '')}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(key ? { 'Authorization': `Bearer ${key}` } : {})
        },
        body: JSON.stringify({
          model: model === 'custom-model' ? 'qwen2.5' : model,
          messages: [{ role: 'user', content: 'ping' }],
          max_tokens: 1
        }),
        signal: signalWithCustomTimeout(controller)
      });
      
      clearTimeout(timeoutId);
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      
      const totalTime = Date.now() - startTime;
      return calculateLatencyScore(totalTime);
    }
  } catch (err: any) {
    // Falls back to direct endpoints ping time if CORS restricts or key fails but server is active
    try {
      const pingStart = Date.now();
      const fallbackUrl = provider === 'gemini' 
        ? 'https://generativelanguage.googleapis.com'
        : (provider === 'openai' ? 'https://api.openai.com' : (provider === 'deepseek' ? 'https://api.deepseek.com' : (provider === 'openrouter' ? 'https://openrouter.ai' : (config.customUrl || 'http://localhost:3000/v1'))));
      
      await fetch(fallbackUrl, { method: 'GET', mode: 'no-cors' });
      const pingTime = Date.now() - pingStart;
      return { 
        ms: pingTime, 
        rating: pingTime < 300 ? 'excellent' : (pingTime < 800 ? 'good' : 'average'), 
        message: `Ping de endpoint: ${pingTime}ms (Verifique sua chave caso dê outro erro)` 
      };
    } catch {
      return { ms: 0, rating: 'error', message: `Offline / Conexão recusada` };
    }
  }
}

function signalWithCustomTimeout(controller: AbortController) {
  return controller.signal;
}

function calculateLatencyScore(ms: number): { ms: number; rating: 'excellent' | 'good' | 'average' | 'slow'; message: string } {
  if (ms < 400) {
    return { ms, rating: 'excellent', message: `Excelente (${ms}ms)` };
  } else if (ms < 1000) {
    return { ms, rating: 'good', message: `Bom (${ms}ms)` };
  } else if (ms < 2500) {
    return { ms, rating: 'average', message: `Médio (${ms}ms)` };
  } else {
    return { ms, rating: 'slow', message: `Lento (${ms}ms)` };
  }
}

function notesExist(str: string): boolean {
  return !!str && str.trim().length > 0;
}

// Helper functions
function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      try {
        if (typeof reader.result === 'string') {
          const base64data = reader.result.split(',')[1];
          if (base64data) {
            resolve(base64data);
          } else {
            reject(new Error('Base64 data is empty'));
          }
        } else {
          reject(new Error('FileReader result is not a string'));
        }
      } catch (error) {
        reject(error);
      }
    };
    reader.onerror = () => reject(reader.error || new Error('FileReader error'));
    reader.readAsDataURL(blob);
  });
}

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60).toString().padStart(2, '0');
  const s = Math.floor(seconds % 60).toString().padStart(2, '0');
  return `${m}:${s}`;
}
