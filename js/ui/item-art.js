/* Item artwork.

   Windows are drawn with `var(--season-glass)` for their glass, so every
   window she owns looks out on the same day without any of them knowing
   what month it is. core/season.js sets it. The fallback keeps them honest
   anywhere the variable is not set.

   Two kinds of drawing:

   WEARABLES are drawn onto the pet, so they take the pet's live geometry and
   scale with it. A hat that fits the baby has to fit the grown axolotl too,
   which it does because every measurement below is a fraction of the head,
   never a fixed number.

   DECORATIONS are standalone, drawn in their own 100x100 box so the same
   function can serve the shop shelf, the collection book and the scene.
*/

const n = v => Math.round(v * 100) / 100;
const n2 = n;   // alias, so nested template helpers read clearly

/* ============================ WEARABLES ============================ */

/* g = { hx, hy, hrx, hry, bx, by, brx, bry, coat } — the pet's geometry.

   HEADROOM: the pet is drawn into viewBox "0 44 200 162", and the baby has
   the biggest head relative to that box, so nothing a hat draws may go
   higher than about 1.32 x hry above the head centre or it is silently
   clipped off the top. Tall hats lower their brim to buy height rather than
   growing upward past that line. */

const HATS = {
  bow: g => {
    const w = g.hrx * 0.30, y = g.hy - g.hry * 0.86;
    const loop = side => `<ellipse cx="${n(g.hx + side * w * 0.72)}" cy="${n(y)}"
        rx="${n(w * 0.62)}" ry="${n(w * 0.46)}" fill="#ef6f8e" stroke="#b34a66" stroke-width="2"
        transform="rotate(${side * 18} ${n(g.hx + side * w * 0.72)} ${n(y)})"/>`;
    return loop(-1) + loop(1) +
      `<circle cx="${n(g.hx)}" cy="${n(y)}" r="${n(w * 0.30)}" fill="#f78ba6" stroke="#b34a66" stroke-width="2"/>`;
  },

  party_hat: g => {
    const baseY = g.hy - g.hry * 0.52, w = g.hrx * 0.46, h = g.hry * 0.56;
    return `
      <path d="M ${n(g.hx - w)} ${n(baseY)} L ${n(g.hx)} ${n(baseY - h)} L ${n(g.hx + w)} ${n(baseY)} Z"
            fill="#f7b955" stroke="#c98d34" stroke-width="2.4" stroke-linejoin="round"/>
      <path d="M ${n(g.hx - w * 0.55)} ${n(baseY - h * 0.30)} L ${n(g.hx + w * 0.30)} ${n(baseY - h * 0.46)}"
            stroke="#e8f4fb" stroke-width="3" stroke-linecap="round"/>
      <path d="M ${n(g.hx - w * 0.25)} ${n(baseY - h * 0.62)} L ${n(g.hx + w * 0.22)} ${n(baseY - h * 0.72)}"
            stroke="#e8f4fb" stroke-width="3" stroke-linecap="round"/>
      <circle cx="${n(g.hx)}" cy="${n(baseY - h - 2)}" r="${n(w * 0.26)}" fill="#f2849f" stroke="#b34a66" stroke-width="2"/>`;
  },

  /* Halloween 2026. Soft purple rather than black, and the point leans back
     instead of stabbing upward, so it reads as dressing-up rather than spooky. */
  witch_hat: g => {
    const baseY = g.hy - g.hry * 0.46;
    const w = g.hrx * 0.52, h = g.hry * 0.84;
    const tipX = g.hx + w * 0.62, tipY = baseY - h;
    const bandY = baseY - g.hry * 0.16;
    return `
      <ellipse cx="${n(g.hx)}" cy="${n(baseY)}" rx="${n(g.hrx * 0.96)}" ry="${n(g.hry * 0.20)}"
               fill="#6b5590" stroke="#3f3159" stroke-width="2.4"/>
      <path d="M ${n(g.hx - w)} ${n(baseY)}
               Q ${n(g.hx - w * 0.30)} ${n(baseY - h * 0.58)} ${n(tipX)} ${n(tipY)}
               Q ${n(g.hx + w * 0.42)} ${n(baseY - h * 0.34)} ${n(g.hx + w)} ${n(baseY)} Z"
            fill="#7d64a6" stroke="#3f3159" stroke-width="2.4" stroke-linejoin="round"/>
      <path d="M ${n(g.hx - w * 0.92)} ${n(bandY)} Q ${n(g.hx)} ${n(bandY + g.hry * 0.07)} ${n(g.hx + w * 0.92)} ${n(bandY)}"
            fill="none" stroke="#f7b955" stroke-width="${n(g.hry * 0.14)}" stroke-linecap="round"/>
      <circle cx="${n(g.hx)}" cy="${n(bandY + g.hry * 0.03)}" r="${n(g.hrx * 0.09)}"
              fill="#ffd980" stroke="#c98d34" stroke-width="2"/>`;
  },

  /* A pet discovery. A soft cap with one long feather, angled so the gills
     stay visible underneath it. */
  feather_cap: g => {
    const y = g.hy - g.hry * 0.48, w = g.hrx * 0.88, dome = g.hry * 0.54;
    const quillX = g.hx + w * 0.34, quillY = y - dome * 0.72;
    const tipX = g.hx + w * 1.02, tipY = y - dome * 1.52;
    return `
      <path d="M ${n(g.hx - w)} ${n(y + g.hry * 0.08)}
               Q ${n(g.hx - w * 0.72)} ${n(y - dome)} ${n(g.hx)} ${n(y - dome)}
               Q ${n(g.hx + w * 0.72)} ${n(y - dome)} ${n(g.hx + w)} ${n(y + g.hry * 0.08)} Z"
            fill="#7fae8f" stroke="#43704f" stroke-width="2.6" stroke-linejoin="round"/>
      <path d="M ${n(g.hx - w * 0.52)} ${n(y - dome * 0.62)} Q ${n(g.hx - w * 0.18)} ${n(y - dome * 0.94)} ${n(g.hx + w * 0.16)} ${n(y - dome * 0.84)}"
            fill="none" stroke="#a8ceb4" stroke-width="3" stroke-linecap="round" opacity=".85"/>
      <path d="M ${n(g.hx - w * 1.10)} ${n(y + g.hry * 0.06)} Q ${n(g.hx)} ${n(y + g.hry * 0.34)} ${n(g.hx + w * 1.10)} ${n(y + g.hry * 0.06)}"
            fill="none" stroke="#e8d3ba" stroke-width="${n(g.hry * 0.20)}" stroke-linecap="round"/>
      <path d="M ${n(quillX)} ${n(quillY)}
               Q ${n(g.hx + w * 1.22)} ${n(y - dome * 1.36)} ${n(tipX)} ${n(tipY)}
               Q ${n(g.hx + w * 0.34)} ${n(y - dome * 1.30)} ${n(quillX)} ${n(quillY)} Z"
            fill="#f2849f" stroke="#a8465e" stroke-width="2.4" stroke-linejoin="round"/>
      <path d="M ${n(quillX)} ${n(quillY)} Q ${n(g.hx + w * 0.82)} ${n(y - dome * 1.42)} ${n(tipX)} ${n(tipY)}"
            fill="none" stroke="#a8465e" stroke-width="2.2" stroke-linecap="round"/>
      <circle cx="${n(quillX)}" cy="${n(quillY)}" r="${n(g.hrx * 0.075)}" fill="#ffd980" stroke="#c98d34" stroke-width="1.8"/>`;
  },

  /* Gathering Week. The cap of an acorn, textured rather than smooth. */
  acorn_hat: g => {
    const y = g.hy - g.hry * 0.20, w = g.hrx * 0.95, dome = g.hry * 0.72;
    return `
      <path d="M ${n(g.hx - w)} ${n(y)}
               Q ${n(g.hx)} ${n(y - dome * 1.9)} ${n(g.hx + w)} ${n(y)} Z"
            fill="#b07f4e" stroke="#7d5730" stroke-width="2.6" stroke-linejoin="round"/>
      ${[0.34, 0.62].map(k => `
        <path d="M ${n(g.hx - w * (1 - k * 0.55))} ${n(y - dome * k * 0.9)}
                 Q ${n(g.hx)} ${n(y - dome * (k * 0.9 + 0.30))} ${n(g.hx + w * (1 - k * 0.55))} ${n(y - dome * k * 0.9)}"
              fill="none" stroke="#8d6238" stroke-width="2.2" stroke-linecap="round" opacity=".65"/>`).join('')}
      <path d="M ${n(g.hx - w * 1.04)} ${n(y)} Q ${n(g.hx)} ${n(y + g.hry * 0.22)} ${n(g.hx + w * 1.04)} ${n(y)}"
            fill="none" stroke="#c9975f" stroke-width="${n(g.hry * 0.18)}" stroke-linecap="round"/>
      <path d="M ${n(g.hx)} ${n(y - dome * 1.24)} v ${n(-g.hry * 0.20)}"
            stroke="#7d5730" stroke-width="3.4" stroke-linecap="round"/>`;
  },

  /* Trim the Tree. The point flops forward, which keeps it inside the
     canvas and looks friendlier than a spike. */
  santa_hat: g => {
    const y = g.hy - g.hry * 0.44, w = g.hrx * 0.82, dome = g.hry * 0.72;
    const tipX = g.hx - w * 1.02, tipY = y - dome * 0.58;
    return `
      <path d="M ${n(g.hx - w)} ${n(y)}
               Q ${n(g.hx - w * 0.30)} ${n(y - dome * 1.5)} ${n(g.hx + w * 0.30)} ${n(y - dome * 1.26)}
               Q ${n(g.hx + w * 0.86)} ${n(y - dome * 0.9)} ${n(g.hx + w)} ${n(y)} Z"
            fill="#e2566f" stroke="#a23b50" stroke-width="2.6" stroke-linejoin="round"/>
      <path d="M ${n(g.hx - w * 0.72)} ${n(y - dome * 1.16)}
               Q ${n(g.hx - w * 1.20)} ${n(y - dome * 1.20)} ${n(tipX)} ${n(tipY)}"
            fill="none" stroke="#e2566f" stroke-width="${n(g.hry * 0.30)}" stroke-linecap="round"/>
      <path d="M ${n(g.hx - w * 1.06)} ${n(y)} Q ${n(g.hx)} ${n(y + g.hry * 0.26)} ${n(g.hx + w * 1.06)} ${n(y)}"
            fill="none" stroke="#fffdf9" stroke-width="${n(g.hry * 0.24)}" stroke-linecap="round"/>
      <circle cx="${n(tipX)}" cy="${n(tipY)}" r="${n(g.hrx * 0.15)}"
              fill="#fffdf9" stroke="#d9cbb6" stroke-width="2"/>`;
  },

  /* Spring Egg Hunt. Long ears on a band, leaning apart so both stay clear
     of the gills. */
  bunny_ears: g => {
    const y = g.hy - g.hry * 0.50;
    const ear = side => {
      const cx = g.hx + side * g.hrx * 0.36;
      const cy = y - g.hry * 0.34;
      const rx = g.hrx * 0.175, ry = g.hry * 0.46;
      const rot = side * 15;
      const spin = `rotate(${rot} ${n(cx)} ${n(cy)})`;
      return `
        <ellipse cx="${n(cx)}" cy="${n(cy)}" rx="${n(rx)}" ry="${n(ry)}"
                 fill="#fdf2f6" stroke="#c9a3b4" stroke-width="2.4" transform="${spin}"/>
        <ellipse cx="${n(cx)}" cy="${n(cy + ry * 0.06)}" rx="${n(rx * 0.48)}" ry="${n(ry * 0.64)}"
                 fill="#f7c8d8" transform="${spin}"/>`;
    };
    return `${ear(-1)}${ear(1)}
      <path d="M ${n(g.hx - g.hrx * 0.66)} ${n(y + g.hry * 0.10)} Q ${n(g.hx)} ${n(y + g.hry * 0.36)} ${n(g.hx + g.hrx * 0.66)} ${n(y + g.hry * 0.10)}"
            fill="none" stroke="#f4a8c6" stroke-width="${n(g.hry * 0.17)}" stroke-linecap="round"/>`;
  },

  flower_crown: g => {
    const y = g.hy - g.hry * 0.80, r = g.hrx * 0.115;
    const colours = ['#f2849f', '#ffd980', '#c9a3e0', '#8fd3a8', '#f7a8c6'];
    let out = `<path d="M ${n(g.hx - g.hrx * 0.62)} ${n(y + r * 0.6)}
                       Q ${n(g.hx)} ${n(y - r * 1.5)} ${n(g.hx + g.hrx * 0.62)} ${n(y + r * 0.6)}"
                    fill="none" stroke="#7fb98c" stroke-width="3.5" stroke-linecap="round"/>`;
    colours.forEach((c, i) => {
      const t = (i / (colours.length - 1)) * 2 - 1;
      const fx = g.hx + t * g.hrx * 0.58;
      const fy = y + Math.abs(t) * r * 1.4 - r * 0.9;
      for (let p = 0; p < 5; p++) {
        const a = (p / 5) * Math.PI * 2;
        out += `<circle cx="${n(fx + Math.cos(a) * r * 0.62)}" cy="${n(fy + Math.sin(a) * r * 0.62)}"
                        r="${n(r * 0.48)}" fill="${c}"/>`;
      }
      out += `<circle cx="${n(fx)}" cy="${n(fy)}" r="${n(r * 0.34)}" fill="#fff3cc"/>`;
    });
    return out;
  },

  wizard_hat: g => {
    const baseY = g.hy - g.hry * 0.54, w = g.hrx * 0.70, h = g.hry * 0.76;
    return `
      <path d="M ${n(g.hx - w)} ${n(baseY)}
               Q ${n(g.hx - w * 0.30)} ${n(baseY - h * 0.55)} ${n(g.hx + w * 0.22)} ${n(baseY - h)}
               Q ${n(g.hx + w * 0.34)} ${n(baseY - h * 0.40)} ${n(g.hx + w)} ${n(baseY)} Z"
            fill="#6b5aa6" stroke="#463a70" stroke-width="2.4" stroke-linejoin="round"/>
      <ellipse cx="${n(g.hx)}" cy="${n(baseY)}" rx="${n(w * 1.30)}" ry="${n(w * 0.30)}"
               fill="#7a68b8" stroke="#463a70" stroke-width="2.4"/>
      <path d="M ${n(g.hx - w * 0.72)} ${n(baseY - h * 0.16)} Q ${n(g.hx)} ${n(baseY - h * 0.34)} ${n(g.hx + w * 0.58)} ${n(baseY - h * 0.16)}"
            fill="none" stroke="#ffd980" stroke-width="4" stroke-linecap="round"/>
      <path d="M ${n(g.hx - w * 0.18)} ${n(baseY - h * 0.62)} l 3 7 7 3 -7 3 -3 7 -3 -7 -7 -3 7 -3 z" fill="#ffe9a8"/>`;
  },

  gold_crown: g => {
    const y = g.hy - g.hry * 0.78, w = g.hrx * 0.62, h = g.hry * 0.46;
    return `
      <path d="M ${n(g.hx - w)} ${n(y)} L ${n(g.hx - w)} ${n(y - h * 0.55)}
               L ${n(g.hx - w * 0.5)} ${n(y - h * 0.10)} L ${n(g.hx)} ${n(y - h)}
               L ${n(g.hx + w * 0.5)} ${n(y - h * 0.10)} L ${n(g.hx + w)} ${n(y - h * 0.55)}
               L ${n(g.hx + w)} ${n(y)} Z"
            fill="#f6c453" stroke="#c9922c" stroke-width="2.4" stroke-linejoin="round"/>
      <rect x="${n(g.hx - w)}" y="${n(y - h * 0.08)}" width="${n(w * 2)}" height="${n(h * 0.30)}"
            rx="${n(h * 0.12)}" fill="#ffd980" stroke="#c9922c" stroke-width="2"/>
      <circle cx="${n(g.hx)}" cy="${n(y - h * 0.92)}" r="${n(w * 0.16)}" fill="#ef6f8e" stroke="#b34a66" stroke-width="1.8"/>`;
  },

  flower_pin: g => {
    const x = g.hx + g.hrx * 0.50, y = g.hy - g.hry * 0.60, r = g.hrx * 0.20;
    return `<g>${[...Array(6)].map((_, i) => {
      const a = (i / 6) * Math.PI * 2;
      return `<ellipse cx="${n(x + Math.cos(a) * r * 0.86)}" cy="${n(y + Math.sin(a) * r * 0.86)}"
                       rx="${n(r * 0.62)}" ry="${n(r * 0.50)}"
                       transform="rotate(${n(a * 57.3)} ${n(x + Math.cos(a) * r * 0.86)} ${n(y + Math.sin(a) * r * 0.86)})"
                       fill="#fff" stroke="#dcc3b0" stroke-width="1.8"/>`;
    }).join('')}
    <circle cx="${n(x)}" cy="${n(y)}" r="${n(r * 0.46)}" fill="#ffd980" stroke="#e0b44c" stroke-width="1.8"/></g>`;
  },

  headband: g => {
    const y = g.hy - g.hry * 0.60;
    return `<path d="M ${n(g.hx - g.hrx * 0.94)} ${n(y + g.hry * 0.22)}
                     Q ${n(g.hx)} ${n(y - g.hry * 0.34)} ${n(g.hx + g.hrx * 0.94)} ${n(y + g.hry * 0.22)}"
                  fill="none" stroke="#6fb3d9" stroke-width="${n(g.hry * 0.17)}" stroke-linecap="round"/>
            <circle cx="${n(g.hx + g.hrx * 0.36)}" cy="${n(y - g.hry * 0.14)}" r="${n(g.hrx * 0.10)}"
                    fill="#f2849f" stroke="#b3596e" stroke-width="1.8"/>`;
  },

  sun_hat: g => {
    const y = g.hy - g.hry * 0.56;
    return `<ellipse cx="${n(g.hx)}" cy="${n(y)}" rx="${n(g.hrx * 1.12)}" ry="${n(g.hry * 0.30)}"
                     fill="#f0d79a" stroke="#c9a462" stroke-width="2.4"/>
            <path d="M ${n(g.hx - g.hrx * 0.52)} ${n(y)} a ${n(g.hrx * 0.52)} ${n(g.hry * 0.52)} 0 0 1 ${n(g.hrx * 1.04)} 0 z"
                  fill="#f7e2b0" stroke="#c9a462" stroke-width="2.4" stroke-linejoin="round"/>
            <path d="M ${n(g.hx - g.hrx * 0.50)} ${n(y - g.hry * 0.04)} q ${n(g.hrx * 0.50)} ${n(g.hry * 0.18)} ${n(g.hrx * 1.0)} 0"
                  fill="none" stroke="#e2566f" stroke-width="${n(g.hry * 0.12)}"/>`;
  },

  beanie: g => {
    const y = g.hy - g.hry * 0.32;
    return `<path d="M ${n(g.hx - g.hrx * 0.82)} ${n(y)} a ${n(g.hrx * 0.82)} ${n(g.hry * 0.72)} 0 0 1 ${n(g.hrx * 1.64)} 0 z"
                  fill="#8a7fc4" stroke="#5f568f" stroke-width="2.4" stroke-linejoin="round"/>
            <rect x="${n(g.hx - g.hrx * 0.88)}" y="${n(y - g.hry * 0.10)}"
                  width="${n(g.hrx * 1.76)}" height="${n(g.hry * 0.26)}" rx="${n(g.hry * 0.13)}"
                  fill="#a79ade" stroke="#5f568f" stroke-width="2.4"/>
            <circle cx="${n(g.hx)}" cy="${n(y - g.hry * 0.76)}" r="${n(g.hrx * 0.14)}"
                    fill="#fff6e8" stroke="#c9b8a4" stroke-width="2"/>`;
  },

  chef_hat: g => {
    const y = g.hy - g.hry * 0.36;
    return `<rect x="${n(g.hx - g.hrx * 0.46)}" y="${n(y - g.hry * 0.26)}"
                  width="${n(g.hrx * 0.92)}" height="${n(g.hry * 0.34)}" rx="${n(g.hry * 0.10)}"
                  fill="#fff6e8" stroke="#c9b8a4" stroke-width="2.4"/>
            <circle cx="${n(g.hx - g.hrx * 0.34)}" cy="${n(y - g.hry * 0.40)}" r="${n(g.hrx * 0.26)}" fill="#fff6e8" stroke="#c9b8a4" stroke-width="2.4"/>
            <circle cx="${n(g.hx + g.hrx * 0.34)}" cy="${n(y - g.hry * 0.40)}" r="${n(g.hrx * 0.26)}" fill="#fff6e8" stroke="#c9b8a4" stroke-width="2.4"/>
            <circle cx="${n(g.hx)}" cy="${n(y - g.hry * 0.54)}" r="${n(g.hrx * 0.28)}" fill="#fff6e8" stroke="#c9b8a4" stroke-width="2.4"/>`;
  },

  pirate_hat: g => {
    const y = g.hy - g.hry * 0.60;
    return `<path d="M ${n(g.hx - g.hrx * 1.06)} ${n(y + g.hry * 0.20)}
                     Q ${n(g.hx)} ${n(y - g.hry * 1.10)} ${n(g.hx + g.hrx * 1.06)} ${n(y + g.hry * 0.20)}
                     Q ${n(g.hx)} ${n(y - g.hry * 0.14)} ${n(g.hx - g.hrx * 1.06)} ${n(y + g.hry * 0.20)} Z"
                  fill="#3f3a52" stroke="#25223a" stroke-width="2.4" stroke-linejoin="round"/>
            <circle cx="${n(g.hx)}" cy="${n(y - g.hry * 0.40)}" r="${n(g.hrx * 0.13)}" fill="#fff6e8"/>
            <path d="M ${n(g.hx - g.hrx * 0.16)} ${n(y - g.hry * 0.18)} l ${n(g.hrx * 0.32)} ${n(g.hry * 0.16)}
                     M ${n(g.hx + g.hrx * 0.16)} ${n(y - g.hry * 0.18)} l ${n(-g.hrx * 0.32)} ${n(g.hry * 0.16)}"
                  stroke="#fff6e8" stroke-width="2.6" stroke-linecap="round"/>`;
  },

  tiara: g => {
    const y = g.hy - g.hry * 0.60, w = g.hrx * 0.74;
    return `
      <path d="M ${n(g.hx - w)} ${n(y + g.hry * 0.30)}
               L ${n(g.hx - w * 0.52)} ${n(y - g.hry * 0.30)}
               L ${n(g.hx - w * 0.22)} ${n(y + g.hry * 0.06)}
               L ${n(g.hx)} ${n(y - g.hry * 0.56)}
               L ${n(g.hx + w * 0.22)} ${n(y + g.hry * 0.06)}
               L ${n(g.hx + w * 0.52)} ${n(y - g.hry * 0.30)}
               L ${n(g.hx + w)} ${n(y + g.hry * 0.30)} Z"
            fill="#ffe9a8" stroke="#d8ae4c" stroke-width="2.6" stroke-linejoin="round"/>
      <circle cx="${n(g.hx)}" cy="${n(y - g.hry * 0.20)}" r="${n(g.hrx * 0.11)}"
              fill="#a8c8f0" stroke="#7f9fd0" stroke-width="2"/>
      <circle cx="${n(g.hx - w * 0.52)}" cy="${n(y - g.hry * 0.16)}" r="${n(g.hrx * 0.07)}" fill="#f7a8c6"/>
      <circle cx="${n(g.hx + w * 0.52)}" cy="${n(y - g.hry * 0.16)}" r="${n(g.hrx * 0.07)}" fill="#f7a8c6"/>
      <path d="M ${n(g.hx - w * 0.30)} ${n(y - g.hry * 0.74)} l 2.5 6 6 2.5 -6 2.5 -2.5 6 -2.5 -6 -6 -2.5 6 -2.5 z" fill="#fff3cc"/>`;
  },

  champion_crown: g => HATS.gold_crown(g) + `
      <path d="M ${n(g.hx - g.hrx * 0.95)} ${n(g.hy - g.hry * 1.15)} l 3 7 7 3 -7 3 -3 7 -3 -7 -7 -3 7 -3 z" fill="#ffe9a8"/>
      <path d="M ${n(g.hx + g.hrx * 0.86)} ${n(g.hy - g.hry * 1.02)} l 2.5 6 6 2.5 -6 2.5 -2.5 6 -2.5 -6 -6 -2.5 6 -2.5 z" fill="#fff3cc"/>`,
};

