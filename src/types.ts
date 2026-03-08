export type MarkerType = 'action' | 'decision' | 'person' | 'location' | 'image' | 'custom' | 'cut' | 'emotion' | 'quote';

export interface Marker {
  id: string;
  time: number; // in seconds
  type: MarkerType;
  label: string;
  icon: string;
  data?: any; // Additional data like person name, location name, etc.
}

export interface CustomButton {
  id: string;
  icon: string;
  label: string;
  type: MarkerType;
  span?: 1 | 2;
}

export type AppMode = string;

export interface ModeConfig {
  id: AppMode;
  name: string;
  icon: string;
  description: string;
  defaultButtons: CustomButton[];
  custom?: boolean;
}

export interface RecordingSession {
  id: string;
  title: string;
  date: string;
  modeId: string;
  audioBlobs: Blob[];
  markers: Marker[];
  duration: number;
  transcription?: string;
  summary?: string;
  tasks?: any[];
  images?: any[];
}
