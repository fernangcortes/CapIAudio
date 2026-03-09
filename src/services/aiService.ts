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
    
    const parts: any[] = [];
    for (const blob of audioBlobs) {
      const base64Data = await blobToBase64(blob);
      if (base64Data) {
        parts.push({
          inlineData: {
            data: base64Data,
            mimeType: blob.type || 'audio/webm'
          }
        });
      }
    }

    if (parts.length === 0) {
      return 'Erro ao processar o áudio (vazio).';
    }

    const speakerMarkers = markers.filter(m => m.type === 'person' && typeof m.data === 'string' && m.data.startsWith('Falando:'));
    const speakerContext = speakerMarkers.length > 0 
      ? `\n\nATENÇÃO AOS PARTICIPANTES:\nDurante a gravação, o usuário marcou os momentos em que cada pessoa começou a falar. Aqui estão as marcações de tempo (em segundos):\n${speakerMarkers.map(m => `- Aos ${Math.floor(m.time)} segundos: ${m.data.replace('Falando: ', '')}`).join('\n')}\n\nUse essas marcações de tempo para identificar as falas e colocar o nome da pessoa antes da fala na transcrição (ex: "João: Olá pessoal").` 
      : '';

    const prompt = `Transcreva este áudio em português do Brasil com EXTREMA PRECISÃO e IDENTIFICAÇÃO AUTOMÁTICA DE LOCUTORES (Diarization).
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
      contents: [
        {
          parts: parts,
        },
      ],
    });

    return response.text || 'Transcrição não disponível.';
  } catch (error) {
    console.error('Erro na transcrição:', error);
    return 'Erro ao processar a transcrição. Verifique sua API Key.';
  }
}

export async function generateSummaryAndTasks(transcription: string, markers: Marker[]): Promise<any> {
  try {
    const ai = getAiClient();
    const markersContext = markers.map(m => `[${formatTime(m.time)}] ${m.icon} ${m.label} ${m.data ? `(${m.data})` : ''}`).join('\n');
    
    const prompt = `
      Aqui está a transcrição de uma gravação:
      "${transcription}"

      Aqui estão os marcadores de tempo feitos pelo usuário durante a gravação:
      ${markersContext}

      Com base nisso, gere:
      1. Um resumo executivo da gravação.
      2. Uma lista de tarefas (action items) identificadas.
      3. Uma lista de decisões tomadas.
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-3.1-flash-lite-preview',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
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
            }
          },
          required: ['summary', 'tasks', 'decisions']
        }
      }
    });

    return JSON.parse(response.text || '{}');
  } catch (error) {
    console.error('Erro ao gerar resumo:', error);
    return { summary: 'Erro ao gerar resumo. Verifique sua API Key.', tasks: [], decisions: [] };
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
