import { GoogleGenAI, Type } from '@google/genai';
import { Marker } from '../types';

function getAiClient() {
  const key = localStorage.getItem('GEMINI_API_KEY') || process.env.GEMINI_API_KEY;
  if (!key) {
    throw new Error('API Key não configurada. Por favor, adicione sua chave nas configurações.');
  }
  return new GoogleGenAI({ apiKey: key });
}

export async function transcribeAudio(audioBlob: Blob): Promise<string> {
  try {
    const ai = getAiClient();
    const base64Data = await blobToBase64(audioBlob);
    const mimeType = audioBlob.type || 'audio/webm';

    const prompt = `Transcreva este áudio em português do Brasil com EXTREMA PRECISÃO.
REGRAS CRUCIAIS:
1. NÃO INVENTE NENHUMA PALAVRA OU FRASE. Se o áudio for curto, transcreva apenas o que foi dito.
2. Se houver sons de fundo (chuva, trânsito, respiração, passos), descreva-os entre colchetes. Exemplo: [som de chuva], [som de passos].
3. Se você não tiver certeza de uma palavra ou frase, mas precisar tentar adivinhar pelo contexto para fazer sentido, coloque-a entre asteriscos duplos. Exemplo: **palavra**.
4. Se houver apenas silêncio ou ruídos sem fala, retorne apenas as descrições dos sons ou deixe vazio. Jamais crie uma história ou texto que não está no áudio.
5. Separe em parágrafos se houver pausas longas.`;

    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: [
        {
          parts: [
            {
              inlineData: {
                data: base64Data,
                mimeType: mimeType,
              },
            },
            {
              text: prompt,
            },
          ],
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
      model: 'gemini-3-flash-preview',
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

export async function generateVisualDescription(context: string): Promise<string | null> {
  try {
    const imageAi = getAiClient();
    
    // Using gemini-2.5-flash-image as it is more likely to be available on free tier
    const response = await imageAi.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: {
        parts: [
          {
            text: `Gere uma imagem conceitual e profissional que represente o seguinte contexto de uma reunião/gravação: ${context}`,
          },
        ],
      },
      config: {
        imageConfig: {
          aspectRatio: '16:9',
          // imageSize is not supported in gemini-2.5-flash-image
        }
      }
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

// Helper functions
function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64data = (reader.result as string).split(',')[1];
      resolve(base64data);
    };
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60).toString().padStart(2, '0');
  const s = Math.floor(seconds % 60).toString().padStart(2, '0');
  return `${m}:${s}`;
}
