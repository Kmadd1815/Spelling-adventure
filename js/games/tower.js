/* Tower Builder — the hangman idea, with nothing being hanged.

   She guesses letters. Every letter that is in the word lays another block,
   so the tower only ever grows: the picture that builds up is a record of
   what she got RIGHT, not a countdown to something awful.

   A wrong guess uses one of six spare blocks from the wheelbarrow. Running
   out does not knock anything down — the axolotl just shows her the word,
   says something kind, and they move on to the next one with the tower
   exactly as tall as she built it.
*/

import { el, mount, clear, button } from '../ui/dom.js';
import { gameHeader } from '../screens/play.js';
import { createBuddy, petSprite } from '../ui/buddy.js';
import * as speech from '../core/speech.js';
import { gameWords } from '../core/games.js';

const WORDS_PER_ROUND = 3;
const SPARE_BLOCKS = 6;
const ALPHABET = 'abcdefghijklmnopqrstuvwxyz';

const letters = text => String(text).toLowerCase().replace(/[^a-z]/g, '');
const escapeRe = text => String(text).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

export default function towerBuilder(ctx) {
  const queue = gameWords(WORDS_PER_ROUND, { minLength: 3 });
  if (!queue.length) {
    return mount(ctx.stage, el('div', { class: 'card center stack' },
      el('h2', { text: 'No words yet' }),
      el('p', { class: 'muted', text: 'Ask a grown-up to add this week’s spelling list.' }),
      button('Back to games', { cls: 'btn btn-primary', onClick: ctx.quit })
    ));
  }

  const buddy = createBuddy({ layout: 'voice', greeting: 'Let us build something tall!' });
  ctx.onCleanup(() => buddy.stop());

  /* ---------- State ---------- */

  let wordIndex = 0;
  let target = letters(queue[0].text);
  let guessed = new Set();
  let spares = SPARE_BLOCKS;
  let blocks = 0;                // every right letter lays one
  let flags = 0;                 // one per word finished
  let solvedCount = 0;
  let cleanRun = true;
  let busy = false;
  const missed = [];
  const timers = [];
  const wait = (fn, ms) => { timers.push(setTimeout(fn, ms)); };
  ctx.onCleanup(() => timers.forEach(clearTimeout));

  /* ---------- Layout ---------- */

  const towerNode  = el('div', { class: 'tower-art' });
  const slotsNode  = el('div', { class: 'tower-slots' });
  const sparesNode = el('div', { class: 'tower-spares' });
  const clueNode   = el('div', { class: 'tower-clue tiny muted' });
  const padNode    = el('div', { class: 'tower-pad' });

  const body = el('div', { class: 'game-body tower-wrap' },
    /* The axolotl in this game is the builder standing beside the tower, so
       the panel is its voice only — two of the same creature on one screen
       reads as a bug, not a friend. */
    el('div', { class: 'tower-left' }, towerNode, buddy.node),
    el('div', { class: 'tower-right' }, slotsNode, sparesNode, clueNode, padNode)
  );

  mount(ctx.stage, gameHeader('Tower Builder', { onQuit: () => leave() }), body);

  /* ---------- Drawing ---------- */

  function drawTower() {
    mount(towerNode,
      el('div', { class: 'tower-svg', html: towerSVG(blocks, flags) }),
      el('div', { class: 'tower-builder', html: petSprite(busy ? 'excited' : 'happy') })
    );
  }

  function drawSlots({ reveal = false } = {}) {
    clear(slotsNode);
    target.split('').forEach(ch => {
      const known = reveal || guessed.has(ch);
      slotsNode.append(el('span', {
        class: `tower-slot${known ? ' tower-slot-on' : ''}${reveal && !guessed.has(ch) ? ' tower-slot-shown' : ''}`,
        text: known ? ch : '',
      }));
    });
    slotsNode.append(el('span', { class: 'tiny muted', text: ` ${wordIndex + 1} of ${queue.length}` }));
  }

  function drawSpares() {
    clear(sparesNode);
    for (let i = 0; i < SPARE_BLOCKS; i++) {
      sparesNode.append(el('span', {
        class: i < spares ? 'tower-spare' : 'tower-spare tower-spare-used',
        text: '\u{1F9F1}',
      }));
    }
    sparesNode.append(el('span', { class: 'tiny muted', text: ' spare blocks' }));
  }

  function drawClue() {
    const word = queue[wordIndex];
    const raw = word.definition || word.sentence || '';
    // The clue must never print the answer inside its own example sentence.
    const blank = text => text.replace(new RegExp(escapeRe(word.text), 'gi'), '_____');
    mount(clueNode,
      raw ? el('span', { text: blank(raw) })
          : el('span', { text: `${target.length} letters` }),
      raw ? el('button', { class: 'icon-btn', type: 'button', 'aria-label': 'Hear the clue',
              onClick: () => speech.speak(blank(raw).replace(/_____/g, 'blank')) }, '\u{1F50A}')
          : null
    );
  }

  function drawPad() {
    clear(padNode);
    ALPHABET.split('').forEach(ch => {
      const used = guessed.has(ch);
      const inWord = target.includes(ch);
      padNode.append(el('button', {
        class: `tower-key${used ? (inWord ? ' tower-key-yes' : ' tower-key-no') : ''}`,
        type: 'button', text: ch, disabled: used || busy,
        onClick: () => guess(ch),
      }));
    });
  }

  function drawAll(opts) {
    drawTower();
    drawSlots(opts);
    drawSpares();
    drawClue();
    drawPad();
  }

  /* ---------- Guessing ---------- */

  function guess(ch) {
    if (busy || guessed.has(ch)) return;
    guessed.add(ch);

    if (target.includes(ch)) {
      blocks += 1;
      buddy.cheer(`${ch.toUpperCase()} — another block!`);
      drawAll();
      if (target.split('').every(letter => guessed.has(letter))) return solve();
      return;
    }

    spares -= 1;
    cleanRun = false;
    buddy.sympathise(spares > 0 ? 'Not that one. Keep going!' : 'Let us look at this one together.');
    drawAll();
    if (spares <= 0) giveTheWord();
  }

  function solve() {
    busy = true;
    solvedCount += 1;
    flags += 1;
    const word = queue[wordIndex];
    /* Guessing letters against blanks is not spelling from memory, so this
       goes in her history but never moves a mastery streak. */
    ctx.record(word, true);
    speech.speakWord(word);
    buddy.celebrate(`${word.text}! Look at that tower.`);
    drawAll();
    wait(nextWord, 2000);
  }

  function giveTheWord() {
    busy = true;
    const word = queue[wordIndex];
    ctx.record(word, false);
    if (!missed.some(w => w.id === word.id)) missed.push(word);
    speech.speakWord(word);
    drawAll({ reveal: true });
    wait(nextWord, 2800);
  }

  function nextWord() {
    wordIndex += 1;
    if (wordIndex >= queue.length) return done();
    target = letters(queue[wordIndex].text);
    guessed = new Set();
    spares = SPARE_BLOCKS;
    busy = false;
    buddy.say('Next one!');
    drawAll();
  }

  function done() {
    const tall = flags === queue.length;
    buddy.celebrate(tall ? 'The tallest tower ever!' : 'A fine tower!');
    ctx.finish({
      wordsWon: solvedCount,
      bonus: tall && cleanRun, bonusLabel: 'Not one spare block used!',
      headline: tall ? 'Tower finished!' : 'Good building!',
      detail: `${solvedCount} of ${queue.length} words — ${blocks} blocks laid`,
      emoji: '\u{1F3F0}', celebrate: tall,
      missed,
    });
  }

  function leave() {
    if (!solvedCount) return ctx.quit();
    done();
  }

  /* ---------- Go ---------- */

  drawAll();
}

