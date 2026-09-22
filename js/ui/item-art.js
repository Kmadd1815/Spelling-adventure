/* Item artwork.

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
export const SURFACES = {
  /* ---- Wallpaper ---- */
  wall_plain: {
    backgroundColor: '#f6e7d2',
    backgroundImage: 'linear-gradient(180deg, #fdf3e4, #f6e7d2)',
  },
  wall_stripes: {
    backgroundColor: '#d3ebdd',
    backgroundImage: 'repeating-linear-gradient(90deg, #e6f4ec 0 16px, #d3ebdd 16px 32px)',
  },
  wall_dots: {
    backgroundColor: '#fbe4ec',
    backgroundImage: 'radial-gradient(#f3adc6 22%, transparent 24%), radial-gradient(#f3adc6 22%, transparent 24%)',
    backgroundSize: '28px 28px, 28px 28px',
    backgroundPosition: '0 0, 14px 14px',
  },
  wall_stars: {
    backgroundColor: '#3f4a78',
    backgroundImage: 'radial-gradient(#fff3cc 14%, transparent 16%), radial-gradient(#ffe9a8 10%, transparent 12%)',
    backgroundSize: '46px 46px, 62px 62px',
    backgroundPosition: '0 0, 28px 24px',
  },
  wall_flowers: {
    backgroundColor: '#eef7e8',
    backgroundImage: 'radial-gradient(#f6a8c0 16%, transparent 18%), radial-gradient(#ffd980 12%, transparent 14%), radial-gradient(#9dd3ab 10%, transparent 12%)',
    backgroundSize: '54px 54px, 54px 54px, 38px 38px',
    backgroundPosition: '0 0, 27px 27px, 14px 34px',
  },

  wall_clouds: {
    backgroundColor: '#cfe6f5',
    backgroundImage: 'radial-gradient(circle at 30% 60%, #fff 18%, transparent 20%), radial-gradient(circle at 55% 45%, #fff 22%, transparent 24%), radial-gradient(circle at 75% 62%, #fff 16%, transparent 18%)',
    backgroundSize: '120px 80px, 120px 80px, 120px 80px',
  },
  wall_rainbow: {
    backgroundColor: '#fdf3e4',
    backgroundImage: 'repeating-linear-gradient(90deg, #f6b0b0 0 18px, #f8cf9a 18px 36px, #f7e7a0 36px 54px, #b6e0b0 54px 72px, #a8cfef 72px 90px, #cbb4e4 90px 108px)',
  },
  wall_books: {
    backgroundColor: '#c9a87c',
    backgroundImage: 'repeating-linear-gradient(90deg, #d4594f 0 11px, #4f7fa8 11px 20px, #d8a648 20px 31px, #5f8f66 31px 39px, #9a6bb0 39px 50px, transparent 50px 56px), repeating-linear-gradient(180deg, transparent 0 54px, #8a6340 54px 62px)',
  },
  wall_ocean: {
    backgroundColor: '#2f6f96',
    backgroundImage: 'repeating-linear-gradient(180deg, rgba(255,255,255,.14) 0 3px, transparent 3px 26px), radial-gradient(circle at 22% 30%, rgba(255,255,255,.35) 5%, transparent 7%), radial-gradient(circle at 70% 60%, rgba(255,255,255,.28) 4%, transparent 6%)',
    backgroundSize: 'auto, 90px 90px, 70px 70px',
  },

  /* ---- Flooring ---- */
  floor_wood: {
    backgroundColor: '#d9b183',
    backgroundImage: 'repeating-linear-gradient(90deg, rgba(150,105,60,.30) 0 2px, transparent 2px 58px), repeating-linear-gradient(180deg, rgba(150,105,60,.16) 0 2px, transparent 2px 30px)',
  },
  floor_tile: {
    backgroundColor: '#f2ece2',
    backgroundImage: 'repeating-conic-gradient(#e0d2bd 0% 25%, #f7f2e8 0% 50%)',
    backgroundSize: '44px 44px',
  },
  floor_grass: {
    backgroundColor: '#9fd08a',
    backgroundImage: 'repeating-linear-gradient(105deg, rgba(90,150,80,.30) 0 3px, transparent 3px 11px)',
  },
  floor_stone: {
    backgroundColor: '#cfc9c0',
    backgroundImage: 'radial-gradient(#bdb5aa 30%, transparent 32%), radial-gradient(#c9c2b8 26%, transparent 28%)',
    backgroundSize: '52px 38px, 44px 32px',
    backgroundPosition: '0 0, 26px 19px',
  },
  floor_pond: {
    backgroundColor: '#8ecfe6',
    backgroundImage: 'repeating-linear-gradient(100deg, rgba(255,255,255,.40) 0 4px, transparent 4px 16px), linear-gradient(180deg, rgba(255,255,255,.35), transparent)',
  },
  floor_moss: {
    backgroundColor: '#8fbf7a',
    backgroundImage: 'radial-gradient(#79ad64 24%, transparent 26%), radial-gradient(#a4cf90 20%, transparent 22%)',
    backgroundSize: '34px 34px, 26px 26px',
    backgroundPosition: '0 0, 17px 13px',
  },
  floor_sand: {
    backgroundColor: '#eed9ab',
    backgroundImage: 'repeating-linear-gradient(92deg, rgba(200,170,120,.34) 0 2px, transparent 2px 13px), radial-gradient(rgba(190,158,108,.4) 18%, transparent 20%)',
    backgroundSize: 'auto, 18px 18px',
  },
  floor_marble: {
    backgroundColor: '#eceaf0',
    backgroundImage: 'repeating-linear-gradient(56deg, rgba(150,148,165,.26) 0 2px, transparent 2px 9px, rgba(150,148,165,.14) 9px 10px, transparent 10px 44px)',
  },
  floor_petals: {
    backgroundColor: '#f6d6de',
    backgroundImage: 'radial-gradient(ellipse 60% 40% at 30% 40%, #f5aec0 40%, transparent 42%), radial-gradient(ellipse 50% 35% at 70% 70%, #fbc6d3 40%, transparent 42%)',
    backgroundSize: '46px 40px, 38px 34px',
  },
};

