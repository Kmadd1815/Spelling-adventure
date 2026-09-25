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
  bow: (g, c = {}) => {
    const main = c.main || '#ef6f8e', light = c.light || '#f78ba6', line = c.line || '#b34a66';
    const w = g.hrx * 0.30, y = g.hy - g.hry * 0.86;
    const loop = side => `<ellipse cx="${n(g.hx + side * w * 0.72)}" cy="${n(y)}"
        rx="${n(w * 0.62)}" ry="${n(w * 0.46)}" fill="${main}" stroke="${line}" stroke-width="2"
        transform="rotate(${side * 18} ${n(g.hx + side * w * 0.72)} ${n(y)})"/>`;
    return loop(-1) + loop(1) +
      `<circle cx="${n(g.hx)}" cy="${n(y)}" r="${n(w * 0.30)}" fill="${light}" stroke="${line}" stroke-width="2"/>`;
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

  headband: (g, c = {}) => {
    const main = c.main || '#6fb3d9', gem = c.light || '#f2849f', line = c.line || '#b3596e';
    const y = g.hy - g.hry * 0.60;
    return `<path d="M ${n(g.hx - g.hrx * 0.94)} ${n(y + g.hry * 0.22)}
                     Q ${n(g.hx)} ${n(y - g.hry * 0.34)} ${n(g.hx + g.hrx * 0.94)} ${n(y + g.hry * 0.22)}"
                  fill="none" stroke="${main}" stroke-width="${n(g.hry * 0.17)}" stroke-linecap="round"/>
            <circle cx="${n(g.hx + g.hrx * 0.36)}" cy="${n(y - g.hry * 0.14)}" r="${n(g.hrx * 0.10)}"
                    fill="${gem}" stroke="${line}" stroke-width="1.8"/>`;
  },

  sun_hat: (g, c = {}) => {
    const main = c.main || '#f0d79a', light = c.light || '#f7e2b0',
          line = c.line || '#c9a462', band = c.band || '#e2566f';
    const y = g.hy - g.hry * 0.56;
    return `<ellipse cx="${n(g.hx)}" cy="${n(y)}" rx="${n(g.hrx * 1.12)}" ry="${n(g.hry * 0.30)}"
                     fill="${main}" stroke="${line}" stroke-width="2.4"/>
            <path d="M ${n(g.hx - g.hrx * 0.52)} ${n(y)} a ${n(g.hrx * 0.52)} ${n(g.hry * 0.52)} 0 0 1 ${n(g.hrx * 1.04)} 0 z"
                  fill="${light}" stroke="${line}" stroke-width="2.4" stroke-linejoin="round"/>
            <path d="M ${n(g.hx - g.hrx * 0.50)} ${n(y - g.hry * 0.04)} q ${n(g.hrx * 0.50)} ${n(g.hry * 0.18)} ${n(g.hrx * 1.0)} 0"
                  fill="none" stroke="${band}" stroke-width="${n(g.hry * 0.12)}"/>`;
  },

  beanie: (g, c = {}) => {
    const main = c.main || '#8a7fc4', light = c.light || '#a79ade', line = c.line || '#5f568f';
    const y = g.hy - g.hry * 0.32;
    return `<path d="M ${n(g.hx - g.hrx * 0.82)} ${n(y)} a ${n(g.hrx * 0.82)} ${n(g.hry * 0.72)} 0 0 1 ${n(g.hrx * 1.64)} 0 z"
                  fill="${main}" stroke="${line}" stroke-width="2.4" stroke-linejoin="round"/>
            <rect x="${n(g.hx - g.hrx * 0.88)}" y="${n(y - g.hry * 0.10)}"
                  width="${n(g.hrx * 1.76)}" height="${n(g.hry * 0.26)}" rx="${n(g.hry * 0.13)}"
                  fill="${light}" stroke="${line}" stroke-width="2.4"/>
            <circle cx="${n(g.hx)}" cy="${n(y - g.hry * 0.76)}" r="${n(g.hrx * 0.14)}"
                    fill="${c.bobble || '#fff6e8'}" stroke="#c9b8a4" stroke-width="2"/>`;
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
  bowtie: (g, c = {}) => {
    const main = c.main || '#e2566f', light = c.light || '#f0778c', line = c.line || '#a23b50';
    const y = g.hy + g.hry * 1.02, w = g.hrx * 0.26;
    return `
      <path d="M ${n(g.hx - w)} ${n(y - w * 0.62)} L ${n(g.hx - w * 0.16)} ${n(y)}
               L ${n(g.hx - w)} ${n(y + w * 0.62)} Z"
            fill="${main}" stroke="${line}" stroke-width="2" stroke-linejoin="round"/>
      <path d="M ${n(g.hx + w)} ${n(y - w * 0.62)} L ${n(g.hx + w * 0.16)} ${n(y)}
               L ${n(g.hx + w)} ${n(y + w * 0.62)} Z"
            fill="${main}" stroke="${line}" stroke-width="2" stroke-linejoin="round"/>
      <circle cx="${n(g.hx)}" cy="${n(y)}" r="${n(w * 0.24)}" fill="${light}" stroke="${line}" stroke-width="1.8"/>`;
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

  scarf: (g, c = {}) => {
    const main = c.main || '#e2566f', stripe = c.light || '#f7b955', line = c.line || '#a23b50';
    const y = g.hy + g.hry * 0.98, w = g.brx * 0.52, h = g.bry * 0.20;
    return `
      <rect x="${n(g.hx - w)}" y="${n(y - h / 2)}" width="${n(w * 2)}" height="${n(h)}"
            rx="${n(h * 0.45)}" fill="${main}" stroke="${line}" stroke-width="2"/>
      <rect x="${n(g.hx - w * 0.62)}" y="${n(y - h / 2)}" width="${n(w * 0.34)}" height="${n(h)}" fill="${stripe}"/>
      <rect x="${n(g.hx + w * 0.26)}" y="${n(y - h / 2)}" width="${n(w * 0.34)}" height="${n(h)}" fill="${stripe}"/>
      <rect x="${n(g.hx + w * 0.30)}" y="${n(y)}" width="${n(h * 0.9)}" height="${n(h * 2.1)}"
            rx="${n(h * 0.35)}" fill="${main}" stroke="${line}" stroke-width="2"/>`;
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

  cape: (g, c = {}) => {
    const main = c.main || '#c0405e', light = c.light || '#d9647e', line = c.line || '#8a2b42';
    /* A cape is worn BEHIND the animal, so the only parts of it anyone
       ever sees are the collar either side of the neck and the cloth that
       sweeps out past the body. The first draft was one smooth arc that
       bulged below the body and read, on every screen, as a cushion the
       axolotl was sitting on. What fixes it is shape, not size: cloth that
       leaves the shoulders narrow, flares outward, and stops ABOVE the
       feet with a hem that has corners in it. */
    const shoulderY = g.by - g.bry * 0.86;   // where it leaves the shoulders
    const hemY      = g.by + g.bry * 0.56;   // well clear of the feet
    const top = g.brx * 0.74;                // shoulder width
    const w   = g.brx * 1.34;                // the flare
    /* A hem of three shallow scallops, so the bottom edge reads as cloth
       hanging in folds rather than as the rim of a cushion. */
    const hem = (from, to) => {
      const span = to - from, dip = g.bry * 0.13;
      let d = '';
      for (let i = 0; i < 3; i++) {
        const a = from + (span * i) / 3, b = from + (span * (i + 1)) / 3;
        d += `Q ${n((a + b) / 2)} ${n(hemY + dip)} ${n(b)} ${n(hemY - dip * 0.35)} `;
      }
      return d;
    };
    const fold = side => `
      <path d="M ${n(g.bx + side * top * 0.82)} ${n(shoulderY + g.bry * 0.18)}
               Q ${n(g.bx + side * w * 0.62)} ${n(g.by)}
                 ${n(g.bx + side * w * 0.80)} ${n(hemY - g.bry * 0.16)}"
            fill="none" stroke="${light}" stroke-width="2.6" stroke-linecap="round" opacity=".7"/>`;
    /* The collar, peeking out either side of the neck — the one piece of a
       cape that says "cape" rather than "cloth". */
    const collar = side => `
      <path d="M ${n(g.bx + side * top * 0.30)} ${n(shoulderY - g.bry * 0.10)}
               L ${n(g.bx + side * top * 1.12)} ${n(shoulderY - g.bry * 0.26)}
               Q ${n(g.bx + side * top * 1.22)} ${n(shoulderY + g.bry * 0.16)}
                 ${n(g.bx + side * top * 0.84)} ${n(shoulderY + g.bry * 0.30)} Z"
            fill="${light}" stroke="${line}" stroke-width="2.2" stroke-linejoin="round"/>`;
    return `
      <path d="M ${n(g.bx - top)} ${n(shoulderY)}
               Q ${n(g.bx - w * 0.92)} ${n(g.by - g.bry * 0.10)}
                 ${n(g.bx - w)} ${n(hemY - g.bry * 0.22)}
               ${hem(g.bx - w, g.bx + w)}
               Q ${n(g.bx + w * 0.92)} ${n(g.by - g.bry * 0.10)}
                 ${n(g.bx + top)} ${n(shoulderY)}
               Q ${n(g.bx)} ${n(shoulderY + g.bry * 0.22)} ${n(g.bx - top)} ${n(shoulderY)} Z"
            fill="${main}" stroke="${line}" stroke-width="2.6" stroke-linejoin="round"/>
      ${fold(-1)}${fold(1)}
      ${collar(-1)}${collar(1)}`;
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

  sweater: (g, c = {}) => {
    const main = c.main || '#e2566f', line = c.line || '#a23b50', knit = c.light || '#fff6e8';
    const top = g.hy + g.hry * 0.96;
    return `<path d="M ${n(g.bx - g.brx * 0.82)} ${n(top + g.bry * 0.20)}
                     Q ${n(g.bx)} ${n(top - g.bry * 0.16)} ${n(g.bx + g.brx * 0.82)} ${n(top + g.bry * 0.20)}
                     L ${n(g.bx + g.brx * 0.90)} ${n(g.by + g.bry * 0.70)}
                     Q ${n(g.bx)} ${n(g.by + g.bry * 1.00)} ${n(g.bx - g.brx * 0.90)} ${n(g.by + g.bry * 0.70)} Z"
                  fill="${main}" stroke="${line}" stroke-width="2.6" stroke-linejoin="round"/>
            <path d="M ${n(g.bx - g.brx * 0.86)} ${n(g.by + g.bry * 0.10)} Q ${n(g.bx)} ${n(g.by + g.bry * 0.34)} ${n(g.bx + g.brx * 0.86)} ${n(g.by + g.bry * 0.10)}"
                  fill="none" stroke="${knit}" stroke-width="${n(g.bry * 0.13)}"/>
            <path d="M ${n(g.bx - g.brx * 0.88)} ${n(g.by + g.bry * 0.42)} Q ${n(g.bx)} ${n(g.by + g.bry * 0.66)} ${n(g.bx + g.brx * 0.88)} ${n(g.by + g.bry * 0.42)}"
                  fill="none" stroke="${knit}" stroke-width="${n(g.bry * 0.13)}"/>`;
  },

  fairy_wings: g => {
    /* Drawn behind the body, so anything that does not rise above the
       shoulders is simply never seen. These stand well clear of the
       silhouette: a tall upper wing and a smaller lower one. */
    const wing = side => {
      const ux = g.bx + side * g.brx * 1.00, uy = g.by - g.bry * 0.66;
      const lx = g.bx + side * g.brx * 0.92, ly = g.by + g.bry * 0.34;
      return `
      <ellipse cx="${n(ux)}" cy="${n(uy)}" rx="${n(g.brx * 0.54)}" ry="${n(g.bry * 0.86)}"
               transform="rotate(${side * 24} ${n(ux)} ${n(uy)})"
               fill="#dcefff" stroke="#a8c8f0" stroke-width="2.4" opacity=".94"/>
      <ellipse cx="${n(ux)}" cy="${n(uy)}" rx="${n(g.brx * 0.28)}" ry="${n(g.bry * 0.46)}"
               transform="rotate(${side * 24} ${n(ux)} ${n(uy)})"
               fill="#ffffff" opacity=".55"/>
      <ellipse cx="${n(lx)}" cy="${n(ly)}" rx="${n(g.brx * 0.38)}" ry="${n(g.bry * 0.56)}"
               transform="rotate(${side * 14} ${n(lx)} ${n(ly)})"
               fill="#f2e2ff" stroke="#c9a3e0" stroke-width="2.4" opacity=".94"/>`;
    };
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

/**
 * SVG for whatever the pet is wearing, given its live geometry.
 *
 * Everything worn is shaded on the way out rather than in its own drawing.
 * A hat is a dozen small pieces and it sits on an animal that is now
 * properly round, so a flat one reads as a sticker pressed onto her head —
 * but none of them has a big enough mass to be worth hand-lighting, and
 * doing it here means a new hat arrives already lit.
 */
/* ---------- Colourways ----------

   The same drawing in another colour, registered as its own item.

   This is here because of something she said about the shop: she will not
   love every single thing in it, and she is not going to spend stars she
   worked for on something she only quite likes. The fix is more to choose
   between — and a child who wants the bow but not in pink is not asking for
   a new drawing, she is asking for the bow in blue.

   Done by handing the drawing a palette, NOT by find-and-replacing hex
   codes in a finished drawing. That shortcut is how this project once ended
   up with a red lamp wearing a pink outline: the codes it replaced turned
   out to belong to something else as well. A drawing that takes its colours
   as an argument cannot be wrong about which ones are its own. */
export const COLOURWAYS = {
  /* Bows */
  bow_blue:    { of: 'bow',      c: { main: '#6fb3d9', light: '#8ac6e6', line: '#3f7ba0' } },
  bow_mint:    { of: 'bow',      c: { main: '#7fcfc6', light: '#9fdfd6', line: '#44928a' } },
  bow_gold:    { of: 'bow',      c: { main: '#f6c453', light: '#ffd980', line: '#c49331' } },
  bow_violet:  { of: 'bow',      c: { main: '#a78bc9', light: '#c0a8dd', line: '#7a5fa0' } },

  /* Headbands */
  headband_pink:  { of: 'headband', c: { main: '#f2849f', light: '#fff0a8', line: '#c98d34' } },
  headband_mint:  { of: 'headband', c: { main: '#7fcfc6', light: '#f7b955', line: '#c98d34' } },
  headband_berry: { of: 'headband', c: { main: '#b1648a', light: '#ffe2ef', line: '#8a4a68' } },

  /* Beanies */
  beanie_red:   { of: 'beanie', c: { main: '#e2566f', light: '#f0778c', line: '#a23b50' } },
  beanie_moss:  { of: 'beanie', c: { main: '#6fae5f', light: '#8cc87a', line: '#4c7d41' } },
  beanie_night: { of: 'beanie', c: { main: '#4a5680', light: '#6a77a3', line: '#333c5c',
                                     bobble: '#ffe9a8' } },

  /* Sun hats */
  sun_hat_pink: { of: 'sun_hat', c: { main: '#f4c9d6', light: '#fde3ea',
                                      line: '#c98fa4', band: '#7fcfc6' } },
  sun_hat_sky:  { of: 'sun_hat', c: { main: '#bcd9ea', light: '#dcecf6',
                                      line: '#7fa6bd', band: '#f7b955' } },

  /* Bow ties */
  bowtie_navy: { of: 'bowtie', c: { main: '#42537d', light: '#5f74a3', line: '#2b3859' } },
  bowtie_mint: { of: 'bowtie', c: { main: '#5fb5ac', light: '#7fcfc6', line: '#3d8a82' } },
  bowtie_plum: { of: 'bowtie', c: { main: '#9a6aa8', light: '#b98bc6', line: '#6f4a7c' } },

  /* Scarves */
  scarf_forest: { of: 'scarf', c: { main: '#4c7d41', light: '#f0d79a', line: '#36592e' } },
  scarf_ocean:  { of: 'scarf', c: { main: '#3f7ba0', light: '#c8e8f4', line: '#2b5772' } },
  scarf_candy:  { of: 'scarf', c: { main: '#f2849f', light: '#fff6e8', line: '#b3596e' } },

  /* Capes */
  cape_sea:     { of: 'cape', c: { main: '#2f6f8c', light: '#5e9cb8', line: '#1f4c60' } },
  cape_forest:  { of: 'cape', c: { main: '#3f7a46', light: '#63a56b', line: '#2a5530' } },
  cape_midnight:{ of: 'cape', c: { main: '#37406b', light: '#5b6596', line: '#242b4c' } },

  /* Jumpers */
  sweater_sky:    { of: 'sweater', c: { main: '#6fb3d9', line: '#3f7ba0', light: '#fff6e8' } },
  sweater_moss:   { of: 'sweater', c: { main: '#7fb96c', line: '#4c7d41', light: '#fff6e8' } },
  sweater_butter: { of: 'sweater', c: { main: '#f6c453', line: '#c49331', light: '#7a5a14' } },
};

export function wearableSVG(itemId, geom) {
  const way = COLOURWAYS[itemId];
  const fn = HATS[way?.of || itemId] || ACCESSORIES[way?.of || itemId];
  return fn ? shadeFills(fn(geom, way?.c)) : '';
}

/** Accessories that sit behind the body (a cape) rather than in front. */
/* Worn things that belong behind the body rather than in front of it. */
const BEHIND_BASE = ['cape', 'fairy_wings'];
export const BEHIND_BODY = new Set([
  ...BEHIND_BASE,
  /* Every colourway of something that hangs behind hangs behind too. */
  ...Object.entries(COLOURWAYS).filter(([, w]) => BEHIND_BASE.includes(w.of)).map(([id]) => id),
]);

/* ============================ SURFACES ============================
   Wallpaper and flooring are CSS backgrounds, not drawings: they must fill
   a wall or a floor at any size, and a repeating gradient does that
   perfectly at no cost. */

/* ---------- The motifs ----------

   Each of these is one tile of a repeating pattern, drawn rather than
   assembled out of gradient stops. The difference is what a motif can BE: a
   circle made of a radial-gradient is always a circle, but a flower can
   have petals and a centre, a book can have a spine, a stone can have a
   joint round it and a lit top edge.

   They are lit from the upper left like everything else, and they are small
   — a tile is a few hundred bytes — so a wall is still one line of CSS with
   nothing to fetch.
*/

/* A dot with a belly and a catchlight, rather than a flat disc. */
const dotTile = (size, r, light, dark) => tile(size, size,
  `<defs>${tileGrad('d', light, dark, true)}</defs>
   <circle cx='${size / 2}' cy='${size / 2}' r='${r}' fill='url(#d)'/>
   <circle cx='${n(size / 2 - r * 0.3)}' cy='${n(size / 2 - r * 0.34)}' r='${n(r * 0.26)}'
           fill='#ffffff' opacity='0.5'/>`);

/* Five petals round a shaded centre. */
const flowerTile = (size, r, petal, petalDark, heart) => {
  let p = '';
  for (let i = 0; i < 5; i++) {
    const a = (i / 5) * Math.PI * 2 - Math.PI / 2;
    p += `<ellipse cx='${n(size / 2 + Math.cos(a) * r * 0.62)}' cy='${n(size / 2 + Math.sin(a) * r * 0.62)}'
            rx='${n(r * 0.52)}' ry='${n(r * 0.40)}' fill='url(#f)'
            transform='rotate(${n(a * 57.3 + 90)} ${n(size / 2 + Math.cos(a) * r * 0.62)} ${n(size / 2 + Math.sin(a) * r * 0.62)})'/>`;
  }
  return tile(size, size,
    `<defs>${tileGrad('f', petal, petalDark, true)}${tileGrad('h', '#fff6e8', heart, true)}</defs>
     ${p}<circle cx='${size / 2}' cy='${size / 2}' r='${n(r * 0.34)}' fill='url(#h)'/>`);
};

/* Several flowers in one tile, at irregular places.
   One flower per tile is a lattice: the eye finds the grid in about a
   second and the meadow stops being a meadow. Eight of them scattered
   through a big tile still repeats — everything tiled does — but there is
   no row to follow. */
const flowersTile = (w, h, spots) => {
  const heads = spots.map(([x, y, r, petal, petalDark, heart], i) => {
    let p = '';
    for (let k = 0; k < 5; k++) {
      const a = (k / 5) * Math.PI * 2 - Math.PI / 2 + i;
      const cx = x + Math.cos(a) * r * 0.62, cy = y + Math.sin(a) * r * 0.62;
      p += `<ellipse cx='${n(cx)}' cy='${n(cy)}' rx='${n(r * 0.52)}' ry='${n(r * 0.40)}'
              fill='url(#p${i})' transform='rotate(${n(a * 57.3 + 90)} ${n(cx)} ${n(cy)})'/>`;
    }
    return p + `<circle cx='${x}' cy='${y}' r='${n(r * 0.34)}' fill='url(#h${i})'/>`;
  }).join('');
  const defs = spots.map(([, , , petal, petalDark, heart], i) =>
    tileGrad(`p${i}`, petal, petalDark, true) + tileGrad(`h${i}`, '#fff6e8', heart, true)).join('');
  return tile(w, h, `<defs>${defs}</defs>${heads}`);
};

/* A five-pointed star sitting in its own glow. */
const starTile = (size, r, light, dark, glow) => {
  let d = '';
  for (let i = 0; i < 10; i++) {
    const a = (Math.PI / 5) * i - Math.PI / 2;
    const rr = i % 2 ? r * 0.42 : r;
    d += `${i ? 'L' : 'M'} ${n(size / 2 + Math.cos(a) * rr)} ${n(size / 2 + Math.sin(a) * rr)} `;
  }
  return tile(size, size,
    `<defs>${tileGrad('s', light, dark, true)}
       <radialGradient id='g'><stop offset='0%' stop-color='${glow}' stop-opacity='0.55'/>
         <stop offset='100%' stop-color='${glow}' stop-opacity='0'/></radialGradient></defs>
     <circle cx='${size / 2}' cy='${size / 2}' r='${n(r * 1.7)}' fill='url(#g)'/>
     <path d='${d}Z' fill='url(#s)'/>`);
};

/* A stripe with a lit edge and a shaded one, so the wall has a weave. */
const stripeTile = (w, light, mid, dark) => tile(w, 8,
  `<rect width='${w}' height='8' fill='${mid}'/>
   <rect x='0' width='${n(w / 2)}' height='8' fill='${light}'/>
   <rect x='0' width='1.4' height='8' fill='#ffffff' opacity='0.4'/>
   <rect x='${n(w / 2 - 1.4)}' width='1.4' height='8' fill='${dark}' opacity='0.5'/>`);

/* A soft cloud: lit along the top, shaded underneath. */
const cloudTile = (w, h, light, dark) => tile(w, h,
  `<defs><linearGradient id='c' x1='0%' y1='0%' x2='0%' y2='100%'>
     <stop offset='0%' stop-color='${light}'/><stop offset='100%' stop-color='${dark}'/></linearGradient></defs>
   <g fill='url(#c)'>
     <ellipse cx='${n(w * 0.30)}' cy='${n(h * 0.62)}' rx='${n(w * 0.20)}' ry='${n(h * 0.17)}'/>
     <ellipse cx='${n(w * 0.46)}' cy='${n(h * 0.52)}' rx='${n(w * 0.17)}' ry='${n(h * 0.22)}'/>
     <ellipse cx='${n(w * 0.62)}' cy='${n(h * 0.62)}' rx='${n(w * 0.18)}' ry='${n(h * 0.16)}'/>
     <rect x='${n(w * 0.18)}' y='${n(h * 0.62)}' width='${n(w * 0.54)}' height='${n(h * 0.16)}' rx='${n(h * 0.08)}'/>
   </g>
   <ellipse cx='${n(w * 0.44)}' cy='${n(h * 0.40)}' rx='${n(w * 0.10)}' ry='${n(h * 0.07)}'
            fill='#ffffff' opacity='0.55'/>`);

/* A shelf of books: spines of different heights, and the shadow the shelf
   above throws across the tops of them. */
const bookTile = (() => {
  const spines = [[0, 11, 48, '#d4594f'], [11, 9, 42, '#4f7fa8'], [20, 11, 50, '#d8a648'],
                  [31, 8, 40, '#5f8f66'], [39, 11, 46, '#9a6bb0'], [50, 6, 36, '#c9704f']];
  let out = `<rect width='56' height='62' fill='#c9a87c'/>`;
  for (const [x, w, h, c] of spines) {
    out += `<rect x='${x}' y='${62 - 8 - h}' width='${w}' height='${h}' fill='${c}'/>` +
           `<rect x='${x}' y='${62 - 8 - h}' width='${n(w * 0.3)}' height='${h}' fill='#ffffff' opacity='0.22'/>` +
           `<rect x='${n(x + w * 0.76)}' y='${62 - 8 - h}' width='${n(w * 0.24)}' height='${h}' fill='#000000' opacity='0.18'/>` +
           `<rect x='${x}' y='${62 - 8 - h}' width='${w}' height='3' fill='#000000' opacity='0.22'/>`;
  }
  out += `<rect y='54' width='56' height='8' fill='#8a6340'/>` +
         `<rect y='54' width='56' height='2' fill='#ffffff' opacity='0.22'/>` +
         `<rect y='0' width='56' height='5' fill='#000000' opacity='0.22'/>`;
  return tile(56, 62, out);
})();

/* Water: a scalloped wave with a bright crest. */
const waveTile = (w, h, crest) => tile(w, h,
  `<path d='M 0 ${n(h * 0.55)} q ${n(w * 0.25)} ${n(-h * 0.3)} ${n(w * 0.5)} 0
            q ${n(w * 0.25)} ${n(h * 0.3)} ${n(w * 0.5)} 0'
         fill='none' stroke='${crest}' stroke-opacity='0.45' stroke-width='2.4'/>
   <path d='M 0 ${n(h * 0.5)} q ${n(w * 0.25)} ${n(-h * 0.3)} ${n(w * 0.5)} 0
            q ${n(w * 0.25)} ${n(h * 0.3)} ${n(w * 0.5)} 0'
         fill='none' stroke='#ffffff' stroke-opacity='0.5' stroke-width='1.6'/>`);

/* A flagstone with a joint round it and light on its top edge. */
const stoneTile = (w, h, light, dark, joint) => tile(w, h,
  `<defs>${tileGrad('s', light, dark)}</defs>
   <rect width='${w}' height='${h}' fill='${joint}'/>
   <rect x='1.5' y='1.5' width='${n(w / 2 - 3)}' height='${n(h - 3)}' rx='3' fill='url(#s)'/>
   <rect x='${n(w / 2 + 1.5)}' y='1.5' width='${n(w / 2 - 3)}' height='${n(h - 3)}' rx='3' fill='url(#s)'/>
   <rect x='1.5' y='1.5' width='${n(w / 2 - 3)}' height='2' rx='1' fill='#ffffff' opacity='0.35'/>
   <rect x='${n(w / 2 + 1.5)}' y='1.5' width='${n(w / 2 - 3)}' height='2' rx='1' fill='#ffffff' opacity='0.35'/>`);

/* Blades of grass, tapering to a point and leaning the same way. */
const bladeTile = (w, h, dark, light) => {
  let out = '';
  for (let i = 0; i < 7; i++) {
    const x = (i + 0.5) * (w / 7), len = h * (0.42 + (i % 3) * 0.16);
    out += `<path d='M ${n(x)} ${h} q ${n(w * 0.05)} ${n(-len * 0.6)} ${n(w * 0.11)} ${n(-len)}'
              fill='none' stroke='${i % 2 ? light : dark}' stroke-opacity='0.38'
              stroke-width='${n(1.4 + (i % 2) * 0.5)}' stroke-linecap='round'/>`;
  }
  return tile(w, h, out);
};

/* Marble: a vein that branches, not a ruled line. */
const veinTile = (w, h, colour) => tile(w, h,
  `<g fill='none' stroke='${colour}' stroke-linecap='round'>
     <path d='M ${n(-w * 0.1)} ${n(h * 0.78)} q ${n(w * 0.3)} ${n(-h * 0.34)} ${n(w * 0.56)} ${n(-h * 0.5)}
              t ${n(w * 0.54)} ${n(-h * 0.3)}' stroke-opacity='0.30' stroke-width='2'/>
     <path d='M ${n(w * 0.22)} ${n(h * 0.62)} q ${n(w * 0.12)} ${n(h * 0.16)} ${n(w * 0.3)} ${n(h * 0.2)}'
           stroke-opacity='0.18' stroke-width='1.3'/>
     <path d='M ${n(w * 0.58)} ${n(h * 0.3)} q ${n(w * 0.1)} ${n(-h * 0.16)} ${n(w * 0.24)} ${n(-h * 0.18)}'
           stroke-opacity='0.16' stroke-width='1.1'/>
   </g>`);

/* Sand: a ripple with a lit crest and a shaded trough. */
/* ---------- Under the water ----------

   Water is not a colour, it is a colour with things happening in it. Three
   of them, and leaving any out gives a flat blue rectangle:

     caustics  the wobbling net of light the surface throws on everything
               below it, brightest near the top
     motes     specks drifting in the beam, which is what tells the eye the
               water has depth rather than being a pane of glass
     shafts    broad beams coming down from the surface at a slight angle

   All three are faint on purpose. The axolotl swims through this, and a
   busy background behind a pink animal is a busy background.
*/
const causticTile = (w, h, light, o = 0.2) => tile(w, h,
  `<path d='M 0 ${n(h * 0.28)} q ${n(w * 0.13)} ${n(-h * 0.16)} ${n(w * 0.26)} 0
            q ${n(w * 0.11)} ${n(h * 0.14)} ${n(w * 0.24)} ${n(-h * 0.04)}
            q ${n(w * 0.14)} ${n(-h * 0.18)} ${n(w * 0.3)} ${n(h * 0.03)}
            q ${n(w * 0.1)} ${n(h * 0.12)} ${n(w * 0.2)} ${n(-h * 0.02)}'
         fill='none' stroke='${light}' stroke-opacity='${o}' stroke-width='2.2'
         stroke-linecap='round'/>
   <path d='M ${n(-w * 0.1)} ${n(h * 0.66)} q ${n(w * 0.18)} ${n(h * 0.15)} ${n(w * 0.34)} ${n(-h * 0.03)}
            q ${n(w * 0.12)} ${n(-h * 0.14)} ${n(w * 0.28)} ${n(h * 0.05)}
            q ${n(w * 0.16)} ${n(h * 0.16)} ${n(w * 0.34)} ${n(-h * 0.04)}'
         fill='none' stroke='${light}' stroke-opacity='${n(o * 0.62)}' stroke-width='1.6'
         stroke-linecap='round'/>`);

const moteTile = (size, light) => tile(size, size,
  `<circle cx='${n(size * 0.18)}' cy='${n(size * 0.26)}' r='1.5' fill='${light}' opacity='0.5'/>
   <circle cx='${n(size * 0.68)}' cy='${n(size * 0.12)}' r='1.1' fill='${light}' opacity='0.4'/>
   <circle cx='${n(size * 0.82)}' cy='${n(size * 0.62)}' r='1.7' fill='${light}' opacity='0.42'/>
   <circle cx='${n(size * 0.36)}' cy='${n(size * 0.78)}' r='1.2' fill='${light}' opacity='0.36'/>`);

/* Rounded stones packed together, each lit from the upper left like
   everything else. Two rows offset by half a stone, so the bed does not
   read as a grid. */
const pebbleTile = (w, h, light, mid, dark) => {
  let out = '';
  const put = (cx, cy, rx, ry) =>
    `<ellipse cx='${n(cx)}' cy='${n(cy)}' rx='${n(rx)}' ry='${n(ry)}' fill='url(#s)'
              stroke='${dark}' stroke-opacity='0.16' stroke-width='0.8'/>
     <ellipse cx='${n(cx - rx * 0.28)}' cy='${n(cy - ry * 0.32)}' rx='${n(rx * 0.38)}'
              ry='${n(ry * 0.32)}' fill='#ffffff' opacity='0.12'/>`;
  /* Sizes vary per stone, or the bed reads as a printed grid rather than
     as stones somebody tipped in. */
  const vary = [1, 0.82, 1.14, 0.9, 1.08, 0.86];
  for (let i = 0; i < 3; i++)
    out += put((i + 0.5) * (w / 3), h * (0.28 + (i % 2) * 0.06),
               w * 0.19 * vary[i], h * 0.17 * vary[i]);
  for (let i = 0; i < 3; i++)
    out += put(i * (w / 3), h * (0.72 + (i % 2) * 0.05),
               w * 0.21 * vary[i + 3], h * 0.18 * vary[i + 3]);
  return tile(w, h, `<defs>${tileGrad('s', light, mid, true)}</defs>${out}`);
};

const rippleTile = (w, h, dark) => tile(w, h,
  `<path d='M 0 ${n(h * 0.62)} q ${n(w * 0.25)} ${n(-h * 0.28)} ${n(w * 0.5)} 0
            q ${n(w * 0.25)} ${n(h * 0.28)} ${n(w * 0.5)} 0'
         fill='none' stroke='${dark}' stroke-opacity='0.34' stroke-width='2.6'/>
   <path d='M 0 ${n(h * 0.54)} q ${n(w * 0.25)} ${n(-h * 0.28)} ${n(w * 0.5)} 0
            q ${n(w * 0.25)} ${n(h * 0.28)} ${n(w * 0.5)} 0'
         fill='none' stroke='#ffffff' stroke-opacity='0.38' stroke-width='1.8'/>
   <circle cx='${n(w * 0.2)}' cy='${n(h * 0.24)}' r='0.9' fill='${dark}' opacity='0.3'/>
   <circle cx='${n(w * 0.72)}' cy='${n(h * 0.82)}' r='0.8' fill='${dark}' opacity='0.26'/>`);

/* A clump of moss, rounded and lit. */
const clumpTile = (w, h, light, dark) => tile(w, h,
  `<defs>${tileGrad('m', light, dark, true)}</defs>
   <ellipse cx='${n(w * 0.32)}' cy='${n(h * 0.36)}' rx='${n(w * 0.24)}' ry='${n(h * 0.20)}' fill='url(#m)'/>
   <ellipse cx='${n(w * 0.74)}' cy='${n(h * 0.68)}' rx='${n(w * 0.20)}' ry='${n(h * 0.17)}' fill='url(#m)'/>
   <ellipse cx='${n(w * 0.16)}' cy='${n(h * 0.82)}' rx='${n(w * 0.14)}' ry='${n(h * 0.12)}' fill='url(#m)'/>`);

/* A fallen petal, shaded, with the crease down its middle. */
const petalTile = (w, h, light, dark, edge) => tile(w, h,
  `<defs>${tileGrad('p', light, dark, true)}</defs>
   <g fill='url(#p)' stroke='${edge}' stroke-opacity='0.35' stroke-width='0.8'>
     <ellipse cx='${n(w * 0.3)}' cy='${n(h * 0.34)}' rx='${n(w * 0.22)}' ry='${n(h * 0.13)}'
              transform='rotate(-18 ${n(w * 0.3)} ${n(h * 0.34)})'/>
     <ellipse cx='${n(w * 0.72)}' cy='${n(h * 0.7)}' rx='${n(w * 0.19)}' ry='${n(h * 0.12)}'
              transform='rotate(24 ${n(w * 0.72)} ${n(h * 0.7)})'/>
   </g>`);

/* Linen: the faintest weave, so a plain wall is not a flat colour. */
const linenTile = tile(6, 6,
  `<rect width='6' height='6' fill='none'/>
   <rect y='0' width='6' height='1' fill='#8a6340' opacity='0.05'/>
   <rect x='0' width='1' height='6' fill='#ffffff' opacity='0.16'/>`);

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
    backgroundImage: `${WALL_DEPTH}, ${linenTile}, linear-gradient(180deg, #fdf3e4, #f3e2ca)`,
  },
  wall_stripes: {
    backgroundColor: '#d3ebdd',
    backgroundImage: `${WALL_DEPTH}, ${stripeTile(32, '#e6f4ec', '#d3ebdd', '#a9ccba')}`,
  },
  wall_dots: {
    backgroundColor: '#fbe4ec',
    backgroundImage: `${WALL_DEPTH}, ${dotTile(28, 6, '#f8c6d8', '#ea92b0')}, ${dotTile(28, 3, '#f8c6d8', '#ea92b0')}`,
    backgroundPosition: '0 0, 0 0, 0 0, 14px 14px',
  },
  /* A night sky on the wall wants the light layer turned down, or the
     window's daylight washes the stars out. */
  wall_stars: {
    backgroundColor: '#3f4a78',
    backgroundImage: 'radial-gradient(ellipse 95% 120% at 16% 2%, rgba(214,226,255,.16), transparent 58%), ' +
      'linear-gradient(180deg, rgba(255,255,255,.08) 0%, rgba(255,255,255,0) 40%, rgba(10,14,34,.28) 100%), ' +
      `${starTile(46, 8, '#fff8dc', '#e8c165', '#ffe9a8')}, ${starTile(62, 5, '#fff3cc', '#dcae52', '#ffe9a8')}`,
    backgroundPosition: '0 0, 0 0, 0 0, 28px 24px',
  },
  wall_flowers: {
    backgroundColor: '#eef7e8',
    backgroundImage: `${WALL_DEPTH}, ${flowerTile(54, 11, '#f8bccd', '#e88ba8', '#f0b44e')}, ` +
      `${flowerTile(38, 7, '#ffe6a8', '#e8bc5c', '#d99a4e')}`,
    backgroundPosition: '0 0, 0 0, 0 0, 19px 24px',
  },

  wall_clouds: {
    backgroundColor: '#cfe6f5',
    backgroundImage: `${WALL_DEPTH}, ${cloudTile(120, 80, '#ffffff', '#d8e8f3')}, ` +
      `${cloudTile(86, 58, '#ffffff', '#dceaf4')}`,
    backgroundPosition: '0 0, 0 0, 0 0, 54px 36px',
  },
  wall_rainbow: {
    backgroundColor: '#fdf3e4',
    backgroundImage: `${WALL_DEPTH}, ` + tile(108, 8,
      ['#f6b0b0', '#f8cf9a', '#f7e7a0', '#b6e0b0', '#a8cfef', '#cbb4e4'].map((c, i) =>
        `<rect x='${i * 18}' width='18' height='8' fill='${c}'/>` +
        `<rect x='${i * 18}' width='2.6' height='8' fill='#ffffff' opacity='0.42'/>` +
        `<rect x='${i * 18 + 15.4}' width='2.6' height='8' fill='#000000' opacity='0.12'/>`).join('')),
  },
  wall_books: {
    backgroundColor: '#c9a87c',
    backgroundImage: `${WALL_DEPTH}, ${bookTile}`,
  },
  wall_ocean: {
    backgroundColor: '#2f6f96',
    backgroundImage: `${WALL_DEPTH}, ${waveTile(64, 26, '#bfe6f5')}, ` +
      'radial-gradient(circle at 22% 30%, rgba(255,255,255,.35) 5%, transparent 7%), ' +
      'radial-gradient(circle at 70% 60%, rgba(255,255,255,.28) 4%, transparent 6%)',
    backgroundSize: 'auto, auto, auto, 90px 90px, 70px 70px',
  },

  /* ---- Flooring ----
     Board ends and tile joints bunch up towards the back of the room, which
     is the perspective; the tile on top of that is the material. */
  floor_wood: {
    backgroundColor: '#d9b183',
    backgroundImage: `${FLOOR_DEPTH}, ${WOOD_ROWS}, ` + tile(90, 14,
      `<g fill='none' stroke='#96693c' stroke-linecap='round'>
         <path d='M 4 4 q 22 2 44 1 t 40 2' stroke-opacity='0.16' stroke-width='1.2'/>
         <path d='M -6 9 q 26 -2 52 0 t 46 1' stroke-opacity='0.12' stroke-width='1'/>
         <path d='M 12 12 q 18 1 34 0' stroke-opacity='0.1' stroke-width='0.9'/>
       </g>`),
  },
  floor_tile: {
    backgroundColor: '#f2ece2',
    backgroundImage: `${FLOOR_DEPTH}, ${STONE_ROWS}, ` + tile(46, 46,
      `<defs>${tileGrad('a', '#faf6ee', '#e4dac6')}${tileGrad('b', '#e6dac4', '#cdbda2')}</defs>
       <rect width='46' height='46' fill='#b9a98c'/>
       <rect x='1' y='1' width='21' height='21' rx='2' fill='url(#a)'/>
       <rect x='24' y='1' width='21' height='21' rx='2' fill='url(#b)'/>
       <rect x='1' y='24' width='21' height='21' rx='2' fill='url(#b)'/>
       <rect x='24' y='24' width='21' height='21' rx='2' fill='url(#a)'/>
       <g fill='#ffffff' opacity='0.4'>
         <rect x='1' y='1' width='21' height='1.4' rx='0.7'/><rect x='24' y='1' width='21' height='1.4' rx='0.7'/>
         <rect x='1' y='24' width='21' height='1.4' rx='0.7'/><rect x='24' y='24' width='21' height='1.4' rx='0.7'/>
       </g>`),
  },
  floor_grass: {
    backgroundColor: '#9fd08a',
    backgroundImage: `${FLOOR_DEPTH}, ${bladeTile(26, 14, '#5a9650', '#bde0a8')}`,
  },
  floor_stone: {
    backgroundColor: '#cfc9c0',
    backgroundImage: `${FLOOR_DEPTH}, ${STONE_ROWS}, ${stoneTile(56, 34, '#ded8ce', '#b6aea3', '#a89f92')}`,
    backgroundPosition: '0 0, 0 0, 0 0',
  },
  floor_pond: {
    backgroundColor: '#8ecfe6',
    backgroundImage: `${FLOOR_DEPTH}, ${waveTile(58, 22, '#eaf8ff')}, ` +
      'linear-gradient(180deg, rgba(255,255,255,.35), transparent)',
  },
  floor_moss: {
    backgroundColor: '#8fbf7a',
    backgroundImage: `${FLOOR_DEPTH}, ${clumpTile(36, 30, '#aed799', '#6fa55e')}`,
  },
  floor_sand: {
    backgroundColor: '#eed9ab',
    backgroundImage: `${FLOOR_DEPTH}, ${rippleTile(46, 18, '#b89460')}`,
  },
  floor_marble: {
    backgroundColor: '#eceaf0',
    backgroundImage: `${FLOOR_DEPTH}, ${STONE_ROWS}, ${veinTile(150, 104, '#8a889e')}`,
  },
  /* ---- The garden: sky ----
     These fill the top band of the garden, so they are drawn as if seen
     from the ground: lighter towards the horizon, whatever is up there
     placed high enough that a tree does not grow through it. */
  sky_day: {
    backgroundColor: '#8fc9ec',
    backgroundImage: 'radial-gradient(circle at 76% 22%, #fff6cf 5%, rgba(255,246,207,.55) 8%, transparent 13%), ' +
      `${cloudTile(190, 110, 'rgba(255,255,255,.92)', 'rgba(226,240,250,.72)')}, ` +
      'linear-gradient(180deg, #6fb7e4 0%, #a9d8f0 55%, #dcf0fa 100%)',
    backgroundPosition: '0 0, 20px 6px, 0 0',
    backgroundRepeat: 'no-repeat, repeat-x, no-repeat',
  },
  sky_sunset: {
    backgroundColor: '#f3a97a',
    backgroundImage: 'radial-gradient(circle at 70% 76%, #fff1c0 6%, rgba(255,222,150,.5) 11%, transparent 18%), ' +
      `${cloudTile(280, 96, 'rgba(255,218,192,.6)', 'rgba(208,144,152,.42)')}, ` +
      'linear-gradient(180deg, #8f7ab5 0%, #e8899a 42%, #f6b884 72%, #fbdcae 100%)',
    backgroundPosition: '0 0, 30px 14px, 0 0',
    backgroundRepeat: 'no-repeat, repeat-x, no-repeat',
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
      `${cloudTile(180, 100, 'rgba(255,255,255,.9)', 'rgba(222,238,248,.7)')}, ` +
      'linear-gradient(180deg, #7fbfe2, #d4ecf9)',
    backgroundPosition: '0 0, 12px 10px, 0 0',
    backgroundRepeat: 'no-repeat, repeat-x, no-repeat',
  },

  /* ---- The garden: ground ----
     Blades bunch up towards the fence, the same trick the floorboards use:
     that is what turns a green rectangle into a lawn going away from you. */
  /* ---- The water ----

     A vertical run from a bright surface to a darker deep, with the light
     coming THROUGH it rather than sitting on it. The shafts are drawn as
     wide, very faint gradients angled off the vertical. */
  water_sunny: {
    backgroundColor: '#4fa8c8',
    backgroundImage:
      'linear-gradient(104deg, rgba(255,255,255,.16) 0 6%, rgba(255,255,255,0) 6% 16%, ' +
        'rgba(255,255,255,.13) 16% 21%, rgba(255,255,255,0) 21% 44%, ' +
        'rgba(255,255,255,.1) 44% 52%, rgba(255,255,255,0) 52%), ' +
      `${causticTile(168, 104, '#dff6ff', 0.22)}, ${causticTile(97, 61, '#dff6ff', 0.13)}, ` +
      `${moteTile(70, '#eafaff')}, ` +
      'linear-gradient(180deg, #8fdcee 0%, #62bcd9 34%, #3f96bd 74%, #2d7aa4 100%)',
    backgroundSize: 'auto, 168px 104px, 97px 61px, 70px 70px, auto',
    backgroundPosition: '0 0, 0 0, 40px 23px, 0 0, 0 0',
  },
  water_deep: {
    backgroundColor: '#2c6d96',
    backgroundImage:
      'linear-gradient(104deg, rgba(255,255,255,.1) 0 5%, rgba(255,255,255,0) 5% 18%, ' +
        'rgba(255,255,255,.08) 18% 23%, rgba(255,255,255,0) 23%), ' +
      `${causticTile(182, 112, '#bfe6f5', 0.2)}, ${causticTile(103, 67, '#bfe6f5', 0.12)}, ` +
      `${moteTile(80, '#cfeeff')}, ` +
      'linear-gradient(180deg, #5fb2cd 0%, #3a86ad 30%, #23628a 72%, #17456a 100%)',
    backgroundSize: 'auto, 182px 112px, 103px 67px, 80px 80px, auto',
    backgroundPosition: '0 0, 0 0, 47px 29px, 0 0, 0 0',
  },
  water_moonlit: {
    backgroundColor: '#2b3f6b',
    backgroundImage:
      'linear-gradient(100deg, rgba(220,232,255,.14) 0 5%, rgba(220,232,255,0) 5% 20%, ' +
        'rgba(220,232,255,.1) 20% 24%, rgba(220,232,255,0) 24%), ' +
      `${causticTile(176, 108, '#dbe8ff', 0.19)}, ${causticTile(99, 63, '#dbe8ff', 0.11)}, ` +
      `${moteTile(76, '#e8f0ff')}, ` +
      'linear-gradient(180deg, #6d84bb 0%, #465d94 32%, #2b3f6b 74%, #1b2a4c 100%)',
    backgroundSize: 'auto, 176px 108px, 99px 63px, 76px 76px, auto',
    backgroundPosition: '0 0, 0 0, 45px 27px, 0 0, 0 0',
  },

  /* ---- The bottom of it ----

     Darker at the top edge, where the water above is deepest, so the bed
     joins the water instead of being pasted onto it. */
  bed_sand: {
    backgroundColor: '#e3d3a6',
    backgroundImage: 'linear-gradient(180deg, rgba(40,72,90,.42) 0%, rgba(40,72,90,.14) 12%, ' +
      'rgba(255,255,255,0) 46%, rgba(255,255,255,.14) 100%), ' +
      `${rippleTile(54, 22, '#b39a62')}`,
    backgroundSize: 'auto, 54px 22px',
  },
  bed_pebbles: {
    backgroundColor: '#b9b3a6',
    backgroundImage: 'linear-gradient(180deg, rgba(40,72,90,.44) 0%, rgba(40,72,90,.14) 14%, ' +
      'rgba(255,255,255,0) 52%), ' +
      `${pebbleTile(64, 34, '#ded8cb', '#a9a294', '#6f695c')}`,
    backgroundSize: 'auto, 64px 34px',
  },
  bed_river: {
    backgroundColor: '#8c9aa0',
    backgroundImage: 'linear-gradient(180deg, rgba(30,60,78,.46) 0%, rgba(30,60,78,.16) 14%, ' +
      'rgba(255,255,255,0) 52%), ' +
      `${pebbleTile(92, 40, '#c4ced2', '#8a969c', '#5a656a')}`,
    backgroundSize: 'auto, 92px 40px',
  },

  ground_grass: {
    backgroundColor: '#8cc472',
    backgroundImage: `${GROUND_DEPTH}, ${GRASS_ROWS}, ${bladeTile(24, 15, '#4f8a48', '#aed893')}`,
  },
  ground_sand: {
    backgroundColor: '#e9d29c',
    backgroundImage: 'linear-gradient(180deg, rgba(150,116,66,.32) 0%, rgba(150,116,66,.09) 9%, rgba(255,255,255,0) 52%, rgba(255,255,255,.12) 100%), ' +
      `${rippleTile(50, 20, '#b89460')}`,
  },
  /* Flagstones laid over the grass rather than scattered pebbles: the joint
     between them is where the green shows through. */
  ground_path: {
    backgroundColor: '#6f9a5c',
    backgroundImage: `${GROUND_DEPTH}, ${stoneTile(58, 34, '#ded6c6', '#bdb3a0', '#6f9a5c')}`,
  },
  /* Flowers scattered through grass, not confetti: small heads, spread far
     enough apart that the green still reads as the surface. */
  ground_meadow: {
    backgroundColor: '#8fc873',
    backgroundImage: `${GROUND_DEPTH}, ${flowersTile(164, 124, [[18, 26, 6.5, '#fbd6e4', '#eda6c0', '#efc05a'], [70, 12, 5.5, '#ffeaa8', '#e8c35c', '#d9a24e'], [118, 38, 6, '#ddc8f0', '#b79ad8', '#efc05a'], [44, 64, 5.5, '#ffeaa8', '#e8c35c', '#d9a24e'], [96, 80, 6.5, '#fbd6e4', '#eda6c0', '#efc05a'], [142, 96, 5.5, '#ddc8f0', '#b79ad8', '#efc05a'], [24, 104, 6, '#fbd6e4', '#eda6c0', '#efc05a'], [126, 14, 5, '#ffeaa8', '#e8c35c', '#d9a24e']])}, ` +
      `${bladeTile(24, 15, '#4f8a48', '#aed893')}`,
  },

  floor_petals: {
    backgroundColor: '#f6d6de',
    backgroundImage: `${FLOOR_DEPTH}, ${petalTile(46, 40, '#fbd2dd', '#eda7bb', '#d98ba4')}`,
  },
};

export const surfaceStyle = id => SURFACES[id] || SURFACES.wall_plain;

import { litRect, litEllipse, litPath, ringRect, ringPath,
         contact, inset, raised, gloss, grain, shadeFills, castShadow,
         tile, tileGrad, SHADOW } from './shade.js';

/* Re-exported so a caller that already has item-art.js does not need to
   know where the light is defined. */
export { SHADOW };

/* =========================== DECORATIONS ===========================
   Each draws inside a 0 0 100 100 box, standing on y = 92. */

const DECOR = {
  /* ---- Birthday Week ---- */

  birthday_cake: () => shadeFills(`
    <ellipse cx="50" cy="90" rx="34" ry="6" fill="#e8dcc9" opacity=".7"/>
    <rect x="18" y="62" width="64" height="27" rx="6" fill="#f7d9e6" stroke="#c98da8" stroke-width="3"/>
    <rect x="26" y="42" width="48" height="22" rx="6" fill="#fdeef5" stroke="#c98da8" stroke-width="3"/>
    <path d="M 18 66 q 8 8 16 0 q 8 8 16 0 q 8 8 16 0 q 8 8 16 0" fill="none" stroke="#f4a8c6" stroke-width="4" stroke-linecap="round"/>
    <path d="M 26 46 q 8 7 16 0 q 8 7 16 0 q 8 7 16 0" fill="none" stroke="#f4a8c6" stroke-width="3.4" stroke-linecap="round"/>
    ${[34, 50, 66].map(x => `
      <rect x="${x - 2.6}" y="26" width="5.2" height="16" rx="2.4" fill="#8fd3a8" stroke="#4f9b6d" stroke-width="2"/>
      <ellipse cx="${x}" cy="22" rx="3.4" ry="5" fill="#ffd980" stroke="#e0a63a" stroke-width="1.8"/>`).join('')}`) + contact(50, 95, 30, 5.7, .26),

  balloon_bunch: () => {
    const balloon = (x, y, r, fill, edge) => `
      <ellipse cx="${x}" cy="${y}" rx="${r}" ry="${r * 1.18}" fill="${fill}" stroke="${edge}" stroke-width="2.6"/>
      <path d="M ${x - 3} ${y + r * 1.18} l 3 4 l 3 -4 z" fill="${edge}"/>
      <ellipse cx="${x - r * 0.34}" cy="${y - r * 0.4}" rx="${r * 0.22}" ry="${r * 0.3}" fill="#fff" opacity=".55"/>`;
    return shadeFills(`
      <path d="M 30 42 Q 44 66 50 88" fill="none" stroke="#b9a68f" stroke-width="2.2"/>
      <path d="M 50 40 Q 51 64 50 88" fill="none" stroke="#b9a68f" stroke-width="2.2"/>
      <path d="M 70 44 Q 58 68 50 88" fill="none" stroke="#b9a68f" stroke-width="2.2"/>
      ${balloon(30, 30, 15, '#ef8f9f', '#b3596e')}
      ${balloon(70, 32, 14, '#8fc4e0', '#4f7f9b')}
      ${balloon(50, 22, 16, '#ffd980', '#c9922c')}
      <circle cx="50" cy="89" r="4" fill="#c9a887" stroke="#8a6f54" stroke-width="2"/>`) + contact(50, 95, 16, 3.0, .26);
  },

  party_banner: () => {
    const flags = ['#ef8f9f', '#ffd980', '#8fc4e0', '#a8d8b0', '#c9a3e0'];
    return `
      <path d="M 6 26 Q 50 46 94 26" fill="none" stroke="#b9a68f" stroke-width="3" stroke-linecap="round"/>
      ${flags.map((c, i) => {
        const t = (i + 0.5) / flags.length;
        const x = 6 + t * 88;
        const y = 26 + Math.sin(Math.PI * t) * 19;
        return castShadow(shadeFills(`<path d="M ${x - 8} ${y} L ${x + 8} ${y} L ${x} ${y + 21} Z"
                      fill="${c}" stroke="#8a7f74" stroke-width="2" stroke-linejoin="round"/>`));
      }).join('')}`;
  },

  /* ---- Gathering Week ---- */

  /* A pie in a dish with a crimped crust, a slice cut out of it and a
     swirl of cream. The first one was a flat beige disc with a white dot
     on it and could have been anything. */
  pumpkin_pie: () => shadeFills(`
    <path d="M 12 58 Q 50 44 88 58 L 82 80 Q 50 92 18 80 Z"
          fill="#e8b98a" stroke="#a5754a" stroke-width="3" stroke-linejoin="round"/>
    <path d="M 14 68 Q 50 80 86 68" fill="none" stroke="#a5754a" stroke-width="2.4" opacity=".5"/>
    <ellipse cx="50" cy="58" rx="38" ry="14" fill="#e0a868" stroke="#a5754a" stroke-width="3"/>
    ${/* The crimped rim: a ring of little humps all the way round. */ ''}
    ${[...Array(16)].map((_, i) => {
      const a = (i / 16) * Math.PI * 2;
      return `<ellipse cx="${n2(50 + Math.cos(a) * 36)}" cy="${n2(58 + Math.sin(a) * 13)}"
                       rx="4.6" ry="3.2" fill="#f0c791" stroke="#a5754a" stroke-width="1.8"
                       transform="rotate(${n2(a * 57)} ${n2(50 + Math.cos(a) * 36)} ${n2(58 + Math.sin(a) * 13)})"/>`;
    }).join('')}
    <ellipse cx="50" cy="58" rx="30" ry="10" fill="#c8812f" stroke="#9a5f22" stroke-width="2"/>
    <ellipse cx="46" cy="55" rx="18" ry="5" fill="#d9903c" opacity=".7"/>
    ${/* One slice taken out, so it is a pie somebody is eating. */ ''}
    <path d="M 50 58 L 74 53 A 30 10 0 0 1 68 65 Z" fill="#a8681f" stroke="#9a5f22" stroke-width="2"
          stroke-linejoin="round"/>
    <path d="M 40 48 q 5 -7 10 -2 q 6 -7 10 0 q 4 5 -1 8" fill="#fff6e8" stroke="#dcc9ae"
          stroke-width="2" stroke-linejoin="round"/>
    <path d="M 24 52 q 8 -5 16 -2" fill="none" stroke="#f3d2a8" stroke-width="2.6"
          stroke-linecap="round" opacity=".8"/>`) + contact(50, 92, 34, 6, .26),

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
    return castShadow(shadeFills(out + `<circle cx="50" cy="19" r="4.6" fill="#d94f5c" stroke="#9a3340" stroke-width="2"/>`));
  },

  cornucopia: () => shadeFills(`
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
    <path d="M 36 61 v 28 M 50 61 v 28 M 64 61 v 28" stroke="#b9843f" stroke-width="2" opacity=".55"/>`) + contact(50, 95, 32, 6.1, .26),

  /* ---- Trim the Tree ---- */

  holiday_tree: () => shadeFills(`
    <rect x="44" y="76" width="12" height="14" rx="3" fill="#a5794f" stroke="#7a5836" stroke-width="2.5"/>
    <path d="M 50 12 L 72 44 L 28 44 Z" fill="#5fa97a" stroke="#3d7a56" stroke-width="3" stroke-linejoin="round"/>
    <path d="M 50 28 L 78 60 L 22 60 Z" fill="#6cb886" stroke="#3d7a56" stroke-width="3" stroke-linejoin="round"/>
    <path d="M 50 44 L 84 78 L 16 78 Z" fill="#7fc99a" stroke="#3d7a56" stroke-width="3" stroke-linejoin="round"/>
    <circle cx="40" cy="54" r="4" fill="#ef7f7f"/><circle cx="62" cy="52" r="3.6" fill="#6fb3d9"/>
    <circle cx="34" cy="72" r="4" fill="#ffd980"/><circle cx="58" cy="70" r="3.6" fill="#c9a3e0"/>
    <circle cx="70" cy="74" r="3.4" fill="#ef7f9f"/>
    <path d="M 50 4 l 3.2 6.6 l 7.2 1 l -5.2 5 l 1.2 7.2 l -6.4 -3.4 l -6.4 3.4 l 1.2 -7.2 l -5.2 -5 l 7.2 -1 z"
          fill="#ffe08a" stroke="#d8ae4c" stroke-width="2" stroke-linejoin="round"/>`) + contact(50, 95, 28, 5.3, .26),

  stocking: () => castShadow(shadeFills(`
    <path d="M 20 16 h 44" stroke="#b9a68f" stroke-width="3" stroke-linecap="round"/>
    <rect x="28" y="20" width="30" height="13" rx="6" fill="#fdf6ec" stroke="#c9b8a4" stroke-width="3"/>
    <path d="M 32 33 L 32 60 Q 32 78 50 80 L 72 82 Q 84 82 84 72 Q 84 64 72 64 L 54 62 Q 54 46 54 33 Z"
          fill="#e2566f" stroke="#a23b50" stroke-width="3" stroke-linejoin="round"/>
    <path d="M 36 46 h 16" stroke="#f4a8b8" stroke-width="3.4" stroke-linecap="round"/>
    <path d="M 36 54 h 16" stroke="#f4a8b8" stroke-width="3.4" stroke-linecap="round"/>
    <circle cx="74" cy="73" r="5" fill="#f4a8b8"/>`)),

  snow_globe: () => shadeFills(`
    <path d="M 22 78 L 78 78 L 72 92 L 28 92 Z" fill="#a5794f" stroke="#7a5836" stroke-width="3" stroke-linejoin="round"/>
    <rect x="18" y="72" width="64" height="9" rx="4" fill="#c9a887" stroke="#7a5836" stroke-width="3"/>
    <circle cx="50" cy="46" r="32" fill="#dff0fa" stroke="#7fa8bb" stroke-width="3" opacity=".95"/>
    <path d="M 50 62 L 62 62 L 50 44 L 38 62 Z" fill="#6cb886" stroke="#3d7a56" stroke-width="2.4" stroke-linejoin="round"/>
    <rect x="47" y="60" width="6" height="8" rx="2" fill="#a5794f"/>
    ${[[34,32],[64,36],[42,56],[70,56],[54,26],[28,48]]
      .map(([x, y]) => `<circle cx="${x}" cy="${y}" r="2.6" fill="#fff"/>`).join('')}
    <path d="M 30 30 a 28 28 0 0 1 16 -12" fill="none" stroke="#fff" stroke-width="4" opacity=".6" stroke-linecap="round"/>`) + contact(50, 95, 26, 4.9, .26),

  /* ---- Midnight Sparklers ---- */

  sparkler_jar: () => shadeFills(`
    <rect x="29" y="50" width="42" height="42" rx="8" fill="#cfe7f2" stroke="#5f8fa5"
          stroke-width="3.4" opacity=".96"/>
    <rect x="33" y="54" width="10" height="34" rx="5" fill="#ffffff" opacity=".5"/>
    <rect x="62" y="58" width="5" height="26" rx="2.5" fill="#ffffff" opacity=".3"/>
    <path d="M 29 78 h 42" stroke="#9fc6d6" stroke-width="2" opacity=".7"/>
    <rect x="25" y="45" width="50" height="9" rx="4.5" fill="#c9a887" stroke="#8a6f54" stroke-width="2.5"/>
    <path d="M 27 49.5 h 46" stroke="#e4cdac" stroke-width="2.4" opacity=".8"/>
    ${[[38, 20, -16], [50, 12, 0], [62, 20, 16]].map(([x, y, rot]) => `
      <g transform="rotate(${rot} 50 60)">
        <path d="M ${x} 50 L ${x} ${y + 10}" stroke="#8a7f74" stroke-width="3" stroke-linecap="round"/>
        <circle cx="${x}" cy="${y + 6}" r="5" fill="#ffe98a"/>
        <path d="M ${x} ${y - 4} v 8 M ${x - 7} ${y + 6} h 14 M ${x - 5} ${y + 1} l 10 10 M ${x + 5} ${y + 1} l -10 10"
              stroke="#ffd35c" stroke-width="2.4" stroke-linecap="round"/>
      </g>`).join('')}
    <path d="M 33 60 q -2 14 0 26" fill="none" stroke="#fff" stroke-width="4" opacity=".5" stroke-linecap="round"/>`) + contact(50, 95, 20, 3.8, .26),

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
    return castShadow(shadeFills(`
      <path d="M 6 28 Q 50 48 94 28" fill="none" stroke="#b9a68f" stroke-width="3" stroke-linecap="round"/>
      ${star(22, 46, 11)}${star(50, 56, 13)}${star(78, 46, 11)}`));
  },

  midnight_clock: () => castShadow(shadeFills(`
    <circle cx="50" cy="52" r="34" fill="#f6e6c9" stroke="#8a6f54" stroke-width="4"/>
    <circle cx="50" cy="52" r="27" fill="#fffdf9" stroke="#c9b8a4" stroke-width="2.4"/>
    ${[0, 3, 6, 9].map(h => {
      const a = (h / 12) * Math.PI * 2 - Math.PI / 2;
      return `<circle cx="${(50 + Math.cos(a) * 21).toFixed(1)}" cy="${(52 + Math.sin(a) * 21).toFixed(1)}" r="2.4" fill="#8a6f54"/>`;
    }).join('')}
    <path d="M 50 52 L 50 34" stroke="#4a3b32" stroke-width="3.4" stroke-linecap="round"/>
    <path d="M 50 52 L 50 32" stroke="#4a3b32" stroke-width="2.6" stroke-linecap="round"/>
    <circle cx="50" cy="52" r="3.4" fill="#4a3b32"/>
    <path d="M 36 18 q 14 -8 28 0" fill="none" stroke="#8a6f54" stroke-width="3.4" stroke-linecap="round"/>`)),

  /* ---- Spring Egg Hunt ---- */

  egg_basket: () => {
    const egg = (x, y, fill, edge, band) => `
      <ellipse cx="${x}" cy="${y}" rx="9" ry="11.5" fill="${fill}" stroke="${edge}" stroke-width="2.4"/>
      <path d="M ${x - 8} ${y} q 8 4 16 0" fill="none" stroke="${band}" stroke-width="2.6"/>`;
    return shadeFills(`
      <ellipse cx="50" cy="90" rx="32" ry="6" fill="#e8dcc9" opacity=".7"/>
      ${egg(34, 50, '#f4a8c6', '#b3596e', '#fff')}
      ${egg(66, 50, '#a8d8ea', '#4f7f9b', '#fff')}
      ${egg(50, 44, '#ffe08a', '#c9922c', '#fff')}
      <path d="M 22 56 L 78 56 L 70 88 L 30 88 Z" fill="#d9a35f" stroke="#9a6a30" stroke-width="3" stroke-linejoin="round"/>
      <rect x="18" y="52" width="64" height="9" rx="4" fill="#e8b98a" stroke="#9a6a30" stroke-width="3"/>
      <path d="M 30 62 h 40 M 32 72 h 36 M 34 82 h 32" stroke="#b9843f" stroke-width="2.4" stroke-linecap="round"/>`) + contact(50, 95, 28, 5.3, .26);
  },

  tulip_pot: () => {
    const tulip = (x, top, c, e) => `
      <path d="M ${x} 62 Q ${x - 2} ${top + 18} ${x} ${top + 12}" fill="none" stroke="#5fa97a" stroke-width="3.4"/>
      <path d="M ${x - 9} ${top + 12} q 0 -12 9 -12 q 9 0 9 12 q -4 5 -9 5 q -5 0 -9 -5 Z"
            fill="${c}" stroke="${e}" stroke-width="2.4" stroke-linejoin="round"/>`;
    return shadeFills(`
      <path d="M 30 64 Q 18 54 16 40 Q 30 44 34 62 Z" fill="#7fc99a" stroke="#4f9b6d" stroke-width="2.4" stroke-linejoin="round"/>
      <path d="M 70 64 Q 82 54 84 40 Q 70 44 66 62 Z" fill="#7fc99a" stroke="#4f9b6d" stroke-width="2.4" stroke-linejoin="round"/>
      ${tulip(34, 26, '#f4a8c6', '#b3596e')}
      ${tulip(50, 16, '#ef7f7f', '#b34d4d')}
      ${tulip(66, 26, '#ffd980', '#c9922c')}
      <path d="M 30 64 L 70 64 L 65 90 L 35 90 Z" fill="#d98b62" stroke="#a5613f" stroke-width="3" stroke-linejoin="round"/>
      <rect x="28" y="59" width="44" height="10" rx="4" fill="#e8a17c" stroke="#a5613f" stroke-width="3"/>`) + contact(50, 95, 20, 3.8, .26);
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
    return castShadow(shadeFills(out + `<path d="M 44 18 q 6 -6 12 0" fill="none" stroke="#f4a8c6" stroke-width="3.4" stroke-linecap="round"/>`));
  },

  /* ---- Halloween 2026 ---- */

  pumpkin_lantern: () => shadeFills(`
    <path d="M 50 26 Q 52 16 60 14" fill="none" stroke="#6f9b57" stroke-width="3.4" stroke-linecap="round"/>
    <rect x="45" y="20" width="10" height="12" rx="4" fill="#7fae5c" stroke="#4f7a3c" stroke-width="2.5"/>
    <ellipse cx="32" cy="60" rx="17" ry="26" fill="#ef9243" stroke="#b3641f" stroke-width="3"/>
    <ellipse cx="68" cy="60" rx="17" ry="26" fill="#ef9243" stroke="#b3641f" stroke-width="3"/>
    <ellipse cx="50" cy="60" rx="26" ry="28" fill="#f7a94e" stroke="#b3641f" stroke-width="3"/>
    <path d="M 34 52 l 9 -7 l 5 10 z" fill="#5a3418"/>
    <path d="M 66 52 l -9 -7 l -5 10 z" fill="#5a3418"/>
    <path d="M 36 68 Q 50 82 64 68 Q 57 72 50 70 Q 43 72 36 68 Z" fill="#5a3418"/>
    <circle cx="42" cy="63" r="3.4" fill="#f4c9a8" opacity=".55"/>
    <circle cx="59" cy="63" r="3.4" fill="#f4c9a8" opacity=".55"/>`) + contact(50, 95, 28, 5.3, .26),

  ghost_friend: () => shadeFills(`
    <path d="M 50 16 Q 76 16 76 46 L 76 84 Q 69 76 62 84 Q 55 76 50 84 Q 45 76 38 84 Q 31 76 24 84 L 24 46 Q 24 16 50 16 Z"
          fill="#fbf7f2" stroke="#b9b0c4" stroke-width="3" stroke-linejoin="round"/>
    <ellipse cx="41" cy="44" rx="4.4" ry="5.4" fill="#4a3b52"/>
    <ellipse cx="59" cy="44" rx="4.4" ry="5.4" fill="#4a3b52"/>
    <ellipse cx="34" cy="55" rx="5" ry="3.4" fill="#f4b8c6" opacity=".7"/>
    <ellipse cx="66" cy="55" rx="5" ry="3.4" fill="#f4b8c6" opacity=".7"/>
    <path d="M 44 56 Q 50 62 56 56" fill="none" stroke="#4a3b52" stroke-width="3" stroke-linecap="round"/>`) + contact(50, 95, 22, 4.2, .26),

  candy_bucket: () => shadeFills(`
    <path d="M 26 46 L 32 88 Q 50 92 68 88 L 74 46 Z"
          fill="#f7a94e" stroke="#b3641f" stroke-width="3" stroke-linejoin="round"/>
    <rect x="22" y="40" width="56" height="10" rx="5" fill="#ef9243" stroke="#b3641f" stroke-width="3"/>
    <path d="M 30 40 Q 50 8 70 40" fill="none" stroke="#8a6f54" stroke-width="3.4" stroke-linecap="round"/>
    <circle cx="38" cy="38" r="7" fill="#ef7f9f" stroke="#b3596e" stroke-width="2.4"/>
    <circle cx="55" cy="36" r="6" fill="#8fd3a8" stroke="#4f9b6d" stroke-width="2.4"/>
    <circle cx="66" cy="40" r="5.4" fill="#a78bc9" stroke="#6f5a8f" stroke-width="2.4"/>
    <path d="M 44 34 l 8 -4 l 0 8 z" fill="#6fb3d9" stroke="#3f7d9e" stroke-width="2"/>`) + contact(50, 95, 24, 4.6, .26),

  bat_garland: () => {
    const bat = (x, y, s) => `
      <g transform="translate(${x} ${y}) scale(${s})">
        <path d="M 0 0 Q -7 -8 -18 -6 Q -12 -1 -13 5 Q -7 2 -4 6 Q 0 10 4 6 Q 7 2 13 5 Q 12 -1 18 -6 Q 7 -8 0 0 Z"
              fill="#5c4a78" stroke="#3f3159" stroke-width="2.2" stroke-linejoin="round"/>
        <circle cx="-3" cy="0" r="1.5" fill="#ffd980"/><circle cx="3" cy="0" r="1.5" fill="#ffd980"/>
      </g>`;
    return castShadow(shadeFills(`
      <path d="M 6 26 Q 50 44 94 26" fill="none" stroke="#8a7f74" stroke-width="3" stroke-linecap="round"/>
      ${bat(22, 44, 0.85)}${bat(50, 54, 1.05)}${bat(78, 44, 0.85)}`));
  },

  /* ---- Found by the axolotl ---- */

  glow_jar: () => shadeFills(`
    <rect x="34" y="20" width="32" height="9" rx="4" fill="#c9a887" stroke="#8a6f54" stroke-width="2.5"/>
    <path d="M 32 29 Q 24 42 24 62 L 24 80 Q 24 89 33 89 L 67 89 Q 76 89 76 80 L 76 62 Q 76 42 68 29 Z"
          fill="#d9eef6" stroke="#7fa8bb" stroke-width="3" stroke-linejoin="round" opacity=".92"/>
    <circle cx="40" cy="52" r="5" fill="#ffe98a" opacity=".95"/>
    <circle cx="60" cy="44" r="4" fill="#ffe98a" opacity=".85"/>
    <circle cx="56" cy="66" r="5.4" fill="#ffe98a" opacity=".95"/>
    <circle cx="37" cy="74" r="3.6" fill="#ffe98a" opacity=".8"/>
    <circle cx="64" cy="78" r="3" fill="#ffe98a" opacity=".7"/>
    <path d="M 33 40 Q 31 56 33 74" fill="none" stroke="#fff" stroke-width="4" opacity=".55" stroke-linecap="round"/>`) + contact(50, 95, 19, 3.6, .26),

  moon_shell: () => shadeFills(`
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
    <ellipse cx="50" cy="83" rx="7" ry="4" fill="#dcc0d0"/>`) + contact(50, 95, 30, 5.7, .26),

  star_map: () => castShadow(shadeFills(`
    <rect x="12" y="16" width="76" height="68" rx="7" fill="#e8d3ba" stroke="#a5875f" stroke-width="3.4"/>
    <rect x="19" y="23" width="62" height="54" rx="4" fill="#3c4a6b"/>
    <path d="M 31 63 L 44 44 L 58 52 L 71 33" fill="none" stroke="#8fb6d9" stroke-width="2" opacity=".8"/>
    ${[[31,63,3.6],[44,44,4.4],[58,52,3],[71,33,4],[36,33,2.4],[64,66,2.6],[50,30,2.2],[26,48,2]]
      .map(([x, y, r]) => `<circle cx="${x}" cy="${y}" r="${r}" fill="#fff4cf"/>`).join('')}
    <circle cx="44" cy="44" r="8" fill="#fff4cf" opacity=".18"/>`)),

  paper_boat: () => shadeFills(`
    <ellipse cx="50" cy="82" rx="38" ry="8" fill="#bfe0ef" opacity=".8"/>
    <path d="M 16 68 L 84 68 L 68 84 L 32 84 Z"
          fill="#cfe2f0" stroke="#7d9cb5" stroke-width="3" stroke-linejoin="round"/>
    <path d="M 50 66 L 50 22 L 80 66 Z" fill="#fffdf9" stroke="#7d9cb5" stroke-width="3" stroke-linejoin="round"/>
    <path d="M 50 66 L 50 30 L 24 66 Z" fill="#e6eef4" stroke="#7d9cb5" stroke-width="3" stroke-linejoin="round"/>
    <path d="M 58 46 L 72 60" stroke="#b9cddc" stroke-width="2.4" stroke-linecap="round"/>
    <path d="M 20 88 Q 30 84 40 88 Q 50 92 60 88 Q 70 84 80 88" fill="none"
          stroke="#8fc9e0" stroke-width="3" stroke-linecap="round"/>`) + contact(50, 95, 30, 5.7, .26),

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

  /* A beach ball with coloured panels. Two white arcs across a blue circle
     read as a lens, or a mouth, but never as a ball. */
  toy_ball: () => `
    ${contact(50, 90, 24, 5, .28)}
    ${litEllipse(50, 66, 26, 26, '#8ac6e6', '#3f7d9e', { stroke: '#3f7d9e', sw: 3 })}
    <clipPath id="ballclip"><circle cx="50" cy="66" r="25"/></clipPath>
    <g clip-path="url(#ballclip)">
      <path d="M 50 41 q 14 25 0 50 q -9 -25 0 -50 z" fill="#fdf3e2"/>
      <path d="M 50 41 q -15 25 0 50 q -22 -8 -24 -25 q 2 -17 24 -25 z" fill="#f7a8b8"/>
      <path d="M 50 41 q 26 8 25 25 q -1 17 -25 25 q 13 -25 0 -50 z" fill="#ffe08a"/>
      <path d="M 26 66 h 48" stroke="#3f7d9e" stroke-width="1.6" opacity=".25"/>
    </g>
    <circle cx="50" cy="66" r="25" fill="none" stroke="#3f7d9e" stroke-width="3"/>
    <ellipse cx="41" cy="55" rx="7" ry="5" fill="#fff" opacity=".6" transform="rotate(-28 41 55)"/>`,

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
    <path d="M 28 52 Q 37 43 46 40" fill="none" stroke="#fff" stroke-opacity=".3" stroke-width="4"/>
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

  /* A scallop shell standing open behind the mattress. The first one was a
     smooth dome and read as a swimming cap; what makes a shell a shell is
     the fan of ribs meeting at the hinge and the scalloped edge they make
     where they end. */
  bed_shell: () => {
    const RIBS = 7;
    /* The outline is walked rib by rib, so the scalloped edge and the ribs
       can never drift apart. */
    const hinge = { x: 50, y: 82 };
    const pt = (i, r) => {
      const a = Math.PI + (Math.PI * i) / RIBS;      // left round to right
      return [hinge.x + Math.cos(a) * r * 1.05, hinge.y + Math.sin(a) * r * 0.92];
    };
    let edge = `M ${n2(pt(0, 42)[0])} ${n2(pt(0, 42)[1])} `;
    for (let i = 1; i <= RIBS; i++) {
      const [mx, my] = pt(i - 0.5, 48);
      const [ex, ey] = pt(i, 42);
      edge += `Q ${n2(mx)} ${n2(my)} ${n2(ex)} ${n2(ey)} `;
    }
    const ribs = [...Array(RIBS - 1)].map((_, i) => {
      const [x, y] = pt(i + 1, 40);
      return `<path d="M ${hinge.x} ${hinge.y} L ${n2(x)} ${n2(y)}"
                    stroke="#e0a3b8" stroke-width="2.6" stroke-linecap="round"/>`;
    }).join('');
    return `
      ${contact(50, 88, 44, 6, .26)}
      ${litPath(`${edge} Z`, '#fdd9e5', '#dfa0b6', { stroke: '#c07e96', sw: 3.5, join: 'round' })}
      ${ribs}
      <path d="M ${n2(pt(1.2, 36)[0])} ${n2(pt(1.2, 36)[1])} L ${hinge.x} ${hinge.y}"
            stroke="#fff" stroke-opacity=".5" stroke-width="2.4" stroke-linecap="round"/>
      ${litEllipse(50, 82, 30, 8, '#fff2f7', '#efc4d3', { stroke: '#c07e96', sw: 3 })}
      ${litEllipse(50, 80, 13, 4.4, '#ffffff', '#f6dde6')}`;
  },

  /* ---- Rugs ---- */
  /* Every rug is drawn lying in the same band of its square — low down,
     and about half as tall as it is wide — because the room hangs a rug's
     box by its bottom edge and a rug drawn any rounder stands up off the
     floor and leans against the wall. */
  rug_round: () => `
    ${contact(50, 76, 47, 22, .18)}
    ${litEllipse(50, 74, 44, 20, '#c2e5d8', '#98c9b7', { stroke: '#5f9683', sw: 3.5, cy: '30%' })}
    ${litEllipse(50, 74, 31, 14, '#eef8f4', '#cbe4dc', { stroke: '#5f9683', sw: 2.5, cy: '30%' })}
    ${litEllipse(50, 74, 16, 7.3, '#c2e5d8', '#98c9b7', { stroke: '#5f9683', sw: 2.5, cy: '30%' })}
    <path d="M 6 76 a 44 20 0 0 0 88 0" fill="none" stroke="#3f6d5c" stroke-opacity=".16" stroke-width="3.5"/>`,

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

  bunting: () => castShadow(shadeFills(`
    <path d="M 6 26 Q 50 44 94 26" fill="none" stroke="#a5875f" stroke-width="3.5"/>
    ${[0, 1, 2, 3, 4, 5].map(i => {
      const x = 12 + i * 15.5;
      const y = 29 + Math.sin((i / 5) * Math.PI) * 8;
      const c = ['#ef7f7f', '#f6c453', '#8fd3a8', '#6fb3d9', '#c9a3e0', '#f2849f'][i];
      return `<path d="M ${x - 8} ${y} L ${x + 8} ${y} L ${x} ${y + 22} Z"
                    fill="${c}" stroke="#8a7560" stroke-width="2" stroke-linejoin="round"/>`;
    }).join('')}`)),

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

  /* ---- More to put out ----

     Because a shop she does not want anything from is a shop she stops
     visiting, and stars she will not spend are stars that stopped meaning
     anything. These are new drawings rather than new colours: things a
     nine-year-old would actually choose to have in her room. */

  /* A beanbag: a heavy squashy shape, so the light sits on the top of it
     and the bottom spreads where it meets the floor. */
  beanbag: () => `
    ${contact(50, 90, 30, 6, .28)}
    ${litPath(`M 50 40 Q 84 44 86 72 Q 86 90 50 90 Q 14 90 14 72 Q 16 44 50 40 Z`,
              '#f2a6b8', '#c76b83', { stroke: '#b05a72', sw: 3, join: 'round' })}
    <path d="M 22 74 Q 50 84 78 74" fill="none" stroke="#b05a72" stroke-opacity=".5" stroke-width="2.6"/>
    ${gloss(28, 52, 26, 6, { rot: -12, peak: .5 })}`,

  /* A tea set on a tray. Three small round things, so three chances for
     the light to do its job — but they only read as crockery if the pot has
     a spout and a lid and the cups have saucers under them. Without those
     it is beige lumps on a plate. */
  tea_set: () => `
    ${contact(50, 91, 30, 6, .26)}
    ${litEllipse(50, 80, 33, 11, '#d9bfa0', '#a8865f', { stroke: '#8a6f54', sw: 2.6 })}
    ${litEllipse(50, 77, 33, 10, '#eed9ba', '#c2a37c', { stroke: '#8a6f54', sw: 2.4 })}

    <!-- the pot: body, spout, handle, lid and a knob to pick it up by -->
    <path d="M 44 60 q 11 4 0 8" fill="none" stroke="#cf8ca2" stroke-width="3.6" stroke-linecap="round"/>
    ${litEllipse(34, 64, 14, 12, '#ffd9e4', '#e29db3', { stroke: '#cf8ca2', sw: 2.4 })}
    <path d="M 22 60 q -8 4 -2 10" fill="none" stroke="#cf8ca2" stroke-width="3.4" stroke-linecap="round"/>
    ${litEllipse(34, 53, 11, 4, '#ffeef3', '#f0c8d6', { stroke: '#cf8ca2', sw: 2 })}
    <circle cx="34" cy="49" r="2.8" fill="#fff6e8" stroke="#cf8ca2" stroke-width="1.8"/>

    <!-- two cups, each on its own saucer -->
    ${litEllipse(63, 74, 11, 3.6, '#f2f8fc', '#cfe0ea', { stroke: '#9cc0d2', sw: 1.8 })}
    ${litPath('M 56 62 q 0 9 7 9 q 7 0 7 -9 z', '#e8f4fb', '#b7d6e6',
              { stroke: '#9cc0d2', sw: 2, join: 'round' })}
    <path d="M 70 64 q 5 3 0 6" fill="none" stroke="#9cc0d2" stroke-width="2.2"/>
    ${litEllipse(63, 62, 7, 2.6, '#fff6e8', '#e6d3bb')}

    ${litEllipse(79, 69, 9, 3.2, '#fff6e8', '#e2d0b6', { stroke: '#c0aa8c', sw: 1.6 })}
    ${litPath('M 74 59 q 0 7 5.5 7 q 5.5 0 5.5 -7 z', '#fffaf0', '#e0d0b8',
              { stroke: '#c0aa8c', sw: 1.8, join: 'round' })}
    ${litEllipse(79.5, 59, 5.5, 2, '#f7e2c8', '#ddc4a2')}`,

  /* A music box, open, with something turning inside it. */
  music_box: () => `
    ${contact(50, 90, 26, 5, .26)}
    ${litRect(24, 58, 52, 30, 5, '#d98fa8', '#a85d78', { stroke: '#8f4a63', sw: 2.8 })}
    <path d="M 24 44 h 52 v 14 h -52 z" fill="#c07a94" opacity=".35"/>
    ${litPath('M 24 58 L 30 40 L 70 40 L 76 58 Z', '#e9a9bd', '#bf7390',
              { stroke: '#8f4a63', sw: 2.6, join: 'round' })}
    ${litEllipse(50, 54, 7, 7, '#fff6e8', '#e0cdb4', { stroke: '#bfa98e', sw: 2 })}
    <path d="M 50 50 v -10 q 7 -1 7 5" fill="none" stroke="#f6c453" stroke-width="2.6" stroke-linecap="round"/>
    <path d="M 32 74 h 36" stroke="#f6c453" stroke-width="3" stroke-linecap="round"/>`,

  /* A string of hearts across the wall. Each heart is lit like everything
     else in here: flat fills would have it read as a sticker of a garland
     rather than paper hearts with a front and a side. */
  heart_garland: () => `
    <path d="M 6 24 Q 50 44 94 24" fill="none" stroke="#b08a5c" stroke-width="2.6"/>
    ${[[16, 31, '#f2849f', '#c9738c'], [33, 37, '#ffd3e2', '#e7a8bd'],
       [50, 40, '#f2849f', '#c9738c'], [67, 37, '#ffd3e2', '#e7a8bd'],
       [84, 31, '#f2849f', '#c9738c']].map(([x, y, light, dark], i) => {
      const r = 8 - (i % 2) * 1.6;
      const d = `M ${n(x)} ${n(y + r * 1.25)}
                 C ${n(x - r * 1.5)} ${n(y + r * 0.2)} ${n(x - r * 0.6)} ${n(y - r * 0.9)} ${n(x)} ${n(y - r * 0.1)}
                 C ${n(x + r * 0.6)} ${n(y - r * 0.9)} ${n(x + r * 1.5)} ${n(y + r * 0.2)} ${n(x)} ${n(y + r * 1.25)} Z`;
      return litPath(d, light, dark, { stroke: '#b3596e', sw: 1.8, join: 'round', round: true }) +
        `<ellipse cx="${n(x - r * 0.4)}" cy="${n(y + r * 0.1)}" rx="${n(r * 0.3)}" ry="${n(r * 0.2)}"
                  fill="#fff" opacity=".45"/>`;
    }).join('')}`,

  /* A mobile of clouds and a moon, hung from one point. */
  cloud_mobile: () => `
    <path d="M 50 8 V 20" stroke="#b08a5c" stroke-width="2.4"/>
    <path d="M 22 22 H 78" fill="none" stroke="#b08a5c" stroke-width="2.6" stroke-linecap="round"/>
    <path d="M 26 22 V 38 M 50 22 V 48 M 74 22 V 34" stroke="#cbb79a" stroke-width="1.8"/>
    ${litEllipse(26, 46, 13, 9, '#ffffff', '#d8e6ef', { stroke: '#b7cad8', sw: 2 })}
    <circle cx="20" cy="44" r="6.5" fill="#f2f8fc"/><circle cx="31" cy="43" r="8" fill="#f8fcff"/>
    ${litEllipse(74, 42, 11, 8, '#ffffff', '#d8e6ef', { stroke: '#b7cad8', sw: 2 })}
    <circle cx="69" cy="40" r="5.5" fill="#f2f8fc"/><circle cx="78" cy="40" r="6.5" fill="#f8fcff"/>
    ${litPath('M 50 54 a 11 11 0 1 0 8 18 a 13 13 0 1 1 -8 -18 z', '#ffe9a8', '#e8c35c',
              { stroke: '#cba845', sw: 2, join: 'round' })}`,

  /* A pinboard with a few things pinned to it. */
  pinboard: () => `
    ${litRect(12, 18, 76, 58, 4, '#d9b98c', '#b0905f', { stroke: '#8a6f54', sw: 3 })}
    ${litRect(17, 23, 66, 48, 2, '#e8cfa6', '#c8a878')}
    ${litRect(24, 30, 22, 18, 1.5, '#fff6e8', '#e2d4bd', { stroke: '#c9b89c', sw: 1.6 })}
    <path d="M 28 36 h 14 M 28 40 h 10" stroke="#b7a68c" stroke-width="1.8" stroke-linecap="round"/>
    ${litRect(52, 36, 24, 20, 1.5, '#ffe2ef', '#ecc3d4', { stroke: '#d3a3b8', sw: 1.6 })}
    <path d="M 57 46 q 6 -8 12 0" fill="none" stroke="#c9738c" stroke-width="2"/>
    ${litRect(30, 52, 20, 14, 1.5, '#d8eefa', '#b3d6e8', { stroke: '#8fb8cd', sw: 1.6 })}
    ${[[35, 30, '#e2566f'], [64, 36, '#6fb3d9'], [40, 52, '#f6c453']].map(([x, y, col]) =>
      `<circle cx="${x}" cy="${y}" r="3.2" fill="${col}" stroke="rgba(90,64,40,.3)" stroke-width="1.2"/>
       <circle cx="${x - 1}" cy="${y - 1}" r="1.1" fill="#fff" opacity=".7"/>`).join('')}`,

  /* A bird bath for the garden: a bowl on a stem with water in it. */
  bird_bath: () => `
    ${contact(50, 92, 24, 5, .28)}
    ${litPath('M 40 90 L 44 56 L 56 56 L 60 90 Z', '#cbc3b6', '#8b8275',
              { stroke: '#7d7468', sw: 2.6, join: 'round' })}
    ${litEllipse(50, 90, 20, 6, '#cbc3b6', '#8b8275', { stroke: '#7d7468', sw: 2.6 })}
    ${litEllipse(50, 50, 30, 12, '#ded6c8', '#a29887', { stroke: '#7d7468', sw: 3 })}
    <ellipse cx="50" cy="48" rx="24" ry="8.5" fill="#4f93ad"/>
    ${litEllipse(50, 48, 23, 8, '#a7dcec', '#4a8ba6', { cy: '78%', r: '92%' })}
    <g class="ia-rings" style="transform-origin:56% 48%">
      <ellipse cx="56" cy="48" rx="6" ry="2.4" fill="none" stroke="#fff" stroke-opacity=".55" stroke-width="1.4"/>
      <ellipse cx="56" cy="48" rx="11" ry="4.2" fill="none" stroke="#fff" stroke-opacity=".3" stroke-width="1.4"/>
    </g>
    ${litEllipse(28, 40, 7, 6, '#f2849f', '#c9738c', { stroke: '#a85d78', sw: 1.8 })}
    <circle cx="25" cy="38" r="1.4" fill="#3a2e28"/>
    <path d="M 22 40 l -4 1 4 1 z" fill="#f6c453"/>`,

  /* A lantern on a post, for the garden path. */
  lantern_post: () => `
    ${contact(50, 92, 18, 4, .28)}
    <path d="M 50 92 V 40" stroke="#5f6a52" stroke-width="6" stroke-linecap="round"/>
    ${litEllipse(50, 92, 15, 5, '#6b7660', '#454e3c', { stroke: '#3c452f', sw: 2.4 })}
    ${litPath('M 34 40 L 50 22 L 66 40 Z', '#6b7660', '#454e3c',
              { stroke: '#3c452f', sw: 2.4, join: 'round' })}
    ${litRect(36, 40, 28, 26, 2, '#fff2c4', '#f0d68a', { stroke: '#3c452f', sw: 2.6 })}
    <path d="M 50 40 V 66 M 36 53 H 64" stroke="#3c452f" stroke-width="2"/>
    <circle cx="50" cy="53" r="6.5" fill="#fff8dd" opacity=".9"/>
    <circle cx="50" cy="53" r="12" fill="#ffe9a3" opacity=".22"/>`,

  /* A ring of toadstools, which is a thing a child will absolutely want. */
  mushroom_ring: () => `
    ${contact(50, 84, 34, 7, .24)}
    ${[[22, 74, 1], [38, 80, .82], [58, 80, .9], [76, 73, 1.05],
       [30, 64, .7], [68, 64, .75], [50, 60, .62]].map(([x, y, k]) => {
      const r = 11 * k;
      return `${litPath(`M ${n(x - r * 0.34)} ${n(y)} q 0 ${n(-r * 0.8)} ${n(r * 0.34)} ${n(-r * 0.8)}
                         q ${n(r * 0.34)} 0 ${n(r * 0.34)} ${n(r * 0.8)} z`,
                        '#fff6e8', '#ded0bb', { stroke: '#bfae95', sw: 1.6, join: 'round' })}
              ${litPath(`M ${n(x - r)} ${n(y - r * 0.72)} a ${n(r)} ${n(r * 0.86)} 0 0 1 ${n(r * 2)} 0 z`,
                        '#ef8d8d', '#c05252', { stroke: '#a84545', sw: 2, join: 'round' })}
              ${[[-0.45, -0.25], [0.2, -0.42], [0.5, -0.18]].map(([dx, dy]) =>
                `<ellipse cx="${n(x + r * dx)}" cy="${n(y - r * 0.72 + r * dy)}"
                          rx="${n(r * 0.17)}" ry="${n(r * 0.12)}" fill="#fff6e8" opacity=".9"/>`).join('')}`;
    }).join('')}`,

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
    <path d="M 50 86 V 32" fill="none" stroke="#8a6340" stroke-width="5" stroke-linecap="round"/>
    <path d="M 48.4 82 V 36" stroke="#c09667" stroke-opacity=".6" stroke-width="2"/>
    ${/* The shade sits ON the pole. It used to hang off to one side with
          the pole showing past its edge, and a pale cone of "light" that
          read as a second object leaning against it. */ ''}
    ${litPath('M 31 22 h 38 l -7 22 h -24 z', '#ffd97a', '#dda634', { stroke: '#c9922c', sw: 3, join: 'round' })}
    <ellipse cx="50" cy="43.6" rx="12" ry="3.6" fill="#fff6e8" opacity=".92"/>
    <ellipse cx="50" cy="48" rx="19" ry="7" fill="#ffe9a8" opacity=".22"/>
    <path d="M 35 24 h 11 l -3 18 h -7 z" fill="#fff" opacity=".24"/>`,

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
    ${/* The mattress goes at the foot of the stalk, where a bed would be.
          Floating it half way up read as a plate leaning on a mushroom. */ ''}
    ${litEllipse(50, 84, 32, 11, '#fff2f7', '#eabfcf', { stroke: '#c07e96', sw: 3 })}
    ${litEllipse(50, 82, 20, 6, '#ffffff', '#f6dde6')}`,

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
    ${contact(50, 76, 44, 19, .18)}
    ${litEllipse(50, 74, 42, 17, '#a8d494', '#83b271', { stroke: '#5f8a4f', sw: 3.5, cy: '30%' })}
    ${[...Array(14)].map((_, i) => {
      const a = (i / 14) * Math.PI * 2;
      return `<ellipse cx="${n2(50 + Math.cos(a) * 26)}" cy="${n2(74 + Math.sin(a) * 10)}" rx="7" ry="4"
                fill="#a4cf90" opacity="${n2(0.95 - Math.sin(a) * 0.22)}"/>`;
    }).join('')}
    ${litEllipse(50, 74, 16, 6.4, '#d0efbd', '#a8d194')}
    ${[...Array(9)].map((_, i) => {
      /* A few tufts standing up out of the moss, so it is a mat of living
         stuff rather than a green puddle. */
      const x = 14 + i * 9, y = 70 + (i % 3) * 3;
      return `<path d="M ${x} ${y} q 1.6 -5 3.4 -6.4 M ${x + 2.2} ${y} q -0.4 -4.6 -2 -6"
                fill="none" stroke="#6ba455" stroke-width="1.6" stroke-linecap="round" opacity=".8"/>`;
    }).join('')}`,

  rug_star: () => {
    let d = '';
    for (let i = 0; i < 10; i++) {
      const a = (Math.PI / 5) * i - Math.PI / 2;
      const r = i % 2 ? 18 : 44;
      d += `${i ? 'L' : 'M'} ${n2(50 + Math.cos(a) * r)} ${n2(75 + Math.sin(a) * r * 0.40)} `;
    }
    return contact(50, 77, 44, 19, .16) +
      litPath(`${d}Z`, '#ffd97a', '#dda634', { stroke: '#c9922c', sw: 3.5, join: 'round' }) +
      litEllipse(50, 75, 11, 7, '#fff2c9', '#e8c976', { stroke: '#c9922c', sw: 2.5 });
  },

  rug_flower: () => `
    ${contact(50, 77, 45, 20, .16)}
    ${[...Array(8)].map((_, i) => {
      const a = (i / 8) * Math.PI * 2;
      return litEllipse(n2(50 + Math.cos(a) * 26), n2(75 + Math.sin(a) * 10), 17, 7.6,
        '#ffb9d2', '#dd87a8', { stroke: '#c07e96', sw: 3 });
    }).join('')}
    ${litEllipse(50, 75, 20, 8, '#ffe9a8', '#e0b455', { stroke: '#c9922c', sw: 3 })}`,

  rug_cloud: () => `
    ${contact(50, 80, 42, 16, .14)}
    ${litEllipse(30, 74, 18, 8.5, '#f2f8ff', '#cfdeee', { stroke: '#bcd0e4', sw: 3 })}
    ${litEllipse(70, 74, 18, 8.5, '#f2f8ff', '#cfdeee', { stroke: '#bcd0e4', sw: 3 })}
    ${litEllipse(50, 70, 24, 10.5, '#fbfdff', '#dae7f5', { stroke: '#bcd0e4', sw: 3 })}
    ${litEllipse(50, 78, 40, 11, '#fbfdff', '#dae7f5', { stroke: '#bcd0e4', sw: 3 })}
    <ellipse cx="50" cy="77" rx="22" ry="5.6" fill="#dbe8f7" opacity=".8"/>`,

  /* ================= More for the walls ================= */

  /* Three butterflies. Each has a big upper wing and a small lower one, a
     slim body and antennae — the first pair were two blobs either side of
     a thick black bar, which read as a moth pinned to a board. */
  butterflies: () => castShadow(shadeFills(`
    ${[[26, 42, '#f2849f', '#d05d7c', 1, -12], [58, 24, '#a8c8f0', '#7099cc', .84, 10],
       [72, 54, '#ffd980', '#dcae44', .72, -6]].map(([x, y, c, edge, sc, rot]) =>
      `<g transform="translate(${x} ${y}) rotate(${rot}) scale(${sc})">
         ${[-1, 1].map(side => `
           <path d="M 0 -1 C ${side * 6} -17 ${side * 20} -15 ${side * 17} -4
                    C ${side * 15} 2 ${side * 5} 3 0 -1 Z"
                 fill="${c}" stroke="${edge}" stroke-width="2" stroke-linejoin="round"/>
           <path d="M 0 1 C ${side * 6} 6 ${side * 14} 8 ${side * 12} 13
                    C ${side * 9} 17 ${side * 3} 8 0 1 Z"
                 fill="${c}" stroke="${edge}" stroke-width="2" stroke-linejoin="round"/>
           <circle cx="${side * 11}" cy="-7" r="2.6" fill="#fff" opacity=".6"/>
           <path d="M 0 -6 q ${side * 5} -6 ${side * 8} -7" fill="none" stroke="#5a4033"
                 stroke-width="1.4" stroke-linecap="round"/>
           <circle cx="${side * 8}" cy="-13" r="1.3" fill="#5a4033"/>`).join('')}
         <path d="M 0 -6 q 2 8 0 15" fill="none" stroke="#5a4033" stroke-width="2.6"
               stroke-linecap="round"/>
         <circle cx="0" cy="-6.4" r="2.2" fill="#5a4033"/>
       </g>`).join('')}`)),

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
    ${/* A mirror with nothing in it is a white disc. This is the room
          reflected: a band of wall, a line where the floor starts, and the
          gleam across it. */ ''}
    <clipPath id="mirglass"><circle cx="50" cy="48" r="26"/></clipPath>
    <g clip-path="url(#mirglass)">
      <rect x="24" y="22" width="52" height="34" fill="#e7eef6"/>
      <rect x="24" y="56" width="52" height="24" fill="#f0e2cc"/>
      <path d="M 24 56 h 52" stroke="#d9c7ab" stroke-width="2"/>
      <rect x="34" y="34" width="13" height="22" rx="2" fill="#dbe8f2" opacity=".9"/>
      <path d="M 60 56 q 5 -12 10 0 z" fill="#cfe3d5" opacity=".9"/>
    </g>
    <path d="M 32 58 q 14 -26 34 -14" fill="none" stroke="#fff" stroke-width="7" opacity=".7" stroke-linecap="round"/>
    <circle cx="50" cy="12" r="5" fill="#f6c453" stroke="#c9922c" stroke-width="2"/>`,

  /* A hanging plant has to say "hanging" before it says "plant", and the
     first version said neither: a pot with a stub of rope above it and
     three bare green lines below read as a pot floating in mid air.

     So the hanging is drawn properly — a bracket on the wall, a ring, and
     two cords that run down PAST the pot and cradle it underneath — and
     the plant is drawn as a plant: a bushy crown spilling over the rim,
     and trailing stems with leaves along their whole length rather than a
     line with three dots near the bottom. */
  wall_planter: () => {
    const rope = '#c9a97c', ropeDark = '#9c7b4f';
    const cord = d => `<path d="${d}" fill="none" stroke="${rope}" stroke-width="2.8"
                             stroke-linecap="round"/>` +
                      `<path d="${d}" fill="none" stroke="${ropeDark}" stroke-width="1"
                             stroke-linecap="round" opacity=".5"
                             transform="translate(1.2 1.2)"/>`;
    /* The crown: big enough to overhang the pot on both sides. */
    const crown = (x, y, rot, sc, light, dark) =>
      `<g transform="translate(${x} ${y}) rotate(${rot}) scale(${sc})">
         ${litPath('M 0 13 C -9 7 -9 -7 0 -12 C 9 -7 9 7 0 13 Z', light, dark,
           { stroke: '#3d7f5a', sw: n2(2.4 / sc), join: 'round' })}
         <path d="M 0 11 V -10" stroke="#3d7f5a" stroke-width="${n2(1.6 / sc)}"/>
       </g>`;
    /* The trailing leaves are small and there are a lot of them, so they
       are flat fills with one highlight rather than a gradient each. */
    const sprig = (x, y, rot) =>
      `<g transform="translate(${x} ${y}) rotate(${rot})">
         <ellipse rx="5.4" ry="3.5" fill="#8fd3a8" stroke="#4f8a5c" stroke-width="1.8"/>
         <ellipse cx="-1.4" cy="-1.1" rx="2.8" ry="1.6" fill="#c4ead4" opacity=".75"/>
       </g>`;

    return castShadow(`
      <!-- the wall bracket and its ring -->
      ${litRect(42, 4, 16, 7, 3, '#f0cda4', '#c19a6c', { stroke: '#8a6340', sw: 2.6 })}
      <circle cx="50" cy="15" r="4.4" fill="none" stroke="${ropeDark}" stroke-width="2.6"/>

      <!-- two cords down past the pot, and the sling under it -->
      ${cord('M 47 18 C 36 24 25 32 26 48')}
      ${cord('M 53 18 C 64 24 75 32 74 48')}
      ${cord('M 26 48 V 62')}${cord('M 74 48 V 62')}
      ${cord('M 26 61 Q 50 74 74 61')}
      <circle cx="28" cy="35" r="2.8" fill="${rope}" stroke="${ropeDark}" stroke-width="1.4"/>
      <circle cx="72" cy="35" r="2.8" fill="${rope}" stroke="${ropeDark}" stroke-width="1.4"/>

      <!-- the pot -->
      ${litPath('M 32 46 h 36 l -5 20 h -26 z', '#e59a71', '#b06a45',
        { stroke: '#a5613f', sw: 3, join: 'round' })}
      ${litRect(29, 41, 42, 9, 4, '#f0b28f', '#c17c56', { stroke: '#a5613f', sw: 3 })}

      <!-- the crown, spilling over the rim on both sides -->
      ${crown(34, 39, -62, 0.8, '#7fcd9c', '#4f9b6d')}
      ${crown(66, 39, 62, 0.8, '#7fcd9c', '#4f9b6d')}
      ${crown(39, 34, -30, 0.92, '#93d8ae', '#5aa97d')}
      ${crown(61, 34, 30, 0.92, '#8fd3a8', '#5aa97d')}
      ${crown(50, 31, 0, 1, '#a3dcb8', '#69b98c')}

      <!-- stems that trail, with leaves the whole way down -->
      <path d="M 36 44 C 27 54 29 70 24 88" fill="none" stroke="#4f9b6d"
            stroke-width="3" stroke-linecap="round"/>
      ${sprig(29, 54, -34)}${sprig(27, 65, 30)}${sprig(29, 76, -30)}${sprig(25, 86, 24)}
      <path d="M 64 44 C 73 54 71 70 76 86" fill="none" stroke="#4f9b6d"
            stroke-width="3" stroke-linecap="round"/>
      ${sprig(71, 54, 34)}${sprig(73, 65, -30)}${sprig(71, 76, 30)}${sprig(75, 84, -24)}
      <path d="M 48 64 C 51 74 46 82 49 93" fill="none" stroke="#4f9b6d"
            stroke-width="2.8" stroke-linecap="round"/>
      ${sprig(52, 72, 34)}${sprig(46, 82, -30)}${sprig(50, 92, 20)}`);
  },

  /* ---------- In the water ----------

     Everything down here is drawn slightly softer than the things on dry
     land — thinner outlines, a little of the water's own blue mixed into
     the shadow side — because that is what water does to what is in it. A
     crisp black-edged rock at the bottom of a pond looks like a sticker
     on the glass. */

  pond_reeds: () => {
    const stalk = (x, lean, h, light, dark) =>
      `<path d="M ${x} 96 q ${lean * 0.4} ${-h * 0.55} ${lean} ${-h}"
             fill="none" stroke="${dark}" stroke-width="5.4" stroke-linecap="round"/>
       <path d="M ${x} 96 q ${lean * 0.4} ${-h * 0.55} ${lean} ${-h}"
             fill="none" stroke="${light}" stroke-width="2.6" stroke-linecap="round"
             opacity=".75"/>`;
    return `
      ${stalk(22, 6, 62, '#a9d8a0', '#4e8a52')}
      ${stalk(36, -5, 72, '#bce3ae', '#5b9a5c')}
      ${stalk(50, 8, 70, '#a9d8a0', '#4e8a52')}
      ${stalk(64, -7, 78, '#c6e8b8', '#66a566')}
      ${stalk(78, 5, 58, '#a9d8a0', '#4e8a52')}
      ${/* The cattail heads sit on the tips of two of the stalks. Worked
            out from the same curve the stalk is drawn with rather than
            typed in by eye, which is how they ended up floating beside
            them in the first place. */ ''}
      ${[[36, -5, 72], [64, -7, 78]].map(([x, lean, h]) => {
        const tx = x + lean, ty = 96 - h;
        return litEllipse(tx, ty + 2, 5, 11, '#b08a52', '#7d5c31', { stroke: '#5f4522', sw: 2 }) +
          `<path d="M ${n2(tx)} ${n2(ty - 9)} v -6" stroke="#7d5c31" stroke-width="2.4"
                 stroke-linecap="round"/>`;
      }).join('')}`;
  },

  pond_lilies: () => {
    /* Seen from just under the surface, so the pads are ovals with a notch
       cut out and a pale rim of light along the top edge. */
    const pad = (cx, cy, r, rot, light, dark) => `
      <g transform="translate(${cx} ${cy}) rotate(${rot})">
        ${litPath(`M 0 0 m ${-r} 0 a ${r} ${r * 0.62} 0 1 1 ${r * 2} 0
                   a ${r} ${r * 0.62} 0 1 1 ${-r * 2} 0 Z`, light, dark,
          { stroke: '#3f7f4a', sw: 2, join: 'round' })}
        <path d="M 0 0 L ${r * 0.9} ${-r * 0.3}" stroke="#3f7f4a" stroke-width="2.4"/>
        <path d="M ${-r * 0.7} ${-r * 0.24} q ${r * 0.5} ${-r * 0.16} ${r * 1.2} 0"
              fill="none" stroke="#ffffff" stroke-opacity=".4" stroke-width="2.4"/>
      </g>`;
    return `
      ${pad(32, 34, 24, -8, '#8ed49a', '#4f9b63')}
      ${pad(70, 22, 19, 12, '#a6e0ae', '#5faa72')}
      ${pad(54, 62, 26, 4, '#7fcd92', '#46915c')}
      ${litEllipse(70, 54, 7, 7, '#fbc7dd', '#e58fb4', { stroke: '#c96e93', sw: 1.8 })}
      <circle cx="70" cy="54" r="2.6" fill="#f8e6a6"/>`;
  },

  pond_weed: () => {
    const frond = (x, lean, h, light, dark) => {
      let out = `<path d="M ${x} 98 q ${lean * 0.3} ${-h * 0.5} ${lean} ${-h}"
                       fill="none" stroke="${dark}" stroke-width="4"
                       stroke-linecap="round"/>`;
      for (let i = 1; i <= 4; i++) {
        const t = i / 5;
        const px = x + lean * t * t, py = 98 - h * t;
        const lx = px + (i % 2 ? 7 : -7);
        /* Lit, not flat: every leaf takes the same light as everything
           else in the app, which is what the depth suite checks. */
        out += `<g transform="rotate(${i % 2 ? -22 : 22} ${n(px)} ${n(py)})">
                  ${litEllipse(lx, py, 7, 4, light, dark, { stroke: dark, sw: 1.6 })}
                </g>`;
      }
      return out;
    };
    return `${frond(26, 10, 66, '#8fd0a8', '#417f5c')}
            ${frond(52, -8, 84, '#a3dcb8', '#4f9b6d')}
            ${frond(76, 9, 58, '#8fd0a8', '#417f5c')}`;
  },

  pond_grass: () => {
    /* Filled ribbons rather than two strokes on top of each other: a
       stroke cannot take a gradient across its width, so a stroked blade
       is a flat blade however many times it is drawn. */
    const ribbon = (x, sway, h, light, dark) => {
      const w = 4.6;
      const top = 99 - h;
      return litPath(
        `M ${n(x - w)} 99
         C ${n(x + sway - w)} ${n(99 - h * 0.4)} ${n(x - sway - w * 0.4)} ${n(99 - h * 0.7)}
           ${n(x + sway * 0.6 - 1.2)} ${n(top)}
         L ${n(x + sway * 0.6 + 1.2)} ${n(top)}
         C ${n(x - sway + w * 0.4)} ${n(99 - h * 0.7)} ${n(x + sway + w)} ${n(99 - h * 0.4)}
           ${n(x + w)} 99 Z`,
        light, dark, { stroke: dark, sw: 1.8, join: 'round' });
    };
    return `${ribbon(20, 12, 70, '#bde8a8', '#5f9b4a')}
            ${ribbon(38, -14, 88, '#cdefb8', '#6da855')}
            ${ribbon(58, 13, 76, '#bde8a8', '#5f9b4a')}
            ${ribbon(78, -11, 62, '#cdefb8', '#6da855')}`;
  },

  pond_log: () => `
    ${litPath('M 6 74 Q 20 58 46 60 Q 74 62 94 52 L 96 74 Q 70 84 42 80 Q 18 77 6 88 Z',
      '#a9835c', '#6f5133', { stroke: '#4e3a25', sw: 2.4, join: 'round' })}
    ${litEllipse(8, 81, 7, 11, '#c49a6d', '#8a6a44', { stroke: '#4e3a25', sw: 2.2 })}
    ${litEllipse(8, 81, 3.4, 5.4, '#8a6a44', '#63492c')}
    <path d="M 26 72 Q 54 76 88 64" fill="none" stroke="#4e3a25" stroke-width="1.8"
          opacity=".45"/>
    <path d="M 22 66 Q 52 70 90 58" fill="none" stroke="#c9a67e" stroke-width="1.6"
          opacity=".5"/>
    ${[[34, 58, 7], [62, 56, 5]].map(([x, y, r]) =>
      litEllipse(x, y, r, r * 0.6, '#8fd0a8', '#4f9b6d', { stroke: '#3f7f4a', sw: 1.4 })).join('')}`,

  pond_rock: () => `
    ${litPath('M 8 92 Q 12 52 34 34 Q 56 18 74 34 Q 94 52 94 92 Z', '#b9c2c6', '#78848b',
      { stroke: '#56636a', sw: 2.4, join: 'round' })}
    <path d="M 34 36 Q 48 56 42 92" fill="none" stroke="#56636a" stroke-width="2"
          opacity=".4"/>
    <path d="M 70 40 Q 64 62 74 92" fill="none" stroke="#56636a" stroke-width="1.7"
          opacity=".3"/>
    <path d="M 26 62 Q 38 42 54 32" fill="none" stroke="#ffffff" stroke-width="4"
          opacity=".26" stroke-linecap="round"/>
    ${[[24, 84, 8], [78, 78, 6]].map(([x, y, r]) =>
      litEllipse(x, y, r, r * 0.55, '#7fc79a', '#468a5c', { stroke: '#3a7550', sw: 1.4 })).join('')}`,

  pond_arch: () => `
    ${litPath('M 10 96 L 10 52 A 40 40 0 0 1 90 52 L 90 96 L 70 96 L 70 54 A 20 20 0 0 0 30 54 L 30 96 Z',
      '#c3cbcf', '#7d888f', { stroke: '#5a666d', sw: 2.4, join: 'round' })}
    ${[[20, 40], [20, 62], [20, 84], [80, 40], [80, 62], [80, 84]].map(([x, y]) =>
      `<path d="M ${x - 9} ${y} h 18" stroke="#5a666d" stroke-width="1.6" opacity=".35"/>`).join('')}
    <path d="M 16 74 Q 18 48 38 34" fill="none" stroke="#ffffff" stroke-width="4"
          opacity=".24" stroke-linecap="round"/>
    ${litEllipse(84, 92, 8, 5, '#7fc79a', '#468a5c', { stroke: '#3a7550', sw: 1.4 })}`,

  pond_fish: () => {
    const fish = (cx, cy, s, light, dark) => `
      <g transform="translate(${cx} ${cy}) scale(${s})">
        <path d="M 16 0 L 32 -13 L 30 13 Z" fill="${dark}" opacity=".9"/>
        ${litPath('M 16 0 C 10 -16 -18 -16 -24 0 C -18 16 10 16 16 0 Z', light, dark,
          { stroke: '#c0641f', sw: 2, join: 'round' })}
        <path d="M -2 -11 L 4 -19 L 10 -9 Z" fill="${dark}" opacity=".85"/>
        <circle cx="-15" cy="-3" r="3.4" fill="#3b2f26"/>
        <circle cx="-16.2" cy="-4.2" r="1.2" fill="#fff" opacity=".9"/>
      </g>`;
    return `${fish(40, 34, 0.95, '#fbb45e', '#e07f22')}
            ${fish(66, 62, 0.7, '#fdc987', '#e89a44')}
            ${fish(26, 74, 0.55, '#fbb45e', '#e07f22')}`;
  },

  pond_tadpoles: () => {
    const tad = (cx, cy, s, rot) => `
      <g transform="translate(${cx} ${cy}) rotate(${rot}) scale(${s})">
        <path d="M 6 0 Q 20 -9 26 -2 Q 18 0 26 8 Q 18 9 6 2 Z" fill="#4a4034" opacity=".85"/>
        ${litEllipse(0, 0, 13, 10, '#6d6151', '#3f372c', { stroke: '#2f2820', sw: 1.6 })}
        <circle cx="-5" cy="-3" r="2.6" fill="#1f1a15"/>
        <circle cx="-6" cy="-4" r="1" fill="#fff" opacity=".8"/>
      </g>`;
    return `${tad(34, 30, 0.9, -12)}${tad(62, 50, 0.75, 14)}
            ${tad(40, 70, 0.65, 6)}${tad(74, 24, 0.55, -20)}`;
  },

  pond_snail: () => {
    /* A spiral drawn as one shrinking arc chain rather than a path with a
       clever formula: three half-turns is all the eye needs, and it is the
       only way it stays readable at the size this actually appears. */
    const cx = 46, cy = 62, r = 24;
    let spiral = `M ${cx + r} ${cy}`;
    for (let i = 0; i < 5; i++) {
      const rr = r * (1 - i * 0.18), sweep = i % 2 ? -1 : -1;
      const nx = cx + (i % 2 ? rr : -rr) * (i % 2 ? 1 : 1) * (i % 2 ? 1 : 1);
      spiral += ` A ${n(rr)} ${n(rr)} 0 0 ${sweep < 0 ? 0 : 1} ${n(cx + (i % 2 ? rr * 0.82 : -rr))} ${n(cy)}`;
    }
    return `
      <!-- the foot it glides on -->
      ${litPath('M 18 88 Q 22 78 38 78 L 78 78 Q 88 78 86 86 Q 80 92 60 92 L 28 92 Q 18 92 18 88 Z',
        '#f2dcb4', '#c9ab78', { stroke: '#8c7443', sw: 2, join: 'round' })}
      <!-- head and eyestalks -->
      <path d="M 80 80 q 5 -12 2 -20" fill="none" stroke="#c9ab78" stroke-width="3.4"
            stroke-linecap="round"/>
      <path d="M 86 80 q 8 -9 8 -17" fill="none" stroke="#c9ab78" stroke-width="3.4"
            stroke-linecap="round"/>
      <circle cx="82" cy="58" r="3.2" fill="#4a3b2a"/>
      <circle cx="94" cy="62" r="3.2" fill="#4a3b2a"/>
      <!-- the shell, and its spiral -->
      ${litEllipse(cx, cy, r, r, '#f0c88a', '#b9854a', { stroke: '#8c6a32', sw: 2.4 })}
      <path d="${spiral}" fill="none" stroke="#8c6a32" stroke-width="2.6"
            stroke-linecap="round" opacity=".85"/>
      <path d="M ${cx - 13} ${cy - 13} q 8 -7 17 -6" fill="none" stroke="#ffffff"
            stroke-opacity=".45" stroke-width="3.4" stroke-linecap="round"/>`;
  },

  map: () => `
    <path class="${SHADOW}" d="M 16 24.5 q 18 -6 36 0 q 18 6 36 0 v 56 q -18 6 -36 0 q -18 -6 -36 0 z" fill="#3a2c1e" opacity=".16"/>
    ${litPath('M 14 22 q 18 -6 36 0 q 18 6 36 0 v 56 q -18 6 -36 0 q -18 -6 -36 0 z', '#f8ecd2', '#dcc79f', { stroke: '#a5875f', sw: 3.5, join: 'round' })}
    <path d="M 24 60 q 12 -22 26 -10 q 14 12 26 -8" fill="none" stroke="#8a6340" stroke-width="2.5" stroke-dasharray="5 5"/>
    <path d="M 66 38 l 8 8 M 74 38 l -8 8" stroke="#d4594f" stroke-width="4" stroke-linecap="round"/>
    <path d="M 26 40 l 6 -8 6 8 z" fill="#8fb87c"/>`,

  fairy_lights: () => castShadow(shadeFills(`
    <path d="M 6 20 Q 50 44 94 20" fill="none" stroke="#8a7560" stroke-width="2.5"/>
    ${[...Array(7)].map((_, i) => {
      const t = i / 6, x = 6 + t * 88;
      const y = 20 + Math.sin(t * Math.PI) * 24;
      const c = ['#ffd980', '#f7a8c6', '#a8dcbb', '#a8c8f0'][i % 4];
      return `<path d="M ${n2(x)} ${n2(y)} v 5" stroke="#8a7560" stroke-width="2"/>
              <circle cx="${n2(x)}" cy="${n2(y + 10)}" r="6" fill="${c}" stroke="#c9a97c" stroke-width="1.6"/>
              <circle cx="${n2(x - 1.6)}" cy="${n2(y + 8)}" r="2" fill="#fff" opacity=".8"/>`;
    }).join('')}`)),

  /* All strokes and no fills, so there is nothing for shadeFills to take
     hold of: a band gets its roundness from a darker line down its inner
     edge and a lighter one down its outer, drawn by hand. */
  rainbow_arch: () => castShadow(`
    ${['#e2564f', '#f2954f', '#f6c453', '#7fc99a', '#6fb3d9', '#a78bc9'].map((c, i) => {
      const r = 36 - i * 6, x = 14 + i * 6, w = 72 - i * 12;
      const band = (rr, xx, ww, sw, stroke, op) =>
        `<path d="M ${xx} 78 a ${rr} ${rr} 0 0 1 ${ww} 0" fill="none"
               stroke="${stroke}" stroke-width="${sw}" ${op ? `opacity="${op}"` : ''}/>`;
      return band(r, x, w, 6, c) +
             band(r - 2, x + 2, w - 4, 1.8, '#000', '.16') +
             band(r + 1.8, x - 1.8, w + 3.6, 1.6, '#fff', '.34');
    }).join('')}
    ${litEllipse(14, 80, 11, 7, '#ffffff', '#dbe6f0', { stroke: '#c6d4e4', sw: 2.5 })}
    ${litEllipse(86, 80, 11, 7, '#ffffff', '#dbe6f0', { stroke: '#c6d4e4', sw: 2.5 })}`),

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
    ${/* A panel inside the frame, so it reads as a door rather than as a
          rectangle of night sky leaning on the wall. */ ''}
    ${litRect(26, 15, 48, 74, 4, '#4a5794', '#2f3a69', { stroke: '#333d66', sw: 2.6 })}
    <path d="M 26 52 h 48" stroke="#333d66" stroke-width="2.4" opacity=".7"/>
    <path d="M 64 20 a 13 13 0 1 0 0 20 a 10 10 0 1 1 0 -20 z"
          fill="#ffe9a8" stroke="#dcb95e" stroke-width="2" stroke-linejoin="round"/>
    ${[[38, 62, 8], [58, 70, 6.5], [44, 80, 5]].map(([x, y, r]) => {
      let d = '';
      for (let i = 0; i < 10; i++) {
        const a = (Math.PI / 5) * i - Math.PI / 2;
        const rr = i % 2 ? r * 0.44 : r;
        d += `${i ? 'L' : 'M'} ${n2(x + Math.cos(a) * rr)} ${n2(y + Math.sin(a) * rr)} `;
      }
      return `<path d="${d}Z" fill="#000" opacity=".2" transform="translate(1.4 1.6)"/>` +
             litPath(`${d}Z`, '#fff6d4', '#e8c976', { stroke: '#e0c274', sw: 1.6, join: 'round' });
    }).join('')}
    ${litEllipse(71, 54, 5.4, 5.4, '#ffe08a', '#c9922c', { stroke: '#a8762a', sw: 2 })}
    <circle cx="69.4" cy="52.4" r="1.8" fill="#fff" opacity=".8"/>`,

  /* ---- Special decorations ---- */
  /* These two are the same shape as a lamp and a rug in another colour.
     They used to get there by string-replacing the other drawing's hex
     codes, which broke silently the moment those drawings were reshaded:
     the blossom lamp kept a red shade with a pink outline on it, and the
     star rug stayed peach. Drawing them out costs a few lines and cannot
     come apart again. */
  blossom_lamp: () => `
    ${contact(50, 90, 20, 4.5, .26)}
    ${litRect(46, 54, 8, 34, 4, '#f2e2cc', '#c9ac8a', { stroke: '#a5875f', sw: 2.5 })}
    ${litPath('M 22 56 Q 50 16 78 56 Z', '#fbc4da', '#d885a8', { stroke: '#b3596e', sw: 3, join: 'round' })}
    <circle cx="38" cy="44" r="5" fill="#fff6e8" opacity=".9"/><circle cx="58" cy="38" r="6" fill="#fff6e8" opacity=".9"/>
    <circle cx="64" cy="50" r="4" fill="#fff6e8" opacity=".9"/>
    <path d="M 28 52 Q 37 43 46 40" fill="none" stroke="#fff" stroke-opacity=".34" stroke-width="4"/>
    ${litEllipse(50, 89, 18, 6, '#f2e2cc', '#c9ac8a', { stroke: '#a5875f', sw: 2.5 })}`,

  star_rug: () => `
    ${contact(50, 74, 45, 21, .18)}
    ${litEllipse(50, 72, 42, 19, '#bda5dd', '#9b81c0', { stroke: '#7a5f9c', sw: 3, cy: '30%' })}
    ${litEllipse(50, 72, 30, 13, '#ddcdee', '#bba9d4', { stroke: '#7a5f9c', sw: 2.5, cy: '30%' })}
    ${litEllipse(50, 72, 16, 7, '#bda5dd', '#9b81c0', { stroke: '#7a5f9c', sw: 2.5, cy: '30%' })}
    ${[[30, 66, 5], [62, 78, 4.4], [50, 62, 3.8], [70, 68, 3.4]].map(([x, y, r]) => {
      let d = '';
      for (let i = 0; i < 10; i++) {
        const a = (Math.PI / 5) * i - Math.PI / 2;
        const rr = i % 2 ? r * 0.44 : r;
        d += `${i ? 'L' : 'M'} ${n2(x + Math.cos(a) * rr)} ${n2(y + Math.sin(a) * rr * 0.6)} `;
      }
      return `<path d="${d}Z" fill="#ffe9a8" stroke="#d9b45e" stroke-width="1.4" stroke-linejoin="round"/>`;
    }).join('')}
    <path d="M 12 74 a 42 19 0 0 0 76 0" fill="none" stroke="#4d3a68" stroke-opacity=".16" stroke-width="3"/>`,
  /* Not the playset again. A castle built out of lettered blocks, which is
     what a WORD castle should be — and two drawings of the same thing in
     the same catalogue is how a shop ends up selling the same toy twice. */
  word_castle: () => {
    const block = (x, y, w, h, ch, light, dark) =>
      litRect(x, y, w, h, 3, light, dark, { stroke: '#9a7146', sw: 2.6 }) +
      `<text x="${n2(x + w / 2)}" y="${n2(y + h / 2 + h * 0.19)}" text-anchor="middle"
             font-family="system-ui, sans-serif" font-weight="700"
             font-size="${n2(Math.min(w, h) * 0.66)}" fill="#7a5836">${ch}</text>`;
    return `
      ${contact(50, 92, 36, 5, .26)}
      ${block(14, 50, 22, 22, 'A', '#f6c98a', '#d29a55')}
      ${block(64, 50, 22, 22, 'C', '#a8d4ef', '#6fa7cc')}
      ${block(36, 44, 28, 28, 'B', '#f7a8b8', '#d2768d')}
      ${block(14, 72, 22, 18, 'D', '#b9e0b0', '#7fb277')}
      ${block(36, 72, 28, 18, 'E', '#ffe08a', '#dcb95e')}
      ${block(64, 72, 22, 18, 'F', '#d3bdea', '#a58ccb')}
      ${litPath('M 36 44 v -7 h 6 v 4 h 7 v -4 h 7 v 4 h 8 v 7 z', '#f7a8b8', '#d2768d',
                { stroke: '#9a7146', sw: 2.4, join: 'round' })}
      <path d="M 50 37 v -13 l 13 5 -13 5" fill="#ef6f8e" stroke="#b34a66"
            stroke-width="2" stroke-linejoin="round"/>`;
  },
  cozy_candle: () => shadeFills(`
    <rect x="40" y="44" width="20" height="42" rx="5" fill="#fdf0d8" stroke="#c9a97c" stroke-width="3"/>
    <rect x="36" y="82" width="28" height="9" rx="4" fill="#e8d3ba" stroke="#a5875f" stroke-width="2.5"/>
    <path d="M 50 44 L 50 36" stroke="#8a7560" stroke-width="2.5"/>
    <path d="M 50 14 q 10 12 0 22 q -10 -10 0 -22 z" fill="#ffd980" stroke="#f0a93c" stroke-width="2"/>
    <path d="M 50 22 q 4 6 0 11 q -4 -5 0 -11 z" fill="#fff6e8"/>`) + contact(50, 95, 18, 3.4, .26),
  week_banner: () => castShadow(shadeFills(`
    <path d="M 10 22 Q 50 34 90 22" fill="none" stroke="#a5875f" stroke-width="3"/>
    ${[0,1,2,3,4].map(i => {
      const x = 18 + i * 16, y = 25 + Math.sin(i / 4 * Math.PI) * 5;
      const c = ['#ef7f7f','#f6c453','#8fd3a8','#6fb3d9','#c9a3e0'][i];
      return `<path d="M ${x - 7} ${y} L ${x + 7} ${y} L ${x} ${y + 20} Z" fill="${c}" stroke="#8a7560" stroke-width="2" stroke-linejoin="round"/>`;
    }).join('')}`)),
  sun_mobile: () => castShadow(shadeFills(`
    <path d="M 50 10 L 50 26" stroke="#a5875f" stroke-width="3" stroke-linecap="round"/>
    <circle cx="50" cy="46" r="18" fill="#ffd980" stroke="#e0a93c" stroke-width="3"/>
    ${[...Array(8)].map((_, i) => {
      const a = (i / 8) * Math.PI * 2;
      return `<path d="M ${n(50 + Math.cos(a) * 22)} ${n(46 + Math.sin(a) * 22)}
                       L ${n(50 + Math.cos(a) * 30)} ${n(46 + Math.sin(a) * 30)}"
                    stroke="#f6c453" stroke-width="4" stroke-linecap="round"/>`;
    }).join('')}
    <circle cx="44" cy="42" r="2.6" fill="#3a2e28"/><circle cx="56" cy="42" r="2.6" fill="#3a2e28"/>
    <path d="M 44 52 q 6 6 12 0" fill="none" stroke="#3a2e28" stroke-width="2.4" stroke-linecap="round"/>`)),
  ribbon_shelf: () => DECOR.bookshelf() + `
    <path d="M 50 20 l 8 -10 4 6 -6 6 z" fill="#ef6f8e"/>
    <path d="M 50 20 l -8 -10 -4 6 6 6 z" fill="#ef6f8e"/>
    <circle cx="50" cy="21" r="4" fill="#f78ba6" stroke="#b34a66" stroke-width="1.8"/>`,
  /* A cup with handles and a star on it, standing on a plinth, with a
     medal hanging either side. The first one was a yellow wedge between
     two coloured balls. */
  trophy_shelf: () => castShadow(shadeFills(`
    <rect x="12" y="66" width="76" height="8" rx="3" fill="#c99a6e" stroke="#8a6340" stroke-width="3"/>
    <path d="M 20 74 v 7 M 80 74 v 7" stroke="#8a6340" stroke-width="3" stroke-linecap="round"/>
    <path d="M 38 58 q -14 0 -13 -13 q 0 -5 5 -5 h 8" fill="none" stroke="#dcae44" stroke-width="3.4"/>
    <path d="M 62 58 q 14 0 13 -13 q 0 -5 -5 -5 h -8" fill="none" stroke="#dcae44" stroke-width="3.4"/>
    <path d="M 36 30 h 28 l -3 20 q -1 9 -11 9 q -10 0 -11 -9 z"
          fill="#f6c453" stroke="#c9922c" stroke-width="2.6" stroke-linejoin="round"/>
    <path d="M 40 33 q -1 14 2 21" fill="none" stroke="#fff6cf" stroke-width="3"
          stroke-linecap="round" opacity=".7"/>
    <path d="M 50 36 l 2.6 5.4 6 .8 -4.4 4.2 1.1 5.9 -5.3 -2.9 -5.3 2.9 1.1 -5.9 -4.4 -4.2 6 -.8 z"
          fill="#fff6cf" stroke="#c9922c" stroke-width="1.2" stroke-linejoin="round"/>
    <rect x="44" y="59" width="12" height="4" fill="#dcae44"/>
    <rect x="38" y="62" width="24" height="5" rx="2" fill="#c9922c" stroke="#a8762a" stroke-width="2"/>
    ${[[24, '#c9a3e0', '#8a6fa8'], [76, '#8fd3a8', '#4f9b6d']].map(([x, c, edge]) => `
      <path d="M ${x - 4} 48 l 4 9 l 4 -9" fill="none" stroke="#d94f5c" stroke-width="3"/>
      <circle cx="${x}" cy="61" r="6.4" fill="${c}" stroke="${edge}" stroke-width="2.5"/>
      <circle cx="${x - 1.6}" cy="59.4" r="2" fill="#fff" opacity=".55"/>`).join('')}`)),
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
  /* A weeping willow: a short leaning trunk, and curtains of leaf that
     fall from the outside of the crown. Drawn as filled shapes with wavy
     bottoms rather than as strands hanging off a dome, which is what made
     the first one look like a jellyfish. */
  tree_willow: () => {
    /* One curtain: a broad leaf-shape falling from (x, top) to (x2, end),
       with a scalloped bottom edge. */
    const curtain = (x, top, dx, end, w, light, dark) => {
      const bx = x + dx;
      let hem = '';
      for (let i = 0; i < 3; i++) {
        const a = bx - w + (2 * w * i) / 3, b = bx - w + (2 * w * (i + 1)) / 3;
        hem += `Q ${n2((a + b) / 2)} ${n2(end + 5)} ${n2(b)} ${n2(end)} `;
      }
      return litPath(
        `M ${n2(x - w * 0.7)} ${n2(top)} Q ${n2(bx - w * 1.05)} ${n2((top + end) / 2)} ${n2(bx - w)} ${n2(end)} ` +
        hem +
        `Q ${n2(bx + w * 1.05)} ${n2((top + end) / 2)} ${n2(x + w * 0.7)} ${n2(top)} Z`,
        light, dark, { stroke: '#4b8244', sw: 2.6, join: 'round' });
    };
    return `
      ${contact(50, 95, 30, 5, .3)}
      <path d="M 50 96 q -2 -22 -1 -42" fill="none" stroke="#9a7a52" stroke-width="11" stroke-linecap="round"/>
      <path d="M 47 92 q -2 -20 -1 -36" fill="none" stroke="#b8946a" stroke-opacity=".5" stroke-width="3"/>
      <path d="M 49 58 q -9 -7 -15 -14 M 49 53 q 9 -6 16 -12" fill="none" stroke="#9a7a52"
            stroke-width="5" stroke-linecap="round"/>
      ${curtain(30, 38, -6, 76, 10, '#7fbd6d', '#4b8244')}
      ${curtain(70, 38, 6, 74, 10, '#7fbd6d', '#4b8244')}
      ${curtain(40, 34, -4, 84, 11, '#8cc87a', '#548c4c')}
      ${curtain(60, 34, 4, 82, 11, '#8cc87a', '#548c4c')}
      ${litEllipse(50, 32, 26, 15, '#95d081', '#548c4c', { stroke: '#4b8244', sw: 3.6 })}
      ${litEllipse(33, 38, 15, 10, '#89c775', '#4b8244', { stroke: '#4b8244', sw: 3 })}
      ${litEllipse(67, 38, 15, 10, '#89c775', '#4b8244', { stroke: '#4b8244', sw: 3 })}
      <ellipse cx="42" cy="27" rx="12" ry="5.5" fill="#b4e3a2" opacity=".35"/>`;
  },


  /* ---- Water ----

     These read as rugs for a long time, and the reason is worth writing
     down: a pond drawn as a flat blue oval with some white dashes on it IS
     a rug. What makes water water is none of those things.

     It is that the water is BELOW the grass — so there is a lip of earth
     with a thickness to it, and the bank on the far side throws a shadow
     down onto the surface, and you can see through the near shallows to the
     bottom while the far side is a hole you cannot see into.

     And it is that the surface is doing something. A reflection of the sky
     lying across it, broken where it moves; rings spreading from where
     something touched it; a shine that slides. `pondWater` builds all of
     that once, and each pond puts its own things on top. */
  ...(() => {
    /* Its own ids, because two ponds on one page — and the shop shelf shows
       all three at once — would otherwise share a gradient, and in SVG the
       first one wins for everybody. */
    let seq = 0;

    const ripple = (x, y, r, op) =>
      `<ellipse cx="${n2(x)}" cy="${n2(y)}" rx="${n2(r)}" ry="${n2(r * 0.42)}"
                fill="none" stroke="#ffffff" stroke-opacity="${op}" stroke-width="1.5"/>`;

    /* The hole in the ground, filled. `deep` is the far water you cannot
       see into, `shallow` the near water you can. */
    const pondWater = ({ deep, shallow, floor, bank, bankDark, sky = '#dff2fb' }) => {
      const u = `pw${(++seq).toString(36)}`;
      return `
      ${contact(50, 84, 40, 7, .2)}

      <!-- The ground around it, and the lip of earth the grass sits on. The
           lip is what makes the water lower than everything else. -->
      ${litEllipse(50, 63, 45, 27, bank, bankDark, { stroke: bankDark, sw: 3.4, cy: '18%' })}
      <ellipse cx="50" cy="66" rx="39" ry="22.5" fill="#6b5236" opacity=".55"/>
      ${litEllipse(50, 64, 38.5, 22, '#8a6a46', '#5b432c', { cy: '16%', r: '90%' })}

      <!-- The water itself: dark at the far edge where it is a hole, and
           opening out towards the near edge where the bottom comes up. -->
      <defs>
        <radialGradient id="${u}" cx="50%" cy="86%" r="86%">
          <stop offset="0%"  stop-color="${shallow}"/>
          <stop offset="46%" stop-color="${deep}"/>
          <stop offset="100%" stop-color="${deep}"/>
        </radialGradient>
        <clipPath id="${u}c"><ellipse cx="50" cy="63" rx="36.5" ry="20.5"/></clipPath>
      </defs>
      <ellipse cx="50" cy="63" rx="36.5" ry="20.5" fill="url(#${u})"/>

      <g clip-path="url(#${u}c)">
        <!-- The far bank's shadow, lying on the water under the lip. -->
        <ellipse cx="50" cy="38" rx="42" ry="20" fill="#0d2233" opacity=".34"/>
        <!-- The near shallows: the bottom showing through, only where the
             water is thin enough to see it. Any stronger than this and it
             stops being a bottom under water and becomes a pale shape
             lying on top of it. -->
        <ellipse cx="50" cy="79" rx="27" ry="9.5" fill="${floor}" opacity=".32"/>
        <ellipse cx="50" cy="81.5" rx="19" ry="6" fill="${floor}" opacity=".26"/>
        <!-- Sky lying on the surface, broken into bands the way a reflection
             on moving water is. -->
        <g class="ia-shimmer" opacity=".4">
          <ellipse cx="42" cy="55" rx="19" ry="2.4" fill="${sky}"/>
          <ellipse cx="56" cy="60" rx="13" ry="1.8" fill="${sky}" opacity=".7"/>
          <ellipse cx="38" cy="65" rx="9.5" ry="1.4" fill="${sky}" opacity=".55"/>
          <ellipse cx="61" cy="69.5" rx="7" ry="1.2" fill="${sky}" opacity=".4"/>
        </g>
        <!-- Rings, spreading from somewhere over towards the right. -->
        <g class="ia-rings">
          ${ripple(63, 68, 6, .5)}${ripple(63, 68, 11, .3)}${ripple(63, 68, 16.5, .16)}
        </g>
      </g>

      <!-- The waterline: bright where the light hits the near edge, and a
           thin dark line at the far one where the bank goes in. -->
      <path d="M 14 66 a 36.5 20.5 0 0 0 72 0" fill="none"
            stroke="#ffffff" stroke-opacity=".4" stroke-width="2"/>
      <path d="M 14 61 a 36.5 20.5 0 0 1 72 0" fill="none"
            stroke="#12303f" stroke-opacity=".3" stroke-width="2"/>`;
    };

    /* Reeds on the far bank, because a perfect oval is the other half of
       why it looks like a rug. */
    const reeds = (x, y, tint = '#5f9e53') => [0, 1, 2].map(i => {
      const bx = x + (i - 1) * 4.6, h = 13 + (i % 2) * 5, lean = (i - 1) * 2.6;
      return `<path d="M ${n2(bx)} ${n2(y)} q ${n2(lean)} ${n2(-h * 0.6)} ${n2(lean * 1.7)} ${n2(-h)}"
                    fill="none" stroke="${tint}" stroke-width="2.4" stroke-linecap="round"/>
              <ellipse cx="${n2(bx + lean * 1.7)}" cy="${n2(y - h)}" rx="1.7" ry="3.4"
                       fill="#9a7a52" transform="rotate(${n2(lean * 4)} ${n2(bx + lean * 1.7)} ${n2(y - h)})"/>`;
    }).join('');

    /* A stone or two on the rim, sitting half in the water. A function, not
       a constant: built once it would bake three gradient ids into every
       copy of the drawing, and two copies of an id in one page is how a
       drawing ends up wearing another drawing's colours. */
    const stones = () => [[19, 70, 5.4], [80, 67, 4.4], [30, 78, 3.6]].map(([x, y, r]) =>
      litEllipse(x, y, r, r * 0.66, '#cbc3b6', '#8b8275', { stroke: '#7d7468', sw: 1.6 })).join('');

    return {
      pond_small: () => `
        ${pondWater({ deep: '#2c6f8c', shallow: '#7cc6dc', floor: '#c8b489',
                      bank: '#98aa80', bankDark: '#6d7f5a' })}
        ${reeds(24, 52)}${reeds(74, 50, '#6fae5f')}
        ${stones()}`,

      pond_lily: () => `
        ${pondWater({ deep: '#1f6b5e', shallow: '#6fc7b4', floor: '#b3a878',
                      bank: '#98aa80', bankDark: '#6d7f5a', sky: '#d8f4ec' })}
        ${[[34, 60, 11], [63, 67, 9], [53, 52, 8]].map(([x, y, r]) =>
          `<ellipse cx="${n2(x + 1)}" cy="${n2(y + 1.8)}" rx="${r}" ry="${n2(r * 0.62)}" fill="#0d3a33" opacity=".3"/>` +
          `<path d="M ${x} ${y} m ${-r} 0 a ${r} ${n2(r * 0.62)} 0 1 1 ${r * 2} 0 a ${r} ${n2(r * 0.62)} 0 1 1 ${-r * 2} 0 z"
                 fill="#5aa05f" stroke="#3f7a46" stroke-width="2.4"/>` +
          `<path d="M ${n2(x - r * 0.7)} ${n2(y - r * 0.2)} a ${n2(r * 0.8)} ${n2(r * 0.4)} 0 0 1 ${n2(r * 0.9)} ${n2(-r * 0.22)}"
                 fill="none" stroke="#fff" stroke-opacity=".32" stroke-width="2"/>`).join('')}
        ${litEllipse(63, 64, 4.8, 4.8, '#ffd3e2', '#e79ab8', { stroke: '#dd91ad', sw: 1.8 })}
        <circle cx="63" cy="64" r="1.9" fill="#fff3c9"/>
        ${reeds(22, 54)}`,

      pond_stars: () => `
        ${pondWater({ deep: '#141c3f', shallow: '#3f4d8a', floor: '#2a3566',
                      bank: '#78805f', bankDark: '#545c44', sky: '#aab6ee' })}
        ${[[34, 55, 3.6], [58, 52, 2.5], [46, 67, 2.9], [69, 64, 2.2], [26, 63, 2]].map(([x, y, r]) => {
          let d = '';
          for (let i = 0; i < 10; i++) {
            const a = (Math.PI / 5) * i - Math.PI / 2;
            const rr = i % 2 ? r * 0.42 : r;
            d += `${i ? 'L' : 'M'} ${n2(x + Math.cos(a) * rr)} ${n2(y + Math.sin(a) * rr * 0.72)} `;
          }
          return `<path class="ia-twinkle" d="${d}Z" fill="#fdf3cf"
                        style="animation-delay:${n2((x + y) % 4)}s"/>`;
        }).join('')}
        ${litEllipse(70, 50, 7, 6.6, '#fff8dd', '#e8d9a0', { stroke: '#cbbd86', sw: 1.4 })}
        ${reeds(23, 53, '#5c6a52')}`,
    };
  })(),

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

  /* Set INTO the grass rather than lying on top of it: each stone gets a
     rim of turf pushed up around its lower edge, which is the difference
     between a path and three grey ovals floating in the air. */
  stepping_stones: () => `
    ${[[22, 82, 20, 9], [50, 70, 19, 8.6], [76, 58, 17, 8]].map(([x, y, rx, ry]) =>
      contact(x, n2(y + ry * 0.55), n2(rx * 1.16), n2(ry * 0.9), .3) +
      `<ellipse cx="${x}" cy="${n2(y + ry * 0.3)}" rx="${n2(rx * 1.04)}" ry="${n2(ry * 1.05)}"
                fill="#6ea355" opacity=".55"/>` +
      litEllipse(x, y, rx, ry, '#e2dbcd', '#aaa192', { stroke: '#9a9182', sw: 4 }) +
      `<ellipse cx="${n2(x - rx * 0.2)}" cy="${n2(y - ry * 0.3)}" rx="${n2(rx * 0.5)}"
                ry="${n2(ry * 0.34)}" fill="#fdfbf6" opacity=".4"/>`).join('')}`,

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

  /* Indoors. Three little ones close together in a saucer — the garden's
     pair are big and standing in grass, and two items with the same name
     should not also be the same picture. */
  toadstool_cluster: () => `
    ${contact(50, 91, 26, 5, .26)}
    ${litEllipse(50, 88, 26, 7, '#f0e2cc', '#c7b294', { stroke: '#a89478', sw: 3 })}
    ${litRect(30, 62, 8, 24, 4, '#fdf5e8', '#d9c9ac', { stroke: '#c9b79c', sw: 2.6 })}
    ${litPath('M 14 64 a 20 15 0 0 1 40 0 z', '#f2867a', '#bd514a', { stroke: '#a83c33', sw: 3, join: 'round' })}
    <ellipse cx="24" cy="56" rx="4" ry="2.8" fill="#fff4ea"/><ellipse cx="38" cy="59" rx="3.4" ry="2.4" fill="#fff4ea"/>
    ${litRect(62, 58, 9, 28, 4.5, '#fdf5e8', '#d9c9ac', { stroke: '#c9b79c', sw: 2.8 })}
    ${litPath('M 44 60 a 23 17 0 0 1 46 0 z', '#ef7268', '#b8433a', { stroke: '#a83c33', sw: 3.2, join: 'round' })}
    <path d="M 48 58 a 21 15 0 0 1 14 -14" fill="none" stroke="#fff" stroke-opacity=".24" stroke-width="3.5"/>
    <ellipse cx="58" cy="50" rx="4.6" ry="3.2" fill="#fff4ea"/><ellipse cx="74" cy="52" rx="3.8" ry="2.6" fill="#fff4ea"/>
    <ellipse cx="66" cy="42" rx="3.2" ry="2.2" fill="#fff4ea"/>
    ${litRect(46, 74, 7, 14, 3.5, '#fdf5e8', '#d9c9ac', { stroke: '#c9b79c', sw: 2.4 })}
    ${litPath('M 36 76 a 14 10 0 0 1 28 0 z', '#f79a90', '#c96259', { stroke: '#a83c33', sw: 2.8, join: 'round' })}
    <ellipse cx="44" cy="72" rx="3" ry="2.1" fill="#fff4ea"/><ellipse cx="55" cy="73" rx="2.6" ry="1.8" fill="#fff4ea"/>`,

  /* A bench has to stand on the grass, and the first one did not: its legs
     were two thin grey pipes that stopped in mid-air, so it hovered over
     the lawn like a shelf. Now it has proper wooden legs that reach the
     ground, a shadow under each foot, and arms. */
  garden_bench: () => `
    ${contact(50, 95, 40, 5, .28)}
    <path d="M 20 94 v -26 M 80 94 v -26" stroke="#7d5a3a" stroke-width="7" stroke-linecap="round"/>
    <path d="M 24 94 v -22 M 76 94 v -22" stroke="#8a6340" stroke-width="6" stroke-linecap="round"/>
    ${litRect(12, 44, 76, 9, 4, '#d9ab7c', '#a87f55', { stroke: '#8a6340', sw: 3 })}
    ${litRect(12, 56, 76, 9, 4, '#d9ab7c', '#a87f55', { stroke: '#8a6340', sw: 3 })}
    <path d="M 18 42 v 28 M 82 42 v 28" stroke="#7d5a3a" stroke-width="6" stroke-linecap="round"/>
    ${litRect(10, 68, 80, 11, 4, '#e0b489', '#a87f55', { stroke: '#8a6340', sw: 3.5 })}
    ${grain(14, 70, 72, 7, 8, 1, { color: '#8a6340', strength: .26, sw: 1.4 })}
    <path d="M 14 68 h 72" stroke="#fdebd6" stroke-opacity=".5" stroke-width="2.4"/>
    <path d="M 16 79 h 68" stroke="#7d5a3a" stroke-width="2.4" stroke-opacity=".7"/>
    ${contact(22, 95, 7, 2.6, .3)}${contact(78, 95, 7, 2.6, .3)}`,

  /* A lantern on a post, not a dark slab with a blob of light on it: a
     base plate it stands on, a slim column, a glazed box with bars, and a
     warm pool of light on the grass around its foot. */
  lamp_post: () => `
    ${contact(50, 95, 22, 5, .26)}
    <ellipse cx="50" cy="93" rx="26" ry="8" fill="#ffe9a8" opacity=".22"/>
    ${litEllipse(50, 92, 15, 5, '#4a545f', '#2b323a', { stroke: '#232930', sw: 3 })}
    ${litRect(45.5, 40, 9, 52, 3, '#5c6673', '#343b44', { stroke: '#2b323a', sw: 3 })}
    <path d="M 48 44 v 46" stroke="#8d98a5" stroke-opacity=".55" stroke-width="2.4" stroke-linecap="round"/>
    ${litRect(36, 46, 28, 5, 2.5, '#4a545f', '#2b323a', { stroke: '#232930', sw: 2.6 })}
    ${litPath('M 36 46 L 36 22 L 50 10 L 64 22 L 64 46 Z', '#fff4cf', '#f0d99a',
              { stroke: '#2b323a', sw: 3.4, join: 'round' })}
    <circle cx="50" cy="32" r="8" fill="#fff6d0" opacity=".95"/>
    <circle cx="50" cy="32" r="13" fill="#ffe9a8" opacity=".35"/>
    <path d="M 36 30 h 28 M 50 22 v 24" stroke="#2b323a" stroke-width="2.2" opacity=".65"/>
    <path d="M 50 10 L 50 5" stroke="#2b323a" stroke-width="3.4" stroke-linecap="round"/>
    <circle cx="50" cy="4" r="3" fill="#4a545f" stroke="#232930" stroke-width="2"/>`,
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

/** A wallpaper or flooring shown as a swatch, for the shop and the book. */
export function surfaceSwatch(itemId, { size = 92 } = {}) {
  const style = Object.entries(surfaceStyle(itemId))
    .map(([k, v]) => `${k.replace(/[A-Z]/g, m => '-' + m.toLowerCase())}:${v}`)
    .join(';');
  return `<div class="surface-swatch" style="width:${size}px;height:${size}px;${style}"></div>`;
}
