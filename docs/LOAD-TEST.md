# Uji trafik DINO404 — 3 Oktober 2026

**Hasil: integritas data dan ketersediaan lulus pada burst sampai 20 request bersamaan. Target latensi baca p95 2 detik belum tercapai pada run utama.** Ini uji awal yang dibatasi, bukan penentuan kapasitas maksimum.

## Lingkungan dan batas

- Target: `https://dino404.xyz`, deployment produksi `6abffbf81e7f01fa9ceef11d`, aplikasi source `75222ab`.
- Uji utama pukul **03:43:28–03:45:07 WIB**, durasi 99,138 detik, dijalankan dari satu proses Node pada komputer pengembang melalui jaringan yang tersedia.
- 318 request HTTP aplikasi, maksimal 20 in-flight. Tahap 1, 5, 10, 20; endpoint baca memakai empat gelombang per tahap, jeda 300 ms antar gelombang.
- 36 run sintetis, 26 wallet sintetis, sesi terpisah. Tahap 20 memakai sepuluh pasangan sesi dengan wallet sama dan skor berbeda untuk memeriksa best score.
- Tiap run dikirim dengan log replay valid berdurasi 60 atau 90 tick (sekitar 1–1,5 detik) setelah countdown server. Setiap submit diulang satu kali untuk memeriksa idempotensi.
- Timeout request 12 detik. Hentikan kenaikan beban bila respons tak diharapkan atau p95 satu tahap melebihi 5 detik. Tidak memalsukan IP, mematikan rate limit, mengubah database permissions, atau mengaktifkan hadiah.
- Target sebelum uji: p95 baca ≤2.000 ms; mulai/submit/retry ≤3.000 ms. Kegagalan target latensi dibedakan dari kegagalan fungsional.

## Hasil tahap utama

P95 berarti 95% request dalam sampel tersebut selesai dalam waktu ini atau lebih cepat. Nilai diukur sampai body respons selesai diterima, sehingga mencakup jaringan, platform dan backend.

| Jenis | Bersamaan | Request | Median | P95 | Maksimum | HTTP gagal/timeout |
| --- | ---: | ---: | ---: | ---: | ---: | ---: |
| Baca kompetisi/leaderboard | 1 | 4 | 355 ms | 541 ms | 541 ms | 0 |
| Baca kompetisi/leaderboard | 5 | 20 | 477 ms | 2.506 ms | 3.947 ms | 0 |
| Baca kompetisi/leaderboard | 10 | 40 | 461 ms | 2.503 ms | 2.674 ms | 0 |
| Baca kompetisi/leaderboard | 20 | 80 | 531 ms | 2.546 ms | 3.408 ms | 0 |
| Mulai + submit + retry | 1 | 3 | 375 ms | 413 ms | 413 ms | 0 |
| Mulai + submit + retry | 5 | 15 | 435 ms | 1.526 ms | 1.526 ms | 0 |
| Mulai + submit + retry | 10 | 30 | 470 ms | 847 ms | 851 ms | 0 |
| Mulai + submit + retry | 20 | 60 | 460 ms | 891 ms | 999 ms | 0 |

Tabel berisi 252 request beban. Sisanya 66 request adalah baseline (2), pemeriksaan konsistensi (27), review cleanup (36), dan pemeriksaan pemulihan (1). Total **318**, semua respons sesuai harapan; tidak ada 429, 5xx atau timeout. Median keseluruhan 467 ms; p95 2.415 ms. Satu probe sesudah cleanup selesai dalam 546 ms; sampel tunggal ini bukan benchmark recovery.

Secara khusus, 36 request **submit skor** memiliki median 558 ms, p95 839 ms dan maksimum 958 ms. Kecepatan ini hanya berlaku pada replay pendek yang digunakan dalam uji.

## Integritas dan pembersihan fixture