const ACCESSORIES = {
  bowtie: g => {
    const y = g.hy + g.hry * 1.02, w = g.hrx * 0.26;
    return `
      <path d="M ${n(g.hx - w)} ${n(y - w * 0.62)} L ${n(g.hx - w * 0.16)} ${n(y)}
               L ${n(g.hx - w)} ${n(y + w * 0.62)} Z"
            fill="#e2566f" stroke="#a23b50" stroke-width="2" stroke-linejoin="round"/>
      <path d="M ${n(g.hx + w)} ${n(y - w * 0.62)} L ${n(g.hx + w * 0.16)} ${n(y)}
               L ${n(g.hx + w)} ${n(y + w * 0.62)} Z"
            fill="#e2566f" stroke="#a23b50" stroke-width="2" stroke-linejoin="round"/>
      <circle cx="${n(g.hx)}" cy="${n(y)}" r="${n(w * 0.24)}" fill="#f0778c" stroke="#a23b50" stroke-width="1.8"/>`;
  },

  /* Birthday Week. A sash across the chest, following the body rather than
     sitting on top of it, so it fits every growth stage. */
  birthday_sash: g => {
    const x1 = g.bx - g.brx * 0.86, y1 = g.by - g.bry * 0.72;
    const x2 = g.bx + g.brx * 0.64, y2 = g.by + g.bry * 0.60;
    return `
      <path d="M ${n(x1)} ${n(y1)} Q ${n(g.bx)} ${n(g.by - g.bry * 0.05)} ${n(x2)} ${n(y2)}"
            fill="none" stroke="#e2566f" stroke-width="${n(g.brx * 0.30)}" stroke-linecap="round"/>
      <path d="M ${n(x1)} ${n(y1)} Q ${n(g.bx)} ${n(g.by - g.bry * 0.05)} ${n(x2)} ${n(y2)}"
            fill="none" stroke="#f7a8bb" stroke-width="${n(g.brx * 0.10)}" stroke-linecap="round"/>
      <circle cx="${n(x2 - g.brx * 0.06)}" cy="${n(y2 - g.bry * 0.06)}" r="${n(g.brx * 0.20)}"
              fill="#ffe08a" stroke="#d8ae4c" stroke-width="2"/>
      <circle cx="${n(x2 - g.brx * 0.06)}" cy="${n(y2 - g.bry * 0.06)}" r="${n(g.brx * 0.08)}" fill="#fffdf9"/>`;
  },

  /* Midnight Sparklers. A blower held up beside the cheek, uncurling away
     from the face so it never covers the smile. */
  party_horn: g => {
    const x = g.hx + g.hrx * 0.68, y = g.hy + g.hry * 0.42;
    const tipX = x + g.hrx * 0.86, tipY = y - g.hry * 0.30;
    return `
      <path d="M ${n(x)} ${n(y)} L ${n(tipX)} ${n(tipY - g.hry * 0.16)} L ${n(tipX)} ${n(tipY + g.hry * 0.20)} Z"
            fill="#6fb3d9" stroke="#3f7d9e" stroke-width="2.4" stroke-linejoin="round"/>
      <path d="M ${n(tipX)} ${n(tipY + g.hry * 0.02)}
               q ${n(g.hrx * 0.24)} ${n(-g.hry * 0.26)} ${n(g.hrx * 0.34)} ${n(g.hry * 0.02)}
               q ${n(g.hrx * 0.08)} ${n(g.hry * 0.22)} ${n(-g.hrx * 0.10)} ${n(g.hry * 0.18)}"
            fill="none" stroke="#f2849f" stroke-width="2.8" stroke-linecap="round"/>
      <circle cx="${n(x)}" cy="${n(y)}" r="${n(g.hrx * 0.10)}" fill="#ffd980" stroke="#c9922c" stroke-width="2"/>`;
  },

  scarf: g => {
    const y = g.hy + g.hry * 0.98, w = g.brx * 0.52, h = g.bry * 0.20;
    return `
      <rect x="${n(g.hx - w)}" y="${n(y - h / 2)}" width="${n(w * 2)}" height="${n(h)}"
            rx="${n(h * 0.45)}" fill="#e2566f" stroke="#a23b50" stroke-width="2"/>
      <rect x="${n(g.hx - w * 0.62)}" y="${n(y - h / 2)}" width="${n(w * 0.34)}" height="${n(h)}" fill="#f7b955"/>
      <rect x="${n(g.hx + w * 0.26)}" y="${n(y - h / 2)}" width="${n(w * 0.34)}" height="${n(h)}" fill="#f7b955"/>
      <rect x="${n(g.hx + w * 0.30)}" y="${n(y)}" width="${n(h * 0.9)}" height="${n(h * 2.1)}"
            rx="${n(h * 0.35)}" fill="#e2566f" stroke="#a23b50" stroke-width="2"/>`;
  },

  goggles: g => {
    const y = g.hy - g.hry * 0.16, r = g.hrx * 0.17;
    const lens = side => `
      <circle cx="${n(g.hx + side * g.hrx * 0.42)}" cy="${n(y)}" r="${n(r)}"
              fill="#bfe6f5" stroke="#4d7f92" stroke-width="3" opacity=".92"/>
      <circle cx="${n(g.hx + side * g.hrx * 0.42 - r * 0.3)}" cy="${n(y - r * 0.32)}" r="${n(r * 0.26)}" fill="#fff" opacity=".8"/>`;
    return `<path d="M ${n(g.hx - g.hrx * 1.0)} ${n(y - g.hry * 0.06)} Q ${n(g.hx)} ${n(y - g.hry * 0.30)} ${n(g.hx + g.hrx * 1.0)} ${n(y - g.hry * 0.06)}"
                 fill="none" stroke="#4d7f92" stroke-width="4" stroke-linecap="round"/>
            ${lens(-1)}${lens(1)}
            <rect x="${n(g.hx - g.hrx * 0.13)}" y="${n(y - 2.5)}" width="${n(g.hrx * 0.26)}" height="5" rx="2" fill="#4d7f92"/>`;
  },

  cape: g => {
    const topY = g.hy + g.hry * 0.92;
    /* A cape has to be wider than the body it hangs behind, or the body
       simply covers it. This sweeps well past the silhouette on both sides. */
    const w = g.brx * 1.52;
    return `
      <path d="M ${n(g.bx - g.brx * 0.40)} ${n(topY)}
               Q ${n(g.bx - w)} ${n(g.by + g.bry * 0.20)} ${n(g.bx - w * 0.86)} ${n(g.by + g.bry * 1.14)}
               Q ${n(g.bx)} ${n(g.by + g.bry * 0.84)} ${n(g.bx + w * 0.86)} ${n(g.by + g.bry * 1.14)}
               Q ${n(g.bx + w)} ${n(g.by + g.bry * 0.20)} ${n(g.bx + g.brx * 0.40)} ${n(topY)} Z"
            fill="#c0405e" stroke="#8a2b42" stroke-width="2.6" stroke-linejoin="round"/>
      <path d="M ${n(g.bx - w * 0.72)} ${n(g.by + g.bry * 0.70)}
               Q ${n(g.bx)} ${n(g.by + g.bry * 0.44)} ${n(g.bx + w * 0.72)} ${n(g.by + g.bry * 0.70)}"
            fill="none" stroke="#d9647e" stroke-width="2.4" opacity=".8"/>
      <rect x="${n(g.bx - g.brx * 0.46)}" y="${n(topY - g.bry * 0.12)}"
            width="${n(g.brx * 0.92)}" height="${n(g.bry * 0.22)}"
            rx="${n(g.bry * 0.11)}" fill="#f6c453" stroke="#c9922c" stroke-width="2.2"/>`;
  },

  star_glasses: g => {
    const y = g.hy - g.hry * 0.16, r = g.hrx * 0.20;
    const star = side => {
      const cx = g.hx + side * g.hrx * 0.42;
      let d = '';
      for (let i = 0; i < 10; i++) {
        const a = (Math.PI / 5) * i - Math.PI / 2;
        const rad = i % 2 ? r * 0.46 : r;
        d += `${i ? 'L' : 'M'} ${n(cx + Math.cos(a) * rad)} ${n(y + Math.sin(a) * rad)} `;
      }
      return `<path d="${d}Z" fill="#ffd980" stroke="#c9922c" stroke-width="2" stroke-linejoin="round"/>
              <circle cx="${n(cx)}" cy="${n(y)}" r="${n(r * 0.34)}" fill="#bfe6f5" opacity=".9"/>`;
    };
    return `<path d="M ${n(g.hx - g.hrx * 1.0)} ${n(y)} L ${n(g.hx + g.hrx * 1.0)} ${n(y)}"
                 stroke="#c9922c" stroke-width="3.4" stroke-linecap="round"/>${star(-1)}${star(1)}`;
  },

  bell_collar: g => {
    const y = g.hy + g.hry * 1.00, w = g.brx * 0.46;
    return `<path d="M ${n(g.hx - w)} ${n(y)} Q ${n(g.hx)} ${n(y + g.bry * 0.22)} ${n(g.hx + w)} ${n(y)}"
                  fill="none" stroke="#c0405e" stroke-width="${n(g.bry * 0.16)}" stroke-linecap="round"/>
            <circle cx="${n(g.hx)}" cy="${n(y + g.bry * 0.26)}" r="${n(g.bry * 0.15)}"
                    fill="#f6c453" stroke="#c9922c" stroke-width="2"/>
            <path d="M ${n(g.hx - g.bry * 0.07)} ${n(y + g.bry * 0.30)} h ${n(g.bry * 0.14)}"
                  stroke="#c9922c" stroke-width="2" stroke-linecap="round"/>`;
  },

  necklace: g => {
    const y = g.hy + g.hry * 1.02, w = g.brx * 0.44;
    const bead = (t, c) => {
      const a = Math.PI * t;
      return `<circle cx="${n(g.hx - Math.cos(a) * w)}" cy="${n(y + Math.sin(a) * g.bry * 0.26)}"
                      r="${n(g.bry * 0.09)}" fill="${c}" stroke="#8a6f7c" stroke-width="1.4"/>`;
    };
    return `<path d="M ${n(g.hx - w)} ${n(y)} Q ${n(g.hx)} ${n(y + g.bry * 0.34)} ${n(g.hx + w)} ${n(y)}"
                  fill="none" stroke="#c9a97c" stroke-width="2.2"/>
            ${[0.1, 0.3, 0.5, 0.7, 0.9].map((t, i) => bead(t, ['#f2849f', '#ffd980', '#8fd3a8', '#a8c8f0', '#c9a3e0'][i])).join('')}`;
  },

  flower_lei: g => {
    const y = g.hy + g.hry * 1.00, w = g.brx * 0.50;
    return [...Array(7)].map((_, i) => {
      const t = i / 6, a = Math.PI * t;
      const x = g.hx - Math.cos(a) * w, cy = y + Math.sin(a) * g.bry * 0.30;
      const c = ['#f7a8c6', '#ffd980', '#a8dcbb', '#f2849f', '#c9a3e0', '#ffd980', '#f7a8c6'][i];
      return [...Array(5)].map((_, k) => {
        const aa = (k / 5) * Math.PI * 2;
        return `<circle cx="${n(x + Math.cos(aa) * g.bry * 0.07)}" cy="${n(cy + Math.sin(aa) * g.bry * 0.07)}"
                        r="${n(g.bry * 0.055)}" fill="${c}"/>`;
      }).join('') + `<circle cx="${n(x)}" cy="${n(cy)}" r="${n(g.bry * 0.035)}" fill="#fff6e8"/>`;
    }).join('');
  },

  snorkel: g => {
    const y = g.hy + g.hry * 0.10;
    return `<path d="M ${n(g.hx + g.hrx * 0.74)} ${n(y + g.hry * 0.30)}
                     V ${n(y - g.hry * 0.96)} q 0 ${n(-g.hry * 0.18)} ${n(g.hrx * 0.14)} ${n(-g.hry * 0.18)}"
                  fill="none" stroke="#f7b955" stroke-width="${n(g.hry * 0.16)}" stroke-linecap="round"/>
            <ellipse cx="${n(g.hx)}" cy="${n(y)}" rx="${n(g.hrx * 0.60)}" ry="${n(g.hry * 0.34)}"
                     fill="#bfe6f5" stroke="#4d7f92" stroke-width="3" opacity=".9"/>
            <path d="M ${n(g.hx - g.hrx * 0.60)} ${n(y - g.hry * 0.06)} h ${n(-g.hrx * 0.42)}"
                  stroke="#4d7f92" stroke-width="3.4" stroke-linecap="round"/>
            <ellipse cx="${n(g.hx - g.hrx * 0.22)}" cy="${n(y - g.hry * 0.10)}" rx="${n(g.hrx * 0.14)}" ry="${n(g.hry * 0.09)}"
                     fill="#fff" opacity=".6"/>`;
  },

  backpack: g => {
    /* Worn on the front, like a small child wearing a rucksack backwards.
       A pack behind an opaque body cannot be seen at all, and straps alone
       just read as marks on the chest. */
    const cx = g.bx, cy = g.by + g.bry * 0.16;
    const w = g.brx * 0.52, h = g.bry * 0.62;
    return `
      <path d="M ${n(cx - w * 0.72)} ${n(cy - h * 0.86)}
               Q ${n(cx)} ${n(cy - h * 1.34)} ${n(cx + w * 0.72)} ${n(cy - h * 0.86)}"
            fill="none" stroke="#3d7050" stroke-width="${n(g.bry * 0.13)}" stroke-linecap="round"/>
      <rect x="${n(cx - w)}" y="${n(cy - h * 0.62)}" width="${n(w * 2)}" height="${n(h * 1.3)}"
            rx="${n(h * 0.30)}" fill="#5f9b73" stroke="#3d7050" stroke-width="2.6"/>
      <path d="M ${n(cx - w)} ${n(cy - h * 0.10)}
               h ${n(w * 2)} v ${n(-h * 0.30)}
               q 0 ${n(-h * 0.30)} ${n(-w * 0.34)} ${n(-h * 0.30)}
               h ${n(-w * 1.32)} q ${n(-w * 0.34)} 0 ${n(-w * 0.34)} ${n(h * 0.30)} Z"
            fill="#7fc99a" stroke="#3d7050" stroke-width="2.4" stroke-linejoin="round"/>
      <rect x="${n(cx - w * 0.16)}" y="${n(cy - h * 0.22)}" width="${n(w * 0.32)}" height="${n(h * 0.26)}"
            rx="${n(h * 0.07)}" fill="#f6c453" stroke="#c9922c" stroke-width="2"/>`;
  },

  sweater: g => {
    const top = g.hy + g.hry * 0.96;
    return `<path d="M ${n(g.bx - g.brx * 0.82)} ${n(top + g.bry * 0.20)}
                     Q ${n(g.bx)} ${n(top - g.bry * 0.16)} ${n(g.bx + g.brx * 0.82)} ${n(top + g.bry * 0.20)}
                     L ${n(g.bx + g.brx * 0.90)} ${n(g.by + g.bry * 0.70)}
                     Q ${n(g.bx)} ${n(g.by + g.bry * 1.00)} ${n(g.bx - g.brx * 0.90)} ${n(g.by + g.bry * 0.70)} Z"
                  fill="#e2566f" stroke="#a23b50" stroke-width="2.6" stroke-linejoin="round"/>
            <path d="M ${n(g.bx - g.brx * 0.86)} ${n(g.by + g.bry * 0.10)} Q ${n(g.bx)} ${n(g.by + g.bry * 0.34)} ${n(g.bx + g.brx * 0.86)} ${n(g.by + g.bry * 0.10)}"
                  fill="none" stroke="#fff6e8" stroke-width="${n(g.bry * 0.13)}"/>
            <path d="M ${n(g.bx - g.brx * 0.88)} ${n(g.by + g.bry * 0.42)} Q ${n(g.bx)} ${n(g.by + g.bry * 0.66)} ${n(g.bx + g.brx * 0.88)} ${n(g.by + g.bry * 0.42)}"
                  fill="none" stroke="#fff6e8" stroke-width="${n(g.bry * 0.13)}"/>`;
  },

  fairy_wings: g => {
    const y = g.by - g.bry * 0.10;
    const wing = side => `
      <ellipse cx="${n(g.bx + side * g.brx * 0.98)}" cy="${n(y - g.bry * 0.34)}"
               rx="${n(g.brx * 0.44)}" ry="${n(g.bry * 0.62)}"
               transform="rotate(${side * 22} ${n(g.bx + side * g.brx * 0.98)} ${n(y - g.bry * 0.34)})"
               fill="#dcefff" stroke="#a8c8f0" stroke-width="2.4" opacity=".92"/>
      <ellipse cx="${n(g.bx + side * g.brx * 0.86)}" cy="${n(y + g.bry * 0.40)}"
               rx="${n(g.brx * 0.32)}" ry="${n(g.bry * 0.44)}"
               transform="rotate(${side * 16} ${n(g.bx + side * g.brx * 0.86)} ${n(y + g.bry * 0.40)})"
               fill="#f2e2ff" stroke="#c9a3e0" stroke-width="2.4" opacity=".92"/>`;
    return wing(-1) + wing(1);
  },

  sprout_charm: g => {
    const y = g.hy + g.hry * 1.04, r = g.hrx * 0.16;
    return `
      <path d="M ${n(g.hx)} ${n(y - r * 1.8)} L ${n(g.hx)} ${n(y)}" stroke="#c9922c" stroke-width="2.4"/>
      <circle cx="${n(g.hx)}" cy="${n(y + r * 0.5)}" r="${n(r)}" fill="#8fd3a8" stroke="#4f9b6d" stroke-width="2"/>
      <path d="M ${n(g.hx)} ${n(y + r * 0.5)} q ${n(-r * 0.9)} ${n(-r * 0.6)} ${n(-r * 0.2)} ${n(-r * 1.1)}
               q ${n(r * 0.7)} ${n(r * 0.1)} ${n(r * 0.2)} ${n(r * 1.1)} z" fill="#6bbf8c"/>`;
  },

  golden_quill: g => {
    const y = g.hy + g.hry * 1.00, h = g.hry * 0.62;
    return `
      <path d="M ${n(g.hx + g.hrx * 0.30)} ${n(y + h * 0.34)}
               Q ${n(g.hx + g.hrx * 0.10)} ${n(y - h * 0.40)} ${n(g.hx + g.hrx * 0.46)} ${n(y - h * 0.86)}
               Q ${n(g.hx + g.hrx * 0.60)} ${n(y - h * 0.20)} ${n(g.hx + g.hrx * 0.30)} ${n(y + h * 0.34)} Z"
            fill="#f6c453" stroke="#c9922c" stroke-width="2" stroke-linejoin="round"/>`;
  },
};

/** SVG for whatever the pet is wearing, given its live geometry. */
export function wearableSVG(itemId, geom) {
  const fn = HATS[itemId] || ACCESSORIES[itemId];
  return fn ? fn(geom) : '';
}

/** Accessories that sit behind the body (a cape) rather than in front. */
/* Worn things that belong behind the body rather than in front of it. */
export const BEHIND_BODY = new Set(['cape', 'fairy_wings']);

/* ============================ SURFACES ============================
   Wallpaper and flooring are CSS backgrounds, not drawings: they must fill
   a wall or a floor at any size, and a repeating gradient does that
   perfectly at no cost. */

/* Every entry sets backgroundColor separately from backgroundImage. Using
   the `background` shorthand alongside backgroundImage silently drops the
   base colour, which leaves a patterned surface floating on nothing. */
/* ---------- Depth, shared by every surface ----------

   A wall and a floor are the two biggest things on the screen, so whatever
   they do to the eye, the whole room does. Flat colour makes a room look
   like a diagram of a room. Three cheap layers fix that, and they go on
   top of whatever pattern the surface already has:

     - light falls from above, so the top of the wall is brighter than the
       bottom and the floor is brightest at the front;
     - light does not reach into the join between them, so there is a dark
       band along the top of the floor. This one line of shadow does more
       for the room than any amount of detail in the furniture;
     - the window is in the top left corner, so there is a warm pool of
       daylight there.
*/
const WALL_DEPTH =
  'radial-gradient(ellipse 95% 120% at 16% 2%, rgba(255,246,222,.34), rgba(255,246,222,0) 58%), ' +
  'linear-gradient(180deg, rgba(255,255,255,.17) 0%, rgba(255,255,255,0) 40%, rgba(62,42,26,.13) 100%)';

/* The floor's own light, and the shadow in the join above it. */
const FLOOR_DEPTH =
  'linear-gradient(180deg, rgba(70,48,28,.32) 0%, rgba(70,48,28,.07) 13%, ' +
  'rgba(255,255,255,0) 55%, rgba(255,255,255,.12) 100%)';

/* Board ends and tile joints bunch up towards the back of the room, the way
   anything does when it is running away from you. Even spacing is exactly
   what made the old floor read as a sheet of graph paper rather than as
   something you could walk on. */
const rows = (dark, soft = 0.26, lit = 0) => {
  const at = [5.6, 13.0, 22.4, 34.4, 49.6, 68.6, 91.4];
  const parts = [];
  let prev = 0;
  at.forEach((y, i) => {
    const t = 0.55 + i * 0.16;                 // thicker towards the front
    parts.push(`transparent ${prev}% ${y}%`, `rgba(${dark},${soft}) ${y}% ${y + t}%`);
    prev = y + t;
    /* The top edge of the next board catches the light, which is what gives
       a board thickness instead of drawing a line on a sheet of paper. */
    if (lit) {
      parts.push(`rgba(255,255,255,${lit}) ${prev}% ${prev + t * 0.9}%`);
      prev += t * 0.9;
    }
  });
  parts.push(`transparent ${prev}%`);
  return `linear-gradient(180deg, ${parts.join(', ')})`;
};
const WOOD_ROWS  = rows('108,74,40', 0.34, 0.16);
const STONE_ROWS = rows('120,116,108', 0.22, 0.12);
const GRASS_ROWS = rows('64,116,58', 0.18);

