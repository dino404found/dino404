# DINO404 — Masterplan Produk, Game, dan Website

> Dokumen acuan sebelum implementasi. Disusun pada 28 September 2026 berdasarkan sesi brainstorming bersama pemilik proyek.
>
> **Status:** konsep inti disepakati; rincian teknis di bawah adalah rancangan implementasi yang masih perlu dibuktikan melalui prototipe dan pengujian. Dokumen ini bukan pernyataan bahwa website, jaringan, aset, integrasi, atau fitur sudah tersedia.

---

## 1. Ringkasan proyek

DINO404 adalah website game endless runner bertema dinosaurus pixel dengan identitas hijau, rintangan candlestick, dan kompetisi skor harian. Pemain memasukkan nama dinosaurus dan wallet address, kemudian berlari, melompat, dan berusaha mencapai skor setinggi mungkin. Tiga peringkat teratas setiap hari menjadi kandidat penerima reward GOOGLc yang dibagikan secara manual oleh pemilik proyek.

Rumah proyek direncanakan berada di **dino404.xyz**. Pemilik proyek merencanakan peluncuran token di Robinhood Chain dengan pair **DINO404/GOOGLc**. Pengurusan token, pairing, peluncuran, dan nominal reward menjadi tanggung jawab pemilik proyek. Website berfokus pada game, kompetisi, informasi reward, dan rekap hasil.

Website harus terasa premium, clean, jelas, elegan, smooth, dan ringan. Basis visual terang lembut dengan kedalaman hijau tua; semua warna, tipografi, komponen, dan animasi harus terasa berasal dari satu sistem desain.

**Target pengerjaan:** tujuh hari sejak implementasi dimulai, dengan ruang lingkup terkendali dan satu hari terakhir untuk perbaikan serta verifikasi. Ini adalah target perencanaan, bukan jaminan bahwa semua dependensi eksternal dapat selesai dalam tujuh hari.

### 1.1 Tujuan utama

1. Pemain langsung memahami cara bermain tanpa tutorial panjang.
2. Permainan cukup menyenangkan untuk diulang demi memperbaiki rekor.
3. Identitas DINO404 terlihat melalui dino hijau, candle, lanskap, dan sistem visual yang konsisten.
4. Kompetisi harian jelas, hasilnya dapat diaudit, dan rekapnya mudah digunakan untuk distribusi manual.
5. Tampilan terasa selesai dan berkualitas di desktop maupun ponsel, bukan sekadar demo game dalam halaman kosong.
6. Semua kontrol yang terlihat memiliki fungsi dan umpan balik yang nyata.

### 1.2 Prinsip pengambilan keputusan

- Kesederhanaan gameplay lebih penting daripada jumlah fitur.
- Respons input dan keterbacaan rintangan lebih penting daripada efek dekoratif.
- Kualitas visual berasal dari komposisi, kontras, konsistensi, dan ketelitian detail.
- Validitas kompetisi lebih penting daripada menampilkan skor secepat mungkin tanpa pemeriksaan.
- Fitur baru hanya masuk bila diperlukan untuk memenuhi ruang lingkup yang sudah disepakati.
- Detail yang belum diketahui tidak boleh ditampilkan kepada pemain sebagai fakta.

## 2. Status keputusan dan batas asumsi

### 2.1 Keputusan yang sudah disepakati

| Area | Keputusan |
|---|---|
| Nama proyek | DINO404 |
| Domain tujuan | dino404.xyz |
| Daya tarik utama | Game runner sederhana dan kompetisi skor |
| Referensi karakter | Dino pixel klasik Chrome offline; pengguna menginginkan bentuk yang sama dengan perubahan warna hijau |
| Warna karakter | Hijau dengan nuansa yang terinspirasi Robinhood |
| Gameplay | Endless runner, satu tombol untuk melompat |
| Rintangan utama | Candlestick hijau sebagai pengganti kaktus |
| Variasi rintangan udara | Drone pixel kecil sebagai rancangan awal pengganti burung |
| Registrasi awal | Nama dinosaurus dan wallet address sebelum main |
| Wallet connection | Tidak diperlukan dalam cakupan dasar; pemain mengetik atau menempel alamat |
| Leaderboard | Harian, satu posisi per wallet |
| Rekor | Hanya skor yang lebih tinggi yang memperbarui rekor harian |
| Skor sama | Pemain yang lebih dulu mencapai skor mendapat peringkat lebih tinggi |
| Reset | Pukul 00.00 UTC setiap hari |
| Countdown | Terlihat dan terbaca jelas, disertai label UTC |
| Penerima hadiah | Top 3 harian yang lolos validasi |
| Hadiah | GOOGLc; jumlah dan distribusi manual diurus pemilik proyek |
| Rekap | CSV hasil harian melalui akses privat |
| Visual | Terang lembut, kontras elegan, hijau tua untuk kedalaman, animasi halus |
| Platform | Browser desktop dan ponsel |
| Waktu | Target tujuh hari implementasi |

### 2.2 Rincian yang merupakan usulan implementasi

Rincian berikut bukan permintaan fitur tambahan dari pemilik proyek. Ini adalah keputusan kerja awal agar implementasi konkret dan dapat diuji:

- Game menggunakan simulasi deterministik dan pemeriksaan run di server.
- Run kompetitif memiliki sesi, waktu mulai, dan seed rintangan dari server.
- Durasi tombol tidak mengubah tinggi lompatan pada versi pertama.
- Run kompetitif tidak dapat dijeda; kehilangan visibilitas atau fokus mengakhiri run agar tidak menghasilkan keuntungan jeda.
- Run yang melewati batas hari diakhiri di batas hari tersebut; skor sebelum batas hari dinilai untuk hari lama.
- Tampilan publik menggunakan bahasa Inggris sederhana; dokumen kerja menggunakan bahasa Indonesia.
- Nama dan wallet terakhir disimpan pada perangkat, dengan pilihan edit sebelum run.
- Halaman privat cukup memuat daftar hasil harian, status verifikasi, dan unduh CSV.
- Nilai warna, durasi animasi, dan anggaran performa adalah target desain yang dapat disesuaikan berdasarkan bukti visual dan pengujian.

### 2.3 Hal yang belum terverifikasi

- Ketersediaan, kepemilikan, dan pengaturan DNS domain dino404.xyz.
- Jaringan tujuan, chain ID, format wallet, kontrak, dan karakteristik aset GOOGLc.
- Ketersediaan pool atau venue untuk pair DINO404/GOOGLc.
- Ketentuan penggunaan aset dino asli dan elemen merek yang dirujuk.
- Infrastruktur hosting, database, serta metode akses privat untuk pemilik proyek.
- Jumlah reward tiap peringkat dan waktu pembagian.

Dokumen ini tidak mengklaim hubungan resmi dengan Google, Chrome, atau Robinhood, dan tidak mengasumsikan bahwa GOOGLc memiliki hak ekonomi tertentu terhadap saham Google. Deskripsi aset kepada pemain harus mengikuti informasi yang sudah diverifikasi.

## 3. Ruang lingkup versi pertama

### 3.1 Wajib tersedia

