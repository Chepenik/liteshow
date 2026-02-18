// Web Audio API: FFT, beat detection, smoothing. Zero Three.js deps.

import {
  FFT_SIZE, BAND_RANGES, BEAT_HISTORY_SIZE,
  BEAT_THRESHOLD, HARD_BEAT_THRESHOLD,
  BEAT_MIN_ENERGY, HARD_BEAT_MIN_ENERGY,
  BEAT_COOLDOWN, HARD_BEAT_COOLDOWN,
  SMOOTH_ATTACK_HIGH, SMOOTH_ATTACK_LOW, SMOOTH_ATTACK_MID,
  SMOOTH_DECAY, PEAK_DECAY,
  type BandKey,
} from './constants';

export interface FrequencyBands {
  subBass: number;
  bass: number;
  lowMid: number;
  mid: number;
  highMid: number;
  high: number;
  energy: number;
}

function zeroBands(): FrequencyBands {
  return { subBass: 0, bass: 0, lowMid: 0, mid: 0, highMid: 0, high: 0, energy: 0 };
}

export class AudioAnalyzer {
  ctx: AudioContext | null = null;
  analyser: AnalyserNode | null = null;
  source: AudioBufferSourceNode | null = null;
  audioBuffer: AudioBuffer | null = null;
  gainNode: GainNode | null = null;
  freqData: Uint8Array<ArrayBuffer> | null = null;
  timeData: Uint8Array<ArrayBuffer> | null = null;
  isPlaying = false;
  startTime = 0;
  pauseTime = 0;
  sensitivity = 1.3;

  bands: FrequencyBands = zeroBands();
  smooth: FrequencyBands = zeroBands();
  peak: FrequencyBands = zeroBands();

  beatHistory = new Float32Array(BEAT_HISTORY_SIZE);
  beatIdx = 0;
  isBeat = false;
  isHardBeat = false;
  beatCooldown = 0;
  timeSinceBeat = 99;

  async init(arrayBuffer: ArrayBuffer) {
    if (this.ctx) {
      try { this.ctx.close(); } catch { /* ignore */ }
    }
    this.ctx = new AudioContext();
    this.audioBuffer = await this.ctx.decodeAudioData(arrayBuffer);
    this.analyser = this.ctx.createAnalyser();
    this.analyser.fftSize = FFT_SIZE;
    this.analyser.smoothingTimeConstant = 0.75;
    this.gainNode = this.ctx.createGain();
    this.gainNode.connect(this.analyser);
    this.analyser.connect(this.ctx.destination);
    this.freqData = new Uint8Array(this.analyser.frequencyBinCount);
    this.timeData = new Uint8Array(this.analyser.frequencyBinCount);
    this.pauseTime = 0;
    this.isPlaying = false;
  }

  play() {
    if (this.isPlaying || !this.ctx || !this.audioBuffer || !this.gainNode) return;
    this.source = this.ctx.createBufferSource();
    this.source.buffer = this.audioBuffer;
    this.source.connect(this.gainNode);
    this.source.onended = () => { this.isPlaying = false; };
    this.source.start(0, this.pauseTime);
    this.startTime = this.ctx.currentTime - this.pauseTime;
    this.isPlaying = true;
  }

  pause() {
    if (!this.isPlaying || !this.ctx) return;
    this.source?.stop();
    this.pauseTime = this.ctx.currentTime - this.startTime;
    this.isPlaying = false;
  }

  toggle() {
    this.isPlaying ? this.pause() : this.play();
  }

  seek(t: number) {
    const wasPlaying = this.isPlaying;
    if (wasPlaying) {
      try { this.source?.stop(); } catch { /* ignore */ }
      this.isPlaying = false;
    }
    this.pauseTime = Math.max(0, Math.min(t, this.duration));
    if (wasPlaying) this.play();
  }

  get currentTime(): number {
    if (!this.ctx) return 0;
    return this.isPlaying ? this.ctx.currentTime - this.startTime : this.pauseTime;
  }

  get duration(): number {
    return this.audioBuffer ? this.audioBuffer.duration : 0;
  }

  private _avg(a: number, b: number): number {
    if (!this.freqData) return 0;
    let s = 0;
    for (let i = a; i < b && i < this.freqData.length; i++) s += this.freqData[i];
    return (s / (b - a)) / 255;
  }

  update(dt: number) {
    if (!this.analyser || !this.isPlaying || !this.freqData || !this.timeData) return;
    this.analyser.getByteFrequencyData(this.freqData);
    this.analyser.getByteTimeDomainData(this.timeData);

    const s = this.sensitivity;
    const bandKeys: BandKey[] = ['subBass', 'bass', 'lowMid', 'mid', 'highMid', 'high'];
    for (const k of bandKeys) {
      const [lo, hi] = BAND_RANGES[k];
      this.bands[k] = Math.min(this._avg(lo, hi) * s, 1);
    }
    this.bands.energy = (this.bands.subBass + this.bands.bass + this.bands.lowMid + this.bands.mid + this.bands.highMid + this.bands.high) / 6;

    // Smoothing
    for (const k of [...bandKeys, 'energy' as const]) {
      const atk = (k === 'high' || k === 'highMid') ? SMOOTH_ATTACK_HIGH
        : (k === 'subBass' || k === 'bass') ? SMOOTH_ATTACK_LOW
        : SMOOTH_ATTACK_MID;
      const t = this.bands[k], c = this.smooth[k];
      this.smooth[k] += (t - c) * (t > c ? atk : SMOOTH_DECAY);
      if (t > this.peak[k]) this.peak[k] = t;
      else this.peak[k] *= PEAK_DECAY;
    }

    // Beat detection
    const be = this.bands.subBass * 0.6 + this.bands.bass * 0.4;
    this.beatHistory[this.beatIdx % BEAT_HISTORY_SIZE] = be;
    this.beatIdx++;
    let avg = 0;
    for (let i = 0; i < BEAT_HISTORY_SIZE; i++) avg += this.beatHistory[i];
    avg /= BEAT_HISTORY_SIZE;

    this.beatCooldown -= dt;
    this.timeSinceBeat += dt;
    this.isBeat = false;
    this.isHardBeat = false;

    if (this.beatCooldown <= 0 && be > avg * BEAT_THRESHOLD && be > BEAT_MIN_ENERGY) {
      this.isBeat = true;
      this.timeSinceBeat = 0;
      this.beatCooldown = BEAT_COOLDOWN;
      if (be > avg * HARD_BEAT_THRESHOLD && be > HARD_BEAT_MIN_ENERGY) {
        this.isHardBeat = true;
        this.beatCooldown = HARD_BEAT_COOLDOWN;
      }
    }
  }
}
