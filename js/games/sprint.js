/* Sixty-Second Sprint.

   As many words as she can spell in a minute.

   Every other game here is untimed on purpose — a child who is counting
   seconds is not thinking about spelling — so this one needs a reason to
   exist, and it has one. A word she can spell with all the time in the
   world is not yet a word she KNOWS; the ones she knows come out without
   being assembled. The clock is not there to make it harder, it is there to
   tell the difference, and it tells her too: the words she rattles off and
   the words she stalls on are visibly different for once.

   So it is deliberately the lightest game in the set. It cannot move
   mastery — under a clock a child guesses, and a guess that lands is not
   knowledge. It never punishes a miss: the right spelling appears for a
   beat and the next word is already there. And there is a Skip, because
   the alternative under a clock is a child stuck on one word watching her
   own time run out, which is nobody's idea of a game.
*/

import { el, mount, clear, button } from '../ui/dom.js';
import { gameHeader } from '../screens/play.js';
import { buildKeyboard, watchPhysicalKeyboard } from '../ui/keyboard.js';
import { createBuddy } from '../ui/buddy.js';
import * as speech from '../core/speech.js';
import { gameWords } from '../core/games.js';

const SECONDS = 60;
const TICK = 100;
const SHOW_RIGHT = 420;     // a beat on a hit, so it feels like it landed
const SHOW_WRONG = 1300;    // longer on a miss: the right spelling is up
const GOOD_RUN = 8;         // words in a minute worth a bonus

/** The pool, round and round: a minute is longer than most spelling lists. */
function* wordCycle(pool) {
  let deck = [];
  for (;;) {
    if (!deck.length) {
      deck = pool.slice();
      for (let i = deck.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [deck[i], deck[j]] = [deck[j], deck[i]];
      }
    }
    yield deck.pop();
  }
}

