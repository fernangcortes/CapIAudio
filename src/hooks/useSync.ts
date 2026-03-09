import { useEffect, useState, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import { Marker, CinemaMetadata } from '../types';

interface SyncState {
  isRecording: boolean;
  currentTime: number;
  metadata: CinemaMetadata;
  markers: Marker[];
}

export function useSync(roomId: string) {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [remoteState, setRemoteState] = useState<Partial<SyncState>>({});
  const [remoteMarkers, setRemoteMarkers] = useState<Marker[]>([]);
  
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    if (!roomId) return;

    // Connect to the same host
    const newSocket = io(window.location.origin);
    socketRef.current = newSocket;

    newSocket.on('connect', () => {
      setIsConnected(true);
      newSocket.emit('join-room', roomId);
    });

    newSocket.on('disconnect', () => {
      setIsConnected(false);
    });

    newSocket.on('sync-state', (state: any) => {
      if (state.markers) setRemoteMarkers(state.markers);
      setRemoteState(state);
    });

    newSocket.on('state-updated', (state: Partial<SyncState>) => {
      setRemoteState(prev => ({ ...prev, ...state }));
    });

    newSocket.on('marker-added', (marker: Marker) => {
      setRemoteMarkers(prev => {
        // Prevent duplicates
        if (prev.some(m => m.id === marker.id)) return prev;
        return [...prev, marker];
      });
    });

    setSocket(newSocket);

    return () => {
      newSocket.disconnect();
    };
  }, [roomId]);

  const updateState = (state: Partial<SyncState>) => {
    if (socketRef.current && isConnected) {
      socketRef.current.emit('update-state', { roomId, state });
    }
  };

  const addMarker = (marker: Marker) => {
    if (socketRef.current && isConnected) {
      socketRef.current.emit('add-marker', { roomId, marker });
    }
  };

  return {
    isConnected,
    remoteState,
    remoteMarkers,
    updateState,
    addMarker
  };
}
