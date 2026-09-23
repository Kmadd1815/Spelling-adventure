/* Write It — tracing letters with a finger.

   Everything else in this app is a keyboard. Her spelling test at school is
   a pencil, and the gap between the two is real: a child can know how a
   word is spelled and still not be able to write it, because forming the
   letters is its own skill and it is the one a tablet never asks for.

   So this asks for it. One big letter at a time, a faint grey letter to
   trace over, ruled lines behind it the way handwriting paper has them,
   and a finger.

   THREE THINGS IT DELIBERATELY DOES NOT DO.

   It does not mark her handwriting. It checks two things: how much of the
   letter she covered, and how much of her ink went somewhere else. That is
   an honest measure of "did you follow the shape" and it is not an opinion
   about her letter formation, which is her teacher's job and needs an eye.

   It does not check stroke order or direction. Checking it badly would be
   worse than not checking it, and the app cannot see her hand.

   It does not touch mastery, and it does not even record the attempt.
   Tracing a word is not evidence that she can spell it — the letters are
   right there on the screen — and a game that quietly inflated her
   correct-answer count would make every number in the Parent Area a little
   less true. She gets the stars and none of the credit.

   And she is never stuck. Two goes at a letter, then it moves on with a
   kind word, because a nine year old who cannot get past the 'g' will put
   the tablet down and not pick it up again.
*/

import { el, mount, clear, button } from '../ui/dom.js';
import { gameHeader } from '../screens/play.js';
import { createBuddy } from '../ui/buddy.js';
import * as speech from '../core/speech.js';
import { gameWords, rampStep } from '../core/games.js';

const WANT_WORDS = 3;        // three words of tracing is a real go at it
const MAX_LETTERS = 8;       // a very long word is traced in part, not for ever
const TRIES = 2;             // then it moves on, always

/* How well she has to follow the shape. Forgiving on purpose: this is a
   finger on glass, not a pen, and the target is "you followed the letter",
   not "your handwriting is neat". */
const NEED_COVER = 0.62;     // of the letter, covered by her ink
const ALLOW_STRAY = 0.5;     // of her ink, allowed to land off the letter
const NEED_INK = 0.15;       // she has to have actually drawn something

/* ---------- The measuring ----------

   Three bitmaps of the same size:

     strict  the letter, filled. What she is meant to cover.
     loose   the letter, filled AND outlined by half a brush width. The
             wobble room — ink in here is on the letter as far as a finger
             is concerned.
     ink     what she drew.

   Exported because it is the only part worth testing without a finger.
*/
export function scoreTrace(strict, loose, ink) {
  let letter = 0, covered = 0, drawn = 0, stray = 0;
  /* Alpha only, every fourth byte. */
  for (let i = 3; i < strict.length; i += 4) {
    const onLetter = strict[i] > 128;
    const nearLetter = loose[i] > 128;
    const hasInk = ink[i] > 128;
    if (onLetter) { letter++; if (hasInk) covered++; }
    if (hasInk) { drawn++; if (!nearLetter) stray++; }
  }
  const coverage = letter ? covered / letter : 0;
  const strayed = drawn ? stray / drawn : 1;
  const enoughInk = letter ? drawn / letter >= NEED_INK : false;
  return {
    coverage, stray: strayed, ink: drawn, letter,
    ok: enoughInk && coverage >= NEED_COVER && strayed <= ALLOW_STRAY,
    /* Which of the two went wrong, so she can be told something useful
       rather than "try again". */
    reason: !enoughInk ? 'empty' : coverage < NEED_COVER ? 'missed' : strayed > ALLOW_STRAY ? 'wandered' : 'ok',
  };
}

