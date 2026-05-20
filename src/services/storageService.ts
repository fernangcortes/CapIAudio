import localforage from 'localforage';
import { RecordingSession, ModeConfig, CinemaProject } from '../types';
import { APP_MODES } from '../constants';
import { auth, db, handleFirestoreError, OperationType } from './firebase';
import {
  doc,
  setDoc,
  getDoc,
  getDocs,
  deleteDoc,
  collection,
  query,
  where,
  writeBatch
} from 'firebase/firestore';

localforage.config({
  name: 'CapIAudio',
  storeName: 'sessions'
});

// Helper to clean audio blobs for Firestore (as Firestore cannot store binary blobs)
function cleanSessionForFirestore(session: RecordingSession, userId: string): any {
  const { audioBlobs, ...firebaseSession } = session;
  return {
    ...firebaseSession,
    userId,
    updatedAt: new Date().toISOString()
  };
}

export async function saveSession(session: RecordingSession) {
  // Always save locally
  await localforage.setItem(`session-${session.id}`, session);

  // If authenticated, also sync with Firestore
  if (auth.currentUser) {
    const cleanData = cleanSessionForFirestore(session, auth.currentUser.uid);
    const path = `sessions/${session.id}`;
    try {
      await setDoc(doc(db, 'sessions', session.id), cleanData);
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, path);
    }
  }
}

export async function getSession(id: string): Promise<RecordingSession | null> {
  const local = await localforage.getItem<RecordingSession>(`session-${id}`);
  if (local) return local;

  if (auth.currentUser) {
    const path = `sessions/${id}`;
    try {
      const docRef = doc(db, 'sessions', id);
      const snap = await getDoc(docRef);
      if (snap.exists()) {
        const data = snap.data() as RecordingSession;
        // Cache locally (with empty audioBlobs list since audio doesn't sync from Firestore)
        const session: RecordingSession = {
          ...data,
          audioBlobs: []
        };
        await localforage.setItem(`session-${id}`, session);
        return session;
      }
    } catch (error) {
      handleFirestoreError(error, OperationType.GET, path);
    }
  }

  return null;
}

export async function getAllSessions(): Promise<RecordingSession[]> {
  const localSessionsMap = new Map<string, RecordingSession>();

  // Fetch local sessions
  await localforage.iterate((value: RecordingSession, key: string) => {
    if (key.startsWith('session-')) {
      localSessionsMap.set(value.id, value);
    }
  });

  // If signed in, merge from firestore
  if (auth.currentUser) {
    const path = 'sessions';
    try {
      const q = query(
        collection(db, 'sessions'),
        where('userId', '==', auth.currentUser.uid)
      );
      const querySnapshot = await getDocs(q);
      
      for (const docSnap of querySnapshot.docs) {
        const cloudData = docSnap.data();
        const existingLocal = localSessionsMap.get(cloudData.id);
        
        const mergedSession: RecordingSession = {
          ...existingLocal, // Preserve local audio blobs if they already exist
          id: cloudData.id,
          title: cloudData.title,
          date: cloudData.date,
          modeId: cloudData.modeId,
          markers: cloudData.markers || [],
          duration: cloudData.duration || 0,
          transcription: cloudData.transcription,
          summary: cloudData.summary,
          tasks: cloudData.tasks,
          decisions: cloudData.decisions,
          intelligentIndex: cloudData.intelligentIndex,
          cinemaMetadata: cloudData.cinemaMetadata,
          setupData: cloudData.setupData,
          audioBlobs: existingLocal ? existingLocal.audioBlobs : []
        };
        
        localSessionsMap.set(cloudData.id, mergedSession);
        // Sync local cache
        await localforage.setItem(`session-${cloudData.id}`, mergedSession);
      }
    } catch (error) {
      handleFirestoreError(error, OperationType.LIST, path);
    }
  }

  const sessions = Array.from(localSessionsMap.values());
  return sessions.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
}

export async function deleteSession(id: string) {
  // Remove locally
  await localforage.removeItem(`session-${id}`);

  // Remove form Firestore
  if (auth.currentUser) {
    const path = `sessions/${id}`;
    try {
      await deleteDoc(doc(db, 'sessions', id));
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, path);
    }
  }
}

