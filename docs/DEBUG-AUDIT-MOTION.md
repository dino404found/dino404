# Audit motion, form, dan pemulihan koneksi

30 September 2026 · Asia/Jakarta

Status: perbaikan di source lokal. Belum dipublikasikan. Pemilik sedang menyiapkan akun GitHub dan Netlify untuk tahap deployment berikutnya.

## Temuan dan perbaikan

### 1. Fokus validasi form menuju kontrol yang salah

- Reproduksi: isi nama `Green!` dan wallet valid, lalu Start running. Pesan meminta perbaikan nama, tetapi `document.activeElement.id` adalah `wallet`. Nama berisi spasi atau karakter hasil normalisasi juga tidak bisa ditentukan hanya dari panjang input mentah.
- Konfirmasi alamat yang belum dicentang juga memindahkan fokus ke wallet, bukan checkbox.
- Perbaikan: validator bersama mengembalikan `IdentityError` dengan field yang gagal. Form memfokuskan nama, wallet, atau checkbox sesuai masalah. `aria-invalid`, hubungan ke pesan error, dan border error mengikuti kontrol yang benar; error dibersihkan ketika kontrol terkait diedit.
- Bukti: pemeriksaan browser menunjukkan fokus `dino-name`, `wallet`, lalu `confirm`, masing-masing dengan atribut invalid dan deskripsi yang tepat. Normalisasi nama/wallet tetap sama; satu tes regresi baru mencakup karakter ilegal, spasi, nama full-width, alamat pendek, dan zero address.

### 2. Reset UTC gagal memicu request berulang setiap detik

- Reproduksi di proxy QA lokal: respons kompetisi pertama memiliki cutoff dua detik ke depan; respons kompetisi berikutnya dibuat 503. Versi lama terus memanggil competition, leaderboard, dan player setiap detik. Log menunjukkan tujuh batch tambahan dalam tujuh detik.
- Perbaikan: percobaan ulang khusus rollover menunggu sedikitnya sepuluh detik setelah percobaan sebelumnya selesai, tidak berjalan saat dokumen tersembunyi, dan hanya memuat leaderboard/player setelah sinkronisasi kompetisi berhasil. Polling normal 30 detik juga mengikuti keberhasilan sinkronisasi kompetisi.
- Bukti pada build produksi lokal: request awal memuat tiga endpoint; saat gagal hanya endpoint competition dicoba lagi, dengan jarak 11 detik yang teramati pada timer satu detik. Leaderboard/player tetap masing-masing satu request pada pengamatan tersebut. Ketika proxy dipulihkan, countdown berjalan kembali dan pemberitahuan hilang otomatis.
- Batas: polling normal 30 detik dan tombol refresh manual tetap tersedia. Jeda sepuluh detik berlaku untuk jalur retry rollover, bukan pembatas global seluruh request pengguna.

### 3. Error sinkronisasi kompetisi tersembunyi di layar hasil

- Sebelumnya pesan `loadError` hanya dirender di form masuk. Pemain yang berada di layar hasil tidak melihat bahwa data kompetisi gagal disegarkan.
- Perbaikan: pemberitahuan koneksi berada di atas arena dan muncul pada form maupun hasil. Tombol Retry connection memiliki status Reconnecting dan terkunci selama refresh/persiapan. Pemberitahuan menandai bahwa hari yang ditampilkan adalah sinkronisasi terakhir.
- Bukti: setelah run terverifikasi, respons competition sengaja dibuat 503. Banner muncul, sementara status hasil tetap RUN VERIFIED karena penerimaan run sebelumnya masih sah. Desktop 1280 px dan HP 360 px tidak menunjukkan overflow horizontal. Tombol retry setinggi 44 px, rasio kontras teks banner `#68441f` terhadap `#fff4e7` adalah **7,94:1**.

### 4. Status submit menyatakan skor belum tersimpan tanpa bukti

- Kegagalan menerima respons tidak memastikan bahwa server gagal menulis skor. UI lama mengatakan skor belum ditambahkan ke leaderboard dan menyebutnya unsubmitted, termasuk tombol discard.
- Perbaikan: gunakan AWAITING CONFIRMATION dan instruksi retry untuk memastikan status server. Tombol Dismiss saved submission menjelaskan penghapusan salinan retry lokal; tidak menyiratkan pembatalan skor di server. Pesan pemulihan setelah reload menggunakan istilah konfirmasi yang sama.
- Bukti: proxy meneruskan submit ke Worker, mencatat respons accepted dengan skor 77, lalu mengganti respons yang diterima browser menjadi 503. Browser menunjukkan AWAITING CONFIRMATION tanpa badge verified. Retry tiket yang sama menampilkan RUN VERIFIED, best 77, rank 2; leaderboard tetap satu posisi untuk wallet QA tersebut.
- Mekanisme penerimaan/idempotensi backend tetap sama. Perubahan memperbaiki penjelasan UI, bukan aturan skor atau tenggat submit.

## Verifikasi

| Pemeriksaan | Hasil |
|---|---|
| Core: identitas, physics, replay, kontras scene, cutoff, SQL ranking/review | 45 lulus |
| API pada build Worker produksi lokal, database audit terpisah | 13 lulus |
| Admin/CSV dengan autentikasi development lokal | 7 lulus |
| TypeScript dan ESLint | Lulus |
| Build produksi | Lulus |
| Browser form invalid dan fokus tiga kontrol | Lulus |
| Browser run HP dengan nama 20 karakter, hasil 77 terverifikasi | Lulus |
| Dialog rules HP | Dapat digulir, tinggi dibatasi viewport |
| Rollover gagal, retry terkontrol, pemulihan otomatis | Lulus di proxy QA |
| Server menerima run tetapi respons hilang, lalu retry | Lulus di proxy QA |
| Banner pada hasil desktop/HP, kontras dan overflow | Lulus |
| Konsol browser pada sesi QA produksi lokal | Tidak mencatat warning/error |

Total otomatis: **65 pemeriksaan**. Build mengeluarkan informasi waktu plugin dan keterbatasan klasifikasi route Vinext; build selesai dengan exit code 0.

## Lokasi perubahan dan bukti

- `app/dino-app.tsx`: fokus/error form, retry UTC, pemberitahuan koneksi, status submit.
- `lib/protocol.ts`: identifikasi field yang gagal validasi.
- `app/globals.css`: penanda invalid dan banner responsif.
- `tests/core.test.ts`: regresi identitas setelah normalisasi.
- `../artifacts/dino404-audit-motion-recovery.png`: banner pada hasil desktop.
- `../artifacts/dino404-audit-motion-mobile.png`: banner dan hasil HP.
- Proxy reproduksi berada di `.sites-runtime/audit-proxy.mjs`, diabaikan Git; fixture, cookie QA, dan database lokal tidak termasuk build publikasi.

Screenshot menggunakan kondisi gagal yang sengaja disimulasikan pada aplikasi lokal dan wallet sintetis. Bukan kegagalan pada website hosting atau data peserta nyata.

## Batas dan status deployment

Physics, Signal Gate, leaderboard top 3, aturan wallet, CSV, dan autentikasi owner tidak berubah. Pengujian ini tidak mencakup beban massal, semua browser, atau perangkat HP fisik. Hasil tes bukan jaminan absolut nol bug.

Versi hosted tetap versi motion sebelumnya. Audit ini tidak mengirim source ke GitHub, tidak memigrasikan backend, dan tidak melakukan deploy Netlify/Sites. Stack saat ini memakai Worker/D1 serta identitas owner dari gateway Sites; perpindahan hosting perlu pekerjaan integrasi tersendiri.