1. Website responsif dengan arah visual yang konsisten.
2. Form nama dinosaurus dan wallet address.
3. Validasi form dan konfirmasi alamat sebelum bermain.
4. Endless runner dengan kontrol keyboard dan sentuh.
5. Dino hijau, candle, dan variasi drone setelah tahap awal permainan.
6. Skor aktif, rekor harian pemain, dan keadaan game yang jelas.
7. Restart cepat tanpa mengisi ulang identitas.
8. Leaderboard harian yang menggunakan skor terverifikasi.
9. Reset dan countdown 00.00 UTC berbasis waktu server.
10. Penyimpanan hasil per hari dan mekanisme finalisasi hasil.
11. CSV top 3 berisi informasi yang diperlukan untuk distribusi manual.
12. Akses privat minimal bagi pemilik proyek.
13. Penanganan koneksi gagal, submit ulang, hasil tertunda, dan leaderboard kosong.
14. Pemeriksaan dasar terhadap skor curang dan penyalahgunaan endpoint.
15. Pengujian pada perangkat desktop dan ponsel.

### 3.2 Tidak masuk versi pertama

- Distribusi hadiah otomatis atau smart contract reward.
- Implementasi token, liquidity pool, atau mekanisme pairing.
- Marketplace, NFT, staking, swap, atau token gating.
- Login sosial, akun berpassword untuk pemain, atau tanda tangan wallet.
- Upgrade karakter yang memengaruhi kemampuan bermain.
- Extra life, power-up, skill tree, atau pembelian keuntungan.
- Banyak level, pemilihan map, atau perubahan kontrol antarmap.
- Multiplayer langsung.
- Dashboard analitik besar atau panel admin dengan banyak menu.
- Pengiriman CSV otomatis melalui email, Telegram, atau kanal lain.
- Musik, aset video, efek 3D, dan efek berat yang tidak mendukung gameplay inti.

### 3.3 Prioritas jika waktu mulai sempit

Urutan pengurangan kompleksitas: kurangi variasi dekorasi, kurangi perubahan suasana background, sederhanakan bentuk dan variasi drone, lalu sederhanakan animasi non-esensial. Jangan menghapus validasi skor, penyimpanan hasil, keamanan akses privat, keterbacaan, atau pengujian dasar demi mengejar dekorasi.

## 4. Identitas dan bahasa visual

### 4.1 Karakter

Keinginan pengguna adalah mempertahankan bentuk dino klasik dengan perubahan warna hijau. Tidak ditambahkan topi, pakaian, aksesori, glitch ekor, atau modifikasi tubuh sebagai fondasi identitas.

Sebelum memasukkan sprite asli ke rilis publik, periksa sumber, lisensi, dan ketentuan penggunaannya. Catat sumber serta atribusi yang diperlukan. Jika bentuk yang diminta tidak dapat digunakan sesuai ketentuan, sampaikan temuan dan tentukan alternatif bersama pemilik proyek; jangan diam-diam mengubah keputusan karakter.

Identitas dibangun melalui kombinasi:

- Siluet dino pixel yang familiar.
- Warna hijau konsisten.
- Wordmark DINO404.
- Candlestick sebagai rintangan.
- Dunia visual ivory, sage, dan deep forest.
- Bahasa singkat seputar run, skor, offline, dan 404.

### 4.2 Palet awal

| Token desain | Nilai awal | Fungsi |
|---|---|---|
| `background` | `#F6F7F2` | Latar utama warm ivory |
| `surface` | `#FCFCF8` | Permukaan form, hasil, dan daftar |
| `surface-sage` | `#E8EEDF` | Arena atau area pendukung |
| `forest` | `#18392D` | Teks utama dan elemen gelap |
| `text-muted` | `#58665B` | Teks sekunder, setelah cek kontras |
| `accent` | `#A6E536` | Dino dan aksen utama |
| `candle` | `#4F7F32` | Usulan hijau candle yang lebih tegas |
| `border` | `#D5DDCE` | Pemisah dan batas dekoratif |
| `danger` | `#A3343C` | Pesan error dengan label teks |

Warna di atas merupakan titik awal, bukan palet final yang sudah lulus pemeriksaan kontras. Hijau terang tidak digunakan sebagai teks kecil di atas ivory. Elemen arena, khususnya dino, harus tetap terlihat jelas melalui shade yang tepat atau outline forest tipis. Border dekoratif boleh lembut, tetapi batas kontrol penting harus cukup terlihat.

Target internal aksesibilitas: rasio kontras minimal 4.5:1 untuk teks biasa dan 3:1 untuk teks besar serta indikator interaksi penting. Ukur kombinasi warna yang benar-benar dipakai, termasuk keadaan hover, disabled, error, dan fokus.

### 4.3 Tipografi

- Gunakan satu keluarga sans-serif yang bersih untuk UI, formulir, aturan, dan leaderboard.
- Font pixel terbatas untuk wordmark, angka tertentu, atau detail game.
- Angka skor dan countdown menggunakan lebar digit tetap agar layout stabil.
- Body text awal sekitar 16 px; teks pendukung jangan diperkecil demi memuat terlalu banyak informasi.
- Gunakan sedikit tingkat ukuran dan ketebalan, bukan banyak variasi dekoratif.
- Pemilihan font dan lisensinya diverifikasi pada implementasi.

### 4.4 Bentuk dan permukaan

- Radius sudut konsisten; usulan 12 px untuk kontrol dan 20–24 px untuk arena/panel utama.
- Bayangan halus dipakai untuk memisahkan lapisan, bukan pada semua komponen.
- Hindari glassmorphism berlapis, glow besar, blur berat, dan gradien jenuh.
- Ruang kosong cukup agar game terasa fokus dan elemen tidak berdesakan.
- Perbedaan antara UI yang halus dan sprite pixel harus disengaja: UI rapi, pixel art tetap tajam.

## 5. Arsitektur halaman dan informasi

### 5.1 Halaman publik utama

Urutan desktop:

1. Header kecil: logo DINO404 dan tautan Leaderboard, Rewards, How to play.
2. Pengantar pendek yang tidak mendorong arena terlalu jauh ke bawah.
3. Strip kompetisi: hari UTC aktif dan countdown reset.
4. Arena utama beserta form awal atau game aktif.
5. Leaderboard harian, dengan top 3 terlihat menonjol secara proporsional.
6. Penjelasan ringkas reward dan aturan.
7. Footer minimal dengan tautan yang sudah tersedia dan benar.

Di ponsel, arena dan tombol mulai harus mudah dijangkau. Leaderboard tetap di bawah arena; hindari memaksa pemain menggulir untuk melihat kontrol selama run.

Tidak perlu hero marketing setinggi satu layar, popup promosi, atau navigasi panjang sebelum bermain.

### 5.2 Sketsa susunan konten

```text
┌────────────────────────────────────────────────────────────┐
│ DINO404                       Leaderboard · Rewards · Rules│
│                                                            │
│ RUN. JUMP. CLIMB THE LEADERBOARD.                            │
│ Daily competition · Resets at 00:00 UTC · 08:42:16           │
│                                                            │
│ ┌────────────────── GAME ARENA ──────────────────────────┐ │
│ │ Nama + wallet / countdown / permainan / hasil          │ │
│ │ Dino →                 candle             drone       │ │
│ └───────────────────────────────────────────────────────┘ │
│                                                            │
│ Daily leaderboard                    Your daily best       │
│ #1  Name        wallet singkat       score                  │
│ #2  Name        wallet singkat       score                  │
│ #3  Name        wallet singkat       score                  │
│                                                            │
│ Rewards & rules · Top 3 · Manual distribution               │
└────────────────────────────────────────────────────────────┘
```

Ini menggambarkan hierarki informasi, bukan layout visual final.

