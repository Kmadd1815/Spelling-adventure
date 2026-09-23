/* Word Builder.

   The word's letters, jumbled, and a row of empty spaces to put them in.

   Every other game here starts from a blank and a keyboard, which is the
   hardest way to produce a word and the one a child stalls on. This one
   starts from the letters. She is not being asked what the letters are —
   they are on the table in front of her — she is being asked what ORDER
   they go in, which is a different and much smaller question, and the one
   that most spelling mistakes are actually about.

   That makes it the gentlest game in the set, which is the point: it is
   the one to play on a bad day, on a brand new list, or on the word that
   keeps going wrong. It cannot move mastery, because having the letters
   handed to you is not spelling from memory.
*/

import { el, mount, clear, button } from '../ui/dom.js';
import { gameHeader } from '../screens/play.js';
import { createBuddy } from '../ui/buddy.js';
import * as speech from '../core/speech.js';
import { gameWords } from '../core/games.js';

const WANT_WORDS = 5;
const TRIES = 2;            // then it builds the word for her and moves on

/**
 * The letters of a word, shuffled — and never left in the order they
 * started in, because a word that comes up already built is not a puzzle,
 * it is a button that says Check.
 */
export function jumble(text) {
  const letters = String(text || '').toLowerCase().split('');
  if (letters.length < 2) return letters;
  /* If every letter is the same there is nothing to shuffle, and looking
     for a different order would spin forever. */
  if (new Set(letters).size === 1) return letters;
  let out = letters.slice();
  for (let attempt = 0; attempt < 50; attempt++) {
    for (let i = out.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [out[i], out[j]] = [out[j], out[i]];
    }
    if (out.join('') !== letters.join('')) return out;
  }
  /* Fifty shuffles all came back the same: swap the first two and stop. */
  out = letters.slice();
  [out[0], out[1]] = [out[1], out[0]];
  return out;
}

