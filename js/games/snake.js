/* Word Snake.

   She hears the word, then swims the axolotl around the pond picking up its
   letters in order. Nothing on the board marks which letter is the right
   one: every letter in the water looks exactly the same, so finding the
   next one means knowing how the word is spelled. The word fills in along
   the top as she collects it.

   Deliberately gentle for an arcade game: the walls wrap instead of ending
   the round, the tail cannot be crashed into, and a wrong letter costs one
   bubble out of five rather than the whole game. Running out of bubbles
   still pays for every word she finished.

   It still does not touch a mastery streak. She can find a letter by
   swimming into one and seeing what happens, and a game she can brute-force
   is not evidence that she knows the word.
*/

import { el, mount, clear, button } from '../ui/dom.js';
import { gameHeader } from '../screens/play.js';
import { createBuddy, petSprite } from '../ui/buddy.js';
import * as speech from '../core/speech.js';
import { gameWords } from '../core/games.js';

const COLS = 15;
const ROWS = 11;
const WORDS_PER_ROUND = 3;
const START_BUBBLES = 5;
const DECOYS = 3;
const BASE_TICK = 430;          // ms between moves, eases up as she goes
const ALPHABET = 'abcdefghijklmnopqrstuvwxyz';

const letters = text => String(text).toLowerCase().replace(/[^a-z]/g, '');
const at = (r, c) => `${r},${c}`;

