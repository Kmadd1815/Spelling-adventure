/* Which One Is Right?

   Two spellings of the same word, one of them wrong. She taps the right one.

   This is the only game here that asks her to RECOGNISE a spelling rather
   than produce one, and that is worth having for one specific reason: it is
   what she actually does when she proofreads. Every other game hands her a
   blank and a keyboard. This one hands her a word that looks almost right
   and asks whether it is — which is the skill that catches "freind" in her
   own writing on Monday morning.

   One wrong option, never two. Three choices turns it into a guessing game
   with a one-in-three floor and, worse, puts two misspellings in front of
   her at once. With two options a guess is a coin toss, which she notices,
   and there is only ever one wrong shape on the screen.

   And the right spelling is held on the screen after every single answer,
   right or wrong. A child who picks the wrong card and is whisked on to the
   next word has just spent two seconds looking hard at a misspelling and
   has never once seen the real one. That is the opposite of the point.
*/

import { el, mount, clear, button } from '../ui/dom.js';
import { gameHeader } from '../screens/play.js';
import { createBuddy } from '../ui/buddy.js';
import * as speech from '../core/speech.js';
import { gameWords } from '../core/games.js';

const WANT_WORDS = 6;
const HOLD_RIGHT = 1300;    // how long the answer stays up when she got it
const HOLD_WRONG = 2600;    // longer when she did not: this is the teaching

const VOWELS = 'aeiou';

/* ---------- Making a wrong one ----------

   Not random letters. A misspelling she would never write teaches nothing
   and is no fun to spot — the wrong card has to be the mistake a child
   actually makes, which is nearly always one of these five.
*/
const MUTATIONS = [
  /* freind: the i-before-e swap, the most common one in English. */
  w => {
    const i = w.indexOf('ie');
    if (i >= 0) return w.slice(0, i) + 'ei' + w.slice(i + 2);
    const j = w.indexOf('ei');
    return j >= 0 ? w.slice(0, j) + 'ie' + w.slice(j + 2) : null;
  },
  /* leter, schol, hapy: a double letter written once. */
  w => {
    for (let i = 1; i < w.length - 1; i++) {
      if (w[i] === w[i + 1]) return w.slice(0, i) + w.slice(i + 1);
    }
    return null;
  },
  /* hav, writ: the silent e dropped off the end. */
  w => (w.length > 3 && w.endsWith('e') && !VOWELS.includes(w[w.length - 2])
    ? w.slice(0, -1) : null),
  /* becuase, piant, juorney: two vowels sitting together change places.
     Only vowels — swapping any two letters gives scohol and brgiht, which
     read as a slipped finger rather than as not knowing the spelling. */
  w => {
    for (let i = 0; i < w.length - 1; i++) {
      if (VOWELS.includes(w[i]) && VOWELS.includes(w[i + 1]) && w[i] !== w[i + 1]
          /* A pair, not two out of a run of three: swapping inside beautiful
             gives baeutiful, which is nobody's mistake. */
          && !VOWELS.includes(w[i - 1] || '') && !VOWELS.includes(w[i + 2] || '')) {
        return w.slice(0, i) + w[i + 1] + w[i] + w.slice(i + 2);
      }
    }
    return null;
  },
];

/* Two more, kept back and only used when none of those fit.

   Doubling a consonant is a real mistake (latter for later) but on a word
   that has no doubling in it the result comes out as therre or recceive,
   which is not how anybody gets it wrong. And swapping a vowel is the one
   mutation that regularly lands on a different REAL word — letter becomes
   latter — and a wrong card that is itself a word is a muddle. */
const LAST_RESORT = [
  w => {
    for (let i = 1; i < w.length - 1; i++) {
      const c = w[i];
      if (!VOWELS.includes(c) && c !== w[i - 1] && c !== w[i + 1]
          && VOWELS.includes(w[i - 1]) && VOWELS.includes(w[i + 1])) {
        return w.slice(0, i) + c + w.slice(i);
      }
    }
    return null;
  },
];

const VOWEL_SWAP = w => {
  const swap = { a: 'e', e: 'a', i: 'e', o: 'u', u: 'o' };
  for (let i = 1; i < w.length; i++) {
    if (VOWELS.includes(w[i]) && swap[w[i]]) return w.slice(0, i) + swap[w[i]] + w.slice(i + 1);
  }
  return null;
};

/* A backstop against the wrong card being a real word by accident. It only
   has to cover words a child of eight has met, because those are the only
   ones a collision would confuse her about. */
const REAL_WORDS = new Set((
  'a an and are as at be been but by call can come could day did do down each ' +
  'find first for from get give go had has have he her here him his how i if ' +
  'in into is it its just know like little long look made make man many may me ' +
  'more most my new no not now number of oil on one only or other our out over ' +
  'part people said see she sit so some take than that the their them then there ' +
  'these they this three time to too two up use very was water way we were what ' +
  'when where which who will with word work would write you your ' +
  'later three thee tow won pat tap form trail trial ' +
  'latter dairy diary angel angle sacred scared broad board quite quiet ' +
  /* Three letters is where a swapped vowel lands on a real word most often,
     so the short ones are listed out. */
  'bad bed bid bud bag beg big bog bug ban bin bun bat bet bit but bad ' +
  'cap cup cat cot cut can con cast cost ' +
  'dig dog dug den din don fan fin fun far for fur ' +
  'gas get got gut had hid hop hip hat hot hut hen hand hind ' +
  'lap lip log leg let lot mad mud map mop mat met man men mat ' +
  'net nut nod nut pan pen pin pat pet pit pot put pig peg ' +
  'ran run rat rot rid rod red sad sat set sit sip sap son sun ' +
  'tan ten tin ton tap tip top tub tab wet wit win wan'
).split(' ').filter(Boolean));

