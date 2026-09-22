/* Every seasonal event, played the same way.

   There is one mechanic and six costumes. Something is scattered across a
   scene; she taps one, hears a word, and spells it; the thing does a happy
   little exit and the track at the top fills a bit more. Cross a threshold
   and a collectible is hers for good.

   What changes between events is data in core/events.js — the sprite, the
   backdrop, what the things are called and what happens to them. Ghosts get
   helped home, leaves get gathered, ornaments get hung up, sparklers light
   the sky, eggs get found, candles get lit.

   Nothing in any of them is frightening or punishing. The Halloween ghosts
   are round and smiling and lost rather than haunting, and getting a word
   wrong anywhere means the thing waits a moment and moves somewhere else.
   Nothing is ever taken away.
*/

import { el, mount, clear, button } from '../ui/dom.js';
import { navigate, render as rerender } from '../ui/router.js';
import { confetti } from '../ui/toast.js';
import { buildKeyboard, watchPhysicalKeyboard } from '../ui/keyboard.js';
import { createBuddy } from '../ui/buddy.js';
import { itemSVG } from '../ui/item-art.js';
import { burst } from '../ui/fx.js';
import * as speech from '../core/speech.js';
import * as words from '../core/words.js';
import * as events from '../core/events.js';
import * as pet from '../core/pet.js';
import { byId as itemById } from '../core/items.js';
import { recordAttempt } from '../core/words.js';

const GHOSTS_PER_ROUND = 5;

