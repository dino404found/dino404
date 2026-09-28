import { GAME, zoneAt, type GameState } from "./game";

export function makeSprites(image: HTMLImageElement) {
  const sprite = document.createElement("canvas");
  sprite.width = image.width; sprite.height = image.height;
  const c = sprite.getContext("2d")!;
  c.drawImage(image, 0, 0);
  // Recolor the licensed Chromium atlas while preserving its silhouette and alpha.
  const pixels = c.getImageData(0, 0, sprite.width, sprite.height);
  for (let i = 0; i < pixels.data.length; i += 4) {
    if (!pixels.data[i + 3]) continue;
    const light = pixels.data[i] > 190;
    pixels.data[i] = light ? 24 : 143;
    pixels.data[i + 1] = light ? 57 : 192;
    pixels.data[i + 2] = light ? 45 : 47;
  }
  c.putImageData(pixels, 0, 0);
  return sprite;
}
const palettes = [
  ["#eef2e2", "#dce5cd", "#ceddbb", "#b6cba1", "#e4ecd7"],
  ["#ecf1e8", "#d8e3d5", "#c6d7c3", "#afc6ac", "#e0e9da"],
  ["#f2f1e5", "#e3e4ce", "#d6dcb9", "#becaa0", "#eaeedb"],
];
const wrap = (x: number, span: number) => ((x % span) + span) % span;
export function renderGame(canvas: HTMLCanvasElement, s: GameState, sprite: HTMLCanvasElement, reducedMotion: boolean) {
  const c = canvas.getContext("2d")!;
  const dpr = Math.min(window.devicePixelRatio || 1, 2), w = canvas.clientWidth, h = canvas.clientHeight;
  if (canvas.width !== Math.round(w * dpr) || canvas.height !== Math.round(h * dpr)) {
    canvas.width = Math.round(w * dpr); canvas.height = Math.round(h * dpr);
  }
  c.setTransform(canvas.width / GAME.width, 0, 0, canvas.height / GAME.height, 0, 0);
  c.imageSmoothingEnabled = false;
  const z = zoneAt(s.distance), progress = (s.distance % 7000) / 7000;
  // Crossfade palettes as the next zone approaches, without touching physics.
  const blend = Math.max(0, (progress - 0.85) / 0.15);
  const color = (i: number) => {
    const a = palettes[z][i], b = palettes[(z + 1) % palettes.length][i];
    const rgb = [1, 3, 5].map((k) => Math.round(parseInt(a.slice(k, k + 2), 16) * (1 - blend) + parseInt(b.slice(k, k + 2), 16) * blend));
    return `rgb(${rgb.join(",")})`;
  };
  const drift = reducedMotion ? 0 : s.distance;
  c.fillStyle = color(0); c.fillRect(0, 0, GAME.width, GAME.height);
  c.strokeStyle = "#7894520d"; c.lineWidth = 1;
  for (let x = 10; x < GAME.width; x += 45) { c.beginPath(); c.moveTo(x, 0); c.lineTo(x, GAME.ground); c.stroke(); }
  for (let y = 12; y < GAME.ground; y += 45) { c.beginPath(); c.moveTo(0, y); c.lineTo(GAME.width, y); c.stroke(); }
  c.fillStyle = "#d7e4b8"; c.fillRect(499, 26, 24, 24); c.fillStyle = color(0); c.fillRect(497, 24, 5, 5); c.fillRect(520, 47, 5, 5);
  c.save(); c.globalAlpha = 0.32;
  for (let i = 0; i < 5; i++) {
    const x = wrap(i * 173 + 24 - drift * 0.035, 865) - 90;
    c.drawImage(sprite, 86, 2, 46, 14, Math.round(x), 31 + (i % 3) * 19, 46, 14);
  }
  c.restore();
  for (let layer = 0; layer < 2; layer++) {
    const shift = (drift * (layer ? 0.095 : 0.04)) % 480;
    c.fillStyle = color(layer + 1); c.beginPath(); c.moveTo(-480, GAME.ground);
    for (let x = -480; x <= 1440; x += 240) {
      const top = 113 + layer * 22;
      c.lineTo(x - shift, 160 + layer * 9);
      c.lineTo(x + 52 - shift, top + 16);
      c.lineTo(x + 52 - shift, top);
      c.lineTo(x + 102 - shift, top);
      c.lineTo(x + 102 - shift, top + 9);
      c.lineTo(x + 132 - shift, top + 9);
      c.lineTo(x + 194 - shift, 167 + layer * 4);
    }
    c.lineTo(1440, GAME.ground); c.closePath(); c.fill();
  }
  // Distant world details stay pale and behind the playable track.
  c.fillStyle = color(3);
  for (let i = 0; i < 9; i++) {
    const x = Math.round(wrap(i * 111 - drift * 0.16, 999) - 65);
    if (z === 2) {
      const height = 15 + (i % 4) * 9;
      c.globalAlpha = 0.5; c.fillRect(x, GAME.ground - height, 19 + (i % 2) * 8, height);
      c.globalAlpha = 0.85; c.fillRect(x + 3, GAME.ground - height + 4, 3, 3); c.fillRect(x + 11, GAME.ground - height + 4, 3, 3);
    } else if (z === 1 && i % 3 === 0) {
      c.globalAlpha = 0.48; c.fillRect(x + 8, 139, 3, 45); c.fillRect(x + 2, 151, 15, 2); c.fillRect(x - 3, 146, 3, 13); c.fillRect(x + 19, 146, 3, 13);
    } else {
      c.globalAlpha = 0.48; c.fillRect(x + 6, 161, 3, 23); c.fillRect(x, 164, 16, 9); c.fillRect(x + 3, 158, 10, 7);
    }
  }
  c.globalAlpha = 1;
  c.fillStyle = color(4); c.fillRect(0, GAME.ground, GAME.width, GAME.height - GAME.ground);
  c.fillStyle = "#6e8851"; c.fillRect(0, GAME.ground, GAME.width, 2);
  c.fillStyle = "#c3d2af"; c.fillRect(0, GAME.ground + 2, GAME.width, 3);
  c.fillStyle = "#96aa7c";
  for (let i = 0; i < 30; i++) {
    const x = wrap(i * 41 - drift, 1230);
    c.fillRect(Math.round(x), GAME.ground + 9 + (i % 4) * 8, 3 + (i % 5) * 2, 1);
  }
  // Distance markers are below the track, never obstacles.
  const markerStep = 600, markerBase = Math.floor(s.distance / markerStep);
  c.font = "8px ui-monospace, monospace"; c.fillStyle = "#647b4e";
  for (let i = 0; i < 3; i++) {
    const x = Math.round((markerBase + i) * markerStep - s.distance);
    c.fillRect(x, 225, 1, 7); c.fillText(String((markerBase + i) * 50).padStart(4, "0"), x + 5, 231);
  }
  for (const o of s.obstacles) {
    const x = Math.round(o.x), y = o.y;
    c.fillStyle = "#415f2b18"; c.fillRect(x - 2, GAME.ground + 3, o.w + 4, 3);
    if (o.kind === "candle") {
      for (let i = 0; i < o.group; i++) {
        const xx = x + i * 24, yy = y + (i ? 4 : 0), hh = o.h - (i ? 4 : 0);
        c.fillStyle = "#365d29"; c.fillRect(xx + 9, yy, 3, hh); c.fillRect(xx + 1, yy + 6, 19, hh - 13);
        c.fillStyle = "#699d36"; c.fillRect(xx + 3, yy + 8, 15, hh - 17);
        c.fillStyle = "#b2d771"; c.fillRect(xx + 3, yy + 8, 3, hh - 17);
      }
    } else {
      const blade = reducedMotion ? 0 : Math.floor(s.tick / 3) % 2;
      c.fillStyle = "#264637";
      c.fillRect(x + 5, y + 4, 4, 11); c.fillRect(x + 37, y + 4, 4, 11);
      c.fillRect(x + 7, y + 10, 32, 3); c.fillRect(x + 13, y + 7, 20, 12);
      c.fillRect(x + blade * 3, y + 1, 14 - blade * 4, 3); c.fillRect(x + 32 + blade * 3, y + 1, 14 - blade * 4, 3);
      c.fillRect(x + 16, y + 19, 4, 4); c.fillRect(x + 27, y + 19, 4, 4);
      c.fillStyle = "#6d9470"; c.fillRect(x + 15, y + 8, 16, 3);
      c.fillStyle = "#b7ed54"; c.fillRect(x + 18, y + 12, 10, 4);
      c.fillStyle = "#f4ffd9"; c.fillRect(x + 19, y + 12, 3, 2);
      if (o.id === 3 && o.x > 210 && o.x < 570) {
        c.font = "bold 9px ui-monospace, monospace"; c.fillStyle = "#31543b";
        c.fillText("↓ DUCK", x + 4, y - 9);
      }
    }
  }
  const duck = s.ducking;
  const frame = s.dead && !duck ? 220 : duck ? (Math.floor(s.tick / 6) % 2 ? 323 : 264) : s.y < 0 ? 0 : Math.floor(s.tick / 6) % 2 ? 132 : 88;
  const y = Math.round(GAME.ground - GAME.dinoH + s.y), width = duck ? GAME.duckW : GAME.dinoW;
  c.fillStyle = "#49672d20"; c.fillRect(GAME.dinoX + 7, GAME.ground + 3, duck ? 45 : 31, 3);
  c.save(); c.shadowColor = "#375827"; c.shadowOffsetX = 1; c.shadowOffsetY = 1;
  // Chromium's duck frames are 59 x 47; the visible body is 25 pixels tall.
  c.drawImage(sprite, 848 + frame, 2, width, 47, GAME.dinoX, y, width, 47); c.restore();
  if (!reducedMotion && s.y === 0 && !s.dead) {
    c.fillStyle = "#9cad82";
    for (let i = 0; i < 3; i++) c.fillRect(GAME.dinoX - 8 - i * 7 - (s.tick % 8), GAME.ground - 2 - (i % 2) * 3, 3, 2);
  }
  const sinceClear = s.tick - s.lastClearTick;
  if (!reducedMotion && sinceClear >= 0 && sinceClear < 22 && !s.dead) {
    c.globalAlpha = 1 - sinceClear / 22; c.fillStyle = "#40662b";
    c.font = "bold 8px ui-monospace, monospace"; c.fillText("CLEAR", GAME.dinoX + 6, y - 9 - sinceClear * 0.25); c.globalAlpha = 1;
  }
}
