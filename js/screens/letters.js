/* Letters.

   Marbles writes; she writes back. The writing back is the feature: she
   picks which of her own words to send, hears it, and spells it on the
   same keyboard she spells everything else on.

   THREE THINGS THAT ARE DELIBERATELY NOT HERE.

   It is not a test and does not pretend to be. She chooses the word, she
   hears it first, and a wrong answer just gets rubbed out and tried again
   — so nothing here moves a word towards mastery, the same rule the games
   live under. It pays stars.

   There is no inbox. One letter at a time, no counter, no list of things
   she has not answered, nothing that makes a fortnight away into a debt.

   And she can read the whole correspondence back whenever she likes,
   which is most of the point of writing letters in the first place.
*/

import { el, mount, button, clear } from '../ui/dom.js';
import { navigate } from '../ui/router.js';
import { buildKeyboard, watchPhysicalKeyboard } from '../ui/keyboard.js';
import { toast, confetti } from '../ui/toast.js';

import { burst } from '../ui/fx.js';
import * as speech from '../core/speech.js';
import * as letters from '../core/letters.js';
import * as rewards from '../core/rewards.js';
import { petSVG } from '../ui/art.js';
import { coatByKey, STAGES } from '../core/pet.js';

/* What a finished letter is worth. About a game, and well under a day's
   practice — see the ceiling note in core/games.js. */
const STARS_PER_WORD = 3;
const STARS_POSTED = 4;

