/* Tic Tac Toe against the axolotl.

   Her turn: pick a square, hear a word, spell it. Spell it right and the
   square is hers; miss it and the turn passes — which is the version she
   already knows how to play.

   The axolotl takes its turn the same way, and sometimes fumbles its own
   word and loses a turn. That is deliberate: it makes the game winnable by
   a third grader, and it quietly says that everybody gets words wrong.
   The axolotl is never smug about winning and never sad about losing.

   She hears the word and spells the whole thing from memory, so this game
   can add to a mastery streak.
*/

import { el, mount, clear, button } from '../ui/dom.js';
import { gameHeader } from '../screens/play.js';
import { createBuddy } from '../ui/buddy.js';
import { buildKeyboard, watchPhysicalKeyboard } from '../ui/keyboard.js';
import * as speech from '../core/speech.js';
import * as words from '../core/words.js';
import { gameWords } from '../core/games.js';

const LINES = [
  [0, 1, 2], [3, 4, 5], [6, 7, 8],
  [0, 3, 6], [1, 4, 7], [2, 5, 8],
  [0, 4, 8], [2, 4, 6],
];

const HER = 'her';
const PET = 'pet';
const FUMBLE_CHANCE = 0.28;     // how often the axolotl misspells its own word
const SMART_CHANCE  = 0.6;      // how often it plays the clever square

