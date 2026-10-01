import { test } from "node:test";
import assert from "node:assert/strict";
import { audioPreferences, DEFAULT_PREFERENCES, DinoAudio } from "../lib/game-audio";
import { effectNotes, frequency, musicNotes, MUSIC_STEPS } from "../lib/audio-score";

class Param {
  value = 0;
  events: { value: number; at: number }[] = [];
  setValueAtTime(value: number, at: number) { this.value = value; this.events.push({ value, at }); }
  linearRampToValueAtTime(value: number, at: number) { this.setValueAtTime(value, at); }
  exponentialRampToValueAtTime(value: number, at: number) { this.setValueAtTime(value, at); }
  setTargetAtTime(value: number, at: number) { this.setValueAtTime(value, at); }
  cancelScheduledValues() {}
  cancelAndHoldAtTime() {}
}
class Node {
  gain = new Param(); frequency = new Param(); Q = new Param(); type = "";
  started = -1; stops: number[] = []; onended: (() => void) | null = null;
  connect() {} disconnect() {}
  start(at: number) { this.started = at; }
  stop(at: number) { this.stops.push(at); }
}
class Context {
  state = "suspended"; currentTime = 0; destination = new Node(); sources: Node[] = []; gains: Node[] = [];
  createGain() { const n = new Node(); this.gains.push(n); return n; }
  createBiquadFilter() { return new Node(); }
  createOscillator() { const n = new Node(); this.sources.push(n); return n; }
  async resume() { this.state = "running"; }
  async suspend() { this.state = "suspended"; }
  async close() { this.state = "closed"; }
}
function fixture() { const context = new Context(); const audio = new DinoAudio(() => context as unknown as AudioContext); return { context, audio }; }

test("corrupt or out-of-range saved settings cannot produce unsafe audio gain", () => {
  assert.deepEqual(audioPreferences(null), DEFAULT_PREFERENCES);
  assert.equal(audioPreferences({ volume: 1000 }).volume, 1);
  assert.equal(audioPreferences({ volume: -1 }).volume, 0);
  assert.equal(audioPreferences({ volume: NaN }).volume, .45);
  assert.deepEqual(audioPreferences({ music: false, effects: false, motion: false, volume: 0 }), { music: false, effects: false, motion: false, volume: 0 });
});
test("sound is lazy, blocked autoplay fails quietly, and no game step depends on audio", async () => {
  let created = 0;
  const audio = new DinoAudio(() => { created++; throw new Error("Audio disabled by browser"); });
  audio.setPreferences(DEFAULT_PREFERENCES); audio.beginRun(); audio.effect("jump");
  assert.equal(created, 0);
  assert.equal(await audio.unlock(), false);
  assert.doesNotThrow(() => { audio.endRun(true); audio.dispose(); });
});
test("muting music cancels already scheduled voices and effects remain independent", async () => {
  const { audio, context } = fixture();
  try {
    audio.setPreferences({ ...DEFAULT_PREFERENCES, effects: false }); await audio.unlock(); audio.beginRun();
    const count = context.sources.length; assert.ok(count > 0);
    audio.effect("jump"); assert.equal(context.sources.length, count);
    context.currentTime = .1;
    audio.setPreferences({ ...DEFAULT_PREFERENCES, music: false });
    assert.ok(context.sources.every(n => n.stops.at(-1)! <= .14));
    audio.effect("jump"); assert.equal(context.sources.length, count + 1);
  } finally { audio.dispose(); }
});
test("zero volume cancels future effects, visibility silence stops all sound, replay can unlock again", async () => {
  const { audio, context } = fixture();
  try {
    await audio.unlock(); audio.beginRun(); audio.effect("signal");
    const scheduled = context.sources.length;
    audio.setPreferences({ ...DEFAULT_PREFERENCES, volume: 0 });
    assert.ok(context.sources.every(n => n.stops.at(-1)! <= .04));
    audio.effect("jump"); assert.equal(context.sources.length, scheduled);
    audio.silence(); assert.equal(context.state, "suspended");
    audio.setPreferences(DEFAULT_PREFERENCES); await audio.unlock(); audio.beginRun();
    assert.ok(context.sources.length > scheduled);
    audio.dispose(); assert.equal(context.state, "closed");
  } finally { audio.dispose(); }
});
test("catch-up input cannot burst repeated jump cues and endRun stops the soundtrack", async () => {
  const { audio, context } = fixture();
  try {
    await audio.unlock(); audio.setPreferences({ ...DEFAULT_PREFERENCES, music: false });
    audio.effect("jump"); audio.effect("jump"); audio.effect("jump"); assert.equal(context.sources.length, 1);
    context.currentTime = .2; audio.effect("jump"); assert.equal(context.sources.length, 2);
    audio.setPreferences(DEFAULT_PREFERENCES); audio.beginRun(); const before = [...context.sources];
    audio.endRun(true);
    assert.ok(before.every(n => n.stops.at(-1)! <= .24));
    assert.equal(context.sources.length, before.length + 1);
  } finally { audio.dispose(); }
});
test("original soundtrack loops deterministically with finite, bounded voices and gentle envelopes", () => {
  for (let i = 0; i < MUSIC_STEPS; i++) {
    assert.deepEqual(musicNotes(i), musicNotes(i + MUSIC_STEPS));
    for (const n of musicNotes(i)) {
      assert.ok(frequency(n.midi) >= 80 && frequency(n.midi) <= 1400);
      assert.ok(n.level > 0 && n.level <= .13 && n.duration > 0 && n.duration < 3);
    }
  }
  for (const cue of ["jump", "duck", "signal", "collision", "start", "milestone"] as const) {
    const notes = effectNotes(cue); assert.ok(notes.length > 0 && notes.length <= 4);
    assert.ok(notes.every(n => n.level <= .17 && n.duration <= .24 && n.delay >= 0));
  }
});
