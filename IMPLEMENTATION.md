# DINO404 — Catatan implementasi dan serah terima

Tanggal: 28 September 2026. Acuan: `docs/MASTERPLAN.md`, salinan masterplan workspace. Dokumen ini mencatat yang sudah diimplementasikan serta batas verifikasinya; status domain dan hadiah tidak dianggap selesai hanya karena kode sudah tersedia.

## Hasil implementasi

| Kebutuhan masterplan | Implementasi |
|---|---|
| Identitas dino klasik hijau | Sprite asli Chromium dengan palet hijau/forest; bentuk dan animasi pixel dipertahankan; lisensi BSD disertakan |
| Runner sederhana | Satu tombol lompat, tanpa duck/double-jump/power-up; keyboard Space/↑, tap arena, tombol Jump |
| Map khas | Candlestick hijau, drone pixel tinggi/rendah, lanskap parallax halus, perubahan nuansa sage berdasarkan perjalanan |
| UI terang, premium, ringan | Ivory, sage, forest dan lime dalam satu sistem; tipografi sistem; transisi singkat; reduced motion; layout responsif |
| Identitas sebelum bermain | Nama 2–20 karakter dan format wallet EVM; konfirmasi alamat; identitas tersimpan lokal untuk bermain ulang |
| Kompetisi harian | Hari UTC, countdown dari jam server, pergantian otomatis pada 00:00 UTC |
| Satu wallet satu posisi | Alamat dinormalisasi lowercase; record unik per wallet/hari; hanya skor lebih tinggi mengganti rekor |
| Skor sama lebih dulu | Urutan skor menurun, waktu pencapaian yang diverifikasi server menaik, ID run sebagai penentu stabil terakhir |
| Top 3 dan CSV | Snapshot hasil final, CSV top 3 dengan alamat lengkap, nomor revisi, audit koreksi hasil |
| Backend persisten | D1 SQLite, migrasi, indeks, transaksi ranking dan finalisasi; hasil tidak hanya disimpan di browser |
| Verifikasi skor | Tiket run dari server, sesi HttpOnly, replay input deterministik, batas waktu, pembatasan request, penolakan skor numerik palsu |
| Admin privat | Identitas ChatGPT dari gateway Sites ditambah allowlist email owner; review run dengan alasan dan audit |
| Hadiah manual | Konfigurasi GOOGLc tersedia; tidak ada transaksi otomatis; pre-season sampai data hadiah lengkap |

## Detail perilaku penting

- Semua pemain di hari yang sama menerima seed rintangan dan versi physics yang sama.
- Game menghitung physics pada langkah 60 Hz; rendering memakai `requestAnimationFrame`. Ini target langkah simulasi, bukan klaim pengukuran FPS perangkat.
- Kecepatan naik bertahap hingga batas. Jarak antar-rintangan diuji pada banyak seed dan kecepatan maksimum.
- Run berakhir ketika menabrak, kehilangan fokus, orientasi berubah setelah mulai, batas 30 menit, atau pergantian hari UTC. Tidak ada pause.
- Input yang terjadi setelah batas UTC tidak diterima untuk hari sebelumnya. Tenggat submit/retry adalah 60 detik setelah akhir run dan tidak melewati grace period hari.
- Skor yang gagal dikirim dapat dicoba lagi dari layar hasil; payload pending disimpan lokal sementara. Backend menerima submit identik secara idempotent.
- Finalisasi hari dilakukan setelah 00:01 UTC pada akses berikutnya; tidak memerlukan tab terbuka tepat tengah malam. Rekap historis juga dapat difinalisasi saat dibuka owner.
- Koreksi owner mengecualikan run dengan alasan, mengembalikan rekor valid berikutnya untuk wallet tersebut, lalu membuat revisi hasil baru. Gunakan CSV revisi terbaru untuk pembagian manual.
- Leaderboard publik hanya memuat nama dan alamat singkat. Alamat lengkap serta audit hanya tersedia di API owner.
- Nama aman dari markup; CSV menetralkan awalan formula dan mengutip nilai dengan benar. Alamat hanya diperiksa format/nonzero, bukan kepemilikan atau dukungan aset pada penyedia wallet.
- Input log yang melewati 30 hari dibersihkan pada maintenance permintaan berikutnya; catatan hasil dan audit tetap tersedia.

## Verifikasi yang dilakukan

### Otomatis

