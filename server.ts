import express from "express";
import { createServer as createViteServer } from "vite";
import { Server } from "socket.io";
import http from "http";
import { GoogleGenAI } from "@google/genai";

async function startServer() {
  const app = express();
  app.use(express.json({ limit: "50mb" }));
  const server = http.createServer(app);
  const io = new Server(server, {
    cors: {
      origin: "*",
      methods: ["GET", "POST"]
    }
  });

  const PORT = 3000;

  // API routes FIRST
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok" });
  });

  app.post("/api/parse-clapperboard-command", async (req, res) => {
    try {
      const { text } = req.body;
      if (!text || typeof text !== "string") {
        return res.status(400).json({ error: "Campo 'text' é obrigatório e deve ser string." });
      }

      const apiKey = process.env.GEMINI_API_KEY || process.env.API_KEY;
      if (!apiKey) {
        return res.status(500).json({ error: "API Key do Gemini não está configurada no servidor." });
      }

      const ai = new GoogleGenAI({
        apiKey,
        httpOptions: {
          headers: {
            'User-Agent': 'aistudio-build',
          }
        }
      });

      const response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: `Analise a transcrição de voz de um comando para atualizar metadados de uma claquete de cinema ou set de filmagem.
Transcrição recebida pelo usuário: "${text}"

Extraia qualquer um dos seguintes campos se estiverem expressos nos comandos de voz:
- "scene": número ou letra da cena (ex: "cena quatro" -> "4", "cena 12A" -> "12A")
- "shot": identificação do plano (ex: "plano B" -> "B", "shot 3" -> "3")
- "take": número do take (ex: "take dois" -> "02", "take dez" -> "10")
- "camera": letra ou ID da câmera (ex: "câmera A" -> "A", "câmera B" -> "B")
- "rollCard": rolo ou cartão da câmera (ex: "rolo A zero zero três" -> "A003", "camera card roll B zero doze" -> "B012")
- "lens": lente utilizada (ex: "lente cinquenta" -> "50mm", "lente oitenta e cinco" -> "85mm", "lente zoom de 24 a 70" -> "24-70mm")
- "soundRoll": rolo de som (ex: "sound roll dois" -> "S002", "cartão de som S zero zero quatro" -> "S004")
- "fps": frame rate (ex: "vinte e quatro fps" -> "24fps", "sessenta quadros" -> "60fps")
- "aperture": abertura ou stop da lente (ex: "abertura F dois ponto oito" -> "f/2.8", "T um ponto cinco" -> "T1.5")
- "shutter": velocidade ou ângulo do obturador (ex: "obturador cento e oitenta graus" -> "180°", "shutter um sobre cinquenta" -> "1/50")
- "iso": sensibilidade do sensor ou ISO (ex: "ISO oitocentos" -> "800", "muda ISO para mil e seiscentos" -> "1600")

REGRAS:
1. Retorne APENAS um objeto JSON válido, sem markdown, contendo chaves correspondentes acima.
2. Se um campo não for mencionado ou entendido, NÃO o inclua no JSON.
3. Se nenhuma chave for encontrada, retorne um objeto vazio: {}.

Responda SOMENTE o objeto JSON bruto.`,
        config: {
          responseMimeType: "application/json",
        }
      });

      const parsedText = response.text || "{}";
      const parsedData = JSON.parse(parsedText.trim());
      res.json(parsedData);
    } catch (error: any) {
      console.error("Erro no processamento do comando de voz:", error);
      res.status(500).json({ error: error.message || "Erro desconhecido ao processar comando." });
    }
  });

  app.post("/api/parse-clapperboard-image", async (req, res) => {
    try {
      const { image, mimeType } = req.body;
      if (!image || typeof image !== "string") {
        return res.status(400).json({ error: "Campo 'image' contendo base64 é obrigatório." });
      }

      const apiKey = process.env.GEMINI_API_KEY || process.env.API_KEY;
      if (!apiKey) {
        return res.status(500).json({ error: "API Key do Gemini não está configurada no servidor." });
      }

      const ai = new GoogleGenAI({
        apiKey,
        httpOptions: {
          headers: {
            'User-Agent': 'aistudio-build',
          }
        }
      });

      // Split the prefix if present (e.g. "data:image/jpeg;base64,")
      let cleanBase64 = image;
      if (image.includes(";base64,")) {
        cleanBase64 = image.split(";base64,")[1];
      }

      const finalMimeType = mimeType || "image/jpeg";

      const response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: [
          {
            inlineData: {
              data: cleanBase64,
              mimeType: finalMimeType
            }
          },
          `Você é um assistente técnico especialista de pós-produção e edição de vídeo do CapIAudio.
Sua tarefa é analisar a imagem fornecida (que pode ser uma foto de um visor de câmera DSLR/RED/ARRI, um gravador de áudio digital Zoom/Sound Devices, uma claquete inteligente digital ou analógica, ou um print de tela de um aplicativo de set de filmagem).

Identifique e extraia todas as informações técnicas possíveis presentes na tela dos equipamentos. Preencha em um objeto JSON contendo as seguintes chaves (se visíveis ou dedutíveis):
- "scene": número ou letra da cena (ex: "4", "22", "B1")
- "shot": identificação do plano ou enquadramento (ex: "A", "B", "CLOSE")
- "take": número do take (ex: "01", "05")
- "camera": ID da câmera/letra (ex: "A", "B", "C")
- "rollCard": indicação de rolo/cartão/mídia da câmera (ex: "A003", "C104")
- "lens": distância focal ou ID da lente (ex: "50mm", "24-70mm", "35mm")
- "soundRoll": correspondência do rolo/cartão de áudio (ex: "S001", "SOUND002")
- "fps": frame rate de gravação (ex: "23.976", "24", "29.97", "59.94")
- "aperture": abertura do diafragma (ex: "f/2.8", "T1.5", "f/4.0")
- "shutter": velocidade do obturador ou ângulo (ex: "1/50", "180°", "1/100")
- "iso": sensibilidade do sensor ou ISO (ex: "800", "400", "1600", "3200")
- "movieName": nome do projeto ou título da produção se estiver visível (ex: "FILME_ZAL", "CORTE_PREVIEW")

REGRAS:
1. Retorne APENAS o objeto JSON válido. Não inclua marcas de formatação markdown adicionais ou explicações.
2. Seja preciso ao ler números e letras dos displays digitais ou analógicos.
3. Se um campo não for identificado ou legível na imagem, não o inclua no JSON ou deixe-o ausente.
4. Se o número de take for lido como um número puro, formate com zero à esquerda se menor que 10 (ex: "02").

Responda SOMENTE o objeto JSON bruto.`
        ],
        config: {
          responseMimeType: "application/json"
        }
      });

      const parsedText = response.text || "{}";
      const parsedData = JSON.parse(parsedText.trim());
      res.json(parsedData);
    } catch (error: any) {
      console.error("Erro no processamento da imagem por Gemini OCR Vision:", error);
      res.status(500).json({ error: error.message || "Erro desconhecido ao processar a imagem do equipamento." });
    }
  });

  // Socket.IO logic
  // Simple room-based state sync
  const rooms: Record<string, any> = {};

  io.on("connection", (socket) => {
    console.log("User connected:", socket.id);

    socket.on("join-room", (roomId) => {
      socket.join(roomId);
      console.log(`User ${socket.id} joined room ${roomId}`);
      
      // Send current state if exists
      if (rooms[roomId]) {
        socket.emit("sync-state", rooms[roomId]);
      }
    });

    socket.on("update-state", ({ roomId, state }) => {
      // Update server state
      rooms[roomId] = { ...rooms[roomId], ...state };
      // Broadcast to others in the room
      socket.to(roomId).emit("state-updated", state);
    });

    socket.on("add-marker", ({ roomId, marker }) => {
      if (!rooms[roomId]) rooms[roomId] = { markers: [] };
      if (!rooms[roomId].markers) rooms[roomId].markers = [];
      
      rooms[roomId].markers.push(marker);
      socket.to(roomId).emit("marker-added", marker);
    });

    socket.on("disconnect", () => {
      console.log("User disconnected:", socket.id);
    });
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static('dist'));
  }

  server.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