### 5.3 Form awal

Field:

- `Dino name`: label selalu terlihat, bukan hanya placeholder.
- `Wallet address`: alamat lengkap dapat ditempel dan diperiksa.
- Tombol utama `Start running`.
- Catatan ringkas bahwa hadiah dibagikan manual ke alamat tersebut dan alamat harus sesuai jaringan yang ditentukan.

Usulan nama: 2–20 karakter setelah trim, berupa huruf, angka, spasi, underscore, atau tanda hubung. Rendering selalu sebagai teks, tidak sebagai HTML. Normalisasi Unicode dan aturan huruf yang diterima ditetapkan konsisten di client dan server.

Wallet dinormalisasi dan divalidasi sesuai jaringan yang sudah diverifikasi. Jangan menerapkan lowercasing atau aturan alamat EVM secara universal sebelum jenis jaringan dipastikan. Satu alamat yang ekuivalen harus menghasilkan satu identitas kompetisi.

Form tidak meminta seed phrase, private key, deposit, atau tanda tangan transaksi. Pengisian alamat tidak membuktikan kepemilikan wallet.

### 5.4 Penyimpanan identitas

- Nama dan alamat terakhir disimpan lokal untuk kenyamanan.
- Pemain dapat mengedit identitas sebelum memulai run berikutnya.
- Identitas run dikunci sejak sesi dimulai sampai submit selesai.
- Mengganti wallet berarti menggunakan identitas kompetisi lain; skor lama tidak dipindahkan.
- Nama bukan identitas unik. Dua wallet boleh memiliki nama sama, dibedakan melalui alamat singkat.
- Usulan: nama yang tampil di leaderboard diambil dari run rekor; run yang tidak memperbaiki rekor tidak mengganti nama atau waktu rekor.
- UI menjelaskan bahwa nama dan alamat singkat tampil publik; alamat lengkap tersedia untuk proses reward privat.

## 6. Keadaan aplikasi dan alur pemain

### 6.1 Alur utama

```text
Memuat data kompetisi
  → Form identitas
  → Validasi dan konfirmasi alamat
  → Membuat sesi run di server
  → Hitungan 3–2–1
  → Bermain
  → Tabrakan / akhir hari / interupsi
  → Verifikasi skor
  → Hasil + rekor + peringkat
  → Main lagi
```

### 6.2 Tabel keadaan

| Keadaan | Tampilan | Perilaku |
|---|---|---|
| Loading | Skeleton dengan ukuran stabil | Data tidak ditampilkan sebagai nol palsu |
| Ready | Form atau identitas tersimpan | Pemain dapat edit dan mulai |
| Invalid input | Pesan dekat field | Fokus menuju field yang perlu diperbaiki |
| Starting | Tombol busy, hitungan mulai | Mencegah pembuatan sesi ganda |
| Running | Arena, skor, rekor | Form dan navigasi overlay tidak menutup permainan |
| Game over | Skor run dan status pemeriksaan | Dapat menuju run baru tanpa animasi panjang |
| Verifying | Status jelas | Skor belum diklaim sebagai skor resmi |
| Accepted | Rekor dan peringkat dari server | Leaderboard diperbarui |
| No improvement | Rekor lama tetap | Teks memberi tahu bahwa skor terbaik tetap tersimpan |
| Rejected | Alasan yang aman dan mudah dipahami | Skor tidak masuk leaderboard |
| Network error | Pesan dan retry submit | Tidak membuat duplikat atau menghapus hasil sebelumnya |
| Day closed | Hasil hari lama dan kompetisi baru | Run berikutnya memakai hari UTC baru |

### 6.3 Restart dan submit yang bersamaan

Restart tidak boleh menunggu animasi dekoratif. Submit run lama tetap memiliki ID dan status sendiri. Jika pemain mulai run baru sebelum pemeriksaan lama selesai, respons lama tidak boleh menimpa HUD atau hasil run baru.

Batasi run aktif per identitas/sesi secara wajar. Jika arsitektur belum mendukung submit latar yang aman, tunggu respons singkat dengan status jelas dan timeout, bukan spinner tanpa akhir.

### 6.4 Koneksi dan visibilitas

- Sesi kompetitif hanya dimulai setelah mendapat persetujuan server.
- Jika koneksi putus saat bermain, input log disimpan sementara untuk retry dalam jendela waktu terbatas.
- Skor tidak resmi sebelum server menerima dan memvalidasi run.
- Usulan: ketika tab disembunyikan, fokus hilang, layar terkunci, atau rotasi mengharuskan perubahan besar, run berakhir pada titik terakhir yang sah.
- Jelaskan perilaku tersebut di aturan. Jangan memberi jeda tak terbatas untuk kompetisi berhadiah.
- Jika jaringan pulih setelah batas submit berakhir, tampilkan bahwa skor tidak dapat dihitung; jangan menjanjikan pencatatan offline tanpa batas.

## 7. Spesifikasi gameplay

### 7.1 Loop inti

1. Dino bergerak maju secara otomatis melalui pergerakan dunia.
2. Pemain menekan lompat ketika rintangan mendekat.
3. Skor bertambah berdasarkan jarak simulasi.
4. Kecepatan naik secara bertahap hingga batas maksimum yang masih playable.
5. Tabrakan mengakhiri run.
6. Pemain melihat hasil dan dapat langsung mencoba lagi.

### 7.2 Kontrol

| Platform | Input |
|---|---|
| Desktop | Spasi atau panah atas |
| Ponsel/tablet | Tap arena atau tombol lompat yang mudah disentuh |
| Form aktif | Spasi tetap dapat dipakai mengetik; shortcut game tidak aktif |

Satu press memicu satu lompatan. Key repeat tidak memicu lompatan tambahan. Tidak ada double jump atau crouch. Scroll dicegah hanya pada interaksi arena yang relevan, bukan pada seluruh halaman.

### 7.3 Fisika dan skor

- Gunakan langkah simulasi tetap; rendering mengikuti refresh layar secara terpisah.
- Jarak, kecepatan, gravitasi, lompatan, dan tabrakan tidak bergantung pada jumlah frame yang berhasil dirender.
- Usulan skor berupa bilangan bulat dari jarak yang ditempuh, tanpa bonus acak atau multiplier.
- Angka final dan validitas run dihitung ulang oleh server.
- Konfigurasi fisika diberi versi dan tidak diubah di tengah hari kompetisi.
- Kecepatan maksimum mencegah run berubah menjadi rangkaian rintangan yang secara fisik mustahil.
- Toleransi hitbox dibuat kecil dan konsisten; wick candle tidak boleh menghasilkan tabrakan tak terlihat.

### 7.4 Tingkat kesulitan

Tahap awal memberi ruang untuk memahami kontrol. Setelah itu, kecepatan dan variasi meningkat perlahan. Threshold skor, tinggi lompatan, dan jarak rintangan ditentukan melalui playtest, bukan angka arbitrer yang dianggap final dalam dokumen.

Target pengalaman: pemula memahami permainan dalam satu percobaan; pemain yang berlatih dapat bertahan lebih lama; kegagalan terasa berasal dari timing yang bisa diperbaiki.

### 7.5 Generator rintangan

