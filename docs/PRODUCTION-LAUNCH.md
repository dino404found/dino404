# DINO404 production setup — 3 Oktober 2026

Domain produksi: [dino404.xyz](https://dino404.xyz/). **Pemasangan domain, HTTPS, deployment dan pemeriksaan akhir selesai pada 3 Oktober 2026 pukul 01:49 WIB.**

## Konfigurasi yang diterapkan

- Deployment produksi awal: `6abff8629e70ceb3f8b4baac`, source `705c7ff`, context `production`, status `ready`.
- Deployment final setelah redirect: `6abffbf81e7f01fa9ceef11d`, source `75222ab`, context `production`, status `ready`. Perubahan source setelahnya hanya laporan.
- Domain utama `dino404.xyz`; alias `www.dino404.xyz`. Sertifikat Netlify berstatus issued untuk keduanya; force HTTPS aktif. Renewal dikelola Netlify.
- Production `APP_ORIGIN`: `https://dino404.xyz`. Context preview, branch-deploy dan dev tetap memakai `https://preview--dino404.netlify.app`.
- Main database produksi Netlify terpisah dari branch preview. Keenam tabel aplikasi tersedia; migrasi immutable diterapkan oleh deployment tanpa perubahan file SQL.
- Password owner yang sudah ada tetap dipakai. Hash, password dan koneksi database tidak masuk source atau dokumentasi publik.
- `REWARDS_ENABLED=false`: tetap pre-season. Tidak mengaktifkan hadiah atau mengirim publikasi sosial.

DNS yang disimpan pemilik di Hostinger:

| Type | Name | Value | TTL |
| --- | --- | --- | --- |
| A | `@` | `75.2.60.5` | 300 |
| CNAME | `www` | `dino404.netlify.app` | 300 |

Server authoritative Hostinger sudah menjawab kedua nilai yang benar. Registry RDAP mencatat pendaftaran pada 3 Oktober 2026 pukul 01:22:20 WIB dengan nameserver `orbit.dns-parking.com` dan `horizon.dns-parking.com`. Resolver publik awalnya menjawab NXDOMAIN; pada pemeriksaan akhir Google dan Cloudflare sudah memberikan jawaban yang benar dan sertifikat berhasil terbit. Cache DNS yang berbeda dapat membuat sebagian perangkat menyusul belakangan.

Redirect HTTP dan www ke `https://dino404.xyz` sudah diverifikasi. Konfigurasi `netlify.toml` juga menambahkan redirect khusus dari `https://dino404.netlify.app/*` ke domain utama; alamat preview dan URL deploy unik tidak cocok dengan rule ini.

## Pemeriksaan produksi

- Build Next dan TypeScript berhasil; checksum migrasi cocok.
- 16 pemeriksaan HTTP pada URL deployment produksi lulus: halaman/kontrol, tidak ada fixture QA, header keamanan, canonical domain asli, `index, follow`, kartu berbagi dan PNG 1200 × 630, kompetisi pre-season, privasi wallet, penolakan owner anonim, challenge login, kredensial existing, panel owner noindex, larangan CSV hari berjalan, robots dan penjelasan form. Pemeriksaan tersebut juga berhasil dijalankan pada domain asli sebelum tahap pemeriksaan redirect.
- Browser pada URL deployment menyelesaikan satu run nyata (77 poin) dengan RUN VERIFIED. Database produksi dan endpoint owner mengonfirmasi hasilnya; konsol tidak mencatat warning/error pada alur tersebut.
- Run sintetis `Launch QA 0301` dikeluarkan lewat mekanisme review owner. Leaderboard dibersihkan dari skor QA; run excluded dan audit trail dipertahankan. Koneksi database eksternal produksi bersifat read-only; tidak ada perluasan hak akses atau pelemahan proteksi database.
- Run kedua dilakukan langsung dari `https://dino404.xyz`, bukan URL deploy unik: 77 poin, RUN VERIFIED, tersimpan pada database dan endpoint owner. Fixture `Domain QA 0301` juga dikeluarkan dengan audit trail; kedua fixture tidak tersisa di leaderboard publik.
- **19 pemeriksaan HTTP pada domain asli lulus**, mencakup 16 pemeriksaan di atas dan redirect HTTP, www, serta alamat bawaan Netlify ke `https://dino404.xyz`. **16 pemeriksaan preview lulus kembali**; origin preview dan metadata noindex tetap benar.
- Tampilan domain asli diperiksa pada viewport 390 dan 1440 px tanpa overflow horizontal. Dialog aturan terbuka/tertutup dan navigasi logo kembali ke atas dengan URL bersih. Screenshot workspace: `artifacts/dino404-domain-desktop.png`, `artifacts/dino404-domain-mobile.png`, dan `artifacts/dino404-domain-verified.png`.
- Badge publik Netlify yang baru muncul pada produksi menutupi bagian form HP. Pengaturan resmi proyek `built_with_badge_enabled` dinonaktifkan; tidak ada script atau frame badge pada pemeriksaan akhir. Tidak ada CSS yang menyembunyikan script platform. [Dokumentasi badge Netlify](https://docs.netlify.com/manage/projects/powered-by-netlify-badge/).
- Satu pesan `MutationObserver.observe` tercatat pada sesi browser awal tanpa lokasi source/stack. Tidak berulang saat reload, pembukaan/penutupan dialog dan navigasi sesudahnya, dan tidak menghalangi run terverifikasi. Asal pesan belum dapat dipastikan; tidak diklaim sebagai bug aplikasi yang sudah diperbaiki atau sebagai konsol tanpa error sepanjang sesi. Hasil uji terakhir tidak menambahkan warning/error baru.

Panel owner sekarang berada di [dino404.xyz/owner-login](https://dino404.xyz/owner-login). Username dan password existing tetap berlaku. Gunakan jendela privat, lalu tutup setelah selesai. Jangan membagikan file kredensial lokal.

Preview yang sudah ada tetap tersedia di [preview DINO404](https://preview--dino404.netlify.app/). Source tetap publik. Auto-deploy GitHub, konfigurasi hadiah dan posting X/Twitter tidak diaktifkan dalam perubahan ini. Pengujian bukan uji beban massal atau jaminan semua perangkat bebas bug.

Referensi: [Netlify external DNS](https://docs.netlify.com/manage/domains/configure-domains/configure-external-dns/), [database production/preview](https://docs.netlify.com/build/data-and-storage/netlify-database/).