export default function eventScreen(container, { preview = '' } = {}) {
  const live = events.liveEvent();
  const event = live || (preview ? events.byId(preview) : null);
  const isPreview = !live && !!event;

  if (!event) return mount(container, nothingOn());

  const queue = events.eventWords(GHOSTS_PER_ROUND);
  if (!queue.length) {
    return mount(container, el('div', { class: 'card center stack' },
      el('h2', { text: 'No words yet' }),
      el('p', { class: 'muted', text: 'Ask a grown-up to add this week’s spelling list first.' }),
      button('Go home', { cls: 'btn btn-primary', onClick: () => navigate('/') })
    ));
  }

  /* ---------- Layout ---------- */

  container.style.display = 'flex';
  container.style.flexDirection = 'column';
  container.style.height = '100%';
  container.style.overflow = 'hidden';
  const release = () => {
    container.style.display = '';
    container.style.flexDirection = '';
    container.style.height = '';
    container.style.overflow = '';
  };

  const buddy = createBuddy({ layout: 'voice', greeting: event.greeting });
  const timers = [];
  const wait = (fn, ms) => { timers.push(setTimeout(fn, ms)); };

  const track   = el('div', { class: 'ev-track' });
  const field   = el('div', { class: 'ev-field' });
  const tiles   = el('div', { class: 'answer-tiles answer-tiles-sm' });
  const spellBox = el('div', { class: 'ev-spell', hidden: true });
  const keyboard = el('div', { class: 'keyboard keyboard-sm' });

  const body = el('div', { class: `game-body ev-wrap scene-${event.scene}` },
    track, field, spellBox, el('div', { class: 'ev-foot' }, buddy.node)
  );

  mount(container,
    el('div', { class: 'game-head' },
      el('div', { class: 'game-head-title', text: `${event.emoji} ${event.name}` }),
      el('button', { class: 'icon-btn', type: 'button', 'aria-label': 'Finish and leave',
        onClick: () => leave() }, '✕')
    ),
    body,
    keyboard
  );

  /* ---------- State ---------- */

  /* A sprite may be a single drawing or a function of its index, so an egg
     hunt gets five different eggs rather than five copies of one. */
  const spriteArt = SPRITES[event.sprite] || SPRITES.ghost;
  const spriteFor = i => (typeof spriteArt === 'function' ? spriteArt(i) : spriteArt);
  const things = queue.map((word, i) => ({
    word, i, home: false,
    x: 12 + (i % 3) * 30 + Math.random() * 10,
    y: 16 + Math.floor(i / 3) * 36 + Math.random() * 12,
  }));
  let active = null;
  let typed = '';
  let busy = false;
  let sentHome = 0;
  const missed = [];
  const earnedThisRound = [];

  /* ---------- Drawing ---------- */

  function drawTrack() {
    const { count } = events.progress(event.id);
    const next = events.nextReward(event);
    clear(track);

    track.append(el('div', { class: 'ev-count' },
      el('span', { class: 'ev-count-n', text: String(count) }),
      el('span', { class: 'tiny', text: ` ${count === 1 ? event.unitOne : event.unitMany} ${event.verb}` })
    ));

    if (next) {
      const prev = event.rewards.filter(r => r.at <= count).map(r => r.at).pop() || 0;
      const pct = (count - prev) / Math.max(1, next.at - prev);
      const item = itemById(next.item);
      track.append(el('div', { class: 'ev-next' },
        el('div', { class: 'ev-next-art', html: itemSVG(item, { size: 44 }) }),
        el('div', { class: 'grow' },
          el('div', { class: 'tiny', text: `Next: ${item?.name || ''}` }),
          el('div', { class: 'bar' }, el('i', { style: { width: `${Math.round(pct * 100)}%` } }))
        ),
        el('div', { class: 'tiny muted', text: `${next.at - count} to go` })
      ));
    } else {
      track.append(el('div', { class: 'tiny center',
        text: 'You found every single thing this year. \u{1F31F}' }));
    }

    if (isPreview) {
      track.append(el('div', { class: 'ev-preview-note tiny center',
        text: 'Preview for grown-ups — nothing is earned or counted.' }));
    } else {
      const left = events.daysLeft(event);
      track.append(el('div', { class: 'tiny muted center',
        text: left === 1 ? 'Last day!' : `${left} days left` }));
    }
  }

  function drawField() {
    clear(field);
    things.forEach(g => {
      if (g.home) return;
      const node = el('button', {
        class: `ev-ghost${active === g ? ' ev-ghost-on' : ''}`,
        type: 'button',
        style: { left: `${g.x}%`, top: `${g.y}%`, animationDelay: `${(g.i % 5) * 0.4}s` },
        'aria-label': `A ${event.unitOne}`,
        onClick: () => pick(g),
      }, el('span', { class: 'ev-ghost-art', html: spriteFor(g.i) }));
      field.append(node);
    });

    if (things.every(g => g.home)) {
      field.append(el('div', { class: 'ev-clear center' },
        el('div', { style: { fontSize: '2rem' }, text: '\u{1F31F}' }),
        el('div', { text: `Every ${event.unitOne} ${event.verb}!` })
      ));
    }
  }

  function renderTiles(state = 'typing') {
    clear(tiles);
    typed.split('').forEach(ch => {
      let cls = 'tile';
      if (state === 'good') cls += ' good';
      if (state === 'bad')  cls += ' bad';
      tiles.append(el('div', { class: cls, text: ch }));
    });
    if (state === 'typing') tiles.append(el('div', { class: 'tile empty caret' }));
  }

  /* ---------- Playing ---------- */

  function pick(g) {
    if (busy || g.home) return;
    active = g;
    typed = '';
    drawField();
    spellBox.hidden = false;
    mount(spellBox,
      el('div', { class: 'row', style: { justifyContent: 'center' } },
        el('button', { class: 'speak-btn speak-btn-sm', type: 'button',
          'aria-label': 'Hear the word again',
          onClick: () => say(g.word) }, '\u{1F50A}'),
        button('Slower', { cls: 'btn btn-quiet', emoji: '\u{1F422}',
          onClick: () => speech.speakWordSlowly(g.word) })
      ),
      tiles
    );
    renderTiles();
    wait(() => say(g.word), 200);
  }

  function say(word) {
    speech.promptWord(word, { withSentence: words.shouldSpeakSentence(word) });
  }

  function typeLetter(ch) {
    if (busy || !active || typed.length >= 24) return;
    typed += ch;
    renderTiles();
  }

  function backspace() {
    if (busy || !active) return;
    typed = typed.slice(0, -1);
    renderTiles();
  }

  function submit() {
    if (busy || !active) return;
    const g = active;
    const attempt = typed.trim().toLowerCase();
    if (!attempt) { buddy.say('Tap the letters to spell it.'); return; }

    const right = attempt === g.word.text.trim().toLowerCase();
    busy = true;

    /* One door to her progress, and the same rule as the games: a hunt can
       add to a mastery streak and can never break one. */
    /* Events are a treat, not an assessment: only the two tests move
       mastery. */
    recordAttempt(g.word.id, right, { countsForMastery: false });

    if (right) {
      renderTiles('good');
      g.home = true;
      sentHome += 1;
      buddy.cheer(`${g.word.text} — off you go!`);
      burst(field, 'sparkles');

      // Preview mode looks exactly the same but banks nothing.
      const result = isPreview ? { earned: [] } : events.addProgress(event, 1);
      drawTrack();
      drawField();

      if (result.earned.length) {
        earnedThisRound.push(...result.earned);
        wait(() => showPrize(result.earned), 700);
      }

      wait(() => {
        busy = false;
        active = null;
        spellBox.hidden = true;
        clear(spellBox);
        drawField();
        if (things.every(x => x.home)) finish();
      }, result.earned.length ? 2600 : 1200);
      return;
    }

    renderTiles('bad');
    tiles.classList.add('shake');
    wait(() => tiles.classList.remove('shake'), 420);
    if (!missed.some(w => w.id === g.word.id)) missed.push(g.word);
    buddy.sympathise(`It was "${g.word.text}". This one will come back.`);

    mount(spellBox,
      el('div', { class: 'ev-reveal center' },
        el('div', { class: 'correct-spelling', text: g.word.text }),
        el('div', { class: 'row', style: { justifyContent: 'center' } },
          button('Hear it', { cls: 'btn btn-quiet', emoji: '\u{1F50A}',
            onClick: () => speech.speakWord(g.word) }),
          button('Show me', { cls: 'btn btn-quiet', emoji: '\u{1F524}',
            onClick: () => speech.spellOut(g.word) })
        )
      )
    );

    // It drifts somewhere new and waits. Nothing is lost.
    wait(() => {
      g.x = 8 + Math.random() * 76;
      g.y = 12 + Math.random() * 58;
      busy = false;
      active = null;
      spellBox.hidden = true;
      clear(spellBox);
      drawField();
    }, 2600);
  }

  function showPrize(ids) {
    const item = itemById(ids[0]);
    if (!item) return;
    confetti(30);
    buddy.celebrate(`${item.name}!`);
    mount(spellBox, el('div', { class: 'ev-prize center' },
      el('div', { class: 'ev-prize-art', html: itemSVG(item, { size: 96 }) }),
      el('div', { class: 'ev-prize-name', text: `You found the ${item.name}!` }),
      el('div', { class: 'tiny muted', text: 'Yours to keep, even after the event ends.' })
    ));
  }

  /* ---------- Ending ---------- */

  function finish() {
    const payout = isPreview
      ? { lines: [], total: 0, capped: false, repeat: false }
      : events.scoreRound({ event, unitsWon: sentHome });

    timers.forEach(clearTimeout);
    speech.stop();
    buddy.stop();
    release();

    const { count } = events.progress(event.id);
    const body2 = el('div', { class: 'stack' },
      el('div', { class: 'card center' },
        el('div', { style: { fontSize: '2.4rem' }, text: event.emoji }),
        el('h2', { text: sentHome === things.length
          ? `Every ${event.unitOne} ${event.verb}!` : 'Well played!' }),
        el('p', { class: 'muted', text:
          `${sentHome} of ${things.length} ${things.length === 1 ? event.unitOne : event.unitMany} this round` +
          (isPreview ? '' : ` · ${count} altogether`) })
      )
    );

    if (payout.lines.length) {
      body2.append(el('div', { class: 'card' },
        el('h3', { text: 'Stars earned' }),
        el('div', { class: 'stack-sm' }, payout.lines.map(line =>
          el('div', { class: 'payout-row' },
            el('div', { class: 'grow', text: line.label }),
            el('div', { class: 'payout-stars', text: `+${line.stars}` })
          ))),
        el('div', { class: 'payout-total' },
          el('div', { class: 'grow', text: 'Total' }),
          el('div', { text: `★ ${payout.total}` })
        ),
        payout.repeat ? el('p', { class: 'tiny muted', style: { marginTop: '8px' },
          text: `The first round each day earns the most — but the ${event.unitMany} are still here.` }) : null
      ));
    }

    if (earnedThisRound.length) {
      body2.append(el('div', { class: 'card' },
        el('h3', { text: earnedThisRound.length === 1 ? 'You found something!' : 'You found things!' }),
        el('p', { class: 'muted tiny', text: 'Yours to keep, even after the event ends.' }),
        el('div', { class: 'stack-sm' }, earnedThisRound.map(id => {
          const item = itemById(id);
          return el('div', { class: 'word-row' },
            el('div', { class: 'ev-next-art', html: itemSVG(item, { size: 40 }) }),
            el('div', { class: 'w-text grow', text: item?.name || '' }),
            el('div', { class: 'badge badge-mastered', text: '\u2728 New' })
          );
        }))
      ));
    }

    const next = events.nextReward(event);
    if (next) {
      const item = itemById(next.item);
      body2.append(el('div', { class: 'card center' },
        el('div', { class: 'ev-next-art', html: itemSVG(item, { size: 72 }) }),
        el('h3', { text: `Next: ${item?.name || ''}` }),
        el('p', { class: 'muted tiny', text:
          `${next.at - count} more ${next.at - count === 1 ? event.unitOne : event.unitMany} to go.` })
      ));
    }

    if (missed.length) {
      body2.append(el('div', { class: 'card' },
        el('h3', { text: 'Words to look at again' }),
        el('div', { class: 'stack-sm' }, missed.map(w =>
          el('div', { class: 'word-row' },
            el('div', { class: 'w-text', text: w.text }),
            el('button', { class: 'icon-btn', type: 'button', 'aria-label': `Hear ${w.text}`,
              onClick: () => speech.speak(w.text) }, '\u{1F50A}')
          )))
      ));
    }

    if (isPreview) {
      body2.append(el('div', { class: 'card center' },
        el('p', { class: 'tiny muted', text:
          'This was a preview. Nothing was counted and nothing was earned — it all starts fresh on the day.' })
      ));
    }

    body2.append(el('div', { class: 'row' },
      button('Play again', { cls: 'btn btn-green grow', emoji: '\u{1F501}', onClick: rerender }),
      button('Go home', { cls: 'btn btn-primary grow', emoji: '\u{1F3E0}', onClick: () => navigate('/') })
    ));

    mount(container, body2);
  }

  function leave() {
    if (!sentHome) { release(); return navigate('/'); }
    finish();
  }

  /* ---------- Input ---------- */

  const stopKeys = watchPhysicalKeyboard({
    onLetter: typeLetter, onBackspace: backspace, onEnter: submit,
    isLocked: () => busy || !active,
  });

  /* ---------- Go ---------- */

  buildKeyboard(keyboard, {
    onLetter: typeLetter, onBackspace: backspace, onEnter: submit, enterLabel: 'Check',
  });
  drawTrack();
  drawField();

  return () => {
    timers.forEach(clearTimeout);
    stopKeys();
    buddy.stop();
    speech.stop();
    release();
  };
}

