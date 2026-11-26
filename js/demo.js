/* ==========================================================
   demo.html — Studio: editor config + live preview + edit via klik
   Bergantung pada js/config.js dan js/app.js
   ========================================================== */
(function () {
  "use strict";

  var PC = window.ProfileCard;
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };

  // Di demo, tema / follow / simpan hanya berlaku di preview (tidak menulis ke storage index)
  PC.configure({ persist: false });

  var DEFAULTS = PC.defaults();
  var cfg = PC.merge(DEFAULTS, PC.loadDraft() || {});

  var stage = $("#stage");
  var shell = $("#stageShell");
  var cardEl = $("#card");
  var formEl = $("#form");
  var statusEl = $("#status");
  var scrollEl = $("#panelScroll");
  var editOn = false;

  var ui = { tab: "profil", palette: cfg.theme && cfg.theme.mode === "light" ? "light" : "dark" };

  /* Lokasi standar file saat export ZIP (sesuai struktur folder) */
  var ASSET_FILES = {
    profile:       { path: "assets/profile/profile.jpg",     type: "jpeg", max: 800 },
    banner:        { path: "assets/banner/banner.jpg",       type: "jpeg", max: 1400 },
    favicon:       { path: "assets/favicon/favicon.png",     type: "png",  max: 512, square: true },
    og:            { path: "assets/og/og.jpg",               type: "jpeg", max: 1200, exact: [1200, 630] },
    verified:      { path: "assets/icon/verified.png",       type: "png",  max: 512 },
    verifiedWhite: { path: "assets/icon/verified-white.png", type: "png",  max: 512 },
    background:    { path: "assets/background/background.jpg", type: "jpeg", max: 1920 }
  };
  var ICON_SPEC = { type: "png", max: 160 };
  var PHOTO_SPEC = { type: "png", max: 900 };

  var IMAGE_FIELDS = [
    { key: "profile",       label: "Foto profil",      hint: "Disarankan persegi, min. 400px. Bentuk & ring diatur di tab Profil." },
    { key: "banner",        label: "Banner",           hint: "Dipakai bila Isi banner = Gambar. Disarankan 1200×400." },
    { key: "favicon",       label: "Favicon",          hint: "Ikon kecil di tab browser. PNG persegi, 512×512." },
    { key: "og",            label: "Link preview (OG)", hint: "Gambar saat link dibagikan di WhatsApp/Telegram/dll. Wajib 1200×630." },
    { key: "verified",      label: "Ikon verified (biru)",  hint: "PNG transparan." },
    { key: "verifiedWhite", label: "Ikon verified (putih)", hint: "PNG transparan, untuk kartu gelap." },
    { key: "background",    label: "Background halaman", hint: "Dipakai bila Jenis background = Gambar upload." }
  ];

  /* ---------- tab menu ---------- */
  var TABS = [
    { id: "profil", label: "Profil", icon: '<path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>' },
    { id: "banner", label: "Banner", icon: '<rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/>' },
    { id: "konten", label: "Konten", icon: '<polygon points="12 2 2 7 12 12 22 7 12 2"/><polyline points="2 17 12 22 22 17"/><polyline points="2 12 12 17 22 12"/>' },
    { id: "tema",   label: "Tema",   icon: '<path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z"/>' },
    { id: "aset",   label: "Aset",   icon: '<path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/>' }
  ];

  /* ---------- skema form ---------- */
  function get(path) { return PC.getPath(cfg, path); }
  function isGrad(path) { return function () { return get(path) === "gradient"; }; }
  function isOneOf(path, arr) { return function () { return arr.indexOf(get(path)) !== -1; }; }
  function isType(base, arr) { return function () { return arr.indexOf(get(base + "type") || "row") !== -1; }; }
  var COLOR_MODES = [["solid", "Solid (1 warna)"], ["gradient", "Gradient (2 warna)"]];
  var ALIGN3 = [["left", "Kiri"], ["center", "Tengah"], ["right", "Kanan"]];

  function paletteFields(mode) {
    var b = "theme." + mode + ".";
    var w = function () { return ui.palette === mode; };
    return [
      { path: b + "pageBg", label: "Background halaman", type: "color", when: w },
      { path: b + "orb1", label: "Background glass — warna 1", type: "color", when: w },
      { path: b + "orb2", label: "Background glass — warna 2", type: "color", when: w },
      { path: b + "orb3", label: "Background glass — warna 3", type: "color", when: w },
      { path: b + "cardBg", label: "Warna kartu", type: "color", when: w },
      { path: b + "cardOpacity", label: "Transparansi kartu (kaca)", type: "range", min: 0.05, max: 1, step: 0.05, when: w },
      { path: b + "cardBorder", label: "Warna garis tepi kartu", type: "color", when: w },
      { path: b + "cardBorderOpacity", label: "Opasitas garis tepi", type: "range", min: 0, max: 1, step: 0.05, when: w },
      { path: b + "textColor", label: "Warna teks utama", type: "color", when: w },
      { path: b + "mutedColor", label: "Warna teks kecil", type: "color", when: w },
      { path: b + "linkColor", label: "Warna link (otomatis)", type: "color", when: w },
      { path: b + "followBg", label: "Tombol Follow — background", type: "color", when: w },
      { path: b + "followText", label: "Tombol Follow — teks", type: "color", when: w }
    ];
  }

  var ROW_BLANK = function () {
    return { type: "row", label: "Label", value: "Isi", tone: "soft", customMode: "solid", customColor1: "#1d1b3a", customColor2: "#3a2f7a",
      iconSize: 28, iconShape: "rounded", iconAlign: "right", maxIcons: 0, effect: "none", icons: [], span: "1",
      src: "", height: 120, fit: "cover", radius: 14, caption: "", text: "Teks", align: "left" };
  };
  var ITEM_TITLE = function (it, i) {
    var t = it.type === "image" ? "Gambar" : it.type === "text" ? "Teks" : "Baris";
    var d = it.label || (it.text ? String(it.text).slice(0, 18) : "");
    return t + " " + (i + 1) + (d ? " · " + d : "");
  };

  var SECTIONS = [
    /* ===== PROFIL ===== */
    { tab: "profil", title: "Profil", fields: [
      { path: "profile.name", label: "Nama", type: "text" },
      { path: "profile.username", label: "Username", type: "text", hint: "Contoh: @namakamu" },
      { path: "profile.description", label: "Bio", type: "textarea",
        hint: "Tekan Enter untuk baris baru. Beri 1 baris kosong untuk membuat paragraf baru." }
    ]},
    { tab: "profil", title: "Verified & label di samping nama", fields: [
      { path: "profile.verified", label: "Tampilkan ikon verified", type: "check" },
      { path: "profile.verifiedStyle", label: "Gaya ikon verified", type: "select",
        options: [["default", "Biru (default)"], ["white", "Putih"]] },
      { path: "profile.verifiedSize", label: "Ukuran ikon verified (px)", type: "range", min: 12, max: 60, step: 1 },
      { path: "profile.verifiedOffsetY", label: "Posisi ikon verified (↑ naik / ↓ turun, px)", type: "range", min: -30, max: 30, step: 1,
        hint: "Geser ikon verified ke atas (negatif) atau ke bawah (positif)." },
      { path: "profile.verifiedText", label: "Teks yang muncul di atas ikon saat diklik", type: "text",
        hint: "Di mode edit: arahkan kursor ke nama lalu klik teksnya, atau klik ikon verified." },
      { path: "profile.badgeAlign", label: "Perataan ikon & label di samping nama", type: "choice", cols: 2, options: [
        ["center", "Tengah (sejajar nama)"], ["top", "Atas"], ["bottom", "Bawah"], ["baseline", "Garis dasar teks"]] },
      { path: "profile.verifiedPos", label: "Urutan ikon verified", type: "select",
        options: [["before", "Sebelum label"], ["after", "Sesudah label"]] },
      { path: "profile.labels.show", label: "Tampilkan label / ikon tambahan", type: "check" }
    ], list: {
      path: "profile.labels.items", max: 5, itemName: "Label",
      title: function (it, i) { return "Label " + (i + 1) + (it.text ? " · " + it.text : ""); },
      blank: function () { return { text: "Freelancer", style: "pill", icon: "none", iconSrc: "", tint: true, size: 16,
        mode: "gradient", color1: "#7c5cff", color2: "#4f8bff", textColor: "#ffffff", offsetY: 0, tip: "Tersedia untuk proyek baru" }; },
      fields: function (b) {
        var custom = function () { return get(b + "icon") === "custom"; };
        var pill = function () { return get(b + "style") !== "icon"; };
        return [
          { path: b + "text", label: "Teks label (kosongkan bila hanya ikon)", type: "text" },
          { path: b + "style", label: "Tampilan", type: "choice", cols: 2, options: [["pill", "Pill + latar"], ["icon", "Hanya ikon"]] },
          { path: b + "icon", label: "Ikon", type: "select", options: PC.LABEL_ICONS },
          { type: "image", path: b + "iconSrc", label: "Upload ikon sendiri", icon: true, when: custom,
            hint: "PNG/SVG/JPG. Atau seret file ke kotak ini." },
          { path: b + "tint", label: "Warnai ikon mengikuti warna teks (matikan = warna asli)", type: "check", when: custom },
          { path: b + "size", label: "Ukuran ikon (px)", type: "range", min: 8, max: 48, step: 1 },
          { path: b + "mode", label: "Warna latar", type: "select", options: COLOR_MODES, when: pill },
          { path: b + "color1", label: "Warna latar 1", type: "color", when: pill },
          { path: b + "color2", label: "Warna latar 2", type: "color", when: function () { return pill() && get(b + "mode") === "gradient"; } },
          { path: b + "textColor", label: "Warna teks / ikon", type: "color" },
          { path: b + "offsetY", label: "Posisi (↑ naik / ↓ turun, px)", type: "range", min: -20, max: 20, step: 1 },
          { path: b + "tip", label: "Teks yang muncul saat diklik", type: "text", hint: "Kosongkan bila tidak ingin ada teks." }
        ];
      }
    }},
    { tab: "profil", title: "Foto profil & ring", fields: [
      { path: "theme.avatarRadius", label: "Bentuk foto profil (kotak → bulat)", type: "range", min: 0, max: 50, step: 1,
        presets: [["Kotak", 0], ["Tumpul", 18], ["Bulat", 50]], suffix: "%" },
      { path: "theme.avatarSize", label: "Ukuran foto profil (px)", type: "range", min: 56, max: 150, step: 2 },
      { path: "avatar.ring.show", label: "Aktifkan ring", type: "check" },
      { path: "avatar.ring.mode", label: "Warna ring", type: "select", options: COLOR_MODES, when: function () { return get("avatar.ring.show"); } },
      { path: "avatar.ring.color1", label: "Warna 1", type: "color", when: function () { return get("avatar.ring.show"); } },
      { path: "avatar.ring.color2", label: "Warna 2", type: "color", when: function () { return get("avatar.ring.show") && get("avatar.ring.mode") === "gradient"; } },
      { path: "avatar.ring.angle", label: "Arah gradient (derajat)", type: "range", min: 0, max: 360, step: 5, suffix: "°",
        when: function () { return get("avatar.ring.show") && get("avatar.ring.mode") === "gradient"; } },
      { path: "avatar.ring.width", label: "Tebal garis ring (px)", type: "range", min: 1, max: 12, step: 1, when: function () { return get("avatar.ring.show"); } },
      { path: "avatar.ring.gap", label: "Jarak ring ke foto (px)", type: "range", min: 0, max: 16, step: 1, when: function () { return get("avatar.ring.show"); } }
    ]},

    /* ===== BANNER ===== */
    { tab: "banner", title: "Banner", fields: [
      { path: "theme.bannerMode", label: "Isi banner", type: "select",
        options: [["image", "Gambar"], ["gradient", "Gradient"], ["solid", "Satu warna"]] },
      { path: "theme.bannerColor1", label: "Warna 1", type: "color", when: function () { return get("theme.bannerMode") !== "image"; } },
      { path: "theme.bannerColor2", label: "Warna 2", type: "color", when: isGrad("theme.bannerMode") },
      { path: "theme.bannerColor3", label: "Warna 3", type: "color", when: isGrad("theme.bannerMode") },
      { path: "theme.bannerAnimate", label: "Animasi gradient", type: "check", when: isGrad("theme.bannerMode") },
      { path: "theme.bannerSpeed", label: "Kecepatan (detik / siklus)", type: "range", min: 1, max: 20, step: 1, when: isGrad("theme.bannerMode") },
      { path: "theme.bannerHeight", label: "Tinggi banner (px)", type: "range", min: 100, max: 320, step: 2 },
      { path: "theme.bannerInset", label: "Jarak banner ke tepi kartu (px)", type: "range", min: 0, max: 20, step: 1, hint: "0 = banner penuh sampai tepi kartu." },
      { path: "theme.bannerRadiusMode", label: "Bentuk sudut banner", type: "select", options: [
        ["all", "Rounded 4 sisi"], ["bottom", "Rounded 2 sisi bawah saja"], ["top", "Rounded 2 sisi atas saja"],
        ["match", "Ikut bentuk card luar (atas ikut lengkung card)"], ["square", "Kotak (tanpa rounded)"], ["custom", "Bebas: atur tiap sudut"]] },
      { path: "theme.bannerRadius", label: "Radius sudut (px)", type: "range", min: 0, max: 60, step: 1, when: isOneOf("theme.bannerRadiusMode", ["all", "bottom", "top"]) },
      { path: "theme.bannerRadiusTL", label: "Kiri atas (px)", type: "range", min: 0, max: 60, step: 1, when: isOneOf("theme.bannerRadiusMode", ["custom"]) },
      { path: "theme.bannerRadiusTR", label: "Kanan atas (px)", type: "range", min: 0, max: 60, step: 1, when: isOneOf("theme.bannerRadiusMode", ["custom"]) },
      { path: "theme.bannerRadiusBR", label: "Kanan bawah (px)", type: "range", min: 0, max: 60, step: 1, when: isOneOf("theme.bannerRadiusMode", ["custom"]) },
      { path: "theme.bannerRadiusBL", label: "Kiri bawah (px)", type: "range", min: 0, max: 60, step: 1, when: isOneOf("theme.bannerRadiusMode", ["custom"]) },
      { path: "bookmark.show", label: "Tampilkan tombol simpan (bookmark)", type: "check" }
    ]},
    { tab: "banner", title: "Media sosial", fields: [
      { path: "socials.show", label: "Tampilkan ikon media sosial", type: "check" },
      { path: "socials.style", label: "Gaya ikon", type: "select", options: [["plain", "Polos"], ["glass", "Dalam kapsul kaca"]] },
      { path: "socials.size", label: "Ukuran ikon (px)", type: "range", min: 12, max: 44, step: 1 },
      { path: "socials.pos", label: "Template posisi", type: "choice", cols: 2, options: [
        ["bottom-right", "Kanan bawah"], ["bottom-center", "Tengah bawah"], ["after-avatar", "Di samping foto profil"], ["top-center", "Tengah atas"],
        ["center", "Tengah banner"], ["right-column", "Kolom kanan"], ["left-column", "Kolom kiri"], ["custom", "Bebas (hasil seret)"]],
        hint: "Di mode edit, seret ikon sosial langsung di preview untuk memindahkannya." },
      { path: "socials.direction", label: "Arah susunan ikon", type: "select", options: [["row", "Mendatar"], ["column", "Menurun"]] },
      { path: "socials.x", label: "Posisi horizontal (%)", type: "range", min: 0, max: 100, step: 1, when: isOneOf("socials.pos", ["custom"]) },
      { path: "socials.y", label: "Posisi vertikal (%)", type: "range", min: 0, max: 100, step: 1, when: isOneOf("socials.pos", ["custom"]) }
    ], list: {
      path: "socials.items", max: 6, itemName: "Ikon",
      title: function (it, i) { return "Ikon " + (i + 1) + " · " + (it.type === "custom" ? "sendiri" : it.type); },
      blank: function () { return { type: "github", url: "https://github.com" }; },
      fields: function (b) { return [
        { path: b + "type", label: "Platform", type: "select", options: PC.SOCIAL_TYPES },
        { path: b + "url", label: "Link", type: "text", hint: "https://… · mailto:… · tel:…" },
        { type: "image", path: b + "icon", label: "Ikon sendiri", icon: true, when: function () { return get(b + "type") === "custom"; },
          hint: "PNG/SVG/JPG transparan agar bisa diwarnai putih. Bisa juga seret file ke sini." },
        { path: b + "tint", label: "Warnai ikon mengikuti tema (matikan = warna asli gambar)", type: "check", when: function () { return get(b + "type") === "custom"; } }
      ]; }
    }},
    { tab: "banner", title: "Follow, Following & Followers", fields: [
      { path: "follow.show", label: "Tampilkan tombol Follow", type: "check" },
      { path: "follow.position", label: "Posisi tombol Follow", type: "select",
        options: [["below", "Di bawah banner (kanan)"], ["banner", "Di banner (sebelah ikon sosial)"]] },
      { path: "follow.text", label: "Teks tombol Follow", type: "text" },
      { path: "follow.doneText", label: "Teks setelah di-follow", type: "text" },
      { path: "follow.statsShow", label: "Tampilkan Following & Followers", type: "check" },
      { path: "follow.following", label: "Jumlah Following", type: "text" },
      { path: "follow.followingLabel", label: "Label Following", type: "text" },
      { path: "follow.followers", label: "Jumlah Followers", type: "text", hint: "Klik Follow di preview → angka Followers bertambah 1." },
      { path: "follow.followersLabel", label: "Label Followers", type: "text" }
    ]},

    /* ===== KONTEN ===== */
    { tab: "konten", title: "Link (di bawah Following/Followers)", fields: [
      { path: "links.show", label: "Tampilkan link", type: "check" }
    ], list: {
      path: "links.items", max: 5, itemName: "Link",
      title: function (it, i) { return "Link " + (i + 1) + (it.text ? " · " + it.text : ""); },
      blank: function () { return { text: "Portfolio", url: "https://", icon: "star", style: "pill", mode: "gradient", color1: "#7c5cff", color2: "#4f8bff", textColor: "#ffffff" }; },
      fields: function (b) { return [
        { path: b + "text", label: "Teks", type: "text" },
        { path: b + "url", label: "URL", type: "text", hint: "Kosongkan = pakai teks. Contoh: https://namakamu.com" },
        { path: b + "icon", label: "Ikon", type: "select", options: PC.LINK_ICONS },
        { path: b + "style", label: "Tampilan", type: "select", options: [["text", "Teks biasa"], ["pill", "Tombol (pill)"]] },
        { path: b + "mode", label: "Warna", type: "select",
          options: [["auto", "Otomatis (ikut tema)"], ["solid", "Solid (1 warna)"], ["gradient", "Gradient (2 warna)"]],
          hint: "Pada tombol, \"Otomatis\" dipakai sebagai solid dengan Warna 1." },
        { path: b + "color1", label: "Warna 1", type: "color", when: function () { return get(b + "mode") !== "auto" || get(b + "style") === "pill"; } },
        { path: b + "color2", label: "Warna 2", type: "color", when: isGrad(b + "mode") },
        { path: b + "textColor", label: "Warna teks tombol", type: "color", when: function () { return get(b + "style") === "pill"; } }
      ]; }
    }},
    { tab: "konten", title: "More Info (section yang terbuka ke bawah)", fields: [
      { path: "cta.show", label: "Tampilkan tombol More Info", type: "check" },
      { path: "cta.text", label: "Teks tombol", type: "text" },
      { path: "cta.defaultOpen", label: "Terbuka saat halaman dimuat", type: "check" },
      { path: "cta.shapeMode", label: "Warna bentuk tombol", type: "select",
        options: [["glass", "Glass morphism (awal)"], ["solid", "Solid"], ["gradient", "Gradient"]] },
      { path: "cta.shapeColor1", label: "Warna bentuk 1", type: "color", when: isOneOf("cta.shapeMode", ["solid", "gradient"]) },
      { path: "cta.shapeColor2", label: "Warna bentuk 2", type: "color", when: isGrad("cta.shapeMode") },
      { path: "cta.textMode", label: "Warna teks tombol", type: "select",
        options: [["auto", "Otomatis (ikut tema)"], ["solid", "Solid"], ["gradient", "Gradient"]] },
      { path: "cta.textColor1", label: "Warna teks 1", type: "color", when: isOneOf("cta.textMode", ["solid", "gradient"]) },
      { path: "cta.textColor2", label: "Warna teks 2", type: "color", when: isGrad("cta.textMode") }
    ], list: {
      path: "cta.sections", max: 6, itemName: "Section",
      title: function (it, i) { return "Section " + (i + 1) + (it.title ? " · " + it.title : ""); },
      blank: function () { return { title: "Judul", showTitle: true, titleAlign: "center", columns: 1, gap: 10, effect: "stagger", items: [ROW_BLANK()] }; },
      fields: function (b) { return [
        { path: b + "title", label: "Judul section", type: "text" },
        { path: b + "showTitle", label: "Tampilkan judul", type: "check" },
        { path: b + "titleAlign", label: "Posisi judul", type: "choice", cols: 3, options: ALIGN3 },
        { path: b + "titleColor", label: "Warna teks judul", type: "coloropt" },
        { path: b + "columns", label: "Layout kolom", type: "choice", cols: 3, options: [["1", "1 kolom"], ["2", "2 kolom"], ["3", "3 kolom"]] },
        { path: b + "gap", label: "Jarak antar item (px)", type: "range", min: 0, max: 30, step: 1 },
        { path: b + "effect", label: "Efek muncul saat dibuka", type: "select",
          options: [["none", "Tanpa efek"], ["fade", "Fade"], ["stagger", "Naik bergantian (stagger)"]] },
        { type: "list", spec: {
          path: b + "items", max: 12, itemName: "Item", title: ITEM_TITLE, blank: ROW_BLANK,
          fields: function (ib) {
            var row = isType(ib, ["row"]), img = isType(ib, ["image"]), txt = isType(ib, ["text"]);
            return [
              { path: ib + "type", label: "Jenis item", type: "choice", cols: 3, options: [["row", "Baris"], ["image", "Gambar"], ["text", "Teks"]] },
              /* baris */
              { path: ib + "label", label: "Label", type: "text", when: row },
              { path: ib + "labelColor", label: "Warna teks label", type: "coloropt", when: row },
              { path: ib + "value", label: "Isi teks (kanan)", type: "text", when: row },
              { path: ib + "valueColor", label: "Warna teks isi", type: "coloropt", when: row },
              { path: ib + "tone", label: "Gaya latar baris", type: "select", when: row, options: [
                ["soft", "Lembut"], ["dark", "Gelap"], ["glass", "Glass"], ["none", "Tanpa latar"], ["custom", "Warna sendiri"]] },
              { path: ib + "customMode", label: "Warna latar", type: "select", options: COLOR_MODES,
                when: function () { return row() && get(ib + "tone") === "custom"; } },
              { path: ib + "customColor1", label: "Warna latar 1", type: "color", when: function () { return row() && get(ib + "tone") === "custom"; } },
              { path: ib + "customColor2", label: "Warna latar 2", type: "color",
                when: function () { return row() && get(ib + "tone") === "custom" && get(ib + "customMode") === "gradient"; } },
              { path: ib + "iconAlign", label: "Posisi isi / ikon", type: "choice", cols: 3, options: ALIGN3, when: row },
              { path: ib + "iconSize", label: "Ukuran ikon (px)", type: "range", min: 14, max: 64, step: 1, when: row },
              { path: ib + "iconShape", label: "Bentuk ikon", type: "select", when: row,
                options: [["rounded", "Rounded"], ["circle", "Bulat"], ["square", "Kotak"], ["tile", "Tile (dengan latar)"]] },
              { path: ib + "maxIcons", label: "Ikon yang tampil (0 = semua)", type: "range", min: 0, max: 12, step: 1, when: row,
                hint: "Sisanya jadi badge “3+” yang bisa diklik untuk membuka semua." },
              { path: ib + "effect", label: "Efek hover ikon", type: "select", when: row,
                options: [["none", "Tanpa efek"], ["lift", "Naik"], ["zoom", "Zoom"], ["glow", "Glow"]] },
              { type: "multiupload", path: ib + "icons", label: "Tambah ikon", when: row },
              { type: "list", when: row, spec: {
                path: ib + "icons", max: 24, itemName: "Ikon",
                title: function (it, i) { return "Ikon " + (i + 1) + (it.name ? " · " + it.name : ""); },
                blank: function () { return { src: "", name: "", url: "" }; },
                fields: function (kb) { return [
                  { type: "image", path: kb + "src", label: "Gambar ikon", icon: true },
                  { path: kb + "name", label: "Nama (muncul saat kursor di atas ikon)", type: "text" },
                  { path: kb + "url", label: "Link (opsional)", type: "text" }
                ]; }
              }},
              /* gambar */
              { type: "image", path: ib + "src", label: "Gambar", photo: true, when: img, hint: "Atau seret file ke kotak ini." },
              { path: ib + "height", label: "Tinggi gambar (px)", type: "range", min: 40, max: 320, step: 2, when: img },
              { path: ib + "fit", label: "Pas gambar", type: "select", options: [["cover", "Penuhi (crop)"], ["contain", "Utuh (contain)"]], when: img },
              { path: ib + "radius", label: "Sudut gambar (px)", type: "range", min: 0, max: 40, step: 1, when: img },
              { path: ib + "caption", label: "Keterangan gambar", type: "text", when: img },
              { path: ib + "color", label: "Warna keterangan", type: "coloropt", when: img },
              /* teks */
              { path: ib + "text", label: "Isi teks", type: "textarea", when: txt },
              { path: ib + "color", label: "Warna teks", type: "coloropt", when: txt },
              { path: ib + "align", label: "Perataan", type: "choice", cols: 3, options: ALIGN3, when: function () { return txt() || img(); } },
              /* umum */
              { path: ib + "span", label: "Lebar di layout kolom", type: "choice", cols: 2, options: [["1", "1 kolom"], ["all", "Penuh"]] },
              { type: "moveto", base: ib }
            ];
          }
        }}
      ]; }
    }, after: [
      { path: "cta.actionShow", label: "Tampilkan tombol aksi di bawah section", type: "check" },
      { path: "cta.actionText", label: "Teks tombol aksi", type: "text" },
      { path: "cta.actionUrl", label: "Link tombol aksi", type: "text", hint: "https://wa.me/62812…  ·  mailto:email@domain.com" },
      { path: "cta.actionIndex", label: "Posisi tombol aksi", type: "select", options: [["0", "Paling atas"], ["1", "Setelah section 1"], ["2", "Setelah section 2"],
        ["3", "Setelah section 3"], ["4", "Setelah section 4"], ["5", "Setelah section 5"], ["99", "Paling bawah"]],
        hint: "Di mode edit, tombol aksi juga bisa diseret langsung di preview." }
    ]},
    { tab: "konten", title: "Copyright", fields: [
      { path: "copyright.show", label: "Tampilkan copyright", type: "check" },
      { path: "copyright.text", label: "Teks copyright", type: "text" },
      { path: "copyright.align", label: "Posisi teks", type: "choice", cols: 3, options: ALIGN3 },
      { path: "copyright.placement", label: "Letak", type: "choice", cols: 2, options: [["always", "Selalu di bawah kartu"], ["inside", "Di dalam panel More Info"]] },
      { path: "copyright.size", label: "Ukuran teks (px)", type: "range", min: 9, max: 18, step: 1 }
    ]},
    { tab: "konten", title: "Susunan blok (drag & drop)", custom: "order" },

    /* ===== TEMA ===== */
    { tab: "tema", title: "Tema & font", fields: [
      { path: "theme.mode", label: "Tema awal", type: "select",
        options: [["dark", "Gelap"], ["light", "Terang"], ["system", "Ikuti sistem perangkat"]],
        hint: "Pengunjung bisa mengganti lewat ikon matahari/bulan di pojok kiri atas banner." },
      { path: "theme.fontFamily", label: "Font", type: "select", options: PC.FONTS, hint: "Dimuat dari Google Fonts (perlu internet)." },
      { path: "theme.accent", label: "Warna aksen (tombol simpan)", type: "color" }
    ]},
    { tab: "tema", title: "Palet warna", head: "palette", fields: [].concat(paletteFields("light"), paletteFields("dark")) },
    { tab: "tema", title: "Background halaman", fields: [
      { path: "theme.bgMode", label: "Jenis background", type: "select",
        options: [["orbs", "Glass (orb warna blur)"], ["image", "Gambar upload"], ["solid", "Satu warna"]] },
      { type: "image", key: "background", path: "assets.background", label: "Upload gambar background",
        hint: "JPG/PNG. Otomatis mengaktifkan jenis \"Gambar upload\". Bisa juga seret file ke sini.", when: isOneOf("theme.bgMode", ["image"]) },
      { path: "theme.bgBlur", label: "Blur gambar (px)", type: "range", min: 0, max: 30, step: 1, when: isOneOf("theme.bgMode", ["image"]) },
      { path: "theme.bgDim", label: "Gelapkan gambar", type: "range", min: 0, max: 0.8, step: 0.05, when: isOneOf("theme.bgMode", ["image"]) },
      { path: "theme.orbAnimate", label: "Animasikan orb", type: "check", when: isOneOf("theme.bgMode", ["orbs"]) },
      { path: "theme.glassBlur", label: "Blur kaca pada kartu (px)", type: "range", min: 0, max: 40, step: 1 }
    ]},
    { tab: "tema", title: "Bentuk kartu", fields: [
      { path: "theme.cardWidth", label: "Lebar kartu (px)", type: "range", min: 240, max: 480, step: 5 },
      { path: "theme.cardRadius", label: "Sudut kartu (px)", type: "range", min: 0, max: 48, step: 1 },
      { path: "theme.cardBorderWidth", label: "Tebal garis tepi kartu (px)", type: "range", min: 0, max: 6, step: 1 },
      { path: "theme.shadow", label: "Bayangan kartu", type: "check" }
    ]},

    { tab: "konten", title: "Header & Footer situs", fields: [
      { path: "site.header", label: "Tampilkan header (menu atas)", type: "check" },
      { path: "site.footer", label: "Tampilkan footer (bawah)", type: "check",
        hint: "Header/footer dimuat dari komponen eksternal, jadi hasilnya terlihat di index.html (tombol “Buka index”), bukan di preview ini. Jika keduanya OFF, komponen tidak dimuat sama sekali." }
    ]},

    /* ===== ASET ===== */
    { tab: "aset", title: "Semua gambar", custom: "images" },
    { tab: "aset", title: "Info halaman (tab browser & SEO)", fields: [
      { path: "meta.title", label: "Judul tab", type: "text" },
      { path: "meta.description", label: "Deskripsi", type: "textarea" },
      { path: "meta.lang", label: "Kode bahasa", type: "text", hint: "id, en, …" },
      { path: "meta.siteUrl", label: "Alamat website (untuk link preview)", type: "text", hint: "Contoh: https://fikrisaputra.com/ — dipakai membuat URL penuh og:image di menu “Salin tag <head>”." }
    ]}
  ];

  /* ---------- helpers UI ---------- */
  var toastTimer;
  function toast(msg) {
    var t = $("#toast");
    t.textContent = msg;
    t.classList.add("show");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { t.classList.remove("show"); }, 2200);
  }

  function setStatus(msg, err) {
    statusEl.textContent = msg;
    statusEl.classList.toggle("err", !!err);
  }

  function h(tag, attrs, kids) {
    var n = document.createElement(tag);
    Object.keys(attrs || {}).forEach(function (k) {
      var v = attrs[k];
      if (v == null || v === false) return;
      if (k === "text") n.textContent = v; else n.setAttribute(k, v === true ? "" : v);
    });
    (kids || []).forEach(function (c) { if (c) n.appendChild(c); });
    return n;
  }

  var uid = 0;
  function nextId() { return "f" + (++uid); }

  /* ---------- state, draft & riwayat (undo / redo) ---------- */
  var saveTimer, histTimer, restoring = false;
  var hist = [JSON.stringify(cfg)], hi = 0;

  function updateHistUI() {
    $("#btnUndo").disabled = hi <= 0 && !histTimer;
    $("#btnRedo").disabled = hi >= hist.length - 1;
  }
  function pushHistory() {
    if (restoring) return;
    clearTimeout(histTimer);
    histTimer = setTimeout(flushHistory, 450);
    updateHistUI();
  }
  function flushHistory() {
    if (!histTimer) return;
    clearTimeout(histTimer); histTimer = null;
    var s = JSON.stringify(cfg);
    if (s !== hist[hi]) {
      hist = hist.slice(0, hi + 1);
      hist.push(s);
      if (hist.length > 80) hist.shift();
      hi = hist.length - 1;
    }
    updateHistUI();
  }
  function restoreHistory(toast_) {
    restoring = true;
    cfg = JSON.parse(hist[hi]);
    refresh();
    rebuildPanel();
    restoring = false;
    updateHistUI();
    toast(toast_);
  }
  function undo() { flushHistory(); if (hi > 0) { hi--; restoreHistory("Undo"); } }
  function redo() { flushHistory(); if (hi < hist.length - 1) { hi++; restoreHistory("Redo"); } }

  function scheduleSave() {
    clearTimeout(saveTimer);
    saveTimer = setTimeout(function () {
      var ok = PC.saveDraft(cfg);
      setStatus(ok ? "Draft tersimpan di browser ini (buka index dengan tombol “Buka index”)."
                   : "Gagal menyimpan draft (storage penuh?). Gunakan Export ZIP.", !ok);
    }, 250);
    pushHistory();
  }

  function refresh() {
    PC.applyTheme(shell, cfg);
    PC.render(cardEl, cfg);
    PC.applyMeta(cfg);
    document.title = "Studio — " + (cfg.profile.name || "Profile Card");
    scheduleSave();
  }

  function setValue(path, val, opts) {
    PC.setPath(cfg, path, val);
    // Mengubah "Tema awal" -> preview langsung pakai tema itu
    if (path === "theme.mode") PC.runtime.mode = null;
    // Mengubah warna terang/gelap -> preview pindah ke tema yang sedang diedit
    var m = /^theme\.(light|dark)\./.exec(path);
    if (m) { PC.runtime.mode = m[1]; ui.palette = m[1]; }
    if (path === "cta.defaultOpen") PC.runtime.open = null;
    if (opts && opts.noRender) { PC.applyMeta(cfg); scheduleSave(); }
    else refresh();
    updateWhen();
    if (!opts || !opts.keepPanel) syncPanel(); else syncSegments();
  }

  /* ---------- builder form ---------- */
  var whenList = [];
  var choices = [];
  var orderBox = null;
  var searchEl = $("#search");

  function updateWhen() {
    whenList = whenList.filter(function (w) { return w.node.isConnected; });
    whenList.forEach(function (w) {
      var show = true;
      try { show = !!w.fn(); } catch (e) {}
      w.node.classList.toggle("hidden", !show);
    });
  }

  function fieldControl(f) {
    var node;
    if (f.type === "image") node = imageField(f);
    else if (f.type === "multiupload") node = multiUpload(f);
    else if (f.type === "list") node = buildList(f.spec);
    else if (f.type === "moveto") node = moveControl(f);
    else node = baseControl(f);
    if (f.when) {
      whenList.push({ node: node, fn: f.when });
      node._whenFn = f.when;
    }
    return node;
  }

  function baseControl(f) {
    var id = nextId();
    var path = f.path;
    var wrap, input;

    if (f.type === "check") {
      input = h("input", { type: "checkbox", id: id, "data-path": path });
      input.addEventListener("change", function () { setValue(path, input.checked, { keepPanel: true }); });
      wrap = h("div", { class: "field check" }, [input, h("label", { for: id, text: f.label })]);
      return wrap;
    }

    var ctrl, extra = null;
    if (f.type === "text") {
      input = h("input", { type: "text", id: id, "data-path": path, autocomplete: "off" });
      input.addEventListener("input", function () { setValue(path, input.value, { keepPanel: true }); });
      ctrl = input;
    } else if (f.type === "textarea") {
      input = h("textarea", { id: id, "data-path": path, rows: "4" });
      input.addEventListener("input", function () { setValue(path, input.value, { keepPanel: true }); });
      ctrl = input;
    } else if (f.type === "select") {
      input = h("select", { id: id, "data-path": path }, f.options.map(function (o) { return h("option", { value: o[0], text: o[1] }); }));
      input.addEventListener("change", function () { setValue(path, input.value, { keepPanel: true }); });
      ctrl = input;
    } else if (f.type === "range") {
      input = h("input", { type: "range", id: id, "data-path": path, min: f.min, max: f.max, step: f.step });
      var out = h("output", { for: id });
      input.addEventListener("input", function () {
        out.textContent = input.value + (f.suffix || "");
        setValue(path, parseFloat(input.value), { keepPanel: true });
      });
      input._out = out;
      input._suffix = f.suffix || "";
      ctrl = h("div", { class: "range-row" }, [input, out]);
      if (f.presets) {
        extra = h("div", { class: "preset-row" }, f.presets.map(function (pr) {
          var b = h("button", { type: "button", class: "btn", text: pr[0] });
          b.addEventListener("click", function () { setValue(path, pr[1]); });
          return b;
        }));
      }
    } else if (f.type === "choice") {
      var grp = h("div", { class: "choice", style: "grid-template-columns:repeat(" + (f.cols || 2) + ",1fr)" });
      f.options.forEach(function (o) {
        var bt = h("button", { type: "button", "data-val": o[0], text: o[1] });
        bt.addEventListener("click", function () { setValue(path, o[0]); });
        grp.appendChild(bt);
      });
      grp._path = path;
      choices.push(grp);
      ctrl = grp;
    } else if (f.type === "coloropt") {
      // warna opsional: kosong = ikut tema
      input = h("input", { type: "color", id: id, "data-path": path, "aria-label": f.label });
      var hexo = h("input", { type: "text", "data-path-hex": path, maxlength: "7", spellcheck: "false", placeholder: "ikut tema", "aria-label": f.label + " (hex)" });
      var rst = h("button", { type: "button", class: "btn", text: "Default", title: "Kembali ke warna tema" });
      input.addEventListener("input", function () { hexo.value = input.value; setValue(path, input.value, { keepPanel: true }); });
      hexo.addEventListener("input", function () {
        var v = hexo.value.trim();
        if (v === "") { setValue(path, "", { keepPanel: true }); return; }
        if (v[0] !== "#") v = "#" + v;
        if (/^#[0-9a-f]{6}$/i.test(v)) { input.value = v.toLowerCase(); setValue(path, v.toLowerCase(), { keepPanel: true }); }
      });
      rst.addEventListener("click", function () { setValue(path, ""); });
      ctrl = h("div", { class: "color-row" }, [input, hexo, rst]);
    } else if (f.type === "color") {
      input = h("input", { type: "color", id: id, "data-path": path, "aria-label": f.label });
      var hex = h("input", { type: "text", "data-path-hex": path, maxlength: "7", spellcheck: "false", "aria-label": f.label + " (hex)" });
      input.addEventListener("input", function () { hex.value = input.value; setValue(path, input.value, { keepPanel: true }); });
      hex.addEventListener("input", function () {
        var v = hex.value.trim();
        if (v && v[0] !== "#") v = "#" + v;
        if (/^#[0-9a-f]{6}$/i.test(v)) { input.value = v.toLowerCase(); setValue(path, v.toLowerCase(), { keepPanel: true }); }
      });
      ctrl = h("div", { class: "color-row" }, [input, hex]);
    }

    return h("div", { class: "field" }, [
      h("label", { for: id, text: f.label }),
      ctrl,
      extra,
      f.hint ? h("small", { text: f.hint }) : null
    ]);
  }

  /* ---------- drop file ke elemen ---------- */
  function isFileDrag(e) {
    var t = e.dataTransfer && e.dataTransfer.types;
    return !!t && Array.prototype.indexOf.call(t, "Files") !== -1;
  }
  function enableDrop(node, onFiles) {
    node.addEventListener("dragover", function (e) {
      if (!isFileDrag(e)) return;
      e.preventDefault(); e.stopPropagation();
      e.dataTransfer.dropEffect = "copy";
      node.classList.add("dropping");
    });
    node.addEventListener("dragleave", function (e) {
      if (!node.contains(e.relatedTarget)) node.classList.remove("dropping");
    });
    node.addEventListener("drop", function (e) {
      if (!isFileDrag(e)) return;
      e.preventDefault(); e.stopPropagation();
      node.classList.remove("dropping");
      if (e.dataTransfer.files && e.dataTransfer.files.length) onFiles(e.dataTransfer.files);
    });
  }

  /* field gambar: thumbnail + path/URL + Upload + Reset (+ seret file ke sini) */
  function imageField(f) {
    var path = f.path;
    var key = f.key || null;                    // kunci aset (assets.*) atau null = ikon / gambar bebas
    var kind = f.photo ? "photo" : "icon";
    var id = nextId();
    var thumb = h("img", { alt: "", "data-thumb": path });
    var txt = h("input", { type: "text", id: id, "data-path": path, spellcheck: "false", autocomplete: "off" });
    txt.addEventListener("input", function () { setValue(path, txt.value.trim(), { keepPanel: true }); updateThumbs(); });
    var up = h("button", { type: "button", class: "btn", text: "Upload" });
    up.addEventListener("click", function () { pickImage(key, null, path, kind); });
    var rs = h("button", { type: "button", class: "btn", text: key ? "Reset" : "Hapus" });
    rs.addEventListener("click", function () {
      setValue(path, key ? (DEFAULTS.assets[key] || "") : "");
      updateThumbs();
    });
    var wrap = h("div", { class: "field" }, [
      h("label", { for: id, text: f.label }),
      h("div", { class: "img-row" }, [
        h("div", { class: "thumbbox" }, [thumb]),
        txt,
        h("div", { class: "btns" }, [up, rs])
      ]),
      f.hint ? h("small", { text: f.hint }) : null
    ]);
    enableDrop(wrap, function (files) { applyImageFile(files[0], key, path, kind); });
    return wrap;
  }

  /* upload banyak ikon sekaligus (klik atau seret banyak file) */
  function multiUpload(f) {
    var input = h("input", { type: "file", accept: "image/*", multiple: true, hidden: true });
    var btn = h("button", { type: "button", class: "btn primary mini", text: "Pilih gambar…" });
    var zone = h("div", { class: "dropzone" }, [h("div", { text: "Seret banyak gambar ke sini, atau" }), btn, input]);
    function addFiles(files) {
      var arr = Array.prototype.slice.call(files).filter(function (x) { return /^image\//.test(x.type); });
      if (!arr.length) { toast("Tidak ada file gambar"); return; }
      Promise.all(arr.map(function (file) {
        return processImage(file, ICON_SPEC).then(function (d) { return { src: d, name: file.name.replace(/\.[^.]+$/, ""), url: "" }; });
      })).then(function (list) {
        var cur = get(f.path);
        if (!Array.isArray(cur)) { PC.setPath(cfg, f.path, []); cur = get(f.path); }
        list.forEach(function (x) { cur.push(x); });
        refresh(); rebuildPanel();
        toast(list.length + " ikon ditambahkan");
      }).catch(function () { toast("Gagal membaca gambar"); });
    }
    btn.addEventListener("click", function () { input.click(); });
    input.addEventListener("change", function () { if (input.files && input.files.length) addFiles(input.files); input.value = ""; });
    enableDrop(zone, addFiles);
    return h("div", { class: "field" }, [h("label", { text: f.label }), zone]);
  }

  function buildImages() {
    var box = h("div", { class: "sec-body" });
    IMAGE_FIELDS.forEach(function (f) {
      box.appendChild(imageField({ key: f.key, path: "assets." + f.key, label: f.label, hint: f.hint }));
    });
    return box;
  }

  /* ---------- drag & drop berbasis pointer (mouse & layar sentuh) ---------- */
  var dropLine = h("div", { class: "drop-line" });
  dropLine.hidden = true;
  document.body.appendChild(dropLine);

  /* Cari posisi sisip terdekat — mendukung daftar vertikal MAUPUN grid (2–3 kolom).
     opts.raw = true  -> onDrop(from, posisiSisip) apa adanya (dipakai untuk pindah antar-section) */
  function startSort(e, itemsFn, fromIdx, onDrop, opts) {
    if (e.button !== undefined && e.button !== 0) return;
    e.preventDefault();
    opts = opts || {};
    var idx = fromIdx;
    document.body.classList.add("sorting");
    function place(ev) {
      var items = itemsFn();
      if (!items.length) return;
      var rects = items.map(function (n) { return n.getBoundingClientRect(); });
      var best = 0, bd = Infinity;
      rects.forEach(function (r, k) {
        var dx = ev.clientX < r.left ? r.left - ev.clientX : ev.clientX > r.right ? ev.clientX - r.right : 0;
        var dy = ev.clientY < r.top ? r.top - ev.clientY : ev.clientY > r.bottom ? ev.clientY - r.bottom : 0;
        var d = dx * dx + dy * dy;
        if (d < bd) { bd = d; best = k; }
      });
      var r = rects[best], cy = r.top + r.height / 2;
      var sideBySide = rects.some(function (o, k) {
        return k !== best && Math.abs(o.top + o.height / 2 - cy) < Math.min(o.height, r.height) / 2 && (o.left >= r.right - 2 || o.right <= r.left + 2);
      });
      var after = sideBySide ? ev.clientX > r.left + r.width / 2 : ev.clientY > cy;
      idx = best + (after ? 1 : 0);
      dropLine.hidden = false;
      if (sideBySide) {
        dropLine.style.width = "3px"; dropLine.style.height = r.height + "px";
        dropLine.style.top = r.top + "px";
        dropLine.style.left = (after ? r.right + 3 : r.left - 6) + "px";
      } else {
        dropLine.style.height = "3px"; dropLine.style.width = r.width + "px";
        dropLine.style.left = r.left + "px";
        dropLine.style.top = (after ? r.bottom + 2 : r.top - 4) + "px";
      }
    }
    function done() {
      document.removeEventListener("pointermove", place);
      document.removeEventListener("pointerup", up);
      document.removeEventListener("pointercancel", up);
      dropLine.hidden = true;
      dropLine.style.width = ""; dropLine.style.height = "";
      document.body.classList.remove("sorting");
    }
    function up() {
      done();
      if (opts.raw) { if (idx !== fromIdx && idx !== fromIdx + 1) onDrop(fromIdx, idx); return; }
      if (idx !== fromIdx && idx !== fromIdx + 1) onDrop(fromIdx, idx > fromIdx ? idx - 1 : idx);
    }
    document.addEventListener("pointermove", place);
    document.addEventListener("pointerup", up);
    document.addEventListener("pointercancel", up);
    place(e);
  }

  /* pindahkan item More Info ke section lain (atau ke posisi tertentu) */
  function moveItem(sFrom, jFrom, sTo, jTo) {
    var secs = get("cta.sections") || [];
    var src = secs[sFrom] && secs[sFrom].items, dst = secs[sTo] && secs[sTo].items;
    if (!src || !dst || !src[jFrom]) return;
    var it = src.splice(jFrom, 1)[0];
    if (jTo == null || jTo > dst.length) jTo = dst.length;
    if (sFrom === sTo && jFrom < jTo) jTo--;
    dst.splice(Math.max(0, jTo), 0, it);
    setValue("cta.sections", secs);
    rebuildPanel();
  }

  /* dropdown "Pindahkan ke section …" di tiap item */
  function moveControl(f) {
    var m = /^cta\.sections\.(\d+)\.items\.(\d+)\.$/.exec(f.base);
    var node = h("div", { class: "field" });
    if (!m) return node;
    var S = parseInt(m[1], 10), J = parseInt(m[2], 10);
    var secs = get("cta.sections") || [];
    if (secs.length < 2) { node.hidden = true; return node; }
    var sel = h("select", {}, [h("option", { value: "", text: "Pindahkan ke section…" })].concat(
      secs.map(function (sc, i) { return i === S ? null : h("option", { value: String(i), text: "Section " + (i + 1) + (sc.title ? " · " + sc.title : "") }); })));
    sel.addEventListener("change", function () { if (sel.value !== "") moveItem(S, J, parseInt(sel.value, 10), null); });
    node.appendChild(h("label", { text: "Pindah item ini" }));
    node.appendChild(sel);
    return node;
  }

  /* daftar yang bisa ditambah / dihapus / diurutkan (bisa bersarang) */
  function buildList(spec) {
    var box = h("div", { class: "list-box" });
    box._spec = spec;
    var arr = PC.getPath(cfg, spec.path) || [];
    function reorder(from, to) {
      var a = PC.getPath(cfg, spec.path);
      if (to < 0 || to >= a.length || from === to) return;
      a.splice(to, 0, a.splice(from, 1)[0]);
      refresh(); rebuildList(box, spec);
    }
    arr.forEach(function (item, i) {
      var base = spec.path + "." + i + ".";
      var grip = h("span", { class: "grip", title: "Seret untuk mengubah urutan", text: "⠿" });
      var up = h("button", { type: "button", class: "mv", title: "Naikkan", text: "↑" });
      var dn = h("button", { type: "button", class: "mv", title: "Turunkan", text: "↓" });
      var rm = h("button", { type: "button", class: "link-btn", text: "Hapus" });
      up.addEventListener("click", function () { reorder(i, i - 1); });
      dn.addEventListener("click", function () { reorder(i, i + 1); });
      rm.addEventListener("click", function () {
        PC.getPath(cfg, spec.path).splice(i, 1);
        refresh(); rebuildList(box, spec);
      });
      grip.addEventListener("pointerdown", function (e) {
        startSort(e, function () { return $$(":scope > .list-card", box); }, i, reorder);
      });
      var ttl = spec.title ? spec.title(item || {}, i) : spec.itemName + " " + (i + 1);
      var card = h("div", { class: "list-card", "data-list-item": spec.path + "." + i }, [
        h("header", {}, [h("span", { class: "ttl" }, [grip, h("span", { text: ttl })]), h("span", { class: "hbtns" }, [up, dn, rm])])
      ].concat(spec.fields(base).map(fieldControl)));
      box.appendChild(card);
    });
    if (arr.length < spec.max) {
      var add = h("button", { type: "button", class: "btn", text: "+ Tambah " + spec.itemName.toLowerCase() });
      add.addEventListener("click", function () {
        if (!PC.getPath(cfg, spec.path)) PC.setPath(cfg, spec.path, []);
        PC.getPath(cfg, spec.path).push(spec.blank());
        refresh(); rebuildList(box, spec);
      });
      box.appendChild(add);
    } else {
      box.appendChild(h("small", { text: "Maksimal " + spec.max + " " + spec.itemName.toLowerCase() + "." }));
    }
    return box;
  }

  function rebuildList(box, spec) {
    var nu = buildList(spec);
    if (box._whenFn) { nu._whenFn = box._whenFn; whenList.push({ node: nu, fn: box._whenFn }); }
    if (box.dataset.ftext) nu.dataset.ftext = box.dataset.ftext;
    box.parentNode.replaceChild(nu, box);
    syncPanel();
  }

  /* bagian "Susunan blok": urutan nama / username / bio / stats / link / More Info */
  function buildOrder() {
    var box = h("div", { class: "sec-body order-box" });
    function draw() {
      box.textContent = "";
      box.appendChild(h("small", { text: "Seret ⠿ (atau pakai ↑↓) untuk mengubah susunan. Di mode edit kamu juga bisa menyeret blok langsung di preview." }));
      var order = PC.normalizeOrder(cfg.layout && cfg.layout.order);
      var names = {};
      PC.BLOCKS.forEach(function (b) { names[b[0]] = b[1]; });
      function move(from, to) {
        if (to < 0 || to >= order.length) return;
        order.splice(to, 0, order.splice(from, 1)[0]);
        if (!cfg.layout) cfg.layout = {};
        setValue("layout.order", order.slice());
        draw();
      }
      order.forEach(function (k, i) {
        var grip = h("span", { class: "grip", title: "Seret", text: "⠿" });
        var up = h("button", { type: "button", class: "mv", text: "↑", title: "Naikkan" });
        var dn = h("button", { type: "button", class: "mv", text: "↓", title: "Turunkan" });
        var row = h("div", { class: "sort-row" }, [grip, h("span", { class: "nm", text: names[k] }), up, dn]);
        up.addEventListener("click", function () { move(i, i - 1); });
        dn.addEventListener("click", function () { move(i, i + 1); });
        grip.addEventListener("pointerdown", function (e) {
          startSort(e, function () { return $$(".sort-row", box); }, i, move);
        });
        box.appendChild(row);
      });
    }
    box._draw = draw;
    draw();
    return box;
  }

  /* ---------- panel bertab ---------- */
  function paletteHead() {
    var seg = h("div", { class: "segmented", "data-seg": "palette" });
    [["light", "☀ Terang"], ["dark", "☾ Gelap"]].forEach(function (o) {
      var b = h("button", { type: "button", "data-val": o[0], text: o[1] });
      b.addEventListener("click", function () {
        ui.palette = o[0];
        PC.runtime.mode = o[0];
        refresh();
        updateWhen(); syncSegments();
      });
      seg.appendChild(b);
    });
    return h("div", { class: "field" }, [
      h("label", { text: "Edit palet untuk tema" }), seg,
      h("small", { text: "Preview otomatis pindah ke tema yang sedang diedit." })
    ]);
  }

  function syncSegments() {
    $$('[data-seg="palette"] button', formEl).forEach(function (b) { b.classList.toggle("on", b.getAttribute("data-val") === ui.palette); });
  }

  function buildRail() {
    var rail = $("#rail");
    if (rail.children.length) return;
    TABS.forEach(function (t) {
      var b = h("button", { class: "rail-btn", type: "button", "data-tab": t.id, title: t.label });
      b.innerHTML = '<svg viewBox="0 0 24 24" aria-hidden="true">' + t.icon + "</svg><span>" + t.label + "</span>";
      b.addEventListener("click", function () {
        if (searchEl.value) { searchEl.value = ""; applySearch(""); }
        showTab(t.id);
      });
      rail.appendChild(b);
    });
  }

  function showTab(id, keepScroll) {
    ui.tab = id;
    $$(".tabpane", formEl).forEach(function (p) { p.classList.toggle("active", p.getAttribute("data-tab") === id); });
    $$(".rail-btn").forEach(function (b) { b.classList.toggle("on", b.getAttribute("data-tab") === id); });
    var t = TABS.filter(function (x) { return x.id === id; })[0];
    if (t) $("#panelTitle").textContent = t.label;
    if (!keepScroll) scrollEl.scrollTop = 0;
    updateToggleAll();
  }

  function activeSections() {
    return $$('.tabpane.active > details.sec', formEl);
  }
  function updateToggleAll() {
    var any = activeSections().some(function (d) { return d.open; });
    $("#btnToggleAll").textContent = any ? "Tutup semua" : "Buka semua";
  }
  $("#btnToggleAll").addEventListener("click", function () {
    var secs = activeSections();
    var open = !secs.some(function (d) { return d.open; });
    secs.forEach(function (d) { d.open = open; });
    updateToggleAll();
  });

  function buildPanel() {
    formEl.textContent = "";
    whenList = []; choices = []; orderBox = null;
    TABS.forEach(function (t) { formEl.appendChild(h("div", { class: "tabpane", "data-tab": t.id })); });
    var firstOfTab = {};
    SECTIONS.forEach(function (sec) {
      var pane = $('.tabpane[data-tab="' + sec.tab + '"]', formEl);
      var d = h("details", { class: "sec", "data-title": sec.title.toLowerCase() }, [h("summary", { text: sec.title })]);
      if (!firstOfTab[sec.tab]) { firstOfTab[sec.tab] = true; d.setAttribute("open", ""); }
      var searchHay = sec.title.toLowerCase();
      if (sec.custom === "images") {
        var ib = buildImages();
        $$(".field", ib).forEach(function (n) { n.dataset.ftext = n.textContent.toLowerCase(); });
        d.appendChild(ib);
      } else if (sec.custom === "order") {
        orderBox = buildOrder();
        orderBox.dataset.ftext = "susunan urutan blok drag drop";
        d.appendChild(orderBox);
      } else {
        var body = h("div", { class: "sec-body" });
        if (sec.head === "palette") body.appendChild(paletteHead());
        (sec.fields || []).forEach(function (f) {
          var n = fieldControl(f);
          n.dataset.ftext = ((f.label || "") + " " + (f.hint || "") + " " + (f.path || "")).toLowerCase();
          body.appendChild(n);
        });
        if (sec.list) {
          var lb = buildList(sec.list);
          var lab = [];
          try { sec.list.fields("x.").forEach(function (f) { lab.push(f.label || ""); }); } catch (e) {}
          lb.dataset.ftext = (sec.list.itemName + " " + lab.join(" ")).toLowerCase();
          body.appendChild(lb);
        }
        (sec.after || []).forEach(function (f) {
          var n = fieldControl(f);
          n.dataset.ftext = ((f.label || "") + " " + (f.hint || "") + " " + (f.path || "")).toLowerCase();
          body.appendChild(n);
        });
        d.appendChild(body);
      }
      d.dataset.hay = searchHay;
      d.addEventListener("toggle", updateToggleAll);
      pane.appendChild(d);
    });
    buildRail();
    showTab(ui.tab || "profil", true);
    syncPanel();
  }

  // bangun ulang panel tanpa kehilangan tab, posisi scroll, dan bagian yang terbuka
  function rebuildPanel() {
    var st = scrollEl.scrollTop;
    var open = {};
    $$("details.sec", formEl).forEach(function (d) { open[d.getAttribute("data-title")] = d.open; });
    buildPanel();
    $$("details.sec", formEl).forEach(function (d) {
      var k = d.getAttribute("data-title");
      if (k in open) d.open = open[k];
    });
    scrollEl.scrollTop = st;
    updateToggleAll();
    if (searchEl.value) applySearch(searchEl.value);
  }

  /* ---------- pencarian pengaturan ---------- */
  function applySearch(q) {
    q = (q || "").trim().toLowerCase();
    formEl.classList.toggle("searching", !!q);
    var any = false;
    $$("details.sec", formEl).forEach(function (d) {
      var titleHit = !!q && d.getAttribute("data-title").indexOf(q) !== -1;
      var hit = false;
      $$(":scope > .sec-body > [data-ftext]", d).forEach(function (n) {
        var ok = !q || titleHit || n.getAttribute("data-ftext").indexOf(q) !== -1;
        n.classList.toggle("sfhide", !ok);
        if (ok) hit = true;
      });
      var own = d.querySelector(":scope > .sec-body[data-ftext]");
      if (own) {
        var okOwn = !q || titleHit || own.getAttribute("data-ftext").indexOf(q) !== -1;
        if (okOwn) hit = true;
      }
      var show = !q || titleHit || hit;
      d.classList.toggle("sfhide", !show);
      if (q && show) d.open = true;
      if (show) any = true;
    });
    $("#noResult").classList.toggle("hidden", !q || any);
    if (!q) showTab(ui.tab, true);
  }
  searchEl.addEventListener("input", function () { applySearch(searchEl.value); });
  searchEl.addEventListener("keydown", function (e) { if (e.key === "Escape") { searchEl.value = ""; applySearch(""); searchEl.blur(); } });

  /* panel kiri langsung menuju pengaturan yang dipilih di preview */
  function focusField(path) {
    if (!path) return;
    var inp = formEl.querySelector('[data-path="' + path + '"]') || formEl.querySelector('[data-path-hex="' + path + '"]');
    if (!inp) return;
    if (searchEl.value) { searchEl.value = ""; applySearch(""); }
    var pane = inp.closest(".tabpane");
    if (pane && pane.getAttribute("data-tab") !== ui.tab) showTab(pane.getAttribute("data-tab"), true);
    var d = inp.closest("details.sec");
    if (d && !d.open) d.open = true;
    // ciutkan bagian lain di tab ini supaya panel langsung tertuju ke pengaturan yang dipilih
    $$(".tabpane.active > details.sec", formEl).forEach(function (o) { if (o !== d && o.open) o.open = false; });
    updateToggleAll();
    var f = inp.closest(".field") || inp;
    requestAnimationFrame(function () {
      if (scrollEl.scrollHeight > scrollEl.clientHeight + 4) {
        var pr = scrollEl.getBoundingClientRect(), fr = f.getBoundingClientRect();
        scrollEl.scrollTo({ top: scrollEl.scrollTop + (fr.top - pr.top) - pr.height / 3, behavior: "smooth" });
      }
      f.classList.remove("flash");
      void f.offsetWidth;
      f.classList.add("flash");
    });
  }

  function updateThumbs() {
    $$("[data-thumb]").forEach(function (img) {
      var v = PC.getPath(cfg, img.getAttribute("data-thumb"));
      if (v) img.setAttribute("src", v); else img.removeAttribute("src");
    });
  }

  function syncPanel() {
    $$("[data-path]", formEl).forEach(function (inp) {
      if (inp === document.activeElement) return;
      var v = PC.getPath(cfg, inp.getAttribute("data-path"));
      if (v === undefined) return;
      if (inp.type === "checkbox") inp.checked = v !== false;
      else {
        inp.value = typeof v === "string" && v.indexOf("data:") === 0 ? "(gambar upload — akan jadi file saat Export ZIP)" : v;
        if (inp._out) inp._out.textContent = v + (inp._suffix || "");
      }
    });
    $$("[data-path-hex]", formEl).forEach(function (inp) {
      if (inp === document.activeElement) return;
      var v = PC.getPath(cfg, inp.getAttribute("data-path-hex"));
      if (v !== undefined) inp.value = v;
    });
    choices.forEach(function (g) {
      if (!g.isConnected) return;
      var v = String(PC.getPath(cfg, g._path));
      $$("button", g).forEach(function (b) { b.classList.toggle("on", b.getAttribute("data-val") === v); });
    });
    syncSegments();
    updateThumbs();
    updateWhen();
    if (orderBox && orderBox.isConnected && orderBox._draw) orderBox._draw();
  }

  /* ---------- gambar: pilih, proses, terapkan ---------- */
  var picker = $("#imgPicker");
  var pickCb = null;

  function pickImage(key, done, path, kind) {
    var target = path || ("assets." + key);
    pickCb = function (file) {
      applyImageFile(file, key, target, kind).then(function () { if (done) done(); });
    };
    picker.value = "";
    picker.click();
  }
  picker.addEventListener("change", function () {
    var f = picker.files && picker.files[0];
    if (f && pickCb) pickCb(f);
  });

  function applyImageFile(file, key, path, kind) {
    if (!file || !/^image\//.test(file.type)) { toast("File harus berupa gambar"); return Promise.resolve(); }
    var spec = key ? ASSET_FILES[key] : (kind === "photo" ? PHOTO_SPEC : ICON_SPEC);
    return processImage(file, spec).then(function (dataUrl) {
      PC.setPath(cfg, path, dataUrl);
      if (key === "banner" && cfg.theme.bannerMode !== "image") cfg.theme.bannerMode = "image";
      if (key === "background") cfg.theme.bgMode = "image";
      refresh(); syncPanel();
      toast("Gambar diganti");
    }).catch(function () { toast("Gagal membaca gambar"); });
  }

  function processImage(file, spec) {
    return new Promise(function (resolve, reject) {
      var url = URL.createObjectURL(file);
      var img = new Image();
      img.onload = function () {
        var w = img.naturalWidth || 128, hgt = img.naturalHeight || 128, sx = 0, sy = 0, sw = w, sh = hgt;
        if (spec.square) { var m = Math.min(w, hgt); sx = (w - m) / 2; sy = (hgt - m) / 2; sw = sh = m; }
        if (spec.exact) { // crop tengah (cover) ke rasio tetap, mis. OG 1200×630
          var ar = spec.exact[0] / spec.exact[1];
          if (w / hgt > ar) { sw = hgt * ar; sx = (w - sw) / 2; } else { sh = w / ar; sy = (hgt - sh) / 2; }
        }
        var scale = spec.exact ? spec.exact[0] / sw : Math.min(1, spec.max / Math.max(sw, sh));
        if (!isFinite(scale) || scale <= 0) scale = 1;
        var cw = Math.max(1, Math.round(sw * scale)), ch = Math.max(1, Math.round(sh * scale));
        var c = document.createElement("canvas");
        c.width = cw; c.height = ch;
        var ctx = c.getContext("2d");
        if (spec.type === "jpeg") { ctx.fillStyle = "#fff"; ctx.fillRect(0, 0, cw, ch); }
        ctx.drawImage(img, sx, sy, sw, sh, 0, 0, cw, ch);
        URL.revokeObjectURL(url);
        resolve(c.toDataURL("image/" + spec.type, 0.9));
      };
      img.onerror = function () { URL.revokeObjectURL(url); reject(); };
      img.src = url;
    });
  }

  function kindFor(path) {
    return /\.items\.\d+\.src$/.test(path) && !/\.icons\.\d+\.src$/.test(path) ? "photo" : "icon";
  }

  /* ---------- Edit via klik (sinkron dengan panel kiri) ---------- */
  var editTag = $("#editTag");
  var pop = $("#pop");
  var editing = null;

  function setEditMode(on) {
    editOn = on;
    stage.classList.toggle("edit-on", on);
    $("#stageHint").innerHTML = on
      ? "<b>Mode edit aktif</b> — klik objek untuk mengedit · seret ⠿ untuk memindah blok · seret ikon sosial untuk memindah posisi"
      : "Live preview";
    if (!on) { closePop(); hideTag(); hideGrip(); if (editing) commitEdit(); }
    else { PC.runtime.followed = false; refresh(); } // angka Followers tampil apa adanya saat diedit
  }

  function targetOf(e) {
    var t = e.target.closest ? e.target.closest("[data-edit],[data-panel]") : null;
    return t && cardEl.contains(t) ? t : null;
  }

  function hideTag() { editTag.hidden = true; }

  cardEl.addEventListener("mouseover", function (e) {
    if (!editOn || editing) return;
    var t = targetOf(e);
    if (!t) { hideTag(); return; }
    var r = t.getBoundingClientRect();
    var ty = t.dataset.edit === undefined ? "panel" : t.dataset.type;
    editTag.textContent = (ty === "image" ? "🖼 " : ty === "link" ? "🔗 " : ty === "panel" ? "⚙ " : "✎ ") + (t.dataset.label || "Edit");
    editTag.hidden = false;
    editTag.style.left = Math.max(4, r.left) + "px";
    editTag.style.top = Math.max(4, r.top - 24) + "px";
  });
  cardEl.addEventListener("mouseleave", hideTag);

  // Di mode edit, link di preview tidak boleh bernavigasi
  cardEl.addEventListener("click", function (e) {
    if (!editOn) return;
    var a = e.target.closest ? e.target.closest("a") : null;
    if (a) e.preventDefault();
  });

  cardEl.addEventListener("click", function (e) {
    if (!editOn) return;
    if (justDragged) { e.preventDefault(); e.stopPropagation(); return; }
    var t = targetOf(e);
    if (editing && t === editing) return; // klik di dalam teks yang sedang diedit
    if (editing) commitEdit();
    if (!t) { closePop(); e.preventDefault(); e.stopPropagation(); return; }

    focusField(t.dataset.panel || t.dataset.edit);   // panel kiri langsung ke pengaturan ini

    if (t.dataset.edit === undefined) {              // objek tanpa teks (ring, tombol tema, More Info, …)
      hideTag();
      if (t.dataset.pass) return;                    // tetap boleh dipakai (buka More Info, ganti tema)
      e.preventDefault(); e.stopPropagation();
      return;
    }
    e.preventDefault();
    e.stopPropagation();
    hideTag();
    if (t.dataset.type === "image") openImagePop(t);
    else if (t.dataset.type === "link") openLinkPop(t);
    else startEdit(t);
  }, true);

  // klik area background (di luar kartu) -> atur background
  stage.addEventListener("click", function (e) {
    if (!editOn || cardEl.contains(e.target) || pop.contains(e.target)) return;
    focusField("theme.bgMode");
    openImagePop({
      dataset: { edit: "assets.background", label: "Background halaman" },
      getBoundingClientRect: function () { return { left: e.clientX, top: e.clientY, bottom: e.clientY }; }
    });
  });

  function isMulti(node) { return node.dataset.multiline === "1"; }

  function startEdit(node) {
    closePop();
    var path = node.dataset.edit;
    editing = node;
    node._orig = PC.getPath(cfg, path);
    node.classList.add("editing");
    node.setAttribute("contenteditable", "plaintext-only");
    if (node.contentEditable !== "plaintext-only") node.setAttribute("contenteditable", "true");
    node.focus();
    var range = document.createRange();
    range.selectNodeContents(node);
    var sel = window.getSelection();
    sel.removeAllRanges(); sel.addRange(range);
    node.addEventListener("keydown", onEditKey);
    node.addEventListener("blur", onEditBlur);
    node.addEventListener("paste", onEditPaste);
    showColorBar(node);
  }

  /* ---------- toolbar warna teks (muncul saat mengedit teks label / isi / judul section) ---------- */
  var colorBar = h("div", { class: "colorbar" });
  colorBar.hidden = true;
  var cbInput = h("input", { type: "color", "aria-label": "Warna teks" });
  var cbReset = h("button", { type: "button", class: "btn", text: "Default", title: "Ikut warna tema" });
  var cbOk = h("button", { type: "button", class: "btn primary", text: "OK" });
  colorBar.appendChild(h("span", { text: "Warna teks" }));
  [cbInput, cbReset, cbOk].forEach(function (n) { colorBar.appendChild(n); });
  document.body.appendChild(colorBar);
  var cbPath = null;

  function cbNode() { return cbPath ? cardEl.querySelector('[data-color-path="' + cbPath + '"]') : null; }
  function rgbToHex(c) {
    var m = /(\d+)[, ]+(\d+)[, ]+(\d+)/.exec(c || "");
    if (!m) return "#ffffff";
    return "#" + [m[1], m[2], m[3]].map(function (x) { return ("0" + parseInt(x, 10).toString(16)).slice(-2); }).join("");
  }
  function showColorBar(node) {
    var cp = node.getAttribute("data-color-path");
    if (!cp) { hideColorBar(); return; }
    cbPath = cp;
    cbInput.value = get(cp) || rgbToHex(getComputedStyle(node).color);
    var r = node.getBoundingClientRect();
    colorBar.hidden = false;
    var w = colorBar.offsetWidth || 230;
    colorBar.style.left = Math.min(Math.max(8, r.left), window.innerWidth - w - 8) + "px";
    colorBar.style.top = (r.top > 56 ? r.top - 48 : r.bottom + 8) + "px";
  }
  function hideColorBar() { colorBar.hidden = true; cbPath = null; }
  function applyBarColor(val) {
    if (!cbPath) return;
    PC.setPath(cfg, cbPath, val);
    var n = cbNode();
    if (n) n.style.color = val;
    scheduleSave(); syncPanel();
  }
  cbInput.addEventListener("input", function () { applyBarColor(cbInput.value); });
  cbReset.addEventListener("click", function () {
    applyBarColor("");
    var n = cbNode(); if (n) cbInput.value = rgbToHex(getComputedStyle(n).color);
  });
  cbOk.addEventListener("click", function () { hideColorBar(); refresh(); });
  document.addEventListener("pointerdown", function (e) {
    if (colorBar.hidden || colorBar.contains(e.target)) return;
    var n = cbNode();
    if (n && n.contains(e.target)) return;
    hideColorBar();
  }, true);

  function onEditKey(e) {
    var node = e.currentTarget;
    if (e.key === "Escape") { e.preventDefault(); commitEdit(true); return; }
    if (e.key === "Enter") {
      // bio / teks panjang: Enter = baris baru, Ctrl/⌘+Enter = simpan
      if (isMulti(node) && !(e.ctrlKey || e.metaKey)) return;
      e.preventDefault(); commitEdit();
    }
  }
  function onEditBlur() { commitEdit(false, true); }
  function onEditPaste(e) {
    e.preventDefault();
    var txt = (e.clipboardData || window.clipboardData).getData("text");
    if (!isMulti(e.currentTarget)) txt = txt.replace(/\s*\n\s*/g, " ");
    document.execCommand("insertText", false, txt);
  }

  function commitEdit(cancel, fromBlur) {
    var node = editing;
    if (!node) return;
    editing = null;
    node.removeEventListener("keydown", onEditKey);
    node.removeEventListener("blur", onEditBlur);
    node.removeEventListener("paste", onEditPaste);
    var path = node.dataset.edit;
    var val;
    if (cancel) val = node._orig;
    else if (isMulti(node)) val = (node.innerText || "").replace(/\r/g, "").replace(/[ \t]+\n/g, "\n").replace(/\n{3,}/g, "\n\n").trim();
    else val = node.textContent.replace(/\s+/g, " ").trim();
    if (fromBlur) {
      // Fokus pindah karena user mengklik hal lain: simpan tanpa langsung merender ulang kartu,
      // supaya klik berikutnya tidak hilang. Render ulang menyusul bila tidak ada edit baru.
      node.classList.remove("editing");
      node.removeAttribute("contenteditable");
      node.textContent = val;
      setValue(path, val, { noRender: true });
      setTimeout(function () { if (!editing) refresh(); }, 300);
      return;
    }
    hideColorBar();
    setValue(path, val); // re-render + sinkron panel
  }

  /* popover gambar */
  function closePop() { pop.hidden = true; pop.textContent = ""; }

  function placePop(node, height) {
    pop.hidden = false;
    var r = node.getBoundingClientRect();
    var left = Math.min(Math.max(8, r.left), window.innerWidth - 290);
    var top = r.bottom + 8;
    if (top + height > window.innerHeight) top = Math.max(8, r.top - (height + 8));
    pop.style.left = left + "px";
    pop.style.top = top + "px";
  }

  function openImagePop(node) {
    var path = node.dataset.edit;           // mis. assets.profile  /  cta.sections.0.items.1.icons.2.src
    var isAsset = path.indexOf("assets.") === 0;
    var key = isAsset ? path.split(".")[1] : null;
    var kind = kindFor(path);
    var label = node.dataset.label;
    pop.textContent = "";
    var url = h("input", { type: "text", placeholder: "assets/…  atau  https://…", spellcheck: "false" });
    var cur = PC.getPath(cfg, path) || "";
    url.value = cur.indexOf("data:") === 0 ? "" : cur;
    var upload = h("button", { type: "button", class: "btn primary", text: "Upload gambar…" });
    var apply = h("button", { type: "button", class: "btn", text: "OK" });
    var reset = h("button", { type: "button", class: "btn", text: "Reset" });
    var close = h("button", { type: "button", class: "btn ghost", text: "Tutup" });
    upload.addEventListener("click", function () { pickImage(key, closePop, path, kind); });
    apply.addEventListener("click", function () {
      setValue(path, url.value.trim());
      if (key === "banner" && url.value.trim()) setValue("theme.bannerMode", "image");
      if (key === "background" && url.value.trim()) setValue("theme.bgMode", "image");
      closePop();
    });
    url.addEventListener("keydown", function (e) { if (e.key === "Enter") apply.click(); });
    reset.addEventListener("click", function () { setValue(path, isAsset ? (DEFAULTS.assets[key] || "") : ""); closePop(); });
    close.addEventListener("click", closePop);
    var parts = [h("h4", { text: label }), upload,
     h("div", { class: "row" }, [url, apply]),
     h("div", { class: "row" }, [reset, close])];
    if (/^verified/.test(key || "")) {
      var tin = h("input", { type: "text", placeholder: "Teks saat diklik", spellcheck: "false" });
      tin.value = cfg.profile.verifiedText || "";
      tin.addEventListener("input", function () { setValue("profile.verifiedText", tin.value, { keepPanel: true }); });
      parts.push(h("h4", { text: "Teks yang muncul di atas ikon" }), h("div", { class: "row" }, [tin]));
    }
    parts.forEach(function (n) { pop.appendChild(n); });
    placePop(node, /^verified/.test(key || "") ? 250 : 170);
    url.focus();
  }

  /* popover link (ikon sosial) */
  function openLinkPop(node) {
    var path = node.dataset.edit;           // mis. socials.items.0.url
    pop.textContent = "";
    var url = h("input", { type: "text", placeholder: "https://…  ·  mailto:…", spellcheck: "false" });
    url.value = PC.getPath(cfg, path) || "";
    var apply = h("button", { type: "button", class: "btn primary", text: "OK" });
    var close = h("button", { type: "button", class: "btn ghost", text: "Tutup" });
    apply.addEventListener("click", function () { setValue(path, url.value.trim()); closePop(); });
    url.addEventListener("keydown", function (e) { if (e.key === "Enter") apply.click(); });
    close.addEventListener("click", closePop);
    [h("h4", { text: node.dataset.label }),
     h("div", { class: "row" }, [url, apply]),
     h("div", { class: "row" }, [close])].forEach(function (n) { pop.appendChild(n); });
    placePop(node, 130);
    url.focus();
    url.select();
  }

  document.addEventListener("mousedown", function (e) {
    if (!pop.hidden && !pop.contains(e.target) && !(cardEl.contains(e.target) && targetOf(e))) closePop();
  });
  document.addEventListener("keydown", function (e) { if (e.key === "Escape") closePop(); });
  window.addEventListener("resize", closePop);
  stage.addEventListener("scroll", function () { closePop(); hideTag(); });

  $("#editToggle").addEventListener("change", function (e) { setEditMode(e.target.checked); });

  /* ---------- drag & drop langsung di preview (mode edit) ---------- */
  var gripEl = h("div", { class: "block-grip", title: "Seret untuk memindah blok", text: "⠿" });
  gripEl.hidden = true;
  document.body.appendChild(gripEl);
  var gripFor = null, gripHover = false, gripTimer = null;

  function hideGrip() { gripEl.hidden = true; gripFor = null; }
  function showGrip(b) {
    clearTimeout(gripTimer);
    var r = b.getBoundingClientRect(), cr = cardEl.getBoundingClientRect();
    gripFor = b;
    gripEl.hidden = false;
    gripEl.style.left = Math.max(cr.left + 3, r.left - 24) + "px";
    gripEl.style.top = (r.top + Math.min(r.height / 2, 16) - 12) + "px";
  }
  cardEl.addEventListener("mouseover", function (e) {
    if (!editOn || editing || document.body.classList.contains("sorting")) return;
    var b = e.target.closest ? e.target.closest("[data-sort-path],[data-block]") : null;
    if (b && cardEl.contains(b)) showGrip(b);
  });
  cardEl.addEventListener("mouseleave", function () {
    clearTimeout(gripTimer);
    gripTimer = setTimeout(function () { if (!gripHover) hideGrip(); }, 160);
  });
  gripEl.addEventListener("mouseenter", function () { gripHover = true; clearTimeout(gripTimer); });
  gripEl.addEventListener("mouseleave", function () { gripHover = false; hideGrip(); });

  function sortInfo(node) {
    if (node.getAttribute("data-block")) {
      return { path: "layout.order", siblings: function () { return $$("[data-block]", cardEl); } };
    }
    if (node.getAttribute("data-sort") === "row") {   // item More Info: bisa pindah antar-section
      return { path: "items*", siblings: function () { return $$('[data-sort="row"]', cardEl); } };
    }
    var path = node.getAttribute("data-sort-path");
    return { path: path, siblings: function () {
      return Array.prototype.filter.call(node.parentNode.children, function (c) { return c.getAttribute("data-sort-path") === path; });
    } };
  }

  gripEl.addEventListener("pointerdown", function (e) {
    if (!gripFor) return;
    var node = gripFor, info = sortInfo(node);
    var from = info.siblings().indexOf(node);
    if (from < 0) return;
    hideTag();
    startSort(e, info.siblings, from, function (f, t) {
      if (info.path === "items*") {
        var nodes = info.siblings();
        var meta = nodes.map(function (n) {
          var mm = /sections\.(\d+)\./.exec(n.getAttribute("data-sort-path")) || [];
          return { s: parseInt(mm[1], 10), j: parseInt(n.getAttribute("data-sort-idx"), 10) };
        });
        var src = meta[f], tgt = t < meta.length ? meta[t] : { s: meta[meta.length - 1].s, j: meta[meta.length - 1].j + 1 };
        moveItem(src.s, src.j, tgt.s, tgt.j);
      } else if (info.path === "cta.sections") {
        // section + tombol aksi dalam satu daftar urutan
        var toks = info.siblings().map(function (n) { return n.getAttribute("data-sort-idx"); });
        toks.splice(t, 0, toks.splice(f, 1)[0]);
        var old = get("cta.sections") || [];
        var next = toks.filter(function (x) { return x !== "action"; }).map(function (x) { return old[parseInt(x, 10)]; });
        var ai = toks.indexOf("action");
        if (ai !== -1) PC.setPath(cfg, "cta.actionIndex", ai);
        setValue("cta.sections", next);
        rebuildPanel();
      } else if (info.path === "layout.order") {
        var keys = info.siblings().map(function (n) { return n.getAttribute("data-block"); });
        var moved = keys.slice();
        moved.splice(t, 0, moved.splice(f, 1)[0]);
        var full = PC.normalizeOrder(cfg.layout && cfg.layout.order), k = 0;
        if (!cfg.layout) cfg.layout = {};
        setValue("layout.order", full.map(function (x) { return keys.indexOf(x) !== -1 ? moved[k++] : x; }));
      } else {
        var arr = (get(info.path) || []).slice();
        arr.splice(t, 0, arr.splice(f, 1)[0]);
        setValue(info.path, arr);
        rebuildPanel();
      }
      hideGrip();
    }, info.path === "items*" ? { raw: true } : null);
  });

  /* seret ikon sosial untuk memindah posisinya */
  var sdrag = null, justDragged = false;
  cardEl.addEventListener("pointerdown", function (e) {
    if (!editOn || editing || (e.button !== undefined && e.button !== 0)) return;
    var soc = e.target.closest ? e.target.closest(".socials") : null;
    if (!soc || !cardEl.contains(soc)) return;
    var r = soc.getBoundingClientRect();
    sdrag = { x: e.clientX, y: e.clientY, ox: e.clientX - (r.left + r.width / 2), oy: e.clientY - (r.top + r.height / 2), moved: false };
    document.addEventListener("pointermove", sMove);
    document.addEventListener("pointerup", sUp);
    document.addEventListener("pointercancel", sUp);
  }, true);

  function clamp(v, a, b) { return Math.max(a, Math.min(b, v)); }

  function sMove(ev) {
    if (!sdrag) return;
    var br = cardEl.querySelector(".banner-box").getBoundingClientRect();
    if (!sdrag.moved) {
      if (Math.hypot(ev.clientX - sdrag.x, ev.clientY - sdrag.y) < 6) return;
      sdrag.moved = true;
      hideTag(); closePop(); hideGrip();
      var cur = cardEl.querySelector(".socials").getBoundingClientRect();   // mulai dari posisi sekarang
      cfg.socials.x = Math.round((cur.left + cur.width / 2 - br.left) / br.width * 1000) / 10;
      cfg.socials.y = Math.round((cur.top + cur.height / 2 - br.top) / br.height * 1000) / 10;
      cfg.socials.pos = "custom";
      refresh();
      var n = cardEl.querySelector(".socials");
      if (n) n.classList.add("dragging");
    }
    var x = clamp((ev.clientX - sdrag.ox - br.left) / br.width * 100, 0, 100);
    var y = clamp((ev.clientY - sdrag.oy - br.top) / br.height * 100, 0, 100);
    if (Math.abs(x - 50) < 2.5) x = 50;          // magnet ke garis tengah
    if (Math.abs(y - 50) < 2.5) y = 50;
    x = Math.round(x * 10) / 10; y = Math.round(y * 10) / 10;
    cfg.socials.x = x; cfg.socials.y = y;
    shell.style.setProperty("--sx", x + "%");
    shell.style.setProperty("--sy", y + "%");
  }

  function sUp() {
    document.removeEventListener("pointermove", sMove);
    document.removeEventListener("pointerup", sUp);
    document.removeEventListener("pointercancel", sUp);
    if (sdrag && sdrag.moved) {
      justDragged = true;
      setTimeout(function () { justDragged = false; }, 80);
      var n = cardEl.querySelector(".socials");
      if (n) n.classList.remove("dragging");
      scheduleSave();
      syncPanel();
    }
    sdrag = null;
  }

  /* ---------- lebar preview ---------- */
  $$("#devSeg button").forEach(function (b) {
    b.addEventListener("click", function () {
      $$("#devSeg button").forEach(function (x) { x.classList.toggle("on", x === b); });
      var w = parseInt(b.dataset.w, 10);
      var inner = $("#stageInner");
      inner.classList.toggle("fixed", w > 0);
      if (w > 0) inner.style.setProperty("--vw", w + "px"); else inner.style.removeProperty("--vw");
    });
  });

  /* ---------- drop file gambar ke preview (kartu atau background) ---------- */
  function imgTargetAt(e) {
    var n = e.target.closest ? e.target.closest("[data-edit][data-type='image']") : null;
    if (n && cardEl.contains(n)) return n;
    if (e.target.closest && cardEl.contains(e.target)) {
      var bb = e.target.closest(".banner-box");
      if (bb) return bb.querySelector(".banner");
    }
    return null;
  }
  var hotNode = null;
  function clearHot() { if (hotNode) hotNode.classList.remove("drop-hot"); hotNode = null; shell.classList.remove("drop-bg"); }
  stage.addEventListener("dragover", function (e) {
    if (!isFileDrag(e)) return;
    e.preventDefault();
    e.dataTransfer.dropEffect = "copy";
    var t = imgTargetAt(e);
    if (hotNode !== t) { clearHot(); hotNode = t; }
    if (t) t.classList.add("drop-hot"); else shell.classList.add("drop-bg");
  });
  stage.addEventListener("dragleave", function (e) { if (!stage.contains(e.relatedTarget)) clearHot(); });
  stage.addEventListener("drop", function (e) {
    if (!isFileDrag(e)) return;
    e.preventDefault();
    var t = imgTargetAt(e);
    clearHot();
    var file = e.dataTransfer.files && e.dataTransfer.files[0];
    if (!file) return;
    var path = t ? t.getAttribute("data-edit") : "assets.background";
    var key = path.indexOf("assets.") === 0 ? path.split(".")[1] : null;
    focusField(path);
    applyImageFile(file, key, path, kindFor(path));
  });
  // cegah browser membuka file yang dijatuhkan di luar area drop
  window.addEventListener("dragover", function (e) { if (isFileDrag(e)) e.preventDefault(); });
  window.addEventListener("drop", function (e) { if (isFileDrag(e)) e.preventDefault(); });

  /* ---------- menu export, undo/redo, shortcut ---------- */
  var menu = $("#menu"), btnMenu = $("#btnMenu");
  function closeMenu() { menu.hidden = true; btnMenu.setAttribute("aria-expanded", "false"); }
  btnMenu.addEventListener("click", function (e) {
    e.stopPropagation();
    menu.hidden = !menu.hidden;
    btnMenu.setAttribute("aria-expanded", menu.hidden ? "false" : "true");
  });
  menu.addEventListener("click", closeMenu);
  document.addEventListener("click", function (e) { if (!menu.hidden && !menu.contains(e.target)) closeMenu(); });

  $("#btnUndo").addEventListener("click", undo);
  $("#btnRedo").addEventListener("click", redo);
  function resetHistory() { clearTimeout(histTimer); histTimer = null; hist = [JSON.stringify(cfg)]; hi = 0; updateHistUI(); }

  document.addEventListener("keydown", function (e) {
    var mod = e.ctrlKey || e.metaKey;
    if (!mod) return;
    var k = (e.key || "").toLowerCase();
    if (k === "k") { e.preventDefault(); searchEl.focus(); searchEl.select(); return; }
    var tag = (e.target.tagName || "").toLowerCase();
    var typing = tag === "input" || tag === "textarea" || tag === "select" || e.target.isContentEditable;
    if (typing) return;
    if (k === "z") { e.preventDefault(); if (e.shiftKey) redo(); else undo(); }
    else if (k === "y") { e.preventDefault(); redo(); }
  });

  /* ---------- export ---------- */
  function exportCfg() {
    // Ganti gambar upload (data URL) dengan path standar; kembalikan daftar file-nya.
    var out = PC.clone(cfg);
    var files = [];
    Object.keys(ASSET_FILES).forEach(function (k) {
      var v = out.assets[k];
      if (typeof v === "string" && v.indexOf("data:") === 0) {
        files.push({ path: ASSET_FILES[k].path, data: dataUrlToBytes(v) });
        out.assets[k] = ASSET_FILES[k].path;
      }
    });
    // ikon / gambar lain yang berupa data URL (ikon sosial, label, isi More Info) -> jadikan file di assets/uploads/
    var EXT = { "image/png": "png", "image/jpeg": "jpg", "image/webp": "webp", "image/gif": "gif", "image/svg+xml": "svg" };
    var seen = {}, n = 0;
    (function walk(o) {
      Object.keys(o).forEach(function (k) {
        var v = o[k];
        if (typeof v === "string" && /^data:image\//.test(v)) {
          if (!seen[v]) {
            var mime = v.slice(5, v.indexOf(";") > 0 ? v.indexOf(";") : v.indexOf(","));
            n++;
            seen[v] = "assets/uploads/img-" + (n < 10 ? "0" : "") + n + "." + (EXT[mime] || "png");
            files.push({ path: seen[v], data: dataUrlToBytes(v) });
          }
          o[k] = seen[v];
        } else if (v && typeof v === "object") walk(v);
      });
    })(out);
    return { cfg: out, files: files };
  }

  function configJs(c) {
    return "/**\n * CONFIG UTAMA — dibuat dari demo.html (" + new Date().toISOString().slice(0, 10) + ")\n" +
      " * Timpa file js/config.js dengan file ini.\n */\n" +
      "window.PROFILE_CONFIG = " + JSON.stringify(c, null, 2) + ";\n";
  }

  function dataUrlToBytes(u) {
    var comma = u.indexOf(","), meta = u.slice(0, comma), payload = u.slice(comma + 1);
    if (meta.indexOf(";base64") === -1) return new TextEncoder().encode(decodeURIComponent(payload));
    var bin = atob(payload), arr = new Uint8Array(bin.length);
    for (var i = 0; i < bin.length; i++) arr[i] = bin.charCodeAt(i);
    return arr;
  }

  function download(name, blob) {
    var a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = name;
    document.body.appendChild(a);
    a.click();
    setTimeout(function () { URL.revokeObjectURL(a.href); a.remove(); }, 500);
  }

  /* ZIP sederhana (tanpa kompresi) */
  var CRC_TABLE = (function () {
    var t = [], c, n, k;
    for (n = 0; n < 256; n++) {
      c = n;
      for (k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
      t[n] = c >>> 0;
    }
    return t;
  })();
  function crc32(bytes) {
    var c = 0xffffffff;
    for (var i = 0; i < bytes.length; i++) c = CRC_TABLE[(c ^ bytes[i]) & 255] ^ (c >>> 8);
    return (c ^ 0xffffffff) >>> 0;
  }
  function makeZip(entries) {
    var enc = new TextEncoder(), parts = [], central = [], offset = 0;
    var d = new Date();
    var time = (d.getHours() << 11) | (d.getMinutes() << 5) | (d.getSeconds() >> 1);
    var date = ((d.getFullYear() - 1980) << 9) | ((d.getMonth() + 1) << 5) | d.getDate();
    entries.forEach(function (e) {
      var name = enc.encode(e.path), data = e.data, crc = crc32(data);
      var lh = new DataView(new ArrayBuffer(30));
      lh.setUint32(0, 0x04034b50, true); lh.setUint16(4, 20, true); lh.setUint16(6, 0x0800, true);
      lh.setUint16(8, 0, true); lh.setUint16(10, time, true); lh.setUint16(12, date, true);
      lh.setUint32(14, crc, true); lh.setUint32(18, data.length, true); lh.setUint32(22, data.length, true);
      lh.setUint16(26, name.length, true); lh.setUint16(28, 0, true);
      parts.push(new Uint8Array(lh.buffer), name, data);
      var ch = new DataView(new ArrayBuffer(46));
      ch.setUint32(0, 0x02014b50, true); ch.setUint16(4, 20, true); ch.setUint16(6, 20, true);
      ch.setUint16(8, 0x0800, true); ch.setUint16(10, 0, true); ch.setUint16(12, time, true); ch.setUint16(14, date, true);
      ch.setUint32(16, crc, true); ch.setUint32(20, data.length, true); ch.setUint32(24, data.length, true);
      ch.setUint16(28, name.length, true); ch.setUint32(42, offset, true);
      central.push(new Uint8Array(ch.buffer), name);
      offset += 30 + name.length + data.length;
    });
    var cdSize = central.reduce(function (n, p) { return n + p.length; }, 0);
    var end = new DataView(new ArrayBuffer(22));
    end.setUint32(0, 0x06054b50, true); end.setUint16(8, entries.length, true); end.setUint16(10, entries.length, true);
    end.setUint32(12, cdSize, true); end.setUint32(16, offset, true);
    return new Blob(parts.concat(central, [new Uint8Array(end.buffer)]), { type: "application/zip" });
  }

  $("#btnZip").addEventListener("click", function () {
    var x = exportCfg();
    var entries = [{ path: "js/config.js", data: new TextEncoder().encode(configJs(x.cfg)) }].concat(x.files);
    download("profile-config.zip", makeZip(entries));
    toast("ZIP berisi js/config.js" + (x.files.length ? " + " + x.files.length + " gambar" : "") + " — ekstrak ke folder project");
  });

  $("#btnJs").addEventListener("click", function () {
    var x = exportCfg();
    download("config.js", new Blob([configJs(x.cfg)], { type: "text/javascript" }));
    toast(x.files.length ? "Ada gambar upload — pakai Export ZIP supaya file gambarnya ikut" : "config.js diunduh → taruh di folder js/");
  });

  $("#btnCopy").addEventListener("click", function () {
    var txt = JSON.stringify(exportCfg().cfg, null, 2);
    function fallback() {
      var ta = h("textarea"); ta.value = txt; document.body.appendChild(ta); ta.select();
      try { document.execCommand("copy"); toast("JSON disalin"); } catch (e) { toast("Gagal menyalin"); }
      ta.remove();
    }
    if (navigator.clipboard && window.isSecureContext) navigator.clipboard.writeText(txt).then(function () { toast("JSON disalin"); }, fallback);
    else fallback();
  });

  $("#btnHead").addEventListener("click", function () {
    var txt = PC.headTags(exportCfg().cfg); // gambar upload dihitung sebagai path standar hasil export
    function ok() { toast(cfg.meta.siteUrl ? "Tag <head> disalin → tempel ke index.html" : "Disalin. Isi “Alamat website” dulu agar og:image jadi URL penuh"); }
    function fallback() {
      var ta = h("textarea"); ta.value = txt; document.body.appendChild(ta); ta.select();
      try { document.execCommand("copy"); ok(); } catch (e) { toast("Gagal menyalin"); }
      ta.remove();
    }
    if (navigator.clipboard && window.isSecureContext) navigator.clipboard.writeText(txt).then(ok, fallback);
    else fallback();
  });

  $("#btnImport").addEventListener("click", function () { $("#importFile").click(); });
  $("#importFile").addEventListener("change", function (e) {
    var f = e.target.files && e.target.files[0];
    if (!f) return;
    var r = new FileReader();
    r.onload = function () {
      try {
        var s = String(r.result);
        var obj = JSON.parse(s.slice(s.indexOf("{"), s.lastIndexOf("}") + 1));
        cfg = PC.merge(DEFAULTS, PC.migrate(obj));
        refresh(); rebuildPanel(); resetHistory();
        toast("Config diimpor");
      } catch (err) { toast("File tidak valid (harus JSON / config.js hasil export)"); }
    };
    r.readAsText(f);
    e.target.value = "";
  });

  $("#btnReset").addEventListener("click", function () {
    if (!confirm("Kembalikan semua ke isi js/config.js dan hapus draft?")) return;
    PC.clearDraft();
    cfg = PC.clone(DEFAULTS);
    refresh(); rebuildPanel(); resetHistory();
    setStatus("Draft dihapus.");
    toast("Direset");
  });

  /* ---------- init ---------- */
  buildPanel();
  PC.applyTheme(shell, cfg);
  PC.render(cardEl, cfg);
  PC.applyMeta(cfg);
  updateHistUI();
})();
