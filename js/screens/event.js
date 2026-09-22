/* The Haunted Spelling Hunt — and the frame any later event will reuse.

   Ghosts have got lost in the dark. She taps one, hears a word, and spells
   it; the ghost lights up and drifts off home, and the lantern at the top
   fills a little more. Cross a threshold and something is hers for good.

   Nothing here is scary. The ghosts are round and smiling, they are lost
   rather than haunting, and getting a word wrong means the ghost waits a
   moment and moves somewhere else — never that anything is lost.
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

  const buddy = createBuddy({ layout: 'voice', greeting: 'Tap a ghost and help it home!' });
  const timers = [];
  const wait = (fn, ms) => { timers.push(setTimeout(fn, ms)); };

  const track   = el('div', { class: 'ev-track' });
  const field   = el('div', { class: 'ev-field' });
  const tiles   = el('div', { class: 'answer-tiles answer-tiles-sm' });
  const spellBox = el('div', { class: 'ev-spell', hidden: true });
  const keyboard = el('div', { class: 'keyboard keyboard-sm' });

  const body = el('div', { class: 'game-body ev-wrap scene-haunted' },
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

  const ghosts = queue.map((word, i) => ({
    word, i, home: false,
    x: 12 + (i % 3) * 30 + Math.random() * 10,
    y: 16 + Math.floor(i / 3) * 36 + Math.random() * 12,
  }));
  let active = null;
  let typed = '';
  let busy = false;
  let sentHome = 0;
  const missed = [];

  /* ---------- Drawing ---------- */

  function drawTrack() {
    const { count } = events.progress(event.id);
    const next = events.nextReward(event);
    clear(track);

    track.append(el('div', { class: 'ev-count' },
      el('span', { class: 'ev-count-n', text: String(count) }),
      el('span', { class: 'tiny', text: ` ${count === 1 ? event.unitOne : event.unitMany} helped home` })
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
    ghosts.forEach(g => {
      if (g.home) return;
      const node = el('button', {
        class: `ev-ghost${active === g ? ' ev-ghost-on' : ''}`,
        type: 'button',
        style: { left: `${g.x}%`, top: `${g.y}%`, animationDelay: `${(g.i % 5) * 0.4}s` },
        'aria-label': 'A lost ghost',
        onClick: () => pick(g),
      }, el('span', { class: 'ev-ghost-art', html: GHOST_SVG }));
      field.append(node);
    });

    if (ghosts.every(g => g.home)) {
      field.append(el('div', { class: 'ev-clear center' },
        el('div', { style: { fontSize: '2rem' }, text: '\u{1F31F}' }),
        el('div', { text: 'Every ghost is home!' })
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
    recordAttempt(g.word.id, right, { countsForMastery: event.canMaster && right });

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

      if (result.earned.length) wait(() => showPrize(result.earned), 700);

      wait(() => {
        busy = false;
        active = null;
        spellBox.hidden = true;
        clear(spellBox);
        drawField();
        if (ghosts.every(x => x.home)) finish();
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

    // The ghost drifts somewhere new and waits. Nothing is lost.
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
      el('div', { class: 'tiny muted', text: 'It is yours to keep, even after Halloween.' })
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
        el('h2', { text: sentHome === ghosts.length ? 'Every ghost is home!' : 'Good hunting!' }),
        el('p', { class: 'muted', text:
          `${sentHome} of ${ghosts.length} ${ghosts.length === 1 ? event.unitOne : event.unitMany} this round` +
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
          text: 'The first hunt each day earns the most — but the ghosts still need helping.' }) : null
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
      button('Hunt again', { cls: 'btn btn-green grow', emoji: '\u{1F50E}', onClick: rerender }),
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

/* A ghost that is lost, not haunting: round, smiling, and pleased to see
   her. Drawn once here rather than sitting in the item catalogue, because
   it is scenery rather than something she can own. */
const GHOST_SVG = `
<svg viewBox="0 0 100 110" width="100%" height="100%" aria-hidden="true">
  <path d="M 50 10 Q 80 10 80 44 L 80 92 Q 72 82 64 92 Q 56 82 50 92 Q 44 82 36 92 Q 28 82 20 92 L 20 44 Q 20 10 50 10 Z"
        fill="#fbf7f2" stroke="#b9b0c4" stroke-width="3" stroke-linejoin="round"/>
  <ellipse cx="40" cy="42" rx="4.6" ry="5.8" fill="#4a3b52"/>
  <ellipse cx="60" cy="42" rx="4.6" ry="5.8" fill="#4a3b52"/>
  <ellipse cx="31" cy="54" rx="5.4" ry="3.6" fill="#f4b8c6" opacity=".75"/>
  <ellipse cx="69" cy="54" rx="5.4" ry="3.6" fill="#f4b8c6" opacity=".75"/>
  <path d="M 43 55 Q 50 62 57 55" fill="none" stroke="#4a3b52" stroke-width="3" stroke-linecap="round"/>
</svg>`;

function nothingOn() {
  const next = events.upcoming()[0];
  return el('div', { class: 'card center stack' },
    el('div', { style: { fontSize: '2.4rem' }, text: '\u{1F5D3}️' }),
    el('h2', { text: 'No event right now' }),
    el('p', { class: 'muted', text: next
      ? `${next.emoji} ${next.name} starts on ${monthName(next.from[0])} ${next.from[1]}.`
      : 'Check back another time.' }),
    button('Go home', { cls: 'btn btn-primary', onClick: () => navigate('/') })
  );
}

const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June',
                'July', 'August', 'September', 'October', 'November', 'December'];
export const monthName = m => MONTHS[m - 1] || '';
