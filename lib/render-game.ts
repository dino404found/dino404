import { GAME, type GameState } from "./game";

export function makeSprites(image: HTMLImageElement) {
  const sprite = document.createElement("canvas");
  sprite.width = image.width;
  sprite.height = image.height;
  const c = sprite.getContext("2d")!;
  c.drawImage(image, 0, 0);
  // Apply the DINO404 palette at render time, preserving every source pixel and its alpha.
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
export function renderGame(
  canvas: HTMLCanvasElement,
  s: GameState,
  sprite: HTMLCanvasElement,
  reducedMotion: boolean,
) {
  const c = canvas.getContext("2d")!;
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  const w = canvas.clientWidth,
    h = canvas.clientHeight;
  if (
    canvas.width !== Math.round(w * dpr) ||
    canvas.height !== Math.round(h * dpr)
  ) {
    canvas.width = Math.round(w * dpr);
    canvas.height = Math.round(h * dpr);
  }
  c.setTransform(
    canvas.width / GAME.width,
    0,
    0,
    canvas.height / GAME.height,
    0,
    0,
  );
  c.imageSmoothingEnabled = false;
  const phase = reducedMotion ? 0 : (Math.sin(s.distance / 16000) + 1) / 2;
  c.fillStyle = `rgb(${239 - phase * 9},${243 - phase * 6},${225 - phase * 10})`;
  c.fillRect(0, 0, GAME.width, GAME.height);
  c.strokeStyle = "#78945216";
  c.lineWidth = 1;
  for (let x = 0; x < GAME.width; x += 45) {
    c.beginPath();
    c.moveTo(x, 0);
    c.lineTo(x, GAME.ground);
    c.stroke();
  }
  for (let y = 11; y < GAME.ground; y += 45) {
    c.beginPath();
    c.moveTo(0, y);
    c.lineTo(GAME.width, y);
    c.stroke();
  }
  // Distant terrain belongs to the game world and never affects collisions.
  for (let layer = 0; layer < 2; layer++) {
    const shift = reducedMotion
      ? 0
      : (s.distance * (layer ? 0.08 : 0.035)) % 450;
    c.fillStyle = layer ? "#ccdab8" : "#dce5cd";
    c.beginPath();
    c.moveTo(0, GAME.ground);
    for (let x = -450; x <= 1350; x += 225) {
      c.lineTo(x - shift, GAME.ground - 20 - layer * 8);
      c.lineTo(x + 95 - shift, GAME.ground - 65 - layer * 10);
      c.lineTo(x + 145 - shift, GAME.ground - 65 - layer * 10);
    }
    c.lineTo(GAME.width, GAME.ground);
    c.closePath();
    c.fill();
  }
  c.fillStyle = "#e5ecd8";
  c.fillRect(0, GAME.ground, GAME.width, 64);
  c.fillStyle = "#647b46";
  c.fillRect(0, GAME.ground, GAME.width, 2);
  c.fillStyle = "#98ac7c";
  for (let i = 0; i < 20; i++) {
    const x = (((i * 71 - s.distance) % 1000) + 1000) % 1000;
    c.fillRect(x, GAME.ground + 9 + (i % 3) * 9, 3 + (i % 5) * 2, 1);
  }
  for (const o of s.obstacles) {
    if (o.kind === "candle") {
      for (let i = 0; i < o.group; i++) {
        const x = Math.round(o.x + i * 24),
          y = o.y + (i ? 4 : 0),
          h = o.h - (i ? 4 : 0);
        c.fillStyle = "#365d29";
        c.fillRect(x + 9, y, 3, h);
        c.fillRect(x + 2, y + 6, 18, h - 13);
        c.fillStyle = "#699d36";
        c.fillRect(x + 4, y + 8, 14, h - 17);
        c.fillStyle = "#a6ce64";
        c.fillRect(x + 4, y + 8, 3, h - 17);
      }
    } else {
      const x = Math.round(o.x),
        y = o.y;
      c.fillStyle = "#32503a";
      c.fillRect(x + 12, y + 8, 18, 10);
      c.fillRect(x + 3, y + 4, 4, 10);
      c.fillRect(x + 35, y + 4, 4, 10);
      c.fillRect(x + 5, y + 9, 32, 3);
      c.fillRect(x, y, 13, 3);
      c.fillRect(x + 29, y, 13, 3);
      c.fillStyle = "#a6e536";
      c.fillRect(x + 17, y + 10, 8, 4);
      c.fillStyle = "#507335";
      c.fillRect(x + 18, y + 19, 7, 5);
    }
  }
  const frame = s.dead
    ? 220
    : s.y < 0
      ? 0
      : Math.floor(s.tick / 6) % 2
        ? 132
        : 88;
  const y = Math.round(GAME.ground - GAME.dinoH + s.y);
  c.save();
  c.shadowColor = "#375827";
  c.shadowOffsetX = 1;
  c.shadowOffsetY = 1;
  c.drawImage(sprite, 848 + frame, 2, 44, 47, GAME.dinoX, y, 44, 47);
  c.restore();
  if (!reducedMotion && s.y === 0 && !s.dead) {
    c.fillStyle = "#a6b58a";
    for (let i = 0; i < 3; i++)
      c.fillRect(
        GAME.dinoX - 8 - i * 7 - (s.tick % 8),
        GAME.ground - 2 - (i % 2) * 3,
        3,
        2,
      );
  }
}
