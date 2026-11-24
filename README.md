# Profile Card

Kartu profil statis (HTML + CSS + JS biasa, tanpa build / framework).
Semua teks, gambar, warna, dan layout diatur dari **satu file config**, dan bisa diedit visual lewat **demo.html**.

## Struktur folder

```
profile/
├── index.html          ← halaman utama (yang dipublish)
├── demo.html           ← editor config + live preview (khusus kamu, tidak wajib di-upload)
├── README.md
├── css/
│   ├── card.css        ← style kartu + background glass (semua variabel warna/ukuran)
│   ├── page.css        ← layout halaman index.html
│   └── demo.css        ← style editor demo.html
├── js/
│   ├── config.js       ← ⭐ CONFIG UTAMA (teks, gambar, warna, layout)
│   ├── app.js          ← mesin render kartu dari config
│   └── demo.js         ← logika editor demo.html
└── assets/
    ├── profile/        ← foto profil
    ├── banner/         ← gambar banner di dalam kartu
    ├── background/     ← gambar background halaman (opsional)
    ├── favicon/        ← favicon.png — ikon kecil di tab browser (512×512)
    ├── og/             ← og.jpg — gambar link preview saat dibagikan (1200×630)
    │                      og.html = sumber desainnya
    ├── icon/           ← ikon verified, ikon label/sosial
    └── uploads/        ← hasil upload dari demo.html (dibuat otomatis saat Export ZIP)
```

## Isi kartu

- **Banner** — rounded 4 sisi / 2 sisi bawah / ikut shape card / kotak / bebas per sudut. Ikon tema (kiri atas), tombol simpan (kanan atas), ikon media sosial (ukuran bisa diatur, ikon sendiri, 8 template posisi atau seret bebas).
- **Foto profil** — bentuk kotak sampai bulat, plus **ring** opsional (solid/gradient, tebal, jarak).
- **Nama + ikon verified + label** — klik ikon verified atau label → teks muncul di atas ikon. Ikon verified bisa digeser naik/turun dan diubah ukurannya. **Label** bisa pakai ikon upload sendiri (atau hanya ikon), punya teks klik dan posisi naik/turun.
- **Username, bio (multi-paragraf), Following / Followers, tombol Follow** (di bawah banner atau di banner).
- **Link** di bawah Following/Followers — lebih dari satu, gaya teks atau tombol, warna solid/gradient.
- **More Info** — tombol kaca; membuka **section** (judul, kolom 1–3, efek muncul). Isi section: **baris** (label + teks dan/atau **ikon** dengan ukuran, bentuk, posisi, efek hover, badge “3+”), **gambar**, atau **teks**. Semua bisa diurutkan drag & drop.
- **Copyright** — di bawah kartu atau di dalam panel More Info.
- **Tema gelap / terang**, pilihan font, dan **background** (glass orb / gambar upload / warna polos).

## Cara pakai cepat

1. Buka `index.html` di browser untuk melihat hasil.
2. Mau ubah-ubah? Buka `demo.html`.
3. Selesai edit → klik **Export ZIP** → ekstrak ke folder project (timpa `js/config.js` dan gambar yang ikut).
4. Upload folder ke hosting. `demo.html` boleh dihapus kalau tidak mau ikut dipublish.

> Buka langsung dengan double-click (`file://`) juga bisa, tidak perlu server.

## demo.html

| Fitur | Keterangan |
|---|---|
| **Menu bar & tab** | Menu tab di kiri (Profil, Banner, Konten, Tema, Aset), kolom pencarian pengaturan (Ctrl+K), Undo/Redo (Ctrl+Z / Ctrl+Y), dan menu Export. |
| **Panel config** | Profil, media sosial (tambah/hapus, maks 5), Follow/Following/Followers, link, tombol simpan, More Info (daftar info tambah/hapus, maks 6), tema gelap/terang + palet warna masing-masing, background glass, gambar, banner, layout (bentuk foto profil, ukuran, lebar, sudut), info tab/SEO. |
| **Live preview** | Kartu langsung berubah saat panel diubah. Semua interaksi bisa dites di preview: ikon tema, verified, Follow, simpan, More Info. Tombol **375 / 320 / 280** untuk tes lebar layar kecil. |
| **Edit via klik (ON/OFF)** | Klik objek di kartu → panel kiri otomatis membuka & menyorot pengaturannya. Teks bisa diketik langsung (Enter = simpan, Esc = batal; bio: Enter = baris baru, Ctrl+Enter = simpan). Klik ikon sosial untuk ganti link, seret ikon sosial untuk memindah posisinya, seret ⠿ untuk memindah blok; klik foto / banner / ikon verified / area background untuk upload gambar. |
| **Draft otomatis** | Tersimpan di browser (localStorage). Lihat hasilnya di `index.html?draft=1` (tombol **Buka index**). |
| **Export ZIP / config.js / Copy JSON / Import / Reset** | Sama seperti sebelumnya. |

## Isi config (js/config.js)

