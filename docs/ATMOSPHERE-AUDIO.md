# Page atmosphere, audio and clean navigation

Implemented 1 October 2026 following the owner's three corrections. Masterplan amendment 26 records the approved scope.

## What to try

1. Open the homepage and look at the outer edges: mint/lime light fields, tilted relay frames, travelling pixels and floating squares animate around the content.
2. Use Motion above the arena to pause the decorative field. The operating system's reduced-motion preference also disables those animations.
3. Press Start running. A soft original pixel track begins when the countdown ends. Jump, duck, collected signal gates, each 1,000-point milestone and collision have brief cues.
4. Use Music, FX and the volume slider independently. Choices survive reloads; moving to another tab stops sound. Page load itself is silent.
5. Click the logo, Leaderboard, Rewards, How to play or Back to top. The page scrolls without adding a hash to the address. An old `/#` URL is cleaned after the app loads.

## Design and implementation

`app/signal-background.tsx` and `app/signal-atmosphere.css` extend the existing four-square identity onto the whole page. A stable reading layer protects text contrast. The page field sits behind all content, ignores pointer input, and has no accessibility-tree content. Animation changes only transform and opacity; no animated blur, downloaded video, particle engine or extra animation dependency is used. Decoration fades to half strength while playing, pauses when hidden, and respects reduced motion.

The soundtrack is a 16-bar, 84 BPM loop: restrained triangle melody, sine bass and low-level chord voices. A low-pass filter softens the upper frequencies. Short attack/release envelopes prevent hard clicks. The 45% initial gain is adjustable to zero; music and effects can be muted separately. The score is original project source, not a third-party recording.

`DinoAudio` creates its native AudioContext only from Start/audio controls. A short lookahead scheduler avoids missed-note bursts, caps concurrent voices and stops scheduled notes when muted. Hidden/blurred pages silence and suspend the context. A later user gesture resumes it. Storage failures retain settings in memory for the visit. An unavailable audio device displays a notice without blocking the game.

Audio events are issued after simulation steps and do not change replay, collision, score, input logs or version 3.0.0. The existing jump/duck controls and protected owner flow remain in use.

`SectionLink` preserves native anchors as a fallback, intercepts ordinary clicks to scroll, moves keyboard focus when appropriate, and removes fragments with history replacement. Existing recognized section hashes still reach their destination. Query strings are retained.

## Verification

- 45 deterministic game/ranking/UTC/replay tests, 6 audio/preference tests, 6 Netlify database/auth/origin tests, 13 production API checks and 8 owner/CSV checks passed: **78 automated checks**.
- Production Next and retained Worker builds, TypeScript and ESLint passed. The production browser exercised countdown, collision, accepted score 77 and leaderboard output on a disposable local database.
- Native browser audio emitted a nonzero signal for each cue in an isolated local audition page using the actual audio module. This avoids having UI automation timing affect game inputs. The full game emitted music and collision sound; idle voice count returned to zero.
- Desktop 1,920 px and mobile 360 px were visually inspected. At 360 px, page width equals client width (345 px after the browser scrollbar); no horizontal overflow. Motion/Music preferences survived reload, and all eight tracked field animations were paused when Motion was off. Mobile toggle targets are 44 px tall.
- On the local high-refresh Chromium renderer, one 1,200-frame sample measured approximately 5.6 ms median / 5.7 ms p95 requestAnimationFrame intervals. This is a scheduling sample, not a GPU benchmark or a guarantee of 60 FPS on all devices. No physical phone or speaker/headphone audition is claimed.
- Browser audio samples remained below full-scale clipping during the measured runs. The isolated audition used 100% in-game gain and observed a music peak of approximately 0.331 after more than one loop. Comfortable loudness still depends on the user's device volume; the in-game slider is available throughout play.
- Old bare-hash navigation and section clicks were checked against the resulting address bar. Local QA scripts and synthetic players are excluded from Git and deployment.

Audio unit cases cover corrupt preferences, invalid gain, lazy/failed initialization, independent music/effect mute, cancelling scheduled voices, zero volume, suspension/replay, repeated-cue debounce and finite looping note data. Passing tests is evidence for those cases, not an absolute promise that no future bug can occur.

## Deployment correction

The first update attempt was stopped by Netlify's migration integrity check. The initial preview had applied an SQL file ending with LF plus CRLF; a later whitespace cleanup removed two bytes. The original bytes were recovered and matched against both the original deployment file's SHA-1 and the database's recorded SHA-256. Only that exact original file was restored. No migration tracking rows, application schema or player data were changed. Git attributes now preserve migration bytes, and the Netlify build verifies the applied checksum before compilation. This follows [Netlify's requirement to restore applied migration contents](https://docs.netlify.com/build/data-and-storage/netlify-database/troubleshooting/#migration-modified-after-being-applied).
