/* Axolotl Swim.

   She IS the axolotl here. Hold anywhere on the pond to swim up, let go to
   drift down, and pick up the letters of a word in order while getting past
   the rocks.

   Softer than the game it borrows from: hitting a rock costs one bubble out
   of five and gives her a moment of safety afterwards rather than ending the
   run, the rocks leave a generous gap, and a wrong letter costs nothing at
   all. Every word she finishes is banked the moment she finishes it, so the
   last rock can never take her whole run away.

   Only the letter she needs is ever placed in a gap between rocks. Wrong
   letters drift along in open water, halfway between one pair of rocks and
   the next, where there is room to swim over or under them — a letter she
   has no way to avoid is not a choice, and a game made of unavoidable
   choices is just a game you lose.

   The letters come to her in order, so this never touches a mastery streak.
*/

import { el, mount, clear, button } from '../ui/dom.js';
import { gameHeader } from '../screens/play.js';
import { createBuddy, petSprite } from '../ui/buddy.js';
import * as speech from '../core/speech.js';
import { gameWords } from '../core/games.js';

const WORDS_PER_ROUND = 3;
const START_BUBBLES = 5;
const ALPHABET = 'abcdefghijklmnopqrstuvwxyz';

/* Everything below is in pixels-per-frame at 60fps, scaled by real elapsed
   time so a slower tablet plays the same game rather than a slower one. */
const GRAVITY   = 0.34;
const LIFT      = -0.62;
const MAX_FALL  = 6.5;
const MAX_RISE  = -6.0;
const SPEED     = 2.5;
const GAP_H     = 0.52;      // gap height as a fraction of the pond
const ROCK_W    = 46;
const SPAWN_MS  = 2100;     // between pairs of rocks
const SAFE_MS   = 1400;      // grace after a bump
const PET_SIZE  = 62;

const letters = text => String(text).toLowerCase().replace(/[^a-z]/g, '');

