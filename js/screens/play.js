/* The frame every mini-game runs inside.

   A game module only has to draw its board and say what happened. The
   frame owns everything that must be identical across all six: loading the
   module, filling the screen, recording attempts through the one door in
   core/games.js, paying out, and showing the same itemised results card
   the spelling activities show.

   A game never touches words.js, rewards.js or state.js directly — it
   calls ctx.record() and ctx.finish(), and that is the whole contract.
*/

import { el, mount, button } from '../ui/dom.js';
import { navigate, render as rerender } from '../ui/router.js';
import { confetti } from '../ui/toast.js';
import * as games from '../core/games.js';
import * as rewards from '../core/rewards.js';
import * as speech from '../core/speech.js';
import * as pet from '../core/pet.js';
import { byId as itemById } from '../core/items.js';
import { update } from '../core/state.js';

export default function playScreen(container, { id = '' } = {}) {
  const game = games.byId(id);
  if (!game) {
    mount(container, el('div', { class: 'card center stack' },
      el('h2', { text: 'Game not found' }),
      button('Back to games', { cls: 'btn btn-primary', onClick: () => navigate('/games') })
    ));
    return;
  }

  /* Games fill the screen the way the spelling activities do, so a board
     never has to fight the page for room. Released again the moment the
     results card goes up, which is an ordinary scrolling page. */
  const fill = () => {
    container.style.display = 'flex';
    container.style.flexDirection = 'column';
    container.style.height = '100%';
    container.style.overflow = 'hidden';
  };
  const release = () => {
    container.style.display = '';
    container.style.flexDirection = '';
    container.style.height = '';
    container.style.overflow = '';
  };
  fill();

  const cleanups = [() => { speech.stop(); release(); }];
  const mastered = [];
  let finished = false;
  /* Set when she leaves mid-game. A game may still have a timer in flight
     that was about to call finish(), and painting a results card into a
     screen the router has already moved on from would put it on top of
     whatever she went to instead. */
  let abandoned = false;

  const stage = el('div', { class: 'game-stage' },
    el('div', { class: 'center muted', style: { padding: '2rem' }, text: 'Loading…' })
  );
  mount(container, stage);

  /** What a game module is handed. */
  const ctx = {
    game,
    stage,

    /** Register teardown — timers, listeners, animation frames. */
    onCleanup(fn) { cleanups.push(fn); },

    /**
     * Record one word. The only route from a game to her spelling history,
     * and it applies this game's mastery rule for her: games can add a
     * credit, never remove one.
     */
    record(word, wasCorrect) {
      if (!word?.id) return null;
      const outcome = games.recordGameAttempt(word.id, wasCorrect, { canMaster: game.canMaster });
      if (outcome?.justMastered) mastered.push(word);
      return outcome;
    },

    /** Leave without finishing. Nothing is paid and nothing is lost. */
    quit() { navigate('/games'); },

    finish,
  };

  game.load()
    .then(mod => { if (!finished) mod.default(ctx); })
    .catch(err => {
      console.error('[play] could not load', game.id, err);
      release();
      mount(container, el('div', { class: 'card center stack' },
        el('h2', { text: 'That game would not open' }),
        el('p', { class: 'muted', text: 'Try again in a moment.' }),
        button('Back to games', { cls: 'btn btn-primary', onClick: () => navigate('/games') })
      ));
    });

  /**
   * End the game and show the results.
   *
   * @param {object} result
   * @param {number} result.wordsWon    words she completed
   * @param {number} [result.wordsPlayed]
   * @param {boolean} [result.bonus]        did she earn the clean-run bonus
   * @param {string} [result.bonusLabel]    what to call it on the receipt
   * @param {string} [result.headline]      the big line on the card
   * @param {string} [result.detail]        the small line under it
   * @param {string} [result.emoji]
   * @param {Array} [result.missed]         words worth another look
   * @param {boolean} [result.celebrate]    throw confetti
   */
  function finish(result = {}) {
    if (finished || abandoned) return;
    finished = true;
    speech.stop();
    cleanups.forEach(fn => { try { fn(); } catch { /* ignore */ } });

    const {
      wordsWon = 0, bonus = false, bonusLabel = '',
      headline = 'Good game!', detail = '', emoji = game.emoji,
      missed = [], celebrate = false,
    } = result;

    const payout = games.scoreGame({ gameId: game.id, wordsWon, bonus, bonusLabel });
    const treats = payout.repeat ? 0 : pet.earnTreats(1, `game:${game.id}`);

    update(state => { state.progress.gamesPlayed = (state.progress.gamesPlayed || 0) + 1; });

    const milestones = rewards.checkMilestones();
    if (celebrate) confetti(36);

    release();
    mount(container, resultsCard({ payout, treats, milestones, headline, detail, emoji, missed }));
  }

  function resultsCard({ payout, treats, milestones, headline, detail, emoji, missed }) {
    const body = el('div', { class: 'stack' },
      el('div', { class: 'card center' },
        el('div', { style: { fontSize: '2.4rem' }, text: emoji }),
        el('h2', { text: headline }),
        detail ? el('p', { class: 'muted', text: detail }) : null
      )
    );

    if (payout.lines.length) {
      body.append(el('div', { class: 'card' },
        el('h3', { text: 'Stars earned' }),
        el('div', { class: 'stack-sm' },
          payout.lines.map(line => el('div', { class: 'payout-row' },
            el('div', { class: 'grow', text: line.label }),
            el('div', { class: 'payout-stars', text: `+${line.stars}` })
          ))
        ),
        el('div', { class: 'payout-total' },
          el('div', { class: 'grow', text: 'Total' }),
          el('div', { text: `★ ${payout.total}` })
        ),
        payout.repeat && !payout.capped
          ? el('p', { class: 'tiny muted', style: { marginTop: '8px' }, text:
              'The first go at each game every day earns the most — try a different one for more stars.' })
          : null,
        payout.capped
          ? el('p', { class: 'tiny muted', style: { marginTop: '8px' }, text:
              'That is all of today’s game stars. Practice and tests still earn as usual, and games are still here for fun.' })
          : null
      ));
    } else {
      body.append(el('div', { class: 'card center' },
        el('p', { class: 'muted tiny', text:
          'You have earned all of today’s game stars already — this one was purely for fun.' })
      ));
    }

    if (mastered.length) {
      body.append(el('div', { class: 'card' },
        el('h3', { text: `⭐ Mastered ${mastered.length === 1 ? 'a new word' : 'new words'}!` }),
        el('p', { class: 'muted tiny', text:
          `${pet.pet().name} saw you spell ${mastered.length === 1 ? 'that' : 'those'} with no help at all.` }),
        el('div', { class: 'stack-sm' }, mastered.map(w =>
          el('div', { class: 'word-row' },
            el('div', { class: 'w-text', text: w.text }),
            el('div', { class: 'badge badge-mastered', text: '⭐ Mastered' })
          )))
      ));
    }

    if (treats > 0) {
      body.append(el('div', { class: 'card center' },
        el('p', { class: 'tiny muted', text: `\u{1F353} You earned a treat for ${pet.pet().name}.` })
      ));
    }

    milestones.forEach(m => body.append(el('div', { class: 'card center' },
      el('div', { style: { fontSize: '2rem' }, text: m.emoji }),
      el('h3', { text: m.title }),
      el('p', { class: 'muted tiny', text: m.blurb }),
      m.item ? el('p', { class: 'tiny', text: `You earned: ${itemById(m.item)?.name || ''}` }) : null
    )));

    if (missed.length) {
      body.append(el('div', { class: 'card' },
        el('h3', { text: 'Words to look at again' }),
        el('div', { class: 'stack-sm' }, missed.map(w =>
          el('div', { class: 'word-row' },
            el('div', { class: 'w-text', text: w.text }),
            el('button', { class: 'icon-btn', type: 'button', 'aria-label': `Hear ${w.text}`,
              onClick: () => speech.speak(w.text) }, '\u{1F50A}')
          )))
      ));
    }

    body.append(el('div', { class: 'row' },
      button('Play again', { cls: 'btn btn-green grow', emoji: '\u{1F501}',
        onClick: rerender }),
      button('Other games', { cls: 'btn btn-primary grow', emoji: '\u{1F3AE}',
        onClick: () => navigate('/games') })
    ));
    body.append(button('Go home', { cls: 'btn btn-quiet btn-block', emoji: '\u{1F3E0}',
      onClick: () => navigate('/') }));

    return body;
  }

  return () => {
    if (finished) return;
    abandoned = true;
    cleanups.forEach(fn => { try { fn(); } catch { /* ignore */ } });
  };
}

/* The header every game wears.

   `onQuit` is the game's own "I am finished with this" handler, not a plain
   cancel: a game that has something worth banking should call ctx.finish()
   from here so that stopping early still pays for what she did. Only a game
   she has not started yet should drop straight out to the hub. One control,
   so there is never a wrong button to leave by. */
export function gameHeader(title, { onQuit, right = null } = {}) {
  return el('div', { class: 'game-head' },
    el('div', { class: 'game-head-title', text: title }),
    right,
    el('button', { class: 'icon-btn', type: 'button', 'aria-label': 'Leave the game',
      onClick: onQuit }, '✕')
  );
}
