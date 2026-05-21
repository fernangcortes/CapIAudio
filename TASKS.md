# 📖 Análise de Arquitetura & Plano de Implementação Modular: CapIAudio

Este documento estabelece a análise arquitetural das ferramentas do CapIAudio descritas no manual (`documentacao.html` / `README.md`) e propõe a reformulação do código do projeto para um **design estritamente modular**, orientado pelo contrato do tipo `RecordingModeModule`.

---

## 1. 🔍 Análise da Arquitetura Atual

A arquitetura descrita nas páginas do manual indica um rico escopo de captação e pós-produção audiovisual:
1. **Gravação e Processamento de Áudio:** Gerenciados pelo client via `Web Audio API` e `MediaRecorder`.
2. **Registro de Marcadores e Metadados:** Salvos diretamente no banco de dados local do navegador (`IndexedDB`).
3. **Colaboração e Sincronia de Telas:** Comunicação bilateral em tempo real usando `Socket.IO` via WebSockets.
4. **Enriquecimento com IA (Google Gemini):** Transcrições e resumos especializados.

### O Problema do Monolitismo
Atualmente, as listas de botões, formulários de metadados de entrada (como o caso do formulário do cinema) e comportamentos pós-gravação estão misturados em arquivos corporativos como `App.tsx` e `constants.ts`. Adicionar novos botões ou novos modos (hoje totalizando mais de 25 variações em 6+ categorias) ameaça a estabilidade física da gravação de áudio em andamento.

---

## 2. 🏛️ Proposta de Arquitetura Modular Decoplada

Para isolar cada um dos **6+ Modos de Criação**, propomos que cada modo passe a funcionar como uma unidade fechada e independente de software que herda propriedades e ganchos de ciclo de vida de uma única interface comum: `RecordingModeModule`.

### Diagrama Arquitetural Decoplado
```
     ┌────────────────────────────────────────────────────────┐
     │                       CapIAudio Core                   │
     │ ┌──────────────────────┐      ┌──────────────────────┐ │
     │ │   useAudioRecorder   │◄────►│      useMarkers      │ │
     │ └──────────────────────┘      └──────────────────────┘ │
     └───────────▲──────────────────────────────▲─────────────┘
                 │                              │
                 ▼       [Comunicação via ID]   ▼
     ┌────────────────────────────────────────────────────────┐
     │                RecordingModuleManager                  │
     └───────▲──────────────────▲──────────────────▲──────────┘
             │                  │                  │
 ┌───────────▼───────────┐ ┌────▼────────────────┐ ┌───▼─────────────────┐
 │   Cinema Module       │ │   Meeting Module    │ │   Medical Module    │
 │ (Framer Motion Clack) │ │ (Action-Plan Specs) │ │ (Patient Care Logs) │
 └───────────────────────┘ └─────────────────────┘ └─────────────────────┘
```

---

## 3. 🌐 Protocolos de Troca de Dados e Interfaces

Os contratos estritos de comunicação entre os módulos individuais e o núcleo do sistema foram estabelecidos no arquivo compile-safe em `/src/types/modular.ts`:

### A. Interface Principal (`RecordingModeModule`)
Cada objeto representando um modo de criação é registrado no sistema preenchendo as chaves:
- `id`: O identificador canônico.
- `category`: Agrupador funcional do menu lateral/grade geral.
- `defaultButtons`: O grid encapsulado de marcadores e cores.
- `formFields`: Os parâmetros e entradas textuais solicitados no setup inicial.
- **Hooks de Ciclo de Vida:**
  - `onInitialize()`: Configurações de estado iniciais do módulo.
  - `validateSetupData(data)`: Validador semântico com aviso de erro em UI antes de dar o Start.
  - `onMarkerAdded(marker, context)`: Interceptador de tempo real para injetar descritores inteligentes ou links.
  - `customRenderControlPanel(context, action)`: Permite injetar painéis visuais complexos (como a claquete gigante física animada).
  - `getAIPromptTemplates(lang)`: Retorna os parâmetros de instruções precisos de Prompt para guiar o Gemini a transcrever de maneira formatada na profissão do usuário.
  - `formatExport(session, format)`: Customiza saídas e strings de exportação de dados (XML, CSV, etc).

