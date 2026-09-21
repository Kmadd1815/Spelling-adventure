/* Word Search.

   Her spelling words hidden in a grid of letters. Words only ever read
   forwards — left to right, top to bottom, or diagonally down — because a
   word spelled backwards is not a word she is learning to spell.

   Selecting is two taps, not a drag: tap the first letter, tap the last.
   On a tablet a drag across a grid fights with the page scrolling and with
   how hard it is to keep a finger on a line; two taps always works.
*/

import { el, mount, clear, button } from '../ui/dom.js';
import { gameHeader } from '../screens/play.js';
import { createBuddy } from '../ui/buddy.js';
import * as speech from '../core/speech.js';
import { gameWords } from '../core/games.js';

const SIZE = 10;
const WANT_WORDS = 5;
/* Forwards only: across, down, and the two downward diagonals. */
const DIRS = [[0, 1], [1, 0], [1, 1], [1, -1]];
const ALPHABET = 'abcdefghijklmnopqrstuvwxyz';

export default function wordSearch(ctx) {
  const picked = gameWords(WANT_WORDS, { minLength: 3 })
    .filter(w => letters(w.text).length <= SIZE);

  if (picked.length < 2) {
    return mount(ctx.stage, el('div', { class: 'card center stack' },
      el('h2', { text: 'Not enough words yet' }),
      el('p', { class: 'muted', text: 'Word Search needs a few words that fit in the grid.' }),
      button('Back to games', { cls: 'btn btn-primary', onClick: ctx.quit })
    ));
  }

  const buddy = createBuddy({ layout: 'side', greeting: 'Find them all!' });
  ctx.onCleanup(() => buddy.stop());

  const board = buildBoard(picked);
  const found = new Set();
  let anchor = null;          // { r, c }

  /* ---------- Layout ---------- */

  const gridNode = el('div', { class: 'ws-grid', style: { '--ws-size': String(SIZE) } });
  const listNode = el('div', { class: 'ws-list' });

  const wrap = el('div', { class: 'game-body ws-wrap' },
    el('div', { class: 'ws-board-col' }, gridNode),
    el('div', { class: 'ws-side' }, listNode, buddy.node)
  );

  mount(ctx.stage,
    gameHeader('Word Search', { onQuit: () => leave() }),
    wrap
  );

  /* ---------- Drawing ---------- */

  const cellNodes = [];

  function drawGrid() {
    clear(gridNode);
    cellNodes.length = 0;
    for (let r = 0; r < SIZE; r++) {
      const row = [];
      for (let c = 0; c < SIZE; c++) {
        const cell = el('button', {
          class: 'ws-cell', type: 'button', text: board.grid[r][c],
          onClick: () => tap(r, c),
        });
        row.push(cell);
        gridNode.append(cell);
      }
      cellNodes.push(row);
    }
  }

  function drawList() {
    clear(listNode);
    board.placed.forEach(entry => {
      const done = found.has(entry.word.id);
      listNode.append(el('div', { class: done ? 'ws-word ws-word-found' : 'ws-word' },
        el('span', { class: 'grow', text: entry.word.text }),
        el('button', { class: 'icon-btn', type: 'button',
          'aria-label': `Hear ${entry.word.text}`,
          onClick: () => speech.speakWord(entry.word) }, '\u{1F50A}')
      ));
    });
  }

  function clearHighlight() {
    cellNodes.flat().forEach(node => node.classList.remove('ws-pick'));
  }

  /* ---------- Selecting ---------- */

  function tap(r, c) {
    if (!anchor) {
      anchor = { r, c };
      clearHighlight();
      cellNodes[r][c].classList.add('ws-pick');
      // Words are allowed to cross, so a square she has already found may
      // also be the first letter of one she has not. Starting a selection
      // there has to keep working; saying the found word again is a bonus,
      // never a replacement for the tap.
      const already = board.placed.find(e =>
        found.has(e.word.id) && e.cells.some(p => p.r === r && p.c === c));
      if (already) speech.speakWord(already.word);
      return;
    }

    if (anchor.r === r && anchor.c === c) {   // tapped it again: cancel
      anchor = null;
      clearHighlight();
      return;
    }

    const path = lineBetween(anchor, { r, c });
    anchor = null;
    clearHighlight();
    if (!path) { wobble(); return; }

    const typed = path.map(p => board.grid[p.r][p.c]).join('');
    const entry = board.placed.find(e =>
      !found.has(e.word.id) &&
      (typed === letters(e.word.text) || typed === reverse(letters(e.word.text)))
    );

    if (!entry) { path.forEach(p => cellNodes[p.r][p.c].classList.add('ws-miss')); wobble(path); return; }

    found.add(entry.word.id);
    entry.cells.forEach(p => {
      cellNodes[p.r][p.c].classList.add('ws-found');
      cellNodes[p.r][p.c].classList.remove('ws-miss');
    });
    /* Finding a word is recognising it, not spelling it from memory, so it
       goes into her history but never moves a mastery streak — the rule
       lives in core/games.js and this game does not get a say. */
    ctx.record(entry.word, true);
    speech.speakWord(entry.word);
    buddy.cheer(`${entry.word.text}!`);
    drawList();

    if (found.size === board.placed.length) setTimeout(done, 900);
  }

  function wobble(path = null) {
    const nodes = path ? path.map(p => cellNodes[p.r][p.c]) : [];
    nodes.forEach(n => n.classList.add('shake'));
    setTimeout(() => nodes.forEach(n => {
      n.classList.remove('shake', 'ws-miss');
    }), 420);
  }

  function done() {
    buddy.celebrate('Every single one!');
    ctx.finish({
      wordsWon: found.size,
      bonus: true, bonusLabel: 'Found them all!',
      headline: 'Every word found!',
      detail: `${found.size} of ${board.placed.length} hidden words`,
      emoji: '\u{1F50D}', celebrate: true,
    });
  }

  /* Leaving still pays for what she did find, so stopping early is never a
     total loss. */
  function leave() {
    if (!found.size) return ctx.quit();
    ctx.finish({
      wordsWon: found.size,
      headline: found.size === board.placed.length ? 'All found!' : 'Nice finding!',
      detail: `${found.size} of ${board.placed.length} hidden words`,
      emoji: '\u{1F50D}',
      missed: board.placed.filter(e => !found.has(e.word.id)).map(e => e.word),
    });
  }

  /* ---------- Go ----------
     Last, so nothing above can be reached before it exists. */
  drawGrid();
  drawList();
}

