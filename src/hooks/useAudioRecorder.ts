import { useState, useRef, useCallback, useEffect } from 'react';

interface UseAudioRecorderProps {
  onChunkReady?: (blob: Blob, startTime: number) => void;
  chunkDurationMs?: number;
}

export function useAudioRecorder({ onChunkReady, chunkDurationMs = 600000 }: UseAudioRecorderProps = {}) {
  const [isRecording, setIsRecording] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [mediaStream, setMediaStream] = useState<MediaStream | null>(null);
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<number | null>(null);
  const sliceTimerRef = useRef<number | null>(null);
  const startTimeRef = useRef<number>(0);
  const pausedTimeRef = useRef<number>(0);
  const isSlicingRef = useRef<boolean>(false);
  const chunkStartTimeRef = useRef<number>(0);

  const startNewRecorder = useCallback((stream: MediaStream) => {
    const mediaRecorder = new MediaRecorder(stream);
    mediaRecorderRef.current = mediaRecorder;
    audioChunksRef.current = [];

    mediaRecorder.ondataavailable = (event) => {
      if (event.data.size > 0) {
        audioChunksRef.current.push(event.data);
      }
    };

    mediaRecorder.onstop = () => {
      const blob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
      if (isSlicingRef.current) {
        if (onChunkReady) {
          onChunkReady(blob, chunkStartTimeRef.current);
        }
        chunkStartTimeRef.current = currentTime;
        isSlicingRef.current = false;
        startNewRecorder(stream);
      } else {
        setAudioBlob(blob);
        setAudioUrl(URL.createObjectURL(blob));
        stream.getTracks().forEach(track => track.stop());
      }
    };

    mediaRecorder.start(100);
  }, [onChunkReady, currentTime]);

  const startRecording = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      setMediaStream(stream);
      chunkStartTimeRef.current = 0;
      
      startNewRecorder(stream);

      setIsRecording(true);
      setIsPaused(false);
      setAudioBlob(null);
      setAudioUrl(null);
      
      startTimeRef.current = Date.now() - (currentTime * 1000);
      timerRef.current = window.setInterval(() => {
        setCurrentTime((Date.now() - startTimeRef.current) / 1000);
      }, 100);

      if (chunkDurationMs > 0) {
        sliceTimerRef.current = window.setInterval(() => {
          if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
            isSlicingRef.current = true;
            mediaRecorderRef.current.stop();
          }
        }, chunkDurationMs);
      }
      
    } catch (err) {
      console.error('Error accessing microphone:', err);
      alert('Não foi possível acessar o microfone.');
    }
  }, [currentTime, startNewRecorder, chunkDurationMs]);

  const pauseRecording = useCallback(() => {
    if (mediaRecorderRef.current && isRecording) {
      if (isPaused) {
        mediaRecorderRef.current.resume();
        setIsPaused(false);
        startTimeRef.current = Date.now() - pausedTimeRef.current;
        timerRef.current = window.setInterval(() => {
          setCurrentTime((Date.now() - startTimeRef.current) / 1000);
        }, 100);
        
        // Resume slice timer
        if (chunkDurationMs > 0) {
          sliceTimerRef.current = window.setInterval(() => {
            if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
              isSlicingRef.current = true;
              mediaRecorderRef.current.stop();
            }
          }, chunkDurationMs);
        }
      } else {
        mediaRecorderRef.current.pause();
        setIsPaused(true);
        pausedTimeRef.current = Date.now() - startTimeRef.current;
        if (timerRef.current) clearInterval(timerRef.current);
        if (sliceTimerRef.current) clearInterval(sliceTimerRef.current);
      }
    }
  }, [isRecording, isPaused, chunkDurationMs]);

  const stopRecording = useCallback((): Promise<Blob> => {
    return new Promise((resolve) => {
      if (mediaRecorderRef.current && isRecording) {
        isSlicingRef.current = false;
        
        // Override onstop to resolve the promise
        const originalOnStop = mediaRecorderRef.current.onstop;
        mediaRecorderRef.current.onstop = (e) => {
          if (originalOnStop) originalOnStop.call(mediaRecorderRef.current, e);
          const blob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
          resolve(blob);
        };
        
        mediaRecorderRef.current.stop();
        setIsRecording(false);
        setIsPaused(false);
        setMediaStream(null);
        if (timerRef.current) clearInterval(timerRef.current);
        if (sliceTimerRef.current) clearInterval(sliceTimerRef.current);
      } else {
        resolve(new Blob());
      }
    });
  }, [isRecording]);

  const resetRecording = useCallback(() => {
    setAudioBlob(null);
    setAudioUrl(null);
    setCurrentTime(0);
    audioChunksRef.current = [];
    if (timerRef.current) clearInterval(timerRef.current);
    if (sliceTimerRef.current) clearInterval(sliceTimerRef.current);
  }, []);

  const getAudioChunk = useCallback(() => {
    return new Blob(audioChunksRef.current, { type: 'audio/webm' });
  }, []);

  return {
    isRecording,
    isPaused,
    currentTime,
    audioBlob,
    audioUrl,
    mediaStream,
    startRecording,
    pauseRecording,
    stopRecording,
    resetRecording,
    setCurrentTime,
    getAudioChunk
  };
}
