/* The Paper Test.

   Her spelling test at school is on paper, in pencil, with nobody offering
   her a keyboard. Everything else in this app is typed — and typing a word
   and writing it are not the same skill. A child who can tap out "because"
   from a row of letters she can see may still stall with a pencil, and
   until now this app had no way of knowing that and no way of saying so.

   So this is the real thing, run properly:

     The app reads a word out and NEVER shows it. That is the whole point,
     and it is why this screen has no word on it anywhere until the marking
     starts — not in a corner, not greyed out, not "tap to reveal".

     She writes it on paper at her own pace. A grown-up moves it on.

     Then the correct spellings come up one at a time, big, and the
     grown-up marks each one against what is actually on the paper. The app
     cannot read her handwriting and does not pretend to: the person
     sitting next to her can.

   It counts. Every mark goes through the same words.recordAttempt() door
   as the Spelling Test, so a word she gets right here moves towards
   mastery exactly as it should, and one she misses goes back into the
   pool. It is a grown-up's activity to start — it needs somebody holding
   the paper — so it lives in the Parent Area rather than on her hub.
*/

import { el, mount, clear, button, modal } from '../ui/dom.js';
import { navigate } from '../ui/router.js';
import * as words from '../core/words.js';
import * as speech from '../core/speech.js';
import * as rewards from '../core/rewards.js';
import * as pet from '../core/pet.js';
import { getState, update } from '../core/state.js';
import { toast, confetti } from '../ui/toast.js';

