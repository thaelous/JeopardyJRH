/**
 * Web Audio API synthesizer for authentic Jeopardy sound effects.
 * No external MP3 files required - works 100% reliably in any browser.
 */

class JeopardySoundManager {
  private ctx: AudioContext | null = null;
  private thinkMusicInterval: number | null = null;
  private isMuted: boolean = false;
  private volume: number = 0.7;

  private initCtx() {
    try {
      if (!this.ctx && typeof window !== 'undefined') {
        const AudioCtxClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
        if (AudioCtxClass) {
          this.ctx = new AudioCtxClass();
        }
      }
      if (this.ctx && this.ctx.state === 'suspended') {
        this.ctx.resume().catch(() => {});
      }
    } catch (e) {
      // Ignore audio context initialization failures in restrictive environments
      this.ctx = null;
    }
  }

  public setMuted(muted: boolean) {
    this.isMuted = muted;
    if (muted) {
      this.stopThinkMusic();
    }
  }

  public getIsMuted(): boolean {
    return this.isMuted;
  }

  public setVolume(vol: number) {
    this.volume = Math.max(0, Math.min(1, vol));
  }

  public getVolume(): number {
    return this.volume;
  }

  /**
   * Clue select / board ping sound
   */
  public playSelectClue() {
    if (this.isMuted) return;
    this.initCtx();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(587.33, now); // D5
    osc.frequency.exponentialRampToValueAtTime(880, now + 0.12); // A5

    gain.gain.setValueAtTime(this.volume * 0.4, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(now);
    osc.stop(now + 0.35);
  }

  /**
   * The classic loud buzzer sound when a team hits the button
   */
  public playBuzzer() {
    if (this.isMuted) return;
    this.initCtx();
    if (!this.ctx) return;

    // Stop thinking music immediately when someone buzzes in
    this.stopThinkMusic();

    const now = this.ctx.currentTime;
    const osc1 = this.ctx.createOscillator();
    const osc2 = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    // Harsh dual sawtooth wave for classic game show buzzer
    osc1.type = 'sawtooth';
    osc1.frequency.setValueAtTime(140, now);
    osc1.frequency.linearRampToValueAtTime(130, now + 0.45);

    osc2.type = 'square';
    osc2.frequency.setValueAtTime(210, now);
    osc2.frequency.linearRampToValueAtTime(195, now + 0.45);

    gain.gain.setValueAtTime(this.volume * 0.7, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.5);

    osc1.connect(gain);
    osc2.connect(gain);
    gain.connect(this.ctx.destination);

    osc1.start(now);
    osc2.start(now);
    osc1.stop(now + 0.5);
    osc2.stop(now + 0.5);

    // Haptic feedback for mobile
    if (navigator.vibrate) {
      navigator.vibrate([80, 40, 120]);
    }
  }

  /**
   * Correct Answer: Celebratory ascending fanfare chime
   */
  public playCorrect() {
    if (this.isMuted) return;
    this.initCtx();
    if (!this.ctx) return;

    this.stopThinkMusic();

    const now = this.ctx.currentTime;
    const notes = [
      { freq: 523.25, time: 0.00, dur: 0.12 }, // C5
      { freq: 659.25, time: 0.10, dur: 0.12 }, // E5
      { freq: 783.99, time: 0.20, dur: 0.14 }, // G5
      { freq: 1046.5, time: 0.32, dur: 0.45 }, // C6
      { freq: 1318.5, time: 0.40, dur: 0.50 }, // E6
    ];

    notes.forEach(({ freq, time, dur }) => {
      if (!this.ctx) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now + time);

      gain.gain.setValueAtTime(0, now + time);
      gain.gain.linearRampToValueAtTime(this.volume * 0.45, now + time + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, now + time + dur);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now + time);
      osc.stop(now + time + dur);
    });

