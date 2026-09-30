# DINO404 — Audit Signal Gate 3.0

Tanggal: 30 September 2026. Audit lanjutan setelah pemilik mencoba dan menerima identitas Signal Gate. Scope: replay/bonus, waktu skor, batas UTC, ranking, transaksi owner/CSV, dan keterbacaan kontrol game. Physics serta versi gameplay tetap **3.0.0**; tidak ada perubahan nominal bonus, hitbox, RNG, pola rintangan, atau format database.

## Temuan yang direproduksi dan diperbaiki

### 1. Petunjuk drone tertutup pesan bonus

**Sebelum:** pada simulasi valid seed 1, tick 1991, drone tengah berjarak kurang dari 24 tick dari dino. Petunjuk kontrol masih menampilkan `SIGNAL FOUND · +20 points`. Pesan bonus didahulukan selama 120 tick; setelah rintangan ke-8, petunjuk drone juga diganti pesan generik.

**Perbaikan:** baris kontrol selalu menjelaskan rintangan berikutnya yang terlihat, termasuk drone pada run panjang. Notifikasi bonus tetap berada pada HUD sinyal di atas arena. Petunjuk gate tetap tampil ketika candle bergate adalah rintangan berikutnya.

**Bukti:** tes mereplay strategi jump/duck sampai keadaan tersebut dan memeriksa instruksi drone tengah, rendah, serta tinggi. Kasus asli gagal pada kode lama dan lulus sesudah perbaikan. Snapshot renderer menampilkan bonus dan instruksi duck secara bersamaan.

### 2. Teks HUD kurang kontras pada transisi senja

**Sebelum:** HUD sinyal menggunakan warna teks yang dipilih untuk tanah, meskipun latarnya memakai warna langit. Pada skor 1056, kombinasi `#eff6dc` di atas `#7c917a` hanya sekitar **3,05:1**. Pemilihan warna lama pada latar yang benar pun dapat turun ke sekitar **3,42:1**, terlalu rendah untuk label kecil.

**Perbaikan:** warna teks HUD sinyal mengikuti langit; label zona dan instruksi mengikuti tanah. Warna hijau/ivory utama dipertahankan ketika kontras mencukupi, dengan fallback hitam/putih pada rentang senja yang memerlukan kontras lebih tinggi. Latar dan teks diperbarui pada frame yang sama; transisi CSS tambahan dihapus agar warna latar tidak tertinggal dari warna teks. Fade siang/malam tetap berasal dari interpolasi scene yang sama.

**Bukti:** 24.120 kombinasi jarak dan skor diperiksa pada kedua latar (48.240 perbandingan), mencakup seluruh zona dan offset bonus, dengan batas **4,5:1**. Tes gagal pada kode lama. Browser juga membaca computed styles dari CSS produksi pada fixture siang/senja/malam; semua label yang diperiksa melampaui 4,5:1. Pada snapshot senja, kontras HUD sinyal sekitar **6,19:1**, label tanah sekitar **5,44:1**.

### 3. Validasi submit dan finalisasi bertumpang tindih tepat pada cutoff

**Sebelum:** validator masih menerima run pada `closesAt + 60.000 ms`, sedangkan SQL sudah mengizinkan finalisasi pada timestamp yang sama. Akibatnya, pada batas persis itu kelayakan submit bergantung pada apakah finalisasi sudah berjalan.

**Perbaikan:** submit baru harus masuk **sebelum** cutoff; finalisasi boleh dimulai **pada atau sesudah** cutoff. Retry dari run yang sudah accepted tetap idempotent melalui jalur endpoint yang ada.

**Bukti:** satu tes menggunakan validator produksi dan SQL finalisasi produksi pada SQLite. Cutoff −1 ms masih menerima submit dan belum memfinalisasi. Tepat cutoff dan +1 ms menolak submit; SQL memfinalisasi tepat cutoff. Tes gagal pada kode lama, lulus setelah koreksi.

## Verifikasi

| Pemeriksaan | Hasil |
|---|---|
| Core: physics, replay, bonus, versi lama, UTC, ranking, review, CSV, migrasi, stale responses, kontras | 44 lulus |
| API pada server development lokal | 13 lulus |
| API pada build Worker produksi lokal, database terpisah | 13 lulus, suite yang sama |
| Owner/review/CSV dengan autentikasi lokal | 7 lulus |
| TypeScript, ESLint, pemeriksaan whitespace diff | Lulus |
| Build Worker produksi | Berhasil |
| Browser aplikasi lokal | Form, countdown, HUD, collision, hasil 77 terverifikasi dan leaderboard |
| Browser fixture scene | Bonus + instruksi drone bersamaan; siang, senja, malam; desktop dan viewport 390 × 844 |

**64 pemeriksaan unik** pada tiga suite. Strategi jump/duck mencapai kecepatan maksimum pada 20 seed hingga 40.000 tick dengan replay identik. Tes bonus mempertahankan urutan rintangan/RNG v2 pada 20 seed. Pemeriksaan integrasi mencakup penolakan skor/bonus palsu, submit bersamaan, satu posisi per wallet, autentikasi owner, review bersamaan yang hanya menghasilkan satu audit, serta CSV terbaru yang berisi tepat top 3.

Viewport aplikasi dan fixture 390 px tidak menunjukkan overflow horizontal. Konsol aplikasi saat pemeriksaan tidak mencatat warning/error. Snapshot scene menggunakan simulasi deterministik, renderer asli, serta CSS hasil build; markup HUD fixture merepresentasikan komponen, bukan permainan langsung. Kontrol fixture statis dan tidak mengirim skor. Run 77 berasal dari UI aplikasi sebenarnya dan database lokal sintetis.

Artefak lokal: `../../artifacts/dino404-audit-v3-scenes.png` dan `../../artifacts/dino404-audit-v3-mobile.png`. Fixture, database lokal, dan kredensial dikecualikan dari source/deployment. Metadata publikasi dicatat dalam `../../DELIVERY.md` setelah hosting berhasil.

## Batas bukti

Audit ini menutup tiga temuan yang dapat direproduksi; kelulusan tes tidak menjamin tidak ada bug lain. Tidak dilakukan pengujian beban massal, ponsel fisik, atau seluruh variasi browser/jaringan. Pemeriksaan warna bukan sertifikasi aksesibilitas menyeluruh. Konsistensi replay tidak membuktikan bahwa pemain manusia atau pemilik wallet. Tidak ada review atau perubahan hasil pemain produksi selama pengujian.
