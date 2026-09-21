/* Crossword.

   The one game that uses the definitions her word list already carries.
   She reads a clue and spells the whole word from memory into the squares —
   no audio of the word, nothing to copy — which is why this is one of the
   two games that can add to a mastery streak.

   The speaker button reads the CLUE, never the answer. Reading a clue out
   loud is help with reading; reading the answer out loud would be help with
   spelling, and that would make the credit meaningless.

   The next clue is read out automatically as soon as she finishes one, so
   she can keep her eyes on the grid and her hands on the keyboard instead
   of hunting for a speaker button between every word.
*/

import { el, mount, clear, button } from '../ui/dom.js';
import { gameHeader } from '../screens/play.js';
import { createBuddy } from '../ui/buddy.js';
import { buildKeyboard, watchPhysicalKeyboard } from '../ui/keyboard.js';
import * as speech from '../core/speech.js';
import { gameWords } from '../core/games.js';

const WANT_WORDS = 6;
const MAX_ENTRIES = 6;

const letters = text => String(text).toLowerCase().replace(/[^a-z]/g, '');
const cellKey = (r, c) => `${r},${c}`;

export default function crossword(ctx) {
  const pool = gameWords(WANT_WORDS + 3, { minLength: 3 });
  const puzzle = generate(pool.slice(0, WANT_WORDS + 3));

  if (!puzzle || puzzle.entries.length < 2) {
    return mount(ctx.stage, el('div', { class: 'card center stack' },
      el('h2', { text: 'These words will not cross' }),
      el('p', { class: 'muted', text:
        'A crossword needs words that share letters. Try again once there are a few more words on the list.' }),
      button('Back to games', { cls: 'btn btn-primary', onClick: ctx.quit })
    ));
  }

  const buddy = createBuddy({ layout: 'side', greeting: 'Read the clue, then spell it!' });
  ctx.onCleanup(() => buddy.stop());

  /* ---------- State ---------- */

  const filled = new Map();       // cellKey -> letter she typed
  const solved = new Set();       // entry index
  const attempted = new Set();    // entry index — only the first try is recorded
  const missedWords = [];
  let active = 0;
  let cursor = 0;
  let cleanRun = true;
  /* Bumped whenever the active clue changes. A deferred jump to the next
     clue checks this before it fires, so tapping a clue of her own within
     the pause after solving one is never overruled a moment later. */
  let selection = 0;

  const timers = [];
  const wait = (fn, ms) => { timers.push(setTimeout(fn, ms)); };
  ctx.onCleanup(() => timers.forEach(clearTimeout));

  /* ---------- Layout ---------- */

  const gridNode  = el('div', { class: 'cw-grid' });
  const clueList  = el('div', { class: 'cw-clues' });
  const cluePanel = el('div', { class: 'cw-current' });
  const keyboard  = el('div', { class: 'keyboard keyboard-sm' });

  /* The clue she is working on lives in the side column, not under the
     grid: a tall puzzle plus a clue panel plus a keyboard does not fit a
     landscape tablet, and the grid is the part that must not be cut off. */
  const body = el('div', { class: 'game-body cw-wrap' },
    el('div', { class: 'cw-board-col' }, gridNode),
    el('div', { class: 'cw-side' }, cluePanel, clueList, buddy.node)
  );

  mount(ctx.stage,
    gameHeader('Crossword', { onQuit: () => leave() }),
    body,
    keyboard
  );

  const cellNodes = new Map();    // cellKey -> node

  /* ---------- Drawing ---------- */

  function drawGrid() {
    clear(gridNode);
    cellNodes.clear();
    gridNode.style.setProperty('--cw-cols', String(puzzle.width));
    gridNode.style.setProperty('--cw-rows', String(puzzle.height));

    for (let r = 0; r < puzzle.height; r++) {
      for (let c = 0; c < puzzle.width; c++) {
        const k = cellKey(r, c);
        if (!puzzle.cells.has(k)) {
          gridNode.append(el('div', { class: 'cw-cell cw-blank' }));
          continue;
        }
        const node = el('button', { class: 'cw-cell', type: 'button',
          onClick: () => focusCell(r, c) },
          puzzle.numbers.has(k) ? el('span', { class: 'cw-num', text: String(puzzle.numbers.get(k)) }) : null,
          el('span', { class: 'cw-letter' })
        );
        cellNodes.set(k, node);
        gridNode.append(node);
      }
    }
  }

  function paint() {
    const entry = puzzle.entries[active];
    const activeKeys = entry ? new Set(entry.cells.map(p => cellKey(p.r, p.c))) : new Set();
    const cursorKey = entry && entry.cells[cursor]
      ? cellKey(entry.cells[cursor].r, entry.cells[cursor].c) : null;

    cellNodes.forEach((node, k) => {
      node.querySelector('.cw-letter').textContent = (filled.get(k) || '').toUpperCase();
      node.classList.toggle('cw-active', activeKeys.has(k));
      node.classList.toggle('cw-cursor', k === cursorKey);
      node.classList.toggle('cw-solved', isSolvedCell(k));
    });

    drawClueList();
    drawCurrentClue();
  }

  function isSolvedCell(k) {
    return puzzle.entries.some((e, i) => solved.has(i) && e.cells.some(p => cellKey(p.r, p.c) === k));
  }

  function drawClueList() {
    clear(clueList);
    ['across', 'down'].forEach(dir => {
      const ofDir = puzzle.entries
        .map((e, i) => ({ e, i }))
        .filter(x => x.e.dir === dir);
      if (!ofDir.length) return;

      clueList.append(el('div', { class: 'cw-clue-head', text: dir === 'across' ? 'Across' : 'Down' }));
      ofDir.forEach(({ e, i }) => {
        clueList.append(el('button', {
          class: `cw-clue${i === active ? ' cw-clue-on' : ''}${solved.has(i) ? ' cw-clue-done' : ''}`,
          type: 'button',
          onClick: () => selectEntry(i),
        },
          el('b', { text: `${e.number}. ` }),
          el('span', { text: e.clue.short })
        ));
      });
    });
  }

  function drawCurrentClue() {
    const entry = puzzle.entries[active];
    if (!entry) return clear(cluePanel);

    mount(cluePanel,
      el('div', { class: 'cw-current-row' },
        el('span', { class: 'cw-current-num', text: `${entry.number} ${entry.dir === 'across' ? 'Across' : 'Down'}` }),
        el('span', { class: 'grow cw-current-text', text: entry.clue.text }),
        el('button', { class: 'icon-btn', type: 'button', 'aria-label': 'Hear the clue',
          onClick: () => speech.speak(entry.clue.speak) }, '\u{1F50A}')
      ),
      el('div', { class: 'tiny muted', text: solved.has(active)
        ? `✅ ${entry.word.text}`
        : `${entry.cells.length} letters` })
    );
  }

  /* ---------- Moving around ---------- */

  function selectEntry(i, { speak = false } = {}) {
    active = i;
    cursor = 0;
    selection += 1;
    paint();
    if (speak) sayClue();
  }

  function sayClue() {
    const entry = puzzle.entries[active];
    if (entry) speech.speak(entry.clue.speak);
  }

  /* Tapping a square picks the entry it belongs to — and taps the other way
     round if she taps a square she is already in, so a crossing square can
     get to both of its words. */
  function focusCell(r, c) {
    const k = cellKey(r, c);
    const owners = puzzle.entries
      .map((e, i) => ({ e, i }))
      .filter(x => x.e.cells.some(p => cellKey(p.r, p.c) === k));
    if (!owners.length) return;

    const sameEntry = owners.find(x => x.i === active);
    const chosen = (sameEntry && owners.length > 1)
      ? owners.find(x => x.i !== active)
      : owners[0];

    active = chosen.i;
    cursor = chosen.e.cells.findIndex(p => cellKey(p.r, p.c) === k);
    paint();
  }

  function advance() {
    const entry = puzzle.entries[active];
    cursor = Math.min(cursor + 1, entry.cells.length - 1);
  }

  /* She types the word straight through, first letter to last. Where the
     word crosses one she has already solved, that square is fixed: the
     keystroke for it is swallowed and the cursor moves on, so typing
     "plain" over a crossing A still lands p-l-[a]-i-n. Asking her to work
     out which letters to leave out would be a puzzle about the interface
     rather than about spelling. */
  function typeLetter(ch) {
    const entry = puzzle.entries[active];
    if (!entry || solved.has(active)) return;
    const spot = entry.cells[cursor];
    const k = cellKey(spot.r, spot.c);
    if (!isSolvedCell(k)) filled.set(k, ch);
    advance();
    paint();
  }

  function backspace() {
    const entry = puzzle.entries[active];
    if (!entry || solved.has(active)) return;
    const hereKey = cellKey(entry.cells[cursor].r, entry.cells[cursor].c);

    if (filled.get(hereKey) && !isSolvedCell(hereKey)) {
      filled.delete(hereKey);
    } else if (cursor > 0) {
      cursor -= 1;
      const backKey = cellKey(entry.cells[cursor].r, entry.cells[cursor].c);
      if (!isSolvedCell(backKey)) filled.delete(backKey);
    }
    paint();
  }

  /* ---------- Checking ---------- */

  function check() {
    const entry = puzzle.entries[active];
    if (!entry || solved.has(active)) return;

    const typed = entry.cells.map(p => filled.get(cellKey(p.r, p.c)) || ' ').join('');
    if (typed.includes(' ')) { buddy.say('Fill in every square first.'); return; }

    const right = typed === letters(entry.word.text);
    const firstTry = !attempted.has(active);
    if (firstTry) {
      attempted.add(active);
      // Only the first go is recorded. Mastery can only ever be added here,
      // never taken away — core/games.js sees to that.
      ctx.record(entry.word, right);
    }

    if (right) {
      solved.add(active);
      buddy.cheer(`${entry.word.text}!`);
      paint();
      if (solved.size === puzzle.entries.length) return wait(done, 900);
      const nextUnsolved = puzzle.entries.findIndex((e, i) => !solved.has(i));
      // A beat first, so the cheer for the word she just got is not talked
      // over by the clue for the next one — and only if she has not already
      // picked a clue herself in the meantime.
      const mine = selection;
      if (nextUnsolved >= 0) {
        wait(() => { if (selection === mine) selectEntry(nextUnsolved, { speak: true }); }, 900);
      }
      return;
    }

    cleanRun = false;
    if (!missedWords.some(w => w.id === entry.word.id)) missedWords.push(entry.word);

    entry.cells.forEach(p => {
      const node = cellNodes.get(cellKey(p.r, p.c));
      node?.classList.add('shake');
      setTimeout(() => node?.classList.remove('shake'), 420);
      if (!isSolvedCell(cellKey(p.r, p.c))) filled.delete(cellKey(p.r, p.c));
    });

    buddy.sympathise('Not quite — here it is.');
    mount(cluePanel,
      el('div', { class: 'cw-reveal' },
        el('div', { class: 'tiny muted', text: 'The answer was' }),
        el('div', { class: 'correct-spelling', text: entry.word.text }),
        el('div', { class: 'row', style: { justifyContent: 'center' } },
          button('Hear it', { cls: 'btn btn-quiet', emoji: '\u{1F50A}',
            onClick: () => speech.speakWord(entry.word) }),
          button('Show me', { cls: 'btn btn-quiet', emoji: '\u{1F524}',
            onClick: () => speech.spellOut(entry.word) }),
          button('Try it', { cls: 'btn btn-primary', emoji: '✏️',
            onClick: () => { cursor = 0; paint(); } })
        )
      )
    );
  }

  function done() {
    buddy.celebrate('The whole puzzle!');
    ctx.finish({
      wordsWon: solved.size,
      bonus: cleanRun, bonusLabel: 'Every clue first try!',
      headline: 'Puzzle finished!',
      detail: `${solved.size} of ${puzzle.entries.length} clues`,
      emoji: '\u{1F9E9}', celebrate: true,
      missed: missedWords,
    });
  }

  /* ---------- Input ---------- */

  ctx.onCleanup(watchPhysicalKeyboard({
    onLetter: typeLetter, onBackspace: backspace, onEnter: check,
  }));

  function leave() {
    if (!solved.size) return ctx.quit();
    ctx.finish({
      wordsWon: solved.size,
      headline: 'Good crosswording!',
      detail: `${solved.size} of ${puzzle.entries.length} clues`,
      emoji: '\u{1F9E9}',
      missed: puzzle.entries.filter((e, i) => !solved.has(i)).map(e => e.word),
    });
  }

  /* ---------- Go ---------- */

  buildKeyboard(keyboard, {
    onLetter: typeLetter, onBackspace: backspace, onEnter: check, enterLabel: 'Check',
  });
  drawGrid();
  selectEntry(0);
  wait(sayClue, 500);
}

