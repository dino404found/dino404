import { GAME, SIGNAL, type GameState } from "./game";
import type { sceneColors } from "./scenery";
type Palette = ReturnType<typeof sceneColors>;
const wrap = (n: number, span: number) => ((n % span) + span) % span;

export function signalPulse(s: GameState) {
  return Math.max(0, 1 - (s.tick - s.lastSignalTick) / SIGNAL.duration);
}

/** Distant relay stations are scenery; their lights reflect collected gates. */
export function renderSignalWorld(c: CanvasRenderingContext2D, s: GameState, p: Palette, reduced: boolean) {
  const shift = reduced ? 0 : s.distance * 0.17;
  const power = Math.min(4, s.signals), pulse = signalPulse(s);
  for (let i = 0; i < 5; i++) {
    const x = Math.round(wrap(210 + i * 211 - shift, 1055) - 55);
    if (x < -45 || x > GAME.width + 25) continue;
    c.fillStyle = p.nearTrees;
    c.fillRect(x + 9, 133, 3, 49); c.fillRect(x + 1, 145, 20, 3);
    c.fillRect(x - 2, 139, 3, 12); c.fillRect(x + 21, 139, 3, 12);
    c.fillRect(x + 2, 161, 17, 13);
    c.fillStyle = p.darkness > 0.5 ? "#243c30" : "#c8d8b3";
    c.fillRect(x + 4, 163, 13, 9);
    for (let node = 0; node < 4; node++) {
      c.fillStyle = node < power ? (p.darkness > 0.5 ? "#d9f4a3" : "#527731") : p.trees;
      c.fillRect(x + 6 + (node % 2) * 5, 164 + Math.floor(node / 2) * 4, 3, 3);
    }
    c.fillStyle = power ? (p.darkness > 0.5 ? "#ecf3c7" : "#587e2e") : p.trees;
    c.fillRect(x + 8, 130, 5, 4);
    if (power && p.darkness > 0.2) {
      c.globalAlpha = 0.12 + p.darkness * 0.08;
      c.fillRect(x + 3, 126, 15, 12); c.globalAlpha = 1;
    }
    if (i % 2 === 0) {
      c.fillStyle = p.nearTrees; c.fillRect(x + 44, 164, 30, 12); c.fillRect(x + 49, 176, 2, 6); c.fillRect(x + 68, 176, 2, 6);
      c.fillStyle = power ? (p.darkness > 0.5 ? "#e4edbd" : "#edf4dd") : p.ground;
      c.font = "bold 8px ui-monospace, monospace"; c.fillText("404", x + 49, 173);
    }
  }
  if (pulse > 0 && !reduced) {
    const x = GAME.dinoX + (1 - pulse) * 650;
    c.globalAlpha = pulse * 0.22; c.fillStyle = p.darkness > 0.5 ? "#d4ed9d" : "#8ead50";
    c.fillRect(Math.round(x), 129, 12, 53); c.globalAlpha = 1;
  }
}

/** Open corners and a four-square core distinguish optional gates from hazards. */
export function renderSignalGates(c: CanvasRenderingContext2D, s: GameState, p: Palette, reduced: boolean) {
  for (const gate of s.gates) {
    const x = Math.round(gate.x), y = gate.y;
    const breathe = reduced ? 0 : Math.round(Math.sin(s.tick / 18) * 2);
    c.fillStyle = p.darkness > 0.5 ? "#d9eeab" : "#547c2c";
    for (const side of [-1, 1]) for (const top of [-1, 1]) {
      const xx = x + side * (19 + breathe), yy = y + top * (19 + breathe);
      c.fillRect(side < 0 ? xx : xx - 8, yy, 11, 3);
      c.fillRect(xx, top < 0 ? yy : yy - 8, 3, 11);
    }
    c.fillStyle = p.darkness > 0.5 ? "#c4e78d" : "#527631";
    for (let i = 0; i < 4; i++) c.fillRect(x - 5 + (i % 2) * 6, y - 5 + Math.floor(i / 2) * 6, 4, 4);
    c.font = "bold 9px ui-monospace, monospace"; c.fillStyle = p.ink;
    c.textAlign = "center"; c.fillText("+20", x + 1, y - 27 - breathe); c.textAlign = "start";
  }
}
