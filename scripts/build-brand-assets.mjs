// Rebuild the shipped browser icons from the licensed dino's exact idle pixels.
// sharp is provided by the existing local build toolchain; no browser dependency.
import sharp from "sharp";
import { writeFile } from "node:fs/promises";

const { data, info } = await sharp("public/assets/chromium-sprite.png").ensureAlpha().raw().toBuffer({ resolveWithObject: true });
const paths = ["", ""];
for (let y = 0; y < 47; y++) {
  let x = 0;
  const color = (xx) => {
    const i = ((y + 2) * info.width + 848 + xx) * 4;
    return data[i + 3] < 128 ? -1 : data[i] > 190 ? 0 : 1;
  };
  while (x < 44) {
    const shade = color(x), start = x++;
    while (x < 44 && color(x) === shade) x++;
    if (shade >= 0) paths[shade] += `M${start} ${y}h${x - start}v1H${start}z`;
  }
}
const shape = `<path fill="#18392d" d="${paths[0]}"/><path fill="#8fc02f" d="${paths[1]}"/>`;
const mark = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 44 47" shape-rendering="crispEdges">${shape}</svg>\n`;
const icon = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 56 56" shape-rendering="crispEdges"><rect width="56" height="56" rx="10" fill="#eef2e2"/><g transform="translate(6 4)">${shape}</g></svg>\n`;
await writeFile("public/assets/dino-mark.svg", mark);
await writeFile("public/favicon.svg", icon);
const render = (size) => sharp(Buffer.from(icon)).resize(size, size, { kernel: "nearest" }).png().toBuffer();
await writeFile("public/icon-32.png", await render(32));
await writeFile("public/apple-touch-icon.png", await render(180));
const sizes = [16, 32, 48], images = await Promise.all(sizes.map(render));
const header = Buffer.alloc(6 + sizes.length * 16);
header.writeUInt16LE(1, 2); header.writeUInt16LE(sizes.length, 4);
let offset = header.length;
for (let i = 0; i < sizes.length; i++) {
  const entry = 6 + i * 16;
  header[entry] = sizes[i]; header[entry + 1] = sizes[i];
  header.writeUInt16LE(1, entry + 4); header.writeUInt16LE(32, entry + 6);
  header.writeUInt32LE(images[i].length, entry + 8); header.writeUInt32LE(offset, entry + 12);
  offset += images[i].length;
}
await writeFile("public/favicon.ico", Buffer.concat([header, ...images]));
console.log("Built matching SVG mark, favicon, 16/32/48px ICO and Apple touch icon.");
