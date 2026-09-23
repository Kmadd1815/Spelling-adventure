/* Fill the Gap.

   The sentence her word came with, minus the word. She reads it and spells
   what belongs in the hole.

   This is the only game in here that can teach a homophone, and homophones
   are the reason it exists. "Their" and "there" sound exactly the same, so
   no amount of hearing them tells her which one to write — the only thing
   that does is the sentence around the gap. Every other game says the word
   and asks for the letters, which for a homophone is a coin toss.

   The speaker reads the sentence with a PAUSE where the word goes, never
   the word itself, for the same reason the crossword reads the clue and not
   the answer. A second button will say the word if she is stuck; on a
   homophone that gives nothing away, and on anything else it is the same
   help every other game gives for free.

   Words whose sentence does not actually contain them fall back to their
   definition. That sounds like a nicety and is not: "We painted the fence"
   as the sentence for "paint" would otherwise be shown with nothing blanked
   out, which is to say with the answer written across the top of it.
*/

import { el, mount, clear, button } from '../ui/dom.js';
import { gameHeader } from '../screens/play.js';
import { buildKeyboard, watchPhysicalKeyboard } from '../ui/keyboard.js';
import { createBuddy } from '../ui/buddy.js';
import * as speech from '../core/speech.js';
import { gameWords } from '../core/games.js';

const WANT_WORDS = 5;
const TRIES = 2;            // then it shows her and moves on
/* A solid low bar rather than underscores. Underscores sit on the baseline
   and a child reads them as letters she cannot quite make out; a continuous
   rule reads as a hole to put something in. */
const GAP = '\u2581\u2581\u2581\u2581\u2581';

/* A whole-word match, so "paint" does not blank the "paint" inside
   "painting" and leave her spelling half a word. */
const wholeWord = text =>
  new RegExp(`(^|[^a-z'])(${text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})(?=[^a-z']|$)`, 'i');

/**
 * The sentence with the word taken out, or null when the word is not in it.
 * Null matters: a sentence that does not contain its word cannot be gapped,
 * and showing it ungapped would be showing her the answer.
 */
export function gapSentence(word) {
  const sentence = (word.sentence || '').trim();
  if (!sentence) return null;
  const re = wholeWord(word.text.trim());
  if (!re.test(sentence)) return null;
  return sentence.replace(new RegExp(re.source, 'ig'), (_m, before) => `${before}${GAP}`);
}

/** What she is shown for this word: a gapped sentence, or its meaning. */
function clueFor(word) {
  const gapped = gapSentence(word);
  if (gapped) return { kind: 'sentence', text: gapped };
  const def = (word.definition || '').trim();
  if (def) return { kind: 'meaning', text: def };
  return null;
}

