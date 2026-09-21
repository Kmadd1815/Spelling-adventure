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

/* ============================ WEARABLES ============================ */

/* g = { hx, hy, hrx, hry, bx, by, brx, bry, coat } — the pet's geometry. */

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
    const baseY = g.hy - g.hry * 0.74, w = g.hrx * 0.46, h = g.hry * 0.92;
    return `
      <path d="M ${n(g.hx - w)} ${n(baseY)} L ${n(g.hx)} ${n(baseY - h)} L ${n(g.hx + w)} ${n(baseY)} Z"
            fill="#f7b955" stroke="#c98d34" stroke-width="2.4" stroke-linejoin="round"/>
      <path d="M ${n(g.hx - w * 0.55)} ${n(baseY - h * 0.30)} L ${n(g.hx + w * 0.30)} ${n(baseY - h * 0.46)}"
            stroke="#e8f4fb" stroke-width="3" stroke-linecap="round"/>
      <path d="M ${n(g.hx - w * 0.25)} ${n(baseY - h * 0.62)} L ${n(g.hx + w * 0.22)} ${n(baseY - h * 0.72)}"
            stroke="#e8f4fb" stroke-width="3" stroke-linecap="round"/>
      <circle cx="${n(g.hx)}" cy="${n(baseY - h - 2)}" r="${n(w * 0.26)}" fill="#f2849f" stroke="#b34a66" stroke-width="2"/>`;
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
    const baseY = g.hy - g.hry * 0.72, w = g.hrx * 0.70, h = g.hry * 1.35;
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
    const topY = g.hy + g.hry * 0.92, w = g.brx * 1.02;
    return `
      <path d="M ${n(g.hx - w * 0.44)} ${n(topY)}
               Q ${n(g.hx - w * 1.16)} ${n(g.by + g.bry * 0.46)} ${n(g.hx - w * 0.72)} ${n(g.by + g.bry * 1.02)}
               Q ${n(g.hx)} ${n(g.by + g.bry * 0.76)} ${n(g.hx + w * 0.72)} ${n(g.by + g.bry * 1.02)}
               Q ${n(g.hx + w * 1.16)} ${n(g.by + g.bry * 0.46)} ${n(g.hx + w * 0.44)} ${n(topY)} Z"
            fill="#c0405e" stroke="#8a2b42" stroke-width="2.4" stroke-linejoin="round"/>
      <rect x="${n(g.hx - w * 0.46)}" y="${n(topY - g.bry * 0.10)}" width="${n(w * 0.92)}" height="${n(g.bry * 0.20)}"
            rx="${n(g.bry * 0.10)}" fill="#f6c453" stroke="#c9922c" stroke-width="2"/>`;
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
export const BEHIND_BODY = new Set(['cape']);

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
};

export const surfaceStyle = id => SURFACES[id] || SURFACES.wall_plain;

/* =========================== DECORATIONS ===========================
   Each draws inside a 0 0 100 100 box, standing on y = 92. */

const DECOR = {
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