export default function traceGame(ctx) {
  const picked = gameWords(WANT_WORDS, { minLength: 2 });

  if (!picked.length) {
    return mount(ctx.stage, el('div', { class: 'card center stack' },
      el('h2', { text: 'No words to write yet' }),
      el('p', { class: 'muted', text: 'A grown-up can add this week’s words in My Words.' }),
      button('Back to games', { cls: 'btn btn-primary', onClick: ctx.quit })
    ));
  }

  const buddy = createBuddy({ layout: 'side', greeting: 'Trace it with your finger!' });
  ctx.onCleanup(() => buddy.stop());

  const timers = [];
  const wait = (fn, ms) => { const t = setTimeout(fn, ms); timers.push(t); return t; };
  ctx.onCleanup(() => timers.forEach(clearTimeout));

  let wordIndex = 0;
  let letterIndex = 0;
  let tries = 0;
  let wordsWon = 0;
  let cleanRun = true;

  const wordOf = () => picked[wordIndex];
  const lettersOf = w => w.text.replace(/[^a-z']/gi, '').slice(0, MAX_LETTERS).split('');

  /* ---------- Layout ---------- */
  const wordLine = el('div', { class: 'trace-word' });
  const sayLine  = el('div', { class: 'trace-say' });
  const pad      = el('div', { class: 'trace-pad' });
  const verdict  = el('div', { class: 'trace-verdict' });

  const guide = el('canvas', { class: 'trace-guide' });
  const inkC  = el('canvas', { class: 'trace-ink' });
  pad.append(guide, inkC);

  const rubOut = button('Rub it out', { cls: 'btn btn-quiet grow', emoji: '\u{1F9FD}',
    onClick: () => { clearInk(); verdict.textContent = ''; } });
  const done = button('Done', { cls: 'btn btn-primary grow', emoji: '✓',
    onClick: check });

  const body = el('div', { class: 'game-body trace-wrap' },
    el('div', { class: 'trace-col' },
      wordLine, sayLine, pad, verdict,
      el('div', { class: 'row trace-buttons' }, rubOut, done)),
    el('div', { class: 'trace-side' }, buddy.node)
  );

  mount(ctx.stage, gameHeader('Write It', { onQuit: ctx.quit }), body);

  /* ---------- The canvases ---------- */
  const strictC = document.createElement('canvas');
  const looseC  = document.createElement('canvas');
  let W = 0, H = 0, brush = 18;

  function sizeUp() {
    const rect = pad.getBoundingClientRect();
    /* Headless and hidden layouts report zero; a sane default keeps the
       game drawable rather than dividing by nothing. */
    W = Math.max(240, Math.round(rect.width) || 420);
    H = Math.max(200, Math.round(rect.height) || 340);
    for (const c of [guide, inkC, strictC, looseC]) { c.width = W; c.height = H; }
    guide.style.width = inkC.style.width = '100%';
    guide.style.height = inkC.style.height = '100%';
    /* Thick enough that following the middle of a letter covers it. A
       thin brush against a fat letter means an honest trace scores badly,
       which is the fastest way to teach a child that trying does not
       work. */
    brush = Math.max(16, Math.round(H * 0.075));
  }

  /* The letter, drawn the same way four times over. */
  function letterFont() {
    const family = getComputedStyle(document.body).fontFamily || 'sans-serif';
    return { family, size: Math.round(H * 0.62), baseline: Math.round(H * 0.78) };
  }

  function paintLetter(c2d, { fill = null, stroke = null, width = 0 } = {}) {
    const f = letterFont();
    c2d.save();
    /* Not bold: a fat letter cannot be covered by a finger following its
       middle, and this is a tracing target, not a headline. */
    c2d.font = `500 ${f.size}px ${f.family}`;
    c2d.textAlign = 'center';
    c2d.textBaseline = 'alphabetic';
    const ch = lettersOf(wordOf())[letterIndex] || '';
    if (fill) { c2d.fillStyle = fill; c2d.fillText(ch, W / 2, f.baseline); }
    if (stroke) {
      c2d.strokeStyle = stroke; c2d.lineWidth = width;
      c2d.lineJoin = 'round'; c2d.lineCap = 'round';
      c2d.strokeText(ch, W / 2, f.baseline);
    }
    c2d.restore();
  }

  /* Handwriting paper: a top line, a dashed middle, a solid base and a
     faint one below for the tails. Behind the letter, as on real paper. */
  function paintRules(c2d) {
    const f = letterFont();
    const base = f.baseline;
    const top = base - f.size * 0.72;
    const mid = base - f.size * 0.36;
    const tail = base + f.size * 0.22;
    c2d.save();
    c2d.lineWidth = 2;
    const line = (y, colour, dash) => {
      c2d.beginPath(); c2d.setLineDash(dash); c2d.strokeStyle = colour;
      c2d.moveTo(W * 0.06, y); c2d.lineTo(W * 0.94, y); c2d.stroke();
    };
    line(top,  'rgba(122,96,77,.22)', []);
    line(mid,  'rgba(122,96,77,.30)', [8, 10]);
    line(base, 'rgba(122,96,77,.45)', []);
    line(tail, 'rgba(122,96,77,.16)', []);
    c2d.restore();
  }

  function paintGuide() {
    const g = guide.getContext('2d');
    g.clearRect(0, 0, W, H);
    paintRules(g);
    /* Faint, but not so faint it cannot be followed by a child looking at
       it from an angle with the lights on. */
    paintLetter(g, { fill: 'rgba(122,96,77,.22)' });
    paintLetter(g, { stroke: 'rgba(122,96,77,.34)', width: 2 });
  }

  function paintMasks() {
    const s = strictC.getContext('2d');
    s.clearRect(0, 0, W, H);
    paintLetter(s, { fill: '#000' });

    const l = looseC.getContext('2d');
    l.clearRect(0, 0, W, H);
    paintLetter(l, { fill: '#000', stroke: '#000', width: brush * 1.1 });
  }

  function clearInk() {
    const i = inkC.getContext('2d');
    i.clearRect(0, 0, W, H);
  }

  /* ---------- Her finger ---------- */
  let drawing = false, lastX = 0, lastY = 0, anyInk = false;

  const at = ev => {
    const r = inkC.getBoundingClientRect();
    return { x: (ev.clientX - r.left) * (W / r.width),
             y: (ev.clientY - r.top) * (H / r.height) };
  };

  const startStroke = ev => {
    ev.preventDefault();
    drawing = true; anyInk = true;
    const p = at(ev); lastX = p.x; lastY = p.y;
    /* A tap is a dot, not nothing — a full stop and the dot on an i are
       both single taps. */
    const i = inkC.getContext('2d');
    i.fillStyle = '#4a3b32';
    i.beginPath(); i.arc(p.x, p.y, brush / 2, 0, Math.PI * 2); i.fill();
    try { inkC.setPointerCapture(ev.pointerId); } catch { /* not all pointers */ }
  };

  const moveStroke = ev => {
    if (!drawing) return;
    ev.preventDefault();
    const p = at(ev);
    const i = inkC.getContext('2d');
    i.strokeStyle = '#4a3b32';
    i.lineWidth = brush; i.lineCap = 'round'; i.lineJoin = 'round';
    i.beginPath(); i.moveTo(lastX, lastY); i.lineTo(p.x, p.y); i.stroke();
    lastX = p.x; lastY = p.y;
  };

  const endStroke = () => { drawing = false; };

  inkC.addEventListener('pointerdown', startStroke);
  inkC.addEventListener('pointermove', moveStroke);
  inkC.addEventListener('pointerup', endStroke);
  inkC.addEventListener('pointercancel', endStroke);
  inkC.addEventListener('pointerleave', endStroke);
  ctx.onCleanup(() => {
    inkC.removeEventListener('pointerdown', startStroke);
    inkC.removeEventListener('pointermove', moveStroke);
    inkC.removeEventListener('pointerup', endStroke);
    inkC.removeEventListener('pointercancel', endStroke);
    inkC.removeEventListener('pointerleave', endStroke);
  });

  /* ---------- A go at a letter ---------- */
  function check() {
    const data = c => c.getContext('2d').getImageData(0, 0, W, H).data;
    const result = scoreTrace(data(strictC), data(looseC), data(inkC));

    if (result.ok) {
      verdict.textContent = tries ? '✓ That is it.' : '✓ Lovely.';
      verdict.className = 'trace-verdict good';
      buddy.say('Yes!');
      wait(nextLetter, 750);
      return;
    }

    tries += 1;
    cleanRun = false;
    if (tries >= TRIES) {
      /* Never stuck. */
      verdict.textContent = 'Good try — on to the next one.';
      verdict.className = 'trace-verdict';
      wait(nextLetter, 1100);
      return;
    }

    verdict.textContent = result.reason === 'empty'
      ? 'Draw over the grey letter with your finger.'
      : result.reason === 'wandered'
        ? 'Nearly! Try to stay on the grey letter.'
        : 'Nearly! Try to cover all of the grey letter.';
    verdict.className = 'trace-verdict';
    buddy.say('Have another go.');
    wait(() => { clearInk(); anyInk = false; }, 600);
  }

  function nextLetter() {
    const letters = lettersOf(wordOf());
    letterIndex += 1;
    tries = 0;
    if (letterIndex >= letters.length) {
      wordsWon += 1;
      buddy.say('You wrote the whole word!');
      wordIndex += 1;
      letterIndex = 0;
      if (wordIndex >= picked.length) { wait(end, 900); return; }
      wait(showWord, 900);
      return;
    }
    showLetter();
  }

  function showWord() {
    const w = wordOf();
    speech.speak(w.text);
    showLetter();
  }

  function showLetter() {
    const letters = lettersOf(wordOf());
    clear(wordLine);
    letters.forEach((ch, i) => wordLine.append(
      el('span', { class: i < letterIndex ? 'trace-ch done' : i === letterIndex ? 'trace-ch now' : 'trace-ch',
                   text: ch })));
    sayLine.textContent = `Word ${wordIndex + 1} of ${picked.length} · letter ${letterIndex + 1} of ${letters.length}`;
    verdict.textContent = '';
    verdict.className = 'trace-verdict';

    sizeUp();
    paintGuide();
    paintMasks();
    clearInk();
    anyInk = false;
  }

  function end() {
    ctx.finish({
      wordsWon,
      wordsPlayed: picked.length,
      bonus: cleanRun && wordsWon === picked.length,
      bonusLabel: 'Every letter first time',
      headline: wordsWon === picked.length ? 'You wrote them all!' : 'Nice writing!',
      detail: `${wordsWon} word${wordsWon === 1 ? '' : 's'} written by hand.`,
      emoji: '✍️',
      celebrate: cleanRun && wordsWon === picked.length,
    });
  }

  /* The pad has to be on the screen before it can be measured. */
  requestAnimationFrame(() => { showWord(); });
}
