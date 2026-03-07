# Análise e Plano de Implementação: CapIAudio (Modular & AI-Powered)

## 1. Análise das Solicitações e Novas Ideias

Com base no `readme.txt` e `tour-CapIAudio.html` fornecidos, e incorporando as novas regras, o CapIAudio evolui de um simples gravador para um **sistema modular de captação e enriquecimento de mídia**.

**Principais Mudanças e Sugestões:**
1. **Arquitetura Estritamente Modular:** Separação clara entre o motor de áudio, o sistema de marcação (markers), a interface de usuário e os serviços de IA. Adicionar um botão não deve quebrar a gravação.
2. **Exportação de Áudio Nativa:** O app deve permitir baixar o arquivo de áudio gravado (`.webm` ou `.wav`), não apenas os metadados.
3. **Marcador de Pessoa (Dinâmico):** Um botão que, ao ser clicado, salva o tempo exato e abre um modal (sem pausar a gravação) para digitar o nome da pessoa.
4. **Criador de Botão Ao Vivo:** Permite criar um novo botão de marcação durante a gravação. O tempo é salvo no momento do clique em "Criar", e o marcador é consolidado após o usuário definir o nome/ícone do novo botão.
5. **Integração DaVinci Resolve:** Além do XML do Premiere, exportação de marcadores em formato `.EDL` ou `.CSV` compatível com o DaVinci Resolve.
6. **Integração Google Maps (Grounding):** Uso do modelo `gemini-2.5-flash` com a tool `googleMaps`. Se um local for mencionado ou marcado, a IA busca dados reais e exibe o mapa/links.
7. **Geração de Imagens (Nano Banana 2):** Botão para "Descrever Visualmente". Usa o `gemini-3.1-flash-image-preview` para gerar uma imagem conceitual do momento chave discutido.
8. **Transcrição de Áudio:** Uso do `gemini-3-flash-preview` para transcrever o áudio gravado e cruzar com os marcadores.

---

## 2. Arquitetura Modular Proposta (React/Vite)

- **Core/Engine:**
  - `useAudioRecorder`: Hook responsável apenas por captar o microfone, gerar o Blob de áudio e gerenciar o tempo (timer).
  - `useMarkers`: Hook responsável por armazenar a lista de marcadores e botões customizados.
- **UI Components:**
  - `RecorderUI`: Botão de gravar/parar e waveform.
  - `MarkerGrid`: Renderiza os botões dinamicamente com base no modo atual.
  - `Modals`: Modais independentes para "Nome da Pessoa" e "Criar Botão".
- **AI Services (`src/services/ai/`):**
  - `transcriptionService.ts`: Comunicação com Gemini 3 Flash para áudio.
  - `mapsService.ts`: Comunicação com Gemini 2.5 Flash + Google Maps Tool.
  - `imageService.ts`: Comunicação com Gemini 3.1 Flash Image Preview.
- **Export Services (`src/services/export/`):**
  - `audioExport.ts`: Download do Blob.
  - `premiereExport.ts`: Geração de XML.
  - `davinciExport.ts`: Geração de CSV/EDL.

---

## 3. Sprints e Tasks Detalhadas

### Sprint 1: Fundação Modular e Gravação de Áudio
*Foco: Garantir que a gravação e o timer funcionem perfeitamente, isolados do resto.*
- [ ] **Task 1.1:** Criar estrutura de pastas (`components`, `hooks`, `services`, `types`).
- [ ] **Task 1.2:** Implementar `useAudioRecorder.ts` usando `MediaRecorder` API. Deve retornar `start`, `stop`, `pause`, `resume`, `audioBlob` e `currentTime`.
- [ ] **Task 1.3:** Criar o componente visual `Recorder.tsx` com o botão gigante animado e um visualizador de waveform simples (usando Web Audio API ou CSS animations baseadas em volume).
- [ ] **Task 1.4:** Implementar a exportação básica de áudio (`audioExport.ts`) para permitir o download do arquivo `.webm`.

### Sprint 2: Sistema de Marcadores Dinâmicos
*Foco: Botões que registram o tempo sem interromper a gravação.*
- [ ] **Task 2.1:** Implementar `useMarkers.ts` para gerenciar o estado dos marcadores (`{ id, time, type, label, data }`).
- [ ] **Task 2.2:** Criar o `MarkerGrid.tsx` com os 6 modos pré-definidos (Entrevista, Palestra, Reunião, Médica, Literária, Jornalismo).
- [ ] **Task 2.3:** Implementar o **Marcador de Pessoa**: Botão que captura o tempo atual e abre um modal flutuante para digitar o nome. Ao salvar, adiciona o marcador.
- [ ] **Task 2.4:** Implementar o **Criador de Botão Ao Vivo**: Botão "+" que captura o tempo, abre modal para definir Ícone e Nome. Ao salvar, adiciona o botão ao grid atual E registra o marcador no tempo capturado.

### Sprint 3: Exportação Profissional (Premiere & DaVinci)
*Foco: Transformar os metadados em arquivos úteis para editores de vídeo.*
- [ ] **Task 3.1:** Desenvolver `premiereExport.ts` para gerar o arquivo `.xml` do Final Cut Pro (compatível com Premiere), mapeando cores para diferentes tipos de tags.
- [ ] **Task 3.2:** Desenvolver `davinciExport.ts` para gerar um arquivo `.csv` no formato de marcadores do DaVinci Resolve (`Name,Notes,Marker Type,Color,In,Out,Duration`).
- [ ] **Task 3.3:** Criar a interface de "Resultados" que aparece após o STOP, listando os botões de download (Áudio, XML, CSV).

### Sprint 4: Inteligência Artificial (Gemini Suite)
*Foco: Transcrição, Mapas e Geração de Imagens.*
- [ ] **Task 4.1:** Integrar `@google/genai` no projeto.
- [ ] **Task 4.2:** Implementar **Transcrição**: Enviar o `audioBlob` para o `gemini-3-flash-preview` para gerar a transcrição em texto.
- [ ] **Task 4.3:** Implementar **Google Maps Grounding**: Criar um botão "Marcar Local". Ao final, enviar os locais para o `gemini-2.5-flash` com a tool `googleMaps` para retornar links reais e coordenadas.
- [ ] **Task 4.4:** Implementar **Geração de Imagem**: Criar botão "Descrever Visualmente". Usar `gemini-3.1-flash-image-preview` para gerar uma imagem baseada no contexto do momento (ex: prompt gerado a partir de uma anotação de texto).
- [ ] **Task 4.5:** Consolidar todos os resultados da IA na tela final (Resumo, Tarefas, Mapas, Imagens Geradas).

---
*Este documento serve como guia de implementação. A arquitetura garante que a adição de novos modos ou ferramentas de IA no futuro não interfira no motor de gravação principal.*