- Setiap pola harus memungkinkan respons dengan mekanik satu lompatan.
- Jarak minimum mempertimbangkan kecepatan, durasi lompatan, waktu mendarat, dan margin reaksi.
- Gunakan pustaka pola yang sudah diperiksa; hindari penempatan acak bebas.
- Jangan menghasilkan candle tinggi tepat setelah pendaratan tanpa ruang reaksi.
- Jangan menempatkan drone tinggi tepat di atas candle yang memaksa pemain melompat.
- Drone rendah dan tinggi harus mudah dibedakan dari jarak pandang yang tersedia.
- Semua perangkat menggunakan skala dunia dan jarak pandang ke depan yang setara secara fungsional.
- Seed dan versi konfigurasi disimpan untuk memungkinkan replay server.

Usulan kompetisi: seed harian yang sama untuk setiap run pada hari tersebut, sehingga susunan tantangan dapat dipelajari dan dibandingkan. Seed berubah pada hari berikutnya. Ini memberi konsistensi tantangan, tetapi tidak mencegah bot dan tetap memerlukan pemeriksaan run.

## 8. Arena, rintangan, dan suasana map

### 8.1 Satu arena, beberapa lapisan visual

| Lapisan | Isi | Gerakan |
|---|---|---|
| Background | Ivory/sage dengan gradasi sangat tipis | Diam atau perubahan warna lambat |
| Latar jauh | Bukit geometris rendah | Parallax lambat dan opsional |
| Area permainan | Dino, candle, drone | Mengikuti simulasi |
| Ground | Garis forest dan tekstur pixel ringan | Bergerak sesuai kecepatan dunia |
| Efek kecil | Debu mendarat, feedback milestone | Singkat, dibatasi jumlahnya |

Tidak ada elemen latar dengan bentuk yang mudah disalahartikan sebagai rintangan. Area depan dino tetap bersih. Detail latar harus dapat dimatikan pada perangkat lemah tanpa memengaruhi gameplay.

### 8.2 Candle hijau

- Body solid dan wick terlihat jelas.
- Variasi tinggi/lebar tetap berada dalam batas lompatan.
- Grup kecil menjadi variasi, bukan penumpukan yang mustahil.
- Warna candle lebih tegas daripada background dan dibedakan dari dino.
- Hitbox disesuaikan dengan bagian visual yang dianggap berbahaya; cek khusus wick.
- Candle bersifat dekorasi bertema pasar, bukan representasi harga atau data perdagangan nyata.

### 8.3 Drone pixel

- Bentuk kompak, siluet tegas, warna forest dengan sedikit aksen hijau.
- Muncul setelah bagian pengenalan.
- Drone rendah dapat dilompati; drone tinggi aman bila pemain tetap berlari.
- Animasi ringan, tidak menyamarkan posisi tabrakan.
- Gunakan aset kecil dan sederhana, tanpa model 3D.
- Bila playtest menunjukkan keterbacaan buruk, perbaiki tinggi, timing, atau siluet terlebih dahulu; jangan menambah kontrol baru.

### 8.4 Perubahan suasana

Perubahan ivory ke sage berlangsung pelan dan tidak mengubah aturan fisika. Hindari pergantian warna besar saat pemain sedang menghadapi rintangan rapat. Tidak ada flash putih atau strobo. Mode reduced motion mengurangi perubahan dekoratif.

## 9. Animasi, transisi, dan kualitas interaksi

### 9.1 Pedoman gerakan

| Interaksi | Rentang awal | Tujuan |
|---|---|---|
| Hover/fokus visual | 120–180 ms | Menunjukkan kontrol aktif |
| Press tombol | 80–120 ms | Umpan balik segera |
| Panel/form/hasil | 180–260 ms | Pergantian keadaan yang halus |
| Perubahan suasana | Beberapa detik | Kedalaman visual tanpa distraksi |
| Input lompat | Segera pada langkah simulasi berikutnya | Respons kontrol |

Durasi adalah titik awal. Gunakan transform dan opacity untuk animasi UI bila sesuai, dan hindari menganimasikan properti layout secara terus-menerus. Motion tidak boleh menunda aksi yang sudah bisa dilakukan.

### 9.2 Transisi wajib dirapikan

1. Load ke form: ukuran arena tidak meloncat.
2. Form ke hitungan mulai: fokus visual tetap di arena.
3. Hitungan ke run: kontrol aktif pada momen yang jelas.
4. Tabrakan ke hasil: dunia berhenti konsisten; hasil muncul tanpa flash.
5. Hasil ke restart: bersih dan cepat.
6. Rekor baru ke leaderboard: pembaruan angka tidak menggeser seluruh halaman.
7. Hari lama ke hari baru: label dan countdown diperbarui bersama.

### 9.3 Aksesibilitas dan kenyamanan

- Fokus keyboard terlihat pada semua kontrol.
- Target sentuh utama minimal sekitar 44 × 44 CSS px.
- Error tidak dijelaskan hanya dengan warna.
- Status hasil diumumkan secara aksesibel tanpa mengumumkan setiap kenaikan skor.
- Reduced motion menonaktifkan parallax dan gerakan dekoratif yang tidak diperlukan.
- HUD dan aturan tetap berupa teks UI yang dapat dibaca, bukan seluruhnya digambar dalam canvas.
- Modal, jika dipakai, mengelola fokus, tombol tutup, dan pengembalian fokus dengan benar.
- Jangan memaksa autoplay audio.

## 10. Leaderboard dan aturan harian

### 10.1 Identitas dan rekor

Kunci rekor harian: `(competition_day_utc, normalized_wallet)`.

```text
Jika belum ada rekor: simpan run terverifikasi.
Jika skor baru > skor lama: ganti skor, run, nama, dan waktu pencapaian.
Jika skor baru <= skor lama: pertahankan rekor sebelumnya.
```

Contoh: 500 → 350 → 700 menghasilkan rekor 500 → 500 → 700. Reset harian membuat rekor kompetisi baru tanpa menghapus riwayat hari sebelumnya.

### 10.2 Urutan peringkat

1. Skor tertinggi.
2. Waktu pencapaian skor paling awal.
3. Jika timestamp sama persis, gunakan urutan penerimaan server atau ID stabil sebagai penentu terakhir.

Waktu pencapaian bukan jam perangkat pemain. Usulan: waktu mulai resmi server ditambah waktu simulasi ketika skor final dicapai, setelah timeline run diverifikasi. Server juga menyimpan waktu penerimaan untuk audit.

### 10.3 Tampilan leaderboard

- Top 3 mendapat penanda peringkat yang jelas dan elegan.
- Tampilkan nama, wallet singkat, dan skor.
- Tampilkan daftar terbatas, misalnya 10 teratas, serta posisi wallet pemain secara terpisah bila tersedia.
- Hari UTC dan status live/final harus terlihat.
- Data kosong menampilkan ajakan untuk menjadi pemain pertama, bukan nama/skor fiktif.
- Saat refresh gagal, beri label data terakhir dan opsi retry.
- Wallet lengkap tidak perlu dikirim oleh endpoint leaderboard publik.
- Jangan memakai optimistik UI yang mengklaim juara sebelum server menerima skor.

### 10.4 Batas hari dan countdown

Hari kompetisi adalah interval **00:00:00 UTC inklusif sampai 00:00:00 UTC hari berikutnya eksklusif**.

- Server menentukan hari aktif dan waktu reset berikutnya.
- Client menghitung countdown dari offset waktu server, lalu melakukan sinkronisasi ulang saat diperlukan.
- Format: `Resets in HH:MM:SS · 00:00 UTC`.
- Label tanggal UTC mencegah kebingungan antara hari lokal dan hari kompetisi.
- Waktu perangkat yang salah tidak boleh mengganti hari kompetisi atau memberi perpanjangan.

