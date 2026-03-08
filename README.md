# 🎙️ CapIAudio

**CapIAudio** é um aplicativo inteligente de gravação de áudio projetado para reuniões, aulas, entrevistas e criação de conteúdo. Ele permite gravar áudio, fazer marcações em tempo real e utiliza a inteligência artificial do **Google Gemini** para transcrever, resumir e extrair insights valiosos automaticamente.

---

## ✨ Funcionalidades

- **Gravação com Waveform Real:** Visualização de ondas sonoras em tempo real durante a gravação (Web Audio API).
- **Marcação em Tempo Real:** Adicione marcadores personalizados (ex: "Decisão", "Tarefa", "Dúvida") com um clique enquanto grava.
- **Transcrição Inteligente:** Transcrição completa do áudio utilizando o modelo **Gemini 3.1 Flash Lite**.
- **Resumo Executivo & Action Items:** Geração automática de resumos, tarefas (Action Items) e decisões tomadas.
- **Detecção de Localização:** Identifica locais mencionados no áudio e gera links para o Google Maps.
- **Geração de Imagens (Nano Banana 2):** Cria descrições visuais conceituais baseadas nos momentos marcados (`gemini-3.1-flash-image-preview`).
- **Histórico Local:** Todas as gravações, transcrições e resumos são salvos automaticamente no seu navegador (IndexedDB).
- **Exportação Profissional:** Exporte marcadores diretamente para o Adobe Premiere (`.xml`) ou DaVinci Resolve (`.csv`).

---

## 🛠️ Tecnologias Utilizadas

- **Frontend:** React 18, TypeScript, Vite
- **Estilização:** Tailwind CSS, Framer Motion (Animações)
- **Inteligência Artificial:** `@google/genai` (Gemini 3.1 Flash Lite, Gemini 3.1 Flash Image Preview)
- **Armazenamento:** IndexedDB (Persistência local offline)
- **Mobile/Desktop:** Capacitor (Android/iOS), PWA (Progressive Web App)

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

3. **Configure a Chave de API:**
   - O aplicativo requer uma chave de API do Google Gemini.
   - Você pode inserir a chave diretamente na interface do aplicativo (ícone de engrenagem) ou configurar uma variável de ambiente `.env` (se estiver rodando um backend customizado).

4. **Inicie o servidor de desenvolvimento:**
   ```bash
   npm run dev
   ```
   Acesse `http://localhost:3000` (ou a porta indicada) no seu navegador.

---

## 📱 Como criar o APK (Android) e App iOS

Este projeto está configurado com o **Capacitor**, o que permite transformar a aplicação web em um aplicativo nativo para Android e iOS.

### Pré-requisitos
- Node.js instalado
- Android Studio (para Android)
- Xcode (para iOS, apenas no Mac)

### Passos para gerar o APK:
1. Compile o projeto web:
   ```bash
   npm run build
   ```
2. Adicione a plataforma Android:
   ```bash
   npx cap add android
   ```
3. Sincronize os arquivos web com o projeto Android:
   ```bash
   npx cap sync android
   ```
4. Abra o projeto no Android Studio para compilar o APK:
   ```bash
   npx cap open android
   ```
   *No Android Studio, vá em `Build > Build Bundle(s) / APK(s) > Build APK(s)`.*

---

## 💻 Como criar o Executável Desktop (Windows/Mac/Linux)

A aplicação já está configurada como um **PWA (Progressive Web App)**. Isso significa que você pode instalá-la diretamente no seu computador ou celular sem precisar de uma loja de aplicativos.

### Passos:
1. Acesse o link da aplicação no Google Chrome ou Microsoft Edge.
2. Na barra de endereços (lado direito), clique no ícone de "Instalar aplicativo" (geralmente um monitor com uma setinha para baixo ou um botão `+`).
3. O CapIAudio será instalado como um programa nativo no seu computador, com atalho na área de trabalho e rodando em uma janela própria.

---

## 🗺️ Roadmap (Próximos Passos)

- [ ] **Autenticação com Google:** Permitir login com conta Google.
- [ ] **Integração com Google Tarefas:** Enviar "Action Items" gerados pela IA diretamente para o Google Tasks do usuário.
- [ ] **Integração com Google Agenda:** Criar eventos ou lembretes baseados nas decisões e datas mencionadas na gravação.
- [ ] **Sincronização em Nuvem:** Fazer backup das gravações e resumos no Google Drive ou Firebase.

---

## 📄 Licença

Este projeto está sob a licença MIT. Sinta-se livre para usar, modificar e distribuir.
