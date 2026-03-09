import { useState, useRef, useCallback } from 'react';

export function useAudioRecorder() {
  const [isRecording, setIsRecording] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [mediaStream, setMediaStream] = useState<MediaStream | null>(null);
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<number | null>(null);
  const startTimeRef = useRef<number>(0);
  const pausedTimeRef = useRef<number>(0);

  const startRecording = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.start(100);
      setIsRecording(true);
      setIsPaused(false);
      setAudioBlob(null);
      setAudioUrl(null);
      setMediaStream(stream);
      
      startTimeRef.current = Date.now() - (currentTime * 1000);
      timerRef.current = window.setInterval(() => {
        setCurrentTime((Date.now() - startTimeRef.current) / 1000);
      }, 100);
      
    } catch (err) {
      console.error('Error accessing microphone:', err);
      alert('Não foi possível acessar o microfone.');
    }
  }, [currentTime]);

  const pauseRecording = useCallback(() => {
    if (mediaRecorderRef.current && isRecording) {
      if (isPaused) {
        mediaRecorderRef.current.resume();
        setIsPaused(false);
        startTimeRef.current = Date.now() - pausedTimeRef.current;
        timerRef.current = window.setInterval(() => {
          setCurrentTime((Date.now() - startTimeRef.current) / 1000);
        }, 100);
      } else {
        mediaRecorderRef.current.pause();
        setIsPaused(true);
        pausedTimeRef.current = Date.now() - startTimeRef.current;
        if (timerRef.current) clearInterval(timerRef.current);
      }
    }
  }, [isRecording, isPaused]);

  const stopRecording = useCallback((): Promise<Blob> => {
    return new Promise((resolve) => {
      if (mediaRecorderRef.current && isRecording) {
        mediaRecorderRef.current.onstop = () => {
          const blob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
          setAudioBlob(blob);
          setAudioUrl(URL.createObjectURL(blob));
          mediaRecorderRef.current?.stream.getTracks().forEach(track => track.stop());
          resolve(blob);
        };
        mediaRecorderRef.current.stop();
        setIsRecording(false);
        setIsPaused(false);
        setMediaStream(null);
        if (timerRef.current) clearInterval(timerRef.current);
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