**Usulan kebijakan run di batas hari:** run diakhiri pada 00.00 UTC, dan server hanya menilai kejadian sebelum batas tersebut untuk hari lama. Pemain diberi pesan bahwa kompetisi harian selesai dan dapat memulai hari baru.

Sediakan jendela submit singkat, usulan maksimal 60 detik, untuk mengirim log yang sudah terjadi sebelum batas hari. Tidak ada skor dari waktu setelah reset yang boleh dimasukkan ke hari lama. Setelah jendela ini berakhir, hasil dapat difinalisasi. Nilai jendela ini perlu ditetapkan dan diuji sebelum rilis.

### 10.5 Hasil final dan kurang dari tiga pemain

- Leaderboard live bersifat sementara sampai verifikasi dan finalisasi selesai.
- Hanya run terverifikasi yang eligible.
- Jika hanya ada satu atau dua wallet eligible, CSV berisi pemain tersebut; jangan membuat penerima pengganti fiktif.
- Run bermasalah yang memengaruhi top 3 membuat finalisasi hari itu menunggu review.
- Perubahan hasil setelah finalisasi harus tercatat dan menghasilkan revisi ekspor, bukan perubahan diam-diam.

## 11. Reward dan CSV privat

### 11.1 Model distribusi

Website mencatat hasil kompetisi. Pemilik proyek memeriksa rekap dan mengirim reward GOOGLc secara manual. Website tidak mengeksekusi transfer, menjamin transaksi, atau meminta akses kunci wallet.

Besaran hadiah dan jadwal distribusi belum ditetapkan. Jangan menampilkan nominal dummy sebagai hadiah sungguhan. Sebelum kompetisi berhadiah dibuka, informasi yang relevan harus diisi dan jaringan tujuan harus jelas.

### 11.2 Isi CSV wajib

Nama file contoh: `dino404-winners-2026-10-01-utc.csv`.

| Kolom | Isi |
|---|---|
| `competition_date_utc` | Hari kompetisi dalam YYYY-MM-DD |
| `rank` | 1, 2, atau 3 |
| `dino_name` | Nama dari run rekor |
| `wallet_address` | Alamat lengkap sesuai normalisasi jaringan |
| `score` | Skor final terverifikasi |
| `achieved_at_utc` | Timestamp pencapaian ISO 8601 |
| `run_id` | Referensi audit run |
| `verification_status` | Status kelayakan hasil |
| `result_revision` | Versi hasil harian |
| `exported_at_utc` | Waktu file dibuat |

Kolom aset, jaringan, dan reward amount dapat ditambahkan setelah informasinya ditetapkan. Jangan otomatis mengisi amount dengan nol atau tebakan.

CSV menggunakan UTF-8, escaping delimiter/quote/newline yang benar, dan penanganan formula injection pada teks yang berasal dari pengguna. Alamat dan timestamp harus tetap dapat diperiksa setelah dibuka dalam aplikasi spreadsheet.

### 11.3 Akses privat minimal

- Autentikasi server untuk pemilik proyek, melalui mekanisme yang sesuai hosting.
- Daftar tanggal kompetisi dan status live, pending review, atau final.
- Ringkasan top 3 dan tombol download CSV.
- Jika perlu menolak run yang terbukti tidak sah, sediakan tindakan minimal dengan alasan serta audit log.
- Nama URL yang sulit ditebak saja tidak dianggap sebagai proteksi.
- Tidak ada private key, credential, atau secret dalam bundle frontend.

Tidak ada pengiriman file otomatis yang dijanjikan. Dokumen ini menetapkan unduh privat sebagai mekanisme versi pertama.

## 12. Integritas kompetisi dan batas perlindungan

### 12.1 Ancaman yang perlu ditangani

- Mengirim angka skor palsu langsung ke API.
- Mengubah kecepatan, gravitasi, atau tabrakan di browser.
- Mengirim ulang run yang sama untuk membuat duplikat.
- Mengirim timestamp palsu untuk menang tie-break.
- Menjalankan submit bersamaan agar skor rendah menimpa skor tinggi.
- Mengubah wallet setelah run selesai.
- Bot yang memainkan game dengan input yang secara fisik valid.
- Banyak wallet yang dikendalikan oleh satu orang.

### 12.2 Perlindungan dasar

1. Server membuat sesi run sekali pakai yang terikat identitas, hari, seed, dan versi konfigurasi.
2. Client mencatat input berdasarkan tick simulasi; client bukan otoritas skor.
3. Server melakukan replay dengan konfigurasi yang sama dan menghitung skor serta tabrakan sendiri.
4. Cocokkan durasi run dengan waktu server dalam toleransi jaringan yang terukur.
5. Terapkan batas ukuran payload, jumlah input, durasi yang masuk akal, dan frekuensi permintaan.
6. Submit idempotent: ID run yang sama tidak menghasilkan rekor ganda.
7. Update rekor dilakukan atomik dengan syarat skor baru lebih tinggi.
8. Simpan jejak audit untuk run top 3 dan run yang ditandai.
9. Lindungi akses privat dan batasi API publik hanya pada data yang diperlukan.

### 12.3 Batas yang harus dipahami

Replay server dapat menolak run yang mustahil, tetapi **tidak membuktikan bahwa input berasal dari manusia**. Satu wallet satu posisi juga **tidak berarti satu orang satu posisi**. Pengisian wallet tanpa signature tidak membuktikan kepemilikan alamat.

Tidak ada klaim “anti-cheat 100%”. Review top 3 sebelum distribusi manual menjadi lapisan tambahan. Jika nominal hadiah atau tingkat penyalahgunaan meningkat, kebutuhan verifikasi identitas/wallet dan deteksi bot harus dievaluasi terpisah.

Aturan diskualifikasi perlu ditampilkan sebelum kompetisi dimulai. Review tidak boleh berarti mengubah hasil tanpa alasan yang tercatat.

## 13. Rancangan teknis

### 13.1 Komponen logis

```text
Browser
  ├─ UI: form, HUD, hasil, leaderboard, aturan
  ├─ Renderer game 2D
  ├─ Simulasi + input log
  └─ Penyimpanan identitas lokal
          │ HTTPS
Server
  ├─ Status kompetisi dan waktu UTC
  ├─ Pembuatan sesi run
  ├─ Replay dan validasi hasil
  ├─ Pembaruan rekor dan ranking
  ├─ Finalisasi harian
  └─ Akses privat + ekspor CSV
          │
Database
  ├─ Kompetisi harian
  ├─ Run dan status verifikasi
  ├─ Rekor harian per wallet
  ├─ Snapshot hasil harian
  └─ Audit perubahan hasil
```

### 13.2 Kandidat pendekatan implementasi

Usulan awal: TypeScript untuk model game dan UI, canvas 2D untuk arena, serta API server dan database relasional dengan transaksi. Gunakan satu modul simulasi bersama untuk client dan validator server agar aturan tidak berbeda.

Framework, versi paket, database provider, dan hosting dipilih pada awal implementasi setelah lingkungan proyek diperiksa. Dokumen ini tidak menetapkan klaim kompatibilitas paket yang belum diuji. Gunakan satu aplikasi dengan pemisahan modul yang rapi; microservices tidak diperlukan untuk cakupan ini.

