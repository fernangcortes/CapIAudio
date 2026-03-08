import { useState, useCallback } from 'react';
import { Marker, CustomButton, MarkerType } from '../types';

export function useMarkers(initialButtons: CustomButton[]) {
  const [markers, setMarkers] = useState<Marker[]>([]);
  const [customButtons, setCustomButtons] = useState<CustomButton[]>(initialButtons);
  const [speakers, setSpeakers] = useState<{id: string, name: string}[]>([]);

  const addMarker = useCallback((time: number, button: CustomButton, data?: any) => {
    const newMarker: Marker = {
      id: Math.random().toString(36).substr(2, 9),
      time,
      type: button.type,
      label: button.label,
      icon: button.icon,
      data
    };
    setMarkers(prev => [...prev, newMarker]);
    return newMarker;
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
    // We might want to keep speakers across resets, or clear them. Let's keep them for now, or maybe clear them if it's a new recording.
    // Actually, let's clear them on reset.
    setSpeakers([]);
  }, []);

  const setButtons = useCallback((buttons: CustomButton[]) => {
    setCustomButtons(buttons);
  }, []);

  const setMarkersState = useCallback((newMarkers: Marker[]) => {
    setMarkers(newMarkers);
  }, []);

  return {
    markers,
    customButtons,
    speakers,
    addMarker,
    addCustomButton,
    addSpeaker,
    resetMarkers,
    setButtons,
    setMarkers: setMarkersState
  };
}
