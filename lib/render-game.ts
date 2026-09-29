import { GAME, zoneAt, type GameState } from "./game";
import { sceneColors } from "./scenery";

const cloudAtlases = new WeakMap<HTMLCanvasElement, HTMLCanvasElement[]>();

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
  cloudAtlases.set(sprite, ["#7c9270", "#aec2a5"].map(color => {
    const cloud = document.createElement("canvas"); cloud.width = 46; cloud.height = 14;
    const context = cloud.getContext("2d")!;
    context.drawImage(sprite, 86, 2, 46, 14, 0, 0, 46, 14);
    context.globalCompositeOperation = "source-in"; context.fillStyle = color; context.fillRect(0, 0, 46, 14);
    return cloud;
  }));
  return sprite;
}
const wrap = (x: number, span: number) => ((x % span) + span) % span;
const peaks = [[0, 155], [44, 132], [85, 143], [146, 89], [169, 100], [181, 96], [241, 150], [280, 137], [338, 106], [357, 116], [371, 111], [429, 148], [470, 138], [512, 155]];
function mountain(c: CanvasRenderingContext2D, shift: number, offsetY: number, scale: number) {
  for (let tile = -1; tile < 3; tile++) {
    const base = tile * 512 - Math.floor(shift % 512);
    if (base > GAME.width || base + 516 < 0) continue;
    c.beginPath(); c.moveTo(base, GAME.ground);
    let edge = 1;
    for (let x = 0; x <= 512; x += 4) {
      while (edge < peaks.length - 1 && x > peaks[edge][0]) edge++;
      const a = peaks[edge - 1], b = peaks[edge], t = (x - a[0]) / (b[0] - a[0]);
      const y = Math.round((GAME.ground - (GAME.ground - a[1] - (b[1] - a[1]) * t) * scale + offsetY) / 2) * 2;
      c.lineTo(base + x, y); c.lineTo(base + x + 4, y);
    }
    c.lineTo(base + 516, GAME.ground); c.closePath(); c.fill();
  }
}
function tree(c: CanvasRenderingContext2D, x: number, base: number, height: number, pine: boolean, sway: number) {
  const top = base - height;
  c.fillRect(x + 7, top + 9, 3, height - 9);
  if (pine) {
    c.fillRect(x + 7 + sway, top, 3, 5); c.fillRect(x + 4 + sway, top + 5, 9, 6);
    c.fillRect(x + 2 + sway, top + 11, 13, 7); c.fillRect(x + sway, top + 18, 17, 6);
  } else {
    c.fillRect(x + 3 + sway, top, 12, 4); c.fillRect(x + sway, top + 4, 19, 10);
    c.fillRect(x - 3 + sway, top + 9, 24, 7); c.fillRect(x + 2 + sway, top + 16, 15, 5);
  }
}
export function renderGame(canvas: HTMLCanvasElement, s: GameState, sprite: HTMLCanvasElement, reducedMotion: boolean) {
  const c = canvas.getContext("2d")!;
  const dpr = Math.min(window.devicePixelRatio || 1, 2), w = canvas.clientWidth, h = canvas.clientHeight;
  if (canvas.width !== Math.round(w * dpr) || canvas.height !== Math.round(h * dpr)) {
    canvas.width = Math.round(w * dpr); canvas.height = Math.round(h * dpr);
  }
  c.setTransform(canvas.width / GAME.width, 0, 0, canvas.height / GAME.height, 0, 0);
  c.imageSmoothingEnabled = false;
  const z = zoneAt(s.distance), p = sceneColors(s.distance);
  const drift = reducedMotion ? 0 : s.distance;
  const wind = reducedMotion ? 0 : s.tick;
  c.fillStyle = p.sky; c.fillRect(0, 0, GAME.width, GAME.height);
  // A quiet sky keeps the silhouette of each airborne hazard easy to read.
  c.fillStyle = "#d5e2bc"; c.globalAlpha = p.darkness * 0.7;
  for (let i = 0; i < 16; i++) {
    const x = wrap(i * 97 + 29, 640), y = 17 + (i * 31 % 83);
    c.fillRect(x, y, i % 5 === 0 ? 2 : 1, 1);
  }
  c.globalAlpha = 1 - p.darkness; c.fillStyle = "#d4dfb4";
  c.fillRect(523, 28, 18, 26); c.fillRect(519, 32, 26, 18);
  c.globalAlpha = p.darkness; c.fillStyle = "#dce6c6";
  c.beginPath(); c.moveTo(535, 28);
  for (const [x, y] of [[525,28],[525,31],[521,31],[521,35],[518,35],[518,48],[521,48],[521,52],[525,52],[525,55],[539,55],[539,52],[543,52],[543,48],[536,48],[536,45],[532,45],[532,41],[530,41],[530,33],[532,33],[532,30],[535,30]]) c.lineTo(x, y);
  c.closePath(); c.fill();
  c.globalAlpha = 1;
  const clouds = cloudAtlases.get(sprite)!;
  for (let layer = 0; layer < 2; layer++) for (let i = 0; i < 4; i++) {
    const x = Math.round(wrap(i * 207 + layer * 104 - drift * (layer ? 0.032 : 0.012) - wind * (layer ? 0.055 : 0.028), 828) - 70);
    const y = 25 + (i % 3) * 21 + layer * 9, width = layer ? 53 : 37, height = layer ? 16 : 11;
    const alpha = layer ? 0.6 : 0.32;
    c.globalAlpha = alpha * (1 - p.darkness); c.drawImage(clouds[0], x, y, width, height);
    c.globalAlpha = alpha * p.darkness; c.drawImage(clouds[1], x, y, width, height);
  }
  c.globalAlpha = 1;
  c.fillStyle = p.far; mountain(c, drift * 0.022, -9, 0.8);
  c.fillStyle = p.mountain; mountain(c, 191 + drift * 0.047, 3, 0.83);
  c.fillStyle = p.ridge; mountain(c, 73 + drift * 0.093, 9, 0.39);
  // Small distant trees and larger foreground trees have separate parallax.
  c.fillStyle = p.trees;
  for (let i = 0; i < 13; i++) {
    const x = Math.round(wrap(i * 79 + (i % 3) * 13 - drift * 0.12, 1027) - 45);
    tree(c, x, 179, 24 + (i % 3) * 4, i % 3 !== 0, 0);
  }
  c.fillStyle = p.nearTrees;
  for (let i = 0; i < 9; i++) {
    const x = Math.round(wrap(i * 137 + (i % 3) * 19 - drift * 0.21, 1233) - 65);
    const sway = reducedMotion ? 0 : Math.round(Math.sin(wind / 68 + i * 2) * 0.8);
    if (z === 2) {
      const height = 15 + (i % 4) * 8;
      c.fillRect(x, 180 - height, 19 + (i % 2) * 8, height);
      c.fillStyle = p.trees;
      for (let row = 0; row < Math.floor(height / 9) - 1; row++) { c.fillRect(x + 4, 185 - height + row * 8, 3, 2); c.fillRect(x + 12, 185 - height + row * 8, 3, 2); }
      c.fillStyle = p.nearTrees;
    } else if (z === 1 && i % 3 === 0) {
      c.fillRect(x + 8, 145, 2, 35); c.fillRect(x + 2, 155, 14, 2); c.fillRect(x - 1, 150, 2, 12); c.fillRect(x + 17, 150, 2, 12);
    } else {
      tree(c, x, 181, 31 + (i % 3) * 5, i % 2 === 0, sway);
    }
  }
  c.fillStyle = p.ground; c.fillRect(0, GAME.ground, GAME.width, GAME.height - GAME.ground);
  c.fillStyle = p.track; c.fillRect(0, GAME.ground, GAME.width, 2);
  c.fillStyle = p.soil; c.fillRect(0, GAME.ground + 2, GAME.width, 3);
  c.fillStyle = p.detail;
  for (let i = 0; i < 30; i++) {
    const x = wrap(i * 41 - drift, 1230);
    c.fillRect(Math.round(x), GAME.ground + 9 + (i % 4) * 8, 3 + (i % 5) * 2, 1);
  }
  // Distance markers are below the track, never obstacles.
  const markerStep = 600, markerBase = Math.floor(s.distance / markerStep);
  c.font = "8px ui-monospace, monospace"; c.fillStyle = p.uiInk;
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
        c.fillStyle = p.darkness > 0.55 ? "#a0c366" : "#365d29"; c.fillRect(xx + 9, yy, 3, hh); c.fillRect(xx + 1, yy + 6, 19, hh - 13);
        c.fillStyle = "#699d36"; c.fillRect(xx + 3, yy + 8, 15, hh - 17);
        c.fillStyle = "#b2d771"; c.fillRect(xx + 3, yy + 8, 3, hh - 17);
      }
    } else {
      const blade = reducedMotion ? 0 : Math.floor(s.tick / 3) % 2;
      c.fillStyle = p.ink;
      c.fillRect(x + 5, y + 4, 4, 11); c.fillRect(x + 37, y + 4, 4, 11);
      c.fillRect(x + 7, y + 10, 32, 3); c.fillRect(x + 13, y + 7, 20, 12);
      c.fillRect(x + blade * 3, y + 1, 14 - blade * 4, 3); c.fillRect(x + 32 + blade * 3, y + 1, 14 - blade * 4, 3);
      c.fillRect(x + 16, y + 19, 4, 4); c.fillRect(x + 27, y + 19, 4, 4);
      c.fillStyle = "#6d9470"; c.fillRect(x + 15, y + 8, 16, 3);
      c.fillStyle = "#b7ed54"; c.fillRect(x + 18, y + 12, 10, 4);
      c.fillStyle = "#f4ffd9"; c.fillRect(x + 19, y + 12, 3, 2);
      if (o.id === 3 && o.x > 210 && o.x < 570) {
        c.font = "bold 9px ui-monospace, monospace"; c.fillStyle = p.ink;
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
    c.fillStyle = p.detail;
    for (let i = 0; i < 3; i++) c.fillRect(GAME.dinoX - 8 - i * 7 - (s.tick % 8), GAME.ground - 2 - (i % 2) * 3, 3, 2);
  }
  const sinceClear = s.tick - s.lastClearTick;
  if (!reducedMotion && sinceClear >= 0 && sinceClear < 22 && !s.dead) {
    c.globalAlpha = 1 - sinceClear / 22; c.fillStyle = p.ink;
    c.font = "bold 8px ui-monospace, monospace"; c.fillText("CLEAR", GAME.dinoX + 6, y - 9 - sinceClear * 0.25); c.globalAlpha = 1;
  }
}
