# Task File: Modular Core Framework Orchestration

This task list outlines the activities necessary to migrate the monolithic CapIAudio state and coordination structure to a decoupled dynamic registration pattern.

## 🛠️ Objectives
- Set up the Register Manager for recording modes.
- Implement the centralized registration hooks.
- Decouple `App.tsx` coordinate flow from individual mode-specific states.

---

## 📋 Task Details

### Task CORE-1: Module Registration Service
- **Objective:** Build a singleton `RecordingModuleManager` in `/src/services/moduleManager.ts`.
- **Implementation:**
  - Standard map storing `RecordingModeModule` instances by ID.
  - Implement `.register(module: RecordingModeModule)` and `.getModule(id: string): RecordingModeModule`.
  - Export utilities to retrieve all available modes categorized by group.
- **Verification:** Run unit compilation to ensure registration state is clean.

### Task CORE-2: Engine Decoupling (useAudioRecorder & useMarkers Connection)
- **Objective:** Modify coordinate state managers to interact with the active runtime module via standardized handlers rather than inline switches.
- **Implementation:**
  - Create standard adapters for `onMarkerAdded` and `validateSetupData` in the recorder setup form.
  - Establish standard JSON interface for persistence mapping:
    ```json
    {
      "sessionId": "UUID",
      "modeId": "string",
      "setupData": {},
      "markers": []
    }
    ```
- **Verification:** Confirm that calling setup fields doesn't mutate unrelated states.

### Task CORE-3: Adaptive Interface Renderer
- **Objective:** Ensure `/src/App.tsx` determines screen panels, grid options and help modals using the runtime `RecordingModeModule` properties.
- **Implementation:**
  - Replace explicit switches for forms and checklists with map queries to `module.formFields` and `module.defaultChecklist`.
  - Standardize tooltips and colors using properties in the registration configuration.