### B. Protocolo JSON de Troca de Estado e Eventos
A transferência de mensagens entre módulos e o editor utiliza os seguintes esquemas de metadados:

#### Estado da Gravação (`ModeRecordingContext`):
```json
{
  "currentTime": 45.23,
  "sessionState": "recording",
  "markers": [
    { "id": "m1", "time": 12.5, "type": "action", "label": "Novo Slide" }
  ],
  "language": "pt"
}
```

#### Pacote de Exportação de Dados (`ModeExportPackage`):
```json
{
  "sessionId": "b48f93-02fd-4a1b-98f5-3c8b",
  "audioDuration": 254.8,
  "setupData": {
    "paciente": "Fernando",
    "consultorio": "Clínica A"
  },
  "exportFormat": "premiere_xml",
  "formattedOutput": "<xml>...</xml>"
}
```

---

## 4. 🚀 Roadmap e Sprints de Implementação

Dividimos o desenvolvimento em Sprints isoladas, com documentações de apoio completas localizadas no diretório `/tasks/`:

### 📂 Estrutura de Task Files Criadas:
- 🛠️ [**Estrutura de Coordenação / Core Framework**](./tasks/core-framework-tasks.md)
- 🎬 [**Módulo Cinema & Set de Filmagem**](./tasks/module-cinema-tasks.md)
- 👔 [**Módulo Reuniões de Diretoria**](./tasks/module-meeting-tasks.md)
- 🩺 [**Módulo Registro e Consulta Médica**](./tasks/module-medical-tasks.md)
- 👨‍🏫 [**Módulo Aulas & Acadêmicos**](./tasks/module-lecture-tasks.md)
- ✍️ [**Módulo Criação Literária & Roteiros**](./tasks/module-literary-tasks.md)
- 🎤 [**Módulo Jornalismo de Campo**](./tasks/module-journalism-tasks.md)

---

## 5. 🛠️ Plano Detalhado de Sprints

### Sprint 1: Fundação Modular, Gerenciador de Cadastros e Core TypeScript
- **CORE-1:** Migrar todas as definições base de metadados de `constants.ts` para o novo modelo de registro de objetos.
- **CORE-2:** Implementar o barramento central `RecordingModuleManager` para orquestrar ativação de módulos e seus ciclos de lifecycle hooks.
- **CORE-3:** Integrar os loops de eventos em `/src/App.tsx`, limpando do arquivo central as regras específicas de renderização que pertenciam aos modos.

### Sprint 2: Implementação dos Módulos Especializados (Cinema e Jornalismo)
- **CINEMA-1:** Mover propriedades de claquete e renderização reativa de Framer Motion do componente físico global para dentro do escopo do módulo de Cinema.
- **JOURNALISM-1:** Integrar triggers inteligentes de geolocalização aos marcadores do Jornalismo de Campo, acionando o Maps Grounding do Gemini apenas no módulo apropriado.

### Sprint 3: Implementação dos Módulos de Operações e Saúde (Reuniões, Médico e Aulas)
- **MEETING-1:** Implementar filtros de Action-Items estruturados em atas dinâmicas e exportação para canais.
- **MEDICAL-1:** Injetar as proteções de privacidade em sanitização de áudio para fichas SOAP e guias diagnósticos.
- **LECTURE-1:** Estruturar exportações compatíveis com flashcards para cronogramas e avaliações de provas.

### Sprint 4: Consolidação dos Serviços de IA Segmentados por Módulo
- **AI-1:** Vincular de forma desacoplada o `getAIPromptTemplates` do módulo ativo às chamadas da API do Gemini, direcionando a IA conforme a persona profissional selecionada pelo cliente.
- **AI-2:** Testes de regressão do áudio principal, atestando que erros em prompts ou modificações em um módulo não impedem os outros de operarem normalmente.
