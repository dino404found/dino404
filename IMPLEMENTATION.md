# DINO404 — Catatan implementasi dan serah terima

Tanggal: 29 September 2026. Acuan: `docs/MASTERPLAN.md`, salinan masterplan workspace. Dokumen ini mencatat yang sudah diimplementasikan serta batas verifikasinya; status domain dan hadiah tidak dianggap selesai hanya karena kode sudah tersedia.

## Hasil implementasi

| Kebutuhan masterplan | Implementasi |
|---|---|
| Identitas dino klasik hijau | Sprite asli Chromium dengan palet hijau/forest; bentuk dan animasi pixel dipertahankan; lisensi BSD disertakan |
| Runner sederhana | Lompat Space/↑, tap arena atau Jump; tahan ↓/S atau Duck untuk nunduk; down saat di udara mempercepat turun; tanpa double-jump/power-up |
| Map khas | Candlestick hijau tunggal/ganda/tiga; drone rendah/tengah/tinggi; tiga zona lanskap, awan pixel, parallax, penanda jarak, rotor, bayangan, dust dan feedback clear |
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

- Run baru memakai seed dan versi physics harian yang sama. Hari berhadiah mempertahankan versinya sampai UTC berganti; upgrade pre-season boleh memperbarui versi tiket baru tanpa menghapus skor latihan. Tiket lama tetap divalidasi dengan versinya sendiri.
- Game menghitung physics pada langkah 60 Hz; rendering memakai `requestAnimationFrame`. Ini target langkah simulasi, bukan klaim pengukuran FPS perangkat.
- Kecepatan naik bertahap hingga batas. Jarak antar-rintangan diuji pada banyak seed dan kecepatan maksimum.
- Run berakhir ketika menabrak, kehilangan fokus, orientasi berubah setelah mulai, batas 30 menit, atau pergantian hari UTC. Tidak ada pause. Gangguan sebelum simulasi dimulai membatalkan countdown dan mengembalikan form tanpa mengirim skor palsu satu tick.
- Input yang terjadi setelah batas UTC tidak diterima untuk hari sebelumnya. Tenggat submit/retry adalah 60 detik setelah akhir run dan tidak melewati grace period hari.
- Skor yang gagal dikirim dapat dicoba lagi dari layar hasil; payload pending disimpan lokal sementara. Backend menerima submit identik secara idempotent.
- Finalisasi hari dilakukan setelah 00:01 UTC pada akses berikutnya; tidak memerlukan tab terbuka tepat tengah malam. Rekap historis juga dapat difinalisasi saat dibuka owner.
- Koreksi owner mengecualikan run dengan alasan, mengembalikan rekor valid berikutnya untuk wallet tersebut, lalu membuat revisi hasil baru dalam satu transaksi. Request review bersamaan dan retry hanya membuat satu koreksi/audit. Gunakan CSV revisi terbaru untuk pembagian manual.
- Rekor pribadi dibatasi wallet dan hari UTC; respons lama tidak boleh menimpa hasil request atau submit terbaru. Panel owner mengabaikan respons yang kalah urutan dan membatasi waktu tunggu request.
- Leaderboard publik hanya memuat nama dan alamat singkat. Alamat lengkap serta audit hanya tersedia di API owner.
- Nama aman dari markup; CSV menetralkan awalan formula dan mengutip nilai dengan benar. Alamat hanya diperiksa format/nonzero, bukan kepemilikan atau dukungan aset pada penyedia wallet.
- Input log yang melewati 30 hari dibersihkan pada maintenance permintaan berikutnya; catatan hasil dan audit tetap tersedia.

## Verifikasi yang dilakukan

### Otomatis

