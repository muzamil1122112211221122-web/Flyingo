// Simple Web Audio synthesizer for playing notes in the browser without external mp3 files

class NoteAudioPlayer {
  private ctx: AudioContext | null = null;
  private isPlaying = false;
  private currentOscillators: OscillatorNode[] = [];
  private gainNode: GainNode | null = null;
  private loopInterval: NodeJS.Timeout | null = null;

  private initCtx() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      this.ctx = new AudioCtx();
    }
    if (this.ctx.state === "suspended") {
      this.ctx.resume();
    }
  }

  playTrack(mood: string = "lofi", onTick?: () => void) {
    this.stop();
    this.initCtx();
    if (!this.ctx) return;

    this.isPlaying = true;

    // Chords progression for lo-fi / chill vibes (Hz)
    const chords = [
      [261.63, 329.63, 392.00, 493.88], // Cmaj7
      [220.00, 261.63, 329.63, 392.00], // Am7
      [174.61, 220.00, 261.63, 329.63], // Fmaj7
      [196.00, 246.94, 293.66, 392.00], // G7
    ];

    let chordIdx = 0;

    const playChord = () => {
      if (!this.isPlaying || !this.ctx) return;
      
      const freqs = chords[chordIdx % chords.length];
      chordIdx++;

      freqs.forEach((f, i) => {
        if (!this.ctx) return;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = i % 2 === 0 ? "sine" : "triangle";
        osc.frequency.setValueAtTime(f, this.ctx.currentTime);

        // Soft attack & decay envelope
        gain.gain.setValueAtTime(0.001, this.ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.08, this.ctx.currentTime + 0.3);
        gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 1.8);

        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start();
        osc.stop(this.ctx.currentTime + 2.0);
        this.currentOscillators.push(osc);
      });

      if (onTick) onTick();
    };

    playChord();
    this.loopInterval = setInterval(playChord, 1900);
  }

  stop() {
    this.isPlaying = false;
    if (this.loopInterval) {
      clearInterval(this.loopInterval);
      this.loopInterval = null;
    }
    this.currentOscillators.forEach(osc => {
      try { osc.stop(); } catch (e) {}
    });
    this.currentOscillators = [];
  }

  getIsPlaying() {
    return this.isPlaying;
  }
}

export const synthPlayer = typeof window !== "undefined" ? new NoteAudioPlayer() : null;