/* ---------- The tower ----------

   Blocks stack four to a storey, and a flag goes up for every word she
   finishes. Nothing here has a "damaged" state to draw, because nothing
   ever gets knocked down.
*/

function towerSVG(blocks, flags) {
  const PER_ROW = 4;
  const BW = 40, BH = 22, GAP = 2;
  const baseY = 236;
  const left = 16;

  const shades = ['#e8b98a', '#dfa876', '#efc79c', '#d99e6c'];
  const parts = [];

  parts.push(`<rect x="8" y="${baseY}" width="184" height="14" rx="5" fill="#b9d8c6"/>`);

  for (let i = 0; i < blocks; i++) {
    const row = Math.floor(i / PER_ROW);
    const col = i % PER_ROW;
    const x = left + col * (BW + GAP);
    const y = baseY - (row + 1) * (BH + GAP);
    parts.push(
      `<rect x="${x}" y="${y}" width="${BW}" height="${BH}" rx="4" ` +
      `fill="${shades[(row + col) % shades.length]}" stroke="#b07f52" stroke-width="1.5"/>`
    );
  }

  const topRow = Math.ceil(blocks / PER_ROW);
  for (let f = 0; f < flags; f++) {
    const x = left + 12 + f * 30;
    const y = baseY - topRow * (BH + GAP) - 6;
    parts.push(
      `<line x1="${x}" y1="${y}" x2="${x}" y2="${y - 26}" stroke="#8d6748" stroke-width="3" stroke-linecap="round"/>` +
      `<path d="M${x} ${y - 26} L${x + 22} ${y - 20} L${x} ${y - 14} Z" fill="#ff8fab"/>`
    );
  }

  return `<svg viewBox="0 0 200 260" width="100%" height="100%" aria-hidden="true">${parts.join('')}</svg>`;
}