export default function sprint(ctx) {
  const pool = gameWords(40);

  if (pool.length < 1) {
    return mount(ctx.stage, el('div', { class: 'card center stack' },
      el('h2', { text: 'No words yet' }),
      el('p', { class: 'muted', text: 'A grown-up can add a spelling list in My Words.' }),
      button('Back to games', { cls: 'btn btn-primary', onClick: ctx.quit })
    ));
  }

  const buddy = createBuddy({ layout: 'side', greeting: 'Ready… go!' });
  ctx.onCleanup(() => buddy.stop());

  const timers = [];
  const wait = (fn, ms) => { const t = setTimeout(fn, ms); timers.push(t); return t; };
  ctx.onCleanup(() => timers.forEach(clearTimeout));

  const deck = wordCycle(pool);
  let word = null;
  let typed = '';
  let locked = false;
  let over = false;
  let won = 0;
  let played = 0;
  const missed = [];

  /* ---------- Layout ---------- */
  const bar      = el('div', { class: 'sprint-bar-fill' });
  const clock    = el('div', { class: 'sprint-clock' });
  const score    = el('div', { class: 'sprint-score' });
  const tiles    = el('div', { class: 'answer-tiles' });
  const answer   = el('div', { class: 'sprint-answer' });
  const helpRow  = el('div', { class: 'row', style: { justifyContent: 'center' } });
  const keyboard = el('div', { class: 'keyboard keyboard-sm' });

  const body = el('div', { class: 'game-body sprint-wrap' },
    el('div', { class: 'sprint-col' },
      el('div', { class: 'sprint-top' },
        clock,
        el('div', { class: 'sprint-bar' }, bar),
        score),
      helpRow, tiles, answer),
    el('div', { class: 'sprint-side' }, buddy.node)
  );

  mount(ctx.stage, gameHeader('Sixty-Second Sprint', { onQuit: ctx.quit }), body, keyboard);

  /* ---------- The clock ---------- */
  let left = SECONDS * 1000;
  const clockTick = setInterval(() => {
    left -= TICK;
    if (left <= 0) { left = 0; renderClock(); return finish(); }
    renderClock();
  }, TICK);
  ctx.onCleanup(() => clearInterval(clockTick));

  let calledTen = false;
  function renderClock() {
    const secs = Math.ceil(left / 1000);
    clock.textContent = `${secs}s`;
    /* One call, at ten seconds. A buddy who counts every second down is a
       buddy a child stops being able to think next to. */
    if (secs === 10 && !calledTen) { calledTen = true; buddy.say('Ten seconds!'); }
    clock.classList.toggle('low', secs <= 10);
    bar.style.width = `${(left / (SECONDS * 1000)) * 100}%`;
    bar.classList.toggle('low', secs <= 10);
  }

  function renderScore() {
    score.textContent = `✓ ${won}`;
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

  function nextWord() {
    if (over) return;
    word = deck.next().value;
    typed = '';
    locked = false;
    answer.textContent = '';
    answer.className = 'sprint-answer';
    renderTiles();
    mount(helpRow,
      speech.canSpeak()
        ? el('button', { class: 'speak-btn speak-btn-sm', type: 'button',
            'aria-label': 'Hear the word again', onClick: () => speech.speakWord(word) }, '\u{1F50A}')
        : el('div', { class: 'sprint-said', text: word.text }),
      button('Skip', { cls: 'btn btn-quiet', emoji: '\u{23ED}', onClick: skip })
    );
    if (speech.canSpeak()) speech.speakWord(word);
  }

  /* ---------- Typing ---------- */
  function typeLetter(ch) {
    if (locked || over || typed.length >= 20) return;
    typed += ch.toLowerCase();
    renderTiles();
  }
  function backspace() {
    if (locked || over || !typed) return;
    typed = typed.slice(0, -1);
    renderTiles();
  }

  function submit() {
    if (locked || over || !typed) return;
    locked = true;
    played += 1;
    const right = typed.trim().toLowerCase() === word.text.trim().toLowerCase();
    ctx.record(word, right);

    if (right) {
      won += 1;
      renderScore();
      renderTiles('good');
      if (won % 3 === 0) buddy.say(['Go go go!', 'You are flying!', 'Keep going!'][(won / 3 - 1) % 3]);
      answer.textContent = '✓';
      answer.className = 'sprint-answer good';
      wait(nextWord, SHOW_RIGHT);
    } else {
      if (!missed.includes(word)) missed.push(word);
      renderTiles('bad');
      answer.textContent = word.text;
      answer.className = 'sprint-answer bad';
      wait(nextWord, SHOW_WRONG);
    }
  }

  /* Skipping is not getting it wrong. Nothing is recorded against the word:
     under a clock, "I would rather come back to that" is a sensible thing
     for a child to decide and a silly thing to be marked down for. */
  function skip() {
    if (over) return;
    locked = false;
    typed = '';
    nextWord();
  }

  /* ---------- The whistle ---------- */
  function finish() {
    if (over) return;
    over = true;
    locked = true;
    clearInterval(clockTick);
    const great = won >= GOOD_RUN;
    ctx.finish({
      wordsWon: won,
      wordsPlayed: Math.max(played, won),
      bonus: great,
      bonusLabel: `${GOOD_RUN} or more in a minute`,
      headline: won === 0 ? 'Time!' : `${won} ${won === 1 ? 'word' : 'words'} in a minute!`,
      detail: great ? 'That is a fast minute.' : 'Have another go and beat it.',
      emoji: '\u{23F1}',
      missed,
      celebrate: great,
    });
  }

  buildKeyboard(keyboard, {
    onLetter: typeLetter, onBackspace: backspace, onEnter: submit, enterLabel: 'Go',
  });
  ctx.onCleanup(watchPhysicalKeyboard({
    onLetter: typeLetter, onBackspace: backspace, onEnter: submit,
    isLocked: () => locked || over,
  }));

  renderClock();
  renderScore();
  nextWord();
}
