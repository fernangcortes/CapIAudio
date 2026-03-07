import { useState, useCallback } from 'react';
import { Marker, CustomButton, MarkerType } from '../types';

export function useMarkers(initialButtons: CustomButton[]) {
  const [markers, setMarkers] = useState<Marker[]>([]);
  const [customButtons, setCustomButtons] = useState<CustomButton[]>(initialButtons);

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

  const resetMarkers = useCallback(() => {
    setMarkers([]);
  }, []);

  const setButtons = useCallback((buttons: CustomButton[]) => {
    setCustomButtons(buttons);
  }, []);

  return {
    markers,
    customButtons,
    addMarker,
    addCustomButton,
    resetMarkers,
    setButtons
  };
}
