export type MarkerType = 'action' | 'decision' | 'person' | 'location' | 'image' | 'custom' | 'cut' | 'emotion' | 'quote' | 'cinema_action' | 'cinema_cut' | 'cinema_good' | 'cinema_error' | 'cinema_note' | 'comment';

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
  color?: string; // Hex color for cinema markers
  tooltip?: string; // Explanatory tooltip
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

export interface CinemaShot {
  id: string;
  name: string;
}

export interface CinemaScene {
  id: string;
  name: string;
  shots: CinemaShot[];
}

export interface CinemaProject {
  id: string;
  name: string;
  scenes: CinemaScene[];
}

export interface CinemaMetadata {
  projectId?: string;
  sceneId?: string;
  shotId?: string;
  movieName?: string;
  scene?: string;
  shot?: string;
  take?: string;
  camera?: string;
  rollCard?: string;
  lens?: string;
  goodTake?: boolean;
  director?: string;
  dop?: string;
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
  decisions?: any[];
  intelligentIndex?: { topic: string; timeframe: string }[];
  images?: any[];
  cinemaMetadata?: CinemaMetadata;
  setupData?: Record<string, any>;
}