Karena belum ada proyek yang terdeteksi saat dokumen disusun, keputusan stack belum didasarkan pada kode aplikasi yang sudah ada.

### 13.3 Model data minimum

| Entitas | Field penting |
|---|---|
| CompetitionDay | tanggal UTC, waktu buka/tutup, seed, config version, status finalisasi |
| Run | ID, wallet normal, nama, hari, start server, input log, skor hasil replay, waktu pencapaian, status, alasan penolakan |
| DailyBest | hari, wallet, score, achieved at, run ID, nama snapshot |
| DailyResult | hari, revisi, peringkat, wallet, score, run ID, finalized at |
| AuditEvent | waktu, aksi, target, alasan, aktor admin bila relevan |

Constraint unik pada hari + wallet melindungi satu posisi per hari. Operasi submit menggunakan transaksi agar dua tab atau dua permintaan bersamaan tidak merusak rekor.

### 13.4 Kontrak API awal

| Operasi | Contoh endpoint | Tugas |
|---|---|---|
| Status kompetisi | `GET /api/competition` | Hari, waktu server, reset, config version |
| Membuat run | `POST /api/runs` | Validasi identitas, buat sesi, seed, start resmi |
| Submit run | `POST /api/runs/:id/submit` | Replay, validasi, update rekor |
| Leaderboard | `GET /api/leaderboard?date=...` | Ranking publik dan status hari |
| Rekor pemain | Endpoint terbatas dengan identitas yang sesuai | Rekor/peringkat wallet tanpa membocorkan data privat lain |
| CSV | `GET /api/admin/results/:date/export` | Ekspor yang memerlukan autentikasi |

Path merupakan rancangan, bukan endpoint yang sudah tersedia. Semua input server harus divalidasi; jangan mengandalkan validasi form.

### 13.5 Finalisasi harian yang andal

Finalisasi menggunakan operasi idempotent setelah hari tutup dan jendela submit berakhir. Pekerjaan terjadwal dapat memicunya, dengan fallback aman saat hasil diminta jika sesuai arsitektur hosting. Dua pemicu bersamaan tidak boleh menciptakan snapshot berbeda.

Riwayat tidak dihapus saat reset. Kebijakan retensi input log perlu disesuaikan kapasitas dan kebutuhan review; usulan awal menyimpan log run relevan selama periode review dan mempertahankan snapshot hasil serta audit lebih lama. Angka retensi final harus tertulis sebelum produksi.

## 14. Performa dan responsivitas

### 14.1 Target internal

- Gameplay menargetkan 60 fps pada perangkat acuan yang disepakati, dengan pencatatan frame time saat pengujian.
- Tidak ada pekerjaan leaderboard atau layout berat di loop game.
- Payload halaman publik awal ditargetkan tidak lebih dari sekitar 1 MB terkompresi termasuk aset awal; ukur hasil aktual.
- Tidak ada video background atau pustaka besar untuk efek sederhana.
- Teks dan arena memiliki ukuran cadangan sebelum aset selesai dimuat.
- Sprite dimuat sebelum countdown agar run tidak dimulai dengan aset hilang.

Target bukan hasil pengukuran. Catat perangkat, browser, kondisi jaringan, dan hasil nyata sebelum menyatakan target tercapai.

### 14.2 Teknik yang diarahkan

- Render game melalui loop khusus, bukan memicu render seluruh UI tiap frame.
- Perbarui teks HUD seperlunya tanpa mengganggu simulasi.
- Batasi jumlah partikel, resolusi render efektif, dan objek rintangan aktif.
- Gunakan kembali objek yang sering muncul jika profiling menunjukkan kebutuhan.
- Hindari polling leaderboard agresif saat run aktif.
- Muat halaman privat dan fitur ekspor secara terpisah dari bundle game publik.
- Hentikan loop yang tidak diperlukan ketika game selesai atau halaman tidak terlihat.

### 14.3 Matriks tampilan

Uji pada lebar sekitar 360, 390, 768, 1024, dan 1440 CSS px, termasuk setidaknya satu perangkat ponsel nyata. Periksa portrait, landscape, keyboard virtual, safe area, dan browser bar yang mengubah tinggi viewport.

Arena harus menjaga skala dunia dan jarak pandang yang adil. Jangan sekadar memotong sisi kanan arena pada ponsel sehingga pemain melihat rintangan lebih terlambat. Resize atau rotasi selama run mengikuti kebijakan interupsi yang jelas.

## 15. Konten dan microcopy

Bahasa publik awal yang diusulkan adalah Inggris sederhana. Hindari campuran bahasa dalam satu layar tanpa alasan. Tone singkat dan ringan; instruksi serta error harus tetap literal dan jelas.

| Konteks | Contoh copy |
|---|---|
| Input nama | `Dino name` |
| Input alamat | `Wallet address` |
| Tombol mulai | `Start running` |
| Instruksi | `Press Space or tap to jump.` |
| Reset | `Resets at 00:00 UTC` |
| Skor diperiksa | `Verifying your run…` |
| Rekor baru | `New daily best!` |
| Skor lebih rendah | `Your daily best is still 700.` |
| Koneksi gagal | `We couldn't submit your run. Try again.` |
| Kompetisi berakhir | `Today's run is over. A new daily leaderboard has started.` |
| Wallet | `Rewards are sent manually to this address. Check it before you play.` |

Nama jaringan harus ditambahkan setelah diverifikasi. Jangan menyebut “claim”, “connect”, atau “reward sent” untuk aksi yang hanya mencatat alamat atau mengunduh rekap.

## 16. Rencana pengerjaan tujuh hari

### Hari 1 — Fondasi, keputusan teknis, dan desain utama

- Verifikasi repo/lingkungan, aset, dan dependensi kritis.
- Tetapkan stack, model data, serta batas teknis hosting.
- Buat komposisi desktop dan mobile untuk form, arena, hasil, dan leaderboard.
- Tetapkan token warna, tipografi, spacing, radius, dan motion.
- Buat prototipe awal renderer serta model simulasi bersama.

**Selesai jika:** arah visual dapat ditinjau, arena tampil responsif, dan risiko aset/jaringan tercatat dengan tindakan lanjut.

### Hari 2 — Gameplay inti

- Implementasikan dino, lompat, ground, candle, collision, skor, dan restart.
- Tambahkan input keyboard dan sentuh.
- Pisahkan simulasi dari rendering.
- Mulai pemeriksaan replay di server sejak awal.

**Selesai jika:** satu run lengkap dapat dimainkan dan hasil replay cocok dengan simulasi client.

### Hari 3 — Pola rintangan dan alur pemain

- Rapikan generator pola dan peningkatan kesulitan.
- Tambahkan drone dengan kombinasi yang bisa dilewati.
- Implementasikan form identitas, penyimpanan lokal, countdown mulai, dan hasil.
- Lakukan playtest di ponsel dan desktop.

**Selesai jika:** loop nama/wallet → main → hasil → main lagi berjalan, dan kontrol tidak membutuhkan penjelasan panjang.

### Hari 4 — Kompetisi dan integritas skor

- Integrasikan sesi run, input log, replay, dan submit idempotent.
- Implementasikan rekor atomik per wallet dan leaderboard.
- Terapkan tie-break, waktu UTC, cutoff harian, dan penanganan retry.
- Uji skor palsu, submit ganda, dan race condition.

**Selesai jika:** leaderboard hanya berisi skor yang diterima server dan aturan ranking terbukti benar.