/* What she taps, one per event. These are scenery rather than anything she
   can own, so they live here instead of in the item catalogue. The
   Halloween ghost is round and smiling and lost, not haunting. */
const SPRITES = {
  ghost: `
<svg viewBox="0 0 100 110" width="100%" height="100%" aria-hidden="true">
  <path d="M 50 10 Q 80 10 80 44 L 80 92 Q 72 82 64 92 Q 56 82 50 92 Q 44 82 36 92 Q 28 82 20 92 L 20 44 Q 20 10 50 10 Z"
        fill="#fbf7f2" stroke="#b9b0c4" stroke-width="3" stroke-linejoin="round"/>
  <ellipse cx="40" cy="42" rx="4.6" ry="5.8" fill="#4a3b52"/>
  <ellipse cx="60" cy="42" rx="4.6" ry="5.8" fill="#4a3b52"/>
  <ellipse cx="31" cy="54" rx="5.4" ry="3.6" fill="#f4b8c6" opacity=".75"/>
  <ellipse cx="69" cy="54" rx="5.4" ry="3.6" fill="#f4b8c6" opacity=".75"/>
  <path d="M 43 55 Q 50 62 57 55" fill="none" stroke="#4a3b52" stroke-width="3" stroke-linecap="round"/>
</svg>`,

  candle: `
<svg viewBox="0 0 100 110" width="100%" height="100%" aria-hidden="true">
  <path d="M 50 12 Q 60 24 56 32 Q 53 38 50 38 Q 47 38 44 32 Q 40 24 50 12 Z"
        fill="#ffd35c" stroke="#e0a63a" stroke-width="2.6" stroke-linejoin="round"/>
  <path d="M 50 20 Q 55 27 52 32 Q 50 35 48 32 Q 45 27 50 20 Z" fill="#fff4cf"/>
  <rect x="38" y="38" width="24" height="58" rx="8" fill="#f7dbe8" stroke="#c98da8" stroke-width="3"/>
  <path d="M 38 54 q 12 7 24 0 M 38 70 q 12 7 24 0" fill="none" stroke="#f4a8c6" stroke-width="3.4" stroke-linecap="round"/>
</svg>`,

  leaf: i => {
    const tones = [['#e08a3c', '#8a4a20'], ['#c96a2c', '#7a3a18'], ['#e3ae4c', '#96682a'],
                   ['#d2762f', '#82401c'], ['#b5552a', '#6e3216']];
    const [fill, edge] = tones[i % tones.length];
    return `
<svg viewBox="0 0 100 110" width="100%" height="100%" aria-hidden="true">
  <path d="M 50 8 C 82 26 86 62 50 98 C 14 62 18 26 50 8 Z"
        fill="${fill}" stroke="${edge}" stroke-width="3" stroke-linejoin="round"/>
  <path d="M 50 14 L 50 94" stroke="${edge}" stroke-width="3" stroke-linecap="round"/>
  <path d="M 50 34 L 30 30 M 50 34 L 70 30 M 50 54 L 26 52 M 50 54 L 74 52 M 50 74 L 34 74 M 50 74 L 66 74"
        stroke="${edge}" stroke-width="2.4" stroke-linecap="round" opacity=".7"/>
</svg>`;
  },

  ornament: i => {
    const balls = [['#e2566f', '#a23b50'], ['#5fa97a', '#3d7a56'], ['#6fb3d9', '#3f7d9e'],
                   ['#c9a3e0', '#8a6fa8'], ['#f7b955', '#c98d34']];
    const [fill, edge] = balls[i % balls.length];
    return `
<svg viewBox="0 0 100 110" width="100%" height="100%" aria-hidden="true">
  <path d="M 50 4 Q 50 14 50 18" stroke="#b9a68f" stroke-width="3" stroke-linecap="round"/>
  <rect x="42" y="16" width="16" height="10" rx="4" fill="#e8d3ba" stroke="#a5875f" stroke-width="2.4"/>
  <circle cx="50" cy="62" r="34" fill="${fill}" stroke="${edge}" stroke-width="3"/>
  <path d="M 18 54 Q 50 44 82 54" fill="none" stroke="#ffe08a" stroke-width="5" stroke-linecap="round"/>
  <path d="M 20 74 Q 50 84 80 74" fill="none" stroke="#ffe08a" stroke-width="5" stroke-linecap="round"/>
  <ellipse cx="38" cy="48" rx="7" ry="5" fill="#fff" opacity=".45"/>
</svg>`;
  },

  firework: `
<svg viewBox="0 0 100 110" width="100%" height="100%" aria-hidden="true">
  <path d="M 50 62 L 50 100" stroke="#8a7f74" stroke-width="4" stroke-linecap="round"/>
  <circle cx="50" cy="50" r="10" fill="#ffe98a"/>
  ${[0, 45, 90, 135, 180, 225, 270, 315].map(a => {
    const r = Math.PI * a / 180;
    const x1 = 50 + Math.cos(r) * 16, y1 = 50 + Math.sin(r) * 16;
    const x2 = 50 + Math.cos(r) * 34, y2 = 50 + Math.sin(r) * 34;
    return `<path d="M ${x1.toFixed(1)} ${y1.toFixed(1)} L ${x2.toFixed(1)} ${y2.toFixed(1)}"
              stroke="#ffd35c" stroke-width="4" stroke-linecap="round"/>
            <circle cx="${x2.toFixed(1)}" cy="${y2.toFixed(1)}" r="3.4" fill="#fff4cf"/>`;
  }).join('')}
</svg>`,

  egg: i => {
    const shells = [
      ['#a8d8ea', '#4f7f9b'], ['#f4a8c6', '#b3596e'], ['#ffe08a', '#c9922c'],
      ['#b9e3c0', '#4f9b6d'], ['#c9a3e0', '#8a6fa8'],
    ];
    const bands = ['#fdf2f6', '#f4a8c6', '#ffe08a', '#a8d8ea', '#fff'];
    const [fill, edge] = shells[i % shells.length];
    const b1 = bands[(i + 1) % bands.length], b2 = bands[(i + 3) % bands.length];
    return `
<svg viewBox="0 0 100 110" width="100%" height="100%" aria-hidden="true">
  <ellipse cx="50" cy="58" rx="34" ry="44" fill="${fill}" stroke="${edge}" stroke-width="3"/>
  <path d="M 17 50 q 33 12 66 0" fill="none" stroke="${b1}" stroke-width="7"/>
  <path d="M 19 70 q 31 12 62 0" fill="none" stroke="${b2}" stroke-width="7"/>
  <path d="M 24 34 q 26 10 52 0" fill="none" stroke="${b1}" stroke-width="6"/>
  ${[[36, 60], [50, 66], [64, 60]].map(([x, y]) =>
    `<circle cx="${x}" cy="${y}" r="3.4" fill="#fff" opacity=".8"/>`).join('')}
</svg>`;
  },
};