/* ---------- Clues ----------

   A definition if the list has one, otherwise the example sentence with the
   word itself blanked out, otherwise the word read aloud. Blanking the word
   out of its own sentence matters: leaving it in would print the answer.
*/

function clueFor(word) {
  if (word.definition) {
    return { text: word.definition, short: word.definition, speak: word.definition };
  }
  if (word.sentence) {
    const blanked = word.sentence.replace(
      new RegExp(`\\b${word.text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'gi'),
      '_____'
    );
    return { text: blanked, short: blanked, speak: blanked };
  }
  return { text: 'Listen, then spell it', short: 'Listen and spell', speak: word.text };
}

/* ---------- Generating the puzzle ---------- */

function generate(list) {
  const usable = list.filter(w => letters(w.text).length >= 3);
  if (usable.length < 2) return null;

  const sorted = [...usable].sort((a, b) => letters(b.text).length - letters(a.text).length);
  const cells = new Map();       // cellKey -> letter
  const entries = [];            // { word, r, c, dir, cells }

  put(sorted[0], 0, 0, 'across');

  for (const word of sorted.slice(1)) {
    if (entries.length >= MAX_ENTRIES) break;
    const text = letters(word.text);
    if (entries.some(e => letters(e.word.text) === text)) continue;

    const options = [];
    for (const e of entries) {
      const etext = letters(e.word.text);
      for (let i = 0; i < etext.length; i++) {
        for (let j = 0; j < text.length; j++) {
          if (etext[i] !== text[j]) continue;
          const dir = e.dir === 'across' ? 'down' : 'across';
          const r = e.dir === 'across' ? e.r - j : e.r + i;
          const c = e.dir === 'across' ? e.c + i : e.c - j;
          if (fits(text, r, c, dir)) options.push({ r, c, dir });
        }
      }
    }
    if (!options.length) continue;

    /* Prefer the placement that keeps the grid compact. A crossword that
       grows into a long thin ladder has to be shrunk to fit the screen,
       and then the squares are too small to read. Choosing at random
       among the best few keeps every puzzle a bit different. */
    const ranked = options
      .map(spot => ({ spot, cost: boxCost(text, spot) }))
      .sort((a, b) => a.cost - b.cost)
      .slice(0, 3);
    const spot = ranked[Math.floor(Math.random() * ranked.length)].spot;
    put(word, spot.r, spot.c, spot.dir);
  }

  if (entries.length < 2) return null;

  /* Slide everything into a box starting at 0,0. */
  const rs = entries.flatMap(e => e.cells.map(p => p.r));
  const cs = entries.flatMap(e => e.cells.map(p => p.c));
  const minR = Math.min(...rs), minC = Math.min(...cs);
  entries.forEach(e => {
    e.r -= minR; e.c -= minC;
    e.cells = e.cells.map(p => ({ r: p.r - minR, c: p.c - minC }));
  });

  const shifted = new Map();
  entries.forEach(e => {
    const text = letters(e.word.text);
    e.cells.forEach((p, i) => shifted.set(cellKey(p.r, p.c), text[i]));
  });

  const height = Math.max(...entries.flatMap(e => e.cells.map(p => p.r))) + 1;
  const width  = Math.max(...entries.flatMap(e => e.cells.map(p => p.c))) + 1;

  /* Numbering, reading order, shared where an across and a down start in
     the same square — exactly like a newspaper crossword. */
  entries.sort((a, b) => (a.r - b.r) || (a.c - b.c) || (a.dir === 'across' ? -1 : 1));
  const numbers = new Map();
  let next = 1;
  entries.forEach(e => {
    const k = cellKey(e.r, e.c);
    if (!numbers.has(k)) numbers.set(k, next++);
    e.number = numbers.get(k);
    e.clue = clueFor(e.word);
  });

  return { entries, cells: shifted, numbers, width, height };

  /* How lopsided the grid would become if `text` went in at `spot`. */
  function boxCost(text, spot) {
    const dr = spot.dir === 'down' ? 1 : 0;
    const dc = spot.dir === 'across' ? 1 : 0;
    const keys = [...cells.keys()].map(k => k.split(',').map(Number));
    const rs = keys.map(([r]) => r).concat(spot.r, spot.r + dr * (text.length - 1));
    const cs = keys.map(([, c]) => c).concat(spot.c, spot.c + dc * (text.length - 1));
    const h = Math.max(...rs) - Math.min(...rs) + 1;
    const w = Math.max(...cs) - Math.min(...cs) + 1;
    return Math.max(h, w) / Math.min(h, w) + (h + w) / 40;
  }

  function put(word, r, c, dir) {
    const text = letters(word.text);
    const dr = dir === 'down' ? 1 : 0;
    const dc = dir === 'across' ? 1 : 0;
    const spots = [];
    for (let i = 0; i < text.length; i++) {
      const rr = r + dr * i, cc = c + dc * i;
      cells.set(cellKey(rr, cc), text[i]);
      spots.push({ r: rr, c: cc });
    }
    entries.push({ word, r, c, dir, cells: spots });
  }

  /* A placement is allowed when every square either is empty or already
     holds the same letter, and no new square touches another word
     sideways — otherwise the grid grows two-letter nonsense words along
     the edges. */
  function fits(text, r, c, dir) {
    const dr = dir === 'down' ? 1 : 0;
    const dc = dir === 'across' ? 1 : 0;

    if (cells.has(cellKey(r - dr, c - dc))) return false;
    if (cells.has(cellKey(r + dr * text.length, c + dc * text.length))) return false;

    let crossings = 0;
    for (let i = 0; i < text.length; i++) {
      const rr = r + dr * i, cc = c + dc * i;
      const sitting = cells.get(cellKey(rr, cc));
      if (sitting) {
        if (sitting !== text[i]) return false;
        crossings++;
        continue;
      }
      // Empty square: its sideways neighbours must be empty too.
      const sideA = dir === 'across' ? cellKey(rr - 1, cc) : cellKey(rr, cc - 1);
      const sideB = dir === 'across' ? cellKey(rr + 1, cc) : cellKey(rr, cc + 1);
      if (cells.has(sideA) || cells.has(sideB)) return false;
    }
    return crossings > 0;
  }
}
