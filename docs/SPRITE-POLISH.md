# DINO404 — Polishing sprite dan identitas

Tanggal: 30 September 2026 (Asia/Jakarta).

## Masalah yang dilaporkan

Ada garis pendek ke bawah di depan mulut dino. Ikon browser berbeda dari dino game. Pemilik meminta detail lebih rapi dan animasi ringan, dengan gaya visual dan gameplay yang sudah disetujui tetap dipertahankan.

## Penyebab dan perbaikan

Frame dinosaurus bersebelahan dalam atlas Chromium. Saat browser menggambar crop langsung dari atlas pada skala pecahan dengan bayangan, pixel frame sebelah dapat ikut terlihat. Fixture lokal pada skala 3,2× dan shadow 1 px mereproduksi garis tersebut.

`lib/dino-sprites.ts` menyalin pixel tepat tiap frame ke canvas tersendiri, lalu menyimpannya di cache per atlas. Game dan maskot memakai frame terisolasi tersebut sebelum scaling. Posisi sumber, bentuk asli, hitbox, ritme langkah dan versi physics 2.0.0 tetap sama. Salinan dilakukan sekali per pose/atlas, bukan setiap tick.

Header, favicon SVG, favicon PNG 32 px, ICO 16/32/48 px dan Apple touch icon 180 px sekarang memakai bentuk idle yang sama dengan game. Metadata ikon memakai query versi baru untuk mengurangi penggunaan cache ikon lama. Script pembentuk aset dan notice Chromium disertakan dalam source.

Maskot menunggu berkedip selama 140 ms setelah jeda 4,8 detik. Dua timeout ringan menggantikan kebutuhan loop animasi terus-menerus; tab tersembunyi, reduced motion dan unmount menghentikan timer. Ukuran CSS maskot memakai kelipatan pixel utuh. Tombol Jump/Duck mendapat transisi warna, border dan bayangan 140 ms tanpa mengubah waktu respons input.

## Verifikasi

- Tujuh pose dibandingkan pada fixture browser: idle, blink, kedua langkah lari, crashed, dan kedua langkah duck. Garis tetangga pada versi lama tidak ada pada versi terisolasi; pose crashed tidak berubah. Screenshot `../artifacts/dino404-sprite-cleanup.png` di workspace memperlihatkan perbandingan dan ikon baru. Fixture hanya lokal, tidak dipublikasikan.
- Ikon diverifikasi secara visual pada ukuran kecil dan melalui metadata halaman. SVG/ICO/PNG/Apple icon serta mark header memberikan HTTP 200 pada server lokal. Gambar atlas sumber tidak diubah.
- Halaman desktop 1280×900 diperiksa. Viewport HP 390×844 tidak mempunyai overflow horizontal. Run sebenarnya melewati countdown, collision, submit dan hasil server terverifikasi 77; replay dan edit identitas berfungsi. Data QA sintetis hanya masuk database lokal.
- Konsol browser tidak mencatat warning/error pada pemeriksaan akhir.
- 37 tes core, TypeScript, ESLint dan build produksi lulus. Suite API/admin dari audit sebelumnya tidak diulang untuk perubahan rendering ini.

Pemeriksaan ini tidak mencakup semua GPU, browser, perangkat fisik atau cache favicon pengguna. Jika tab lama masih menampilkan ikon lama, buka ulang tab atau lakukan hard refresh. Site tetap privat/pre-season; aturan kompetisi, reward, database dan audience tidak diubah.
