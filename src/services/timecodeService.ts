export class TimecodeGenerator {
  private audioContext: AudioContext | null = null;
  private oscillator: OscillatorNode | null = null;
  private isPlaying: boolean = false;

  start() {
    if (this.isPlaying) return;
    
    try {
      this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      this.oscillator = this.audioContext.createOscillator();
      
      // Create a sound that resembles LTC (a mix of high frequencies)
      // Real LTC is a bi-phase mark encoded signal around 1-2kHz.
      // We'll use a square wave at 1200Hz as a placeholder for the "fax" sound.
      this.oscillator.type = 'square';
      this.oscillator.frequency.setValueAtTime(1200, this.audioContext.currentTime);
      
      // Add some modulation to make it sound more like data
      const modOsc = this.audioContext.createOscillator();
      modOsc.type = 'sawtooth';
      modOsc.frequency.value = 30; // 30 fps modulation
      
      const gainNode = this.audioContext.createGain();
      gainNode.gain.value = 0.5; // Reduce volume
      
      this.oscillator.connect(gainNode);
      gainNode.connect(this.audioContext.destination);
      
      this.oscillator.start();
      modOsc.start();
      
      this.isPlaying = true;
    } catch (error) {
      console.error('Erro ao iniciar gerador de Timecode:', error);
    }
  }

  stop() {
    if (!this.isPlaying) return;
    
    try {
      if (this.oscillator) {
        this.oscillator.stop();
        this.oscillator.disconnect();
      }
      if (this.audioContext) {
        this.audioContext.close();
      }
    } catch (error) {
      console.error('Erro ao parar gerador de Timecode:', error);
    } finally {
      this.isPlaying = false;
      this.oscillator = null;
      this.audioContext = null;
    }
  }

  toggle() {
    if (this.isPlaying) {
      this.stop();
    } else {
      this.start();
    }
    return this.isPlaying;
  }
}

export const timecodeGenerator = new TimecodeGenerator();