export const surfaceStyle = id => SURFACES[id] || SURFACES.wall_plain;

/* =========================== DECORATIONS ===========================
   Each draws inside a 0 0 100 100 box, standing on y = 92. */

const DECOR = {
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
    <ellipse cx="50" cy="88" rx="22" ry="6" fill="#d9cbb6" opacity=".7"/>
    <path d="M 40 56 Q 38 78 36 88 L 64 88 Q 62 78 60 56 Z"
          fill="#f6ece0" stroke="#b9a68f" stroke-width="3" stroke-linejoin="round"/>
    <path d="M 12 58 Q 14 22 50 22 Q 86 22 88 58 Q 68 66 50 66 Q 32 66 12 58 Z"
          fill="#ef7f7f" stroke="#b34d4d" stroke-width="3.4" stroke-linejoin="round"/>
    <ellipse cx="32" cy="40" rx="8" ry="6.4" fill="#fff6e8"/>
    <ellipse cx="60" cy="34" rx="6.4" ry="5" fill="#fff6e8"/>
    <ellipse cx="72" cy="48" rx="5.4" ry="4.4" fill="#fff6e8"/>
    <ellipse cx="46" cy="52" rx="5" ry="4" fill="#fff6e8"/>`,

  pebbles: () => `
    <ellipse cx="38" cy="78" rx="20" ry="13" fill="#b9aca0" stroke="#8a7f74" stroke-width="2.5"/>
    <ellipse cx="62" cy="83" rx="16" ry="10" fill="#cdc2b6" stroke="#8a7f74" stroke-width="2.5"/>
    <ellipse cx="50" cy="68" rx="12" ry="8"  fill="#dcd3c8" stroke="#8a7f74" stroke-width="2.5"/>`,

  toy_ball: () => `
    <circle cx="50" cy="66" r="26" fill="#6fb3d9" stroke="#3f7d9e" stroke-width="3"/>
    <path d="M 24 66 Q 50 50 76 66" fill="none" stroke="#fff6e8" stroke-width="5"/>
    <path d="M 24 66 Q 50 82 76 66" fill="none" stroke="#fff6e8" stroke-width="5"/>
    <circle cx="41" cy="56" r="5" fill="#fff" opacity=".6"/>`,

  potted_plant: () => `
    <path d="M 50 62 Q 30 46 26 24 Q 46 32 50 60 Z" fill="#7fc99a" stroke="#4f9b6d" stroke-width="2.5" stroke-linejoin="round"/>
    <path d="M 50 62 Q 70 44 76 22 Q 54 30 50 60 Z" fill="#8fd3a8" stroke="#4f9b6d" stroke-width="2.5" stroke-linejoin="round"/>
    <path d="M 50 64 Q 48 40 50 18" fill="none" stroke="#4f9b6d" stroke-width="3"/>
    <path d="M 32 62 L 68 62 L 63 90 L 37 90 Z" fill="#d98b62" stroke="#a5613f" stroke-width="3" stroke-linejoin="round"/>
    <rect x="30" y="57" width="40" height="10" rx="4" fill="#e8a17c" stroke="#a5613f" stroke-width="3"/>`,

  lamp: () => `
    <rect x="46" y="54" width="8" height="34" rx="4" fill="#e8d3ba" stroke="#a5875f" stroke-width="2.5"/>
    <path d="M 22 56 Q 50 16 78 56 Z" fill="#ef7f7f" stroke="#b34d4d" stroke-width="3" stroke-linejoin="round"/>
    <circle cx="38" cy="44" r="5" fill="#fff6e8"/><circle cx="58" cy="38" r="6" fill="#fff6e8"/>
    <circle cx="64" cy="50" r="4" fill="#fff6e8"/>
    <ellipse cx="50" cy="89" rx="18" ry="6" fill="#e8d3ba" stroke="#a5875f" stroke-width="2.5"/>`,

  teddy: () => `
    <circle cx="30" cy="40" r="10" fill="#c9a887" stroke="#8a6f54" stroke-width="2.5"/>
    <circle cx="70" cy="40" r="10" fill="#c9a887" stroke="#8a6f54" stroke-width="2.5"/>
    <ellipse cx="50" cy="70" rx="24" ry="22" fill="#c9a887" stroke="#8a6f54" stroke-width="3"/>
    <ellipse cx="50" cy="74" rx="14" ry="13" fill="#f0e2cf"/>
    <circle cx="50" cy="42" r="21" fill="#d4b593" stroke="#8a6f54" stroke-width="3"/>
    <ellipse cx="50" cy="48" rx="9" ry="7" fill="#f0e2cf"/>
    <circle cx="43" cy="38" r="3" fill="#3a2e28"/><circle cx="57" cy="38" r="3" fill="#3a2e28"/>
    <ellipse cx="50" cy="46" rx="3.4" ry="2.6" fill="#5a4033"/>`,

  rug: () => `
    <ellipse cx="50" cy="72" rx="42" ry="19" fill="#e8a17c" stroke="#a5613f" stroke-width="3"/>
    <ellipse cx="50" cy="72" rx="30" ry="13" fill="#f4c9a8" stroke="#a5613f" stroke-width="2.5"/>
    <ellipse cx="50" cy="72" rx="16" ry="7"  fill="#e8a17c" stroke="#a5613f" stroke-width="2.5"/>`,

  bookshelf: () => `
    <rect x="18" y="26" width="64" height="64" rx="5" fill="#c99a6e" stroke="#8a6340" stroke-width="3"/>
    <rect x="24" y="54" width="52" height="5" fill="#8a6340"/>
    <rect x="28" y="32" width="8"  height="20" rx="2" fill="#ef7f7f"/>
    <rect x="38" y="35" width="7"  height="17" rx="2" fill="#6fb3d9"/>
    <rect x="47" y="31" width="9"  height="21" rx="2" fill="#8fd3a8"/>
    <rect x="58" y="36" width="7"  height="16" rx="2" fill="#f6c453"/>
    <rect x="28" y="62" width="7"  height="20" rx="2" fill="#a78bc9"/>
    <rect x="37" y="66" width="9"  height="16" rx="2" fill="#f2849f"/>
    <rect x="48" y="61" width="8"  height="21" rx="2" fill="#6fb3d9"/>`,

  lantern: () => `
    <path d="M 50 8 L 50 20" stroke="#a5875f" stroke-width="3" stroke-linecap="round"/>
    <ellipse cx="50" cy="50" rx="26" ry="30" fill="#f4a8b8" stroke="#b3596e" stroke-width="3"/>
    <path d="M 50 20 L 50 80" stroke="#b3596e" stroke-width="2" opacity=".5"/>
    <path d="M 26 40 Q 50 34 74 40" fill="none" stroke="#b3596e" stroke-width="2" opacity=".5"/>
    <path d="M 26 60 Q 50 66 74 60" fill="none" stroke="#b3596e" stroke-width="2" opacity=".5"/>
    <rect x="40" y="16" width="20" height="7" rx="3" fill="#e8d3ba" stroke="#a5875f" stroke-width="2.5"/>
    <rect x="40" y="77" width="20" height="7" rx="3" fill="#e8d3ba" stroke="#a5875f" stroke-width="2.5"/>`,

  little_tree: () => `
    <rect x="44" y="58" width="12" height="32" rx="4" fill="#a5794f" stroke="#7a5836" stroke-width="2.5"/>
    <circle cx="50" cy="36" r="24" fill="#7fc99a" stroke="#4f9b6d" stroke-width="3"/>
    <circle cx="32" cy="48" r="15" fill="#8fd3a8" stroke="#4f9b6d" stroke-width="3"/>
    <circle cx="68" cy="48" r="15" fill="#8fd3a8" stroke="#4f9b6d" stroke-width="3"/>
    <circle cx="40" cy="30" r="4" fill="#f2849f"/><circle cx="60" cy="42" r="4" fill="#f2849f"/>
    <circle cx="56" cy="26" r="3.4" fill="#ffd980"/>`,

  fish_tank: () => `
    <rect x="12" y="26" width="76" height="56" rx="7" fill="#bfe6f5" stroke="#4d7f92" stroke-width="3.5"/>
    <rect x="12" y="66" width="76" height="16" rx="3" fill="#e8d3ba"/>
    <path d="M 12 66 h 76" stroke="#4d7f92" stroke-width="2.5"/>
    <path d="M 26 66 q 4 -18 10 -22 q 5 12 2 22 z" fill="#7fc99a"/>
    <path d="M 70 66 q -4 -14 -9 -18 q -4 10 -1 18 z" fill="#8fd3a8"/>
    <g><ellipse cx="42" cy="42" rx="9" ry="6" fill="#f7a94e"/>
       <path d="M 33 42 l -7 -5 v 10 z" fill="#f7a94e"/><circle cx="46" cy="40" r="1.6" fill="#3a2e28"/></g>
    <g><ellipse cx="66" cy="54" rx="7" ry="4.6" fill="#ef7f9f"/>
       <path d="M 73 54 l 6 -4 v 8 z" fill="#ef7f9f"/><circle cx="62" cy="53" r="1.4" fill="#3a2e28"/></g>
    <circle cx="56" cy="34" r="2.6" fill="#fff" opacity=".7"/>
    <circle cx="60" cy="28" r="1.8" fill="#fff" opacity=".7"/>`,

  castle: () => `
    <rect x="16" y="46" width="18" height="44" fill="#d9ccbb" stroke="#9a8b78" stroke-width="3"/>
    <rect x="66" y="46" width="18" height="44" fill="#d9ccbb" stroke="#9a8b78" stroke-width="3"/>
    <rect x="34" y="58" width="32" height="32" fill="#e8dccb" stroke="#9a8b78" stroke-width="3"/>
    <path d="M 16 46 v -8 h 5 v 5 h 4 v -5 h 4 v 5 h 5 v 8 z" fill="#d9ccbb" stroke="#9a8b78" stroke-width="2.5" stroke-linejoin="round"/>
    <path d="M 66 46 v -8 h 5 v 5 h 4 v -5 h 4 v 5 h 5 v 8 z" fill="#d9ccbb" stroke="#9a8b78" stroke-width="2.5" stroke-linejoin="round"/>
    <path d="M 34 58 v -6 h 5 v 4 h 6 v -4 h 6 v 4 h 6 v -4 h 5 v 6 z" fill="#e8dccb" stroke="#9a8b78" stroke-width="2.5" stroke-linejoin="round"/>
    <path d="M 42 90 v -18 a 8 8 0 0 1 16 0 v 18 z" fill="#a5794f" stroke="#7a5836" stroke-width="2.5"/>
    <path d="M 25 38 v -14 l 12 5 -12 5" fill="#ef6f8e" stroke="#b34a66" stroke-width="2" stroke-linejoin="round"/>
    <path d="M 75 38 v -14 l 12 5 -12 5" fill="#6fb3d9" stroke="#3f7d9e" stroke-width="2" stroke-linejoin="round"/>`,

  /* ---- Windows. Drawn against the wall, so they show sky. ---- */
  window_round: () => `
    <circle cx="50" cy="48" r="34" fill="#bfe6f5" stroke="#a5875f" stroke-width="7"/>
    <circle cx="50" cy="48" r="34" fill="none" stroke="#d9c4a5" stroke-width="3"/>
    <path d="M 50 14 v 68 M 16 48 h 68" stroke="#d9c4a5" stroke-width="5"/>
    <circle cx="38" cy="34" r="7" fill="#fff" opacity=".55"/>`,

  window_cottage: () => `
    <rect x="16" y="16" width="68" height="62" rx="4" fill="#bfe6f5" stroke="#a5875f" stroke-width="7"/>
    <path d="M 50 16 v 62 M 16 47 h 68" stroke="#d9c4a5" stroke-width="5"/>
    <rect x="10" y="76" width="80" height="8" rx="3" fill="#e8d3ba" stroke="#a5875f" stroke-width="3"/>
    <circle cx="33" cy="32" r="6" fill="#fff" opacity=".5"/>`,

  window_arch: () => `
    <path d="M 18 82 V 48 a 32 32 0 0 1 64 0 v 34 z" fill="#bfe6f5" stroke="#a5875f" stroke-width="7" stroke-linejoin="round"/>
    <path d="M 50 18 v 64 M 20 56 h 60" stroke="#d9c4a5" stroke-width="5"/>
    <circle cx="36" cy="38" r="6" fill="#fff" opacity=".5"/>`,

  /* ---- Doors. These stand on the floor line. ---- */
  door_wood: () => `
    <rect x="22" y="10" width="56" height="86" rx="4" fill="#c08f5c" stroke="#8a6340" stroke-width="5"/>
    <rect x="30" y="18" width="40" height="32" rx="3" fill="#cfa06e" stroke="#8a6340" stroke-width="3"/>
    <rect x="30" y="56" width="40" height="32" rx="3" fill="#cfa06e" stroke="#8a6340" stroke-width="3"/>
    <circle cx="68" cy="54" r="4.6" fill="#f6c453" stroke="#c9922c" stroke-width="2"/>`,

  door_round: () => `
    <path d="M 20 96 V 46 a 30 30 0 0 1 60 0 v 50 z" fill="#8fbf7f" stroke="#5d8a52" stroke-width="5" stroke-linejoin="round"/>
    <path d="M 50 20 v 76" stroke="#5d8a52" stroke-width="3" opacity=".6"/>
    <circle cx="50" cy="58" r="6" fill="#f6c453" stroke="#c9922c" stroke-width="2.5"/>`,

  door_fancy: () => `
    <rect x="20" y="8" width="60" height="88" rx="5" fill="#a78bc9" stroke="#6f5a94" stroke-width="5"/>
    <path d="M 50 14 l 18 18 -18 18 -18 -18 z" fill="#cdb8e4" stroke="#6f5a94" stroke-width="3" stroke-linejoin="round"/>
    <rect x="30" y="56" width="40" height="34" rx="3" fill="#cdb8e4" stroke="#6f5a94" stroke-width="3"/>
    <circle cx="69" cy="54" r="5" fill="#f6c453" stroke="#c9922c" stroke-width="2"/>`,

  /* ---- Beds ---- */
  bed_cushion: () => `
    <ellipse cx="50" cy="70" rx="40" ry="22" fill="#f2849f" stroke="#b3596e" stroke-width="3.5"/>
    <ellipse cx="50" cy="66" rx="29" ry="15" fill="#ffd6e2" stroke="#b3596e" stroke-width="2.5"/>
    <path d="M 24 62 q 26 -12 52 0" fill="none" stroke="#fff" stroke-width="3" opacity=".55"/>`,

  bed_cozy: () => `
    <rect x="8" y="46" width="84" height="34" rx="7" fill="#c99a6e" stroke="#8a6340" stroke-width="3.5"/>
    <rect x="8" y="34" width="20" height="46" rx="6" fill="#d9ab7c" stroke="#8a6340" stroke-width="3.5"/>
    <rect x="16" y="50" width="70" height="20" rx="6" fill="#bfe6f5" stroke="#6f9fb3" stroke-width="3"/>
    <ellipse cx="32" cy="52" rx="15" ry="9" fill="#fff6e8" stroke="#c9b8a4" stroke-width="2.5"/>
    <path d="M 52 54 q 16 4 32 0" fill="none" stroke="#8fc6db" stroke-width="3"/>`,

  bed_shell: () => `
    <path d="M 10 80 q 0 -46 40 -46 q 40 0 40 46 z" fill="#f7c8d8" stroke="#c07e96" stroke-width="3.5" stroke-linejoin="round"/>
    <path d="M 50 34 v 46 M 28 42 q 6 22 4 38 M 72 42 q -6 22 -4 38"
          fill="none" stroke="#e0a3b8" stroke-width="3"/>
    <ellipse cx="50" cy="80" rx="42" ry="9" fill="#ffe3ec" stroke="#c07e96" stroke-width="3"/>`,

  /* ---- Rugs ---- */
  rug_round: () => `
    <ellipse cx="50" cy="60" rx="44" ry="30" fill="#a8d5c4" stroke="#5f9683" stroke-width="3.5"/>
    <ellipse cx="50" cy="60" rx="31" ry="21" fill="#d6ece4" stroke="#5f9683" stroke-width="2.5"/>
    <ellipse cx="50" cy="60" rx="16" ry="11" fill="#a8d5c4" stroke="#5f9683" stroke-width="2.5"/>`,

  /* ---- Wall decorations ---- */
  frame: () => `
    <rect x="14" y="20" width="72" height="58" rx="4" fill="#c99a6e" stroke="#8a6340" stroke-width="5"/>
    <rect x="22" y="28" width="56" height="42" rx="2" fill="#bfe6f5"/>
    <path d="M 22 60 q 14 -18 26 -6 q 10 10 30 -4 v 20 h -56 z" fill="#8fd3a8"/>
    <circle cx="66" cy="38" r="6" fill="#ffd980"/>`,

  clock: () => `
    <circle cx="50" cy="50" r="34" fill="#fff6e8" stroke="#8a6340" stroke-width="5"/>
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
    <path d="M 38 62 V 48 a 7 7 0 0 1 14 0 v 14" fill="none" stroke="#6ba85e" stroke-width="11" stroke-linecap="round"/>
    <path d="M 62 62 V 54 a 7 7 0 0 0 -14 0" fill="none" stroke="#6ba85e" stroke-width="11" stroke-linecap="round"/>
    <rect x="41" y="20" width="18" height="46" rx="9" fill="#7cbd6b" stroke="#4f8a45" stroke-width="3"/>
    <g stroke="#3f7038" stroke-width="1.6" opacity=".7">
      <path d="M 45 30 h -4 M 55 38 h 4 M 45 46 h -4 M 55 54 h 4"/>
    </g>
    <circle cx="50" cy="19" r="5" fill="#f4a0c0"/>
    <path d="M 34 64 h 32 l -4 24 h -24 z" fill="#d98b62" stroke="#a5613f" stroke-width="3" stroke-linejoin="round"/>
    <rect x="32" y="59" width="36" height="9" rx="4" fill="#e8a17c" stroke="#a5613f" stroke-width="3"/>`,

  plant_succulent: () => {
    let r = '';
    for (let ring = 3; ring >= 1; ring--) {
      const n = ring * 4, len = 7 + ring * 7;
      for (let i = 0; i < n; i++) {
        const a = (i / n) * Math.PI * 2 + ring * 0.4;
        r += `<ellipse cx="${n2(50 + Math.cos(a) * len * 0.52)}" cy="${n2(46 + Math.sin(a) * len * 0.34)}"
                rx="${n2(len * 0.42)}" ry="${n2(len * 0.26)}"
                transform="rotate(${n2(a * 57.3)} ${n2(50 + Math.cos(a) * len * 0.52)} ${n2(46 + Math.sin(a) * len * 0.34)})"
                fill="${['#8fd3a8', '#a8dcbb', '#c3e8cf'][ring - 1]}" stroke="#5f9b73" stroke-width="2"/>`;
      }
    }
    return `<path d="M 34 60 h 32 l -4 28 h -24 z" fill="#c9a3e0" stroke="#8a6fa8" stroke-width="3" stroke-linejoin="round"/>
            <rect x="32" y="55" width="36" height="9" rx="4" fill="#d8b8ea" stroke="#8a6fa8" stroke-width="3"/>
            ${r}`;
  },

  plant_flowers: () => `
    <path d="M 50 62 V 30 M 38 62 V 40 M 62 62 V 44" fill="none" stroke="#5f9b5a" stroke-width="3.5" stroke-linecap="round"/>
    <path d="M 44 46 q -8 -4 -6 -10 q 8 1 6 10z M 56 50 q 8 -4 6 -10 q -8 1 -6 10z" fill="#7fc276"/>
    ${[[50, 26, '#f2849f'], [38, 36, '#ffd980'], [62, 40, '#a8c8f0']].map(([x, y, c]) =>
      [...Array(5)].map((_, i) => {
        const a = (i / 5) * Math.PI * 2;
        return `<ellipse cx="${n2(x + Math.cos(a) * 6)}" cy="${n2(y + Math.sin(a) * 6)}" rx="4.6" ry="4.6" fill="${c}"/>`;
      }).join('') + `<circle cx="${x}" cy="${y}" r="3.4" fill="#fff6e8"/>`).join('')}
    <path d="M 34 62 h 32 l -4 26 h -24 z" fill="#8fc6db" stroke="#4d7f92" stroke-width="3" stroke-linejoin="round"/>
    <rect x="32" y="57" width="36" height="9" rx="4" fill="#a9d8e8" stroke="#4d7f92" stroke-width="3"/>`,

  mushrooms: () => `
    <path d="M 36 88 V 68 a 5 5 0 0 1 10 0 v 20 z" fill="#fff3e4" stroke="#c9a97c" stroke-width="2.5"/>
    <path d="M 24 68 a 17 14 0 0 1 34 0 z" fill="#e2564f" stroke="#a83a35" stroke-width="3" stroke-linejoin="round"/>
    <circle cx="33" cy="61" r="3.4" fill="#fff"/><circle cx="46" cy="64" r="2.6" fill="#fff"/>
    <path d="M 62 88 V 76 a 4 4 0 0 1 8 0 v 12 z" fill="#fff3e4" stroke="#c9a97c" stroke-width="2.5"/>
    <path d="M 54 76 a 12 10 0 0 1 24 0 z" fill="#ef7f7f" stroke="#a83a35" stroke-width="3" stroke-linejoin="round"/>
    <circle cx="62" cy="71" r="2.4" fill="#fff"/><circle cx="71" cy="73" r="2" fill="#fff"/>`,

  plant_tall: () => `
    <rect x="36" y="64" width="28" height="26" rx="4" fill="#d9ab7c" stroke="#8a6340" stroke-width="3"/>
    <rect x="33" y="60" width="34" height="9" rx="4" fill="#e8c29a" stroke="#8a6340" stroke-width="3"/>
    <path d="M 50 64 V 20" stroke="#6ba85e" stroke-width="4" stroke-linecap="round"/>
    ${[[-1, 22, 26], [1, 30, 24], [-1, 40, 22], [1, 48, 19]].map(([side, y, len]) =>
      `<path d="M 50 ${y} q ${side * len * 0.7} ${-len * 0.5} ${side * len} ${-len * 0.1}
                q ${-side * len * 0.4} ${len * 0.55} ${-side * len} ${len * 0.1} z"
            fill="#7fc99a" stroke="#4f8a5c" stroke-width="2.5" stroke-linejoin="round"/>`).join('')}`,

  plant_big_leaf: () => `
    <path d="M 36 66 h 28 l -3 24 h -22 z" fill="#f2849f" stroke="#b3596e" stroke-width="3" stroke-linejoin="round"/>
    <rect x="33" y="61" width="34" height="9" rx="4" fill="#f7a8c0" stroke="#b3596e" stroke-width="3"/>
    ${[[-26, 44, -22, '#6bbf8c'], [26, 46, 22, '#8fd3a8'], [-14, 24, -8, '#7fc99a'], [16, 22, 10, '#a3dcb8']]
      .map(([dx, y, rot, fill]) => `
        <g transform="translate(${50 + dx} ${y}) rotate(${rot})">
          <path d="M 0 22 C -15 12 -15 -12 0 -20 C 15 -12 15 12 0 22 Z"
                fill="${fill}" stroke="#3d7f5a" stroke-width="2.6" stroke-linejoin="round"/>
          <path d="M 0 20 V -18" stroke="#3d7f5a" stroke-width="2"/>
        </g>`).join('')}
    <path d="M 50 64 V 40 M 50 54 l -10 -8 M 50 50 l 10 -10" stroke="#4f8a5c" stroke-width="2.6" stroke-linecap="round"/>`,

  plant_bonsai: () => `
    <path d="M 30 68 h 40 l -4 22 h -32 z" fill="#8a6f9c" stroke="#5f4a70" stroke-width="3" stroke-linejoin="round"/>
    <rect x="27" y="63" width="46" height="9" rx="4" fill="#a48ab5" stroke="#5f4a70" stroke-width="3"/>
    <path d="M 50 66 C 50 52 40 50 38 40" fill="none" stroke="#8a6340" stroke-width="7" stroke-linecap="round"/>
    <path d="M 50 58 C 54 50 62 50 64 44" fill="none" stroke="#8a6340" stroke-width="5" stroke-linecap="round"/>
    <ellipse cx="34" cy="34" rx="17" ry="11" fill="#6bbf8c" stroke="#3f8a5f" stroke-width="3"/>
    <ellipse cx="66" cy="38" rx="14" ry="9"  fill="#7fc99a" stroke="#3f8a5f" stroke-width="3"/>
    <ellipse cx="52" cy="24" rx="15" ry="10" fill="#8fd3a8" stroke="#3f8a5f" stroke-width="3"/>`,

  /* ================= More for the floor ================= */

  watering_can: () => `
    <rect x="30" y="50" width="34" height="34" rx="6" fill="#8fc6db" stroke="#4d7f92" stroke-width="3"/>
    <path d="M 64 58 l 18 -12 6 5 -16 14 z" fill="#a9d8e8" stroke="#4d7f92" stroke-width="3" stroke-linejoin="round"/>
    <path d="M 30 58 q -12 6 0 18" fill="none" stroke="#4d7f92" stroke-width="4" stroke-linecap="round"/>
    <rect x="34" y="44" width="26" height="8" rx="4" fill="#a9d8e8" stroke="#4d7f92" stroke-width="3"/>
    <circle cx="86" cy="36" r="3" fill="#bfe6f5"/><circle cx="92" cy="44" r="2.4" fill="#bfe6f5"/>`,

  toy_blocks: () => `
    <rect x="20" y="56" width="26" height="26" rx="4" fill="#ef7f7f" stroke="#b34d4d" stroke-width="3"/>
    <rect x="50" y="56" width="26" height="26" rx="4" fill="#6fb3d9" stroke="#3f7d9e" stroke-width="3"/>
    <rect x="35" y="28" width="26" height="26" rx="4" fill="#f6c453" stroke="#c9922c" stroke-width="3"/>
    <text x="33" y="76" font-family="system-ui" font-size="18" font-weight="900" fill="#fff">A</text>
    <text x="63" y="76" font-family="system-ui" font-size="18" font-weight="900" fill="#fff">C</text>
    <text x="48" y="48" font-family="system-ui" font-size="18" font-weight="900" fill="#fff">B</text>`,

  stool: () => `
    <ellipse cx="50" cy="50" rx="30" ry="12" fill="#d9ab7c" stroke="#8a6340" stroke-width="3"/>
    <path d="M 26 54 L 20 86 M 74 54 L 80 86 M 50 58 V 88"
          stroke="#a5794f" stroke-width="7" stroke-linecap="round"/>
    <ellipse cx="50" cy="48" rx="30" ry="12" fill="#e8c29a" stroke="#8a6340" stroke-width="3"/>`,

  floor_lamp: () => `
    <ellipse cx="50" cy="88" rx="20" ry="7" fill="#c9a87c" stroke="#8a6340" stroke-width="3"/>
    <path d="M 50 86 V 40 q 0 -10 -12 -12" fill="none" stroke="#8a6340" stroke-width="5" stroke-linecap="round"/>
    <path d="M 18 24 h 34 l -6 20 h -22 z" fill="#f6c453" stroke="#c9922c" stroke-width="3" stroke-linejoin="round"/>
    <ellipse cx="35" cy="46" rx="12" ry="4" fill="#fff6e8" opacity=".85"/>`,

  easel: () => `
    <path d="M 26 88 L 42 34 M 74 88 L 58 34 M 50 40 V 92" stroke="#a5794f" stroke-width="6" stroke-linecap="round"/>
    <rect x="24" y="30" width="52" height="40" rx="3" fill="#fff6e8" stroke="#8a6340" stroke-width="3.5"/>
    <path d="M 28 62 q 12 -20 22 -8 q 8 10 22 -6 v 14 h -44 z" fill="#8fd3a8"/>
    <circle cx="63" cy="41" r="6" fill="#ffd980"/>
    <rect x="22" y="66" width="56" height="7" rx="3" fill="#c9a87c" stroke="#8a6340" stroke-width="3"/>`,

  rocking_horse: () => `
    <path d="M 16 82 q 34 14 68 0" fill="none" stroke="#a5794f" stroke-width="7" stroke-linecap="round"/>
    <path d="M 32 78 V 58 M 64 78 V 56" stroke="#c9a87c" stroke-width="7" stroke-linecap="round"/>
    <ellipse cx="48" cy="52" rx="26" ry="15" fill="#f4c9a8" stroke="#a5613f" stroke-width="3"/>
    <circle cx="72" cy="38" r="14" fill="#f4c9a8" stroke="#a5613f" stroke-width="3"/>
    <path d="M 78 26 l 8 -8 -2 10 z" fill="#f4c9a8" stroke="#a5613f" stroke-width="2.5" stroke-linejoin="round"/>
    <circle cx="78" cy="36" r="3" fill="#3a2e28"/>
    <path d="M 62 30 q -10 4 -12 16" fill="none" stroke="#e2566f" stroke-width="5" stroke-linecap="round"/>
    <path d="M 24 46 q -8 8 -6 20" fill="none" stroke="#e2566f" stroke-width="5" stroke-linecap="round"/>`,

  /* ================= More beds ================= */

  bed_hammock: () => `
    <path d="M 10 26 V 84 M 90 26 V 84" stroke="#a5794f" stroke-width="6" stroke-linecap="round"/>
    <path d="M 12 34 Q 50 82 88 34" fill="#f7b955" stroke="#c9922c" stroke-width="3.5" stroke-linejoin="round"/>
    <path d="M 12 34 Q 50 70 88 34" fill="none" stroke="#fff6e8" stroke-width="2.5" opacity=".7"/>
    ${[22, 34, 50, 66, 78].map(x => `<path d="M ${x} ${28 + Math.abs(50 - x) * 0.12} L ${x} ${52 - Math.abs(50 - x) * 0.34}"
        stroke="#c9922c" stroke-width="2" opacity=".6"/>`).join('')}`,

  bed_lilypad: () => `
    <ellipse cx="50" cy="66" rx="44" ry="26" fill="#7fc99a" stroke="#4f8a5c" stroke-width="3.5"/>
    <path d="M 50 66 L 86 58 M 50 66 L 80 82 M 50 66 L 30 86 M 50 66 L 12 60 M 50 66 L 26 46"
          stroke="#4f8a5c" stroke-width="2" opacity=".55"/>
    <path d="M 50 66 L 62 42 a 14 14 0 0 0 -24 0 z" fill="#9fd8b4"/>
    <ellipse cx="50" cy="58" rx="22" ry="12" fill="#c3e8cf" stroke="#4f8a5c" stroke-width="2.5"/>
    <circle cx="74" cy="42" r="8" fill="#f7a8c6" stroke="#c07e96" stroke-width="2.5"/>
    <circle cx="74" cy="42" r="3.4" fill="#ffd980"/>`,

  bed_mushroom: () => `
    <path d="M 34 88 V 62 a 6 6 0 0 1 12 0 v 26 z" fill="#fff3e4" stroke="#c9a97c" stroke-width="3"/>
    <path d="M 8 62 a 42 30 0 0 1 84 0 z" fill="#e2564f" stroke="#a83a35" stroke-width="3.5" stroke-linejoin="round"/>
    <circle cx="28" cy="48" r="7" fill="#fff"/><circle cx="52" cy="40" r="9" fill="#fff"/>
    <circle cx="72" cy="50" r="6" fill="#fff"/><circle cx="40" cy="57" r="4.6" fill="#fff"/>
    <ellipse cx="62" cy="80" rx="26" ry="11" fill="#ffe3ec" stroke="#c07e96" stroke-width="3"/>`,

  bed_cloud: () => `
    <circle cx="28" cy="58" r="20" fill="#fff" stroke="#c6d4e4" stroke-width="3.5"/>
    <circle cx="52" cy="48" r="26" fill="#fff" stroke="#c6d4e4" stroke-width="3.5"/>
    <circle cx="76" cy="58" r="18" fill="#fff" stroke="#c6d4e4" stroke-width="3.5"/>
    <rect x="12" y="58" width="76" height="24" rx="12" fill="#fff" stroke="#c6d4e4" stroke-width="3.5"/>
    <ellipse cx="34" cy="60" rx="14" ry="7" fill="#eaf2fb"/>
    <path d="M 20 54 q 8 -4 16 0 M 62 50 q 8 -4 16 2" fill="none" stroke="#dce6f2" stroke-width="3" stroke-linecap="round"/>`,

  /* ================= More rugs ================= */

  rug_moss: () => `
    <ellipse cx="50" cy="62" rx="42" ry="24" fill="#8fbf7a" stroke="#5f8a4f" stroke-width="3.5"/>
    ${[...Array(14)].map((_, i) => {
      const a = (i / 14) * Math.PI * 2;
      return `<ellipse cx="${n2(50 + Math.cos(a) * 26)}" cy="${n2(62 + Math.sin(a) * 14)}" rx="7" ry="4.6" fill="#a4cf90"/>`;
    }).join('')}
    <ellipse cx="50" cy="62" rx="16" ry="9" fill="#c3e8b0"/>`,

  rug_star: () => {
    let d = '';
    for (let i = 0; i < 10; i++) {
      const a = (Math.PI / 5) * i - Math.PI / 2;
      const r = i % 2 ? 18 : 44;
      d += `${i ? 'L' : 'M'} ${n2(50 + Math.cos(a) * r)} ${n2(62 + Math.sin(a) * r * 0.58)} `;
    }
    return `<path d="${d}Z" fill="#f6c453" stroke="#c9922c" stroke-width="3.5" stroke-linejoin="round"/>
            <circle cx="50" cy="62" r="11" fill="#ffe9a8" stroke="#c9922c" stroke-width="2.5"/>`;
  },

  rug_flower: () => `
    ${[...Array(8)].map((_, i) => {
      const a = (i / 8) * Math.PI * 2;
      return `<ellipse cx="${n2(50 + Math.cos(a) * 26)}" cy="${n2(62 + Math.sin(a) * 15)}" rx="17" ry="11"
                fill="#f4a0c0" stroke="#c07e96" stroke-width="3"/>`;
    }).join('')}
    <ellipse cx="50" cy="62" rx="20" ry="12" fill="#ffd980" stroke="#c9922c" stroke-width="3"/>`,

  rug_cloud: () => `
    <ellipse cx="30" cy="60" rx="18" ry="12" fill="#e8f1fb" stroke="#bcd0e4" stroke-width="3"/>
    <ellipse cx="70" cy="60" rx="18" ry="12" fill="#e8f1fb" stroke="#bcd0e4" stroke-width="3"/>
    <ellipse cx="50" cy="54" rx="24" ry="15" fill="#f4f8fe" stroke="#bcd0e4" stroke-width="3"/>
    <ellipse cx="50" cy="66" rx="40" ry="16" fill="#f4f8fe" stroke="#bcd0e4" stroke-width="3"/>
    <ellipse cx="50" cy="64" rx="22" ry="8" fill="#dbe8f7"/>`,

  /* ================= More for the walls ================= */

  butterflies: () => `
    ${[[28, 40, '#f2849f', 1], [58, 26, '#a8c8f0', .82], [70, 52, '#ffd980', .7]].map(([x, y, c, sc]) =>
      `<g transform="translate(${x} ${y}) scale(${sc})">
         <path d="M 0 0 C -16 -16 -22 -2 -4 6 Z" fill="${c}" stroke="#8a6f7c" stroke-width="2" stroke-linejoin="round"/>
         <path d="M 0 0 C 16 -16 22 -2 4 6 Z"  fill="${c}" stroke="#8a6f7c" stroke-width="2" stroke-linejoin="round"/>
         <path d="M 0 -4 V 8" stroke="#5a4033" stroke-width="3" stroke-linecap="round"/>
       </g>`).join('')}`,

  small_shelf: () => `
    <rect x="16" y="54" width="68" height="8" rx="3" fill="#c99a6e" stroke="#8a6340" stroke-width="3"/>
    <path d="M 24 62 v 8 M 76 62 v 8" stroke="#8a6340" stroke-width="3.5" stroke-linecap="round"/>
    <rect x="26" y="34" width="9" height="20" rx="2" fill="#ef7f7f"/>
    <rect x="37" y="38" width="8" height="16" rx="2" fill="#6fb3d9"/>
    <circle cx="60" cy="46" r="8" fill="#8fd3a8" stroke="#4f8a5c" stroke-width="2.5"/>
    <rect x="70" y="42" width="10" height="12" rx="2" fill="#f6c453"/>`,

  mirror: () => `
    <circle cx="50" cy="48" r="32" fill="#d9e8f2" stroke="#a5875f" stroke-width="6"/>
    <circle cx="50" cy="48" r="26" fill="#eef6fb"/>
    <path d="M 32 58 q 14 -26 34 -14" fill="none" stroke="#fff" stroke-width="7" opacity=".85" stroke-linecap="round"/>
    <circle cx="50" cy="12" r="5" fill="#f6c453" stroke="#c9922c" stroke-width="2"/>`,

  wall_planter: () => `
    <path d="M 50 8 V 24" stroke="#a5875f" stroke-width="3"/>
    <path d="M 30 24 h 40 l -5 22 h -30 z" fill="#d98b62" stroke="#a5613f" stroke-width="3" stroke-linejoin="round"/>
    <rect x="27" y="20" width="46" height="8" rx="4" fill="#e8a17c" stroke="#a5613f" stroke-width="3"/>
    ${[[-1, 34], [1, 30], [-1, 20]].map(([side, len]) =>
      `<path d="M ${50 + side * 12} 44 q ${side * 8} ${len * 0.6} ${side * 4} ${len}"
            fill="none" stroke="#5fae7f" stroke-width="3.5" stroke-linecap="round"/>`).join('')}
    <circle cx="36" cy="72" r="5" fill="#7fc99a"/><circle cx="62" cy="66" r="4.4" fill="#8fd3a8"/>
    <circle cx="44" cy="84" r="4" fill="#7fc99a"/>`,

  map: () => `
    <path d="M 14 22 q 18 -6 36 0 q 18 6 36 0 v 56 q -18 6 -36 0 q -18 -6 -36 0 z"
          fill="#f2e2c0" stroke="#a5875f" stroke-width="3.5" stroke-linejoin="round"/>
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
    <rect x="18" y="12" width="64" height="54" rx="4" fill="#bfe6f5" stroke="#a5875f" stroke-width="6"/>
    <path d="M 50 12 v 54 M 18 39 h 64" stroke="#d9c4a5" stroke-width="5"/>
    <path d="M 12 66 h 76 l -5 20 h -66 z" fill="#d98b62" stroke="#a5613f" stroke-width="3.5" stroke-linejoin="round"/>
    ${[24, 40, 56, 72].map((x, i) =>
      `<circle cx="${x}" cy="${62 - (i % 2) * 5}" r="6" fill="${['#f2849f', '#ffd980', '#c9a3e0', '#f7a8c6'][i]}"/>
       <circle cx="${x}" cy="${62 - (i % 2) * 5}" r="2.4" fill="#fff6e8"/>`).join('')}`,

  window_star: () => {
    let d = '';
    for (let i = 0; i < 10; i++) {
      const a = (Math.PI / 5) * i - Math.PI / 2;
      const r = i % 2 ? 18 : 42;
      d += `${i ? 'L' : 'M'} ${n2(50 + Math.cos(a) * r)} ${n2(48 + Math.sin(a) * r)} `;
    }
    return `<path d="${d}Z" fill="#cfe6f5" stroke="#a5875f" stroke-width="6" stroke-linejoin="round"/>
            <path d="${d}Z" fill="none" stroke="#fff" stroke-width="2" opacity=".6"/>
            <circle cx="42" cy="38" r="5" fill="#fff" opacity=".7"/>`;
  },

  door_barn: () => `
    <rect x="18" y="10" width="64" height="86" rx="3" fill="#d4594f" stroke="#8a3a35" stroke-width="5"/>
    <path d="M 50 10 V 96" stroke="#8a3a35" stroke-width="4"/>
    <path d="M 20 30 h 60 M 20 74 h 60" stroke="#e8a09a" stroke-width="5"/>
    <path d="M 22 32 L 48 72 M 78 32 L 52 72" stroke="#e8a09a" stroke-width="5"/>
    <circle cx="44" cy="54" r="3.6" fill="#f6c453"/><circle cx="56" cy="54" r="3.6" fill="#f6c453"/>`,

  door_star: () => `
    <rect x="20" y="8" width="60" height="88" rx="6" fill="#4e5b94" stroke="#333d66" stroke-width="5"/>
    <rect x="20" y="8" width="60" height="88" rx="6" fill="none" stroke="#333d66" stroke-width="5"/>
    ${[[50, 34, 15], [34, 58, 8], [66, 62, 9], [50, 76, 6]].map(([x, y, r]) => {
      let d = '';
      for (let i = 0; i < 10; i++) {
        const a = (Math.PI / 5) * i - Math.PI / 2;
        const rr = i % 2 ? r * 0.44 : r;
        d += `${i ? 'L' : 'M'} ${n2(x + Math.cos(a) * rr)} ${n2(y + Math.sin(a) * rr)} `;
      }
      return `<path d="${d}Z" fill="#ffe9a8" stroke="#e0c274" stroke-width="1.6" stroke-linejoin="round"/>`;
    }).join('')}
    <circle cx="70" cy="54" r="4.6" fill="#f6c453" stroke="#c9922c" stroke-width="2"/>`,

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
};

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