export default function wordSnake(ctx) {
  const queue = gameWords(WORDS_PER_ROUND, { minLength: 2 });
  if (!queue.length) {
    return mount(ctx.stage, el('div', { class: 'card center stack' },
      el('h2', { text: 'No words yet' }),
      el('p', { class: 'muted', text: 'Ask a grown-up to add this week’s spelling list.' }),
      button('Back to games', { cls: 'btn btn-primary', onClick: ctx.quit })
    ));
  }

  const buddy = createBuddy({ layout: 'voice', greeting: 'Listen \u2014 then go and find the letters!' });
  ctx.onCleanup(() => buddy.stop());

  /* ---------- State ---------- */

  let wordIndex = 0;
  let target = letters(queue[0].text);
  let got = 0;
  let bubbles = START_BUBBLES;
  let snake = [{ r: Math.floor(ROWS / 2), c: 3 }];
  let dir = { r: 0, c: 1 };
  let nextDir = dir;
  let pieces = [];               // { r, c, ch, good }
  let timer = null;
  let over = false;
  let wordsWon = 0;

  const timers = [];
  const wait = (fn, ms) => { timers.push(setTimeout(fn, ms)); };
  ctx.onCleanup(() => timers.forEach(clearTimeout));

  /* ---------- Layout ---------- */

  const wordStrip = el('div', { class: 'snake-word' });
  const bubbleRow = el('div', { class: 'snake-bubbles' });
  const boardNode = el('div', { class: 'snake-board',
    style: { '--snake-cols': String(COLS), '--snake-rows': String(ROWS) } });

  const pad = el('div', { class: 'dpad' },
    padKey('↑', { r: -1, c: 0 }, 'dpad-up'),
    padKey('←', { r: 0, c: -1 }, 'dpad-left'),
    padKey('→', { r: 0, c: 1 }, 'dpad-right'),
    padKey('↓', { r: 1, c: 0 }, 'dpad-down')
  );

  const body = el('div', { class: 'game-body snake-wrap' },
    el('div', { class: 'snake-hud' }, wordStrip, bubbleRow),
    boardNode,
    el('div', { class: 'snake-controls' }, pad, buddy.node)
  );

  mount(ctx.stage, gameHeader('Word Snake', { onQuit: () => leave() }), body);

  function padKey(glyph, d, cls) {
    return el('button', { class: `dpad-btn ${cls}`, type: 'button', text: glyph,
      'aria-label': cls.replace('dpad-', 'Swim '), onClick: () => steer(d) });
  }

  /* ---------- Cells ---------- */

  const cells = new Map();

  function buildBoard() {
    clear(boardNode);
    cells.clear();
    for (let r = 0; r < ROWS; r++) {
      for (let c = 0; c < COLS; c++) {
        const node = el('div', { class: 'snake-cell' });
        cells.set(at(r, c), node);
        boardNode.append(node);
      }
    }
  }

  function paint() {
    cells.forEach(node => {
      node.className = 'snake-cell';
      node.textContent = '';
      node.innerHTML = '';
    });

    snake.slice(1).forEach(seg => {
      const node = cells.get(at(seg.r, seg.c));
      if (node) node.className = 'snake-cell snake-tail';
    });

    pieces.forEach(p => {
      const node = cells.get(at(p.r, p.c));
      if (!node) return;
      node.className = `snake-cell snake-letter${p.good ? ' snake-good' : ''}`;
      node.textContent = p.ch;
    });

    const head = snake[0];
    const node = cells.get(at(head.r, head.c));
    if (node) {
      node.className = 'snake-cell snake-head';
      node.innerHTML = petSprite('excited');
    }

    drawWord();
    drawBubbles();
  }

  function drawWord() {
    clear(wordStrip);
    wordStrip.append(el('button', { class: 'icon-btn', type: 'button',
      'aria-label': 'Hear the word', onClick: () => speech.speakWord(queue[wordIndex]) }, '\u{1F50A}'));
    target.split('').forEach((ch, i) => {
      wordStrip.append(el('span', { class: i < got ? 'snake-slot snake-slot-on' : 'snake-slot',
        text: i < got ? ch : '·' }));
    });
    wordStrip.append(el('span', { class: 'tiny muted',
      text: ` ${wordIndex + 1} of ${queue.length}` }));
  }

  function drawBubbles() {
    clear(bubbleRow);
    for (let i = 0; i < START_BUBBLES; i++) {
      bubbleRow.append(el('span', { class: i < bubbles ? 'snake-bubble' : 'snake-bubble snake-bubble-gone',
        text: '\u{1FAE7}' }));
    }
  }

  /* ---------- Pieces ---------- */

  function occupied() {
    const set = new Set(snake.map(s => at(s.r, s.c)));
    pieces.forEach(p => set.add(at(p.r, p.c)));
    return set;
  }

  function freeSpot() {
    const taken = occupied();
    for (let tries = 0; tries < 300; tries++) {
      const r = Math.floor(Math.random() * ROWS);
      const c = Math.floor(Math.random() * COLS);
      if (!taken.has(at(r, c))) return { r, c };
    }
    return { r: 0, c: 0 };
  }

  function needed() { return target[got] || ''; }

  function spawnAll() {
    pieces = [];
    if (needed()) pieces.push({ ...freeSpot(), ch: needed(), good: true });
    for (let i = 0; i < DECOYS; i++) pieces.push(decoy());
  }

  function decoy() {
    let ch = needed();
    // A decoy must never be the letter she is looking for, or a right
    // answer would cost her a bubble.
    while (!ch || ch === needed()) ch = ALPHABET[Math.floor(Math.random() * 26)];
    return { ...freeSpot(), ch, good: false };
  }

  /* ---------- Playing ---------- */

  function steer(d) {
    if (over) return;
    // No turning straight back on yourself; the tail is where you came from.
    if (snake.length > 1 && d.r === -dir.r && d.c === -dir.c) return;
    nextDir = d;
  }

  function tick() {
    if (over) return;
    dir = nextDir;
    const head = snake[0];
    // The pond wraps: swimming off one edge brings her back on the other,
    // so an arcade game never ends because of a wall.
    const next = {
      r: (head.r + dir.r + ROWS) % ROWS,
      c: (head.c + dir.c + COLS) % COLS,
    };
    snake.unshift(next);

    const hit = pieces.findIndex(p => p.r === next.r && p.c === next.c);
    if (hit < 0) {
      snake.pop();
      return paint();
    }

    const piece = pieces[hit];
    pieces.splice(hit, 1);

    if (piece.good) {
      got += 1;
      buddy.react({ mood: 'excited', text: `${piece.ch.toUpperCase()}!`, ms: 900 });
      if (got >= target.length) return finishWord();
      pieces.push({ ...freeSpot(), ch: needed(), good: true });
      // Refresh the decoys so none of them is now the letter she needs.
      pieces = pieces.filter(p => p.good).concat(Array.from({ length: DECOYS }, decoy));
      paint();
      return;
    }

    snake.pop();
    bubbles -= 1;
    boardNode.classList.add('shake');
    setTimeout(() => boardNode.classList.remove('shake'), 400);
    buddy.sympathise(bubbles > 0 ? 'Not that one!' : 'Out of bubbles — good swimming!');
    pieces.push(decoy());
    paint();
    if (bubbles <= 0) endRound(false);
  }

  /* Hearing the word is the whole prompt — the letters on the board give
     nothing away. */
  function sayWord() {
    speech.speakWord(queue[wordIndex]);
  }

  function finishWord() {
    const word = queue[wordIndex];
    ctx.record(word, true);
    wordsWon += 1;
    speech.speakWord(word);
    buddy.celebrate(`${word.text}!`);
    stop();
    paint();

    wait(() => {
      if (over) return;
      wordIndex += 1;
      if (wordIndex >= queue.length) return endRound(true);
      target = letters(queue[wordIndex].text);
      got = 0;
      snake = [{ r: Math.floor(ROWS / 2), c: 3 }];
      dir = { r: 0, c: 1 };
      nextDir = dir;
      spawnAll();
      paint();
      sayWord();
      start();
    }, 1600);
  }

  function endRound(allDone) {
    if (over) return;
    over = true;
    stop();
    const left = queue.slice(wordsWon);

    wait(() => ctx.finish({
      wordsWon,
      bonus: allDone, bonusLabel: 'Every word collected!',
      headline: allDone ? 'All the words!' : 'Good swimming!',
      detail: `${wordsWon} of ${queue.length} words collected`,
      emoji: '\u{1F40D}', celebrate: allDone,
      missed: allDone ? [] : left,
    }), 1200);
  }

  /* ---------- The loop ---------- */

  function start() {
    stop();
    // Each word is a touch quicker than the last, which is the whole thrill.
    const speed = Math.max(220, BASE_TICK - wordIndex * 45);
    timer = setInterval(tick, speed);
  }

  function stop() {
    clearInterval(timer);
    timer = null;
  }

  ctx.onCleanup(stop);

  /* ---------- Controls ---------- */

  const onKey = e => {
    const map = {
      ArrowUp: { r: -1, c: 0 }, ArrowDown: { r: 1, c: 0 },
      ArrowLeft: { r: 0, c: -1 }, ArrowRight: { r: 0, c: 1 },
      w: { r: -1, c: 0 }, s: { r: 1, c: 0 }, a: { r: 0, c: -1 }, d: { r: 0, c: 1 },
    };
    const d = map[e.key];
    if (!d) return;
    steer(d);
    e.preventDefault();
  };
  addEventListener('keydown', onKey);
  ctx.onCleanup(() => removeEventListener('keydown', onKey));

  /* Swiping the pond works too — the d-pad is there because a swipe on a
     small board is fiddly, not because swiping should not work. */
  let touch = null;
  boardNode.addEventListener('touchstart', e => {
    const t = e.changedTouches[0];
    touch = { x: t.clientX, y: t.clientY };
  }, { passive: true });
  boardNode.addEventListener('touchend', e => {
    if (!touch) return;
    const t = e.changedTouches[0];
    const dx = t.clientX - touch.x;
    const dy = t.clientY - touch.y;
    touch = null;
    if (Math.abs(dx) < 24 && Math.abs(dy) < 24) return;
    steer(Math.abs(dx) > Math.abs(dy)
      ? { r: 0, c: dx > 0 ? 1 : -1 }
      : { r: dy > 0 ? 1 : -1, c: 0 });
  }, { passive: true });

  function leave() {
    if (!wordsWon) return ctx.quit();
    endRound(false);
  }

  /* ---------- Go ---------- */

  buildBoard();
  spawnAll();
  paint();
  wait(sayWord, 400);
  start();
}