export default function ticTacToe(ctx) {
  const pool = gameWords(12, { minLength: 2 });
  if (pool.length < 3) {
    return mount(ctx.stage, el('div', { class: 'card center stack' },
      el('h2', { text: 'Not enough words yet' }),
      el('p', { class: 'muted', text: 'This game needs a few spelling words to play with.' }),
      button('Back to games', { cls: 'btn btn-primary', onClick: ctx.quit })
    ));
  }

  const buddy = createBuddy({ layout: 'side', greeting: 'You go first!' });
  ctx.onCleanup(() => buddy.stop());

  /* ---------- State ---------- */

  const board = Array(9).fill(null);
  let wordAt = 0;
  let turn = HER;
  let pendingSquare = null;      // the square she is spelling for
  let typed = '';
  let busy = false;              // the axolotl is thinking, or feedback is up
  let wordsWon = 0;
  let wordsTried = 0;
  const missed = [];
  const timers = [];

  const wait = (fn, ms) => { const t = setTimeout(fn, ms); timers.push(t); return t; };
  ctx.onCleanup(() => timers.forEach(clearTimeout));

  /* ---------- Layout ---------- */

  const boardNode = el('div', { class: 'ttt-board' });
  const status    = el('div', { class: 'ttt-status' });
  const tiles     = el('div', { class: 'answer-tiles answer-tiles-sm' });
  const spellBox  = el('div', { class: 'ttt-spell', hidden: true });
  const keyboard  = el('div', { class: 'keyboard keyboard-sm' });

  const body = el('div', { class: 'game-body ttt-wrap' },
    el('div', { class: 'ttt-board-col' }, status, boardNode, spellBox),
    el('div', { class: 'ttt-side' }, buddy.node)
  );

  mount(ctx.stage, gameHeader('Tic Tac Toe', { onQuit: ctx.quit }), body, keyboard);

  /* ---------- Drawing ---------- */

  function drawBoard(winningLine = null) {
    clear(boardNode);
    board.forEach((mark, i) => {
      const mine = mark === HER;
      const node = el('button', {
        class: `ttt-cell${mark ? (mine ? ' ttt-her' : ' ttt-pet') : ''}` +
               (winningLine?.includes(i) ? ' ttt-win' : '') +
               (i === pendingSquare ? ' ttt-pending' : ''),
        type: 'button',
        'aria-label': mark ? (mine ? 'Your square' : `${buddy.name}'s square`) : `Square ${i + 1}`,
        onClick: () => claim(i),
      }, mark ? (mine ? '⭐' : '\u{1FAE7}') : (i === pendingSquare ? '?' : ''));
      boardNode.append(node);
    });
  }

  function setStatus(text) { status.textContent = text; }

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

  function showSpellBox(word) {
    spellBox.hidden = false;
    mount(spellBox,
      el('div', { class: 'row', style: { justifyContent: 'center' } },
        el('button', { class: 'speak-btn speak-btn-sm', type: 'button',
          'aria-label': 'Hear the word again',
          onClick: () => speech.promptWord(word, { withSentence: words.shouldSpeakSentence(word) }) },
          '\u{1F50A}'),
        button('Slower', { cls: 'btn btn-quiet', emoji: '\u{1F422}',
          onClick: () => speech.speakWordSlowly(word) })
      ),
      tiles
    );
  }

  function hideSpellBox() {
    spellBox.hidden = true;
    clear(spellBox);
  }

  /* ---------- Her turn ---------- */

  function claim(i) {
    if (busy || turn !== HER || board[i] || pendingSquare !== null) return;
    pendingSquare = i;
    typed = '';
    const word = pool[wordAt % pool.length];
    wordAt += 1;
    drawBoard();
    setStatus('Spell it to claim that square');
    showSpellBox(word);
    renderTiles();
    spellBox.dataset.wordId = word.id;
    wait(() => speech.promptWord(word, { withSentence: words.shouldSpeakSentence(word) }), 220);
  }

  function currentWord() {
    return pool.find(w => w.id === spellBox.dataset.wordId) || null;
  }

  function typeLetter(ch) {
    if (busy || pendingSquare === null || typed.length >= 24) return;
    typed += ch;
    renderTiles();
  }

  function backspace() {
    if (busy || pendingSquare === null) return;
    typed = typed.slice(0, -1);
    renderTiles();
  }

  function submit() {
    if (busy || pendingSquare === null) return;
    const word = currentWord();
    if (!word) return;
    const attempt = typed.trim().toLowerCase();
    if (!attempt) { buddy.say('Tap the letters to spell it.'); return; }

    const right = attempt === word.text.trim().toLowerCase();
    wordsTried += 1;
    ctx.record(word, right);
    busy = true;

    if (right) {
      wordsWon += 1;
      board[pendingSquare] = HER;
      renderTiles('good');
      buddy.cheer('That square is yours!');
    } else {
      renderTiles('bad');
      if (!missed.some(w => w.id === word.id)) missed.push(word);
      buddy.sympathise(`It was "${word.text}" — my turn!`);
    }

    const landed = pendingSquare;
    pendingSquare = null;
    drawBoard();
    setStatus(right ? 'Yours!' : `It was "${word.text}"`);

    wait(() => {
      hideSpellBox();
      busy = false;
      if (right && finishedGame()) return;
      turn = PET;
      petTurn();
    }, right ? 1100 : 2400);
    return landed;
  }

  /* ---------- The axolotl's turn ---------- */

  function petTurn() {
    if (!board.includes(null)) return finishedGame();
    busy = true;
    turn = PET;
    setStatus(`${buddy.name} is thinking...`);
    buddy.think();

    wait(() => {
      // It has to spell its word too, and sometimes it gets it wrong.
      if (Math.random() < FUMBLE_CHANCE) {
        buddy.react({ mood: 'calm', text: 'Oops, I spelled mine wrong! Your go.' });
        setStatus('Your turn');
        busy = false;
        turn = HER;
        return;
      }
      const spot = chooseSquare();
      if (spot === null) return finishedGame();
      board[spot] = PET;
      buddy.react({ mood: 'happy', text: 'Got it! That one is mine.' });
      drawBoard();
      busy = false;
      if (finishedGame()) return;
      turn = HER;
      setStatus('Your turn — tap a square');
    }, 1200);
  }

  function chooseSquare() {
    const open = board.map((m, i) => (m ? null : i)).filter(i => i !== null);
    if (!open.length) return null;

    if (Math.random() < SMART_CHANCE) {
      const winning = findLine(PET);
      if (winning !== null) return winning;
      const blocking = findLine(HER);
      if (blocking !== null) return blocking;
      if (board[4] === null) return 4;
      const corners = [0, 2, 6, 8].filter(i => board[i] === null);
      if (corners.length) return corners[Math.floor(Math.random() * corners.length)];
    }
    return open[Math.floor(Math.random() * open.length)];
  }

  /** The square that completes a line for `who`, if there is one. */
  function findLine(who) {
    for (const line of LINES) {
      const mine = line.filter(i => board[i] === who).length;
      const empty = line.filter(i => board[i] === null);
      if (mine === 2 && empty.length === 1) return empty[0];
    }
    return null;
  }

  /* ---------- Ending ---------- */

  function winnerLine(who) {
    return LINES.find(line => line.every(i => board[i] === who)) || null;
  }

  function finishedGame() {
    const hers = winnerLine(HER);
    const theirs = winnerLine(PET);
    const full = !board.includes(null);
    if (!hers && !theirs && !full) return false;

    drawBoard(hers || theirs);
    const outcome = hers ? 'won' : theirs ? 'lost' : 'draw';

    if (outcome === 'won') buddy.celebrate('You beat me! That was brilliant.');
    else if (outcome === 'draw') buddy.react({ mood: 'happy', effect: 'sparkles', text: 'A tie! Good game.' });
    else buddy.react({ mood: 'happy', effect: 'sparkles', text: 'I got three! Want to play again?' });

    wait(() => ctx.finish({
      wordsWon,
      bonus: outcome === 'won', bonusLabel: 'You beat the axolotl!',
      headline: outcome === 'won' ? 'You won!' : outcome === 'draw' ? "It's a tie!" : 'Good game!',
      detail: `${wordsWon} of ${wordsTried} words spelled right`,
      emoji: outcome === 'won' ? '\u{1F3C6}' : '⭕',
      celebrate: outcome === 'won',
      missed,
    }), 1800);
    return true;
  }

  /* ---------- Input ---------- */

  ctx.onCleanup(watchPhysicalKeyboard({
    onLetter: typeLetter, onBackspace: backspace, onEnter: submit,
    isLocked: () => busy || pendingSquare === null,
  }));

  /* ---------- Go ---------- */

  buildKeyboard(keyboard, {
    onLetter: typeLetter, onBackspace: backspace, onEnter: submit, enterLabel: 'Check',
  });
  drawBoard();
  setStatus('Your turn — tap a square');
}
