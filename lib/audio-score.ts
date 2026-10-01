/** Original DINO404 loop: 16 bars, 84 BPM, soft major-7/add-9 voicings. */
export const MUSIC_BPM = 84;
export const MUSIC_STEP = 60 / MUSIC_BPM / 2;
export const MUSIC_STEPS = 128;
export type Tone = { midi: number; duration: number; level: number; wave: OscillatorType; slide?: number };
const chords = [
  [48, 60, 64, 71], [45, 60, 64, 67], [41, 57, 60, 64], [43, 59, 62, 69],
  [48, 59, 64, 67], [45, 55, 60, 64], [41, 57, 60, 67], [43, 55, 62, 67],
] as const;
const melody = [
  [76, 0, 79, 0, 74, 0, 72, 0], [72, 0, 76, 79, 0, 76, 0, 0],
  [69, 0, 72, 0, 76, 0, 72, 0], [74, 0, 71, 0, 69, 0, 67, 0],
  [67, 0, 72, 0, 76, 0, 79, 0], [76, 0, 72, 0, 69, 72, 0, 0],
  [72, 0, 76, 0, 79, 0, 76, 0], [74, 0, 71, 0, 67, 0, 0, 0],
] as const;
export function musicNotes(index: number): Tone[] {
  const n = ((Math.floor(index) % MUSIC_STEPS) + MUSIC_STEPS) % MUSIC_STEPS;
  const bar = Math.floor(n / 8), beat = n % 8, chord = chords[bar % chords.length];
  const notes: Tone[] = [];
  if (beat === 0) {
    for (const midi of chord.slice(1)) notes.push({ midi, duration: MUSIC_STEP * 7.8, level: .035, wave: "sine" });
  }
  if (beat === 0 || beat === 4) notes.push({ midi: chord[0], duration: MUSIC_STEP * 2.7, level: .13, wave: "sine" });
  const note = melody[bar % melody.length][beat];
  if (note) notes.push({ midi: note + (bar >= 8 && beat === 4 ? -12 : 0), duration: MUSIC_STEP * 1.4, level: .12, wave: "triangle" });
  // Sparse, quiet reply in the second half gives the loop breathing room.
  if (bar >= 8 && beat === 7) notes.push({ midi: chord[2] + 12, duration: MUSIC_STEP * .7, level: .045, wave: "triangle" });
  return notes;
}
export const frequency = (midi: number) => 440 * 2 ** ((midi - 69) / 12);

export type SoundCue = "jump" | "duck" | "signal" | "collision" | "start" | "milestone";
export function effectNotes(cue: SoundCue): (Tone & { delay: number })[] {
  switch (cue) {
    case "jump": return [{ midi: 64, slide: 81, duration: .13, level: .17, wave: "triangle", delay: 0 }];
    case "duck": return [{ midi: 60, slide: 48, duration: .085, level: .07, wave: "triangle", delay: 0 }];
    case "collision": return [{ midi: 55, slide: 36, duration: .24, level: .15, wave: "triangle", delay: 0 }];
    case "signal": return [76, 79, 84].map((midi, i) => ({ midi, duration: .22, level: .13, wave: "sine", delay: i * .065 }));
    case "start": return [72, 79].map((midi, i) => ({ midi, duration: .15, level: .09, wave: "triangle", delay: i * .075 }));
    case "milestone": return [72, 76, 79, 84].map((midi, i) => ({ midi, duration: .22, level: .09, wave: "sine", delay: i * .09 }));
  }
}
