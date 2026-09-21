/* Small transient messages and the celebration confetti. */

import { el } from './dom.js';

const layer = () => document.getElementById('toastLayer');

export function toast(message, { gold = false, ms = 2600 } = {}) {
  const node = el('div', { class: gold ? 'toast toast-gold' : 'toast', text: message });
  layer().append(node);
  setTimeout(() => node.remove(), ms);
  return node;
}

const CONFETTI_COLORS = ['#f6c453', '#64bd80', '#6fb3d9', '#a78bc9', '#ef9a9a', '#ef9345'];

export function confetti(count = 34) {
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  for (let i = 0; i < count; i++) {
    const piece = el('div', {
      class: 'confetti-piece',
      style: {
        left: `${Math.random() * 100}vw`,
        background: CONFETTI_COLORS[i % CONFETTI_COLORS.length],
        animationDuration: `${1.6 + Math.random() * 1.4}s`,
        animationDelay: `${Math.random() * 0.35}s`,
        borderRadius: Math.random() > 0.5 ? '50%' : '2px',
      },
    });
    document.body.append(piece);
    setTimeout(() => piece.remove(), 3600);
  }
}
