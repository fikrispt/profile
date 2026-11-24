/**
 * CONFIG UTAMA — dibuat dari demo.html (2026-11-24)
 * Timpa file js/config.js dengan file ini.
 */
window.PROFILE_CONFIG = {
  "meta": {
    "lang": "id",
    "title": "Fikri Saputra — Profile Card",
    "description": "Kartu profil Fikri Saputra, Creative Designer.",
    "siteUrl": ""
  },
  "assets": {
    "profile": "assets/profile/ProfileArt.png",
    "banner": "assets/banner/bannerfixs.png",
    "favicon": "assets/favicon/favicon.png",
    "og": "assets/og/og.jpg",
    "verified": "assets/icon/verified.png",
    "verifiedWhite": "assets/icon/verified-white.png",
    "background": ""
  },
  "profile": {
    "name": "Fikri Saputra",
    "username": "@fikrisaputra",
    "description": "Creative Designer - Web Design",
    "verified": true,
    "verifiedStyle": "default",
    "verifiedText": "Verified",
    "verifiedSize": 20,
    "verifiedPos": "before",
    "badgeAlign": "center",
    "labels": {
      "show": false,
      "items": [
        {
          "text": "",
          "style": "icon",
          "icon": "custom",
          "iconSrc": "assets/uploads/img-01.png",
          "tint": true,
          "size": 16,
          "mode": "gradient",
          "color1": "#7c5cff",
          "color2": "#4f8bff",
          "textColor": "#ffffff",
          "offsetY": 0,
          "tip": "Tersedia untuk proyek baru"
        }
      ]
    },
    "verifiedOffsetY": 0
  },
  "avatar": {
    "ring": {
      "show": false,
      "mode": "gradient",
      "color1": "#7c5cff",
      "color2": "#ff7ab8",
      "angle": 135,
      "width": 3,
      "gap": 3
    }
  },
  "layout": {
    "order": [
      "name",
      "handle",
      "desc",
      "stats",
      "links",
      "more"
    ]
  },
  "bookmark": {
    "show": true
  },
  "socials": {
    "show": true,
    "style": "plain",
    "size": 22,
    "pos": "custom",
    "direction": "row",
    "x": 69.8,
    "y": 87.3,
    "items": [
      {
        "type": "custom",
        "url": "https://mailto:fikrisaputra.id@gmail.com",
        "icon": "assets/uploads/img-01.png"
      },
      {
        "type": "custom",
        "url": "https://github.com",
        "icon": "assets/uploads/img-02.png"
      },
      {
        "type": "custom",
        "url": "https://www.threads.com/@fikrispt",
        "icon": "assets/uploads/img-03.png"
      },
      {
        "type": "instagram",
        "url": "https://www.instagram.com/fikrispt"
      },
      {
        "type": "custom",
        "url": "https://www.tiktok.com/@fikrisaputra.id",
        "icon": "assets/uploads/img-03.png"
      },
      {
        "type": "custom",
        "url": "#",
        "icon": "assets/uploads/img-04.png"
      }
    ]
  },
  "follow": {
    "show": true,
    "position": "below",
    "text": "Follow",
    "doneText": "Followed",
    "statsShow": true,
    "following": "1",
    "followingLabel": "Following",
    "followers": "99K",
    "followersLabel": "Followers"
  },
  "links": {
    "show": true,
    "items": [
      {
        "text": "fikrisaputra",
        "url": "https://fikrispt.github.io/",
        "icon": "link",
        "style": "text",
        "mode": "auto",
        "color1": "#5aa9ff",
        "color2": "#a78bfa",
        "textColor": "#ffffff"
      },
      {
        "text": "fixs.arts",
        "url": "https://instagram.com/fixs.arts",
        "icon": "link",
        "style": "text",
        "mode": "auto",
        "color1": "#7c5cff",
        "color2": "#4f8bff",
        "textColor": "#ffffff"
      }
    ]
  },
  "cta": {
    "show": true,
    "text": "More Info",
    "defaultOpen": false,
    "shapeMode": "glass",
    "shapeColor1": "#7c5cff",
    "shapeColor2": "#5b34e6",
    "textMode": "auto",
    "textColor1": "#ffffff",
    "textColor2": "#c4b5fd",
    "sections": [
      {
        "title": "Tools",
        "showTitle": false,
        "titleAlign": "left",
        "columns": "1",
        "effect": "stagger",
        "gap": 9,
        "items": [
          {
            "type": "row",
            "label": "Tools",
            "value": "",
            "tone": "none",
            "iconSize": 28,
            "iconShape": "rounded",
            "iconAlign": "right",
            "maxIcons": 5,
            "effect": "lift",
            "icons": [
              {
                "src": "assets/uploads/img-05.svg",
                "name": "Photoshop",
                "url": ""
              },
              {
                "src": "assets/uploads/img-06.svg",
                "name": "Illustrator",
                "url": ""
              },
              {
                "src": "assets/uploads/img-07.svg",
                "name": "After Effects",
                "url": ""
              },
              {
                "src": "assets/uploads/img-08.png",
                "name": "SketchUp",
                "url": ""
              },
              {
                "src": "assets/uploads/img-09.png",
                "name": "CapCut",
                "url": ""
              },
              {
                "src": "assets/uploads/img-10.svg",
                "name": "Lightroom",
                "url": ""
              },
              {
                "src": "assets/uploads/img-11.svg",
                "name": "Premiere Pro",
                "url": ""
              },
              {
                "src": "assets/uploads/img-12.svg",
                "name": "InDesign",
                "url": ""
              }
            ],
            "span": "1",
            "customMode": "solid",
            "customColor1": "#1d1b3a",
            "customColor2": "#3a2f7a"
          },
          {
            "type": "row",
            "label": "Skill",
            "value": "Graphic Design · Web Design · 3D",
            "tone": "dark",
            "iconSize": 28,
            "iconShape": "rounded",
            "iconAlign": "right",
            "maxIcons": 0,
            "effect": "none",
            "icons": [],
            "span": "1",
            "customMode": "solid",
            "customColor1": "#332f6f",
            "customColor2": "#3a2f7a"
          }
        ]
      },
      {
        "title": "Judul",
        "showTitle": false,
        "titleAlign": "center",
        "columns": 1,
        "gap": 10,
        "effect": "stagger",
        "items": [
          {
            "type": "row",
            "label": "Experience",
            "value": "±7 Tahun",
            "tone": "dark",
            "customMode": "solid",
            "customColor1": "#1d1b3a",
            "customColor2": "#3a2f7a",
            "iconSize": 28,
            "iconShape": "rounded",
            "iconAlign": "right",
            "maxIcons": 0,
            "effect": "none",
            "icons": [],
            "span": "1",
            "src": "",
            "height": 120,
            "fit": "cover",
            "radius": 14,
            "caption": "",
            "text": "Teks",
            "align": "left"
          },
          {
            "type": "row",
            "label": "Open",
            "value": "Freelance & Collaboration",
            "tone": "custom",
            "customMode": "gradient",
            "customColor1": "#02032c",
            "customColor2": "#0a117b",
            "iconSize": 28,
            "iconShape": "rounded",
            "iconAlign": "right",
            "maxIcons": 0,
            "effect": "none",
            "icons": [],
            "span": "all",
            "src": "",
            "height": 120,
            "fit": "cover",
            "radius": 14,
            "caption": "",
            "text": "Teks",
            "align": "left",
            "labelColor": "#d6d9ff",
            "valueColor": "#ffffff"
          }
        ]
      },
      {
        "title": "Judul",
        "showTitle": false,
        "titleAlign": "center",
        "columns": 1,
        "gap": 10,
        "effect": "stagger",
        "items": []
      }
    ],
    "actionShow": false,
    "actionIndex": 99,
    "actionText": "Hubungi Saya",
    "actionUrl": "mailto:hello@fikrisaputra.com"
  },
  "theme": {
    "mode": "dark",
    "accent": "#7c5cff",
    "fontFamily": "Lato",
    "bgMode": "orbs",
    "bgBlur": 0,
    "bgDim": 0.15,
    "glassBlur": 35,
    "orbAnimate": true,
    "light": {
      "pageBg": "#f1f0fb",
      "orb1": "#a8beff",
      "orb2": "#94d1ff",
      "orb3": "#d1f1ff",
      "cardBg": "#ffffff",
      "cardOpacity": 0.85,
      "cardBorder": "#ffffff",
      "cardBorderOpacity": 0.7,
      "textColor": "#111827",
      "mutedColor": "#6b7280",
      "linkColor": "#2563eb",
      "followBg": "#111827",
      "followText": "#ffffff"
    },
    "dark": {
      "pageBg": "#0b0a14",
      "orb1": "#04549f",
      "orb2": "#2e158a",
      "orb3": "#144e99",
      "cardBg": "#241f3d",
      "cardOpacity": 0.9,
      "cardBorder": "#ffffff",
      "cardBorderOpacity": 0.15,
      "textColor": "#f5f5f7",
      "mutedColor": "#9a9aa6",
      "linkColor": "#5aa9ff",
      "followBg": "#ebebeb",
      "followText": "#1c1c1e"
    },
    "bannerMode": "image",
    "bannerColor1": "#00ffdd",
    "bannerColor2": "#ff99aa",
    "bannerColor3": "#ffd36b",
    "bannerAnimate": true,
    "bannerSpeed": 6,
    "bannerHeight": 190,
    "bannerInset": 8,
    "bannerRadiusMode": "all",
    "bannerRadius": 20,
    "bannerRadiusTL": 20,
    "bannerRadiusTR": 20,
    "bannerRadiusBR": 20,
    "bannerRadiusBL": 20,
    "cardWidth": 360,
    "cardRadius": 25,
    "cardBorderWidth": 1,
    "avatarSize": 84,
    "avatarRadius": 50,
    "shadow": true
  },
  "copyright": {
    "show": true,
    "text": "©2027 Fikri Saputra All Rights Reserved",
    "align": "center",
    "placement": "always",
    "size": 12
  }
};
