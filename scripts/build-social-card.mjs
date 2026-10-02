// Static share artwork uses the exact licensed mascot already shipped by the game.
// No user-provided content or runtime image renderer is involved.
import sharp from "sharp";
import { readFile, writeFile } from "node:fs/promises";

const mark = (await readFile("public/assets/dino-mark.svg", "utf8")).replace(/<\/?svg[^>]*>/g, "");
const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630">
<defs>
  <linearGradient id="bg"><stop stop-color="#f6f7f2"/><stop offset="1" stop-color="#e5efcc"/></linearGradient>
  <pattern id="grid" width="32" height="32" patternUnits="userSpaceOnUse"><path d="M32 0H0V32" fill="none" stroke="#63815a" stroke-opacity=".1"/></pattern>
</defs>
<rect width="1200" height="630" fill="url(#bg)"/><rect width="1200" height="630" fill="url(#grid)"/>
<rect x="30" y="30" width="1140" height="570" rx="28" fill="none" stroke="#bdcdb1"/>
<g transform="translate(56 54) scale(1.12)" shape-rendering="crispEdges">${mark}</g>
<g font-family="Segoe UI, Arial, sans-serif" fill="#18392d">
  <text x="120" y="98" font-size="40" font-weight="800" letter-spacing="-2">DINO<tspan fill="#587e28">404</tspan></text>
  <text x="59" y="187" font-size="15" font-weight="600" letter-spacing="3">A LITTLE OFFLINE. A LITTLE ONCHAIN.</text>
  <text x="54" y="281" font-size="79" font-weight="800" letter-spacing="-3">Run to</text>
  <text x="54" y="368" font-size="79" font-weight="800" letter-spacing="-3" fill="#587e28">reconnect.</text>
  <text x="59" y="428" font-size="22">Jump candles. Duck drones.</text>
  <text x="59" y="462" font-size="22">Chase your daily best.</text>
</g>
<g transform="translate(744 116) rotate(-12 174 174)"><rect width="348" height="348" rx="64" fill="#d9e5c2" stroke="#b1c893"/><rect x="30" y="30" width="288" height="288" rx="42" fill="none" stroke="#bdcfa5"/></g>
<path d="M700 432H1124" stroke="#809a67" stroke-width="3"/><path d="M714 459h20m72-11h14m194 6h20m47-8h20" stroke="#97ab7d" stroke-width="2"/>
<g transform="translate(800 194) scale(5)" shape-rendering="crispEdges">${mark}</g>
<g fill="#587e28"><path d="M726 315h2v117h-2zM715 333h24v55h-24zM1090 351h2v81h-2zM1081 367h20v35h-20z"/></g>
<path d="M58 518H1142" stroke="#bdcdb1"/>
<g font-family="Segoe UI, Arial, sans-serif" fill="#36523c" font-size="15" font-weight="600" letter-spacing="2">
  <text x="59" y="562">CLASSIC RUNNER / DAILY LEADERBOARD</text>
  <text x="912" y="562">KEEP RUNNING.</text>
</g>
</svg>`;
await writeFile("public/social-card.png", await sharp(Buffer.from(svg)).png().toBuffer());
console.log("Built static DINO404 share card (1200 × 630).");