- Seluruh 36 skor sama dengan hasil deterministic replay; server tidak menerima skor yang ditentukan client.
- Seluruh 36 retry mengembalikan skor yang sama, tanpa menambah run baru.
- Semua 26 wallet diperiksa melalui lookup; setiap wallet mempertahankan skor tertinggi. Top ten yang terlihat juga cocok dengan urutan skor, achievement time dan run ID yang dihitung dari fixture.
- Pemeriksaan database read-only mengonfirmasi 36 ID run unik, nilai skor dan achievement time persis sesuai harapan.
- Seluruh 36 run dikeluarkan dari kompetisi melalui endpoint owner yang sudah ada. Database mengonfirmasi **0 daily-best sintetis tersisa**, 36 run berstatus excluded, dan tepat satu audit exclusion per run. Tidak menghapus data pemain lain; log QA tetap terlihat sebagai audit yang diberi alasan jelas.

## Pemeriksaan lanjutan untuk latensi baca

Karena target p95 baca terlewati, dilakukan **30 request baca tambahan**, tiga gelombang, maksimum 10 bersamaan. Semuanya 200:

| Endpoint | Sampel | Median | P95 / maksimum |
| --- | ---: | ---: | ---: |
| `/api/competition` | 15 | 467 ms | 886 ms |
| `/api/leaderboard` | 15 | 739 ms | 1.254 ms |

Total dua pengukuran: **348 request HTTP**, 0 kegagalan. Sampel lanjutan membaik, tetapi tidak membatalkan hasil lambat pada uji pertama. Cold start, penskalaan function, jaringan dan antrean database belum diisolasi dengan trace server; tidak ada dasar untuk menyatakan satu di antaranya sebagai penyebab pasti. Source memang menjalankan finalisasi/maintenance saat pembacaan, tetapi belum ada bukti bahwa bagian itu menyebabkan lonjakan yang diukur.

## Keputusan dan batas kesimpulan

- Tidak ditemukan skor hilang, skor ganda, best score turun, atau endpoint gagal dalam skenario ini.
- Jalur kirim skor memenuhi target latensi awal; jalur baca memiliki tail latency yang masih perlu diprofilkan jika ingin konsisten di bawah 2 detik.
- Tidak mengubah kode game/database berdasarkan dugaan penyebab. Tidak ada kebutuhan deploy aplikasi dari uji ini; perubahan repository hanya harness dan laporan.
- 20 request API in-flight **bukan** bukti kapasitas 20/100/1.000 pemain aktif. Game disimulasikan di browser, sedangkan beban backend terkonsentrasi saat buka halaman, start, submit dan refresh.
- Belum menguji trafik panjang berjam-jam, beban lintas negara, 100+ request bersamaan, input replay mendekati batas 30 menit, database berisi jutaan row, atau biaya/quota di bawah trafik publik besar. Read dan gameplay ditingkatkan sebagai fase terpisah, bukan simulasi campuran seluruh perilaku pemain selama sesi panjang.
- Untuk launch kecil, hasil ini mendukung kelayakan fungsi pada burst yang diuji. Jangan menyebutnya lulus semua target performa atau bukti siap viral.

## Menjalankan ulang

Harness `scripts/load-test.mjs` membutuhkan `LOAD_ORIGIN`, `LOAD_OWNER_AUTH` (Basic Auth owner melalui environment privat), `--run`, dan tambahan `--allow-production` untuk domain produksi. Jangan menaruh credential pada source atau command history. Script menolak host lain dan menolak season hadiah aktif atau waktu kurang dari sepuluh menit sebelum UTC reset. Fixture dikeluarkan lewat owner review, audit dipertahankan.

Contoh command **setelah** environment privat disiapkan: `node scripts/load-test.mjs --run --allow-production`. Hasil lokal lengkap: `.sites-runtime/load-murfkavv.json`; diagnosis baca: `.sites-runtime/load-read-diagnostic.json`. Keduanya tidak masuk Git karena memuat ID fixture. Ringkasan tanpa identitas berada di `docs/load-test-results.json`.