- `meta`, `assets` — judul tab, path gambar (`background` kosong = tanpa gambar)
- `profile` — `name`, `username`, `description` (baris kosong = paragraf), `verified*` (+ `verifiedSize`, `verifiedPos`), `badgeAlign` (`center`/`top`/`bottom`/`baseline`), `verifiedOffsetY`, `labels: { show, items: [{ text, style, icon, iconSrc, tint, size, mode, color1, color2, textColor, offsetY, tip }] }`
- `avatar.ring` — `show`, `mode` (solid/gradient), `color1`, `color2`, `angle`, `width`, `gap`
- `layout.order` — urutan blok
- `socials` — `show`, `style`, `size`, `pos` (template posisi / `custom` + `x`,`y`), `direction`, `items: [{ type, url, icon, tint }]` (`type: "custom"` = ikon sendiri)
- `follow` — `show`, `position` (`below` / `banner`), teks, angka Following/Followers
- `links` — `show`, `items: [{ text, url, icon, style, mode, color1, color2, textColor }]`
- `cta` — More Info: `shapeMode`, `shapeColor1/2`, `textMode`, `textColor1/2`, `sections: [{ title, showTitle, titleAlign, columns, gap, effect, items: [{ type: row | image | text, … }] }]`, aksi
- `copyright` — `show`, `text`, `align`, `placement` (`always` / `inside`), `size`
- `theme` — `mode`, `fontFamily`, `bgMode` (`orbs`/`image`/`solid`), `bgBlur`, `bgDim`, palet `light` & `dark`, banner (`bannerHeight`, `bannerInset`, `bannerRadiusMode`, `bannerRadius*`), `cardWidth`, `cardRadius`, `cardBorderWidth`, `avatarSize`, `avatarRadius`

## Catatan

- **Favicon vs Banner vs Link preview — beda fungsi:**

  | Folder | Dipakai di | Ukuran |
  |---|---|---|
  | `assets/banner/` | gambar di bagian atas kartu | ±1200×400 |
  | `assets/favicon/` | ikon di tab browser / bookmark / layar utama HP | 512×512 PNG |
  | `assets/og/` | thumbnail saat link dibagikan (WhatsApp, Telegram, FB, X, Discord) | 1200×630 JPG, <300 KB |

  (Folder `thumb` yang lama dihapus — fungsinya dipisah jadi `favicon` dan `og`.)

- **Ganti favicon:** demo.html → tab **Aset** → *Favicon* → Upload → Export ZIP → ekstrak. File otomatis jadi `assets/favicon/favicon.png`, dan `index.html` sudah mengarah ke path itu, jadi tidak ada yang perlu diedit.
- **Ganti link preview:** demo.html → tab **Aset** → *Link preview (OG)* → Upload (otomatis dipotong tengah ke 1200×630) → Export ZIP. Atau render ulang desain bawaan dari `assets/og/og.html` (petunjuk ada di dalam file itu).
- **Link preview butuh URL penuh.** Crawler WhatsApp/Telegram/FB tidak menjalankan JavaScript dan membaca tag `<meta>` statis di `index.html`; `og:image` harus berupa URL penuh (`https://domain-kamu/assets/og/og.jpg`). Cara mudah: isi **Alamat website** di tab Aset → menu ▾ di kanan atas → **Salin tag `<head>`** → tempel menggantikan tag lama di `index.html`. Setelah itu, cache preview di platform bisa dibersihkan lewat tool debugger mereka (mis. Facebook Sharing Debugger).
- Di demo, tema/follow/simpan hanya berlaku di preview. Di `index.html` pilihan pengunjung disimpan di browser mereka.
- Draft demo tersimpan per browser. Pindah browser/perangkat → gunakan Export ZIP.

## Catatan tambahan (update terbaru)

- **Ikon custom (mis. TikTok) tidak muncul?** Ikon custom diwarnai pakai CSS `mask-image`, dan browser memblokirnya kalau halaman dibuka langsung dari file (`file://`). Lewat hosting / Live Server / `python -m http.server` ikon tampil dan ikut warna tema. Saat dibuka dari `file://`, ikon tetap ditampilkan (fallback: ikon di banner jadi putih, ikon lain warna aslinya).
- **Efek hover hanya di perangkat yang punya mouse.** Di HP, ikon tidak lagi terkena efek hover sebelum disentuh.
- **Warna teks di section More Info:** tiap baris punya *Warna teks label* dan *Warna teks isi*; judul section, teks, dan keterangan gambar juga punya warna sendiri (kosong = ikut tema). Di mode edit, klik teksnya lalu atur warna lewat toolbar kecil yang muncul.
- **Urutan bebas lewat drag & drop (mode edit, seret ikon ⠿):**
  - Blok kartu: nama, @handle, deskripsi, Following/Followers, link, More Info, **dan copyright**.
  - Item More Info bisa dipindah **antar section**, juga di layout 2–3 kolom.
  - Section dan **tombol aksi** bisa diurutkan bersama (atau pakai pilihan *Posisi tombol aksi* di panel).
  - Di panel, tiap item punya dropdown *Pindah item ini* ke section lain.
  - Banner, avatar, dan tombol Follow tetap di posisi tetap (bagian struktur kartu).