/* Outdoors the far end of the garden is hazier and cooler than the grass at
   your feet — that is distance, and without it the lawn is a green
   rectangle standing on its end. */
const GROUND_DEPTH =
  'linear-gradient(180deg, rgba(46,72,40,.34) 0%, rgba(46,72,40,.10) 9%, ' +
  'rgba(255,255,255,0) 52%, rgba(255,255,255,.10) 100%)';

/* Every entry sets backgroundColor separately from backgroundImage. Using
   the `background` shorthand alongside backgroundImage silently drops the
   base colour, which leaves a patterned surface floating on nothing. */
export const SURFACES = {
  /* ---- Wallpaper ---- */
  wall_plain: {
    backgroundColor: '#f6e7d2',
    backgroundImage: `${WALL_DEPTH}, linear-gradient(180deg, #fdf3e4, #f3e2ca)`,
  },
  wall_stripes: {
    backgroundColor: '#d3ebdd',
    backgroundImage: `${WALL_DEPTH}, repeating-linear-gradient(90deg, #e6f4ec 0 16px, #d3ebdd 16px 32px)`,
  },
  wall_dots: {
    backgroundColor: '#fbe4ec',
    backgroundImage: `${WALL_DEPTH}, radial-gradient(#f3adc6 22%, transparent 24%), radial-gradient(#f3adc6 22%, transparent 24%)`,
    backgroundSize: 'auto, auto, 28px 28px, 28px 28px',
    backgroundPosition: '0 0, 0 0, 0 0, 14px 14px',
  },
  /* A night sky on the wall wants the light layer turned down, or the
     window's daylight washes the stars out. */
  wall_stars: {
    backgroundColor: '#3f4a78',
    backgroundImage: 'radial-gradient(ellipse 95% 120% at 16% 2%, rgba(214,226,255,.16), transparent 58%), ' +
      'linear-gradient(180deg, rgba(255,255,255,.08) 0%, rgba(255,255,255,0) 40%, rgba(10,14,34,.28) 100%), ' +
      'radial-gradient(#fff3cc 14%, transparent 16%), radial-gradient(#ffe9a8 10%, transparent 12%)',
    backgroundSize: 'auto, auto, 46px 46px, 62px 62px',
    backgroundPosition: '0 0, 0 0, 0 0, 28px 24px',
  },
  wall_flowers: {
    backgroundColor: '#eef7e8',
    backgroundImage: `${WALL_DEPTH}, radial-gradient(#f6a8c0 16%, transparent 18%), radial-gradient(#ffd980 12%, transparent 14%), radial-gradient(#9dd3ab 10%, transparent 12%)`,
    backgroundSize: 'auto, auto, 54px 54px, 54px 54px, 38px 38px',
    backgroundPosition: '0 0, 0 0, 0 0, 27px 27px, 14px 34px',
  },

  wall_clouds: {
    backgroundColor: '#cfe6f5',
    backgroundImage: `${WALL_DEPTH}, radial-gradient(circle at 30% 60%, #fff 18%, transparent 20%), radial-gradient(circle at 55% 45%, #fff 22%, transparent 24%), radial-gradient(circle at 75% 62%, #fff 16%, transparent 18%)`,
    backgroundSize: 'auto, auto, 120px 80px, 120px 80px, 120px 80px',
  },
  wall_rainbow: {
    backgroundColor: '#fdf3e4',
    backgroundImage: `${WALL_DEPTH}, repeating-linear-gradient(90deg, #f6b0b0 0 18px, #f8cf9a 18px 36px, #f7e7a0 36px 54px, #b6e0b0 54px 72px, #a8cfef 72px 90px, #cbb4e4 90px 108px)`,
  },
  /* The shelves get their own shadow under each one, so the books sit on
     something instead of hanging in a grid. */
  wall_books: {
    backgroundColor: '#c9a87c',
    backgroundImage: `${WALL_DEPTH}, repeating-linear-gradient(180deg, transparent 0 46px, rgba(60,40,22,.28) 46px 54px, #8a6340 54px 62px), repeating-linear-gradient(90deg, #d4594f 0 11px, #4f7fa8 11px 20px, #d8a648 20px 31px, #5f8f66 31px 39px, #9a6bb0 39px 50px, transparent 50px 56px)`,
  },
  wall_ocean: {
    backgroundColor: '#2f6f96',
    backgroundImage: `${WALL_DEPTH}, repeating-linear-gradient(180deg, rgba(255,255,255,.14) 0 3px, transparent 3px 26px), radial-gradient(circle at 22% 30%, rgba(255,255,255,.35) 5%, transparent 7%), radial-gradient(circle at 70% 60%, rgba(255,255,255,.28) 4%, transparent 6%)`,
    backgroundSize: 'auto, auto, auto, 90px 90px, 70px 70px',
  },

  /* ---- Flooring ----
     Seams between boards run away from the viewer; board ends close up
     towards the back. */
  /* Boards run across the room, so their edges bunch up towards the back:
     that alone is the perspective. There are deliberately NO seams running
     the other way — a continuous grid of both is what made this read as a
     sheet of graph paper rather than as a floor. */
  floor_wood: {
    backgroundColor: '#d9b183',
    backgroundImage: `${FLOOR_DEPTH}, ${WOOD_ROWS}, ` +
      'repeating-linear-gradient(181deg, rgba(150,110,62,.10) 0 1px, transparent 1px 7px)',
  },
  floor_tile: {
    backgroundColor: '#f2ece2',
    backgroundImage: `${FLOOR_DEPTH}, ${STONE_ROWS}, repeating-conic-gradient(#e0d2bd 0% 25%, #f7f2e8 0% 50%)`,
    backgroundSize: 'auto, auto, 46px 46px',
  },
  floor_grass: {
    backgroundColor: '#9fd08a',
    backgroundImage: `${FLOOR_DEPTH}, repeating-linear-gradient(105deg, rgba(90,150,80,.30) 0 3px, transparent 3px 11px)`,
  },
  floor_stone: {
    backgroundColor: '#cfc9c0',
    backgroundImage: `${FLOOR_DEPTH}, ${STONE_ROWS}, radial-gradient(#bdb5aa 30%, transparent 32%), radial-gradient(#c9c2b8 26%, transparent 28%)`,
    backgroundSize: 'auto, auto, 52px 38px, 44px 32px',
    backgroundPosition: '0 0, 0 0, 0 0, 26px 19px',
  },
  floor_pond: {
    backgroundColor: '#8ecfe6',
    backgroundImage: `${FLOOR_DEPTH}, repeating-linear-gradient(100deg, rgba(255,255,255,.40) 0 4px, transparent 4px 16px), linear-gradient(180deg, rgba(255,255,255,.35), transparent)`,
  },
  floor_moss: {
    backgroundColor: '#8fbf7a',
    backgroundImage: `${FLOOR_DEPTH}, radial-gradient(#79ad64 24%, transparent 26%), radial-gradient(#a4cf90 20%, transparent 22%)`,
    backgroundSize: 'auto, 34px 34px, 26px 26px',
    backgroundPosition: '0 0, 0 0, 17px 13px',
  },
  floor_sand: {
    backgroundColor: '#eed9ab',
    backgroundImage: `${FLOOR_DEPTH}, repeating-linear-gradient(92deg, rgba(200,170,120,.34) 0 2px, transparent 2px 13px), radial-gradient(rgba(190,158,108,.4) 18%, transparent 20%)`,
    backgroundSize: 'auto, auto, 18px 18px',
  },
  floor_marble: {
    backgroundColor: '#eceaf0',
    backgroundImage: `${FLOOR_DEPTH}, ${STONE_ROWS}, repeating-linear-gradient(56deg, rgba(150,148,165,.26) 0 2px, transparent 2px 9px, rgba(150,148,165,.14) 9px 10px, transparent 10px 44px)`,
  },
  /* ---- The garden: sky ----
     These fill the top band of the garden, so they are drawn as if seen
     from the ground: lighter towards the horizon, whatever is up there
     placed high enough that a tree does not grow through it. */
  sky_day: {
    backgroundColor: '#8fc9ec',
    backgroundImage: 'radial-gradient(circle at 76% 22%, #fff6cf 5%, rgba(255,246,207,.55) 8%, transparent 13%), ' +
      'radial-gradient(ellipse 34% 26% at 22% 34%, rgba(255,255,255,.75), rgba(255,255,255,0) 70%), ' +
      'radial-gradient(ellipse 26% 20% at 52% 20%, rgba(255,255,255,.55), rgba(255,255,255,0) 70%), ' +
      'linear-gradient(180deg, #6fb7e4 0%, #a9d8f0 55%, #dcf0fa 100%)',
  },
  sky_sunset: {
    backgroundColor: '#f3a97a',
    backgroundImage: 'radial-gradient(circle at 70% 76%, #fff1c0 6%, rgba(255,222,150,.5) 11%, transparent 18%), ' +
      'radial-gradient(ellipse 40% 22% at 30% 46%, rgba(255,198,168,.55), rgba(255,198,168,0) 72%), ' +
      'linear-gradient(180deg, #8f7ab5 0%, #e8899a 42%, #f6b884 72%, #fbdcae 100%)',
  },
  sky_night: {
    backgroundColor: '#2c3563',
    /* A brighter moon with a real halo, and the faint scattering of far-off
       stars that the twinkling ones in ui/garden.js sit on top of. */
    backgroundImage: 'radial-gradient(circle at 78% 24%, #fffdf0 3.4%, #fdf3cf 4.6%, rgba(253,243,207,.45) 7%, rgba(220,228,255,.16) 12%, transparent 17%), radial-gradient(#fff8d8 1.3px, transparent 1.8px), radial-gradient(#dfe7ff 1.1px, transparent 1.5px), linear-gradient(180deg, #1d2550 0%, #3a4577 60%, #737899 100%)',
    backgroundSize: 'auto, 70px 70px, 47px 47px, auto',
    backgroundPosition: '0 0, 0 0, 23px 31px, 0 0',
  },
  sky_rainbow: {
    backgroundColor: '#9fd2ee',
    backgroundImage: 'radial-gradient(circle at 50% 132%, transparent 56%, rgba(203,180,228,.85) 56% 59%, rgba(168,207,239,.85) 59% 62%, rgba(182,224,176,.85) 62% 65%, rgba(247,231,160,.85) 65% 68%, rgba(248,207,154,.85) 68% 71%, rgba(246,176,176,.85) 71% 74%, transparent 74%), ' +
      'radial-gradient(ellipse 30% 22% at 20% 30%, rgba(255,255,255,.7), rgba(255,255,255,0) 70%), ' +
      'linear-gradient(180deg, #7fbfe2, #d4ecf9)',
  },

  /* ---- The garden: ground ----
     Blades bunch up towards the fence, the same trick the floorboards use:
     that is what turns a green rectangle into a lawn going away from you. */
  ground_grass: {
    backgroundColor: '#8cc472',
    backgroundImage: `${GROUND_DEPTH}, ${GRASS_ROWS}, repeating-linear-gradient(98deg, rgba(74,132,66,.34) 0 3px, transparent 3px 12px)`,
  },
  ground_sand: {
    backgroundColor: '#e9d29c',
    backgroundImage: 'linear-gradient(180deg, rgba(150,116,66,.32) 0%, rgba(150,116,66,.09) 9%, rgba(255,255,255,0) 52%, rgba(255,255,255,.12) 100%), ' +
      'repeating-linear-gradient(94deg, rgba(196,163,106,.32) 0 2px, transparent 2px 15px), radial-gradient(rgba(186,152,98,.38) 16%, transparent 18%)',
    backgroundSize: 'auto, auto, 20px 20px',
  },
  /* Flagstones laid over the grass rather than scattered pebbles: the two
     offset layers interlock, so the green only shows in the joints. */
  ground_path: {
    backgroundColor: '#6f9a5c',
    backgroundImage: `${GROUND_DEPTH}, radial-gradient(ellipse 47% 45% at 50% 50%, #d5cdbc 97%, transparent 100%), radial-gradient(ellipse 47% 45% at 50% 50%, #c6bda9 97%, transparent 100%)`,
    backgroundSize: 'auto, 58px 42px, 58px 42px',
    backgroundPosition: '0 0, 0 0, 29px 21px',
  },
  /* Flowers scattered through grass, not confetti: small heads, spread far
     enough apart that the green still reads as the surface. */
  ground_meadow: {
    backgroundColor: '#8fc873',
    backgroundImage: `${GROUND_DEPTH}, radial-gradient(#f7c9db 5%, transparent 7%), radial-gradient(#fbe08a 4%, transparent 6%), radial-gradient(#cdb5e8 4%, transparent 6%), repeating-linear-gradient(98deg, rgba(74,132,66,.28) 0 3px, transparent 3px 12px)`,
    backgroundSize: 'auto, 96px 82px, 74px 96px, 118px 88px, auto',
    backgroundPosition: '0 0, 0 0, 37px 41px, 68px 19px, 0 0',
  },

  floor_petals: {
    backgroundColor: '#f6d6de',
    backgroundImage: `${FLOOR_DEPTH}, radial-gradient(ellipse 60% 40% at 30% 40%, #f5aec0 40%, transparent 42%), radial-gradient(ellipse 50% 35% at 70% 70%, #fbc6d3 40%, transparent 42%)`,
    backgroundSize: 'auto, 46px 40px, 38px 34px',
  },
};

export const surfaceStyle = id => SURFACES[id] || SURFACES.wall_plain;

/* ======================== LIGHT AND DEPTH ========================

   One light, from the upper left, in every drawing in this file. It is the
   same corner the room's window is in, so a thing standing in the room is
   lit by the thing that lights the room.

   That single decision is most of what makes a set of flat shapes read as
   objects in a space rather than stickers on a page: every highlight lands
   on the same side, every shadow falls the same way, and the eye stops
   noticing the drawings and starts seeing the room.

   The helpers here shade a shape BY ITS OWN GEOMETRY. A generic sheen laid
   over the top of a finished drawing was tried first, and it looked like a
   smear: a highlight has to be the shape of the thing it is on, or it reads
   as dirt on the screen. So each one takes the same numbers the shape takes
   and hands back the shape, already shaded. */

/* Unique gradient ids. The same drawing goes up many times on one page —
   the shop grid alone puts a hundred of them out — and in SVG a url(#id)
   resolves to the FIRST match in the whole document, so two drawings
   sharing an id means the second silently wears the first one's colours. */
let uid = 0;
const gid = () => `ia${(++uid).toString(36)}`;

/* Shadows are marked, because a shadow is not part of the thing that
   throws it. Anything measuring how big a piece is — the room's fit tests
   do exactly this — has to be able to tell the two apart, or a door that
   correctly casts a shadow onto the floor in front of it looks like a door
   that has sunk into the floor. */
export const SHADOW = 'ia-shadow';

/* The light's direction, written once as gradient corners. */
const L1 = { x1: '10%', y1: '0%', x2: '90%', y2: '100%' };

/** Stroke attributes, or nothing at all — so every helper can take both. */
const edge = o => (o.stroke ? ` stroke="${o.stroke}" stroke-width="${o.sw ?? 3}"` +
  (o.join ? ` stroke-linejoin="${o.join}"` : '') : '');

/** A flat face turned towards the light: bright corner to shaded corner. */
function litRect(x, y, w, h, rx, light, dark, o = {}) {
  const id = gid();
  return `<defs><linearGradient id="${id}" x1="${L1.x1}" y1="${L1.y1}" x2="${L1.x2}" y2="${L1.y2}">
      <stop offset="0%" stop-color="${light}"/><stop offset="100%" stop-color="${dark}"/>
    </linearGradient></defs>` +
    `<rect x="${n(x)}" y="${n(y)}" width="${n(w)}" height="${n(h)}" rx="${n(rx)}" fill="url(#${id})"${edge(o)}/>`;
}

/** A rounded thing, lit from above left so it reads as having a belly. */
function litEllipse(cx, cy, rx, ry, light, dark, o = {}) {
  const id = gid();
  return `<defs><radialGradient id="${id}" cx="${o.cx ?? '34%'}" cy="${o.cy ?? '26%'}" r="${o.r ?? '82%'}">
      <stop offset="0%" stop-color="${light}"/><stop offset="100%" stop-color="${dark}"/>
    </radialGradient></defs>` +
    `<ellipse cx="${n(cx)}" cy="${n(cy)}" rx="${n(rx)}" ry="${n(ry)}" fill="url(#${id})"${edge(o)}/>`;
}

/** Any outline at all, shaded along the light rather than filled flat. */
function litPath(d, light, dark, o = {}) {
  const id = gid();
  const grad = o.round
    ? `<radialGradient id="${id}" cx="34%" cy="26%" r="82%">`
    : `<linearGradient id="${id}" x1="${L1.x1}" y1="${L1.y1}" x2="${L1.x2}" y2="${L1.y2}">`;
  const close = o.round ? '</radialGradient>' : '</linearGradient>';
  return `<defs>${grad}<stop offset="0%" stop-color="${light}"/>` +
    `<stop offset="100%" stop-color="${dark}"/>${close}</defs>` +
    `<path d="${d}" fill="url(#${id})"${edge(o)}/>`;
}

/**
 * A frame drawn as a stroke rather than a filled shape.
 *
 * A window's frame has to be a ring: the room hangs a live piece of sky
 * behind the glass, and a filled rectangle underneath the frame would cover
 * it up. Strokes take a gradient just as fills do, so the frame can still
 * have a lit side and a shaded one.
 */
function ringRect(x, y, w, h, rx, sw, light, dark) {
  const id = gid();
  return `<defs><linearGradient id="${id}" x1="${L1.x1}" y1="${L1.y1}" x2="${L1.x2}" y2="${L1.y2}">
      <stop offset="0%" stop-color="${light}"/><stop offset="100%" stop-color="${dark}"/>
    </linearGradient></defs>` +
    `<rect x="${n(x)}" y="${n(y)}" width="${n(w)}" height="${n(h)}" rx="${n(rx)}"
      fill="none" stroke="url(#${id})" stroke-width="${n(sw)}"/>`;
}

/** The same, for a frame that is not a rectangle: a round or arched one. */
function ringPath(d, sw, light, dark, o = {}) {
  const id = gid();
  const g = o.round
    ? `<radialGradient id="${id}" cx="34%" cy="26%" r="82%">`
    : `<linearGradient id="${id}" x1="${L1.x1}" y1="${L1.y1}" x2="${L1.x2}" y2="${L1.y2}">`;
  return `<defs>${g}<stop offset="0%" stop-color="${light}"/><stop offset="100%" stop-color="${dark}"/>` +
    `${o.round ? '</radialGradient>' : '</linearGradient>'}</defs>` +
    `<path d="${d}" fill="none" stroke="url(#${id})" stroke-width="${n(sw)}" stroke-linejoin="${o.join ?? 'round'}"/>`;
}

/**
 * The shadow a thing standing on the floor casts at its own feet.
 *
 * This is the single biggest reason the room used to look like a collage:
 * nothing touched the ground. A soft dark pool under the footprint is what
 * says "this is standing here" rather than "this is pasted here", and it
 * costs one ellipse.
 */
function contact(cx, cy, rx, ry = rx * 0.26, o = 0.26) {
  const id = gid();
  return `<defs><radialGradient id="${id}">
      <stop offset="0%" stop-color="#4a3a2c" stop-opacity="${o}"/>
      <stop offset="55%" stop-color="#4a3a2c" stop-opacity="${n(o * 0.55)}"/>
      <stop offset="100%" stop-color="#4a3a2c" stop-opacity="0"/>
    </radialGradient></defs>` +
    `<ellipse class="${SHADOW}" cx="${n(cx)}" cy="${n(cy)}" rx="${n(rx)}" ry="${n(ry)}" fill="url(#${id})"/>`;
}

/**
 * An inset panel — a door panel, a drawer front, a sunken pane.
 *
 * Light catches the top and left of a recess and the bottom and right fall
 * into shadow, which is the opposite of a raised boss. Two open strokes
 * rather than a whole second rectangle, so the panel keeps its own colour.
 */
function inset(x, y, w, h, rx, o = {}) {
  const sw = o.sw ?? 2.4;
  const lo = o.light ?? 0.42, so = o.shade ?? 0.3;
  const r = Math.min(rx, w / 2, h / 2);
  return `<path d="M ${n(x + w - r)} ${n(y)} H ${n(x + r)} A ${n(r)} ${n(r)} 0 0 0 ${n(x)} ${n(y + r)} V ${n(y + h - r)}"
      fill="none" stroke="#000" stroke-opacity="${so}" stroke-width="${sw}" stroke-linecap="round"/>
    <path d="M ${n(x + r)} ${n(y + h)} H ${n(x + w - r)} A ${n(r)} ${n(r)} 0 0 0 ${n(x + w)} ${n(y + h - r)} V ${n(y + r)}"
      fill="none" stroke="#fff" stroke-opacity="${lo}" stroke-width="${sw}" stroke-linecap="round"/>`;
}

/** The same edge the other way up: a raised face, catching light on top. */
function raised(x, y, w, h, rx, o = {}) {
  const sw = o.sw ?? 2.4;
  const lo = o.light ?? 0.5, so = o.shade ?? 0.26;
  const r = Math.min(rx, w / 2, h / 2);
  return `<path d="M ${n(x + w - r)} ${n(y)} H ${n(x + r)} A ${n(r)} ${n(r)} 0 0 0 ${n(x)} ${n(y + r)} V ${n(y + h - r)}"
      fill="none" stroke="#fff" stroke-opacity="${lo}" stroke-width="${sw}" stroke-linecap="round"/>
    <path d="M ${n(x + r)} ${n(y + h)} H ${n(x + w - r)} A ${n(r)} ${n(r)} 0 0 0 ${n(x + w)} ${n(y + h - r)} V ${n(y + r)}"
      fill="none" stroke="#000" stroke-opacity="${so}" stroke-width="${sw}" stroke-linecap="round"/>`;
}

/**
 * The bright streak on a pane of glass or the surface of water.
 * Angled with the light, and soft at both ends so it reads as a reflection
 * and not as a white stripe someone painted on.
 */
function gloss(x, y, w, h, o = {}) {
  const id = gid();
  return `<defs><linearGradient id="${id}" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#fff" stop-opacity="0"/>
      <stop offset="45%" stop-color="#fff" stop-opacity="${o.peak ?? 0.55}"/>
      <stop offset="100%" stop-color="#fff" stop-opacity="0"/>
    </linearGradient></defs>` +
    `<rect x="${n(x)}" y="${n(y)}" width="${n(w)}" height="${n(h)}" rx="${n(o.rx ?? h / 2)}"
      fill="url(#${id})" transform="rotate(${o.rot ?? -22} ${n(x + w / 2)} ${n(y + h / 2)})"/>`;
}

