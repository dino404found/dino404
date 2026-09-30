# DINO404 — Run to reconnect: motion dan identitas UI

Tanggal: 30 September 2026. Pemilik menyetujui penguatan identitas pada halaman masuk, transisi bermain, hasil run dan detail UI. Perubahan ini melanjutkan konsep empat relay yang sudah ada pada badge dino dan Signal Gate.

## Yang berubah dan cara melihatnya

1. **Halaman masuk:** indikator empat kotak menyala bergiliran di samping `404 / SIGNAL LOST`. Satu garis sinyal tipis bergerak pelan di sebelah dino. Caption menjadi `A little offline. Run to reconnect.`. Header desktop memakai `RUN TO RECONNECT`. Dino mempertahankan bentuk dan kedipan yang sudah ada.
2. **Halaman masuk HP:** dino dan relay kini terlihat dalam baris ringkas di atas form. Pada versi sebelumnya artwork ini disembunyikan seluruhnya di HP. Nama, wallet, konfirmasi alamat dan tombol tetap jelas.
3. **Start:** kolom form meredup singkat saat persiapan, tombol memakai relay sebagai indikator proses, lalu arena masuk melalui fade/gerak 6 px. Jeda keluar 180 ms dilakukan sebelum meminta tiket server sehingga tidak memotong countdown.
4. **Akhir run:** saat tabrakan, frame terakhir ditahan 240 ms, kemudian hasil masuk melalui fade/gerak 8 px selama 360 ms. Submit dimulai segera saat game berakhir; jeda visual tidak menunda pengiriman skor. Interruption, batas hari dan batas durasi tidak mendapat jeda tabrakan.
5. **Panel hasil:** label `DINO404 / RUN LOG`, angka skor naik singkat selama 620 ms, blok status relay dan tanda `NEW DAILY BEST` saat server menyatakan rekor baru. Pembaca layar menerima nilai skor aktual, tanpa rentetan angka animasi.
6. **Status yang jujur:** `VERIFYING RUN` selama request; `RUN VERIFIED` hanya setelah server menerima hasil. Gagal/retry menggunakan `AWAITING SUBMISSION` atau `RUN NOT VERIFIED`. Tidak ada tanda verified/reward palsu saat jaringan gagal.
7. **Run it back:** hasil tetap berada di layar selama persiapan bermain ulang; tidak beralih singkat ke form awal. Tombol terkunci selama persiapan agar aksi tidak bertumpuk. Jika persiapan gagal, panel asal tetap tersedia beserta pesan kesalahan.
8. **Detail bersama:** relay dipakai pada loading leaderboard, refresh, tombol persiapan dan status hasil. Tombol memberi respons tekan/hover, input memberi respons fokus yang ringan.

## Gerak dan aksesibilitas

- Memakai CSS dan requestAnimationFrame bawaan; tidak menambah library animasi, aset jaringan atau suara.
- Gerak loop hanya pada relay dan garis sinyal kecil; tidak membuat seluruh halaman terus bergerak.
- Preferensi reduced motion menonaktifkan gerak dekoratif dan transisi masuk, menampilkan skor akhir langsung, dan melewati jeda visual. Gameplay dan informasi status tetap tersedia.
- Saat tab tersembunyi, loop relay/garis dipause; animasi angka diselesaikan pada nilai akhirnya. Kedipan dino sudah menghormati visibility dan reduced motion.
- Timer reveal, animation frame serta listener dibersihkan saat komponen dilepas.
- Physics, skor, bonus, validator, leaderboard, CSV, versi game 3.0.0 dan data produksi tidak berubah.

## Verifikasi

- **44 tes core lulus**, mencakup physics/replay/bonus, versi lama, UTC, ranking, review, CSV dan kontras scene.
- **13 pemeriksaan API pada build Worker produksi lokal lulus**, termasuk penolakan skor/bonus palsu dan submit ganda idempotent.
- TypeScript, ESLint, pemeriksaan diff dan build produksi lulus. Tidak ada dependency baru.
- Browser aplikasi: form, Start, countdown 3, hasil run 77 yang diterima server, tanda rekor baru, bermain ulang, dan edit identitas. Tampilan 1280 px dan 390 px diperiksa tanpa overflow horizontal.
- Browser pada proxy QA lokal: submit pertama sengaja diberi respons 503. Tampilan menunjukkan `AWAITING SUBMISSION`, tidak ada `RUN VERIFIED`; tombol Retry kemudian menghasilkan status verified setelah server menerima run yang sama. Pending run tersimpan juga tetap menampilkan status belum dikirim setelah halaman dibuka ulang.
- Respons Start 503 juga disimulasikan: pesan error tampil, tombol Start kembali aktif, dan kolom nama kembali dapat diedit. Run dalam reduced motion selesai dengan skor 77 yang diterima server.
- Reduced motion diuji memakai preferensi yang disimulasikan hanya pada respons HTML proxy QA lokal, bukan mengubah pengaturan sistem. Hook membaca mode `off`, relay tidak beranimasi, dan countdown tetap berjalan. CSS media-query produksi turut diperiksa pada source; ini bukan pengujian OS/perangkat fisik.
- Tidak ada warning/error pada pemeriksaan browser normal. Respons gagal 503 pada proxy adalah injeksi QA yang disengaja. Fixture, data sintetis dan proxy tidak ikut deployment.
- Suite admin/CSV tidak diulang pada perubahan visual ini; baseline audit sebelumnya adalah 7 lulus dan endpoint tersebut tidak diubah.

Screenshot lokal: `../../artifacts/dino404-motion-entry.png`, `../../artifacts/dino404-motion-result.png`, `../../artifacts/dino404-motion-mobile.png`. Screenshot menunjukkan aplikasi sebenarnya dengan wallet QA lokal, bukan hasil pemain produksi. Gerak paling mudah dilihat langsung dengan Start → selesai → Run it back.

Metadata publikasi dicatat di `../../DELIVERY.md` sesudah hosting mengonfirmasi sukses. Kelulusan pemeriksaan bukan jaminan bahwa semua kemungkinan bug telah hilang; uji beban massal dan perangkat fisik tidak dilakukan pada sesi ini.