- **19 tes core lulus:** bootstrap database kosong/idempotent tanpa menghapus data, penolakan SQL destruktif pada bootstrap, identitas, UTC termasuk tanggal invalid, physics/replay, single-jump, collision, input invalid, skor server, percepatan waktu palsu, retry kedaluwarsa, batas midnight, CSV, SQL rekor lebih tinggi, tie, snapshot/revisi/idempotensi, hari kosong, indeks, dan kelayakan pola rintangan.
- **11 pemeriksaan API lulus pada development dan preview build produksi lokal:** jam kompetisi, proteksi admin, input invalid, cross-origin ditolak, tiket, skor palsu, submit bersamaan, normalisasi wallet, privasi leaderboard, tanggal invalid, dan akses CSV anonim.
- **6 pemeriksaan admin/CSV lulus pada development dengan autentikasi lokal:** rekap final, tepat top 3, alamat lengkap, eksklusi, revisi/audit, CSV terbaru, serta penolakan ekspor sebelum hari berakhir.
- TypeScript `tsc --noEmit` dan ESLint kode aplikasi lulus; build Worker produksi berhasil.
- Kasus koneksi proxy lokal setelah penolakan origin diperbaiki: body JSON yang dibatasi ukurannya dikonsumsi sebelum origin ditolak; tes API produksi melewati urutan penolakan lalu submit valid tanpa retry tersembunyi.
- Deployment awal mengungkap bahwa hosting menyediakan binding database tanpa menjalankan migrasi awal secara otomatis. Bootstrap schema v1 ditambahkan dari file migrasi yang sama: hanya `CREATE TABLE/INDEX IF NOT EXISTS`, satu batch D1, sekali per Worker isolate. Data yang sudah ada dipertahankan; migrasi schema masa depan tetap harus dikelola eksplisit.

### Browser

- Form, countdown, start/countdown run, collision, hasil terverifikasi, bermain ulang, edit identitas, leaderboard, dialog rules, serta tampilan pre-season diperiksa.
- Layout diperiksa pada viewport desktop dan mobile; 360 px dan 390 px tidak menunjukkan overflow horizontal halaman. Pemeriksaan viewport bukan pengujian pada ponsel fisik.
- WebMCP `read_daily_leaderboard` diuji membaca data yang sama dengan tampilan; argumen di luar skema ditolak. Tool ini tidak mengirim skor atau bermain.
- Akun/wallet QA bersifat sintetis dan hanya berada di database lokal. Database lokal tidak dibundel untuk deployment.

## Batas yang tetap perlu diketahui

- Server replay membuktikan konsistensi physics/waktu, bukan bahwa pemain manusia. Bot yang menghasilkan input valid masih mungkin; review top 3 tetap diperlukan sebelum hadiah.
- Tanpa tanda tangan wallet, aplikasi tidak membuktikan kepemilikan alamat. Satu orang bisa memasukkan lebih dari satu wallet.
- Belum diuji beban massal, perangkat fisik, atau seluruh kombinasi browser/perangkat. Tes lulus bukan jaminan nol bug.
- Workflow autentikasi owner pada deployment bergantung pada gateway Sites yang memverifikasi dan menyuntikkan identitas. Host lain wajib menyediakan perlindungan setara; jangan langsung mempercayai header identitas dari internet.
- Tidak ada kontrak token, liquidity pool, wallet connect, transaksi saham, claim on-chain, atau transfer hadiah otomatis. Semua itu di luar scope game sesuai masterplan.

## Yang diperlukan untuk peluncuran kompetisi publik

1. Owner menetapkan kontrak GOOGLc yang benar, nominal peringkat 1–3, dan jadwal pembagian manual.
2. Isi konfigurasi reward di runtime; aktifkan pada hari UTC baru yang diumumkan dengan jelas. Sampai lengkap, status aplikasi tetap pre-season tanpa janji hadiah.
3. Atur akses publik dan hubungkan domain `dino404.xyz` melalui layanan hosting/DNS yang dipilih. Registrasi Site atau preview lokal tidak otomatis menghubungkan domain.
4. Uji sign-in owner pada hosting, lakukan satu uji penerimaan CSV setelah hari selesai, dan uji di ponsel fisik yang menjadi target.
5. Tentukan prosedur backup database dan lakukan uji pemulihan melalui penyedia hosting sebelum kompetisi bernilai material.

## Lokasi dokumen dan perintah

- `README.md`: instalasi, menjalankan lokal, perintah tes, konfigurasi, workflow owner.
- `docs/MASTERPLAN.md`: spesifikasi awal lengkap.
- `ASSETS.md` dan `public/CHROMIUM-LICENSE.txt`: asal aset dan notice.
- `scripts/test-api.mjs` / `scripts/test-admin.mjs`: pengujian integrasi lokal, bukan untuk endpoint produksi.
- `.sites-runtime/verified-sample.csv`: contoh hasil fixture sintetis; bukan daftar penerima reward aktual.

Source, snapshot database lokal, dan artefak build dipisah. File `.env*`, `.dev.vars*`, `.wrangler`, `.sites-runtime`, dan kredensial tidak ikut source publication.