export default function swim(ctx) {
  const queue = gameWords(WORDS_PER_ROUND, { minLength: 2 });
  if (!queue.length) {
    return mount(ctx.stage, el('div', { class: 'card center stack' },
      el('h2', { text: 'No words yet' }),
      el('p', { class: 'muted', text: 'Ask a grown-up to add this week’s spelling list.' }),
      button('Back to games', { cls: 'btn btn-primary', onClick: ctx.quit })
    ));
  }

  const buddy = createBuddy({ layout: 'voice', greeting: 'Hold the pond to swim up!' });
  ctx.onCleanup(() => buddy.stop());

  /* ---------- Layout ---------- */

  const wordStrip = el('div', { class: 'swim-word' });
  const bubbleRow = el('div', { class: 'swim-bubbles' });
  const pond      = el('div', { class: 'swim-pond' });
  const petNode   = el('div', { class: 'swim-pet', html: petSprite('excited') });
  const overlay   = el('div', { class: 'swim-overlay' });
  pond.append(petNode, overlay);

  const body = el('div', { class: 'game-body swim-wrap' },
    el('div', { class: 'swim-hud' }, wordStrip, bubbleRow),
    pond,
    el('div', { class: 'swim-foot' }, buddy.node)
  );

  mount(ctx.stage, gameHeader('Axolotl Swim', { onQuit: () => leave() }), body);

  /* ---------- State ---------- */

  let wordIndex = 0;
  let target = letters(queue[0].text);
  let got = 0;
  let bubbles = START_BUBBLES;
  let wordsWon = 0;

  let y = 120;
  let vy = 0;
  let holding = false;
  let safeUntil = 0;
  let rocks = [];      // { x, gapTop, node, top, bottom, passed }
  let tokens = [];     // { x, y, ch, good, node }
  let spawnAt = 0;
  let decoyAt = 0;
  let raf = null;
  let last = 0;
  let running = false;
  let over = false;

  const timers = [];
  const wait = (fn, ms) => { timers.push(setTimeout(fn, ms)); };
  ctx.onCleanup(() => timers.forEach(clearTimeout));

  const size = () => ({ w: pond.clientWidth || 480, h: pond.clientHeight || 260 });

  /* ---------- HUD ---------- */

  function drawWord() {
    clear(wordStrip);
    wordStrip.append(el('button', { class: 'icon-btn', type: 'button',
      'aria-label': 'Hear the word', onClick: () => speech.speakWord(queue[wordIndex]) }, '\u{1F50A}'));
    target.split('').forEach((ch, i) => {
      wordStrip.append(el('span', { class: i < got ? 'swim-slot swim-slot-on' : 'swim-slot',
        text: i < got ? ch : '·' }));
    });
    wordStrip.append(el('span', { class: 'tiny muted', text: ` ${wordIndex + 1} of ${queue.length}` }));
  }

  function drawBubbles() {
    clear(bubbleRow);
    for (let i = 0; i < START_BUBBLES; i++) {
      bubbleRow.append(el('span', {
        class: i < bubbles ? 'swim-bubble' : 'swim-bubble swim-bubble-gone', text: '\u{1FAE7}' }));
    }
  }

  /* ---------- World ---------- */

  function needed() { return target[got] || ''; }

  function spawnRock() {
    const { w, h } = size();
    const gapH = Math.max(140, h * GAP_H);
    const gapTop = 18 + Math.random() * Math.max(10, h - gapH - 36);

    const top = el('div', { class: 'swim-rock swim-rock-top' });
    const bottom = el('div', { class: 'swim-rock swim-rock-bottom' });
    const x = w + ROCK_W;

    place(top, x, 0, ROCK_W, gapTop);
    place(bottom, x, gapTop + gapH, ROCK_W, Math.max(0, h - gapTop - gapH));
    pond.append(top, bottom);
    rocks.push({ x, gapTop, gapH, top, bottom });

    /* Only ever the letter she needs, riding in the middle of the gap she
       has to fly through anyway — so getting through cleanly IS collecting
       it. Sometimes the gap is empty and the passage is simply free. */
    if (needed() && Math.random() < 0.72) {
      addToken(needed(), x + 4, gapTop + gapH / 2 - 18, true);
    }
  }

  /* Wrong letters live in open water, well clear of any gap, so she can
     always swim over or under them. */
  function spawnDecoy() {
    const { w, h } = size();
    const ch = randomOther();
    if (!ch) return;
    const y = 24 + Math.random() * Math.max(10, h - 84);
    addToken(ch, w + 40, y, false);
  }

  function addToken(ch, x, y2, good) {
    const node = el('div', { class: `swim-token${good ? ' swim-token-good' : ''}`, text: ch });
    place(node, x, y2, 36, 36);
    pond.append(node);
    tokens.push({ x, y: y2, ch, good, node });
  }

  function randomOther() {
    let ch = needed();
    while (!ch || ch === needed()) ch = ALPHABET[Math.floor(Math.random() * 26)];
    return ch;
  }

  /* Positioned with left/top rather than a transform: the bump flash and
     the celebration both animate transforms, and a transform used for
     layout is exactly what makes a sprite leap sideways mid-animation. */
  function place(node, x, y2, w, h) {
    node.style.left = `${x}px`;
    node.style.top = `${y2}px`;
    node.style.width = `${w}px`;
    node.style.height = `${h}px`;
  }

  function clearWorld() {
    rocks.forEach(r => { r.top.remove(); r.bottom.remove(); });
    tokens.forEach(t => t.node.remove());
    rocks = [];
    tokens = [];
  }

  /* ---------- The loop ---------- */

  function frame(now) {
    if (!running) return;
    const dt = Math.min(2.6, (now - last) / 16.67 || 1);
    last = now;
    const { w, h } = size();

    vy += (holding ? LIFT : GRAVITY) * dt;
    vy = Math.max(MAX_RISE, Math.min(MAX_FALL, vy));
    y += vy * dt;

    // The surface and the pond floor are soft: she bumps and stays, rather
    // than the run ending because she drifted.
    if (y < 0) { y = 0; vy = 0; }
    if (y > h - PET_SIZE) { y = h - PET_SIZE; vy = 0; }
    petNode.style.top = `${y}px`;

    const petX = Math.round(w * 0.2);
    petNode.style.left = `${petX}px`;
    const petBox = { x: petX + 8, y: y + 10, w: PET_SIZE - 16, h: PET_SIZE - 20 };

    spawnAt -= dt * 16.67;
    if (spawnAt <= 0) { spawnRock(); spawnAt = SPAWN_MS - wordIndex * 120; }

    // Half a beat behind the rocks, so a decoy never arrives alongside one.
    decoyAt -= dt * 16.67;
    if (decoyAt <= 0) { spawnDecoy(); decoyAt = SPAWN_MS - wordIndex * 120; }

    const step = SPEED * dt * (1 + wordIndex * 0.12);

    rocks.forEach(rock => {
      rock.x -= step;
      rock.top.style.left = `${rock.x}px`;
      rock.bottom.style.left = `${rock.x}px`;
    });
    tokens.forEach(token => {
      token.x -= step;
      token.node.style.left = `${token.x}px`;
    });

    rocks = rocks.filter(rock => {
      if (rock.x > -ROCK_W - 4) return true;
      rock.top.remove(); rock.bottom.remove();
      return false;
    });
    tokens = tokens.filter(token => {
      if (token.x > -44) return true;
      token.node.remove();
      return false;
    });

    // Rocks
    if (now > safeUntil) {
      for (const rock of rocks) {
        const overlapX = petBox.x < rock.x + ROCK_W && petBox.x + petBox.w > rock.x;
        if (!overlapX) continue;
        const inGap = petBox.y > rock.gapTop && petBox.y + petBox.h < rock.gapTop + rock.gapH;
        if (inGap) continue;
        bump(now);
        break;
      }
    }

    // Letters
    for (let i = tokens.length - 1; i >= 0; i--) {
      const token = tokens[i];
      const hit = petBox.x < token.x + 36 && petBox.x + petBox.w > token.x
               && petBox.y < token.y + 36 && petBox.y + petBox.h > token.y;
      if (!hit) continue;
      token.node.remove();
      tokens.splice(i, 1);
      if (token.good && token.ch === needed()) grabLetter(token.ch);
      else buddy.say('Not that letter — keep going!');
    }

    raf = requestAnimationFrame(frame);
  }

  function bump(now) {
    bubbles -= 1;
    safeUntil = now + SAFE_MS;
    petNode.classList.add('swim-hurt');
    setTimeout(() => petNode.classList.remove('swim-hurt'), SAFE_MS);
    vy = -1.4;
    drawBubbles();
    buddy.sympathise(bubbles > 0 ? 'Oof! Mind the rocks.' : 'That is enough swimming for now.');
    if (bubbles <= 0) endRound(false);
  }

  function grabLetter(ch) {
    got += 1;
    drawWord();
    buddy.react({ mood: 'excited', text: `${ch.toUpperCase()}!`, ms: 800 });
    if (got >= target.length) finishWord();
  }

  function finishWord() {
    const word = queue[wordIndex];
    ctx.record(word, true);
    wordsWon += 1;
    stop();
    speech.speakWord(word);
    buddy.celebrate(`${word.text}!`);
    mount(overlay, el('div', { class: 'swim-banner' },
      el('div', { class: 'big', text: word.text }),
      el('div', { class: 'tiny', text: 'Collected!' })
    ));

    wait(() => {
      if (over) return;
      clear(overlay);
      wordIndex += 1;
      if (wordIndex >= queue.length) return endRound(true);
      target = letters(queue[wordIndex].text);
      got = 0;
      clearWorld();
      spawnAt = 600;
      decoyAt = 600 + SPAWN_MS / 2;
      drawWord();
      start();
    }, 1800);
  }

  function endRound(allDone) {
    if (over) return;
    over = true;
    stop();
    const left = queue.slice(wordsWon);
    wait(() => ctx.finish({
      wordsWon,
      bonus: allDone, bonusLabel: 'Every word collected!',
      headline: allDone ? 'All the way through!' : 'Great swimming!',
      detail: `${wordsWon} of ${queue.length} words collected`,
      emoji: '\u{1F30A}', celebrate: allDone,
      missed: allDone ? [] : left,
    }), 1200);
  }

  function start() {
    if (over) return;
    running = true;
    last = performance.now();
    raf = requestAnimationFrame(frame);
  }

  function stop() {
    running = false;
    if (raf) cancelAnimationFrame(raf);
    raf = null;
  }

  ctx.onCleanup(stop);

  /* ---------- Controls ---------- */

  const down = e => { holding = true; if (e.cancelable) e.preventDefault(); };
  const up = () => { holding = false; };
  pond.addEventListener('pointerdown', down);
  addEventListener('pointerup', up);
  addEventListener('pointercancel', up);
  ctx.onCleanup(() => {
    pond.removeEventListener('pointerdown', down);
    removeEventListener('pointerup', up);
    removeEventListener('pointercancel', up);
  });

  const onKeyDown = e => {
    if (e.key === ' ' || e.key === 'ArrowUp') { holding = true; e.preventDefault(); }
  };
  const onKeyUp = e => {
    if (e.key === ' ' || e.key === 'ArrowUp') { holding = false; e.preventDefault(); }
  };
  addEventListener('keydown', onKeyDown);
  addEventListener('keyup', onKeyUp);
  ctx.onCleanup(() => {
    removeEventListener('keydown', onKeyDown);
    removeEventListener('keyup', onKeyUp);
  });

  function leave() {
    if (!wordsWon) return ctx.quit();
    endRound(false);
  }

  /* ---------- Go ---------- */

  drawWord();
  drawBubbles();
  petNode.style.top = `${y}px`;
  spawnAt = 900;
  decoyAt = 900 + SPAWN_MS / 2;
  // One beat to let the pond get its size before anything starts moving.
  wait(start, 260);
}
