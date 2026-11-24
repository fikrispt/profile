/* ==========================================================
   Profile Card — app.js
   Merender kartu dari window.PROFILE_CONFIG (js/config.js).
   Dipakai oleh index.html dan demo.html (live preview).
   ========================================================== */
(function () {
  "use strict";

  var DRAFT_KEY = "profileCard.draft.v3";
  var MODE_KEY = "profileCard.mode";
  var FOLLOW_KEY = "profileCard.followed";
  var SAVE_KEY = "profileCard.saved";

  /* State runtime (tidak ikut config). demo.js mematikan `persist`. */
  var runtime = {
    persist: true,
    mode: null,        // "light" | "dark" | null (null = ikut config / pilihan tersimpan)
    followed: null,    // null = baca dari storage
    saved: null,
    open: null,        // null = ikut cta.defaultOpen
    target: null,
    cfg: null,
    current: "dark"
  };

  var idCounter = 0;

  /* ---------- util ---------- */
  function clone(o) { return JSON.parse(JSON.stringify(o)); }
  function isObj(v) { return v && typeof v === "object" && !Array.isArray(v); }

  function merge(base, extra) {
    var out = clone(base);
    (function walk(t, s) {
      Object.keys(s || {}).forEach(function (k) {
        if (isObj(s[k]) && isObj(t[k])) walk(t[k], s[k]);
        else t[k] = clone({ v: s[k] }).v;
      });
    })(out, extra);
    return out;
  }

  function getPath(obj, path) {
    return path.split(".").reduce(function (o, k) { return o == null ? o : o[k]; }, obj);
  }

  function setPath(obj, path, val) {
    var keys = path.split(".");
    var last = keys.pop();
    var t = keys.reduce(function (o, k) { return o[k]; }, obj);
    t[last] = val;
  }

  function mixHex(hex, to, amt) {
    var h = String(hex || "#000000").replace("#", "");
    if (h.length === 3) h = h.split("").map(function (c) { return c + c; }).join("");
    var n = parseInt(h, 16), m = parseInt(String(to).replace("#", ""), 16);
    if (isNaN(n)) return hex;
    function ch(sh) { return Math.round(((n >> sh) & 255) * (1 - amt) + ((m >> sh) & 255) * amt); }
    return "rgb(" + ch(16) + "," + ch(8) + "," + ch(0) + ")";
  }

  function hexToRgba(hex, a) {
    var h = String(hex || "#ffffff").replace("#", "");
    if (h.length === 3) h = h.split("").map(function (c) { return c + c; }).join("");
    var n = parseInt(h, 16);
    if (isNaN(n)) return "rgba(255,255,255," + a + ")";
    return "rgba(" + ((n >> 16) & 255) + "," + ((n >> 8) & 255) + "," + (n & 255) + "," + a + ")";
  }

  // warna solid / gradient -> nilai CSS background
  function paint(mode, c1, c2, angle) {
    c1 = c1 || "#7c5cff";
    if (mode === "gradient") return "linear-gradient(" + (angle == null ? 135 : angle) + "deg," + c1 + "," + (c2 || c1) + ")";
    return c1;
  }

  var FONTS = [
    ["Lato", "Lato"], ["Inter", "Inter"], ["Poppins", "Poppins"], ["Plus Jakarta Sans", "Plus Jakarta Sans"],
    ["DM Sans", "DM Sans"], ["Nunito", "Nunito"], ["system", "Bawaan sistem (tanpa unduh font)"]
  ];
  var loadedFonts = {};
  function ensureFont(name) {
    if (!name || name === "system" || loadedFonts[name]) return;
    loadedFonts[name] = true;
    var l = document.createElement("link");
    l.rel = "stylesheet";
    l.href = "https://fonts.googleapis.com/css2?family=" + encodeURIComponent(name).replace(/%20/g, "+") + ":wght@400;500;600;700&display=swap";
    document.head.appendChild(l);
  }
  function fontStack(name) {
    var base = 'system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif';
    return !name || name === "system" ? base : '"' + name + '", ' + base;
  }

  function safeUrl(u) {
    u = String(u || "").trim();
    if (!u) return "#";
    if (/^(https?:|mailto:|tel:|#|\/|\.\/|\.\.\/)/i.test(u)) return u;
    if (/^[a-z][a-z0-9+.-]*:/i.test(u)) return "#";                 // blok javascript:, data:, dll
    if (/^[\w-]+(\.[\w-]+)+([\/?#].*)?$/.test(u)) return "https://" + u; // "domain.com" -> https://domain.com
    return u;
  }

  // url() di CSS variable dihitung relatif ke file CSS, bukan ke halaman -> jadikan absolut
  function absUrl(u) {
    u = String(u || "");
    if (/^(data:|blob:|https?:|\/\/)/i.test(u)) return u;
    try { return new URL(u, document.baseURI).href; } catch (e) { return u; }
  }

  function linkAttrs(a) {
    var href = a.getAttribute("href") || "";
    if (/^https?:/i.test(href)) { a.setAttribute("target", "_blank"); a.setAttribute("rel", "noopener noreferrer"); }
  }

  function el(tag, attrs, children) {
    var n = document.createElement(tag);
    Object.keys(attrs || {}).forEach(function (k) {
      var v = attrs[k];
      if (v === false || v == null) return;
      if (k === "text") n.textContent = v;
      else if (k === "style") n.style.cssText = v;
      else n.setAttribute(k, v === true ? "" : v);
    });
    (children || []).forEach(function (c) { if (c) n.appendChild(c); });
    return n;
  }

  function initials(name) {
    return String(name || "?").trim().split(/\s+/).slice(0, 2)
      .map(function (w) { return w.charAt(0).toUpperCase(); }).join("");
  }

  function lsGet(k) { try { return localStorage.getItem(k); } catch (e) { return null; } }
  function lsSet(k, v) { try { localStorage.setItem(k, v); } catch (e) {} }

  /* ---------- ikon ---------- */
  var STROKE = 'fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"';
  var ICONS = {
    x: { fill: true, svg: '<path d="M18.901 1.153h3.68l-8.04 9.19L24 22.846h-7.406l-5.8-7.584-6.638 7.584H.474l8.6-9.83L0 1.154h7.594l5.243 6.932ZM17.61 20.644h2.039L6.486 3.24H4.298Z"/>' },
    instagram: { svg: '<rect x="2" y="2" width="20" height="20" rx="5" ry="5"/><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/><line x1="17.5" y1="6.5" x2="17.51" y2="6.5"/>' },
    linkedin: { svg: '<path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z"/><rect x="2" y="9" width="4" height="12"/><circle cx="4" cy="4" r="2"/>' },
    github: { svg: '<path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22"/>' },
    facebook: { svg: '<path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"/>' },
    youtube: { svg: '<rect x="2" y="4.5" width="20" height="15" rx="4.5"/><polygon points="10 9 15.5 12 10 15 10 9"/>' },
    tiktok: { fill: true, svg: '<path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z"/>' },
    telegram: { svg: '<line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/>' },
    whatsapp: { svg: '<path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"/><path d="M9.2 8.6c-.3.5-.4 1.2 0 2 .8 1.7 2.2 3 3.9 3.7.8.3 1.5.1 1.9-.4l.3-.6-1.7-.9-.6.6c-.9-.4-1.7-1.1-2.2-2l.5-.6-.8-1.8z"/>' },
    link: { svg: '<path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/>' },
    star: { svg: '<polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>' },
    email: { svg: '<path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/>' },
    website: { svg: '<circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>' }
  };

  var SOCIAL_TYPES = [
    ["x", "X (Twitter)"], ["instagram", "Instagram"], ["linkedin", "LinkedIn"], ["github", "GitHub"],
    ["facebook", "Facebook"], ["youtube", "YouTube"], ["tiktok", "TikTok"], ["telegram", "Telegram"],
    ["whatsapp", "WhatsApp"], ["email", "Email"], ["website", "Website"], ["custom", "Ikon sendiri (upload)"]
  ];
  var BLOCKS = [
    ["name", "Nama + ikon verified + label"], ["handle", "Username"], ["desc", "Bio"],
    ["stats", "Following / Followers"], ["links", "Link"], ["more", "More Info"], ["copyright", "Copyright"]
  ];
  function normalizeOrder(o) {
    var valid = BLOCKS.map(function (b) { return b[0]; });
    var out = (Array.isArray(o) ? o : []).filter(function (k, i, a) { return valid.indexOf(k) !== -1 && a.indexOf(k) === i; });
    valid.forEach(function (k) { if (out.indexOf(k) === -1) out.push(k); });
    return out;
  }
  var LABEL_ICONS = [["none", "Tanpa ikon"], ["custom", "Ikon sendiri (upload)"], ["link", "Rantai (link)"], ["star", "Bintang"]].concat(
    [["x", "X (Twitter)"], ["instagram", "Instagram"], ["linkedin", "LinkedIn"], ["github", "GitHub"], ["facebook", "Facebook"],
     ["youtube", "YouTube"], ["tiktok", "TikTok"], ["telegram", "Telegram"], ["whatsapp", "WhatsApp"], ["email", "Email"], ["website", "Website"]]);
  var LINK_ICONS = [["none", "Tanpa ikon"], ["link", "Rantai (link)"], ["star", "Bintang"]].concat(
    SOCIAL_TYPES.filter(function (t) { return t[0] !== "custom"; }));

  function typeLabel(t) {
    for (var i = 0; i < SOCIAL_TYPES.length; i++) if (SOCIAL_TYPES[i][0] === t) return SOCIAL_TYPES[i][1];
    return t;
  }

  function iconSvg(type) {
    var d = ICONS[type] || ICONS.website;
    return '<svg viewBox="0 0 24 24" ' + (d.fill ? 'fill="currentColor"' : STROKE) + ' aria-hidden="true" focusable="false">' + d.svg + "</svg>";
  }

  function themeIconSvg() {
    var id = "ttm" + (++idCounter), rays = "";
    for (var i = 0; i < 8; i++) rays += '<line x1="12" y1="1.5" x2="12" y2="3.5" transform="rotate(' + i * 45 + ' 12 12)"/>';
    return '<svg class="tt" viewBox="0 0 24 24" aria-hidden="true" focusable="false">' +
      '<defs><mask id="' + id + '"><rect width="24" height="24" fill="#fff"/><circle class="tt-cut" cx="12" cy="12" r="6.5" fill="#000"/></mask></defs>' +
      '<g mask="url(#' + id + ')"><circle class="tt-core" cx="12" cy="12" r="5" fill="currentColor"/></g>' +
      '<g class="tt-rays" stroke="currentColor" stroke-width="2" stroke-linecap="round">' + rays + "</g></svg>";
  }

  /* ---------- config ---------- */
  function defaults() { return clone(window.PROFILE_CONFIG || {}); }

  /* config lama: assets.thumb -> assets.favicon (thumb sudah dipisah jadi favicon + og) */
  function migrate(c) {
    var a = c && c.assets;
    if (a && a.thumb !== undefined) {
      if (!a.favicon && typeof a.thumb === "string" && a.thumb.indexOf("data:") === 0) a.favicon = a.thumb;
      delete a.thumb;
    }
    return c;
  }

  function loadDraft() {
    try {
      var raw = localStorage.getItem(DRAFT_KEY);
      return raw ? migrate(JSON.parse(raw)) : null;
    } catch (e) { return null; }
  }
  function saveDraft(cfg) {
    try { localStorage.setItem(DRAFT_KEY, JSON.stringify(cfg)); return true; }
    catch (e) { return false; }
  }
  function clearDraft() {
    try { localStorage.removeItem(DRAFT_KEY); } catch (e) {}
  }

  function configure(opts) {
    Object.keys(opts || {}).forEach(function (k) { runtime[k] = opts[k]; });
  }

  /* ---------- tema ---------- */
  function resolveMode(cfg) {
    var m = runtime.mode;
    if (!m && runtime.persist) m = lsGet(MODE_KEY);
    if (m !== "light" && m !== "dark") m = (cfg.theme && cfg.theme.mode) || "dark";
    if (m === "system") {
      m = window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
    }
    return m === "light" ? "light" : "dark";
  }

  function applyTheme(target, cfg) {
    runtime.target = target;
    runtime.cfg = cfg;
    var t = cfg.theme || {};
    var mode = resolveMode(cfg);
    runtime.current = mode;
    var P = t[mode] || {};
    var s = target.style;

    target.setAttribute("data-theme", mode);
    target.setAttribute("data-orb", t.orbAnimate === false ? "off" : "on");
    s.setProperty("color-scheme", mode);

    s.setProperty("--page-bg", P.pageBg);
    s.setProperty("--orb-1", P.orb1);
    s.setProperty("--orb-2", P.orb2);
    s.setProperty("--orb-3", P.orb3);
    s.setProperty("--card-bg", hexToRgba(P.cardBg, P.cardOpacity == null ? 0.5 : P.cardOpacity));
    s.setProperty("--card-solid", P.cardBg);
    s.setProperty("--cut", mode === "dark" ? mixHex(P.cardBg, "#000000", 0.35) : P.cardBg);
    s.setProperty("--card-border", hexToRgba(P.cardBorder, P.cardBorderOpacity == null ? 0.3 : P.cardBorderOpacity));
    s.setProperty("--text", P.textColor);
    s.setProperty("--muted", P.mutedColor);
    s.setProperty("--link", P.linkColor);
    s.setProperty("--surface", hexToRgba(P.textColor, 0.06));
    s.setProperty("--line", hexToRgba(P.textColor, 0.13));
    s.setProperty("--follow-bg", P.followBg);
    s.setProperty("--follow-text", P.followText);

    s.setProperty("--accent", t.accent || "#7c5cff");
    s.setProperty("--blur", (t.glassBlur == null ? 18 : t.glassBlur) + "px");
    s.setProperty("--banner-1", t.bannerColor1);
    s.setProperty("--banner-2", t.bannerColor2);
    s.setProperty("--banner-3", t.bannerColor3);
    s.setProperty("--banner-speed", (t.bannerSpeed || 6) + "s");
    s.setProperty("--card-w", (t.cardWidth || 360) + "px");
    s.setProperty("--radius", (t.cardRadius == null ? 28 : t.cardRadius) + "px");
    s.setProperty("--avatar", (t.avatarSize || 96) + "px");
    s.setProperty("--avatar-radius", (t.avatarRadius == null ? 18 : t.avatarRadius) + "%");
    s.setProperty("--banner-h", (t.bannerHeight || 210) + "px");
    s.setProperty("--shadow", t.shadow === false ? "none"
      : (mode === "dark" ? "0 24px 60px rgba(0,0,0,0.5)" : "0 20px 50px rgba(60,50,140,0.2)"));
    var banner = cfg.assets && cfg.assets.banner;
    s.setProperty("--banner-img", banner ? 'url("' + absUrl(banner).replace(/"/g, "%22") + '")' : "none");

    /* bingkai, banner (rounded), ring foto profil */
    var bw = t.cardBorderWidth == null ? 1 : t.cardBorderWidth;
    var inset = t.bannerInset == null ? 8 : t.bannerInset;
    s.setProperty("--border-w", bw + "px");
    s.setProperty("--inset", inset + "px");
    s.setProperty("--banner-radius", bannerRadius(t, inset, bw));
    var ring = (cfg.avatar && cfg.avatar.ring) || {};
    var on = ring.show === true;
    var rw = on ? (ring.width == null ? 3 : ring.width) : 0;
    var rg = on ? (ring.gap == null ? 3 : ring.gap) : 5;
    var size = t.avatarSize || 96;
    s.setProperty("--ring-w", rw + "px");
    s.setProperty("--ring-gap", rg + "px");
    s.setProperty("--ring-bg", on ? paint(ring.mode, ring.color1, ring.color2, ring.angle) : "transparent");
    s.setProperty("--avatar-total", (size + 2 * (rw + rg)) + "px");

    /* ukuran ikon, perataan ikon di samping nama, posisi ikon sosial */
    var so0 = cfg.socials || {}, pr0 = cfg.profile || {};
    s.setProperty("--soc-size", (so0.size || 22) + "px");
    s.setProperty("--ver-size", (pr0.verifiedSize || 28) + "px");
    s.setProperty("--badge-align", { top: "flex-start", bottom: "flex-end", baseline: "baseline" }[pr0.badgeAlign] || "center");
    s.setProperty("--sx", (so0.x == null ? 50 : so0.x) + "%");
    s.setProperty("--sy", (so0.y == null ? 50 : so0.y) + "%");

    /* font & background */
    ensureFont(t.fontFamily);
    s.setProperty("--font", fontStack(t.fontFamily));
    var bgMode = t.bgMode === "image" && cfg.assets && cfg.assets.background ? "image" : (t.bgMode === "solid" ? "solid" : "orbs");
    target.setAttribute("data-bg", bgMode);
    s.setProperty("--bg-img", bgMode === "image" ? 'url("' + absUrl(cfg.assets.background).replace(/"/g, "%22") + '")' : "none");
    s.setProperty("--bg-blur", (t.bgBlur || 0) + "px");
    s.setProperty("--bg-dim", bgMode === "image" ? (t.bgDim == null ? 0.15 : t.bgDim) : 0);

    updateThemeButtons();
    return mode;
  }

  function bannerRadius(t, inset, bw) {
    var mode = t.bannerRadiusMode || "all";
    var r = t.bannerRadius == null ? 20 : t.bannerRadius;
    var outer = t.cardRadius == null ? 28 : t.cardRadius;
    var m = Math.max(0, outer - bw - inset);          // ikut lengkung card (konsentris)
    var v;
    if (mode === "bottom") v = [m, m, r, r];           // atas ikut card, 2 bawah membulat
    else if (mode === "top") v = [r, r, 0, 0];
    else if (mode === "match") v = [m, m, 0, 0];       // ikut shape card luar
    else if (mode === "square") v = [0, 0, 0, 0];
    else if (mode === "custom") v = [t.bannerRadiusTL, t.bannerRadiusTR, t.bannerRadiusBR, t.bannerRadiusBL].map(function (x) { return x == null ? r : x; });
    else v = [r, r, r, r];                             // 4 sisi
    return v.map(function (x) { return x + "px"; }).join(" ");
  }

  function updateThemeButtons() {
    if (!runtime.target) return;
    var next = runtime.current === "dark" ? "terang" : "gelap";
    Array.prototype.forEach.call(document.querySelectorAll(".theme-toggle"), function (b) {
      b.setAttribute("aria-label", "Ganti ke tema " + next);
      b.setAttribute("title", "Tema " + next);
      b.setAttribute("aria-pressed", runtime.current === "dark" ? "true" : "false");
    });
  }

  function setMode(mode) {
    runtime.mode = mode;
    if (runtime.persist && (mode === "light" || mode === "dark")) lsSet(MODE_KEY, mode);
    if (runtime.target && runtime.cfg) applyTheme(runtime.target, runtime.cfg);
  }

  function toggleMode() {
    setMode(runtime.current === "dark" ? "light" : "dark");
  }

  // Ikuti tema sistem bila config = "system" dan belum ada pilihan manual
  if (window.matchMedia) {
    var mq = window.matchMedia("(prefers-color-scheme: dark)");
    var onSys = function () {
      if (runtime.cfg && runtime.cfg.theme && runtime.cfg.theme.mode === "system" &&
          !runtime.mode && !(runtime.persist && lsGet(MODE_KEY))) applyTheme(runtime.target, runtime.cfg);
    };
    if (mq.addEventListener) mq.addEventListener("change", onSys);
    else if (mq.addListener) mq.addListener(onSys);
  }

  /* ---------- meta (title, favicon, dll) ---------- */
  function applyMeta(cfg) {
    var m = cfg.meta || {};
    if (m.lang) document.documentElement.lang = m.lang;
    if (m.title) document.title = m.title;
    function setMeta(sel, attr, val) {
      var n = document.head.querySelector(sel);
      if (n && val) n.setAttribute(attr, val);
    }
    setMeta('meta[name="description"]', "content", m.description);
    setMeta('meta[property="og:title"]', "content", m.title);
    setMeta('meta[property="og:description"]', "content", m.description);
    var a = cfg.assets || {};
    var og = siteAbs(a.og, m.siteUrl);
    setMeta('meta[property="og:image"]', "content", og);
    setMeta('meta[name="twitter:image"]', "content", og);
    setMeta('meta[name="twitter:title"]', "content", m.title);
    setMeta('meta[name="twitter:description"]', "content", m.description);
    setMeta('meta[property="og:url"]', "content", m.siteUrl);
    setMeta('link[rel="icon"]', "href", a.favicon);
    setMeta('link[rel="apple-touch-icon"]', "href", a.favicon);
  }

  /* path relatif -> URL penuh (wajib untuk og:image agar terbaca WhatsApp/Telegram/FB) */
  function siteAbs(p, siteUrl) {
    if (!p) return "";
    if (/^(https?:|data:)/i.test(p) || !siteUrl) return p;
    return String(siteUrl).replace(/\/*$/, "/") + String(p).replace(/^\.?\//, "");
  }

  /* blok tag <head> untuk favicon + link preview, dari config */
  function headTags(cfg) {
    var m = cfg.meta || {}, a = cfg.assets || {};
    function esc(s) { return String(s == null ? "" : s).replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;"); }
    var og = siteAbs(a.og, m.siteUrl);
    var L = [
      "<title>" + esc(m.title) + "</title>",
      '<meta name="description" content="' + esc(m.description) + '" />',
      '<link rel="icon" type="image/png" href="' + esc(a.favicon) + '" />',
      '<link rel="apple-touch-icon" href="' + esc(a.favicon) + '" />',
      "",
      '<meta property="og:type" content="profile" />',
      '<meta property="og:title" content="' + esc(m.title) + '" />',
      '<meta property="og:description" content="' + esc(m.description) + '" />'
    ];
    if (m.siteUrl) L.push('<meta property="og:url" content="' + esc(m.siteUrl) + '" />');
    L.push('<meta property="og:image" content="' + esc(og) + '" />',
      '<meta property="og:image:width" content="1200" />',
      '<meta property="og:image:height" content="630" />',
      '<meta name="twitter:card" content="summary_large_image" />',
      '<meta name="twitter:title" content="' + esc(m.title) + '" />',
      '<meta name="twitter:description" content="' + esc(m.description) + '" />',
      '<meta name="twitter:image" content="' + esc(og) + '" />');
    return L.join("\n");
  }

  /* ---------- helper render ---------- */
  function fmtCount(v, extra) {
    var s = String(v == null ? "" : v).trim();
    if (/^\d+$/.test(s)) return String(parseInt(s, 10) + (extra || 0));
    return s;
  }

  function editAttrs(path, type, label) {
    return { "data-edit": path, "data-type": type || "text", "data-label": label };
  }

  function withAttrs(base, extra) {
    Object.keys(extra).forEach(function (k) { base[k] = extra[k]; });
    return base;
  }

  // Tutup bubble "Verified" saat klik di luar (dipasang sekali)
  var tipTimer;
  function closeTips() {
    clearTimeout(tipTimer);
    Array.prototype.forEach.call(document.querySelectorAll(".verified-tip.open"), function (t) {
      t.classList.remove("open");
      var b = t.parentNode && t.parentNode.querySelector("[aria-expanded]");
      if (b) b.setAttribute("aria-expanded", "false");
    });
  }
  function bindTip(btn, tip) {
    btn.addEventListener("click", function () {
      var open = !tip.classList.contains("open");
      closeTips();
      if (open) {
        tip.classList.add("open");
        btn.setAttribute("aria-expanded", "true");
        tipTimer = setTimeout(closeTips, 2800);
      }
    });
    btn.addEventListener("keydown", function (e) {
      if (btn.tagName !== "BUTTON" && (e.key === "Enter" || e.key === " ") && e.target === btn) { e.preventDefault(); btn.click(); }
    });
  }
  document.addEventListener("click", function (e) {
    if (!e.target.closest || !e.target.closest(".verified-btn, .tip-trigger")) closeTips();
  });
  document.addEventListener("keydown", function (e) { if (e.key === "Escape") closeTips(); });

  /* ---------- render kartu ---------- */
  function panelAttrs(panel, label, pass) {
    var o = { "data-panel": panel, "data-label": label };
    if (pass) o["data-pass"] = "1";
    return o;
  }

  /* Dibuka lewat file:// -> browser memblokir CSS mask-image dari file lokal.
     Fallback: tampilkan gambar apa adanya (tanpa mask). Lewat http(s) / hosting, mask jalan normal. */
  var FILE_MODE = location.protocol === "file:";
  function okColor(c) { return typeof c === "string" && /^#[0-9a-f]{3,8}$/i.test(c.trim()) ? c.trim() : ""; }

  function customIcon(item) {
    var span = document.createElement("span");
    var needRaw = item.tint === false;
    var fileFallback = !needRaw && FILE_MODE && item.icon && !/^(data:|blob:|https?:)/i.test(item.icon);
    span.className = "custom-ico" + (needRaw || fileFallback ? " raw" : "") + (fileFallback ? " file-fallback" : "");
    var u = item.icon ? 'url("' + absUrl(item.icon).replace(/"/g, "%22") + '")' : "none";
    span.style.setProperty("--ico", u);
    return span;
  }

  function iconNode(type, item) {
    if (type === "custom") return customIcon(item || {});
    var w = document.createElement("span");
    w.className = "ico";
    w.innerHTML = iconSvg(type);
    return w;
  }

  /* ---------- isi More Info: section -> baris / gambar / teks ---------- */
  function buildSection(sec, s) {
    var cols = Math.max(1, Math.min(3, parseInt(sec.columns, 10) || 1));
    var wrap = el("div", { class: "msec", "data-effect": sec.effect || "none", "data-sort": "section",
      "data-sort-path": "cta.sections", "data-sort-idx": s, "data-sort-label": "Section " + (s + 1) });
    wrap.style.setProperty("--cols", cols);
    wrap.style.setProperty("--sgap", (sec.gap == null ? 10 : sec.gap) + "px");
    if (sec.showTitle !== false && sec.title) {
      wrap.appendChild(el("h3", withAttrs({ class: "msec-title", "data-align": sec.titleAlign || "center", text: sec.title },
        editAttrs("cta.sections." + s + ".title", "text", "Judul section"))));
      var ttl = wrap.lastChild, tc = okColor(sec.titleColor);
      ttl.setAttribute("data-color-path", "cta.sections." + s + ".titleColor");
      if (tc) ttl.style.color = tc;
    }
    var box = el("div", { class: "msec-items" });
    (sec.items || []).forEach(function (it, j) {
      if (!it) return;
      var n = buildItem(it, s, j);
      n.style.setProperty("--i", j);
      box.appendChild(n);
    });
    wrap.appendChild(box);
    return wrap;
  }

  function buildItem(it, s, j) {
    var base = "cta.sections." + s + ".items." + j;
    var sortAttrs = { "data-sort": "row", "data-sort-path": "cta.sections." + s + ".items", "data-sort-idx": j };
    var type = it.type === "image" || it.type === "text" ? it.type : "row";

    if (type === "image") {
      var box = el("div", withAttrs({ class: "mimg", "data-align": it.align || "center", "data-sort-label": "Gambar" }, sortAttrs));
      box.style.setProperty("--ih", (it.height || 120) + "px");
      box.style.setProperty("--ir", (it.radius == null ? 14 : it.radius) + "px");
      if (it.span !== "1") box.style.gridColumn = "1 / -1";
      var im = el("div", withAttrs({ class: "mimg-pic", "data-fit": it.fit || "cover" }, editAttrs(base + ".src", "image", "Gambar")));
      if (it.src) im.appendChild(el("img", { src: it.src, alt: it.caption || "", draggable: "false" }));
      else im.textContent = "Klik untuk memilih gambar";
      box.appendChild(im);
      if (it.caption) {
        var cap = el("div", withAttrs({ class: "mimg-cap", text: it.caption }, editAttrs(base + ".caption", "text", "Keterangan gambar")));
        cap.setAttribute("data-color-path", base + ".color");
        if (okColor(it.color)) cap.style.color = okColor(it.color);
        box.appendChild(cap);
      }
      return box;
    }

    if (type === "text") {
      var t = el("p", withAttrs({ class: "mtext", "data-align": it.align || "left", text: it.text, "data-multiline": "1", "data-sort-label": "Teks" },
        editAttrs(base + ".text", "text", "Teks")));
      Object.keys(sortAttrs).forEach(function (k) { t.setAttribute(k, sortAttrs[k]); });
      t.setAttribute("data-color-path", base + ".color");
      if (okColor(it.color)) t.style.color = okColor(it.color);
      if (it.span === "1") t.style.gridColumn = "auto"; else t.style.gridColumn = "1 / -1";
      return t;
    }

    var tone = ["soft", "dark", "none", "glass", "custom"].indexOf(it.tone) !== -1 ? it.tone : "soft";
    var row = el("div", withAttrs({ class: "mrow", "data-tone": tone, "data-effect": it.effect || "none", "data-sort-label": "Baris" }, sortAttrs));
    if (it.span === "all") row.style.gridColumn = "1 / -1";
    if (tone === "custom") row.style.background = paint(it.customMode === "gradient" ? "gradient" : "solid", it.customColor1, it.customColor2, 135);
    if (it.label) {
      var kNode = el("span", withAttrs({ class: "k", text: it.label }, editAttrs(base + ".label", "text", "Label")));
      kNode.setAttribute("data-color-path", base + ".labelColor");
      if (okColor(it.labelColor)) kNode.style.color = okColor(it.labelColor);
      row.appendChild(kNode);
    }
    var right = el("div", { class: "mright", "data-align": it.iconAlign || "right" });
    if (it.value) {
      var vNode = el("span", withAttrs({ class: "v", text: it.value }, editAttrs(base + ".value", "text", "Isi")));
      vNode.setAttribute("data-color-path", base + ".valueColor");
      if (okColor(it.valueColor)) vNode.style.color = okColor(it.valueColor);
      right.appendChild(vNode);
    }
    var icons = (it.icons || []).map(function (ic, k) { return { ic: ic, k: k }; }).filter(function (x) { return x.ic && x.ic.src; });
    if (icons.length) {
      var wrapI = el("div", { class: "micons", "data-shape": it.iconShape || "rounded" });
      wrapI.style.setProperty("--isz", (it.iconSize || 28) + "px");
      var max = it.maxIcons > 0 ? it.maxIcons : icons.length;
      icons.forEach(function (x, n) {
        var attrs = { class: "mico" + (n >= max ? " extra" : ""), title: x.ic.name || null };
        if (x.ic.url) attrs.href = safeUrl(x.ic.url);
        var node = el(x.ic.url ? "a" : "span", withAttrs(attrs, editAttrs(base + ".icons." + x.k + ".src", "image", "Ikon " + (x.k + 1))));
        if (x.ic.url) linkAttrs(node);
        node.appendChild(el("img", { src: x.ic.src, alt: x.ic.name || "", draggable: "false" }));
        wrapI.appendChild(node);
      });
      var extra = icons.length - max;
      if (extra > 0) {
        var badge = el("button", { class: "mmore", type: "button", "aria-expanded": "false", title: "Tampilkan semua" });
        badge.textContent = extra + "+";
        badge.addEventListener("click", function () {
          var ex = wrapI.classList.toggle("expanded");
          badge.textContent = ex ? "−" : extra + "+";
          badge.setAttribute("aria-expanded", ex ? "true" : "false");
        });
        wrapI.appendChild(badge);
      }
      right.appendChild(wrapI);
    }
    row.appendChild(right);
    return row;
  }

  function render(root, cfg) {
    var a = cfg.assets || {}, p = cfg.profile || {}, th = cfg.theme || {};
    var fo = cfg.follow || {}, so = cfg.socials || {}, lk = cfg.links || {}, cta = cfg.cta || {};
    var ring = (cfg.avatar && cfg.avatar.ring) || {};
    var lb = p.labels || {};
    root.textContent = "";

    var followed = runtime.followed === null ? (runtime.persist && lsGet(FOLLOW_KEY) === "1") : runtime.followed;
    var saved = runtime.saved === null ? (runtime.persist && lsGet(SAVE_KEY) === "1") : runtime.saved;

    /* ===== banner ===== */
    var banner = el("div", withAttrs({
      class: "banner",
      "data-mode": th.bannerMode || "gradient",
      "data-animate": th.bannerAnimate === false ? "false" : "true",
      role: "img",
      "aria-hidden": "true"
    }, editAttrs("assets.banner", "image", "Banner")));

    var themeBtn = el("button", withAttrs({ class: "icon-btn theme-toggle", type: "button" }, panelAttrs("theme.mode", "Tema", true)));
    themeBtn.innerHTML = themeIconSvg();
    themeBtn.addEventListener("click", function () {
      themeBtn.classList.remove("spin");
      void themeBtn.offsetWidth;
      themeBtn.classList.add("spin");
      toggleMode();
    });

    var bookmark = null;
    if (cfg.bookmark && cfg.bookmark.show !== false) {
      bookmark = el("button", withAttrs({ class: "icon-btn bookmark", type: "button", "aria-pressed": saved ? "true" : "false" }, panelAttrs("bookmark.show", "Tombol simpan")));
      var setBm = function (on) {
        bookmark.setAttribute("aria-pressed", on ? "true" : "false");
        bookmark.setAttribute("aria-label", on ? "Hapus dari simpanan" : "Simpan");
        bookmark.setAttribute("title", on ? "Tersimpan" : "Simpan");
      };
      bookmark.innerHTML = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/></svg>';
      setBm(saved);
      bookmark.addEventListener("click", function () {
        var on = bookmark.getAttribute("aria-pressed") !== "true";
        runtime.saved = on;
        if (runtime.persist) lsSet(SAVE_KEY, on ? "1" : "0");
        setBm(on);
        bookmark.classList.remove("pop");
        void bookmark.offsetWidth;
        bookmark.classList.add("pop");
      });
    }

    /* ===== tombol Follow (di bawah banner / di banner) ===== */
    var followCount = null;
    var fbtn = null;
    if (fo.show !== false) {
      fbtn = el("button", withAttrs({ class: "follow-btn", type: "button", "aria-pressed": followed ? "true" : "false" }, panelAttrs("follow.position", "Tombol Follow")));
      var flabel = el("span", withAttrs({ text: followed ? fo.doneText : fo.text },
        editAttrs(followed ? "follow.doneText" : "follow.text", "text", followed ? "Teks setelah follow" : "Teks tombol follow")));
      fbtn.appendChild(flabel);
      fbtn.addEventListener("click", function () {
        var on = fbtn.getAttribute("aria-pressed") !== "true";
        runtime.followed = on;
        if (runtime.persist) lsSet(FOLLOW_KEY, on ? "1" : "0");
        fbtn.setAttribute("aria-pressed", on ? "true" : "false");
        flabel.textContent = on ? fo.doneText : fo.text;
        flabel.setAttribute("data-edit", on ? "follow.doneText" : "follow.text");
        flabel.setAttribute("data-panel", on ? "follow.doneText" : "follow.text");
        if (followCount) followCount.textContent = fmtCount(fo.followers, on ? 1 : 0);
      });
    }
    var followBelow = fbtn && fo.position !== "banner";

    /* ===== ikon sosial ===== */
    var SOC_POS = ["bottom-right", "bottom-center", "after-avatar", "top-center", "center", "right-column", "left-column", "custom"];
    var pos = SOC_POS.indexOf(so.pos) !== -1 ? so.pos : "bottom-right";
    var colPreset = pos === "right-column" || pos === "left-column";
    var items = (so.items || []).filter(function (s) { return s && s.type; });
    var followInBanner = fbtn && !followBelow;
    var merged = followInBanner && pos === "bottom-right";   // sejajar dengan tombol Follow di pojok kanan bawah
    var socialsNode = null;
    if (so.show !== false && items.length) {
      socialsNode = el("div", {
        class: "socials", role: "list",
        "data-style": so.style === "glass" ? "glass" : "plain",
        "data-dir": colPreset || so.direction === "column" ? "column" : "row",
        "data-pos": merged ? null : pos
      }, items.map(function (s, i) {
        var link = el("a", withAttrs({
          class: "soc", role: "listitem", href: safeUrl(s.url), draggable: "false",
          "aria-label": s.label || typeLabel(s.type), title: s.label || typeLabel(s.type)
        }, editAttrs("socials.items." + i + ".url", "link", "Link " + (s.type === "custom" ? "ikon " + (i + 1) : typeLabel(s.type)))));
        link.appendChild(iconNode(s.type, s));
        linkAttrs(link);
        return link;
      }));
    }
    var actionNodes = [];
    if (merged && socialsNode) actionNodes.push(socialsNode);
    if (followInBanner) actionNodes.push(fbtn);
    var actions = actionNodes.length ? el("div", { class: "banner-actions" }, actionNodes) : null;

    var bannerBox = el("div", { class: "banner-box" }, [banner, themeBtn, bookmark, merged ? null : socialsNode, actions]);

    /* ===== foto profil + ring ===== */
    var avatar = el("div", withAttrs({ class: "avatar" }, editAttrs("assets.profile", "image", "Foto profil")));
    function showInitials() { avatar.textContent = initials(p.name); }
    if (a.profile) {
      var img = el("img", { src: a.profile, alt: p.name || "Profile", width: "200", height: "200" });
      img.addEventListener("error", function () { img.remove(); showInitials(); });
      avatar.appendChild(img);
    } else showInitials();
    var gapBox = el("div", withAttrs({ class: "avatar-gap" }, panelAttrs("avatar.ring.show", "Ring foto profil")), [avatar]);
    var ringBox = el("div", withAttrs({ class: "avatar-ring", "data-ring": ring.show === true ? "on" : "off" }, panelAttrs("avatar.ring.show", "Ring foto profil")), [gapBox]);
    var head = el("div", { class: "card-head" }, [ringBox, followBelow ? fbtn : null]);

    /* ===== nama + verified + label ===== */
    var name = el("h1", { class: "name" });
    name.appendChild(el("span", withAttrs({ class: "name-text", text: p.name }, editAttrs("profile.name", "text", "Nama"))));
    var vSrc = p.verifiedStyle === "white" ? a.verifiedWhite : a.verified;
    var vNode = null;
    if (p.verified !== false && vSrc) {
      var vText = p.verifiedText || "Verified";
      var vbtn = el("button", { class: "verified-btn", type: "button", "aria-label": vText, "aria-expanded": "false" });
      vbtn.appendChild(el("img", withAttrs({ class: "verified", src: vSrc, alt: "" },
        editAttrs(p.verifiedStyle === "white" ? "assets.verifiedWhite" : "assets.verified", "image", "Ikon verified"))));
      var tip = el("span", withAttrs({ class: "verified-tip", role: "status", text: vText },
        editAttrs("profile.verifiedText", "text", "Teks yang muncul saat verified diklik")));
      bindTip(vbtn, tip);
      vNode = el("span", { class: "verified-wrap" }, [vbtn, tip]);
      if (p.verifiedOffsetY) vNode.style.transform = "translateY(" + p.verifiedOffsetY + "px)";
    }
    var labelNodes = [];
    if (lb.show !== false) {
      (lb.items || []).forEach(function (l, i) {
        if (!l) return;
        var hasIcon = l.icon && l.icon !== "none" && (l.icon !== "custom" || l.iconSrc);
        if (!l.text && !hasIcon) return;
        var base = "profile.labels.items." + i;
        var iconOnly = l.style === "icon";
        var pill = el("span", withAttrs({ class: "label-pill" + (iconOnly ? " icon-only" : "") }, panelAttrs(base + ".text", "Label " + (i + 1))));
        if (iconOnly) {
          pill.style.setProperty("--lsz", (l.size || 20) + "px");
          if (l.textColor) pill.style.color = l.textColor;
        } else {
          pill.style.background = paint(l.mode, l.color1, l.color2, 135);
          pill.style.color = l.textColor || "#ffffff";
          if (l.size) pill.style.setProperty("--lsz", l.size + "px");
        }
        if (hasIcon) pill.appendChild(l.icon === "custom" ? customIcon({ icon: l.iconSrc, tint: l.tint }) : iconNode(l.icon));
        if (l.text) pill.appendChild(el("span", withAttrs({ text: l.text }, editAttrs(base + ".text", "text", "Label " + (i + 1)))));
        var lw = el("span", { class: "label-wrap" }, [pill]);
        if (l.tip) {
          var ltip = el("span", withAttrs({ class: "verified-tip", role: "status", text: l.tip }, editAttrs(base + ".tip", "text", "Teks saat label diklik")));
          pill.classList.add("tip-trigger");
          pill.setAttribute("role", "button");
          pill.setAttribute("tabindex", "0");
          pill.setAttribute("aria-expanded", "false");
          bindTip(pill, ltip);
          lw.appendChild(ltip);
        }
        if (l.offsetY) lw.style.transform = "translateY(" + l.offsetY + "px)";
        labelNodes.push(lw);
      });
    }
    (p.verifiedPos === "after" ? labelNodes.concat([vNode]) : [vNode].concat(labelNodes)).forEach(function (n) { if (n) name.appendChild(n); });

    var handle = p.username ? el("div", withAttrs({ class: "handle", text: p.username }, editAttrs("profile.username", "text", "Username"))) : null;
    var desc = p.description ? el("p", withAttrs({ class: "desc", text: p.description, "data-multiline": "1" }, editAttrs("profile.description", "text", "Bio (Enter = baris baru, klik di luar = simpan)"))) : null;

    /* ===== Following / Followers ===== */
    var stats = null;
    if (fo.statsShow !== false) {
      followCount = el("span", withAttrs({ class: "num", text: fmtCount(fo.followers, followed ? 1 : 0) }, editAttrs("follow.followers", "text", "Jumlah followers")));
      stats = el("div", { class: "follow-stats" }, [
        el("span", { class: "fs fs-following" }, [
          el("span", withAttrs({ class: "num", text: fo.following }, editAttrs("follow.following", "text", "Jumlah following"))),
          el("span", withAttrs({ text: fo.followingLabel }, editAttrs("follow.followingLabel", "text", "Label following")))
        ]),
        el("span", { class: "fs fs-followers" }, [
          followCount,
          el("span", withAttrs({ text: fo.followersLabel }, editAttrs("follow.followersLabel", "text", "Label followers")))
        ])
      ]);
    }

    /* ===== link-link di bawah Following/Followers ===== */
    var linksBox = null;
    var lkItems = (lk.items || []).filter(function (l) { return l && (l.text || l.url); });
    if (lk.show !== false && lkItems.length) {
      linksBox = el("div", { class: "links" }, lkItems.map(function (l) {
        var i = (lk.items || []).indexOf(l);
        var pill = l.style === "pill";
        var link = el("a", { class: "link" + (pill ? " pill" : ""), href: safeUrl(l.url || l.text) });
        var col = l.mode === "solid" || l.mode === "gradient" ? l.color1 : null;
        if (pill) {
          link.style.background = paint(l.mode === "gradient" ? "gradient" : "solid", l.color1, l.color2, 135);
          link.style.color = l.textColor || "#ffffff";
        } else if (l.mode === "gradient") {
          link.style.color = l.color1;
          link.setAttribute("data-grad", "1");
          link.style.setProperty("--grad", paint("gradient", l.color1, l.color2, 90));
        } else if (col) link.style.color = col;
        if (l.icon && l.icon !== "none") link.appendChild(iconNode(l.icon, l));
        link.appendChild(el("span", withAttrs({ class: "link-text", text: l.text || l.url }, editAttrs("links.items." + i + ".text", "text", "Teks link " + (i + 1)))));
        linkAttrs(link);
        return link;
      }));
    }

    /* ===== copyright ===== */
    var cp = cfg.copyright || {};
    var cpNode = null;
    if (cp.show !== false && cp.text) {
      cpNode = el("div", withAttrs({ class: "copyright", "data-align": cp.align || "center", text: cp.text }, editAttrs("copyright.text", "text", "Teks copyright")));
      cpNode.style.fontSize = (cp.size || 12) + "px";
    }
    var cpInside = cpNode && cp.placement === "inside";
    var blocks = { name: name, handle: handle, desc: desc, stats: stats, links: linksBox, more: null, copyright: cpInside ? null : cpNode };

    /* ===== More Info: tombol + section yang memanjang ke bawah ===== */
    var more = null;
    if (cta.show !== false) {
      var isOpen = runtime.open === null ? !!cta.defaultOpen : !!runtime.open;
      var panelId = "more" + (++idCounter);
      var shape = cta.shapeMode === "solid" || cta.shapeMode === "gradient" ? cta.shapeMode : "glass";
      var trigger = el("div", withAttrs({ class: "cta", role: "button", tabindex: "0", "data-shape": shape,
        "aria-expanded": isOpen ? "true" : "false", "aria-controls": panelId }, panelAttrs("cta.shapeMode", "Warna tombol More Info", true)));
      if (shape !== "glass") trigger.style.background = paint(shape, cta.shapeColor1, cta.shapeColor2, 135);
      var txtMode = cta.textMode === "solid" || cta.textMode === "gradient" ? cta.textMode : "auto";
      var label = el("span", withAttrs({ class: "cta-label", text: cta.text }, editAttrs("cta.text", "text", "Teks tombol")));
      if (txtMode === "solid") trigger.style.color = cta.textColor1;
      else if (txtMode === "gradient") {
        trigger.style.color = cta.textColor1;
        label.setAttribute("data-grad", "1");
        label.style.setProperty("--grad", paint("gradient", cta.textColor1, cta.textColor2, 90));
      }
      trigger.appendChild(label);
      var chev = el("span", { "aria-hidden": "true", style: "display:inline-flex" });
      chev.innerHTML = '<svg class="chev" viewBox="0 0 24 24"><polyline points="6 9 12 15 18 9"/></svg>';
      trigger.appendChild(chev);

      var body = el("div", { class: "more-body" });
      var secNodes = [];
      (Array.isArray(cta.sections) ? cta.sections : []).forEach(function (sec, si) { if (sec) secNodes.push(buildSection(sec, si)); });
      if (cta.actionShow !== false && cta.actionText) {
        var act = el("a", { class: "more-action", href: safeUrl(cta.actionUrl),
          "data-sort": "section", "data-sort-path": "cta.sections", "data-sort-idx": "action", "data-sort-label": "Tombol aksi" });
        act.appendChild(el("span", withAttrs({ text: cta.actionText }, editAttrs("cta.actionText", "text", "Teks tombol aksi"))));
        linkAttrs(act);
        var ai = parseInt(cta.actionIndex, 10);
        if (isNaN(ai) || ai < 0 || ai > secNodes.length) ai = secNodes.length;   // default: paling bawah
        secNodes.splice(ai, 0, act);
      }
      secNodes.forEach(function (n) { body.appendChild(n); });
      if (cpInside) body.appendChild(cpNode);

      var panel = el("div", { class: "more", id: panelId }, [el("div", { class: "more-inner" }, [body])]);
      more = el("div", { class: "more-wrap" + (isOpen ? " open" : "") }, [trigger, panel]);

      var toggle = function () {
        var open = !more.classList.contains("open");
        runtime.open = open;
        more.classList.toggle("open", open);
        trigger.setAttribute("aria-expanded", open ? "true" : "false");
        if (open) {
          setTimeout(function () {
            if (more.scrollIntoView) more.scrollIntoView({ behavior: "smooth", block: "nearest" });
          }, 420);
        }
      };
      trigger.addEventListener("click", toggle);
      trigger.addEventListener("keydown", function (e) {
        if (e.target !== trigger) return;
        if (e.key === "Enter" || e.key === " ") { e.preventDefault(); toggle(); }
      });
    }

    blocks.more = more;
    var order = normalizeOrder(cfg.layout && cfg.layout.order);
    var labelOf = {};
    BLOCKS.forEach(function (b) { labelOf[b[0]] = b[1]; });
    var content = el("div", { class: "content" });
    order.forEach(function (k) {
      var n = blocks[k];
      if (!n) return;
      n.setAttribute("data-block", k);
      n.setAttribute("data-block-label", labelOf[k]);
      content.appendChild(n);
    });
    [bannerBox, head, content].forEach(function (n) { if (n) root.appendChild(n); });
    updateThemeButtons();
  }

  /* ---------- boot untuk index.html ---------- */
  function boot(opts) {
    opts = opts || {};
    var cfg = defaults();
    var useDraft = /[?&]draft=1\b/.test(location.search);
    if (useDraft) { var d = loadDraft(); if (d) cfg = merge(cfg, d); }
    applyTheme(document.documentElement, cfg);
    applyMeta(cfg);
    render(document.getElementById(opts.mount || "card"), cfg);
    return cfg;
  }

  window.ProfileCard = {
    DRAFT_KEY: DRAFT_KEY,
    SOCIAL_TYPES: SOCIAL_TYPES, LINK_ICONS: LINK_ICONS, LABEL_ICONS: LABEL_ICONS, BLOCKS: BLOCKS, normalizeOrder: normalizeOrder, FONTS: FONTS,
    runtime: runtime,
    clone: clone, merge: merge, getPath: getPath, setPath: setPath,
    defaults: defaults, migrate: migrate, headTags: headTags, siteAbs: siteAbs, loadDraft: loadDraft, saveDraft: saveDraft, clearDraft: clearDraft,
    configure: configure, setMode: setMode, toggleMode: toggleMode,
    applyTheme: applyTheme, applyMeta: applyMeta, render: render, boot: boot
  };

  /* index.html: otomatis jalan bila ada elemen [data-autoboot] */
  function autoBoot() { if (document.querySelector("[data-autoboot]")) boot(); }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", autoBoot);
  else autoBoot();
})();
