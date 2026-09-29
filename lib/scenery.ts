import { zoneAt } from "./game";

const smooth = (t: number) => { const n = Math.max(0, Math.min(1, t)); return n * n * (3 - 2 * n); };

/** Visual only: begin a 100-point fade at each 1,000-point milestone. */
export function nightAt(distance: number) {
  const score = Math.max(0, distance) / 12, section = Math.floor(score / 1000);
  if (!section) return 0;
  const fade = smooth((score % 1000) / 100);
  return section % 2 ? fade : 1 - fade;
}

const day = [
  { sky: "#eef2e2", far: "#e1e8d4", mountain: "#d3dfc3", ridge: "#c6d6b3", trees: "#adc69b", nearTrees: "#99b785", ground: "#e4ecd7", track: "#6e8851", soil: "#c3d2af", detail: "#91a577" },
  { sky: "#ecf1e8", far: "#e0e8dc", mountain: "#d0decd", ridge: "#c2d5bd", trees: "#a8c1a0", nearTrees: "#90ad87", ground: "#e0e9da", track: "#6c8762", soil: "#bed1b7", detail: "#8ca27e" },
  { sky: "#f2f1e5", far: "#e8e8d8", mountain: "#dcdfc8", ridge: "#ced8b7", trees: "#b5c69b", nearTrees: "#9cb382", ground: "#eaeedb", track: "#788955", soil: "#ced8b6", detail: "#9bab7e" },
] as const;
const night = {
  sky: "#172c2b", far: "#1e3832", mountain: "#27443a", ridge: "#304e3e", trees: "#3c5f47", nearTrees: "#4a6b4f",
  ground: "#20362e", track: "#a4bc86", soil: "#40593b", detail: "#5d7550",
};
const dusk: Record<keyof typeof night, string> = {
  sky: "#92a78b", far: "#819875", mountain: "#738c65", ridge: "#6a845c", trees: "#526f46", nearTrees: "#405f39",
  ground: "#829b6c", track: "#435f35", soil: "#71895d", detail: "#536e43",
};
function mix(a: string, b: string, t: number) {
  return "#" + [1, 3, 5].map((k) => Math.round(parseInt(a.slice(k, k + 2), 16) * (1 - t) + parseInt(b.slice(k, k + 2), 16) * t).toString(16).padStart(2, "0")).join("");
}
function luminance(hex: string) {
  const rgb = [1, 3, 5].map(k => { const n = parseInt(hex.slice(k, k + 2), 16) / 255; return n <= 0.04045 ? n / 12.92 : ((n + 0.055) / 1.055) ** 2.4; });
  return rgb[0] * 0.2126 + rgb[1] * 0.7152 + rgb[2] * 0.0722;
}
export function sceneColors(distance: number) {
  const zone = zoneAt(distance), blend = smooth(((distance % 7000) / 7000 - 0.85) / 0.15), darkness = nightAt(distance);
  const colors = {} as Record<keyof typeof night, string>;
  for (const key of Object.keys(night) as (keyof typeof night)[]) {
    const daylight = mix(day[zone][key], day[(zone + 1) % 3][key], blend);
    colors[key] = darkness <= 0.5 ? mix(daylight, dusk[key], darkness * 2) : mix(dusk[key], night[key], (darkness - 0.5) * 2);
  }
  // Keep labels and drone silhouettes readable even midway through a fade.
  const inkFor = (background: string) => {
    const light = luminance(background);
    return (light + 0.05) / (luminance("#203729") + 0.05) >= (luminance("#eff6dc") + 0.05) / (light + 0.05) ? "#203729" : "#eff6dc";
  };
  return { ...colors, ink: inkFor(colors.sky), uiInk: inkFor(colors.ground), darkness };
}
