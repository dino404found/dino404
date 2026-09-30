import { createGame as createV1, step as stepV1, replay as replayV1, type GameState as StateV1 } from "./game-v1";

/** Deterministic 60 Hz simulation, shared by the runner and server replay. */
export const GAME = Object.freeze({
  version: "2.0.0", hz: 60, width: 640, height: 240, ground: 184,
  dinoX: 60, dinoW: 44, dinoH: 47, duckW: 59, duckH: 25,
  gravity: 0.61, jump: -11.8, initialSpeed: 5, maxSpeed: 9, maxTicks: 108000,
});
export function supportedVersion(version: string) {
  return version === GAME.version || version === "1.0.0";
}
export type Obstacle = {
  id: number; x: number; y: number; w: number; h: number;
  kind: "candle" | "low" | "mid" | "high"; group: number;
};
export type GameState = Omit<StateV1, "obstacles"> & {
  version: string; ducking: boolean; duckHeld: boolean; obstacles: Obstacle[];
  cleared: number; lastClearTick: number;
};
export function createGame(seed: number, version: string = GAME.version): GameState {
  if (!supportedVersion(version)) throw new Error("Unsupported game version.");
  return { ...createV1(seed), version, next: version === "1.0.0" ? 150 : 72,
    ducking: false, duckHeld: false, cleared: 0, lastClearTick: -100 };
}
function random(s: GameState) {
  s.rng ^= s.rng << 13; s.rng ^= s.rng >>> 17; s.rng ^= s.rng << 5;
  return (s.rng >>> 0) / 4294967296;
}
export function playerBoxes(s: GameState) {
  if (s.ducking) return [{ x: GAME.dinoX + 5, y: GAME.ground - 22, w: 49, h: 20 }];
  const y = GAME.ground - GAME.dinoH + s.y;
  return [
    { x: GAME.dinoX + 22, y: y + 3, w: 17, h: 15 },
    { x: GAME.dinoX + 7, y: y + 18, w: 27, h: 25 },
  ];
}
export function step(s: GameState, jump = false, duck = false): void {
  if (s.version === "1.0.0") { stepV1(s as StateV1, jump); return; }
  if (s.dead || s.tick >= GAME.maxTicks) return;
  s.duckHeld = duck;
  if (jump && !duck && s.y === 0) s.vy = GAME.jump;
  // Down in the air is a fast fall; on landing it becomes a held duck.
  if (duck && s.y < 0) s.vy = Math.max(2.5, s.vy + 1.6);
  s.y += s.vy;
  s.vy += GAME.gravity;
  if (s.y > 0) { s.y = 0; s.vy = 0; }
  s.ducking = duck && s.y === 0;
  s.tick++;
  s.speed = Math.min(GAME.maxSpeed, GAME.initialSpeed + s.tick / 9000);
  s.distance += s.speed;
  const score = Math.floor(s.distance / 12);
  if (score !== s.score) { s.score = score; s.scoreTick = s.tick; }
  if (s.tick >= s.next) {
    const ordinal = s.count + 1, r = random(s);
    let kind: Obstacle["kind"] = "candle";
    // Teach every flight height early, before mixing the obstacle patterns.
    if (ordinal === 3) kind = "mid";
    else if (ordinal === 5) kind = "low";
    else if (ordinal === 8) kind = "high";
    else if (ordinal > 5 && r > 0.59) kind = r > 0.88 ? "high" : r > 0.73 ? "low" : "mid";
    const drone = kind !== "candle";
    const group = drone ? 1 : s.tick > 1800 && r < 0.15 ? 3 : s.tick > 650 && r < 0.42 ? 2 : 1;
    const h = drone ? 24 : 32 + Math.floor(random(s) * 12);
    s.obstacles.push({ id: ++s.count, x: GAME.width + 28,
      y: kind === "high" ? GAME.ground - 111 : kind === "mid" ? GAME.ground - 60 : kind === "low" ? GAME.ground - 31 : GAME.ground - h,
      w: drone ? 46 : 20 + (group - 1) * 24, h, kind, group });
    s.next = s.tick + Math.max(76, 104 - Math.floor(s.tick / 1200) * 3) + Math.floor(random(s) * 37);
  }
  for (const o of s.obstacles) {
    const previousRight = o.x + o.w;
    o.x -= s.speed;
    if (previousRight >= GAME.dinoX && o.x + o.w < GAME.dinoX) {
      s.cleared++; s.lastClearTick = s.tick;
    }
  }
  s.obstacles = s.obstacles.filter((o) => o.x + o.w > -30);
  for (const d of playerBoxes(s)) for (const o of s.obstacles) {
    if (d.x < o.x + o.w - 3 && d.x + d.w > o.x + 3 && d.y < o.y + o.h - 2 && d.y + d.h > o.y + 2) s.dead = true;
  }
}
function checkSequence(inputs: number[], ticks: number) {
  if (!Array.isArray(inputs) || inputs.length > 6000) throw new Error("Invalid input log.");
  let last = -1;
  for (const t of inputs) {
    if (!Number.isSafeInteger(t) || t <= last || t < 0 || t >= ticks) throw new Error("Invalid input sequence.");
    last = t;
  }
}
export function replay(seed: number, ticks: number, inputs: number[], ducks: number[] = [], version: string = GAME.version) {
  if (!Number.isSafeInteger(ticks) || ticks < 1 || ticks > GAME.maxTicks) throw new Error("Invalid run duration.");
  checkSequence(inputs, ticks); checkSequence(ducks, ticks);
  if (inputs.length + ducks.length > 6000) throw new Error("Invalid input log.");
  if (version === "1.0.0") {
    if (ducks.length) throw new Error("This game version does not support ducking.");
    return { ...createGame(seed, version), ...replayV1(seed, ticks, inputs) };
  }
  const s = createGame(seed, version);
  let i = 0, d = 0, held = false;
  while (s.tick < ticks && !s.dead) {
    const jump = inputs[i] === s.tick;
    if (jump) i++;
    if (ducks[d] === s.tick) { held = !held; d++; }
    step(s, jump, held);
  }
  if (s.tick !== ticks) throw new Error("Run continued after a collision.");
  return s;
}
export function hazardHint(s: GameState) {
  const o = s.obstacles.find((o) => o.x + o.w > GAME.dinoX && o.x < GAME.width);
  if (!o || o.id > 8) return "Find your rhythm. Beat your best.";
  if (o.kind === "mid") return "MID DRONE · Hold ↓ to duck";
  if (o.kind === "low") return "LOW DRONE · Jump over";
  if (o.kind === "high") return "HIGH DRONE · Stay low";
  return "GREEN CANDLES · Jump over";
}
export const ZONES = ["GREEN VALLEY", "SIGNAL RIDGE", "MARKET DISTRICT"] as const;
export function zoneAt(distance: number) { return Math.floor(distance / 7000) % ZONES.length; }