export default function paperTestScreen(container, { listId = null } = {}) {
  let stage = 'setup';          // 'setup' | 'reading' | 'marking' | 'done'
  let queue = [];               // the words, in the order they are read
  let index = 0;
  const marks = new Map();      // word.id -> true | false

  const cleanup = () => speech.stop();

  /* ---------- 1. What are we testing? ---------- */
  function setup() {
    const lists = words.activeLists().filter(l => words.wordsInList(l.id).length > 0);
    const all = words.allWords();

    if (!all.length) {
      return mount(container, el('div', { class: 'card center stack' },
        el('h2', { text: 'No words yet' }),
        el('p', { class: 'muted', text: 'Add a spelling list first and the paper test will have something to ask.' }),
        button('Back', { cls: 'btn btn-primary', onClick: () => navigate('/parent') })
      ));
    }

    const start = source => {
      queue = words.shuffled(source);
      index = 0;
      marks.clear();
      stage = 'reading';
      render();
    };

    mount(container, el('div', { class: 'stack' },
      el('div', { class: 'card' },
        el('h2', { text: '✏️ Paper test' }),
        el('p', { class: 'muted tiny', text:
          'The way her test at school actually happens. Each word is read out and never shown — she writes it on paper, you move it along, and afterwards you mark what she wrote. It counts towards mastering a word exactly like the Spelling Test does.' }),
        el('p', { class: 'muted tiny', text:
          'You will need the paper and a pencil, and to sit with her. Nothing on this screen will give the word away.' })
      ),

      el('div', { class: 'card' },
        el('h3', { text: 'Which words?' }),
        el('div', { class: 'stack-sm' },
          ...lists.map(list => button(
            `${list.name} — ${words.wordsInList(list.id).length} words`,
            { cls: 'btn btn-quiet btn-block', emoji: '\u{1F4DA}',
              onClick: () => start(words.wordsInList(list.id)) })),
          button(`Everything she is learning — ${words.activeWords().length} words`,
            { cls: 'btn btn-quiet btn-block', emoji: '\u{1F331}',
              onClick: () => start(words.activeWords()) }),
          button(`Every word, mastered ones too — ${all.length} words`,
            { cls: 'btn btn-quiet btn-block', emoji: '⭐',
              onClick: () => start(all) })
        )
      ),

      button('Back', { cls: 'btn btn-quiet btn-block', emoji: '←',
        onClick: () => navigate('/parent') })
    ));
  }

  /* ---------- 2. Reading them out ---------- */
  function reading() {
    const word = queue[index];
    const hasSentence = !!(word.sentence || '').trim();

    const say = (opts) => speech.speakWord(word, opts);
    /* Said on arrival, so the grown-up does not have to press anything to
       start each one — the rhythm of a real test is word, pause, word. */
    if (speech.canSpeak()) setTimeout(() => say(), 260);

    mount(container, el('div', { class: 'stack' },
      el('div', { class: 'card center' },
        el('div', { class: 'tiny muted', text: `Word ${index + 1} of ${queue.length}` }),
        el('div', { class: 'paper-count' }, ...queue.map((_, i) =>
          el('div', { class: `pip${i < index ? ' hit' : i === index ? ' current' : ''}` }))),

        speech.canSpeak()
          ? el('button', { class: 'speak-btn paper-speak', type: 'button',
              'aria-label': 'Say the word', onClick: () => say() }, '\u{1F50A}')
          : el('div', { class: 'card card-warn', style: { marginTop: '12px' },
              text: 'This tablet cannot talk right now, so it cannot read the words out. Check the voice under Voice & speech.' }),

        el('p', { class: 'muted tiny', style: { marginTop: '10px' },
          text: 'She writes it on the paper. The word is not shown anywhere on this screen.' })
      ),

      speech.canSpeak() ? el('div', { class: 'row' },
        button('Say it again', { cls: 'btn btn-quiet grow', emoji: '\u{1F501}',
          onClick: () => say() }),
        button('Slower', { cls: 'btn btn-quiet grow', emoji: '\u{1F422}',
          onClick: () => say({ rateScale: 0.62 }) })
      ) : null,

      hasSentence && speech.canSpeak()
        ? button('Use it in a sentence', { cls: 'btn btn-quiet btn-block', emoji: '\u{1F4AC}',
            onClick: () => speech.speakSentence(word) })
        : null,

      button(index + 1 < queue.length ? 'Next word' : 'Finished — let us mark it',
        { cls: 'btn btn-primary btn-block btn-lg',
          emoji: index + 1 < queue.length ? '➡️' : '✅',
          onClick: () => {
            speech.stop();
            if (index + 1 < queue.length) { index += 1; render(); }
            else { stage = 'marking'; index = 0; render(); }
          } }),

      button('Stop the test', { cls: 'btn btn-quiet btn-block', emoji: '✕',
        onClick: () => {
          const close = modal('Stop the test?', [
            el('p', { class: 'muted tiny', text: 'Nothing is recorded and nothing is lost. You can start it again whenever suits.' }),
            button('Stop', { cls: 'btn btn-primary btn-block', onClick: () => { close(); navigate('/parent'); } }),
            button('Keep going', { cls: 'btn btn-quiet btn-block', style: { marginTop: '10px' }, onClick: () => close() }),
          ]);
        } })
    ));
  }

  /* ---------- 3. Marking it ---------- */
  function marking() {
    const word = queue[index];

    const mark = correct => {
      marks.set(word.id, correct);
      if (index + 1 < queue.length) { index += 1; render(); }
      else { stage = 'done'; finish(); }
    };

    mount(container, el('div', { class: 'stack' },
      el('div', { class: 'card center' },
        el('div', { class: 'tiny muted', text: `Marking ${index + 1} of ${queue.length}` }),
        el('p', { class: 'muted tiny', text: 'Is this what she wrote?' }),
        /* Big, and spelled out underneath, because the whole job here is
           comparing it letter by letter against a pencil. */
        el('div', { class: 'paper-answer', text: word.text }),
        el('div', { class: 'paper-letters', text: word.text.toUpperCase().split('').join(' ') })
      ),

      el('div', { class: 'row' },
        button('Wrong', { cls: 'btn btn-quiet grow btn-lg', emoji: '✕',
          onClick: () => mark(false) }),
        button('Right', { cls: 'btn btn-green grow btn-lg', emoji: '✓',
          onClick: () => mark(true) })
      ),

      index > 0
        ? button('Back one', { cls: 'btn btn-quiet btn-block', emoji: '←',
            onClick: () => { index -= 1; render(); } })
        : null
    ));
  }

  /* ---------- 4. Recording it ---------- */
  function finish() {
    let mastered = 0;
    const missed = [];

    for (const word of queue) {
      const correct = marks.get(word.id) === true;
      /* The same door every other test goes through. Nothing here is a
         second way of reaching mastery — it is the same way, done with a
         pencil. */
      const outcome = words.recordAttempt(word.id, correct, { countsForMastery: true });
      if (outcome?.justMastered) mastered += 1;
      if (!correct) missed.push(word);
    }

    const attempted = queue.length;
    const right = attempted - missed.length;

    const payout = rewards.payForActivity({
      kind: 'paperTest', firstTryCorrect: right, attempted, mastered,
    });
    const treats = attempted > 0 ? pet.earnTreats(1 + mastered * 2, 'paperTest') : 0;

    update(state => {
      state.progress.sessionsCompleted += 1;
      state.progress.testsCompleted += 1;
      state.sessions.push({
        id: `s_${Date.now().toString(36)}`, mode: 'paperTest', at: Date.now(),
        attempted, correct: right,
      });
      if (state.sessions.length > 60) state.sessions = state.sessions.slice(-60);
    });

    const streak = rewards.touchStreak();
    const milestones = rewards.checkMilestones();
    if (attempted > 0 && right === attempted) confetti(48);

    mount(container, el('div', { class: 'stack' },
      el('div', { class: 'card center' },
        el('div', { style: { fontSize: '2.4rem' }, text: right === attempted ? '\u{1F3C6}' : '✏️' }),
        el('h2', { text: right === attempted ? 'Every one right!' : 'Paper test finished' }),
        el('p', { class: 'muted', text: `${right} of ${attempted} spelled correctly` }),
        mastered > 0
          ? el('p', { class: 'tiny', text: `${mastered} new word${mastered === 1 ? '' : 's'} mastered — on paper, which is the one that counts.` })
          : null,
        streak.isNewDay && streak.streak > 1
          ? el('p', { class: 'tiny muted', text: `\u{1F525} ${streak.streak} days of practice` })
          : null
      ),

      payout.total > 0
        ? el('div', { class: 'card' },
            el('h3', { text: 'Stars earned' }),
            el('div', { class: 'stack-sm' }, payout.lines.map(line =>
              el('div', { class: 'word-row' },
                el('div', { class: 'grow tiny', text: line.label }),
                el('div', { class: 'star-chip', text: `+${line.stars}` })))),
            el('div', { class: 'word-row', style: { fontWeight: '900' } },
              el('div', { class: 'grow', text: 'Total' }),
              el('div', { text: `★ ${payout.total}` })))
        : null,

      treats > 0 ? el('div', { class: 'card center tiny' },
        el('span', { text: `\u{1F353} ${treats} treat${treats === 1 ? '' : 's'} for the axolotl.` })) : null,

      missed.length
        ? el('div', { class: 'card' },
            el('h3', { text: 'Worth another look' }),
            el('p', { class: 'muted tiny', text:
              'These are back in her practice pool. A word missed on paper is a word she has not finished learning, whatever the tablet said.' }),
            el('div', { class: 'stack-sm' }, missed.map(w =>
              el('div', { class: 'word-row' },
                el('div', { class: 'grow w-text', text: w.text })))))
        : null,

      milestones.length
        ? el('div', { class: 'card' }, ...milestones.map(m =>
            el('div', { class: 'word-row' },
              el('div', { style: { fontSize: '1.4rem' }, text: m.emoji }),
              el('div', { class: 'grow' },
                el('div', { class: 'w-text', text: m.title }),
                el('div', { class: 'w-meta', text: m.blurb })))))
        : null,

      button('Another paper test', { cls: 'btn btn-quiet btn-block', emoji: '\u{1F501}',
        onClick: () => { stage = 'setup'; render(); } }),
      button('Back to the Parent Area', { cls: 'btn btn-primary btn-block', emoji: '←',
        onClick: () => navigate('/parent') })
    ));
  }

  function render() {
    if (stage === 'setup') return setup();
    if (stage === 'reading') return reading();
    if (stage === 'marking') return marking();
  }

  /* A list can be handed straight in, so "test this list on paper" from the
     list screen skips the chooser. */
  if (listId && words.wordsInList(listId).length) {
    queue = words.shuffled(words.wordsInList(listId));
    stage = 'reading';
  }

  render();
  return cleanup;
}