- **35 tes core lulus:** bootstrap database dan migrasi deployment berulang, identitas, UTC, single-jump, tabrakan tiga ketinggian drone, duck/stand/fast-fall, replay jump–duck, log input invalid, batas waktu, pending tiket 1.0, skor server, CSV, SQL rekor/tie/snapshot/review atomik, respons tertunda dan scope wallet/hari, indeks, pola rintangan, dan preservasi data saat rollout pre-season. Strategi jump–duck diuji pada 20 seed hingga 40.000 tick/kecepatan maksimum dengan replay identik; generator diperiksa pada 50 seed.
- **12 pemeriksaan API lulus pada development dan preview build produksi lokal:** jam kompetisi, proteksi admin, input invalid termasuk log duck, cross-origin ditolak, tiket, skor palsu, submit bersamaan dengan input duck, normalisasi wallet, privasi leaderboard, tanggal invalid, dan akses CSV anonim.
- **7 pemeriksaan admin/CSV lulus pada development dengan autentikasi lokal:** rekap final, tepat top 3, alamat lengkap, eksklusi bersamaan, retry idempotent, revisi/audit, CSV terbaru, serta penolakan ekspor sebelum hari berakhir.
- TypeScript `tsc --noEmit` dan ESLint kode aplikasi lulus; build Worker produksi berhasil.
- Kasus koneksi proxy lokal setelah penolakan origin diperbaiki: body JSON yang dibatasi ukurannya dikonsumsi sebelum origin ditolak; tes API produksi melewati urutan penolakan lalu submit valid tanpa retry tersembunyi.
- Deployment awal mengungkap bahwa hosting menyediakan binding database tanpa menjalankan migrasi awal secara otomatis. Bootstrap schema v1 ditambahkan dari file migrasi yang sama: hanya `CREATE TABLE/INDEX IF NOT EXISTS`, satu batch D1, sekali per Worker isolate. Data yang sudah ada dipertahankan; migrasi schema masa depan tetap harus dikelola eksplisit.
- Pada publikasi 2.0, hosting mulai membaca metadata migrasi yang dikemas dan menolak tabel yang sudah dibootstrap. Migrasi awal dan normalizer bootstrap dibuat sama-sama idempotent dengan `IF NOT EXISTS`; pengujian memastikan migrasi mentah dapat berjalan setelah bootstrap tanpa menghapus record. Tidak ada reset/drop tabel.
- Navigasi dari admin ke game menggunakan tautan HTML dengan perpindahan dokumen penuh. Ini menghindari error client-router/prefetch Vinext yang ditemukan saat memeriksa tombol Back to game pada hosting, sekaligus membuka game dalam state baru.

### Browser

- Form, countdown, start/countdown run, collision, hasil terverifikasi, bermain ulang, edit identitas, leaderboard, dialog rules, serta tampilan pre-season diperiksa.
- Layout diperiksa pada viewport desktop dan mobile; 360 px dan 390 px tidak menunjukkan overflow horizontal halaman. Pemeriksaan viewport bukan pengujian pada ponsel fisik.
- Update 2.0 diperiksa pada desktop 1280 × 900 dan mobile 390 × 844: dua candle awal dilewati dengan keyboard, drone tengah terlihat, petunjuk duck terbaca, hasil kembali terverifikasi. Tombol mobile berukuran sekitar 148 × 48 px. Screenshot ada di folder `../artifacts/` dan menggunakan data QA lokal.
- WebMCP `read_daily_leaderboard` diuji membaca data yang sama dengan tampilan; argumen di luar skema ditolak. Tool ini tidak mengirim skor atau bermain.
- Akun/wallet QA bersifat sintetis dan hanya berada di database lokal. Database lokal tidak dibundel untuk deployment.
- Audit lanjutan memeriksa pergantian wallet/hari, Space pada tombol rules ketika game aktif, dan navigasi tanggal hasil owner. Reproduksi bug dan batas bukti dicatat di `docs/DEBUG-AUDIT.md`.
- Polishing map berikutnya menambah awan dua lapisan, tiga lapisan gunung, pepohonan dengan gerak angin, serta siklus siang/malam mulai skor 1.000. Core kini **37 tes lulus**, termasuk batas transisi dan kontras scene. Build, TypeScript, lint, scene siang/senja/malam/fajar, viewport HP, dan hasil run sebenarnya diperiksa; rincian serta batas pengujian ada di `docs/MAP-POLISH.md`. Suite API/admin di atas merupakan baseline audit sebelumnya dan tidak diulang untuk perubahan visual ini.

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