export function getCustomModes(): ModeConfig[] {
  const modesStr = localStorage.getItem('CUSTOM_MODES');
  return modesStr ? JSON.parse(modesStr) : [];
}

export function saveCustomModes(modes: ModeConfig[]) {
  // Save locally
  localStorage.setItem('CUSTOM_MODES', JSON.stringify(modes));

  // If signed in, sync asynchronously in background
  if (auth.currentUser) {
    const userId = auth.currentUser.uid;
    const batch = writeBatch(db);
    
    modes.forEach(mode => {
      const docRef = doc(db, 'custom_modes', mode.id);
      batch.set(docRef, {
        ...mode,
        userId,
        updatedAt: new Date().toISOString()
      });
    });

    batch.commit().catch(err => {
      console.error("Failed to commit custom modes batch: ", err);
    });
  }
}

export function getAllModes(): Record<string, ModeConfig> {
  const customModes = getCustomModes();
  const modes: Record<string, ModeConfig> = { ...APP_MODES };
  customModes.forEach(m => {
    modes[m.id] = m;
  });
  return modes;
}

// Cloud fetching for custom modes when logging in
export async function syncCustomModesFromCloud(): Promise<ModeConfig[]> {
  if (!auth.currentUser) return [];
  const path = 'custom_modes';
  try {
    const q = query(
      collection(db, 'custom_modes'),
      where('userId', '==', auth.currentUser.uid)
    );
    const snap = await getDocs(q);
    const cloudModes: ModeConfig[] = [];
    snap.forEach(docSnap => {
      const data = docSnap.data();
      cloudModes.push({
        id: data.id,
        name: data.name,
        icon: data.icon,
        description: data.description,
        defaultButtons: data.defaultButtons || [],
        custom: data.custom ?? true,
        formFields: data.formFields || []
      });
    });

    if (cloudModes.length > 0) {
      // Merge with local configurations and save
      const localModes = getCustomModes();
      const localMap = new Map(localModes.map(m => [m.id, m]));
      cloudModes.forEach(m => {
        localMap.set(m.id, m);
      });
      const merged = Array.from(localMap.values());
      localStorage.setItem('CUSTOM_MODES', JSON.stringify(merged));
      return merged;
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, path);
  }
  return getCustomModes();
}

export async function getCinemaProjects(): Promise<CinemaProject[]> {
  const projects = await localforage.getItem<CinemaProject[]>('cinema-projects') || [];
  
  if (auth.currentUser) {
    const path = 'cinema_projects';
    try {
      const q = query(
        collection(db, 'cinema_projects'),
        where('userId', '==', auth.currentUser.uid)
      );
      const snap = await getDocs(q);
      const cloudProjects: CinemaProject[] = [];
      snap.forEach(docSnap => {
        const data = docSnap.data();
        cloudProjects.push({
          id: data.id,
          name: data.name,
          scenes: data.scenes || []
        });
      });

      if (cloudProjects.length > 0) {
        const projectsMap = new Map(projects.map(p => [p.id, p]));
        cloudProjects.forEach(cp => {
          projectsMap.set(cp.id, cp);
        });
        const merged = Array.from(projectsMap.values());
        await localforage.setItem('cinema-projects', merged);
        return merged;
      }
    } catch (error) {
      handleFirestoreError(error, OperationType.LIST, path);
    }
  }

  return projects;
}

export async function saveCinemaProjects(projects: CinemaProject[]) {
  await localforage.setItem('cinema-projects', projects);

  if (auth.currentUser) {
    const userId = auth.currentUser.uid;
    const batch = writeBatch(db);
    
    projects.forEach(proj => {
      const docRef = doc(db, 'cinema_projects', proj.id);
      batch.set(docRef, {
        ...proj,
        userId,
        updatedAt: new Date().toISOString()
      });
    });

    batch.commit().catch(err => {
      console.error("Failed to sync cinema projects to cloud: ", err);
    });
  }
}
