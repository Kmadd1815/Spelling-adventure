/* Little bursts of celebration over the pet.

   Drawn as plain DOM on a layer above the SVG rather than inside it, which
   keeps the pet drawing free of one-off animation state and means an effect
   can be fired from anywhere without re-rendering the creature. */

import { el } from './dom.js';

const EFFECTS = {
  hearts:   { chars: ['❤️', '\u{1F495}', '\u{1F49E}'], count: 7,  cls: 'fx' },
  bubbles:  { chars: ['\u{1FAE7}', '○', '⚪'],          count: 10, cls: 'fx fx-bubble' },
  sparkles: { chars: ['✨', '⭐', '\u{1F31F}'],          count: 8,  cls: 'fx' },
  crumbs:   { chars: ['\u{1F353}', '\u{1F33F}', '✨'],       count: 7,  cls: 'fx fx-crumb' },
};

/**
 * Fire an effect over a container.
 * @param {HTMLElement} host    positioned element to draw over
 * @param {string} kind         hearts | bubbles | sparkles | crumbs
 * @param {object} [opts]
 * @param {HTMLElement} [opts.origin]
 *   What the burst should come out of. Without it the effect lands at the
 *   middle of the host, which in a tall room is up on the wall rather than
 *   anywhere near the axolotl.
 */
export function burst(host, kind = 'hearts', { origin = null } = {}) {
  if (!host) return;
  const spec = EFFECTS[kind] || EFFECTS.hearts;

  if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  // Where in the host the burst starts, as percentages.
  let cx = 50, cy = 46, spread = 16;
  if (origin) {
    const h = host.getBoundingClientRect();
    const o = origin.getBoundingClientRect();
    if (h.width && h.height) {
      cx = ((o.left + o.width / 2) - h.left) / h.width * 100;
      // A third of the way down the creature: its face, near enough.
      cy = ((o.top + o.height * 0.34) - h.top) / h.height * 100;
      spread = Math.max(8, (o.width / h.width) * 100 * 0.42);
    }
  }

  let layer = host.querySelector(':scope > .fx-layer');
  if (!layer) {
    layer = el('div', { class: 'fx-layer' });
    if (getComputedStyle(host).position === 'static') host.style.position = 'relative';
    host.append(layer);
  }

  for (let i = 0; i < spec.count; i++) {
    const node = el('span', {
      class: spec.cls,
      text: spec.chars[i % spec.chars.length],
      style: {
        left: `${cx + (Math.random() - 0.5) * spread * 2}%`,
        top: `${cy + (kind === 'crumbs' ? 4 : 0)}%`,
        // Each piece drifts its own way, so a burst never looks stamped out.
        '--fx-dx': `${(Math.random() - 0.5) * 90}px`,
        '--fx-rot': `${(Math.random() - 0.5) * 70}deg`,
        animationDelay: `${i * 55}ms`,
        fontSize: `${0.9 + Math.random() * 0.8}rem`,
      },
    });
    layer.append(node);
    setTimeout(() => node.remove(), 2200);
  }
}

/** One happy hop, safe to call repeatedly. */
export function hop(petNode) {
  if (!petNode) return;
  petNode.classList.remove('pet-react');
  void petNode.offsetWidth;          // restart the animation
  petNode.classList.add('pet-react');
  setTimeout(() => petNode.classList.remove('pet-react'), 700);
}
