# Asset and source notes

## Chromium dinosaur

The exact classic dinosaur frames are loaded from the Chromium sprite sheet. DINO404 applies its green palette at render time; the source pixel geometry is retained. Candlesticks, drones, terrain, and physics are implemented for this project.

- Source: https://github.com/chromium/chromium/tree/main/components/neterror/resources/images/default_100_percent/offline
- Original sprite: https://raw.githubusercontent.com/chromium/chromium/main/components/neterror/resources/images/default_100_percent/offline/100-offline-sprite.png
- License: https://github.com/chromium/chromium/blob/main/LICENSE
- Shipped notice: `public/CHROMIUM-LICENSE.txt`, linked in the page footer.
- Retrieved: 2026-09-28. The downloaded files are included locally; the game does not hotlink them.

The Chromium license permits redistribution and modification subject to its notice and other conditions. It does not grant endorsement by Google. DINO404 does not claim Google or Robinhood affiliation.

## Network information

Primary documentation inspected on 2026-09-28:

- https://docs.robinhood.com/chain/ — Ethereum-compatible network.
- https://docs.robinhood.com/chain/connecting/ — mainnet chain ID 4663; testnet 46630.
- https://docs.robinhood.com/chain/contracts/ — canonical token identity must be checked by contract, not symbol alone.

Wallet input validates a nonzero 20-byte EVM address and normalizes its case. It does not establish ownership or checksum correctness. The intended GOOGLc contract, reward amounts, and distribution schedule have **not** been supplied or verified. Rewards remain disabled until configuration is complete; pairing/liquidity is outside this implementation.

## Other assets

- Favicon: project-specific vector mark.
- Icons: lucide-react, provided by the installed starter dependency.
- Typography: system fonts; no remote font requests.
- No generated photos, videos, or third-party analytics.