/* ---------- Building the grid ---------- */

const letters = text => String(text).toLowerCase().replace(/[^a-z]/g, '');
const reverse = text => text.split('').reverse().join('');

function buildBoard(candidates) {
  const grid = Array.from({ length: SIZE }, () => Array(SIZE).fill(''));
  const placed = [];

  for (const word of candidates) {
    const spot = findSpot(grid, letters(word.text));
    if (spot) {
      spot.cells.forEach((p, i) => { grid[p.r][p.c] = letters(word.text)[i]; });
      placed.push({ word, cells: spot.cells });
    }
  }

  for (let r = 0; r < SIZE; r++) {
    for (let c = 0; c < SIZE; c++) {
      if (!grid[r][c]) grid[r][c] = ALPHABET[Math.floor(Math.random() * 26)];
    }
  }
  return { grid, placed };
}

function findSpot(grid, text) {
  for (let tries = 0; tries < 220; tries++) {
    const [dr, dc] = DIRS[Math.floor(Math.random() * DIRS.length)];
    const r0 = Math.floor(Math.random() * SIZE);
    const c0 = Math.floor(Math.random() * SIZE);
    const cells = [];
    let ok = true;

    for (let i = 0; i < text.length; i++) {
      const r = r0 + dr * i, c = c0 + dc * i;
      if (r < 0 || r >= SIZE || c < 0 || c >= SIZE) { ok = false; break; }
      const sitting = grid[r][c];
      if (sitting && sitting !== text[i]) { ok = false; break; }   // crossings are fine
      cells.push({ r, c });
    }
    if (ok) return { cells };
  }
  return null;
}

/** The straight run of cells from a to b, or null if they do not line up. */
function lineBetween(a, b) {
  const dr = Math.sign(b.r - a.r);
  const dc = Math.sign(b.c - a.c);
  const rows = Math.abs(b.r - a.r);
  const cols = Math.abs(b.c - a.c);
  if (rows && cols && rows !== cols) return null;

  const steps = Math.max(rows, cols);
  const path = [];
  for (let i = 0; i <= steps; i++) path.push({ r: a.r + dr * i, c: a.c + dc * i });
  return path;
}
