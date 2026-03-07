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
}

export type AppMode = 'interview' | 'lecture' | 'meeting' | 'medical' | 'writing' | 'journalism';

export interface ModeConfig {
  id: AppMode;
  name: string;
  icon: string;
  description: string;
  defaultButtons: CustomButton[];
}