### Hari 5 — Rekap dan operasional

- Finalisasi hasil harian dan penyimpanan snapshot.
- Buat akses privat minimal dan CSV top 3.
- Tambahkan aturan publik serta informasi reward yang sudah diberikan pemilik proyek.
- Uji ekspor, proteksi akses, dan hari dengan kurang dari tiga pemain.

**Selesai jika:** pemilik proyek dapat mengambil file hasil final yang akurat untuk distribusi manual.

### Hari 6 — Polishing dan pengujian menyeluruh

- Perbaiki kontras, spacing, tipografi, seluruh state tombol, dan fokus.
- Rapikan transisi serta animasi arena.
- Uji error jaringan, tab tersembunyi, waktu perangkat salah, dan reset UTC.
- Ukur performa; sederhanakan efek bila diperlukan.

**Selesai jika:** alur lengkap stabil pada perangkat acuan dan tidak ada masalah visual/interaksi utama.

### Hari 7 — Buffer, verifikasi, dan serah terima

- Perbaiki bug tersisa tanpa menambah fitur.
- Jalankan simulasi satu siklus kompetisi sampai CSV.
- Verifikasi konfigurasi produksi, prosedur recovery, dan dokumentasi operasional.
- Siapkan build serta checklist kesiapan untuk pemilik proyek.

**Selesai jika:** kriteria penerimaan terpenuhi dan hal yang belum selesai ditulis eksplisit. Pengumuman serta peluncuran token tetap diurus pemilik proyek.

## 17. Pengujian dan kriteria penerimaan

### 17.1 Gameplay

- [ ] Keyboard dan tap menghasilkan lompatan yang sama secara fisika.
- [ ] Key repeat tidak menambah lompatan.
- [ ] Kecepatan rendah dan tinggi tetap menghasilkan pola yang mungkin dilewati.
- [ ] Candle, wick, dan drone memiliki hitbox yang dapat dipahami dari visual.
- [ ] Framerate berbeda tidak mengubah skor untuk input dan seed yang sama.
- [ ] Restart tidak membawa rintangan, input, atau status dari run sebelumnya.
- [ ] Fokus input form tidak memicu lompatan.
- [ ] Interupsi dan batas hari mengikuti aturan yang tertulis.

### 17.2 Ranking dan waktu

- [ ] Wallet baru mendapatkan satu rekor.
- [ ] Skor lebih rendah tidak menimpa rekor.
- [ ] Skor sama tidak mengganti timestamp rekor.
- [ ] Skor lebih tinggi mengganti rekor dan waktu pencapaiannya.
- [ ] Tie-break menggunakan waktu resmi dan urutan stabil.
- [ ] Wallet ekuivalen tidak membuat dua posisi.
- [ ] Dua submit bersamaan mempertahankan skor tertinggi.
- [ ] Countdown dan reset memakai waktu UTC server.
- [ ] Skor sebelum/tepat/setelah batas hari diperlakukan dengan benar.
- [ ] Hasil hari lama tetap tersedia setelah hari baru dimulai.
- [ ] Finalisasi berulang tidak menggandakan hasil.

### 17.3 Validasi dan privasi

- [ ] Mengubah skor dalam request tidak membuat skor palsu diterima.
- [ ] Seed/config/identitas run tidak dapat diganti saat submit.
- [ ] Run yang dipercepat melampaui toleransi ditolak atau ditandai.
- [ ] Request duplikat idempotent.
- [ ] Payload terlalu besar dan spam dibatasi.
- [ ] Endpoint publik tidak membocorkan wallet lengkap, input log, atau data admin yang tidak diperlukan.
- [ ] Akses CSV tanpa autentikasi ditolak.
- [ ] Nama berbahaya dirender aman dan diekspor tanpa formula injection.

### 17.4 UI/UX

- [ ] Tidak ada tombol mati atau tautan placeholder pada rilis.
- [ ] Semua field memiliki label, error, dan fokus yang terlihat.
- [ ] Teks dan kontrol lulus pemeriksaan kontras yang ditargetkan.
- [ ] Tidak ada horizontal overflow pada ponsel.
- [ ] Form, loading, hasil, dan leaderboard tidak menyebabkan layout melompat.
- [ ] Pemain memahami status skor terverifikasi versus masih diproses.
- [ ] Reduced motion bekerja pada animasi dekoratif.
- [ ] Countdown terbaca tanpa bergantung pada warna saja.
- [ ] Tombol main lagi mudah dijangkau dan bekerja konsisten.

### 17.5 CSV dan operasional

- [ ] Isi top 3 cocok dengan hasil final hari yang dipilih.
- [ ] Wallet lengkap, tanggal UTC, timestamp, dan skor benar.
- [ ] Nama dengan koma, quote, atau karakter khusus tidak merusak CSV.
- [ ] Hari kosong atau kurang dari tiga pemain diekspor dengan benar.
- [ ] Revisi hasil tercatat dan dapat dibedakan melalui file/data ekspor.
- [ ] Pemilik proyek memiliki langkah penggunaan yang jelas tanpa perlu menjalankan query manual.

Prioritaskan automated test untuk simulasi/replay, ranking, race condition, batas hari, dan ekspor. Gunakan pemeriksaan visual serta tes perangkat untuk kualitas UI. Jangan menganggap screenshot saja membuktikan bahwa kontrol berfungsi.

## 18. Risiko dan keputusan yang perlu ditutup

| Risiko / pertanyaan | Dampak | Tindakan |
|---|---|---|
| Penggunaan sprite asli belum diperiksa | Aset final mungkin perlu perubahan | Periksa sumber dan ketentuan sebelum mengunci aset produksi |
| Detail GOOGLc belum dikonfirmasi | Salah format alamat atau informasi hadiah | Pemilik proyek memberikan detail; verifikasi sebelum kompetisi berhadiah dibuka |
| Nominal/jadwal hadiah belum ada | Halaman reward belum lengkap | Siapkan konfigurasi, jangan isi angka fiktif |
| Hadiah menarik bot/multi-wallet | Hasil bisa dimanipulasi meskipun replay valid | Review top 3, aturan tertulis, dan evaluasi perlindungan tambahan bila diperlukan |
| Replay server terlalu berat | Latensi submit dan biaya meningkat | Batasi payload/durasi secara terukur, profil validator, pilih runtime yang sesuai |
| Visual terlalu banyak efek | Ponsel lambat dan game terganggu | Kurangi dekorasi, pertahankan input serta kontras |
| Run melintasi reset | Sengketa hari/peringkat | Terapkan cutoff server dan uji batas waktu |
| Scope bertambah selama minggu pengerjaan | Fitur inti tidak selesai | Bekukan cakupan; ide baru masuk backlog |
| Domain/hosting belum siap | Publikasi tertunda | Verifikasi akses dan kebutuhan deploy pada awal implementasi |

### 18.1 Informasi yang diperlukan dari pemilik proyek saat implementasi

1. Identitas jaringan tujuan dan aset GOOGLc yang tepat.
2. Nominal reward peringkat 1, 2, dan 3 serta perkiraan waktu distribusi.
3. Akses atau pilihan hosting dan domain ketika diperlukan.
4. Identitas/metode akses privat untuk pengambilan CSV.
5. Tautan komunitas resmi jika ingin ditampilkan.

Informasi tersebut tidak menghalangi pembuatan prototipe visual dan gameplay, tetapi sebagian menjadi prasyarat pembukaan kompetisi berhadiah yang benar.

