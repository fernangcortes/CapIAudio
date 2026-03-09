import localforage from 'localforage';
import { RecordingSession, ModeConfig, CinemaProject } from '../types';
import { APP_MODES } from '../constants';

localforage.config({
  name: 'CapIAudio',
  storeName: 'sessions'
});

export async function saveSession(session: RecordingSession) {
  await localforage.setItem(`session-${session.id}`, session);
}

export async function getSession(id: string): Promise<RecordingSession | null> {
  return await localforage.getItem(`session-${id}`);
}

export async function getAllSessions(): Promise<RecordingSession[]> {
  const sessions: RecordingSession[] = [];
  await localforage.iterate((value: RecordingSession, key: string) => {
    if (key.startsWith('session-')) {
      sessions.push(value);
    }
  });
  return sessions.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
}

export async function deleteSession(id: string) {
  await localforage.removeItem(`session-${id}`);
}

export function getCustomModes(): ModeConfig[] {
  const modesStr = localStorage.getItem('CUSTOM_MODES');
  return modesStr ? JSON.parse(modesStr) : [];
}

export function saveCustomModes(modes: ModeConfig[]) {
  localStorage.setItem('CUSTOM_MODES', JSON.stringify(modes));
}

export function getAllModes(): Record<string, ModeConfig> {
  const customModes = getCustomModes();
  const modes: Record<string, ModeConfig> = { ...APP_MODES };
  customModes.forEach(m => {
    modes[m.id] = m;
  });
  return modes;
}

export async function getCinemaProjects(): Promise<CinemaProject[]> {
  const projects = await localforage.getItem<CinemaProject[]>('cinema-projects');
  return projects || [];
}

export async function saveCinemaProjects(projects: CinemaProject[]) {
  await localforage.setItem('cinema-projects', projects);
}