export default function lettersScreen(container) {
  if (!letters.lettersOpen()) { navigate('/'); return; }

  /* A letter may have fallen through the door while she was elsewhere. */
  letters.deliverIfDue();

  let view = letters.waiting() ? 'read' : 'thread';
  let stopKeys = null;
  const dropKeys = () => { stopKeys?.(); stopKeys = null; };

  /* ---------- Writing back ---------- */
  let shape = null;        // the two half-sentences she is filling in
  let filled = [];         // { lead, word } for the blanks she has done
  let choices = [];        // the words on offer for the blank she is on
  let target = null;       // the one she picked, being spelled now
  let typed = '';
  let locked = false;

  function startReply() {
    shape = letters.replyShape();
    filled = [];
    target = null;
    typed = '';
    locked = false;
    nextBlank();
    view = 'write';
    render();
  }

  function nextBlank() {
    choices = letters.wordChoices(filled.map(f => f.word));
    target = null;
    typed = '';
  }

  function chooseWord(word) {
    target = word;
    typed = '';
    locked = false;
    render();
    /* Heard, not shown — she has picked it, now she has to spell it. */
    speech.speak(word.text);
  }

  function say() { if (target) speech.speak(target.text); }

  function typeLetter(ch) {
    if (locked || !target || typed.length >= 24) return;
    typed += ch;
    paintTiles();
  }

  function backspace() {
    if (locked || !typed) return;
    typed = typed.slice(0, -1);
    paintTiles();
  }

  function submit() {
    if (locked || !target || !typed) return;
    const right = typed.toLowerCase() === target.text.toLowerCase();
    locked = true;

    if (!right) {
      /* A letter, not a test: it is rubbed out and she goes again, and
         the word she chose stays chosen. */
      const board = container.querySelector('.lt-answer');
      board?.classList.add('lt-wrong');
      speech.speak(target.text);
      setTimeout(() => {
        board?.classList.remove('lt-wrong');
        typed = '';
        locked = false;
        paintTiles();
      }, 900);
      return;
    }

    filled.push({ lead: shape[filled.length], word: target.text });
    const done = filled.length >= shape.length;
    setTimeout(() => {
      if (done) postIt();
      else { nextBlank(); render(); }
    }, 550);
  }

  function postIt() {
    letters.sendReply(filled);
    const stars = rewards.awardStars(
      STARS_POSTED + filled.length * STARS_PER_WORD, 'letter');
    confetti(30);
    view = 'posted';
    render();
    if (stars) toast(`+${stars} stars`);
  }

  /* ---------- Drawing it ---------- */

  function letterCard(entry, { fresh = false } = {}) {
    const mine = entry.from === 'her';
    return el('div', { class: `lt-paper${mine ? ' lt-mine' : ''}${fresh ? ' lt-fresh' : ''}` },
      el('div', { class: 'lt-head' },
        /* Marbles is the same axolotl drawing in a coat she has not got,
           so he is plainly somebody else and costs no new artwork. */
        mine ? null : el('div', { class: 'lt-stamp',
          html: petSVG({ coat: coatByKey(letters.PAL.coat),
                         stage: STAGES[STAGES.length - 2], mood: 'happy', alive: false }) }),
        el('div', { class: 'grow' },
          el('div', { class: 'lt-from', text: mine ? 'You wrote' : `From ${letters.PAL.name}` }),
          el('div', { class: 'lt-when', text: letters.whenSent(entry.at) }))
      ),
      el('div', { class: 'lt-body' },
        entry.lines.map(line => el('p', { class: 'lt-line', text: line })))
    );
  }

  function readView() {
    const letter = letters.lastLetter();
    letters.markRead();
    if (!letter) { view = 'thread'; return threadView(); }

    return el('div', { class: 'stack' },
      letterCard(letter, { fresh: true }),
      button('Write back', { cls: 'btn btn-primary btn-block', emoji: '✏️',
        onClick: startReply }),
      button('Read them all', { cls: 'btn btn-quiet btn-block', emoji: '\u{1F4EC}',
        onClick: () => { view = 'thread'; render(); } }),
      backHome()
    );
  }

  function writeView() {
    const cap = t => t.charAt(0).toUpperCase() + t.slice(1);
    const done = filled.map(f =>
      el('p', { class: 'lt-line', text: `${cap(f.lead)} ${f.word}.` }));

    const body = el('div', { class: 'stack' },
      el('div', { class: 'lt-paper lt-mine' },
        el('div', { class: 'lt-head' },
          el('div', { class: 'grow' },
            el('div', { class: 'lt-from', text: `To ${letters.PAL.name}` }))),
        el('div', { class: 'lt-body' },
          done,
          el('p', { class: 'lt-line lt-writing' },
            el('span', { text: cap(shape[filled.length]) + ' ' }),
            target
              ? el('span', { class: 'lt-answer' }, ...tiles())
              : el('span', { class: 'lt-choose', text: '…' })))
      )
    );

    if (!target) {
      body.append(
        el('p', { class: 'center tiny muted', text: 'Which word shall we send?' }),
        el('div', { class: 'lt-choices' }, choices.map(w =>
          button(w.text, { cls: 'btn btn-quiet lt-choice', onClick: () => chooseWord(w) })))
      );
    } else {
      body.append(
        el('div', { class: 'row', style: { justifyContent: 'center' } },
          button('Say it again', { cls: 'btn btn-quiet', emoji: '\u{1F50A}', onClick: say }),
          button('Pick a different word', { cls: 'btn btn-quiet', emoji: '\u{1F504}',
            onClick: () => { target = null; typed = ''; render(); } })),
        el('div', { class: 'keyboard' })
      );
    }
    body.append(backHome());
    return body;
  }

  function postedView() {
    const t = letters.thread();
    const mine = t[t.length - 1];
    return el('div', { class: 'stack' },
      el('div', { class: 'card center' },
        el('div', { style: { fontSize: '2.4rem' }, text: '\u{1F4EE}' }),
        el('h2', { text: 'Posted!' }),
        el('p', { class: 'muted tiny', text:
          `${letters.PAL.name} will write back in a day or two.` })),
      mine ? letterCard(mine) : null,
      button('Read them all', { cls: 'btn btn-quiet btn-block', emoji: '\u{1F4EC}',
        onClick: () => { view = 'thread'; render(); } }),
      backHome()
    );
  }

  function threadView() {
    const t = letters.thread().slice().reverse();
    return el('div', { class: 'stack' },
      t.length
        ? el('div', { class: 'stack' }, t.map(e => letterCard(e)))
        : el('div', { class: 'card center' },
            el('p', { class: 'muted', text: 'No letters yet. One will come.' })),
      backHome()
    );
  }

  const backHome = () => button('Back to the garden', {
    cls: 'btn btn-quiet btn-block', emoji: '\u{1F33F}',
    onClick: () => navigate('/garden') });

  /* The same tiles the spelling screens use: one box per letter typed,
     and empty boxes for the rest of the word so she can see how long it
     is going to be. */
  function tiles() {
    const out = [];
    const len = Math.max(target.text.length, typed.length);
    for (let i = 0; i < len; i++) {
      out.push(el('span', { class: `lt-tile${typed[i] ? ' filled' : ''}`,
        text: typed[i] || '' }));
    }
    return out;
  }

  function paintTiles() {
    const box = container.querySelector('.lt-answer');
    if (!box) return render();
    clear(box);
    tiles().forEach(t => box.append(t));
  }

  function render() {
    dropKeys();
    const screen =
      view === 'read'   ? readView()
      : view === 'write'  ? writeView()
      : view === 'posted' ? postedView()
      : threadView();

    mount(container, screen);

    if (view === 'write' && target) {
      const host = container.querySelector('.keyboard');
      if (host) {
        buildKeyboard(host, {
          onLetter: typeLetter, onBackspace: backspace, onEnter: submit,
          enterLabel: 'Write it',
        });
        stopKeys = watchPhysicalKeyboard({
          onLetter: typeLetter, onBackspace: backspace, onEnter: submit,
        });
      }
    }
  }

  render();
  return () => { dropKeys(); speech.stop(); };
}