## 19. Hasil akhir yang harus diserahkan

- Source code website dan game yang terstruktur.
- Aset visual beserta catatan sumber/lisensi.
- Konfigurasi game yang diberi versi.
- Database schema dan migrasi bila digunakan.
- Leaderboard harian, validasi server, dan finalisasi hasil.
- Akses privat serta contoh CSV yang sudah diverifikasi.
- Dokumentasi setup, konfigurasi environment, build, dan operasional harian.
- Catatan hasil pengujian, perangkat acuan, performa, serta keterbatasan yang tersisa.
- Panduan pemilik proyek: memilih tanggal → memeriksa hasil → mengunduh CSV → membagikan reward manual.

## 20. Definisi selesai

Versi pertama selesai ketika pemain dapat memasukkan identitas, memainkan runner dengan lancar, memperoleh hasil yang diverifikasi, dan melihat rekor harian yang mengikuti aturan; pemilik proyek dapat mengunduh CSV top 3 final; seluruh alur utama berfungsi di desktop dan ponsel; kualitas visual, kontras, serta transisi telah diperiksa; dan tidak ada klaim jaringan, aset, hadiah, atau afiliasi yang belum terverifikasi ditampilkan sebagai fakta.

Kerapian tampilan saja tidak cukup. Backend yang benar saja juga belum cukup. DINO404 harus terasa sebagai satu produk yang utuh: **mudah dimainkan, jelas dipahami, menyenangkan diulang, dan rapi dioperasikan.**

---

**Status pekerjaan saat dokumen ini dibuat:** masterplan saja. Implementasi aplikasi, riset aset/jaringan, deployment, peluncuran token, dan distribusi reward belum dilakukan dalam tahap ini.

## 21. Amendemen gameplay dan polishing — 29 September 2026

Permintaan lanjutan pemilik proyek: arena terasa sepi, drone kurang terlihat, dino harus bisa nunduk seperti runner klasik; audit dan perbaiki bug sebelum menyerahkan update. Bagian ini menggantikan ketentuan awal yang mengecualikan ducking, sesuai arahan terbaru pemilik proyek. Scope kompetisi, top 3, CSV, wallet, dan pembagian manual tetap berlaku.

### 21.1 Kontrol dan rintangan versi 2.0

- Lompat: Space, Arrow Up, tap arena, atau tombol Jump. Tetap satu tinggi lompatan, tanpa double jump.
- Nunduk: tahan Arrow Down atau S di desktop; tahan tombol Duck pada HP. Lepas untuk kembali berdiri. Menahan down ketika di udara mempercepat turun dan menjadi duck setelah mendarat.
- Candle hijau tetap menjadi rintangan utama; variasi satu, dua, atau tiga candle diperkenalkan bertahap.
- Drone tengah harus bisa dilewati sambil nunduk; drone rendah dilompati; drone tinggi dilewatkan sambil tetap di tanah. Lompat juga dapat melewati drone tengah dengan timing yang sesuai.
- Drone tengah diperkenalkan sebagai rintangan ketiga, drone rendah kelima, drone tinggi kedelapan. Setelah pengenalan, pola dicampur secara deterministik dari seed harian. Petunjuk pendek menjelaskan respons yang sesuai.
- Tidak ada item, power-up, mata uang di dalam arena, biaya masuk, ataupun bonus skor baru. Tujuan tetap bertahan lebih lama dan mencapai skor tertinggi.

### 21.2 Isi arena dan UX

- Zona berulang: Green Valley, Signal Ridge, Market District, setiap 7.000 unit jarak. Perubahan palet berlangsung halus menjelang zona berikutnya.
- Awan pixel, lanskap berlapis, pepohonan/jajaran bangunan/antena jauh, detail tanah dan penanda jarak menambah isi map.
- Animasi rotor drone, bayangan, dust dan feedback CLEAR memberi umpan balik. Dekorasi tidak memiliki hitbox dan tidak menambah skor.
- Pertahankan warna ivory/sage/forest/hijau, kontras dino dan rintangan, serta UI ringan. Reduced motion menghentikan parallax dekoratif dan meniadakan dust/feedback bergerak.
- HP mendapat dua tombol berdampingan dengan tinggi minimum 48 px; label HOLD menegaskan bahwa Duck ditahan. Countdown, skor, petunjuk dan area main tetap terbaca tanpa overflow horizontal.

### 21.3 Integritas data dan debugging

- Simulasi versi 2.0.0 memverifikasi jump dan perubahan status duck pada server. Input diurutkan berdasarkan tick; batas total tetap 6.000 input; durasi maksimal 30 menit.
- Simulasi 1.0.0 dibekukan untuk tiket lama. Versi tiket menentukan validator, bukan versi terbaru secara paksa.
- Pada pre-season dengan reward nonaktif, tiket baru dapat langsung menggunakan 2.0. Skor latihan dan seed lama tidak dihapus. Pada hari berhadiah aktif, versi hari tetap sampai UTC rollover.
- Countdown yang kehilangan fokus sebelum simulasi dimulai kembali ke form; jangan mengirim run satu tick yang belum dimainkan. Kontrol yang ditahan dibersihkan ketika run berhenti.
- Log owner mendukung format klasik dan format baru (jump + duck), serta menangani log kedaluwarsa/rusak tanpa membuat panel error.
- Wajib periksa collision berdiri/nunduk/udara, fast-fall, pelepasan input, replay identik, pola sampai kecepatan maksimum, pending tiket lama, API, top 3 CSV, build, typecheck, lint, desktop dan viewport HP. Tes lulus tidak berarti jaminan absolut nol bug.

## 22. Amendemen polishing map — 29 September 2026

Arahan lanjutan pemilik proyek berdasarkan screenshot arena: pertahankan gaya dino offline klasik, hidupkan awan, perbaiki gunung dan pepohonan, serta tambahkan perubahan suasana sekitar skor 1.000.

- Awan menggunakan bentuk pixel Chromium yang sudah dilisensikan, dengan dua lapisan ukuran/kecepatan drift. Gunung menjadi tiga lapisan punggungan pixel, dengan kecepatan parallax berbeda.
- Pepohonan jauh dan dekat memiliki ukuran serta bentuk berbeda; pohon dekat bergerak satu pixel secara lembut seperti tertiup angin. Identitas Signal Ridge dan Market District tetap dipertahankan.
- Skor 0–999 memakai siang. Mulai 1.000, palet bertransisi melalui senja sage ke malam forest; malam penuh pada 1.100. Mulai 2.000, transisi kembali ke siang dan selesai pada 2.100. Siklus berulang setiap 1.000 poin.
- Langit malam mendapat bulan sabit pixel dan bintang kecil yang tidak berkedip. Label DAY RUN/DUSK/NIGHT RUN/DAWN menjelaskan suasana. Bar zona dan area kontrol mengikuti warna arena.
- Candle, drone, dino, garis tanah dan petunjuk harus tetap jelas selama seluruh transisi. Dekorasi tetap di belakang lintasan.
- Reduced motion menghentikan drift/parallax/goyangan dekoratif; perubahan warna bertahap tetap mengikuti progres skor tanpa kedipan atau efek kilat.
- Perubahan ini visual saja: tidak mengubah physics, hitbox, pola rintangan, penilaian, validator, atau versi game 2.0.0. Tidak ada bonus, item, mekanik atau syarat hadiah baru.