function nothingOn() {
  const next = events.upcoming()[0];
  return el('div', { class: 'card center stack' },
    el('div', { style: { fontSize: '2.4rem' }, text: '\u{1F5D3}️' }),
    el('h2', { text: 'No event right now' }),
    el('p', { class: 'muted', text: next ? whenText(next) : 'Check back another time.' }),
    button('Go home', { cls: 'btn btn-primary', onClick: () => navigate('/') })
  );
}

const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June',
                'July', 'August', 'September', 'October', 'November', 'December'];
export const monthName = m => MONTHS[m - 1] || '';

/* Never read event.from directly: the birthday has no fixed dates, it is
   worked out from the parent setting. windowOf() is the only way to ask. */
export function whenText(event) {
  const [from, to] = events.windowOf(event);
  const span = `${monthName(from[0])} ${from[1]} \u2013 ${monthName(to[0])} ${to[1]}`;
  if (!event.year) return `${event.emoji} ${event.name}: ${span}, every year`;
  // A window that runs over the turn of the year ends in the year after.
  const wraps = (to[0] * 100 + to[1]) < (from[0] * 100 + from[1]);
  const years = wraps ? `${event.year}\u2013${event.year + 1}` : String(event.year);
  return `${event.emoji} ${event.name}: ${span}, ${years}`;
}
