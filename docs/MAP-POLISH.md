# DINO404 — Polishing map

Tanggal: 29 September 2026. Acuan: permintaan pemilik proyek dan amendemen 22 pada MASTERPLAN.

## Perubahan yang diterapkan

- Dua lapisan awan dengan ukuran dan kecepatan drift berbeda; bentuk cloud asli Chromium tetap digunakan. Versi warna cloud dibuat sekali ketika atlas dimuat.
- Tiga lapisan gunung pixel dengan puncak dan lembah, menggantikan lanskap datar sebelumnya. Jarak pandang terasa melalui perbedaan warna dan kecepatan gerak.
- Pepohonan dekat/jauh, variasi pohon pinus dan tajuk bulat, serta gerak angin satu pixel. Bangunan dan antena zona lama tetap tersedia.
- Siklus siang–senja–malam–fajar: fade mulai 1.000, malam penuh 1.100; kembali terang mulai 2.000, siang penuh 2.100; berulang setelah itu.
- Bulan sabit, bintang tanpa kedipan, palet forest malam, dan perubahan warna area status/kontrol yang menyatu dengan arena.
- Warna outline candle, drone, label dan penanda tanah menyesuaikan keadaan terang/gelap. Senja memiliki palet tersendiri agar lapisan gunung tidak seluruhnya hilang di tengah interpolasi.
- Pengaturan reduced motion menghentikan gerak dekoratif; physics dan animasi karakter tetap berjalan normal.

## Integritas gameplay

`lib/scenery.ts` mengatur warna dari jarak yang sudah dihitung game. Renderer hanya membaca GameState. Tidak ada perubahan pada `lib/game.ts`, `lib/game-v1.ts`, hitbox, seed, skor, database maupun endpoint submit. Versi physics tetap 2.0.0.

## Verifikasi

- **37 tes core lulus.** Dua pemeriksaan baru menguji kontinuitas transisi pada batas 1.000/1.100/2.000/2.100/3.000 serta kontras ink pada permukaan langit/tanah sepanjang 0–6.000 poin. Pemeriksaan kontras minimal 3:1 ini terbatas pada warna scene yang diuji, bukan klaim kepatuhan aksesibilitas seluruh UI.
- TypeScript, ESLint, dan build Worker produksi berhasil.
- Renderer aktual diperiksa melalui halaman QA lokal dengan scene sintetis: siang, senja, malam, fajar, gerak awan/parallax, dan reduced motion. Halaman ini tidak menulis skor dan tidak disertakan dalam source/build publikasi.
- Desktop 1280×900 dan viewport HP 390×844 diperiksa. Arena malam tetap memperlihatkan dino, candle dan drone.
- Alur game sebenarnya diuji dengan identitas sintetis lokal: countdown, run, collision, submit dan hasil terverifikasi 77. Pada viewport 390 px, halaman tidak overflow horizontal; tombol Jump dan Duck tetap setinggi 48 px.
- Sampel renderer lokal 300 frame menunjukkan median sekitar 0,3–0,4 ms dan p95 0,5–0,6 ms. Ini hanya waktu panggilan renderer pada lingkungan QA, bukan pengukuran FPS atau jaminan performa ponsel fisik.

Screenshot di workspace `../../artifacts/`:

- `dino404-map-day.png`: renderer siang, scene QA.
- `dino404-map-night.png`: renderer malam, scene QA.
- `dino404-map-mobile.png`: countdown game sebenarnya pada viewport HP.

Tes API/admin pada audit sebelumnya tetap menjadi baseline; suite tersebut tidak diulang untuk perubahan renderer ini. Tidak ada pengujian beban massal atau perangkat fisik dalam sesi ini. Detail versi terbit ada di `../../DELIVERY.md`.
