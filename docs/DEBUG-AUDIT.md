# DINO404 — Audit debugging lanjutan

Tanggal: 29 September 2026. Scope: koreksi bug pada gameplay 2.0 dan alur kompetisi yang sudah ada. Physics, pola rintangan, aturan skor, dan masterplan tetap memakai versi 2.0.0.

## Temuan dan perbaikan

### 1. Review owner bersamaan membuat audit ganda

**Reproduksi:** tiga POST review bersamaan untuk run accepted yang sama. Sebelum perbaikan, tes integrasi menemukan tiga catatan audit (`3 !== 1`). Pemeriksaan status dilakukan sebelum transaksi sehingga beberapa request dapat membaca status accepted yang sama.

**Perbaikan:** transaksi D1 pertama yang berhasil mengklaim run membuat satu audit. Perubahan status, pemulihan rekor wallet, dan revisi hasil bergantung pada klaim tersebut. Snapshot dan finalisasi sekarang berada dalam transaksi yang sama. Retry run yang sudah excluded mengembalikan sukses tanpa mengganti alasan asli atau membuat audit baru.

**Bukti:** tiga request paralel menghasilkan satu audit dan satu revisi baru. Retry sesudahnya mempertahankan audit/revisi. Tes SQL juga memeriksa pemulihan run cadangan wallet, preservasi snapshot lama, dan review hari aktif yang tidak boleh memfinalisasi pemenang sebelum cutoff.

### 2. Respons terlambat bisa menimpa rekor atau leaderboard terbaru

**Temuan:** lookup rekor sebelumnya hanya membandingkan wallet, tanpa identitas hari dan urutan request. Respons yang tiba setelah submit skor baru atau pergantian UTC dapat menimpa data yang lebih baru. Refresh berkala juga belum memperbarui peringkat pribadi.

**Perbaikan:** setiap rekor membawa wallet dan hari UTC. Tampilan hanya memakai rekor dengan identitas yang cocok. Loader menolak respons dari request terdahulu atau hari sebelumnya. Submit sukses membatalkan lookup lama secara logis dan menggunakan skor hasil verifikasi server. Pending retry mencatat wallet; pending format lama tetap didukung melalui lookup ulang. Pembacaan WebMCP mengikuti penjagaan urutan yang sama. Hasil hari sebelumnya diberi keterangan tanggal setelah reset.

**Bukti:** tes mencakup pergantian wallet/hari, respons lama yang sengaja diselesaikan belakangan, dan skor baru yang tidak boleh tertimpa. Browser lokal menampilkan rekor 37 untuk wallet sintetis `0xeeee…eeee` lalu menghapusnya ketika alamat berubah. Rekor 175 dari hari sebelumnya tidak tampil sebagai rekor hari baru.

### 3. Tombol UI dapat kehilangan fungsi keyboard ketika game aktif

**Temuan:** handler global menangkap Space/arrow tanpa memeriksa kontrol yang sedang difokuskan. Klik kanan juga masuk ke handler lompat/duck. Run yang baru dipasang ketika tab sudah tersembunyi belum langsung dibatalkan.

**Perbaikan:** tombol, tautan, input, dan area editable di luar arena mempertahankan perilaku keyboard normal. Kontrol pointer hanya menerima tombol utama. Game memeriksa visibility saat mulai selain mendengarkan perubahan visibility berikutnya.

**Bukti:** Competition rules dapat dibuka dengan Space saat run aktif, dialog ditutup dengan keyboard, dan hasil run kembali terverifikasi. Jalur pointer dan initial-hidden diperiksa pada source; simulasi browser semua jenis pointer/visibility belum dilakukan.

### 4. Panel owner berisiko memakai respons atau tanggal yang tidak sesuai

**Perbaikan:** hasil lama dibersihkan selama load, respons kalah urutan diabaikan, request memiliki timeout 12 detik, tanggal terkunci selama operasi, dan review memuat ulang tanggal hasil yang benar-benar direview. Lock langsung mencegah double click. Pesan kosong menunggu daftar tanggal selesai dimuat.

**Bukti:** browser memperlihatkan state loading yang benar, hasil live tanggal 2026-09-29, lalu hasil final tanggal 2026-09-28 dan tautan CSV sesuai tanggal. Eksklusi/revisi diuji menggunakan fixture API lokal; tidak ada review yang diterapkan pada data hosting.

### 5. Koreksi kecil dan kebersihan fixture

- Ringkasan input menggunakan bentuk tunggal yang tepat: `1 jump`, bukan `1 jumps`.
- Pesan interruption tidak lagi selalu mengklaim kehilangan fokus, karena orientasi dan keadaan tersembunyi juga dapat mengakhiri run.
- Setup/login fixture admin berada di dalam blok cleanup sehingga kegagalan koneksi saat pengujian tetap membersihkan data QA.

## Verifikasi akhir

| Pemeriksaan | Hasil |
|---|---|
| Core: physics/replay, UTC, SQL ranking/review, CSV, migrasi, respons tertunda | 35 lulus |
| API pada server development lokal | 12 lulus |
| API pada build Worker produksi lokal | 12 lulus, suite yang sama |
| Admin/CSV dengan autentikasi lokal | 7 lulus |
| TypeScript dan ESLint | Lulus |
| Build produksi | Berhasil |
| Browser | Pergantian wallet, keyboard rules, hasil terverifikasi, loading owner, tanggal historis |

Total **54 pemeriksaan unik** pada suite core, API, dan admin. Suite API juga dijalankan ulang pada build produksi. Seluruh identitas dan hasil pengujian berasal dari database lokal sintetis, yang tidak dikemas dalam deployment.

Screenshot akhir lokal: `../../artifacts/dino404-debug-audit.png`. Publikasi serta commit final dicatat di `../../DELIVERY.md` setelah hosting mengonfirmasi hasil.

## Batas audit

Perbaikan ini menutup temuan yang dapat diidentifikasi pada scope tersebut. Belum ada pengujian beban massal atau ponsel fisik. Kelulusan tes tidak membuktikan seluruh kemungkinan bug telah hilang. Server replay membuktikan konsistensi input/physics, bukan kepemilikan wallet atau bahwa pemain manusia; batas produk tetap dijelaskan dalam README dan IMPLEMENTATION.
