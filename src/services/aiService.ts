import { GoogleGenAI, Type } from '@google/genai';
import { Marker, RecordingSession } from '../types';

function getAiClient() {
  const key = localStorage.getItem('GEMINI_API_KEY') || process.env.API_KEY || process.env.GEMINI_API_KEY;
  if (!key) {
    throw new Error('API Key não configurada. Por favor, adicione sua chave nas configurações.');
  }
  return new GoogleGenAI({ apiKey: key });
}

export async function transcribeAudio(audioBlobs: Blob[], markers: Marker[] = []): Promise<string> {
  try {
    if (!audioBlobs || audioBlobs.length === 0) {
      return 'Áudio vazio ou não gravado.';
    }

    const ai = getAiClient();
    let fullTranscription = '';
    
    const speakerMarkers = markers.filter(m => m.type === 'person' && typeof m.data === 'string' && m.data.startsWith('Falando:'));
    const speakerContext = speakerMarkers.length > 0 
      ? `\n\nATENÇÃO AOS PARTICIPANTES:\nDurante a gravação, o usuário marcou os momentos em que cada pessoa começou a falar. Aqui estão as marcações de tempo (em segundos):\n${speakerMarkers.map(m => `- Aos ${Math.floor(m.time)} segundos: ${m.data.replace('Falando: ', '')}`).join('\n')}\n\nUse essas marcações de tempo para identificar as falas e colocar o nome da pessoa antes da fala na transcrição (ex: "João: Olá pessoal").` 
      : '';

    for (let i = 0; i < audioBlobs.length; i++) {
      const blob = audioBlobs[i];
      const startTimeMin = i * 10;
      const endTimeMin = (i + 1) * 10;
      
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

      const prompt = `Transcreva este trecho de áudio (minutos ${startTimeMin} a ${endTimeMin}) em português do Brasil com EXTREMA PRECISÃO e IDENTIFICAÇÃO AUTOMÁTICA DE LOCUTORES (Diarization).
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
        model: 'gemini-3.1-flash-lite-preview',
        contents: [{ parts }],
      });

      const text = response.text || '';
      if (text.trim()) {
        fullTranscription += `\n\n### ⏱️ Bloco ${i + 1} [${startTimeMin.toString().padStart(2, '0')}:00 - ${endTimeMin.toString().padStart(2, '0')}:00]\n${text}`;
      }
    }

    return fullTranscription.trim() || 'Transcrição não disponível ou áudio vazio.';
  } catch (error) {
    console.error('Erro na transcrição:', error);
    return 'Erro ao processar a transcrição. Verifique sua API Key.';
  }
}

export async function generateSummaryAndTasks(transcription: string, markers: Marker[], setupData?: Record<string, any>, modeId?: string): Promise<any> {
  try {
    const ai = getAiClient();
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

    const response = await ai.models.generateContent({
      model: 'gemini-3.1-flash-lite-preview',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema: responseSchema
      }
    });

    return JSON.parse(response.text || '{}');
  } catch (error) {
    console.error('Erro ao gerar resumo:', error);
    return { summary: 'Erro ao gerar resumo. Verifique sua API Key.', tasks: [], decisions: [], intelligentIndex: [] };
  }
}

export async function fetchLocationData(locationName: string): Promise<any> {
  try {
    const ai = getAiClient();
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
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
    // Suppress permission errors from console.error to avoid confusing the user
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
      model: 'gemini-3.1-pro-preview', // Using Pro for better reasoning and audio understanding
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
      if (notas) context += `- Notas: ${notas}\n`;
      if (problemas) context += `- Problemas: ${problemas}\n`;
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

    const response = await ai.models.generateContent({
      model: 'gemini-3.1-flash-lite-preview',
      contents: prompt,
    });

    return response.text || 'Não foi possível gerar o resumo.';
  } catch (error) {
    console.error('Erro ao gerar resumo da diária:', error);
    return 'Erro ao gerar o resumo da diária. Verifique sua API Key.';
  }
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