/** Grain, kept inside the shape it belongs to rather than ruled across it. */
function grain(x, y, w, h, rx, lines = 5, o = {}) {
  const id = gid();
  let out = `<defs><clipPath id="${id}"><rect x="${n(x)}" y="${n(y)}" width="${n(w)}" height="${n(h)}" rx="${n(rx)}"/></clipPath></defs>`;
  out += `<g clip-path="url(#${id})" opacity="${o.opacity ?? 0.5}">`;
  for (let i = 1; i <= lines; i++) {
    const t = i / (lines + 1);
    const gx = x + w * t;
    const wob = (i % 2 ? 1 : -1) * w * 0.035;
    out += `<path d="M ${n(gx)} ${n(y)} q ${n(wob)} ${n(h * 0.5)} 0 ${n(h)}"
       fill="none" stroke="${o.color ?? '#8a6340'}" stroke-opacity="${o.strength ?? 0.3}" stroke-width="${o.sw ?? 1.6}"/>`;
  }
  return out + '</g>';
}

/* =========================== DECORATIONS ===========================
   Each draws inside a 0 0 100 100 box, standing on y = 92. */

const DECOR = {
  /* ---- Birthday Week ---- */

  birthday_cake: () => `
    <ellipse cx="50" cy="90" rx="34" ry="6" fill="#e8dcc9" opacity=".7"/>
    <rect x="18" y="62" width="64" height="27" rx="6" fill="#f7d9e6" stroke="#c98da8" stroke-width="3"/>
    <rect x="26" y="42" width="48" height="22" rx="6" fill="#fdeef5" stroke="#c98da8" stroke-width="3"/>
    <path d="M 18 66 q 8 8 16 0 q 8 8 16 0 q 8 8 16 0 q 8 8 16 0" fill="none" stroke="#f4a8c6" stroke-width="4" stroke-linecap="round"/>
    <path d="M 26 46 q 8 7 16 0 q 8 7 16 0 q 8 7 16 0" fill="none" stroke="#f4a8c6" stroke-width="3.4" stroke-linecap="round"/>
    ${[34, 50, 66].map(x => `
      <rect x="${x - 2.6}" y="26" width="5.2" height="16" rx="2.4" fill="#8fd3a8" stroke="#4f9b6d" stroke-width="2"/>
      <ellipse cx="${x}" cy="22" rx="3.4" ry="5" fill="#ffd980" stroke="#e0a63a" stroke-width="1.8"/>`).join('')}`,

  balloon_bunch: () => {
    const balloon = (x, y, r, fill, edge) => `
      <ellipse cx="${x}" cy="${y}" rx="${r}" ry="${r * 1.18}" fill="${fill}" stroke="${edge}" stroke-width="2.6"/>
      <path d="M ${x - 3} ${y + r * 1.18} l 3 4 l 3 -4 z" fill="${edge}"/>
      <ellipse cx="${x - r * 0.34}" cy="${y - r * 0.4}" rx="${r * 0.22}" ry="${r * 0.3}" fill="#fff" opacity=".55"/>`;
    return `
      <path d="M 30 42 Q 44 66 50 88" fill="none" stroke="#b9a68f" stroke-width="2.2"/>
      <path d="M 50 40 Q 51 64 50 88" fill="none" stroke="#b9a68f" stroke-width="2.2"/>
      <path d="M 70 44 Q 58 68 50 88" fill="none" stroke="#b9a68f" stroke-width="2.2"/>
      ${balloon(30, 30, 15, '#ef8f9f', '#b3596e')}
      ${balloon(70, 32, 14, '#8fc4e0', '#4f7f9b')}
      ${balloon(50, 22, 16, '#ffd980', '#c9922c')}
      <circle cx="50" cy="89" r="4" fill="#c9a887" stroke="#8a6f54" stroke-width="2"/>`;
  },

  party_banner: () => {
    const flags = ['#ef8f9f', '#ffd980', '#8fc4e0', '#a8d8b0', '#c9a3e0'];
    return `
      <path d="M 6 26 Q 50 46 94 26" fill="none" stroke="#b9a68f" stroke-width="3" stroke-linecap="round"/>
      ${flags.map((c, i) => {
        const t = (i + 0.5) / flags.length;
        const x = 6 + t * 88;
        const y = 26 + Math.sin(Math.PI * t) * 19;
        return `<path d="M ${x - 8} ${y} L ${x + 8} ${y} L ${x} ${y + 21} Z"
                      fill="${c}" stroke="#8a7f74" stroke-width="2" stroke-linejoin="round"/>`;
      }).join('')}`;
  },

  /* ---- Gathering Week ---- */

  pumpkin_pie: () => `
    <ellipse cx="50" cy="86" rx="36" ry="7" fill="#e8dcc9" opacity=".7"/>
    <path d="M 12 62 Q 50 50 88 62 L 84 78 Q 50 90 16 78 Z"
          fill="#e8b98a" stroke="#a5754a" stroke-width="3" stroke-linejoin="round"/>
    <ellipse cx="50" cy="62" rx="38" ry="13" fill="#d99a52" stroke="#a5754a" stroke-width="3"/>
    <ellipse cx="50" cy="61" rx="30" ry="9" fill="#c8812f"/>
    <path d="M 24 58 q 10 6 20 0 q 10 6 20 0 q 8 5 14 1" fill="none" stroke="#e8b98a" stroke-width="3" stroke-linecap="round"/>
    <circle cx="50" cy="52" r="6" fill="#fff6e8" stroke="#dcc9ae" stroke-width="2"/>`,

  leaf_wreath: () => {
    const leaf = (a) => {
      const r = 30, x = 50 + Math.cos(a) * r, y = 50 + Math.sin(a) * r;
      const deg = Math.round(a * 180 / Math.PI + 90);
      const c = ['#e08a3c', '#c96a2c', '#e3ae4c', '#a8562a'][Math.abs(Math.round(a * 3)) % 4];
      return `<ellipse cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" rx="8" ry="13" fill="${c}"
                stroke="#8a4a20" stroke-width="2" transform="rotate(${deg} ${x.toFixed(1)} ${y.toFixed(1)})"/>`;
    };
    let out = `<circle cx="50" cy="50" r="30" fill="none" stroke="#9a7048" stroke-width="3"/>`;
    for (let i = 0; i < 11; i++) out += leaf((i / 11) * Math.PI * 2);
    return out + `<circle cx="50" cy="19" r="4.6" fill="#d94f5c" stroke="#9a3340" stroke-width="2"/>`;
  },

  cornucopia: () => `
    <ellipse cx="50" cy="91" rx="32" ry="6" fill="#e8dcc9" opacity=".7"/>
    <path d="M 26 54 Q 50 24 74 54" fill="none" stroke="#b9843f" stroke-width="4" stroke-linecap="round"/>
    <circle cx="33" cy="46" r="12" fill="#ef7f7f" stroke="#b34d4d" stroke-width="2.6"/>
    <circle cx="66" cy="45" r="11" fill="#f7b955" stroke="#c98d34" stroke-width="2.6"/>
    <ellipse cx="50" cy="39" rx="10" ry="13" fill="#b98fd6" stroke="#8a6fa8" stroke-width="2.6"/>
    <path d="M 50 27 q 7 -8 13 -6 q -4 8 -13 6 Z" fill="#8fd3a8" stroke="#4f9b6d" stroke-width="2" stroke-linejoin="round"/>
    <path d="M 20 56 L 80 56 L 72 89 L 28 89 Z"
          fill="#d9a35f" stroke="#9a6a30" stroke-width="3" stroke-linejoin="round"/>
    <rect x="15" y="50" width="70" height="11" rx="5" fill="#e8b98a" stroke="#9a6a30" stroke-width="3"/>
    <path d="M 25 69 h 50 M 27 80 h 46" stroke="#b9843f" stroke-width="2.6" stroke-linecap="round"/>
    <path d="M 36 61 v 28 M 50 61 v 28 M 64 61 v 28" stroke="#b9843f" stroke-width="2" opacity=".55"/>`,

  /* ---- Trim the Tree ---- */

  holiday_tree: () => `
    <rect x="44" y="76" width="12" height="14" rx="3" fill="#a5794f" stroke="#7a5836" stroke-width="2.5"/>
    <path d="M 50 12 L 72 44 L 28 44 Z" fill="#5fa97a" stroke="#3d7a56" stroke-width="3" stroke-linejoin="round"/>
    <path d="M 50 28 L 78 60 L 22 60 Z" fill="#6cb886" stroke="#3d7a56" stroke-width="3" stroke-linejoin="round"/>
    <path d="M 50 44 L 84 78 L 16 78 Z" fill="#7fc99a" stroke="#3d7a56" stroke-width="3" stroke-linejoin="round"/>
    <circle cx="40" cy="54" r="4" fill="#ef7f7f"/><circle cx="62" cy="52" r="3.6" fill="#6fb3d9"/>
    <circle cx="34" cy="72" r="4" fill="#ffd980"/><circle cx="58" cy="70" r="3.6" fill="#c9a3e0"/>
    <circle cx="70" cy="74" r="3.4" fill="#ef7f9f"/>
    <path d="M 50 4 l 3.2 6.6 l 7.2 1 l -5.2 5 l 1.2 7.2 l -6.4 -3.4 l -6.4 3.4 l 1.2 -7.2 l -5.2 -5 l 7.2 -1 z"
          fill="#ffe08a" stroke="#d8ae4c" stroke-width="2" stroke-linejoin="round"/>`,

  stocking: () => `
    <path d="M 20 16 h 44" stroke="#b9a68f" stroke-width="3" stroke-linecap="round"/>
    <rect x="28" y="20" width="30" height="13" rx="6" fill="#fdf6ec" stroke="#c9b8a4" stroke-width="3"/>
    <path d="M 32 33 L 32 60 Q 32 78 50 80 L 72 82 Q 84 82 84 72 Q 84 64 72 64 L 54 62 Q 54 46 54 33 Z"
          fill="#e2566f" stroke="#a23b50" stroke-width="3" stroke-linejoin="round"/>
    <path d="M 36 46 h 16" stroke="#f4a8b8" stroke-width="3.4" stroke-linecap="round"/>
    <path d="M 36 54 h 16" stroke="#f4a8b8" stroke-width="3.4" stroke-linecap="round"/>
    <circle cx="74" cy="73" r="5" fill="#f4a8b8"/>`,

  snow_globe: () => `
    <path d="M 22 78 L 78 78 L 72 92 L 28 92 Z" fill="#a5794f" stroke="#7a5836" stroke-width="3" stroke-linejoin="round"/>
    <rect x="18" y="72" width="64" height="9" rx="4" fill="#c9a887" stroke="#7a5836" stroke-width="3"/>
    <circle cx="50" cy="46" r="32" fill="#dff0fa" stroke="#7fa8bb" stroke-width="3" opacity=".95"/>
    <path d="M 50 62 L 62 62 L 50 44 L 38 62 Z" fill="#6cb886" stroke="#3d7a56" stroke-width="2.4" stroke-linejoin="round"/>
    <rect x="47" y="60" width="6" height="8" rx="2" fill="#a5794f"/>
    ${[[34,32],[64,36],[42,56],[70,56],[54,26],[28,48]]
      .map(([x, y]) => `<circle cx="${x}" cy="${y}" r="2.6" fill="#fff"/>`).join('')}
    <path d="M 30 30 a 28 28 0 0 1 16 -12" fill="none" stroke="#fff" stroke-width="4" opacity=".6" stroke-linecap="round"/>`,

  /* ---- Midnight Sparklers ---- */

  sparkler_jar: () => `
    <rect x="30" y="52" width="40" height="38" rx="7" fill="#d9eef6" stroke="#7fa8bb" stroke-width="3" opacity=".94"/>
    <rect x="26" y="48" width="48" height="8" rx="4" fill="#c9a887" stroke="#8a6f54" stroke-width="2.5"/>
    ${[[38, 20, -16], [50, 12, 0], [62, 20, 16]].map(([x, y, rot]) => `
      <g transform="rotate(${rot} 50 60)">
        <path d="M ${x} 50 L ${x} ${y + 10}" stroke="#8a7f74" stroke-width="3" stroke-linecap="round"/>
        <circle cx="${x}" cy="${y + 6}" r="5" fill="#ffe98a"/>
        <path d="M ${x} ${y - 4} v 8 M ${x - 7} ${y + 6} h 14 M ${x - 5} ${y + 1} l 10 10 M ${x + 5} ${y + 1} l -10 10"
              stroke="#ffd35c" stroke-width="2.4" stroke-linecap="round"/>
      </g>`).join('')}
    <path d="M 33 60 q -2 14 0 26" fill="none" stroke="#fff" stroke-width="4" opacity=".5" stroke-linecap="round"/>`,

  star_garland: () => {
    const star = (x, y, r) => {
      let d = '';
      for (let i = 0; i < 10; i++) {
        const rad = i % 2 ? r * 0.45 : r;
        const a = (i / 10) * Math.PI * 2 - Math.PI / 2;
        d += `${i ? 'L' : 'M'} ${(x + Math.cos(a) * rad).toFixed(1)} ${(y + Math.sin(a) * rad).toFixed(1)} `;
      }
      return `<path d="${d}Z" fill="#ffe08a" stroke="#d8ae4c" stroke-width="2" stroke-linejoin="round"/>`;
    };
    return `
      <path d="M 6 28 Q 50 48 94 28" fill="none" stroke="#b9a68f" stroke-width="3" stroke-linecap="round"/>
      ${star(22, 46, 11)}${star(50, 56, 13)}${star(78, 46, 11)}`;
  },

  midnight_clock: () => `
    <circle cx="50" cy="52" r="34" fill="#f6e6c9" stroke="#8a6f54" stroke-width="4"/>
    <circle cx="50" cy="52" r="27" fill="#fffdf9" stroke="#c9b8a4" stroke-width="2.4"/>
    ${[0, 3, 6, 9].map(h => {
      const a = (h / 12) * Math.PI * 2 - Math.PI / 2;
      return `<circle cx="${(50 + Math.cos(a) * 21).toFixed(1)}" cy="${(52 + Math.sin(a) * 21).toFixed(1)}" r="2.4" fill="#8a6f54"/>`;
    }).join('')}
    <path d="M 50 52 L 50 34" stroke="#4a3b32" stroke-width="3.4" stroke-linecap="round"/>
    <path d="M 50 52 L 50 32" stroke="#4a3b32" stroke-width="2.6" stroke-linecap="round"/>
    <circle cx="50" cy="52" r="3.4" fill="#4a3b32"/>
    <path d="M 36 18 q 14 -8 28 0" fill="none" stroke="#8a6f54" stroke-width="3.4" stroke-linecap="round"/>`,

  /* ---- Spring Egg Hunt ---- */

  egg_basket: () => {
    const egg = (x, y, fill, edge, band) => `
      <ellipse cx="${x}" cy="${y}" rx="9" ry="11.5" fill="${fill}" stroke="${edge}" stroke-width="2.4"/>
      <path d="M ${x - 8} ${y} q 8 4 16 0" fill="none" stroke="${band}" stroke-width="2.6"/>`;
    return `
      <ellipse cx="50" cy="90" rx="32" ry="6" fill="#e8dcc9" opacity=".7"/>
      ${egg(34, 50, '#f4a8c6', '#b3596e', '#fff')}
      ${egg(66, 50, '#a8d8ea', '#4f7f9b', '#fff')}
      ${egg(50, 44, '#ffe08a', '#c9922c', '#fff')}
      <path d="M 22 56 L 78 56 L 70 88 L 30 88 Z" fill="#d9a35f" stroke="#9a6a30" stroke-width="3" stroke-linejoin="round"/>
      <rect x="18" y="52" width="64" height="9" rx="4" fill="#e8b98a" stroke="#9a6a30" stroke-width="3"/>
      <path d="M 30 62 h 40 M 32 72 h 36 M 34 82 h 32" stroke="#b9843f" stroke-width="2.4" stroke-linecap="round"/>`;
  },

  tulip_pot: () => {
    const tulip = (x, top, c, e) => `
      <path d="M ${x} 62 Q ${x - 2} ${top + 18} ${x} ${top + 12}" fill="none" stroke="#5fa97a" stroke-width="3.4"/>
      <path d="M ${x - 9} ${top + 12} q 0 -12 9 -12 q 9 0 9 12 q -4 5 -9 5 q -5 0 -9 -5 Z"
            fill="${c}" stroke="${e}" stroke-width="2.4" stroke-linejoin="round"/>`;
    return `
      <path d="M 30 64 Q 18 54 16 40 Q 30 44 34 62 Z" fill="#7fc99a" stroke="#4f9b6d" stroke-width="2.4" stroke-linejoin="round"/>
      <path d="M 70 64 Q 82 54 84 40 Q 70 44 66 62 Z" fill="#7fc99a" stroke="#4f9b6d" stroke-width="2.4" stroke-linejoin="round"/>
      ${tulip(34, 26, '#f4a8c6', '#b3596e')}
      ${tulip(50, 16, '#ef7f7f', '#b34d4d')}
      ${tulip(66, 26, '#ffd980', '#c9922c')}
      <path d="M 30 64 L 70 64 L 65 90 L 35 90 Z" fill="#d98b62" stroke="#a5613f" stroke-width="3" stroke-linejoin="round"/>
      <rect x="28" y="59" width="44" height="10" rx="4" fill="#e8a17c" stroke="#a5613f" stroke-width="3"/>`;
  },

  spring_wreath: () => {
    let out = `<circle cx="50" cy="52" r="29" fill="none" stroke="#6cb886" stroke-width="7"/>`;
    const colours = ['#f4a8c6', '#fff3c4', '#c9a3e0', '#a8d8ea', '#ffd0dd', '#fff'];
    for (let i = 0; i < 9; i++) {
      const a = (i / 9) * Math.PI * 2;
      const x = 50 + Math.cos(a) * 29, y = 52 + Math.sin(a) * 29;
      const c = colours[i % colours.length];
      out += `<g>${[0, 1, 2, 3, 4].map(k => {
        const b = (k / 5) * Math.PI * 2;
        return `<circle cx="${(x + Math.cos(b) * 4.6).toFixed(1)}" cy="${(y + Math.sin(b) * 4.6).toFixed(1)}"
                  r="3.8" fill="${c}" stroke="#d9b8c6" stroke-width="1.4"/>`;
      }).join('')}<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="2.6" fill="#ffd980"/></g>`;
    }
    return out + `<path d="M 44 18 q 6 -6 12 0" fill="none" stroke="#f4a8c6" stroke-width="3.4" stroke-linecap="round"/>`;
  },

  /* ---- Halloween 2026 ---- */

  pumpkin_lantern: () => `
    <path d="M 50 26 Q 52 16 60 14" fill="none" stroke="#6f9b57" stroke-width="3.4" stroke-linecap="round"/>
    <rect x="45" y="20" width="10" height="12" rx="4" fill="#7fae5c" stroke="#4f7a3c" stroke-width="2.5"/>
    <ellipse cx="32" cy="60" rx="17" ry="26" fill="#ef9243" stroke="#b3641f" stroke-width="3"/>
    <ellipse cx="68" cy="60" rx="17" ry="26" fill="#ef9243" stroke="#b3641f" stroke-width="3"/>
    <ellipse cx="50" cy="60" rx="26" ry="28" fill="#f7a94e" stroke="#b3641f" stroke-width="3"/>
    <path d="M 34 52 l 9 -7 l 5 10 z" fill="#5a3418"/>
    <path d="M 66 52 l -9 -7 l -5 10 z" fill="#5a3418"/>
    <path d="M 36 68 Q 50 82 64 68 Q 57 72 50 70 Q 43 72 36 68 Z" fill="#5a3418"/>
    <circle cx="42" cy="63" r="3.4" fill="#f4c9a8" opacity=".55"/>
    <circle cx="59" cy="63" r="3.4" fill="#f4c9a8" opacity=".55"/>`,

  ghost_friend: () => `
    <path d="M 50 16 Q 76 16 76 46 L 76 84 Q 69 76 62 84 Q 55 76 50 84 Q 45 76 38 84 Q 31 76 24 84 L 24 46 Q 24 16 50 16 Z"
          fill="#fbf7f2" stroke="#b9b0c4" stroke-width="3" stroke-linejoin="round"/>
    <ellipse cx="41" cy="44" rx="4.4" ry="5.4" fill="#4a3b52"/>
    <ellipse cx="59" cy="44" rx="4.4" ry="5.4" fill="#4a3b52"/>
    <ellipse cx="34" cy="55" rx="5" ry="3.4" fill="#f4b8c6" opacity=".7"/>
    <ellipse cx="66" cy="55" rx="5" ry="3.4" fill="#f4b8c6" opacity=".7"/>
    <path d="M 44 56 Q 50 62 56 56" fill="none" stroke="#4a3b52" stroke-width="3" stroke-linecap="round"/>`,

  candy_bucket: () => `
    <path d="M 26 46 L 32 88 Q 50 92 68 88 L 74 46 Z"
          fill="#f7a94e" stroke="#b3641f" stroke-width="3" stroke-linejoin="round"/>
    <rect x="22" y="40" width="56" height="10" rx="5" fill="#ef9243" stroke="#b3641f" stroke-width="3"/>
    <path d="M 30 40 Q 50 8 70 40" fill="none" stroke="#8a6f54" stroke-width="3.4" stroke-linecap="round"/>
    <circle cx="38" cy="38" r="7" fill="#ef7f9f" stroke="#b3596e" stroke-width="2.4"/>
    <circle cx="55" cy="36" r="6" fill="#8fd3a8" stroke="#4f9b6d" stroke-width="2.4"/>
    <circle cx="66" cy="40" r="5.4" fill="#a78bc9" stroke="#6f5a8f" stroke-width="2.4"/>
    <path d="M 44 34 l 8 -4 l 0 8 z" fill="#6fb3d9" stroke="#3f7d9e" stroke-width="2"/>`,

  bat_garland: () => {
    const bat = (x, y, s) => `
      <g transform="translate(${x} ${y}) scale(${s})">
        <path d="M 0 0 Q -7 -8 -18 -6 Q -12 -1 -13 5 Q -7 2 -4 6 Q 0 10 4 6 Q 7 2 13 5 Q 12 -1 18 -6 Q 7 -8 0 0 Z"
              fill="#5c4a78" stroke="#3f3159" stroke-width="2.2" stroke-linejoin="round"/>
        <circle cx="-3" cy="0" r="1.5" fill="#ffd980"/><circle cx="3" cy="0" r="1.5" fill="#ffd980"/>
      </g>`;
    return `
      <path d="M 6 26 Q 50 44 94 26" fill="none" stroke="#8a7f74" stroke-width="3" stroke-linecap="round"/>
      ${bat(22, 44, 0.85)}${bat(50, 54, 1.05)}${bat(78, 44, 0.85)}`;
  },

  /* ---- Found by the axolotl ---- */

  glow_jar: () => `
    <rect x="34" y="20" width="32" height="9" rx="4" fill="#c9a887" stroke="#8a6f54" stroke-width="2.5"/>
    <path d="M 32 29 Q 24 42 24 62 L 24 80 Q 24 89 33 89 L 67 89 Q 76 89 76 80 L 76 62 Q 76 42 68 29 Z"
          fill="#d9eef6" stroke="#7fa8bb" stroke-width="3" stroke-linejoin="round" opacity=".92"/>
    <circle cx="40" cy="52" r="5" fill="#ffe98a" opacity=".95"/>
    <circle cx="60" cy="44" r="4" fill="#ffe98a" opacity=".85"/>
    <circle cx="56" cy="66" r="5.4" fill="#ffe98a" opacity=".95"/>
    <circle cx="37" cy="74" r="3.6" fill="#ffe98a" opacity=".8"/>
    <circle cx="64" cy="78" r="3" fill="#ffe98a" opacity=".7"/>
    <path d="M 33 40 Q 31 56 33 74" fill="none" stroke="#fff" stroke-width="4" opacity=".55" stroke-linecap="round"/>`,

  moon_shell: () => `
    <ellipse cx="50" cy="89" rx="24" ry="5" fill="#e8dcc9" opacity=".7"/>
    <path d="M 50 85
             C 20 76 10 54 15 36
             Q 21 42 27 33
             Q 33 41 39 28
             Q 45 36 50 26
             Q 55 36 61 28
             Q 67 41 73 33
             Q 79 42 85 36
             C 90 54 80 76 50 85 Z"
          fill="#f6e6ef" stroke="#c7a6bb" stroke-width="3" stroke-linejoin="round"/>
    <path d="M 50 85 L 18 44" stroke="#dcc0d0" stroke-width="2.6" stroke-linecap="round"/>
    <path d="M 50 85 L 28 34" stroke="#dcc0d0" stroke-width="2.6" stroke-linecap="round"/>
    <path d="M 50 85 L 39 29" stroke="#dcc0d0" stroke-width="2.6" stroke-linecap="round"/>
    <path d="M 50 85 L 50 27" stroke="#dcc0d0" stroke-width="2.6" stroke-linecap="round"/>
    <path d="M 50 85 L 61 29" stroke="#dcc0d0" stroke-width="2.6" stroke-linecap="round"/>
    <path d="M 50 85 L 72 34" stroke="#dcc0d0" stroke-width="2.6" stroke-linecap="round"/>
    <path d="M 50 85 L 82 44" stroke="#dcc0d0" stroke-width="2.6" stroke-linecap="round"/>
    <path d="M 58 46 a 11 11 0 1 0 5.5 14.5 a 8.4 8.4 0 1 1 -5.5 -14.5 Z" fill="#ffe98a" opacity=".9"/>
    <ellipse cx="50" cy="83" rx="7" ry="4" fill="#dcc0d0"/>`,

  star_map: () => `
    <rect x="12" y="16" width="76" height="68" rx="7" fill="#e8d3ba" stroke="#a5875f" stroke-width="3.4"/>
    <rect x="19" y="23" width="62" height="54" rx="4" fill="#3c4a6b"/>
    <path d="M 31 63 L 44 44 L 58 52 L 71 33" fill="none" stroke="#8fb6d9" stroke-width="2" opacity=".8"/>
    ${[[31,63,3.6],[44,44,4.4],[58,52,3],[71,33,4],[36,33,2.4],[64,66,2.6],[50,30,2.2],[26,48,2]]
      .map(([x, y, r]) => `<circle cx="${x}" cy="${y}" r="${r}" fill="#fff4cf"/>`).join('')}
    <circle cx="44" cy="44" r="8" fill="#fff4cf" opacity=".18"/>`,

  paper_boat: () => `
    <ellipse cx="50" cy="82" rx="38" ry="8" fill="#bfe0ef" opacity=".8"/>
    <path d="M 16 68 L 84 68 L 68 84 L 32 84 Z"
          fill="#cfe2f0" stroke="#7d9cb5" stroke-width="3" stroke-linejoin="round"/>
    <path d="M 50 66 L 50 22 L 80 66 Z" fill="#fffdf9" stroke="#7d9cb5" stroke-width="3" stroke-linejoin="round"/>
    <path d="M 50 66 L 50 30 L 24 66 Z" fill="#e6eef4" stroke="#7d9cb5" stroke-width="3" stroke-linejoin="round"/>
    <path d="M 58 46 L 72 60" stroke="#b9cddc" stroke-width="2.4" stroke-linecap="round"/>
    <path d="M 20 88 Q 30 84 40 88 Q 50 92 60 88 Q 70 84 80 88" fill="none"
          stroke="#8fc9e0" stroke-width="3" stroke-linecap="round"/>`,

  mushroom_stool: () => `
    ${contact(50, 90, 24, 5, .26)}
    ${litPath('M 40 56 Q 38 78 36 88 L 64 88 Q 62 78 60 56 Z', '#fff8ee', '#ddcbb2', { stroke: '#b9a68f', sw: 3, join: 'round' })}
    ${litPath('M 12 58 Q 14 22 50 22 Q 86 22 88 58 Q 68 66 50 66 Q 32 66 12 58 Z', '#f79797', '#c45a5a', { stroke: '#b34d4d', sw: 3.4, join: 'round' })}
    <path d="M 16 54 Q 18 28 44 24" fill="none" stroke="#fff" stroke-opacity=".28" stroke-width="5"/>
    <ellipse cx="32" cy="40" rx="8" ry="6.4" fill="#fff6e8"/>
    <ellipse cx="60" cy="34" rx="6.4" ry="5" fill="#fff6e8"/>
    <ellipse cx="72" cy="48" rx="5.4" ry="4.4" fill="#fff6e8" opacity=".9"/>
    <ellipse cx="46" cy="52" rx="5" ry="4" fill="#fff6e8" opacity=".9"/>`,

  pebbles: () => `
    ${contact(50, 88, 34, 6, .22)}
    ${litEllipse(38, 78, 20, 13, '#c9bcb0', '#9a8d81', { stroke: '#8a7f74', sw: 2.5 })}
    ${litEllipse(62, 83, 16, 10, '#dbd1c5', '#ab9f93', { stroke: '#8a7f74', sw: 2.5 })}
    ${litEllipse(50, 68, 12, 8, '#e8dfd4', '#bdb2a6', { stroke: '#8a7f74', sw: 2.5 })}`,

  toy_ball: () => `
    ${contact(50, 90, 24, 5, .28)}
    ${litEllipse(50, 66, 26, 26, '#8ac6e6', '#3f7d9e', { stroke: '#3f7d9e', sw: 3 })}
    <path d="M 24 66 Q 50 50 76 66" fill="none" stroke="#fff6e8" stroke-width="5"/>
    <path d="M 24 66 Q 50 82 76 66" fill="none" stroke="#fff6e8" stroke-width="5"/>
    <ellipse cx="41" cy="55" rx="7" ry="5" fill="#fff" opacity=".55" transform="rotate(-28 41 55)"/>`,

  potted_plant: () => `
    ${contact(50, 90, 24, 5, .28)}
    ${litPath('M 50 62 Q 30 46 26 24 Q 46 32 50 60 Z', '#8fd3a8', '#5aa97d', { stroke: '#4f9b6d', sw: 2.5, join: 'round' })}
    ${litPath('M 50 62 Q 70 44 76 22 Q 54 30 50 60 Z', '#a3dcb8', '#69b98c', { stroke: '#4f9b6d', sw: 2.5, join: 'round' })}
    <path d="M 50 64 Q 48 40 50 18" fill="none" stroke="#4f9b6d" stroke-width="3"/>
    ${litPath('M 32 62 L 68 62 L 63 90 L 37 90 Z', '#e59a71', '#b06a45', { stroke: '#a5613f', sw: 3, join: 'round' })}
    ${litRect(30, 57, 40, 10, 4, '#f0b28f', '#c17c56', { stroke: '#a5613f', sw: 3 })}
    <path d="M 38 62 L 35 88" stroke="#fff" stroke-opacity=".22" stroke-width="3"/>`,

  lamp: () => `
    ${contact(50, 90, 20, 4.5, .26)}
    ${litRect(46, 54, 8, 34, 4, '#f2e2cc', '#c9ac8a', { stroke: '#a5875f', sw: 2.5 })}
    ${litPath('M 22 56 Q 50 16 78 56 Z', '#f79797', '#cc5d5d', { stroke: '#b34d4d', sw: 3, join: 'round' })}
    <circle cx="38" cy="44" r="5" fill="#fff6e8" opacity=".9"/><circle cx="58" cy="38" r="6" fill="#fff6e8" opacity=".9"/>
    <circle cx="64" cy="50" r="4" fill="#fff6e8" opacity=".9"/>
    <path d="M 27 53 Q 40 32 50 27" fill="none" stroke="#fff" stroke-opacity=".3" stroke-width="4"/>
    ${litEllipse(50, 89, 18, 6, '#f2e2cc', '#c9ac8a', { stroke: '#a5875f', sw: 2.5 })}`,

  teddy: () => `
    ${contact(50, 92, 26, 5, .26)}
    ${litEllipse(30, 40, 10, 10, '#d4b593', '#a98a68', { stroke: '#8a6f54', sw: 2.5 })}
    ${litEllipse(70, 40, 10, 10, '#d4b593', '#a98a68', { stroke: '#8a6f54', sw: 2.5 })}
    ${litEllipse(50, 70, 24, 22, '#d4b593', '#a1815f', { stroke: '#8a6f54', sw: 3 })}
    ${litEllipse(50, 74, 14, 13, '#f7ebdb', '#ddc9ae')}
    ${litEllipse(50, 42, 21, 21, '#ddc0a0', '#ab8c68', { stroke: '#8a6f54', sw: 3 })}
    ${litEllipse(50, 48, 9, 7, '#f7ebdb', '#e0cdb4')}
    <circle cx="43" cy="38" r="3" fill="#3a2e28"/><circle cx="57" cy="38" r="3" fill="#3a2e28"/>
    <circle cx="42" cy="37" r="1" fill="#fff" opacity=".8"/><circle cx="56" cy="37" r="1" fill="#fff" opacity=".8"/>
    <ellipse cx="50" cy="46" rx="3.4" ry="2.6" fill="#5a4033"/>`,
  rug: () => `
    ${contact(50, 74, 45, 21, .18)}
    ${litEllipse(50, 72, 42, 19, '#f2b492', '#d99372', { stroke: '#a5613f', sw: 3, cy: '30%' })}
    ${litEllipse(50, 72, 30, 13, '#fbdfc6', '#eab894', { stroke: '#a5613f', sw: 2.5, cy: '30%' })}
    ${litEllipse(50, 72, 16, 7, '#f2b492', '#d99372', { stroke: '#a5613f', sw: 2.5, cy: '30%' })}
    <path d="M 12 74 a 42 19 0 0 0 76 0" fill="none" stroke="#7d4429" stroke-opacity=".18" stroke-width="3"/>`,

  /* The books get a lit strip down their spines — that is what stops a row
     of coloured rectangles from reading as a bar chart. */
  bookshelf: () => `
    ${contact(50, 92, 32, 4.5, .26)}
    ${litRect(18, 26, 64, 64, 5, '#d0a274', '#9a7146', { stroke: '#8a6340', sw: 3 })}
    ${inset(23, 31, 32, 26, 2, { sw: 2.2 })}
    ${inset(23, 60, 32, 26, 2, { sw: 2.2 })}
    <rect x="22" y="54" width="56" height="5" fill="#8a6340"/>
    <rect x="22" y="59" width="56" height="2.4" fill="#fff" opacity=".28"/>
    ${[[28, 32, 8, 20, '#ef7f7f'], [38, 35, 7, 17, '#6fb3d9'], [47, 31, 9, 21, '#8fd3a8'], [58, 36, 7, 16, '#f6c453'],
       [28, 62, 7, 20, '#a78bc9'], [37, 66, 9, 16, '#f2849f'], [48, 61, 8, 21, '#6fb3d9']]
      .map(([x, y, w, h, c]) =>
        `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="2" fill="${c}"/>` +
        `<rect x="${x}" y="${y}" width="${n(w * 0.32)}" height="${h}" rx="1.5" fill="#fff" opacity=".26"/>` +
        `<rect x="${n(x + w * 0.74)}" y="${y}" width="${n(w * 0.26)}" height="${h}" rx="1.5" fill="#000" opacity=".16"/>`).join('')}
    <rect x="76" y="84" width="4" height="8" rx="2" fill="#8a6340"/>
    <rect x="20" y="84" width="4" height="8" rx="2" fill="#8a6340"/>`,

  lantern: () => `
    ${contact(50, 88, 22, 4.5, .24)}
    <path d="M 50 8 L 50 20" stroke="#a5875f" stroke-width="3" stroke-linecap="round"/>
    ${litEllipse(50, 50, 26, 30, '#fbc0cd', '#dd8ca0', { stroke: '#b3596e', sw: 3 })}
    <path d="M 50 20 L 50 80" stroke="#b3596e" stroke-width="2" opacity=".5"/>
    <path d="M 26 40 Q 50 34 74 40" fill="none" stroke="#b3596e" stroke-width="2" opacity=".5"/>
    <path d="M 26 60 Q 50 66 74 60" fill="none" stroke="#b3596e" stroke-width="2" opacity=".5"/>
    <path d="M 32 36 Q 36 24 46 22" fill="none" stroke="#fff" stroke-opacity=".4" stroke-width="4"/>
    ${litRect(40, 16, 20, 7, 3, '#f2e2cc', '#c9ac8a', { stroke: '#a5875f', sw: 2.5 })}
    ${litRect(40, 77, 20, 7, 3, '#f2e2cc', '#c9ac8a', { stroke: '#a5875f', sw: 2.5 })}`,

  little_tree: () => `
    ${contact(50, 92, 26, 5, .26)}
    ${litRect(44, 58, 12, 32, 4, '#b08557', '#845f3c', { stroke: '#7a5836', sw: 2.5 })}
    ${litEllipse(50, 36, 24, 24, '#93d8ae', '#57a17a', { stroke: '#4f9b6d', sw: 3 })}
    ${litEllipse(32, 48, 15, 15, '#a3dcb8', '#63ab83', { stroke: '#4f9b6d', sw: 3 })}
    ${litEllipse(68, 48, 15, 15, '#8fcfa6', '#539a72', { stroke: '#4f9b6d', sw: 3 })}
    <circle cx="40" cy="30" r="4" fill="#f2849f"/><circle cx="60" cy="42" r="4" fill="#f2849f"/>
    <circle cx="56" cy="26" r="3.4" fill="#ffd980"/>`,

  fish_tank: () => `
    ${contact(50, 86, 38, 5, .26)}
    ${litRect(12, 26, 76, 56, 7, '#cdeaf7', '#8cc6dd', { stroke: '#4d7f92', sw: 3.5 })}
    ${litRect(12, 66, 76, 16, 3, '#eddcc2', '#c9b191')}
    <path d="M 12 66 h 76" stroke="#4d7f92" stroke-width="2.5"/>
    <path d="M 26 66 q 4 -18 10 -22 q 5 12 2 22 z" fill="#7fc99a"/>
    <path d="M 70 66 q -4 -14 -9 -18 q -4 10 -1 18 z" fill="#8fd3a8"/>
    <g>${litEllipse(42, 42, 9, 6, '#ffbe72', '#e08a2c')}
       <path d="M 33 42 l -7 -5 v 10 z" fill="#f7a94e"/><circle cx="46" cy="40" r="1.6" fill="#3a2e28"/></g>
    <g>${litEllipse(66, 54, 7, 4.6, '#ff9fba', '#d9647f')}
       <path d="M 73 54 l 6 -4 v 8 z" fill="#ef7f9f"/><circle cx="62" cy="53" r="1.4" fill="#3a2e28"/></g>
    ${gloss(18, 30, 14, 48, { rot: -14, peak: .4 })}
    <circle cx="56" cy="34" r="2.6" fill="#fff" opacity=".7"/>
    <circle cx="60" cy="28" r="1.8" fill="#fff" opacity=".7"/>
    ${inset(12, 26, 76, 56, 7, { sw: 2.6, shade: .22, light: .3 })}`,

  castle: () => `
    ${contact(50, 92, 38, 5, .26)}
    ${litRect(16, 46, 18, 44, 0, '#e2d5c4', '#a8998a', { stroke: '#9a8b78', sw: 3 })}
    ${litRect(66, 46, 18, 44, 0, '#d9ccbb', '#9c8d7e', { stroke: '#9a8b78', sw: 3 })}
    ${litRect(34, 58, 32, 32, 0, '#eee2d1', '#b8a998', { stroke: '#9a8b78', sw: 3 })}
    ${litPath('M 16 46 v -8 h 5 v 5 h 4 v -5 h 4 v 5 h 5 v 8 z', '#e2d5c4', '#a8998a', { stroke: '#9a8b78', sw: 2.5, join: 'round' })}
    ${litPath('M 66 46 v -8 h 5 v 5 h 4 v -5 h 4 v 5 h 5 v 8 z', '#d9ccbb', '#9c8d7e', { stroke: '#9a8b78', sw: 2.5, join: 'round' })}
    ${litPath('M 34 58 v -6 h 5 v 4 h 6 v -4 h 6 v 4 h 6 v -4 h 5 v 6 z', '#eee2d1', '#b8a998', { stroke: '#9a8b78', sw: 2.5, join: 'round' })}
    ${litPath('M 42 90 v -18 a 8 8 0 0 1 16 0 v 18 z', '#b08557', '#7a5836', { stroke: '#7a5836', sw: 2.5, join: 'round' })}
    <path d="M 25 38 v -14 l 12 5 -12 5" fill="#ef6f8e" stroke="#b34a66" stroke-width="2" stroke-linejoin="round"/>
    <path d="M 75 38 v -14 l 12 5 -12 5" fill="#6fb3d9" stroke="#3f7d9e" stroke-width="2" stroke-linejoin="round"/>`,
  window_plain: () => `
    <rect x="18" y="14" width="64" height="62" rx="3" fill="var(--season-glass, #bfe6f5)"/>
    ${ringRect(18, 14, 64, 62, 3, 8, '#e6dac6', '#ab9376')}
    ${inset(18, 14, 64, 62, 3, { sw: 3.2, shade: .26, light: .24 })}
    ${gloss(23, 18, 15, 52, { rot: -16, peak: .4 })}
    <path d="M 50 14 v 62" stroke="#cdbba3" stroke-width="4"/>
    <path d="M 51.8 14 v 62" stroke="#3a2c1e" stroke-opacity=".18" stroke-width="1.8"/>
    <rect x="18" y="14" width="64" height="62" rx="3" fill="none" stroke="#b9a184" stroke-width="3.4"/>
    ${litRect(13, 74, 74, 9, 3.5, '#efe3d0', '#c3ad90', { stroke: '#b9a184', sw: 2.6 })}
    <rect class="${SHADOW}" x="16" y="83" width="68" height="3.2" rx="1.6" fill="#4a3a2c" opacity=".15"/>`,

  window_round: () => `
    <circle cx="50" cy="48" r="34" fill="var(--season-glass, #bfe6f5)"/>
    ${ringPath('M 50 14 a 34 34 0 1 1 -.1 0 z', 9, '#d9c4a5', '#8f7149', { round: true })}
    <circle cx="50" cy="48" r="34" fill="none" stroke="#3a2c1e" stroke-opacity=".2" stroke-width="3"/>
    ${gloss(26, 24, 16, 42, { rot: -20, peak: .45 })}
    <path d="M 50 14 v 68 M 16 48 h 68" stroke="#d9c4a5" stroke-width="5"/>
    <path d="M 51.8 14 v 68 M 16 49.8 h 68" stroke="#3a2c1e" stroke-opacity=".16" stroke-width="2"/>
    <circle cx="50" cy="48" r="34" fill="none" stroke="#a5875f" stroke-width="3.4"/>`,

  window_cottage: () => `
    <rect x="16" y="16" width="68" height="62" rx="4" fill="var(--season-glass, #bfe6f5)"/>
    ${ringRect(16, 16, 68, 62, 4, 9, '#d9c4a5', '#8f7149')}
    ${inset(16, 16, 68, 62, 4, { sw: 3.4, shade: .28, light: .26 })}
    ${gloss(22, 20, 16, 52, { rot: -16, peak: .42 })}
    <path d="M 50 16 v 62 M 16 47 h 68" stroke="#d9c4a5" stroke-width="5"/>
    <path d="M 51.8 16 v 62 M 16 48.8 h 68" stroke="#3a2c1e" stroke-opacity=".18" stroke-width="2"/>
    <rect x="16" y="16" width="68" height="62" rx="4" fill="none" stroke="#a5875f" stroke-width="3.4"/>
    ${litRect(10, 76, 80, 9, 3.5, '#f0e0c8', '#c9ac8a', { stroke: '#a5875f', sw: 2.8 })}
    <rect class="${SHADOW}" x="13" y="85" width="74" height="3.4" rx="1.7" fill="#4a3a2c" opacity=".16"/>`,

  window_arch: () => `
    <path d="M 18 82 V 48 a 32 32 0 0 1 64 0 v 34 z" fill="var(--season-glass, #bfe6f5)"/>
    ${ringPath('M 18 82 V 48 a 32 32 0 0 1 64 0 v 34 z', 9, '#d9c4a5', '#8f7149')}
    <path d="M 18 82 V 48 a 32 32 0 0 1 64 0 v 34 z" fill="none" stroke="#3a2c1e" stroke-opacity=".2" stroke-width="3" stroke-linejoin="round"/>
    ${gloss(24, 26, 15, 48, { rot: -18, peak: .42 })}
    <path d="M 50 18 v 64 M 20 56 h 60" stroke="#d9c4a5" stroke-width="5"/>
    <path d="M 51.8 18 v 64 M 20 57.8 h 60" stroke="#3a2c1e" stroke-opacity=".16" stroke-width="2"/>
    <path d="M 18 82 V 48 a 32 32 0 0 1 64 0 v 34 z" fill="none" stroke="#a5875f" stroke-width="3.4" stroke-linejoin="round"/>`,

  /* ---- Doors. These stand on the floor line. ---- */
  /* A door stands on the floor, so it gets the shadow at its foot that
     says so, and its panels are sunk into it rather than drawn on. */
  door_wood: () => `
    ${contact(50, 98, 31, 3, .34)}
    ${litRect(22, 10, 56, 86, 4, '#cfa06e', '#9c7047', { stroke: '#8a6340', sw: 5 })}
    ${grain(25, 13, 50, 80, 3, 4, { color: '#7d5a3a', strength: .2, sw: 1.5 })}
    ${litRect(30, 18, 40, 32, 3, '#d9aa79', '#ae8055', { stroke: '#8a6340', sw: 3 })}
    ${inset(31.6, 19.6, 36.8, 28.8, 2.4, { sw: 2.2 })}
    ${litRect(30, 56, 40, 32, 3, '#d9aa79', '#ae8055', { stroke: '#8a6340', sw: 3 })}
    ${inset(31.6, 57.6, 36.8, 28.8, 2.4, { sw: 2.2 })}
    <circle cx="68" cy="54" r="4.6" fill="#f6c453" stroke="#c9922c" stroke-width="2"/>
    <circle cx="66.6" cy="52.6" r="1.7" fill="#fff" opacity=".75"/>`,

  door_round: () => `
    ${contact(50, 97, 30, 2.6, .3)}
    ${litPath('M 20 96 V 46 a 30 30 0 0 1 60 0 v 50 z', '#9ecc8c', '#69a05c', { stroke: '#5d8a52', sw: 5, join: 'round' })}
    <path d="M 50 20 v 76" stroke="#4c7343" stroke-opacity=".45" stroke-width="3"/>
    <path d="M 52 20 v 76" stroke="#fff" stroke-opacity=".3" stroke-width="2"/>
    ${grain(24, 44, 22, 50, 3, 3, { color: '#4c7343', strength: .22, sw: 1.5 })}
    ${grain(54, 44, 22, 50, 3, 3, { color: '#4c7343', strength: .22, sw: 1.5 })}
    <circle cx="50" cy="58" r="6" fill="#f6c453" stroke="#c9922c" stroke-width="2.5"/>
    <circle cx="48.2" cy="56.2" r="2.1" fill="#fff" opacity=".75"/>`,

  door_fancy: () => `
    ${contact(50, 97, 31, 2.6, .3)}
    ${litRect(20, 8, 60, 88, 5, '#b79bd6', '#8a71ae', { stroke: '#6f5a94', sw: 5 })}
    ${litPath('M 50 14 l 18 18 -18 18 -18 -18 z', '#ddcbef', '#a992c9', { stroke: '#6f5a94', sw: 3, join: 'round' })}
    ${litRect(30, 56, 40, 34, 3, '#ddcbef', '#a992c9', { stroke: '#6f5a94', sw: 3 })}
    ${inset(31.6, 57.6, 36.8, 30.8, 2.4, { sw: 2.2 })}
    <circle cx="69" cy="54" r="5" fill="#f6c453" stroke="#c9922c" stroke-width="2"/>
    <circle cx="67.4" cy="52.4" r="1.8" fill="#fff" opacity=".75"/>`,

  /* ---- Beds ---- */
  /* ---- Beds ----
     A bed is a box with soft things on it, so the frame is shaded like a
     box and the bedding like something you could push your hand into. */
  bed_cushion: () => `
    ${contact(50, 85, 40, 6, .26)}
    ${litEllipse(50, 70, 40, 22, '#f79cb2', '#d2687f', { stroke: '#b3596e', sw: 3.5 })}
    ${litEllipse(50, 65, 29, 15, '#fff0f4', '#f2b9c9', { stroke: '#b3596e', sw: 2.5 })}
    <path d="M 24 62 q 26 -12 52 0" fill="none" stroke="#fff" stroke-width="3" opacity=".6"/>
    <path d="M 26 74 q 24 10 48 0" fill="none" stroke="#b3596e" stroke-opacity=".3" stroke-width="2.5"/>`,

  /* The duvet hangs OVER the front of the frame rather than sitting on top
     of it as a second slab. That overlap is the whole difference between a
     made bed and a blue box resting on a brown box. */
  bed_cozy: () => `
    ${contact(50, 86, 42, 6.5, .28)}
    ${litRect(10, 58, 82, 24, 6, '#c99a6e', '#9a7146', { stroke: '#8a6340', sw: 3.5 })}
    ${grain(13, 61, 76, 18, 5, 6, { color: '#7d5a3a', strength: .18, sw: 1.4 })}
    ${litRect(8, 24, 19, 58, 7, '#dcae7c', '#a87f55', { stroke: '#8a6340', sw: 3.5 })}
    ${inset(11.5, 29, 12, 46, 5, { sw: 2 })}
    ${litRect(20, 47, 70, 16, 7, '#fffaf0', '#e2d2bc', { stroke: '#c9b8a4', sw: 2.5 })}
    ${litEllipse(34, 45, 14.5, 8.5, '#fffdf7', '#ddcbb4', { stroke: '#c9b8a4', sw: 2.5 })}
    <path d="M 27 47 q 7 4 14 0" fill="none" stroke="#c9b8a4" stroke-opacity=".55" stroke-width="1.8"/>
    ${litPath('M 46 48 H 86 a 7 7 0 0 1 7 7 V 70 a 5 5 0 0 1 -5 5 H 46 z', '#d3effa', '#7fb6cd',
      { stroke: '#6f9fb3', sw: 3, join: 'round' })}
    ${litRect(46, 43, 44, 10, 5, '#eef9fd', '#b6dced', { stroke: '#6f9fb3', sw: 2.4 })}
    <path d="M 62 56 q 4 7 0 14 M 78 56 q 4 7 0 14" fill="none" stroke="#6f9fb3" stroke-opacity=".32" stroke-width="2.4"/>
    <path d="M 48 71 q 20 5 40 0" fill="none" stroke="#5d8a9c" stroke-opacity=".3" stroke-width="2.4"/>`,

  bed_shell: () => `
    ${contact(50, 86, 42, 6, .26)}
    ${litPath('M 10 80 q 0 -46 40 -46 q 40 0 40 46 z', '#fdd9e5', '#dfa0b6', { stroke: '#c07e96', sw: 3.5, join: 'round' })}
    <path d="M 50 34 v 46 M 28 42 q 6 22 4 38 M 72 42 q -6 22 -4 38"
          fill="none" stroke="#e0a3b8" stroke-width="3"/>
    <path d="M 51.8 34 v 46 M 74 42 q -6 22 -4 38"
          fill="none" stroke="#fff" stroke-opacity=".45" stroke-width="2"/>
    ${litEllipse(50, 80, 42, 9, '#fff2f7', '#efc4d3', { stroke: '#c07e96', sw: 3 })}`,

  /* ---- Rugs ---- */
  rug_round: () => `
    ${contact(50, 62, 47, 32, .18)}
    ${litEllipse(50, 60, 44, 30, '#c2e5d8', '#98c9b7', { stroke: '#5f9683', sw: 3.5, cy: '30%' })}
    ${litEllipse(50, 60, 31, 21, '#eef8f4', '#cbe4dc', { stroke: '#5f9683', sw: 2.5, cy: '30%' })}
    ${litEllipse(50, 60, 16, 11, '#c2e5d8', '#98c9b7', { stroke: '#5f9683', sw: 2.5, cy: '30%' })}
    <path d="M 6 62 a 44 30 0 0 0 88 0" fill="none" stroke="#3f6d5c" stroke-opacity=".16" stroke-width="3.5"/>`,

  /* ---- Wall decorations ---- */
  /* On the wall, so it casts its shadow onto the wall behind rather than
     onto a floor: a copy of its own outline, nudged the way the light
     points. */
  frame: () => `
    <rect class="${SHADOW}" x="16.5" y="22.5" width="72" height="58" rx="4" fill="#3a2c1e" opacity=".17"/>
    ${litRect(14, 20, 72, 58, 4, '#d5a577', '#9a7146', { stroke: '#8a6340', sw: 5 })}
    <rect x="22" y="28" width="56" height="42" rx="2" fill="#bfe6f5"/>
    ${litRect(22, 28, 56, 42, 2, '#cdeaf7', '#9ccfe4')}
    <path d="M 22 60 q 14 -18 26 -6 q 10 10 30 -4 v 20 h -56 z" fill="#8fd3a8"/>
    <path d="M 22 66 q 14 -12 26 -4 q 10 7 30 -2 v 10 h -56 z" fill="#6fbd8c" opacity=".7"/>
    <circle cx="66" cy="38" r="6" fill="#ffd980"/>
    ${inset(22, 28, 56, 42, 2, { sw: 2.6, shade: .3, light: .3 })}`,

  clock: () => `
    <circle class="${SHADOW}" cx="52.4" cy="52.6" r="34" fill="#3a2c1e" opacity=".17"/>
    ${litEllipse(50, 50, 34, 34, '#fffaf0', '#dcc9ad', { stroke: '#8a6340', sw: 5 })}
    <circle cx="50" cy="50" r="27" fill="none" stroke="#d9c4a5" stroke-width="2"/>
    <path d="M 50 50 V 30 M 50 50 l 15 9" stroke="#5a4033" stroke-width="4" stroke-linecap="round"/>
    <circle cx="50" cy="50" r="4" fill="#e2566f"/>
    <path d="M 50 16 v -6" stroke="#8a6340" stroke-width="4" stroke-linecap="round"/>`,

  bunting: () => `
    <path d="M 6 26 Q 50 44 94 26" fill="none" stroke="#a5875f" stroke-width="3.5"/>
    ${[0, 1, 2, 3, 4, 5].map(i => {
      const x = 12 + i * 15.5;
      const y = 29 + Math.sin((i / 5) * Math.PI) * 8;
      const c = ['#ef7f7f', '#f6c453', '#8fd3a8', '#6fb3d9', '#c9a3e0', '#f2849f'][i];
      return `<path d="M ${x - 8} ${y} L ${x + 8} ${y} L ${x} ${y + 22} Z"
                    fill="${c}" stroke="#8a7560" stroke-width="2" stroke-linejoin="round"/>`;
    }).join('')}`,

  /* ================= Plants =================
     Genuinely different silhouettes rather than the same pot recoloured:
     a cactus, a rosette, blooms, a palm, a bonsai. The pot is shared
     because real pots are, but no two of these read the same at a glance. */

  plant_cactus: () => `
    ${contact(50, 90, 24, 5, .26)}
    <path d="M 38 62 V 48 a 7 7 0 0 1 14 0 v 14" fill="none" stroke="#6ba85e" stroke-width="11" stroke-linecap="round"/>
    <path d="M 62 62 V 54 a 7 7 0 0 0 -14 0" fill="none" stroke="#6ba85e" stroke-width="11" stroke-linecap="round"/>
    ${litRect(41, 20, 18, 46, 9, '#93cf82', '#5a9a4f', { stroke: '#4f8a45', sw: 3 })}
    <g stroke="#3f7038" stroke-width="1.6" opacity=".7">
      <path d="M 45 30 h -4 M 55 38 h 4 M 45 46 h -4 M 55 54 h 4"/>
    </g>
    ${litEllipse(50, 19, 5, 5, '#ffc0d6', '#e07fa6')}
    ${litPath('M 34 64 h 32 l -4 24 h -24 z', '#e59a71', '#b06a45', { stroke: '#a5613f', sw: 3, join: 'round' })}
    ${litRect(32, 59, 36, 9, 4, '#f0b28f', '#c17c56', { stroke: '#a5613f', sw: 3 })}`,

  plant_succulent: () => {
    let r = '';
    for (let ring = 3; ring >= 1; ring--) {
      const n = ring * 4, len = 7 + ring * 7;
      for (let i = 0; i < n; i++) {
        const a = (i / n) * Math.PI * 2 + ring * 0.4;
        const cx = 50 + Math.cos(a) * len * 0.52, cy = 46 + Math.sin(a) * len * 0.34;
        r += `<ellipse cx="${n2(cx)}" cy="${n2(cy)}"
                rx="${n2(len * 0.42)}" ry="${n2(len * 0.26)}"
                transform="rotate(${n2(a * 57.3)} ${n2(cx)} ${n2(cy)})"
                fill="${['#8fd3a8', '#a8dcbb', '#c3e8cf'][ring - 1]}" stroke="#5f9b73" stroke-width="2"
                opacity="${n2(0.98 - Math.sin(a) * 0.16)}"/>`;
      }
    }
    return contact(50, 90, 24, 5, .26) +
      litPath('M 34 60 h 32 l -4 28 h -24 z', '#d6b3e8', '#a184c2', { stroke: '#8a6fa8', sw: 3, join: 'round' }) +
      litRect(32, 55, 36, 9, 4, '#e2c6f0', '#b096cc', { stroke: '#8a6fa8', sw: 3 }) + r;
  },

  plant_flowers: () => `
    ${contact(50, 89, 24, 5, .26)}
    <path d="M 50 62 V 30 M 38 62 V 40 M 62 62 V 44" fill="none" stroke="#5f9b5a" stroke-width="3.5" stroke-linecap="round"/>
    <path d="M 44 46 q -8 -4 -6 -10 q 8 1 6 10z M 56 50 q 8 -4 6 -10 q -8 1 -6 10z" fill="#7fc276"/>
    ${[[50, 26, '#f2849f', '#d05f7e'], [38, 36, '#ffd980', '#dfae42'], [62, 40, '#a8c8f0', '#7ba1d2']].map(([x, y, c, d]) =>
      [...Array(5)].map((_, i) => {
        const a = (i / 5) * Math.PI * 2;
        return litEllipse(n2(x + Math.cos(a) * 6), n2(y + Math.sin(a) * 6), 4.6, 4.6, c, d);
      }).join('') + `<circle cx="${x}" cy="${y}" r="3.4" fill="#fff6e8"/>`).join('')}
    ${litPath('M 34 62 h 32 l -4 26 h -24 z', '#a3d3e4', '#6b9cb0', { stroke: '#4d7f92', sw: 3, join: 'round' })}
    ${litRect(32, 57, 36, 9, 4, '#bee2ee', '#8ab5c6', { stroke: '#4d7f92', sw: 3 })}`,

  plant_tall: () => `
    ${contact(50, 91, 22, 4.5, .26)}
    ${litRect(36, 64, 28, 26, 4, '#e0b183', '#a87f55', { stroke: '#8a6340', sw: 3 })}
    ${litRect(33, 60, 34, 9, 4, '#f0cda4', '#c19a6c', { stroke: '#8a6340', sw: 3 })}
    <path d="M 50 64 V 20" stroke="#6ba85e" stroke-width="4" stroke-linecap="round"/>
    ${[[-1, 22, 26], [1, 30, 24], [-1, 40, 22], [1, 48, 19]].map(([side, y, len]) =>
      litPath(`M 50 ${y} q ${side * len * 0.7} ${-len * 0.5} ${side * len} ${-len * 0.1}
                q ${-side * len * 0.4} ${len * 0.55} ${-side * len} ${len * 0.1} z`,
        side < 0 ? '#93d8ae' : '#7cc79a', side < 0 ? '#5aa97d' : '#4f9b6d',
        { stroke: '#4f8a5c', sw: 2.5, join: 'round' })).join('')}`,

  plant_big_leaf: () => `
    ${contact(50, 91, 24, 5, .26)}
    ${litPath('M 36 66 h 28 l -3 24 h -22 z', '#f79cb2', '#cf7290', { stroke: '#b3596e', sw: 3, join: 'round' })}
    ${litRect(33, 61, 34, 9, 4, '#fbb6c8', '#d88ba3', { stroke: '#b3596e', sw: 3 })}
    ${[[-26, 44, -22, '#7fcd9c', '#4f9b6d'], [26, 46, 22, '#a3dcb8', '#63ab83'],
       [-14, 24, -8, '#93d8ae', '#5aa97d'], [16, 22, 10, '#b3e5c6', '#79bf94']]
      .map(([dx, y, rot, light, dark]) => `
        <g transform="translate(${50 + dx} ${y}) rotate(${rot})">
          ${litPath('M 0 22 C -15 12 -15 -12 0 -20 C 15 -12 15 12 0 22 Z', light, dark,
            { stroke: '#3d7f5a', sw: 2.6, join: 'round' })}
          <path d="M 0 20 V -18" stroke="#3d7f5a" stroke-width="2"/>
        </g>`).join('')}
    <path d="M 50 64 V 40 M 50 54 l -10 -8 M 50 50 l 10 -10" stroke="#4f8a5c" stroke-width="2.6" stroke-linecap="round"/>`,

  plant_bonsai: () => `
    ${contact(50, 91, 28, 5, .26)}
    ${litPath('M 30 68 h 40 l -4 22 h -32 z', '#9c81ae', '#6f5885', { stroke: '#5f4a70', sw: 3, join: 'round' })}
    ${litRect(27, 63, 46, 9, 4, '#b79dc7', '#8a71a0', { stroke: '#5f4a70', sw: 3 })}
    <path d="M 50 66 C 50 52 40 50 38 40" fill="none" stroke="#8a6340" stroke-width="7" stroke-linecap="round"/>
    <path d="M 50 58 C 54 50 62 50 64 44" fill="none" stroke="#8a6340" stroke-width="5" stroke-linecap="round"/>
    ${litEllipse(34, 34, 17, 11, '#7fcd9c', '#4b9068', { stroke: '#3f8a5f', sw: 3 })}
    ${litEllipse(66, 38, 14, 9, '#93d8ae', '#57a17a', { stroke: '#3f8a5f', sw: 3 })}
    ${litEllipse(52, 24, 15, 10, '#a3dcb8', '#63ab83', { stroke: '#3f8a5f', sw: 3 })}`,

  /* ================= More for the floor ================= */

  watering_can: () => `
    ${contact(48, 88, 24, 5, .26)}
    ${litRect(30, 50, 34, 34, 6, '#a3d5e6', '#6ba3bc', { stroke: '#4d7f92', sw: 3 })}
    ${litPath('M 64 58 l 18 -12 6 5 -16 14 z', '#bfe3ef', '#87b8cc', { stroke: '#4d7f92', sw: 3, join: 'round' })}
    <path d="M 30 58 q -12 6 0 18" fill="none" stroke="#4d7f92" stroke-width="4" stroke-linecap="round"/>
    ${litRect(34, 44, 26, 8, 4, '#bfe3ef', '#87b8cc', { stroke: '#4d7f92', sw: 3 })}
    <path d="M 35 55 v 24" stroke="#fff" stroke-opacity=".38" stroke-width="3.5"/>
    <circle cx="86" cy="36" r="3" fill="#bfe6f5"/><circle cx="92" cy="44" r="2.4" fill="#bfe6f5"/>`,

  toy_blocks: () => `
    ${contact(48, 86, 32, 5, .26)}
    ${litRect(20, 56, 26, 26, 4, '#f79797', '#cc5d5d', { stroke: '#b34d4d', sw: 3 })}
    ${litRect(50, 56, 26, 26, 4, '#88c2e2', '#4f8fb3', { stroke: '#3f7d9e', sw: 3 })}
    ${litRect(35, 28, 26, 26, 4, '#ffd97a', '#dda634', { stroke: '#c9922c', sw: 3 })}
    ${raised(20, 56, 26, 26, 4, { sw: 2.2 })}${raised(50, 56, 26, 26, 4, { sw: 2.2 })}
    ${raised(35, 28, 26, 26, 4, { sw: 2.2 })}
    <text x="33" y="76" font-family="system-ui" font-size="18" font-weight="900" fill="#fff">A</text>
    <text x="63" y="76" font-family="system-ui" font-size="18" font-weight="900" fill="#fff">C</text>
    <text x="48" y="48" font-family="system-ui" font-size="18" font-weight="900" fill="#fff">B</text>`,

  stool: () => `
    ${contact(50, 90, 26, 5, .26)}
    <path d="M 26 54 L 20 86 M 74 54 L 80 86 M 50 58 V 88"
          stroke="#a5794f" stroke-width="7" stroke-linecap="round"/>
    ${litEllipse(50, 50, 30, 12, '#e0b183', '#ab7f52', { stroke: '#8a6340', sw: 3 })}
    ${litEllipse(50, 47, 30, 12, '#f0cda4', '#c19a6c', { stroke: '#8a6340', sw: 3 })}
    <path d="M 26 44 q 24 -8 48 0" fill="none" stroke="#fff" stroke-opacity=".35" stroke-width="3"/>`,

  floor_lamp: () => `
    ${contact(50, 90, 22, 5, .26)}
    ${litEllipse(50, 88, 20, 7, '#d5b48a', '#a5875f', { stroke: '#8a6340', sw: 3 })}
    <path d="M 50 86 V 40 q 0 -10 -12 -12" fill="none" stroke="#8a6340" stroke-width="5" stroke-linecap="round"/>
    ${litPath('M 18 24 h 34 l -6 20 h -22 z', '#ffd97a', '#dda634', { stroke: '#c9922c', sw: 3, join: 'round' })}
    <ellipse cx="35" cy="46" rx="12" ry="4" fill="#fff6e8" opacity=".85"/>
    <path d="M 21 26 h 12 l -3 16 h -7 z" fill="#fff" opacity=".24"/>`,

  easel: () => `
    ${contact(50, 92, 30, 5, .24)}
    <path d="M 26 88 L 42 34 M 74 88 L 58 34 M 50 40 V 92" stroke="#a5794f" stroke-width="6" stroke-linecap="round"/>
    ${litRect(24, 30, 52, 40, 3, '#fffaf0', '#ddcbb2', { stroke: '#8a6340', sw: 3.5 })}
    <path d="M 28 62 q 12 -20 22 -8 q 8 10 22 -6 v 14 h -44 z" fill="#8fd3a8"/>
    <path d="M 28 66 q 12 -12 22 -4 q 8 7 22 -2 v 8 h -44 z" fill="#6fbd8c" opacity=".7"/>
    <circle cx="63" cy="41" r="6" fill="#ffd980"/>
    ${litRect(22, 66, 56, 7, 3, '#d5a577', '#9a7146', { stroke: '#8a6340', sw: 3 })}`,

  rocking_horse: () => `
    ${contact(50, 90, 34, 5, .24)}
    <path d="M 16 82 q 34 14 68 0" fill="none" stroke="#a5794f" stroke-width="7" stroke-linecap="round"/>
    <path d="M 32 78 V 58 M 64 78 V 56" stroke="#c9a87c" stroke-width="7" stroke-linecap="round"/>
    ${litEllipse(48, 52, 26, 15, '#f9d8bc', '#d9a37d', { stroke: '#a5613f', sw: 3 })}
    ${litEllipse(72, 38, 14, 14, '#f9d8bc', '#d9a37d', { stroke: '#a5613f', sw: 3 })}
    ${litPath('M 78 26 l 8 -8 -2 10 z', '#f9d8bc', '#d9a37d', { stroke: '#a5613f', sw: 2.5, join: 'round' })}
    <circle cx="78" cy="36" r="3" fill="#3a2e28"/>
    <path d="M 62 30 q -10 4 -12 16" fill="none" stroke="#e2566f" stroke-width="5" stroke-linecap="round"/>
    <path d="M 24 46 q -8 8 -6 20" fill="none" stroke="#e2566f" stroke-width="5" stroke-linecap="round"/>`,

  /* ================= More beds ================= */

  bed_hammock: () => `
    ${contact(50, 92, 36, 4.5, .22)}
    ${litRect(7, 26, 6, 60, 3, '#c09667', '#8c6640')}
    ${litRect(87, 26, 6, 60, 3, '#c09667', '#8c6640')}
    ${litPath('M 12 34 Q 50 82 88 34 Q 50 68 12 34 z', '#fbca74', '#d79c3a', { stroke: '#c9922c', sw: 3.5, join: 'round' })}
    <path d="M 12 34 Q 50 70 88 34" fill="none" stroke="#fff6e8" stroke-width="2.5" opacity=".7"/>
    ${[22, 34, 50, 66, 78].map(x => `<path d="M ${x} ${28 + Math.abs(50 - x) * 0.12} L ${x} ${52 - Math.abs(50 - x) * 0.34}"
        stroke="#c9922c" stroke-width="2" opacity=".6"/>`).join('')}`,

  bed_lilypad: () => `
    ${contact(50, 88, 42, 5.5, .2)}
    ${litEllipse(50, 66, 44, 26, '#96d8ab', '#5f9f70', { stroke: '#4f8a5c', sw: 3.5 })}
    <path d="M 50 66 L 86 58 M 50 66 L 80 82 M 50 66 L 30 86 M 50 66 L 12 60 M 50 66 L 26 46"
          stroke="#4f8a5c" stroke-width="2" opacity=".55"/>
    <path d="M 50 66 L 62 42 a 14 14 0 0 0 -24 0 z" fill="#9fd8b4"/>
    ${litEllipse(50, 58, 22, 12, '#d9f2e2', '#a3d3b5', { stroke: '#4f8a5c', sw: 2.5 })}
    ${litEllipse(74, 42, 8, 8, '#ffc6dc', '#e18aae', { stroke: '#c07e96', sw: 2.5 })}
    <circle cx="74" cy="42" r="3.4" fill="#ffd980"/>`,

  bed_mushroom: () => `
    ${contact(50, 91, 32, 4.5, .24)}
    ${litRect(34, 58, 12, 32, 6, '#fff8ec', '#ddc9a8', { stroke: '#c9a97c', sw: 3 })}
    ${litPath('M 8 62 a 42 30 0 0 1 84 0 z', '#ef6f66', '#b8433c', { stroke: '#a83a35', sw: 3.5, join: 'round' })}
    <circle cx="28" cy="48" r="7" fill="#fff" opacity=".92"/><circle cx="52" cy="40" r="9" fill="#fff" opacity=".95"/>
    <circle cx="72" cy="50" r="6" fill="#fff" opacity=".85"/><circle cx="40" cy="57" r="4.6" fill="#fff" opacity=".85"/>
    <path d="M 12 60 a 40 28 0 0 1 22 -24" fill="none" stroke="#fff" stroke-opacity=".3" stroke-width="4"/>
    ${litEllipse(62, 80, 26, 11, '#fff2f7', '#eabfcf', { stroke: '#c07e96', sw: 3 })}`,

  bed_cloud: () => `
    ${contact(50, 88, 40, 5, .16)}
    ${litEllipse(28, 58, 20, 20, '#ffffff', '#dde7f2', { stroke: '#c6d4e4', sw: 3.5 })}
    ${litEllipse(52, 48, 26, 26, '#ffffff', '#dde7f2', { stroke: '#c6d4e4', sw: 3.5 })}
    ${litEllipse(76, 58, 18, 18, '#ffffff', '#dde7f2', { stroke: '#c6d4e4', sw: 3.5 })}
    ${litRect(12, 58, 76, 24, 12, '#fdfeff', '#d5e1ef', { stroke: '#c6d4e4', sw: 3.5 })}
    <ellipse cx="34" cy="61" rx="14" ry="7" fill="#e6eef8" opacity=".9"/>
    <path d="M 20 54 q 8 -4 16 0 M 62 50 q 8 -4 16 2" fill="none" stroke="#dce6f2" stroke-width="3" stroke-linecap="round"/>`,

  /* ================= More rugs ================= */

  rug_moss: () => `
    ${contact(50, 64, 44, 26, .18)}
    ${litEllipse(50, 62, 42, 24, '#a8d494', '#83b271', { stroke: '#5f8a4f', sw: 3.5, cy: '30%' })}
    ${[...Array(14)].map((_, i) => {
      const a = (i / 14) * Math.PI * 2;
      return `<ellipse cx="${n2(50 + Math.cos(a) * 26)}" cy="${n2(62 + Math.sin(a) * 14)}" rx="7" ry="4.6"
                fill="#a4cf90" opacity="${n2(0.95 - Math.sin(a) * 0.22)}"/>`;
    }).join('')}
    ${litEllipse(50, 62, 16, 9, '#d0efbd', '#a8d194')}`,

  rug_star: () => {
    let d = '';
    for (let i = 0; i < 10; i++) {
      const a = (Math.PI / 5) * i - Math.PI / 2;
      const r = i % 2 ? 18 : 44;
      d += `${i ? 'L' : 'M'} ${n2(50 + Math.cos(a) * r)} ${n2(62 + Math.sin(a) * r * 0.58)} `;
    }
    return contact(50, 64, 44, 26, .16) +
      litPath(`${d}Z`, '#ffd97a', '#dda634', { stroke: '#c9922c', sw: 3.5, join: 'round' }) +
      litEllipse(50, 62, 11, 11, '#fff2c9', '#e8c976', { stroke: '#c9922c', sw: 2.5 });
  },

  rug_flower: () => `
    ${contact(50, 64, 45, 28, .16)}
    ${[...Array(8)].map((_, i) => {
      const a = (i / 8) * Math.PI * 2;
      return litEllipse(n2(50 + Math.cos(a) * 26), n2(62 + Math.sin(a) * 15), 17, 11,
        '#ffb9d2', '#dd87a8', { stroke: '#c07e96', sw: 3 });
    }).join('')}
    ${litEllipse(50, 62, 20, 12, '#ffe9a8', '#e0b455', { stroke: '#c9922c', sw: 3 })}`,

  rug_cloud: () => `
    ${contact(50, 68, 42, 20, .14)}
    ${litEllipse(30, 60, 18, 12, '#f2f8ff', '#cfdeee', { stroke: '#bcd0e4', sw: 3 })}
    ${litEllipse(70, 60, 18, 12, '#f2f8ff', '#cfdeee', { stroke: '#bcd0e4', sw: 3 })}
    ${litEllipse(50, 54, 24, 15, '#fbfdff', '#dae7f5', { stroke: '#bcd0e4', sw: 3 })}
    ${litEllipse(50, 66, 40, 16, '#fbfdff', '#dae7f5', { stroke: '#bcd0e4', sw: 3 })}
    <ellipse cx="50" cy="64" rx="22" ry="8" fill="#dbe8f7" opacity=".8"/>`,

  /* ================= More for the walls ================= */

  butterflies: () => `
    ${[[28, 40, '#f2849f', 1], [58, 26, '#a8c8f0', .82], [70, 52, '#ffd980', .7]].map(([x, y, c, sc]) =>
      `<g transform="translate(${x} ${y}) scale(${sc})">
         <path d="M 0 0 C -16 -16 -22 -2 -4 6 Z" fill="${c}" stroke="#8a6f7c" stroke-width="2" stroke-linejoin="round"/>
         <path d="M 0 0 C 16 -16 22 -2 4 6 Z"  fill="${c}" stroke="#8a6f7c" stroke-width="2" stroke-linejoin="round"/>
         <path d="M 0 -4 V 8" stroke="#5a4033" stroke-width="3" stroke-linecap="round"/>
       </g>`).join('')}`,

  small_shelf: () => `
    <rect class="${SHADOW}" x="18" y="56.5" width="68" height="8" rx="3" fill="#3a2c1e" opacity=".17"/>
    ${litRect(16, 54, 68, 8, 3, '#d5a577', '#9a7146', { stroke: '#8a6340', sw: 3 })}
    <path d="M 24 62 v 8 M 76 62 v 8" stroke="#8a6340" stroke-width="3.5" stroke-linecap="round"/>
    ${litRect(26, 34, 9, 20, 2, '#f79797', '#cc5d5d')}
    ${litRect(37, 38, 8, 16, 2, '#88c2e2', '#4f8fb3')}
    ${litEllipse(60, 46, 8, 8, '#a3dcb8', '#69b98c', { stroke: '#4f8a5c', sw: 2.5 })}
    ${litRect(70, 42, 10, 12, 2, '#ffd980', '#dfa93c')}`,

  mirror: () => `
    <circle class="${SHADOW}" cx="52.4" cy="50.6" r="32" fill="#3a2c1e" opacity=".17"/>
    ${litEllipse(50, 48, 32, 32, '#e6f0f7', '#bccddb', { stroke: '#a5875f', sw: 6 })}
    ${litEllipse(50, 48, 26, 26, '#fbfdff', '#d3e3ee')}
    <path d="M 32 58 q 14 -26 34 -14" fill="none" stroke="#fff" stroke-width="7" opacity=".85" stroke-linecap="round"/>
    <circle cx="50" cy="12" r="5" fill="#f6c453" stroke="#c9922c" stroke-width="2"/>`,

  wall_planter: () => `
    <path d="M 50 8 V 24" stroke="#a5875f" stroke-width="3"/>
    <path class="${SHADOW}" d="M 32 26 h 40 l -5 22 h -30 z" fill="#3a2c1e" opacity=".16"/>
    ${litPath('M 30 24 h 40 l -5 22 h -30 z', '#e59a71', '#b06a45', { stroke: '#a5613f', sw: 3, join: 'round' })}
    ${litRect(27, 20, 46, 8, 4, '#f0b28f', '#c17c56', { stroke: '#a5613f', sw: 3 })}
    ${[[-1, 34], [1, 30], [-1, 20]].map(([side, len]) =>
      `<path d="M ${50 + side * 12} 44 q ${side * 8} ${len * 0.6} ${side * 4} ${len}"
            fill="none" stroke="#5fae7f" stroke-width="3.5" stroke-linecap="round"/>`).join('')}
    ${litEllipse(36, 72, 5, 5, '#a3dcb8', '#69b98c')}${litEllipse(62, 66, 4.4, 4.4, '#a3dcb8', '#69b98c')}
    ${litEllipse(44, 84, 4, 4, '#a3dcb8', '#69b98c')}`,

  map: () => `
    <path class="${SHADOW}" d="M 16 24.5 q 18 -6 36 0 q 18 6 36 0 v 56 q -18 6 -36 0 q -18 -6 -36 0 z" fill="#3a2c1e" opacity=".16"/>
    ${litPath('M 14 22 q 18 -6 36 0 q 18 6 36 0 v 56 q -18 6 -36 0 q -18 -6 -36 0 z', '#f8ecd2', '#dcc79f', { stroke: '#a5875f', sw: 3.5, join: 'round' })}
    <path d="M 24 60 q 12 -22 26 -10 q 14 12 26 -8" fill="none" stroke="#8a6340" stroke-width="2.5" stroke-dasharray="5 5"/>
    <path d="M 66 38 l 8 8 M 74 38 l -8 8" stroke="#d4594f" stroke-width="4" stroke-linecap="round"/>
    <path d="M 26 40 l 6 -8 6 8 z" fill="#8fb87c"/>`,

  fairy_lights: () => `
    <path d="M 6 20 Q 50 44 94 20" fill="none" stroke="#8a7560" stroke-width="2.5"/>
    ${[...Array(7)].map((_, i) => {
      const t = i / 6, x = 6 + t * 88;
      const y = 20 + Math.sin(t * Math.PI) * 24;
      const c = ['#ffd980', '#f7a8c6', '#a8dcbb', '#a8c8f0'][i % 4];
      return `<path d="M ${n2(x)} ${n2(y)} v 5" stroke="#8a7560" stroke-width="2"/>
              <circle cx="${n2(x)}" cy="${n2(y + 10)}" r="6" fill="${c}" stroke="#c9a97c" stroke-width="1.6"/>
              <circle cx="${n2(x - 1.6)}" cy="${n2(y + 8)}" r="2" fill="#fff" opacity=".8"/>`;
    }).join('')}`,

  rainbow_arch: () => `
    ${['#e2564f', '#f2954f', '#f6c453', '#7fc99a', '#6fb3d9', '#a78bc9'].map((c, i) =>
      `<path d="M ${14 + i * 6} 78 a ${36 - i * 6} ${36 - i * 6} 0 0 1 ${72 - i * 12} 0"
            fill="none" stroke="${c}" stroke-width="6"/>`).join('')}
    <ellipse cx="14" cy="80" rx="11" ry="7" fill="#fff" stroke="#c6d4e4" stroke-width="2.5"/>
    <ellipse cx="86" cy="80" rx="11" ry="7" fill="#fff" stroke="#c6d4e4" stroke-width="2.5"/>`,

  /* ================= More windows and doors ================= */

  window_flower: () => `
    <rect x="18" y="12" width="64" height="54" rx="4" fill="var(--season-glass, #bfe6f5)"/>
    ${ringRect(18, 12, 64, 54, 4, 8, '#d9c4a5', '#8f7149')}
    ${inset(18, 12, 64, 54, 4, { sw: 3, shade: .26, light: .24 })}
    ${gloss(23, 15, 14, 46, { rot: -16, peak: .4 })}
    <path d="M 50 12 v 54 M 18 39 h 64" stroke="#d9c4a5" stroke-width="5"/>
    <path d="M 51.8 12 v 54 M 18 40.8 h 64" stroke="#3a2c1e" stroke-opacity=".18" stroke-width="2"/>
    <rect x="18" y="12" width="64" height="54" rx="4" fill="none" stroke="#a5875f" stroke-width="3.4"/>
    ${litPath('M 12 66 h 76 l -5 20 h -66 z', '#e29b72', '#b06a45', { stroke: '#a5613f', sw: 3.5, join: 'round' })}
    <path d="M 14 69 h 72" stroke="#fff" stroke-opacity=".3" stroke-width="2.4"/>
    ${[24, 40, 56, 72].map((x, i) =>
      `<circle cx="${x}" cy="${62 - (i % 2) * 5}" r="6" fill="${['#f2849f', '#ffd980', '#c9a3e0', '#f7a8c6'][i]}"/>
       <circle cx="${x - 1.6}" cy="${60.4 - (i % 2) * 5}" r="2.4" fill="#fff6e8" opacity=".9"/>`).join('')}
    <rect class="${SHADOW}" x="15" y="86" width="70" height="3.2" rx="1.6" fill="#4a3a2c" opacity=".16"/>`,

  window_star: () => {
    let d = '';
    for (let i = 0; i < 10; i++) {
      const a = (Math.PI / 5) * i - Math.PI / 2;
      const r = i % 2 ? 18 : 42;
      d += `${i ? 'L' : 'M'} ${n2(50 + Math.cos(a) * r)} ${n2(48 + Math.sin(a) * r)} `;
    }
    return `<path d="${d}Z" fill="var(--season-glass, #cfe6f5)"/>` +
      ringPath(`${d}Z`, 8, '#d9c4a5', '#8f7149') +
      `<path d="${d}Z" fill="none" stroke="#3a2c1e" stroke-opacity=".18" stroke-width="2.6" stroke-linejoin="round"/>` +
      gloss(34, 30, 12, 30, { rot: -22, peak: .5 }) +
      `<path d="${d}Z" fill="none" stroke="#a5875f" stroke-width="3" stroke-linejoin="round"/>`;
  },

  door_barn: () => `
    ${contact(50, 97, 32, 2.6, .3)}
    ${litRect(18, 10, 64, 86, 3, '#e06a5f', '#a8433c', { stroke: '#8a3a35', sw: 5 })}
    <path d="M 50 10 V 96" stroke="#8a3a35" stroke-width="4"/>
    <path d="M 20 30 h 60 M 20 74 h 60" stroke="#efb0aa" stroke-width="5"/>
    <path d="M 20 32.6 h 60 M 20 76.6 h 60" stroke="#7d332e" stroke-opacity=".4" stroke-width="2"/>
    <path d="M 22 32 L 48 72 M 78 32 L 52 72" stroke="#efb0aa" stroke-width="5"/>
    <circle cx="44" cy="54" r="3.6" fill="#f6c453"/><circle cx="56" cy="54" r="3.6" fill="#f6c453"/>`,

  door_star: () => `
    ${contact(50, 97, 31, 2.6, .32)}
    ${litRect(20, 8, 60, 88, 6, '#5b6aa8', '#39457a', { stroke: '#333d66', sw: 5 })}
    ${[[50, 34, 15], [34, 58, 8], [66, 62, 9], [50, 76, 6]].map(([x, y, r]) => {
      let d = '';
      for (let i = 0; i < 10; i++) {
        const a = (Math.PI / 5) * i - Math.PI / 2;
        const rr = i % 2 ? r * 0.44 : r;
        d += `${i ? 'L' : 'M'} ${n2(x + Math.cos(a) * rr)} ${n2(y + Math.sin(a) * rr)} `;
      }
      return `<path d="${d}Z" fill="#000" opacity=".2" transform="translate(1.4 1.6)"/>` +
             litPath(`${d}Z`, '#fff6d4', '#e8c976', { stroke: '#e0c274', sw: 1.6, join: 'round' });
    }).join('')}
    <circle cx="70" cy="54" r="4.6" fill="#f6c453" stroke="#c9922c" stroke-width="2"/>
    <circle cx="68.4" cy="52.4" r="1.7" fill="#fff" opacity=".75"/>`,

  /* ---- Special decorations ---- */
  blossom_lamp: () => DECOR.lamp().replace(/#ef7f7f/g, '#f4a8c6').replace(/#b34d4d/g, '#b3596e'),
  star_rug:     () => DECOR.rug().replace(/#e8a17c/g, '#a78bc9').replace(/#f4c9a8/g, '#cdb8e4').replace(/#a5613f/g, '#7a5f9c'),
  word_castle:  () => DECOR.castle(),
  cozy_candle: () => `
    <rect x="40" y="44" width="20" height="42" rx="5" fill="#fdf0d8" stroke="#c9a97c" stroke-width="3"/>
    <rect x="36" y="82" width="28" height="9" rx="4" fill="#e8d3ba" stroke="#a5875f" stroke-width="2.5"/>
    <path d="M 50 44 L 50 36" stroke="#8a7560" stroke-width="2.5"/>
    <path d="M 50 14 q 10 12 0 22 q -10 -10 0 -22 z" fill="#ffd980" stroke="#f0a93c" stroke-width="2"/>
    <path d="M 50 22 q 4 6 0 11 q -4 -5 0 -11 z" fill="#fff6e8"/>`,
  week_banner: () => `
    <path d="M 10 22 Q 50 34 90 22" fill="none" stroke="#a5875f" stroke-width="3"/>
    ${[0,1,2,3,4].map(i => {
      const x = 18 + i * 16, y = 25 + Math.sin(i / 4 * Math.PI) * 5;
      const c = ['#ef7f7f','#f6c453','#8fd3a8','#6fb3d9','#c9a3e0'][i];
      return `<path d="M ${x - 7} ${y} L ${x + 7} ${y} L ${x} ${y + 20} Z" fill="${c}" stroke="#8a7560" stroke-width="2" stroke-linejoin="round"/>`;
    }).join('')}`,
  sun_mobile: () => `
    <path d="M 50 10 L 50 26" stroke="#a5875f" stroke-width="3" stroke-linecap="round"/>
    <circle cx="50" cy="46" r="18" fill="#ffd980" stroke="#e0a93c" stroke-width="3"/>
    ${[...Array(8)].map((_, i) => {
      const a = (i / 8) * Math.PI * 2;
      return `<path d="M ${n(50 + Math.cos(a) * 22)} ${n(46 + Math.sin(a) * 22)}
                       L ${n(50 + Math.cos(a) * 30)} ${n(46 + Math.sin(a) * 30)}"
                    stroke="#f6c453" stroke-width="4" stroke-linecap="round"/>`;
    }).join('')}
    <circle cx="44" cy="42" r="2.6" fill="#3a2e28"/><circle cx="56" cy="42" r="2.6" fill="#3a2e28"/>
    <path d="M 44 52 q 6 6 12 0" fill="none" stroke="#3a2e28" stroke-width="2.4" stroke-linecap="round"/>`,
  ribbon_shelf: () => DECOR.bookshelf() + `
    <path d="M 50 20 l 8 -10 4 6 -6 6 z" fill="#ef6f8e"/>
    <path d="M 50 20 l -8 -10 -4 6 6 6 z" fill="#ef6f8e"/>
    <circle cx="50" cy="21" r="4" fill="#f78ba6" stroke="#b34a66" stroke-width="1.8"/>`,
  trophy_shelf: () => `
    <rect x="14" y="62" width="72" height="8" rx="3" fill="#c99a6e" stroke="#8a6340" stroke-width="3"/>
    <path d="M 40 58 h 20 l -3 -16 h -14 z" fill="#f6c453" stroke="#c9922c" stroke-width="2.5" stroke-linejoin="round"/>
    <path d="M 43 42 q -12 2 -10 -10 M 57 42 q 12 2 10 -10" fill="none" stroke="#c9922c" stroke-width="3"/>
    <rect x="42" y="56" width="16" height="7" rx="2" fill="#c9922c"/>
    <circle cx="24" cy="54" r="7" fill="#c9a3e0" stroke="#8a6fa8" stroke-width="2.5"/>
    <circle cx="76" cy="54" r="7" fill="#8fd3a8" stroke="#4f9b6d" stroke-width="2.5"/>`,
  /* ===================== The garden =====================

     Outdoors, so these are drawn standing in the open rather than against
     a wall. Two conventions:

       trees and uprights  stand on y = 96, and may fill the box upwards
       ponds               lie flat, an ellipse seen at an angle
       fences              run edge to edge, x = 0 to x = 100, because the
                           garden tiles four of them across the back — a
                           rail that stops short leaves a gap at every join
  */

  /* ---- Trees ---- */
  tree_apple: () => `
    ${contact(50, 95, 26, 5, .3)}
    <path d="M 46 96 V 58 q -1 -8 -8 -12 M 54 96 V 62 q 1 -7 8 -11" fill="none" stroke="#8a6340" stroke-width="7" stroke-linecap="round"/>
    ${litRect(43, 58, 14, 38, 4, '#b08557', '#7d5a3a', { stroke: '#7d5a3a', sw: 3.5 })}
    ${grain(44.5, 60, 11, 34, 3, 2, { color: '#5f4328', strength: .3, sw: 1.6 })}
    ${litEllipse(30, 46, 17, 17, '#84c273', '#4b8244', { stroke: '#4b8244', sw: 4 })}
    ${litEllipse(70, 46, 17, 17, '#6fae5f', '#417539', { stroke: '#4b8244', sw: 4 })}
    ${litEllipse(50, 34, 25, 25, '#7bbb6a', '#48803f', { stroke: '#4b8244', sw: 4 })}
    ${[[36, 40], [58, 30], [66, 50], [46, 52], [26, 50], [60, 62]].map(([x, y]) =>
      litEllipse(x, y, 4.6, 4.6, '#ef7268', '#b8433a', { stroke: '#a83c33', sw: 1.8 })).join('')}`,

  tree_blossom: () => `
    ${contact(50, 95, 25, 5, .3)}
    ${litRect(44, 56, 12, 40, 4, '#ad825c', '#7a583c', { stroke: '#7a583c', sw: 3.5 })}
    <path d="M 50 70 L 34 56 M 50 66 L 66 52" fill="none" stroke="#9c7350" stroke-width="5" stroke-linecap="round"/>
    ${litEllipse(30, 44, 16, 16, '#fdd8e6', '#e8a0bc', { stroke: '#dd91ad', sw: 4 })}
    ${litEllipse(70, 44, 16, 16, '#f6b7ce', '#d98aa8', { stroke: '#dd91ad', sw: 4 })}
    ${litEllipse(50, 32, 24, 24, '#fbc8da', '#e096b2', { stroke: '#dd91ad', sw: 4 })}
    ${[[40, 28], [58, 24], [64, 42], [34, 48], [52, 46]].map(([x, y]) =>
      `<circle cx="${x}" cy="${y}" r="3" fill="#fff4f8"/>`).join('')}`,

  tree_pine: () => `
    ${contact(50, 95, 30, 5, .3)}
    ${litRect(45, 76, 10, 20, 3, '#9a7048', '#6d4d31', { stroke: '#6d4d31', sw: 3 })}
    ${litPath('M 50 46 L 84 80 H 16 Z', '#5fa565', '#3a6e42', { stroke: '#3a6e42', sw: 4, join: 'round' })}
    ${litPath('M 50 26 L 78 60 H 22 Z', '#6bb372', '#417a49', { stroke: '#3a6e42', sw: 4, join: 'round' })}
    ${litPath('M 50 8 L 72 40 H 28 Z', '#5fa565', '#3a6e42', { stroke: '#3a6e42', sw: 4, join: 'round' })}`,
  /* Strands first, canopy last: the canopy has to cap where they start,
     or a willow looks like a jellyfish. */
  tree_willow: () => `
    ${contact(50, 95, 30, 5, .3)}
    <path d="M 50 96 V 50" stroke="#9a7a52" stroke-width="11" stroke-linecap="round"/>
    <path d="M 47 92 V 54" stroke="#b8946a" stroke-opacity=".5" stroke-width="3"/>
    <path d="M 50 62 q -9 -7 -15 -15 M 50 57 q 9 -6 16 -13" fill="none" stroke="#9a7a52" stroke-width="5" stroke-linecap="round"/>
    ${[20, 26, 32, 38, 44, 56, 62, 68, 74, 80].map((x, i) => {
      const end = 66 + (i % 4) * 7;
      const bow = x < 50 ? -5 : 5;
      return `<path d="M ${x} 34 q ${bow} ${(end - 34) / 2} ${bow / 2} ${end - 34}" fill="none"
                    stroke="${i % 2 ? '#6fae5f' : '#88c477'}" stroke-width="3.6" stroke-linecap="round"/>`;
    }).join('')}
    ${litEllipse(50, 36, 33, 18, '#8cc87a', '#548c4c', { stroke: '#548c4c', sw: 4 })}
    <ellipse cx="38" cy="30" rx="15" ry="7" fill="#a8d898" opacity=".26"/>`,

  /* ---- Water. Flat on the ground, seen at an angle. ---- */
  /* ---- Water. Flat on the ground, seen at an angle ----
     A pond is a hole, so it is dark at the far edge and light towards the
     near one, with the bank throwing a shadow onto the water underneath it.
     Flat blue with white dashes on it reads as a puddle sticker. */
  pond_small: () => `
    ${litEllipse(50, 62, 44, 26, '#98aa80', '#6d7f5a', { stroke: '#6d7f5a', sw: 4, cy: '20%' })}
    <ellipse cx="50" cy="60" rx="37" ry="21" fill="#4f93ad"/>
    ${litEllipse(50, 61, 36, 20, '#a7dcec', '#4a8ba6', { cy: '78%', r: '92%' })}
    <ellipse cx="50" cy="57" rx="31" ry="15" fill="#bfe8f3" opacity=".35"/>
    ${gloss(26, 52, 26, 3.6, { rot: -5, peak: .42 })}
    ${gloss(54, 67, 18, 3, { rot: -4, peak: .3 })}`,

  pond_lily: () => `
    ${litEllipse(50, 62, 44, 26, '#98aa80', '#6d7f5a', { stroke: '#6d7f5a', sw: 4, cy: '20%' })}
    <ellipse cx="50" cy="60" rx="37" ry="21" fill="#3f8f80"/>
    ${litEllipse(50, 61, 36, 20, '#97dccb', '#3f8578', { cy: '78%', r: '92%' })}
    ${gloss(28, 52, 22, 3.4, { rot: -5, peak: .36 })}
    ${[[34, 58, 11], [64, 66, 9], [52, 50, 8]].map(([x, y, r]) =>
      `<ellipse cx="${n2(x + 1)}" cy="${n2(y + 1.6)}" rx="${r}" ry="${n2(r * 0.62)}" fill="#1e4a44" opacity=".22"/>` +
      `<path d="M ${x} ${y} m ${-r} 0 a ${r} ${n2(r * 0.62)} 0 1 1 ${r * 2} 0 a ${r} ${n2(r * 0.62)} 0 1 1 ${-r * 2} 0 z"
             fill="#5aa05f" stroke="#3f7a46" stroke-width="2.4"/>` +
      `<path d="M ${n2(x - r * 0.7)} ${n2(y - r * 0.2)} a ${n2(r * 0.8)} ${n2(r * 0.4)} 0 0 1 ${n2(r * 0.9)} ${n2(-r * 0.22)}"
             fill="none" stroke="#fff" stroke-opacity=".3" stroke-width="2"/>`).join('')}
    ${litEllipse(64, 64, 4.6, 4.6, '#ffd3e2', '#e79ab8', { stroke: '#dd91ad', sw: 1.8 })}
    <circle cx="64" cy="64" r="1.8" fill="#fff3c9"/>`,

  pond_stars: () => `
    ${litEllipse(50, 62, 44, 26, '#78805f', '#545c44', { stroke: '#545c44', sw: 4, cy: '20%' })}
    <ellipse cx="50" cy="60" rx="37" ry="21" fill="#2b3566"/>
    ${litEllipse(50, 61, 36, 20, '#5d6ba8', '#28315e', { cy: '80%', r: '90%' })}
    ${[[34, 54, 3.4], [58, 52, 2.4], [46, 66, 2.8], [68, 64, 2.2], [26, 62, 2]].map(([x, y, r]) => {
      let d = '';
      for (let i = 0; i < 10; i++) {
        const a = (Math.PI / 5) * i - Math.PI / 2;
        const rr = i % 2 ? r * 0.42 : r;
        d += `${i ? 'L' : 'M'} ${n2(x + Math.cos(a) * rr)} ${n2(y + Math.sin(a) * rr * 0.72)} `;
      }
      return `<path d="${d}Z" fill="#fdf3cf"/>`;
    }).join('')}
    ${gloss(30, 67, 17, 3, { rot: -4, peak: .28 })}
    <path d="M 28 68 h 16" stroke="#aeb8e8" stroke-width="2.6" stroke-linecap="round" opacity=".7"/>`,

  /* ---- Fences. Edge to edge: the garden tiles four across the back. ---- */
  /* ---- Fences. Edge to edge: the garden tiles four across the back ----
     They stand in the sun, so each one drops a band of shadow onto the
     grass at its foot. The band runs the full width for the same reason
     the rails do: anything that stops short shows a seam at every join. */
  fence_picket: () => `
    <rect class="${SHADOW}" x="0" y="94" width="100" height="6" fill="#4a3a2c" opacity=".2"/>
    <path d="M 0 60 h 100 M 0 78 h 100" stroke="#d8cbb4" stroke-width="7" stroke-linecap="butt"/>
    ${[4, 28, 52, 76].map(x =>
      litPath(`M ${x} 96 V 48 l 10 -12 l 10 12 V 96 z`, '#fbf6ec', '#d9cbb2',
        { stroke: '#bfae92', sw: 4, join: 'round' })).join('')}
    <path d="M 0 61 h 100 M 0 79 h 100" stroke="#bfae92" stroke-width="2.5"/>
    <path d="M 0 57.5 h 100 M 0 75.5 h 100" stroke="#fff" stroke-opacity=".45" stroke-width="2"/>`,

  fence_hedge: () => `
    <rect class="${SHADOW}" x="0" y="94" width="100" height="6" fill="#2e4a28" opacity=".22"/>
    ${litRect(0, 52, 100, 44, 0, '#6aa85e', '#43753d', { stroke: '#43753d', sw: 4 })}
    ${[6, 24, 42, 60, 78, 96].map(x =>
      litEllipse(x, 52, 11, 11, '#7ebb6d', '#4b8244', { stroke: '#43753d', sw: 3.5 })).join('')}
    <path d="M 0 70 q 14 -6 26 0 t 26 0 t 26 0 t 26 0" fill="none" stroke="#8ac879" stroke-width="4" opacity=".6"/>
    <path d="M 0 84 q 14 -6 26 0 t 26 0 t 26 0 t 26 0" fill="none" stroke="#2e5a2a" stroke-width="4" opacity=".22"/>`,

  fence_stone: () => `
    <rect class="${SHADOW}" x="0" y="94" width="100" height="6" fill="#4a3a2c" opacity=".2"/>
    ${litRect(0, 54, 100, 42, 0, '#d4cdc0', '#9a9182', { stroke: '#9a9182', sw: 4 })}
    ${[[0, 58, 26], [26, 58, 24], [50, 58, 26], [76, 58, 24],
       [-8, 76, 26], [18, 76, 26], [44, 76, 24], [68, 76, 26], [94, 76, 20]].map(([x, y, w]) =>
      litRect(x, y, w, 18, 5, '#e2ddd2', '#b0a89a', { stroke: '#9a9182', sw: 3 })).join('')}
    ${[[12, 52], [58, 52], [86, 52]].map(([x, y]) =>
      litEllipse(x, y, 6, 6, '#93c47e', '#5f8a4f')).join('')}`,

  /* ---- Everything else in the garden ---- */
  mushrooms: () => `
    ${contact(48, 94, 30, 4.5, .24)}
    ${litRect(44, 66, 12, 28, 5, '#fdf5e8', '#d9c9ac', { stroke: '#c9b79c', sw: 3 })}
    ${litPath('M 22 68 a 28 22 0 0 1 56 0 z', '#ef7268', '#b8433a', { stroke: '#a83c33', sw: 4, join: 'round' })}
    <path d="M 26 66 a 26 20 0 0 1 18 -18" fill="none" stroke="#fff" stroke-opacity=".26" stroke-width="4"/>
    ${[[36, 58], [50, 52], [64, 59], [44, 64], [58, 65]].map(([x, y]) =>
      `<ellipse cx="${x}" cy="${y}" rx="5" ry="3.6" fill="#fff4ea"/>`).join('')}
    ${litRect(18, 80, 8, 16, 3.5, '#fdf5e8', '#d9c9ac', { stroke: '#c9b79c', sw: 2.6 })}
    ${litPath('M 6 82 a 16 12 0 0 1 32 0 z', '#f2867a', '#bd514a', { stroke: '#a83c33', sw: 3, join: 'round' })}
    <ellipse cx="16" cy="76" rx="3.4" ry="2.4" fill="#fff4ea"/><ellipse cx="28" cy="78" rx="3" ry="2.2" fill="#fff4ea"/>`,

  stepping_stones: () => `
    ${[[22, 82, 20, 9], [50, 70, 19, 8.6], [76, 58, 17, 8]].map(([x, y, rx, ry]) =>
      contact(x, n2(y + ry * 0.7), n2(rx * 1.1), n2(ry * 0.8), .24) +
      litEllipse(x, y, rx, ry, '#e2dbcd', '#aaa192', { stroke: '#9a9182', sw: 4 })).join('')}`,

  birdhouse: () => `
    ${contact(50, 95, 10, 3, .26)}
    ${litRect(46, 52, 9, 44, 3, '#b08557', '#7d5a3a', { stroke: '#7d5a3a', sw: 3 })}
    ${litRect(28, 24, 45, 34, 4, '#f6e8d2', '#cfae83', { stroke: '#b08f68', sw: 4 })}
    ${grain(30, 26, 41, 30, 3, 4, { color: '#b08f68', strength: .3, sw: 1.4 })}
    ${litPath('M 22 26 L 50 6 L 78 26 z', '#e2665c', '#a83c33', { stroke: '#a83c33', sw: 4, join: 'round' })}
    <path d="M 26 24 L 50 8" stroke="#fff" stroke-opacity=".3" stroke-width="3"/>
    <circle cx="50" cy="38" r="8" fill="#4a3628"/>
    <path d="M 44 34 a 8 8 0 0 1 12 -1" fill="none" stroke="#2a1c12" stroke-opacity=".5" stroke-width="3"/>
    <rect x="47" y="46" width="6" height="12" rx="3" fill="#a2764e"/>
    <circle cx="50" cy="38" r="8" fill="none" stroke="#b08f68" stroke-width="2.5"/>`,

  flower_bed: () => `
    ${contact(50, 94, 44, 5, .26)}
    ${litPath('M 8 92 q 42 -12 84 0 v 4 H 8 z', '#a2764e', '#6d4d31', { stroke: '#6d4d31', sw: 4, join: 'round' })}
    <path d="M 10 88 q 40 -10 80 0" fill="none" stroke="#c09667" stroke-width="4"/>
    ${[[20, 62, '#f2849f', '#cc5f7d'], [38, 52, '#ffd980', '#dfae42'], [56, 56, '#c9a3e0', '#a178c2'],
       [74, 64, '#f7a8c6', '#d37fa3'], [29, 72, '#fbe08a', '#dcb84e'], [65, 74, '#a8d6f0', '#7aadd0']]
      .map(([x, y, c, d]) =>
      `<path d="M ${x} 88 V ${y + 8}" stroke="#5f9e53" stroke-width="4" stroke-linecap="round"/>` +
      litEllipse(x, y, 8, 8, c, d, { stroke: 'rgba(120,80,100,.30)', sw: 2 }) +
      `<circle cx="${x}" cy="${y}" r="3" fill="#fff6e8"/>`).join('')}`,

  wheelbarrow: () => `
    ${contact(46, 94, 32, 5, .26)}
    ${litPath('M 16 46 h 62 l -10 30 H 30 z', '#6ba0c6', '#3f6b8c', { stroke: '#3f6b8c', sw: 4, join: 'round' })}
    <path d="M 18 52 h 58" stroke="#9cc4dd" stroke-width="4"/>
    ${[[30, 42, '#e08a3c', '#a85c1e'], [44, 38, '#e3ae4c', '#b07f24'], [58, 42, '#c96a2c', '#94481a'],
       [50, 46, '#e08a3c', '#a85c1e']].map(([x, y, c, d]) =>
      litPath(`M ${x} ${y} q 8 -7 14 0 q -8 8 -14 0 z`, c, d, { stroke: '#8a4a20', sw: 2 })).join('')}
    <path d="M 78 48 l 14 10 M 30 76 l -4 14" stroke="#7d5a3a" stroke-width="5" stroke-linecap="round"/>
    ${litEllipse(40, 84, 11, 11, '#6f5943', '#3f3226', { stroke: '#3f3226', sw: 4 })}
    <circle cx="40" cy="84" r="3.5" fill="#c9c2b4"/>`,

  garden_bench: () => `
    ${contact(50, 96, 38, 4, .26)}
    <path d="M 14 58 h 72 M 14 68 h 72" stroke="#c09667" stroke-width="9" stroke-linecap="round"/>
    <path d="M 14 55 h 72 M 14 65 h 72" stroke="#e0b98f" stroke-opacity=".7" stroke-width="2.6" stroke-linecap="round"/>
    ${litRect(10, 74, 80, 10, 4, '#d9ab7c', '#a87f55', { stroke: '#8a6340', sw: 3.5 })}
    <path d="M 18 84 v 12 M 82 84 v 12" stroke="#7d8a92" stroke-width="7" stroke-linecap="round"/>
    <path d="M 18 58 v 26 M 82 58 v 26" stroke="#7d8a92" stroke-width="6" stroke-linecap="round"/>
    <path d="M 16.6 58 v 26 M 80.6 58 v 26" stroke="#a8b4bc" stroke-opacity=".7" stroke-width="2" stroke-linecap="round"/>
    <path d="M 14 59 h 72 M 14 69 h 72" stroke="#8a6340" stroke-width="2.5"/>`,

  lamp_post: () => `
    ${contact(50, 94, 17, 4.5, .28)}
    ${litRect(45, 34, 10, 60, 4, '#5c6673', '#343b44', { stroke: '#343b44', sw: 3.5 })}
    <path d="M 36 34 h 28" stroke="#343b44" stroke-width="4" stroke-linecap="round"/>
    ${litPath('M 34 34 L 50 6 L 66 34 z', '#fff4cf', '#e8cf80', { stroke: '#343b44', sw: 4, join: 'round' })}
    <circle cx="50" cy="26" r="7" fill="#fff6d0"/>
    <path d="M 40 90 h 20" stroke="#343b44" stroke-width="5" stroke-linecap="round"/>`,
  /* A free-standing frame, not a rope over a branch. She can put this
     anywhere in the garden, and a swing hanging from thin air three feet
     from the nearest tree reads as a bug. */
  rope_swing: () => `
    ${contact(50, 95, 38, 4.5, .24)}
    <path d="M 14 96 L 30 30 M 86 96 L 70 30" stroke="#a2764e" stroke-width="7" stroke-linecap="round"/>
    <path d="M 16 96 L 31 32" stroke="#c49a6d" stroke-opacity=".5" stroke-width="2.5"/>
    <path d="M 22 28 h 56" stroke="#8a6340" stroke-width="8" stroke-linecap="round"/>
    <path d="M 22 26 h 56" stroke="#b08557" stroke-opacity=".6" stroke-width="2.5" stroke-linecap="round"/>
    <path d="M 34 32 V 70 M 66 32 V 70" stroke="#b89a6f" stroke-width="5" stroke-linecap="round"/>
    ${litRect(28, 68, 44, 10, 4, '#d9ab7c', '#a87f55', { stroke: '#8a6340', sw: 3.5 })}
    <path d="M 30 73 h 40" stroke="#8a6340" stroke-width="2" opacity=".5"/>
    <circle cx="34" cy="70" r="3.2" fill="#b08f68"/><circle cx="66" cy="70" r="3.2" fill="#b08f68"/>`,
};

/* ---------- What each window is a window ONTO ----------

   Indoors the weather falls outside, not around her bed, so the room hangs
   a piece of sky behind the glass. Each window needs two things for that:

     clip  the exact shape of the glass, so no sky leaks over the frame
     pane  the rectangle the glass fits inside — top, right, bottom, left —
           so the weather can be spread across the glass rather than across
           the drawing's square, most of which is frame, sill and fresh air

   Getting `pane` wrong is not a crash, it is a window where the snow all
   piles into one corner, which is how the first cut of this looked.

   Percentages in a clip-path resolve against the element's own box, and a
   piece's box is exactly the square its art is drawn in — so the numbers
   below ARE the viewBox coordinates used in the drawings above. Keep the
   two together: a window whose art moves and whose shape does not will
   leak, and it will leak quietly. */
export const WINDOW_GLASS = {
  /* <rect x=18 y=14 w=64 h=62> */
  window_plain: {
    clip: 'inset(14% 18% 24% 18% round 3%)',
    pane: [14, 18, 24, 18],
  },
  /* <circle cx=50 cy=48 r=34>. A circle()'s percentage radius resolves
     against the box's diagonal, which on a square box is its side. */
  window_round: {
    clip: 'circle(34% at 50% 48%)',
    pane: [14, 16, 18, 16],
  },
  /* <rect x=16 y=16 w=68 h=62> */
  window_cottage: {
    clip: 'inset(16% 16% 22% 16% round 4%)',
    pane: [16, 16, 22, 16],
  },
  /* x 18–82, a semicircular top centred at (50,48) r=32, sill at y=82 */
  window_arch: {
    clip: 'inset(16% 18% 18% 18% round 50% 50% 0 0)',
    pane: [16, 18, 18, 18],
  },
  /* <rect x=18 y=12 w=64 h=54>, with the flower box below it */
  window_flower: {
    clip: 'inset(12% 18% 34% 18% round 4%)',
    pane: [12, 18, 34, 18],
  },
  /* the ten points of the star, worked out the same way the art does.
     Its pane is the star's own extent (x 10.1–89.9, y 6–82), not the
     square around it: the corners of that square are outside the glass. */
  window_star: {
    clip: starClip(50, 48, 42, 18),
    pane: [6, 10.1, 18, 10.1],
  },
};

/** The star window's outline as a clip-path polygon. */
function starClip(cx, cy, outer, inner) {
  const pts = [];
  for (let i = 0; i < 10; i++) {
    const a = (Math.PI / 5) * i - Math.PI / 2;
    const r = i % 2 ? inner : outer;
    pts.push(`${n2(cx + Math.cos(a) * r)}% ${n2(cy + Math.sin(a) * r)}%`);
  }
  return `polygon(${pts.join(', ')})`;
}

/** A decoration on its own, for the shop, the book, or the scene. */
export function decorSVG(itemId, { size = 100 } = {}) {
  const fn = DECOR[itemId];
  if (!fn) return '';
  return `<svg viewBox="0 0 100 100" width="${size}" height="${size}"
               xmlns="http://www.w3.org/2000/svg" aria-hidden="true">${fn()}</svg>`;
}

/** A wearable shown on its own, for the shop and the book. */
export function wearableThumbSVG(itemId, { size = 100 } = {}) {
  const geom = { hx: 50, hy: 56, hrx: 30, hry: 24, bx: 50, by: 84, brx: 26, bry: 18 };
  const art = wearableSVG(itemId, geom);
  if (!art) return '';
  return `<svg viewBox="0 0 100 100" width="${size}" height="${size}"
               xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
    <ellipse cx="50" cy="60" rx="30" ry="24" fill="#f0e6da" opacity=".5"/>
    ${art}</svg>`;
}

/** A wallpaper or flooring shown as a swatch, for the shop and the book. */
export function surfaceSwatch(itemId, { size = 92 } = {}) {
  const style = Object.entries(surfaceStyle(itemId))
    .map(([k, v]) => `${k.replace(/[A-Z]/g, m => '-' + m.toLowerCase())}:${v}`)
    .join(';');
  return `<div class="surface-swatch" style="width:${size}px;height:${size}px;${style}"></div>`;
}

/**
 * Draw an item, whatever kind it is. Dispatching on which drawing exists
 * rather than on the category means moving an item between slots — a
 * lantern from the floor to the wall, say — never silently loses its art.
 */
export function itemSVG(item, opts) {
  if (!item) return '';
  if (SURFACES[item.id]) return surfaceSwatch(item.id, opts);
  return decorSVG(item.id, opts) || wearableThumbSVG(item.id, opts);
}