    // Subtle synthesizer applause noise
    this.playApplauseNoise(now + 0.3, 0.9);
  }

  /**
   * Wrong Answer: Classic low double rasp / strike
   */
  public playWrong() {
    if (this.isMuted) return;
    this.initCtx();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;

    const playStrike = (startTime: number) => {
      if (!this.ctx) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(115, startTime);
      osc.frequency.exponentialRampToValueAtTime(80, startTime + 0.25);

      gain.gain.setValueAtTime(this.volume * 0.55, startTime);
      gain.gain.exponentialRampToValueAtTime(0.01, startTime + 0.28);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(startTime);
      osc.stop(startTime + 0.28);
    };

    playStrike(now);
    playStrike(now + 0.22);
  }

  /**
   * Time Up Buzzer: Continuous low warning tone
   */
  public playTimeUp() {
    if (this.isMuted) return;
    this.initCtx();
    if (!this.ctx) return;

    this.stopThinkMusic();

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(98, now);
    osc.frequency.linearRampToValueAtTime(75, now + 0.8);

    gain.gain.setValueAtTime(this.volume * 0.6, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.85);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(now);
    osc.stop(now + 0.85);
  }

  /**
   * Daily Double / Special clue reveal fanfare
   */
  public playDailyDouble() {
    if (this.isMuted) return;
    this.initCtx();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    const steps = [
      { f: 440, t: 0.0, d: 0.15 },
      { f: 554.37, t: 0.12, d: 0.15 },
      { f: 659.25, t: 0.24, d: 0.18 },
      { f: 880, t: 0.38, d: 0.45 },
    ];

    steps.forEach(({ f, t, d }) => {
      if (!this.ctx) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(f, now + t);
      gain.gain.setValueAtTime(this.volume * 0.5, now + t);
      gain.gain.exponentialRampToValueAtTime(0.001, now + t + d);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(now + t);
      osc.stop(now + t + d);
    });
  }

  /**
   * Classic Jeopardy "Think!" Theme synthesized
   */
  public startThinkMusic() {
    if (this.isMuted) return;
    this.stopThinkMusic();
    this.initCtx();
    if (!this.ctx) return;

    // Jeopardy Think melody notes (approximate in F Major)
    // C5, F5, C5, F4, C5, F5, C5 / C5, F5, C5, A5, G5, F5, E5, D5
    const bpm = 128;
    const beat = 60 / bpm; // ~0.468s
    const eighth = beat / 2;

    const melody: { note: number; dur: number }[] = [
      // Bar 1
      { note: 523.25, dur: eighth }, // C5
      { note: 698.46, dur: eighth }, // F5
      { note: 523.25, dur: eighth }, // C5
      { note: 349.23, dur: eighth }, // F4
      { note: 523.25, dur: eighth }, // C5
      { note: 698.46, dur: eighth }, // F5
      { note: 523.25, dur: beat },   // C5
      // Bar 2
      { note: 523.25, dur: eighth }, // C5
      { note: 698.46, dur: eighth }, // F5
      { note: 523.25, dur: eighth }, // C5
      { note: 880.00, dur: eighth }, // A5
      { note: 783.99, dur: eighth }, // G5
      { note: 698.46, dur: eighth }, // F5
      { note: 659.25, dur: eighth }, // E5
      { note: 587.33, dur: eighth }, // D5
      // Bar 3
      { note: 523.25, dur: eighth }, // C5
      { note: 698.46, dur: eighth }, // F5
      { note: 523.25, dur: eighth }, // C5
      { note: 349.23, dur: eighth }, // F4
      { note: 523.25, dur: eighth }, // C5
      { note: 698.46, dur: eighth }, // F5
      { note: 523.25, dur: beat },   // C5
      // Bar 4 (Ending turn)
      { note: 880.00, dur: beat * 0.75 }, // A5
      { note: 783.99, dur: eighth * 0.5 }, // G5
      { note: 698.46, dur: beat * 1.5 },   // F5
    ];

    let noteIdx = 0;
    const playNextNote = () => {
      if (this.isMuted || !this.ctx) return;
      const item = melody[noteIdx % melody.length];
      const now = this.ctx.currentTime;

      // Lead vibraphone / marimba synth
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(item.note, now);

      // Soft envelope for mallet feel
      gain.gain.setValueAtTime(0, now);
      gain.gain.linearRampToValueAtTime(this.volume * 0.28, now + 0.015);
      gain.gain.exponentialRampToValueAtTime(0.001, now + item.dur * 0.88);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now);
      osc.stop(now + item.dur * 0.9);

      // Bass accompaniment on downbeats
      if (noteIdx % 4 === 0) {
        const bassOsc = this.ctx.createOscillator();
        const bassGain = this.ctx.createGain();
        bassOsc.type = 'triangle';
        bassOsc.frequency.setValueAtTime(item.note / 4, now);
        bassGain.gain.setValueAtTime(this.volume * 0.15, now);
        bassGain.gain.exponentialRampToValueAtTime(0.001, now + beat * 0.8);
        bassOsc.connect(bassGain);
        bassGain.connect(this.ctx.destination);
        bassOsc.start(now);
        bassOsc.stop(now + beat * 0.8);
      }

      noteIdx++;
      this.thinkMusicInterval = window.setTimeout(playNextNote, item.dur * 1000);
    };

    playNextNote();
  }

  public stopThinkMusic() {
    if (this.thinkMusicInterval !== null) {
      clearTimeout(this.thinkMusicInterval);
      this.thinkMusicInterval = null;
    }
  }

  private playApplauseNoise(startTime: number, duration: number) {
    if (!this.ctx) return;
    try {
      const bufferSize = Math.floor(this.ctx.sampleRate * duration);
      const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (bufferSize * 0.8));
      }

      const noise = this.ctx.createBufferSource();
      noise.buffer = buffer;

      const filter = this.ctx.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(1200, startTime);
      filter.Q.setValueAtTime(1.2, startTime);

      const gain = this.ctx.createGain();
      gain.gain.setValueAtTime(this.volume * 0.15, startTime);
      gain.gain.exponentialRampToValueAtTime(0.001, startTime + duration);

      noise.connect(filter);
      filter.connect(gain);
      gain.connect(this.ctx.destination);

      noise.start(startTime);
      noise.stop(startTime + duration);
    } catch {
      // Audio buffer creation fallback
    }
  }
}

export const soundManager = new JeopardySoundManager();
