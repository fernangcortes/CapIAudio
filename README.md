<div align="center">
  <img src="public/cover.png" alt="CapIAudio Cover" width="100%" style="border-radius: 12px; margin-bottom: 20px;" />
  <img src="public/favicon.png" alt="CapIAudio Logo" width="120" height="120" style="border-radius: 24px; margin-bottom: 20px;" />
  <h1>🎙️ CapIAudio</h1>
  <p><strong>Gravador Inteligente com Inteligência Artificial para Entrevistas, Reuniões e Cinema</strong></p>
  
  <br />
  
  [![Acessar Aplicação Web](https://img.shields.io/badge/Acessar_Aplicação_Web-059669?style=for-the-badge&logo=googlechrome&logoColor=white)](https://ais-pre-dwrdpxjbzmelqkkk6lp66o-59106078428.us-west2.run.app)
  
  <br />
</div>

---

## 📖 Sobre o Projeto

O **CapIAudio** é uma aplicação web progressiva (PWA) e full-stack projetada para revolucionar a forma como profissionais capturam e analisam áudio. Ele permite gravar áudio de alta qualidade, fazer marcações em tempo real (tags) e utiliza a inteligência artificial do **Google Gemini** para transcrever, resumir, extrair insights e até mesmo detectar sincronismo de claquetes automaticamente.

---

## ✨ Ferramentas e Funcionalidades

### 1. 🎙️ Gravação com Waveform Real
- **Descrição:** Visualização de ondas sonoras em tempo real durante a gravação utilizando a Web Audio API.
- **Como usar:** Na tela inicial, clique no grande botão vermelho de microfone. A onda sonora aparecerá reagindo à sua voz.

### 2. 🏷️ Marcação em Tempo Real (Tags)
- **Descrição:** Adicione marcadores personalizados (ex: "Decisão", "Tarefa", "Erro de Foco", "Boa Resposta") com um único clique enquanto grava.
- **Como usar:** Durante a gravação, clique nos botões coloridos na grade inferior. O tempo exato será salvo. Você pode editar o layout clicando em "Editar Layout" antes de gravar.

### 3. 📝 Transcrição Inteligente (Diarization)
- **Descrição:** Transcrição completa do áudio utilizando o modelo **Gemini 3.1 Flash Lite**, com identificação automática de locutores e regras estritas contra alucinações de IA.
- **Como usar:** Após parar a gravação, vá para a aba "Transcrição" e clique em "Gerar Transcrição".

### 4. 📊 Resumo Executivo & Action Items
- **Descrição:** Geração automática de resumos, lista de tarefas (Action Items) e decisões tomadas com base no áudio e nos seus marcadores.
- **Como usar:** Na tela de resultados, acesse a aba "Resumo IA" e clique em "Gerar Resumo".

### 5. 🎬 Modo Cinema & Auto-Claquete
- **Descrição:** Um modo dedicado para sets de filmagem. Permite inserir metadados (Cena, Plano, Take) e usa o **Gemini 3.1 Pro** para ouvir o áudio e detectar o momento exato da batida da claquete.
- **Como usar:** Selecione o modo "Cinema" no topo da tela. Preencha os dados da claquete. Durante a gravação, clique no botão "Auto-Claquete" para a IA analisar os últimos segundos de áudio.

### 6. 🌐 Sincronização Multi-dispositivos (WebSockets)
- **Descrição:** Conecte múltiplos dispositivos na mesma rede/sala para sincronizar marcadores e metadados em tempo real (ex: Diretor com tablet e Continuísta com notebook).
- **Como usar:** Clique no ícone de engrenagem (Configurações) e defina um "ID da Sala de Sincronização". Faça o mesmo nos outros dispositivos.

### 7. 🎨 Geração de Assets (Nano Banana 2)
- **Descrição:** Cria descrições visuais conceituais, capas e favicons utilizando o modelo `gemini-3.1-flash-image-preview` (Nano Banana 2).
- **Como usar:** Acesse a página de Documentação (ícone de livro no topo) e clique em "Gerar Capa e Favicon".

### 8. 💾 Exportação Profissional
- **Descrição:** Exporte seus marcadores diretamente para softwares de edição de vídeo.
- **Como usar:** Na tela de resultados, clique em "Exportar" e escolha entre Adobe Premiere (`.xml`) ou DaVinci Resolve (`.csv`).

---

## 🌐 Site Interativo de Documentação

O CapIAudio possui um site HTML interativo embutido com todas as informações deste README, formatado como um tour guiado com botões clicáveis e caixas descritivas.

**Para acessar:**
1. Abra o [aplicativo web](https://ais-pre-dwrdpxjbzmelqkkk6lp66o-59106078428.us-west2.run.app).
2. Clique no ícone de **Livro (Documentação)** no cabeçalho superior direito.
3. Explore os cards interativos, o mapa do site e as explicações sobre a arquitetura.

---

## 📱 Compartilhamento (WhatsApp & Redes Sociais)

O aplicativo foi rigorosamente configurado com as **Meta Tags Open Graph** e **Twitter Cards** para garantir uma exibição perfeita e bonita ao ser compartilhado no WhatsApp, Facebook, LinkedIn ou Twitter.

- **Título:** CapIAudio | Gravador Inteligente com IA
- **Descrição:** Grave, marque momentos importantes em tempo real e transcreva áudios com Inteligência Artificial. Ideal para entrevistas, reuniões e cinema.
- **Imagem (Thumbnail):** Imagem de capa gerada em 1200x630px (`cover.png`).
- **Favicon:** Ícone otimizado (`favicon.png`).

---

## 🛠️ Tecnologias Utilizadas

- **Frontend:** React 18, TypeScript, Vite
- **Backend/Real-time:** Node.js, Express, Socket.IO
- **Estilização:** Tailwind CSS, Framer Motion (Animações)
- **Inteligência Artificial:** `@google/genai` (Gemini 3.1 Flash Lite, Gemini 3.1 Pro, Gemini 3.1 Flash Image Preview)
- **Armazenamento:** IndexedDB (Persistência local offline via `localforage`)

---

## 🚀 Como Executar Localmente

1. **Clone o repositório:**
   ```bash
   git clone https://github.com/seu-usuario/capiaudio.git
   cd capiaudio
   ```

2. **Instale as dependências:**
   ```bash
   npm install
   ```

3. **Inicie o servidor de desenvolvimento (Full-Stack):**
   ```bash
   npm run dev
   ```
   Acesse `http://localhost:3000` no seu navegador.

---

## 📄 Licença

Este projeto está sob a licença MIT. Sinta-se livre para usar, modificar e distribuir.
