import { CustomButton, FormField, ChecklistItem, Marker, CinemaMetadata, RecordingSession } from '../types';

/**
 * Data payload returned by a mode setup form.
 */
export type ModeSetupData = Record<string, any>;

/**
 * Context provided to a mode module during recording.
 */
export interface ModeRecordingContext {
  currentTime: number;
  sessionState: 'recording' | 'paused' | 'stopped' | 'idle';
  markers: Marker[];
  language: 'pt' | 'en';
}

/**
 * Protocol for data exchange during export operations.
 */
export interface ModeExportPackage {
  sessionId: string;
  audioDuration: number;
  markers: Marker[];
  setupData: ModeSetupData;
  cinemaMetadata?: CinemaMetadata;
  exportFormat: 'premiere_xml' | 'davinci_csv' | 'custom_json' | 'markdown_summary';
  formattedOutput: string;
}

/**
 * Core interface defining a separate, independent Recording Mode Module.
 * Implementing this interface ensures that modifications to any individual tool/mode
 * has zero impact on other modes or the central audio engine.
 */
export interface RecordingModeModule {
  /**
   * Unique identifier of the module (e.g., 'cinema', 'meeting', 'medical_doctor').
   */
  id: string;

  /**
   * User-friendly display name of the module.
   */
  name: string;

  /**
   * Visual icon or emoji representation.
   */
  icon: string;

  /**
   * Narrative description of the module's target application.
   */
  description: string;

  /**
   * Categorization group (e.g., '🎬 Produção de Cinema', '👔 Negócios').
   */
  category: string;

  /**
   * Static or dynamic grid of buttons default to this mode.
   */
  defaultButtons: CustomButton[];

  /**
   * Setup form fields required BEFORE starting the recording in this mode.
   */
  formFields?: FormField[];

  /**
   * Checklist templates loaded by default for this mode to aid field operations.
   */
  defaultChecklist?: string[];

  /**
   * Lifecycle Hook: Executed when the module is selected or initialized.
   */
  onInitialize?: () => void;

  /**
   * Lifecycle Hook: Executed BEFORE recording begins, validating the pre-filled fields.
   * @returns An error message string if invalid, or null if validation passes.
   */
  validateSetupData?: (data: ModeSetupData) => string | null;

  /**
   * Lifecycle Hook: Callback invoked whenever a new marker is registered during recording.
   * Provides an opportunity for modules to augment marker metadata or trigger custom logic.
   */
  onMarkerAdded?: (marker: Marker, context: ModeRecordingContext) => Marker;

  /**
   * Hook for handling special real-time canvas or dashboard layouts (e.g. Cinema full-clapperboard).
   */
  customRenderControlPanel?: (
    context: ModeRecordingContext, 
    triggerAction: (type: string, payload?: any) => void
  ) => React.ReactNode;

  /**
   * Hook for providing custom prompt templates for the Gemini AI service.
   * This guarantees that AI transcripts, diarization, and summaries are optimized for that specific domain.
   */
  getAIPromptTemplates?: (language: 'pt' | 'en') => {
    transcriptionSystemPrompt: string;
    summarySystemPrompt: string;
    keyPointsPrompt: string;
  };

  /**
   * Custom export formatting. Converts session data to domain-specific files.
   */
  formatExport?: (session: RecordingSession, format: string) => ModeExportPackage | null;
}