/**
 * A wrong spelling of this word: a mistake a child would make, never the
 * same as the word, and never some OTHER word she is learning — being
 * marked wrong for tapping "there" when the answer was "their" would be
 * the app's fault, not hers.
 */
export function misspell(text, avoid = []) {
  const w = String(text || '').toLowerCase().trim();
  if (w.length < 3) return null;
  const banned = new Set([w, ...avoid.map(x => String(x).toLowerCase().trim())]);
  const usable = out => out && out !== w && !banned.has(out) && !REAL_WORDS.has(out);
  /* Start somewhere different each time so the same word does not always
     come up wrong in the same way. */
  const start = Math.floor(Math.random() * MUTATIONS.length);
  for (let k = 0; k < MUTATIONS.length; k++) {
    const out = MUTATIONS[(start + k) % MUTATIONS.length](w);
    if (usable(out)) return out;
  }
  for (const mutate of LAST_RESORT) {
    const out = mutate(w);
    if (usable(out)) return out;
  }
  const last = VOWEL_SWAP(w);
  return usable(last) ? last : null;
}

export default function spotIt(ctx) {
  /* Everything she is learning, so a mutation can never land on another of
     her words. */
  const everything = gameWords(60).map(w => w.text);

  const picked = gameWords(WANT_WORDS, { minLength: 3 })
    .map(w => ({ word: w, wrong: misspell(w.text, everything) }))
    .filter(x => x.wrong);

  if (picked.length < 2) {
    return mount(ctx.stage, el('div', { class: 'card center stack' },
      el('h2', { text: 'Not quite enough words' }),
      el('p', { class: 'muted', text:
        'This one needs a few words of three letters or more. A grown-up can add them in My Words.' }),
      button('Back to games', { cls: 'btn btn-primary', onClick: ctx.quit })
    ));
  }

  const buddy = createBuddy({ layout: 'side', greeting: 'Which one looks right?' });
  ctx.onCleanup(() => buddy.stop());

  const timers = [];
  const wait = (fn, ms) => { const t = setTimeout(fn, ms); timers.push(t); return t; };
  ctx.onCleanup(() => timers.forEach(clearTimeout));

  let index = 0;
  let locked = false;
  let won = 0;
  const missed = [];

  /* ---------- Layout ---------- */
  const pips    = el('div', { class: 'spell-progress' });
  const askNode = el('div', { class: 'spot-ask' });
  const cards   = el('div', { class: 'spot-cards' });
  const verdict = el('div', { class: 'spot-verdict' });

  const body = el('div', { class: 'game-body spot-wrap' },
    el('div', { class: 'spot-col' }, pips, askNode, cards, verdict),
    el('div', { class: 'spot-side' }, buddy.node)
  );

  mount(ctx.stage, gameHeader('Which One Is Right?', { onQuit: ctx.quit }), body);

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

  function show() {
    const { word, wrong } = current();
    locked = false;
    renderPips();
    verdict.textContent = '';
    verdict.className = 'spot-verdict';

    /* The word is NEVER written here — writing it would be printing the
       answer above the two cards. She hears it, and gets its meaning. */
    clear(askNode);
    askNode.append(
      speech.canSpeak()
        ? el('button', { class: 'speak-btn speak-btn-sm', type: 'button',
            'aria-label': 'Hear the word', onClick: () => speech.speakWord(word) }, '\u{1F50A}')
        : null,
      el('div', { class: 'spot-ask-text', text:
        (word.definition || '').trim() || 'Which spelling is right?' })
    );

    /* Which side the right one is on has to be a coin toss every time, or
       she learns the position instead of the spelling. */
    const options = Math.random() < 0.5
      ? [{ text: word.text, right: true }, { text: wrong, right: false }]
      : [{ text: wrong, right: false }, { text: word.text, right: true }];

    clear(cards);
    options.forEach(opt => {
      const card = el('button', {
        class: 'spot-card', type: 'button',
        onClick: () => choose(card, opt.right),
      }, el('span', { class: 'spot-word', text: opt.text }));
      card.dataset.right = opt.right ? '1' : '';
      cards.append(card);
    });

    if (speech.canSpeak()) wait(() => speech.speakWord(word), 240);
  }

  function choose(card, right) {
    if (locked) return;
    locked = true;
    const { word } = current();

    /* Both cards settle: the right one lights up, the wrong one is crossed
       through. She always leaves the screen having seen which was which. */
    [...cards.children].forEach(c => {
      c.classList.add('done');
      c.classList.add(c.dataset.right ? 'is-right' : 'is-wrong');
    });

    ctx.record(word, right);
    if (right) {
      won += 1;
      verdict.textContent = `Yes — ${word.text}`;
      verdict.className = 'spot-verdict good';
      buddy.say('Good eye!');
      wait(next, HOLD_RIGHT);
    } else {
      missed.push(word);
      card.classList.add('picked');
      verdict.textContent = `It is spelled ${word.text}`;
      verdict.className = 'spot-verdict bad';
      buddy.say('Look at the green one.');
      /* Letter by letter, so the fix goes in through her ears too. */
      if (speech.canSpeak()) {
        wait(() => speech.speak(word.text.split('').join(', ')), 520);
      }
      wait(next, HOLD_WRONG);
    }
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
      bonusLabel: 'Spotted every one',
      headline: clean ? 'You spotted every one!' : 'Nicely spotted!',
      detail: `${won} of ${picked.length} right`,
      emoji: '\u{1F440}',
      missed,
      celebrate: clean,
    });
  }

  show();
}
