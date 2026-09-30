# DINO404 — Run to reconnect

Tanggal: 30 September 2026. Arahan pemilik dan aturan final tercatat pada masterplan bagian 23.

## Cara melihat hasil

1. Sebelum main, lihat badge empat kotak pada badan maskot. Header dan ikon browser membawa badge yang sama.
2. Tekan Start running. Gate pertama muncul di atas candle pertama, berbentuk empat sudut terbuka dengan inti empat kotak dan label +20.
3. Lompat melewatinya. Timing lompat yang mendekati candle membawa badan dino melalui gate. Gate terlewat tidak menghentikan permainan; candle tetap harus dihindari.
4. Saat berhasil, lihat SIGNAL FOUND +20 di atas arena, badge yang menyala, jejak pixel singkat dan cahaya yang melintas di belakang lintasan. Kotak pertama pada panel relay terisi.
5. Setelah empat gate, indikator menjadi WORLD ONLINE. Kotak-kotak menara dan lampu di map menyala. Gate berikutnya tetap memberi bonus 20. Malam mulai pada total 1.000 poin dan penuh pada 1.100, sehingga lampu tampak lebih jelas.

## Aturan dan integritas

- Total skor terdiri dari floor(jarak / 12) + 20 × jumlah gate. Gate baru tidak memakai random tambahan; rintangan dan physics sama dengan 2.0.
- Pemain harus berada di udara dan pusat badan masuk radius gate. Gate langsung dihapus setelah diambil. Run yang sudah mati tidak mendapat bonus.
- Client hanya merekam input jump/duck; replay server menurunkan posisi, jumlah gate, total skor dan tick pencapaian. API tidak mempercayai klaim bonus atau jumlah gate.
- Gate pertama di candle pertama; gate berikutnya pada candle setelah sedikitnya lima ordinal rintangan. Tidak ada gate pada drone.
- Empat kotak adalah progres visual, bukan nyawa, kekebalan atau syarat reward. Tidak ada tombol baru, auto-revive, multiplier, suara otomatis atau pembelian.
- Versi 3.0 menjaga validator 1.0/2.0 untuk tiket yang telah diterbitkan. Rollout pre-season memperbarui versi hari tanpa menghapus skor, seed atau run. Hari berhadiah aktif tetap pinned sampai UTC rollover.
- Tidak ada perubahan schema, akses owner, CSV, aturan top 3, audience atau konfigurasi reward.

## Rendering dan aksesibilitas

- Badge 7×7 mengikuti posisi badan pada frame berdiri/nunduk. Frame tetap diisolasi dan di-cache sebelum scaling; tidak ada gambar eksternal baru.
- Gate memakai sudut terbuka dan label +20; obstacle tetap berbentuk candle/drone. Menara, papan 404 dan lampu berada pada lapisan background tanpa collision.
- Reduced motion menghilangkan breathing gate, wave, trail dan parallax; progres teks dan pencahayaan tetap muncul. Status sinyal menggunakan pengumuman polite; countdown dan kontrol sebelumnya dipertahankan.
- Tahap siang/malam memakai total skor termasuk bonus; pergantian zona tetap berdasarkan jarak.

## Verifikasi

- 41 tes core lulus. Perbandingan v2/v3 pada 20 seed memastikan posisi rintangan, RNG, ketinggian lompatan dan collision sama. Gate terjangkau, bonus sekali, gate terlewat, skor/tick replay dan legacy tickets diperiksa. Strategi jump/duck yang sudah ada juga melewati kecepatan maksimum.
- 13 pemeriksaan API lokal lulus. Tambahan tes mengambil gate lewat log input valid dengan waktu nyata, mengirim klaim bonus palsu, dan memastikan hasil server tepat poin jarak +20.
- TypeScript, ESLint dan build produksi lulus. Suite admin/CSV dari audit sebelumnya tidak diulang; tidak ada perubahan endpoint owner/CSV.
- Browser game sebenarnya: gate pertama diambil dengan tombol Jump, SIGNAL FOUND +20 terlihat, dan run total 149 diterima leaderboard. Konsol saat pemeriksaan tidak mencatat warning/error.
- Viewport HP 390×844 tidak overflow horizontal; indikator sinyal, arena dan tombol terlihat. Screenshot HP adalah countdown game sebenarnya, bukan bukti bermain di perangkat fisik.
- `artifacts/dino404-signal-scenes.png` di workspace menunjukkan renderer nyata pada snapshot simulasi deterministik: sebelum gate, sesudah pengambilan, dan empat relay pada malam. Fixture hanya lokal dan tidak mengirim skor. `artifacts/dino404-signal-mobile.png` menunjukkan halaman game di viewport HP.

Pengujian tidak membuktikan ketahanan terhadap semua bot atau semua perangkat. Bonus mengubah aturan skor, sehingga validator dinaikkan versinya. Semua data QA tetap lokal dan tidak masuk arsip deployment.
