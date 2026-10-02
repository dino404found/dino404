import { effectNotes, frequency, musicNotes, MUSIC_STEP, type SoundCue, type Tone } from "./audio-score";

export type AudioPreferences = { music: boolean; effects: boolean; volume: number; motion: boolean };
export const DEFAULT_PREFERENCES: AudioPreferences = { music: true, effects: true, volume: .45, motion: true };
export function audioPreferences(value: unknown): AudioPreferences {
  const p = value && typeof value === "object" ? value as Partial<AudioPreferences> : {};
  return {
    music: typeof p.music === "boolean" ? p.music : true,
    effects: typeof p.effects === "boolean" ? p.effects : true,
    motion: typeof p.motion === "boolean" ? p.motion : true,
    volume: typeof p.volume === "number" && Number.isFinite(p.volume) ? Math.max(0, Math.min(1, p.volume)) : .45,
  };
}
type Voice = { source: OscillatorNode; envelope: GainNode; start: number; end: number };

/** All audio is cosmetic. No timers or audio state participate in score replay. */
export class DinoAudio {
  private context: AudioContext | null = null;
  private master: GainNode | null = null;
  private musicBus: BiquadFilterNode | null = null;
  private effectsBus: BiquadFilterNode | null = null;
  private musicVoices = new Set<Voice>();
  private effectVoices = new Set<Voice>();
  private timer: ReturnType<typeof setInterval> | undefined;
  private nextNote = 0;
  private note = 0;
  private running = false;
  private prefs = DEFAULT_PREFERENCES;
  private lastEffect = new Map<SoundCue, number>();

  constructor(private readonly createContext = () => new AudioContext({ latencyHint: "interactive" })) {}

  /** Must be invoked synchronously from Start or an audio-control gesture. */
  async unlock(): Promise<boolean> {
    let pendingContext: AudioContext | null = null;
    try {
      if (!this.context || this.context.state === "closed") {
        const ctx = this.createContext();
        this.context = ctx;
        this.master = ctx.createGain();
        this.master.gain.value = this.prefs.volume;
        this.master.connect(ctx.destination);
        this.musicBus = ctx.createBiquadFilter();
        this.musicBus.type = "lowpass"; this.musicBus.frequency.value = 1900; this.musicBus.Q.value = .4;
        this.musicBus.connect(this.master);
        this.effectsBus = ctx.createBiquadFilter();
        this.effectsBus.type = "lowpass"; this.effectsBus.frequency.value = 3400; this.effectsBus.Q.value = .4;
        this.effectsBus.connect(this.master);
      }
      pendingContext = this.context;
      if (pendingContext.state !== "running") await pendingContext.resume();
      // A pending device resume can finish after unmount/disposal and recreation.
      if (this.context !== pendingContext) return false;
      this.syncMusic();
      return pendingContext.state === "running";
    } catch {
      if (!pendingContext || this.context === pendingContext) this.dispose();
      return false;
    }
  }

  setPreferences(prefs: AudioPreferences) {
    this.prefs = prefs;
    if (this.context && this.master) {
      const gain = this.master.gain, now = this.context.currentTime;
      gain.cancelScheduledValues(now); gain.setTargetAtTime(prefs.volume, now, .018);
    }
    if (!prefs.effects || !prefs.volume) this.clearVoices(this.effectVoices);
    this.syncMusic();
  }

  beginRun() {
    this.running = true;
    this.note = 0;
    this.syncMusic();
    this.effect("start");
  }
  endRun(collision = false) {
    this.running = false;
    this.stopMusic();
    if (collision) this.effect("collision");
  }
  silence() {
    this.running = false;
    this.stopMusic(); this.clearVoices(this.effectVoices);
    // Cancel sound immediately when the tab is hidden, even before suspension.
    if (this.context?.state === "running") void this.context.suspend().catch(() => {});
  }
  dispose() {
    this.silence();
    if (this.context && this.context.state !== "closed") void this.context.close().catch(() => {});
    this.context = null; this.master = null; this.musicBus = null; this.effectsBus = null;
    this.lastEffect.clear();
  }
  effect(cue: SoundCue) {
    const ctx = this.context;
    if (!ctx || ctx.state !== "running" || !this.prefs.effects || !this.prefs.volume || !this.effectsBus) return;
    const now = ctx.currentTime;
    // Collapse catch-up ticks and held-control repetition into one audible cue.
    if (now - (this.lastEffect.get(cue) ?? -10) < .065) return;
    this.lastEffect.set(cue, now);
    if (cue === "collision") this.clearVoices(this.effectVoices);
    for (const tone of effectNotes(cue)) this.play(tone, now + tone.delay, this.effectsBus, this.effectVoices);
  }
  private syncMusic() {
    if (!this.running || !this.prefs.music || !this.prefs.volume || this.context?.state !== "running") { this.stopMusic(); return; }
    if (this.timer !== undefined) return;
    this.nextNote = this.context.currentTime + .045;
    this.schedule();
    this.timer = setInterval(() => this.schedule(), 40);
  }
  private schedule() {
    const ctx = this.context;
    if (!ctx || ctx.state !== "running" || !this.musicBus) { this.stopMusic(); return; }
    // Never fire a burst of missed notes after a stall or device interruption.
    if (this.nextNote < ctx.currentTime) this.nextNote = ctx.currentTime + .025;
    while (this.nextNote < ctx.currentTime + .16) {
      for (const tone of musicNotes(this.note++)) this.play(tone, this.nextNote, this.musicBus, this.musicVoices);
      this.nextNote += MUSIC_STEP;
    }
  }
  private play(tone: Tone, at: number, bus: AudioNode, voices: Set<Voice>) {
    const ctx = this.context;
    if (!ctx || voices.size >= 32) return;
    const source = ctx.createOscillator(), envelope = ctx.createGain();
    const end = at + tone.duration;
    source.type = tone.wave;
    source.frequency.setValueAtTime(frequency(tone.midi), at);
    if (tone.slide !== undefined) source.frequency.exponentialRampToValueAtTime(frequency(tone.slide), end);
    envelope.gain.setValueAtTime(0, at);
    envelope.gain.linearRampToValueAtTime(tone.level, at + Math.min(.015, tone.duration / 5));
    envelope.gain.exponentialRampToValueAtTime(.0001, end);
    envelope.gain.setValueAtTime(0, end + .01);
    source.connect(envelope); envelope.connect(bus);
    const voice = { source, envelope, start: at, end: end + .02 };
    voices.add(voice);
    source.onended = () => { source.disconnect(); envelope.disconnect(); voices.delete(voice); };
    source.start(at); source.stop(voice.end);
  }
  private clearVoices(voices: Set<Voice>) {
    const now = this.context?.currentTime ?? 0;
    for (const voice of voices) {
      // A short release avoids clicks, and also cancels notes queued in the future.
      const gain = voice.envelope.gain;
      if (typeof gain.cancelAndHoldAtTime === "function") gain.cancelAndHoldAtTime(now);
      else {
        // Firefox and older Web Audio implementations lack cancelAndHoldAtTime.
        // Read the computed gain before cancelling, and keep queued notes silent.
        const held = now < voice.start ? 0 : gain.value;
        gain.cancelScheduledValues(now);
        gain.setValueAtTime(held, now);
      }
      gain.linearRampToValueAtTime(0, now + .025);
      try { voice.source.stop(now + .03); } catch { /* Already ended. */ }
    }
    voices.clear();
  }
  private stopMusic() {
    clearInterval(this.timer); this.timer = undefined;
    this.clearVoices(this.musicVoices);
  }
}
