# Asset and source notes

## Chromium dinosaur

The exact classic dinosaur frames are loaded from the Chromium sprite sheet. DINO404 applies its green palette at render time; the source pixel geometry is retained. Candlesticks, drones, terrain, and physics are implemented for this project.

- Source: https://github.com/chromium/chromium/tree/main/components/neterror/resources/images/default_100_percent/offline
- Original sprite: https://raw.githubusercontent.com/chromium/chromium/main/components/neterror/resources/images/default_100_percent/offline/100-offline-sprite.png
- License: https://github.com/chromium/chromium/blob/main/LICENSE
- Shipped notice: `public/CHROMIUM-LICENSE.txt`, linked in the page footer.
- Retrieved: 2026-09-28. The downloaded files are included locally; the game does not hotlink them.
- Version 2.0 also uses the original duck frames and cloud from the same atlas. Frame geometry was checked against Chromium's `components/neterror/resources/dino_game/trex.ts`; the 59 × 47 source frame contains a 25-pixel-tall duck body. No new external asset download is required.
- Each dinosaur frame is copied into its own cached canvas before scaling or drawing a shadow. This prevents neighboring atlas pixels from appearing as a stray line in front of the mouth. The underlying pixel geometry is unchanged.
- Version 3.0 overlays an original seven-pixel-wide four-square badge inside the dinosaur's body. The licensed silhouette is retained; the badge is also present in the generated header/browser marks. Optional gate corners, relay indicators and signal feedback are code-native game graphics.

The Chromium license permits redistribution and modification subject to its notice and other conditions. It does not grant endorsement by Google. DINO404 does not claim Google or Robinhood affiliation.

## Network information

Primary documentation inspected on 2026-09-28:

- https://docs.robinhood.com/chain/ — Ethereum-compatible network.
- https://docs.robinhood.com/chain/connecting/ — mainnet chain ID 4663; testnet 46630.
- https://docs.robinhood.com/chain/contracts/ — canonical token identity must be checked by contract, not symbol alone.

Wallet input validates a nonzero 20-byte EVM address and normalizes its case. It does not establish ownership or checksum correctness. The intended GOOGLc contract, reward amounts, and distribution schedule have **not** been supplied or verified. Rewards remain disabled until configuration is complete; pairing/liquidity is outside this implementation.

## Other assets

- Header mark, SVG/PNG favicon, multi-size ICO and Apple touch icon: traced from the same licensed idle dinosaur pixels, with the DINO404 green palette. Rebuild with `node scripts/build-brand-assets.mjs` using the existing local `sharp` build dependency. Generated assets are checked in; browsers do not load this script or dependency.
- Icons: lucide-react, provided by the installed starter dependency.
- Typography: system fonts; no remote font requests.
- No generated photos, videos, or third-party analytics.
- The page signal field is original CSS/HTML artwork using the existing four-square relay identity. It uses no downloaded imagery or animation library.
- The 16-bar pixel soundtrack and six short sound cues are original project compositions in `lib/audio-score.ts`, synthesized by `lib/game-audio.ts` with native Web Audio. No third-party recordings or samples are included; this source follows the project's MIT license.