export default function fillGap(ctx) {
  const picked = gameWords(WANT_WORDS, { needsClue: true })
    .map(w => ({ word: w, clue: clueFor(w) }))
    .filter(x => x.clue);

  if (picked.length < 2) {
    return mount(ctx.stage, el('div', { class: 'card center stack' },
      el('h2', { text: 'Not enough sentences yet' }),
      el('p', { class: 'muted', text:
        'Fill the Gap needs a few words with an example sentence. A grown-up can add them in My Words — they help most with words like their, there and they’re.' }),
      button('Back to games', { cls: 'btn btn-primary', onClick: ctx.quit })
    ));
  }

  const buddy = createBuddy({ layout: 'side', greeting: 'What goes in the hole?' });
  ctx.onCleanup(() => buddy.stop());

  const timers = [];
  const wait = (fn, ms) => { const t = setTimeout(fn, ms); timers.push(t); return t; };
  ctx.onCleanup(() => timers.forEach(clearTimeout));

  let index = 0;
  let typed = '';
  let tries = 0;
  let locked = false;
  let won = 0;
  const missed = [];

  /* ---------- Layout ---------- */
  const clueNode = el('div', { class: 'gap-clue' });
  const kindNode = el('div', { class: 'muted tiny center' });
  const tiles    = el('div', { class: 'answer-tiles answer-tiles-sm' });
  const helpRow  = el('div', { class: 'row', style: { justifyContent: 'center' } });
  const pips     = el('div', { class: 'spell-progress' });
  const keyboard = el('div', { class: 'keyboard keyboard-sm' });

  const body = el('div', { class: 'game-body gap-wrap' },
    el('div', { class: 'gap-col' }, pips, clueNode, kindNode, helpRow, tiles),
    el('div', { class: 'gap-side' }, buddy.node)
  );

  mount(ctx.stage, gameHeader('Fill the Gap', { onQuit: ctx.quit }), body, keyboard);

  const current = () => picked[index];

  function renderPips() {
    clear(pips);
    picked.forEach((_, i) => {
      let cls = 'pip';
      if (i < index) cls += missed.includes(picked[i].word) ? ' miss' : ' hit';
      else if (i === index) cls += ' current';
      pips.append(el('div', { class: cls }));
    });
  }

  function renderTiles(state = 'typing') {
    clear(tiles);
    typed.split('').forEach(ch => {
      let cls = 'tile';
      if (state === 'good') cls += ' good';
      if (state === 'bad') cls += ' bad';
      tiles.append(el('div', { class: cls, text: ch }));
    });
    if (state === 'typing') tiles.append(el('div', { class: 'tile empty caret' }));
  }

  function show() {
    const { word, clue } = current();
    typed = '';
    tries = 0;
    locked = false;
    renderPips();
    renderTiles();

    clueNode.className = `gap-clue gap-${clue.kind}`;
    clueNode.textContent = clue.kind === 'meaning' ? `“${clue.text}”` : clue.text;
    kindNode.textContent = clue.kind === 'meaning'
      ? 'Which word means this?'
      : 'What belongs in the gap?';

    mount(helpRow,
      /* The sentence, with a pause where the word goes. Never the word. */
      speech.canSpeak()
        ? el('button', { class: 'speak-btn speak-btn-sm', type: 'button',
            'aria-label': 'Hear the sentence', onClick: sayClue }, '\u{1F50A}')
        : null,
      speech.canSpeak()
        ? button('Say the word', { cls: 'btn btn-quiet', emoji: '\u{1F4AC}',
            onClick: () => speech.speakWord(word) })
        : null
    );
    if (speech.canSpeak()) wait(sayClue, 260);
  }

  function sayClue() {
    const { word, clue } = current();
    if (clue.kind === 'meaning') { speech.speak(word.definition); return; }
    /* Read around the hole: the pause IS the question. */
    speech.speak(clue.text.replace(new RegExp(GAP, 'g'), ' … '));
  }

  /* ---------- Checking ---------- */
  function typeLetter(ch) {
    if (locked || typed.length >= 20) return;
    typed += ch.toLowerCase();
    renderTiles();
  }
  function backspace() {
    if (locked || !typed) return;
    typed = typed.slice(0, -1);
    renderTiles();
  }

  function submit() {
    if (locked || !typed) return;
    const { word } = current();
    const right = typed.trim().toLowerCase() === word.text.trim().toLowerCase();

    if (right) {
      locked = true;
      renderTiles('good');
      /* Only a first-try answer counts as knowing it. */
      ctx.record(word, tries === 0);
      if (tries === 0) won += 1; else missed.push(word);
      buddy.say(tries === 0 ? 'That is the one!' : 'Got there!');
      wait(next, 900);
      return;
    }

    tries += 1;
    renderTiles('bad');
    tiles.classList.add('shake');
    wait(() => tiles.classList.remove('shake'), 420);

    if (tries >= TRIES) {
      locked = true;
      ctx.record(word, false);
      missed.push(word);
      /* Show her the answer in the gap rather than just moving on. Seeing
         the whole sentence put right is the part that teaches. */
      const { clue } = current();
      clueNode.textContent = clue.kind === 'meaning'
        ? `“${clue.text}” — ${word.text}`
        : clue.text.replace(new RegExp(GAP, 'g'), word.text);
      clueNode.classList.add('gap-revealed');
      kindNode.textContent = 'That one was tricky — here it is.';
      buddy.say('Now you know it.');
      wait(next, 2400);
      return;
    }

    typed = '';
    wait(() => { if (!locked) renderTiles(); }, 420);
  }

  function next() {
    index += 1;
    clueNode.classList.remove('gap-revealed');
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
      bonusLabel: 'Every gap filled',
      headline: clean ? 'Every single gap!' : 'Gaps filled!',
      detail: `${won} of ${picked.length} on the first try`,
      emoji: '\u{1F4DD}',
      missed,
      celebrate: clean,
    });
  }

  buildKeyboard(keyboard, {
    onLetter: typeLetter, onBackspace: backspace, onEnter: submit, enterLabel: 'Check',
  });
  ctx.onCleanup(watchPhysicalKeyboard({
    onLetter: typeLetter, onBackspace: backspace, onEnter: submit,
    isLocked: () => locked,
  }));

  show();
}
