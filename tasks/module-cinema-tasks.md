# Task File: Cinema & Set de Filmagem (🎬) Module

This task list covers development and decoupling of the Cinema Module from the core codebase.

## 🛠️ Objectives
- Encapsulate the full-screen interactive clapperboard (`FullScreenClapperboard.tsx`).
- Manage cinema metadata fields (Scene, Shot, Take, Lens, Camera) within isolated scope.
- Define DaVinci Resolve marker CSV export and automated clack sync triggers.

---

## 📋 Task Details

### Task CINEMA-1: Interface Implementation
- **Objective:** Create the class/object implementing `RecordingModeModule` for `cinema`.
- **Properties:**
  - `id`: `"cinema"`
  - `category`: `"🎬 Produção de Cinema"`
  - `defaultButtons`: Predefined tags for Ação/Corta, Circle Take, Erro/Problema, Focus, Light, Continuity Note.
  - `formFields`: Movie Name, Scene, Shot, Initial Take, Camera Roll, Lens.

### Task CINEMA-2: Interactive Clapperboard Isolation
- **Objective:** Ensure the full clapperboard relies solely on a standard payload model.
- **Protocol:**
  - Standardized JSON exchange interface representing clapperboard events:
    ```typescript
    interface ClapperboardClapEvent {
      timestamp: number;
      metadata: CinemaMetadata;
    }
    ```
  - Mount custom render container `customRenderControlPanel` using Framer Motion spring physics.

### Task CINEMA-3: DaVinci Resolve Marker Exporter
- **Objective:** Isolate XML and CSV formatting logic from main app view actions.
- **Implementation:**
  - Mappings of specialized cinema buttons (`cinema_error` = Red, `cinema_good` = Green, `cinema_note` = Cyan) to DaVinci CSV headers.
  - Test output format matches Resolve's import criteria: `Timecode, Name, Description, Color, Duration`.
