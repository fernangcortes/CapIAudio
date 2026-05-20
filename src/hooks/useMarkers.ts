import { useState, useCallback } from 'react';
import { Marker, CustomButton, MarkerType } from '../types';

export function useMarkers(initialButtons: CustomButton[]) {
  const [markers, setMarkers] = useState<Marker[]>([]);
  const [redoStack, setRedoStack] = useState<Marker[]>([]);
  const [customButtons, setCustomButtons] = useState<CustomButton[]>(initialButtons);
  const [speakers, setSpeakers] = useState<{id: string, name: string}[]>([]);

  const addMarker = useCallback((time: number, button: CustomButton, data?: any, explicitTime?: number) => {
    const newMarker: Marker = {
      id: Math.random().toString(36).substr(2, 9),
      time: explicitTime !== undefined ? explicitTime : time,
      type: button.type,
      label: button.label,
      icon: button.icon,
      data
    };
    setMarkers(prev => [...prev, newMarker]);
    setRedoStack([]); // Clear redo chain on new entry
    return newMarker;
  }, []);

  const undoMarker = useCallback(() => {
    let undone: Marker | undefined;
    setMarkers(prev => {
      if (prev.length === 0) return prev;
      const copy = [...prev];
      undone = copy.pop();
      return copy;
    });
    if (undone) {
      setRedoStack(prev => [...prev, undone!]);
    }
  }, []);

  const redoMarker = useCallback(() => {
    let redone: Marker | undefined;
    setRedoStack(prev => {
      if (prev.length === 0) return prev;
      const copy = [...prev];
      redone = copy.pop();
      return copy;
    });
    if (redone) {
      setMarkers(prev => [...prev, redone!]);
    }
  }, []);

  const deleteMarker = useCallback((markerId: string) => {
    setMarkers(prev => prev.filter(m => m.id !== markerId));
  }, []);

  const addCustomButton = useCallback((icon: string, label: string, type: MarkerType = 'custom') => {
    const newButton: CustomButton = {
      id: Math.random().toString(36).substr(2, 9),
      icon,
      label,
      type
    };
    setCustomButtons(prev => [...prev, newButton]);
    return newButton;
  }, []);

  const addSpeaker = useCallback((name: string) => {
    const newSpeaker = {
      id: Math.random().toString(36).substr(2, 9),
      name
    };
    setSpeakers(prev => [...prev, newSpeaker]);
    return newSpeaker;
  }, []);

  const resetMarkers = useCallback(() => {
    setMarkers([]);
    setRedoStack([]);
    setSpeakers([]);
  }, []);

  const setButtons = useCallback((buttons: CustomButton[]) => {
    setCustomButtons(buttons);
  }, []);

  const setMarkersState = useCallback((newMarkers: Marker[]) => {
    setMarkers(newMarkers);
    setRedoStack([]);
  }, []);

  return {
    markers,
    redoStack,
    customButtons,
    speakers,
    addMarker,
    undoMarker,
    redoMarker,
    deleteMarker,
    addCustomButton,
    addSpeaker,
    resetMarkers,
    setButtons,
    setMarkers: setMarkersState
  };
}
