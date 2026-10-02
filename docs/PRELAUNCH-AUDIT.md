# DINO404 — audit sebelum publikasi

2 Oktober 2026. Pemeriksaan dilakukan berurutan: fungsi, desain, lalu pengalaman pengunjung baru. Scope deployment adalah preview Netlify; domain produksi dan publikasi sosial belum dilakukan.

## 1. Debugging dan perbaikan

| Temuan | Dampak sebelumnya | Perbaikan dan bukti |
| --- | --- | --- |
| `cancelAndHoldAtTime` dipanggil tanpa deteksi dukungan | Browser yang tidak menyediakan metode ini dapat melempar error ketika musik dihentikan; callback penyelesaian run dapat tidak tercapai | Fallback `cancelScheduledValues` + release singkat, dengan nada yang belum mulai tetap diam. Tes reproduksi gagal sebelum perbaikan dan lulus sesudahnya. Dukungan terbatas juga dicatat di [MDN](https://developer.mozilla.org/en-US/docs/Web/API/AudioParam/cancelAndHoldAtTime). |
| Promise resume audio lama menutup context baru | Respons gagal dari perangkat audio lama dapat mematikan audio sesi baru | Hasil resume terikat ke context asal. Tes reproduksi memastikan context baru tetap berjalan dan masih menerima efek. |
| Advisory dependency aplikasi dan toolchain | Versi paket lama membawa advisory keamanan yang diketahui | Next 16.3.8; React/DOM/RSC 19.2.8; Vite 8.0.16; patch paket turunan melalui lockfile dan override terukur. Audit penuh setelah perbaikan: 0 critical/high/moderate/low. |
| Halaman belum memiliki header penolakan embedding | Halaman owner dapat menjadi target embedding pihak lain | Next mengirim `X-Frame-Options: DENY`, `nosniff`, dan kebijakan referrer yang membatasi informasi lintas origin. |
| TypeScript memasukkan direktori output deployment/QA ke cakupan glob | Artefak hasil build dapat masuk pemeriksaan source | Direktori `.netlify`, `.sites-runtime`, `.wrangler`, dan `dist` dikecualikan; source, tes dan tipe route Next tetap diperiksa. |

Advisory Next menyasar penggunaan Node `next/og` dengan input SVG yang dikontrol penyerang. Proyek sebelumnya tidak memiliki endpoint tersebut; hasil audit paket bukan bukti bahwa situs sudah dieksploitasi. Patch tetap diterapkan. Kartu berbagi baru memakai PNG statis, tanpa image renderer runtime. [Advisory upstream](https://github.com/advisories/GHSA-vcvr-r3jv-pc5j).

Tidak ada perubahan physics, scoring, seed, aturan UTC, aturan satu wallet, hadiah, atau schema database. Checksum migrasi yang sudah diterapkan tetap cocok. Kredensial owner tetap privat.

## 2. Pemeriksaan desain

Tampilan yang sudah disetujui tetap menjadi dasar: latar mint/lime, dino pixel dengan badge empat relay, teks hijau gelap, kartu permainan terang dan kartu reward gelap. Tidak ditambahkan library animasi, video, atau gambar besar pada halaman game.

- Pada pemeriksaan awal layar 320 px, petunjuk keyboard di bawah arena terpecah menjadi potongan baris yang sulit dibaca. Petunjuk HP kini memakai “Tap Jump · hold Duck”; baris kontrol boleh membungkus secara utuh.
- Header layar paling sempit diberi ukuran dan jarak yang lebih sesuai. Penjelasan langkah permainan menjadi satu kolom pada lebar di bawah 380 px.
- Judul dialog diberi ruang untuk tombol tutup. Tombol tutup kini memiliki target 44 × 44 px; sebelumnya area kecilnya terlalu dekat judul pada HP.
- Pengukuran kandidat kontras pada halaman awal menemukan warna headline besar masih memenuhi ambang teks besar. Teks normal utama yang diperiksa tidak menunjukkan kandidat di bawah 4.5:1. Tanda titik dan separator merupakan dekorasi. Ini pemeriksaan DOM/screenshot terarah, bukan sertifikasi aksesibilitas penuh.

## 3. Sudut pandang pengunjung baru

Urutan perhatian yang paling menonjol dalam review adalah headline, mascot, lalu form Start. Background membantu identitas tanpa mengambil alih area baca. Tidak ada data eye-tracking; ini penilaian visual.

- Penjelasan atas kini menyebut aksi nyata: jump candles, duck drones, find the signal, dan leaderboard harian.
- Dekat form dijelaskan “One wallet. Your best score each day.” Status pre-season/reward juga terlihat sebelum pemain mulai, sehingga tidak perlu mencari ke kartu reward di bawah.
- Catatan form menegaskan bahwa tidak ada koneksi wallet atau tanda tangan yang diminta. Alamat tetap wajib sesuai masterplan; nama dan alamat pendek tetap publik.
- Open Graph dan Twitter memakai kartu DINO404 1200 × 630 dari mascot yang sama. URL canonical/gambar mengikuti `APP_ORIGIN`. Preview diberi `noindex`; domain produksi baru dapat diindeks setelah konfigurasi yang sesuai.
- Desain kartu diperiksa secara visual. Tidak ada posting atau permintaan pengambilan ulang cache X/Twitter dilakukan, sehingga rendering/cache platform tersebut belum dikonfirmasi.

## Verifikasi otomatis yang selesai

| Pemeriksaan | Hasil |
| --- | --- |
| Core game, physics/replay, ranking, UTC, review, CSV | 45 lulus |
| Audio, preferensi, kompatibilitas dan lifecycle | 8 lulus |
| Postgres, autentikasi, origin dan metadata | 7 lulus |
| API pada production build lokal dengan database sementara | 16 lulus |
| Owner, top-3 export, revisi dan concurrent review | 8 lulus |
| Total | **84 lulus, 0 gagal** |
| Build Netlify dan Worker setelah patch dependency | Lulus |
| ESLint, komponen dialog/config yang diubah, TypeScript | Lulus |
| `npm audit` penuh termasuk dev dependencies | 0 advisory pada saat pemeriksaan |
| Scan pola kredensial pada source dan riwayat Git | Tidak ada temuan pola yang diperiksa |

Kasus API baru mencakup alamat belum dikonfirmasi, request terlalu besar, dan percobaan submit tiket milik sesi lain. Pengujian juga memeriksa skor palsu, pengiriman konkuren/idempoten, privasi wallet, penolakan owner anonim/header palsu, rollback, CSV top 3 dan larangan ekspor hari berjalan.

Runtime Worker mencetak pemberitahuan kompatibilitas `webpack` Next yang memang tidak dipakai oleh Vite dan informasi waktu plugin; build tetap exit 0. Next mengabaikan lockfile di direktori pengguna di luar repository; tidak mengikutsertakannya. Tidak ada error kompilasi.

## Pemeriksaan browser dan hosting

Review awal desktop dan HP 320 px dilakukan langsung pada preview yang sudah ada. Pengulangan visual terhadap build baru dan uji retry melalui UI sedang diselesaikan; browser automation sempat mengalami timeout navigasi. Jangan menganggap screenshot lama sebagai bukti perubahan terbaru. Status hosting/QA akhir ditambahkan setelah verifikasi.

## Sebelum domain asli diumumkan

1. Konfigurasi domain/DNS/HTTPS serta production-context `APP_ORIGIN`, kemudian build ulang. Panduan ada di [NETLIFY.md](NETLIFY.md).
2. Tentukan database produksi dan retensinya; jangan mengandalkan lifecycle database preview untuk kompetisi publik. Verifikasi run nyata, leaderboard, owner dan CSV pada origin produksi.
3. Jika ingin hadiah aktif, isi dan verifikasi konfigurasi hadiah secara terpisah. Saat audit ini situs tetap pre-season tanpa hadiah aktif.
4. Hubungkan repository bila menginginkan auto-deploy. Push GitHub tidak otomatis membuktikan integrasi deployment sudah aktif.

Batas bukti: tidak ada uji beban massal, pen-test eksternal, pengujian seluruh browser/perangkat fisik, atau jaminan 60 FPS pada semua HP. Server replay memvalidasi aturan fisika dan skor; ia tidak membuktikan input berasal dari manusia. Audit ini tidak menjanjikan nol bug untuk semua kondisi.