export default function wordBuilder(ctx) {
  const picked = gameWords(WANT_WORDS, { minLength: 3 });

  if (picked.length < 2) {
    return mount(ctx.stage, el('div', { class: 'card center stack' },
      el('h2', { text: 'Not quite enough words' }),
      el('p', { class: 'muted', text:
        'Word Builder needs a few words of three letters or more. A grown-up can add them in My Words.' }),
      button('Back to games', { cls: 'btn btn-primary', onClick: ctx.quit })
    ));
  }

  const buddy = createBuddy({ layout: 'side', greeting: 'Put them in order!' });
  ctx.onCleanup(() => buddy.stop());

  const timers = [];
  const wait = (fn, ms) => { const t = setTimeout(fn, ms); timers.push(t); return t; };
  ctx.onCleanup(() => timers.forEach(clearTimeout));

  let index = 0;
  let tries = 0;
  let locked = false;
  let won = 0;
  const missed = [];

  /* tray: one entry per letter, `used` when it is sitting in a slot.
     slots: one per letter of the word, holding a tray index or null. */
  let tray = [];
  let slots = [];

  const pips     = el('div', { class: 'spell-progress' });
  const helpRow  = el('div', { class: 'row', style: { justifyContent: 'center' } });
  const slotRow  = el('div', { class: 'build-slots' });
  const trayRow  = el('div', { class: 'build-tray' });
  const hintNode = el('div', { class: 'build-hint' });

  const body = el('div', { class: 'game-body build-wrap' },
    el('div', { class: 'build-col' }, pips, helpRow, slotRow, hintNode, trayRow),
    el('div', { class: 'build-side' }, buddy.node)
  );

  mount(ctx.stage, gameHeader('Word Builder', { onQuit: ctx.quit }), body);

  const current = () => picked[index];
  const built = () => slots.map(i => (i === null ? '' : tray[i].ch)).join('');
  const full = () => slots.every(i => i !== null);

  function renderPips() {
    clear(pips);
    picked.forEach((_, i) => {
      let cls = 'pip';
      if (i < index) cls += missed.includes(picked[i]) ? ' miss' : ' hit';
      else if (i === index) cls += ' current';
      pips.append(el('div', { class: cls }));
    });
  }

  function renderSlots(state = 'building') {
    clear(slotRow);
    slots.forEach((t, pos) => {
      const filled = t !== null;
      let cls = 'build-slot';
      if (filled) cls += ' filled';
      if (state === 'good') cls += ' good';
      if (state === 'bad') cls += ' bad';
      slotRow.append(el('button', {
        class: cls, type: 'button',
        'aria-label': filled ? `Take back ${tray[t].ch}` : 'Empty space',
        onClick: () => takeBack(pos),
      }, filled ? tray[t].ch : ''));
    });
  }

  function renderTray() {
    clear(trayRow);
    tray.forEach((t, i) => {
      trayRow.append(el('button', {
        class: `build-block${t.used ? ' used' : ''}`, type: 'button',
        'aria-label': `Letter ${t.ch}`,
        onClick: () => place(i),
      }, t.ch));
    });
  }

  function show() {
    const word = current();
    tries = 0;
    locked = false;
    tray = jumble(word.text).map(ch => ({ ch, used: false }));
    slots = tray.map(() => null);
    hintNode.textContent = (word.definition || '').trim();
    renderPips();
    renderSlots();
    renderTray();

    mount(helpRow,
      speech.canSpeak()
        ? el('button', { class: 'speak-btn speak-btn-sm', type: 'button',
            'aria-label': 'Hear the word', onClick: () => speech.speakWord(word) }, '\u{1F50A}')
        : null,
      speech.canSpeak()
        ? button('Again, slower', { cls: 'btn btn-quiet', emoji: '\u{1F422}',
            onClick: () => speech.speakWordSlowly(word) })
        : null
    );
    if (speech.canSpeak()) wait(() => speech.speakWord(word), 260);
  }

  /* ---------- Moving letters ---------- */
  function place(i) {
    if (locked || tray[i].used) return;
    const pos = slots.indexOf(null);
    if (pos < 0) return;
    slots[pos] = i;
    tray[i].used = true;
    renderSlots();
    renderTray();
    /* Checked as soon as the last space is filled: asking a child to press
       a separate Check button when there is nothing else she could do is
       one tap of nothing. */
    if (full()) wait(check, 260);
  }

  function takeBack(pos) {
    if (locked || slots[pos] === null) return;
    tray[slots[pos]].used = false;
    slots[pos] = null;
    renderSlots();
    renderTray();
  }

  function clearSlots() {
    slots.forEach(t => { if (t !== null) tray[t].used = false; });
    slots = slots.map(() => null);
    renderSlots();
    renderTray();
  }

  /* ---------- Checking ---------- */
  function check() {
    if (locked || !full()) return;
    const word = current();
    const right = built() === word.text.trim().toLowerCase();

    if (right) {
      locked = true;
      renderSlots('good');
      ctx.record(word, tries === 0);
      if (tries === 0) won += 1; else missed.push(word);
      buddy.say(tries === 0 ? 'Built it!' : 'There it is!');
      wait(next, 1000);
      return;
    }

    tries += 1;
    renderSlots('bad');
    slotRow.classList.add('shake');
    wait(() => slotRow.classList.remove('shake'), 420);

    if (tries >= TRIES) {
      locked = true;
      ctx.record(word, false);
      missed.push(word);
      buddy.say('Watch — it goes like this.');
      wait(buildItForHer, 500);
      return;
    }

    buddy.say('Close! Try a different order.');
    wait(() => { if (!locked) { clearSlots(); } }, 460);
  }

  /* Rather than printing the answer, put the blocks into place one at a
     time with a beat between them. She watches the word get built, which
     is the same thing her hands would have done. */
  function buildItForHer() {
    const word = current();
    const want = word.text.trim().toLowerCase().split('');
    clearSlots();
    want.forEach((ch, pos) => {
      wait(() => {
        const i = tray.findIndex(t => !t.used && t.ch === ch);
        if (i < 0) return;
        tray[i].used = true;
        slots[pos] = i;
        renderSlots(pos === want.length - 1 ? 'good' : 'building');
        renderTray();
      }, 260 * (pos + 1));
    });
    wait(next, 260 * (want.length + 1) + 1100);
  }

  function next() {
    index += 1;
    if (index >= picked.length) return done();
    show();
  }

  function done() {
    renderPips();
    const clean = won === picked.length;
    ctx.finish({
      wordsWon: won,
      wordsPlayed: picked.length,
      bonus: clean,
      bonusLabel: 'Built every one',
      headline: clean ? 'Every word built!' : 'Good building!',
      detail: `${won} of ${picked.length} on the first try`,
      emoji: '\u{1F9F1}',
      missed,
      celebrate: clean,
    });
  }

  show();
}
