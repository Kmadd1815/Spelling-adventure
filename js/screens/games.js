/* The games hub.

   Six ways round the same spelling list. The card for each one says what it
   is, what the axolotl does in it, and — plainly — whether there are still
   game stars to earn today, so the day's ceiling is never a surprise she
   discovers by getting fewer stars than she expected.
*/

import { el, mount, button } from '../ui/dom.js';
import { navigate } from '../ui/router.js';
import * as games from '../core/games.js';
import * as words from '../core/words.js';
import { settings } from '../core/state.js';
import { createBuddy } from '../ui/buddy.js';

export default function gamesScreen(container) {
  const buddy = createBuddy({ layout: 'strip', greeting: 'Which one shall we play?' });
  const body = el('div', { class: 'stack' }, buddy.node);

  /* An optional grown-up rule: practice first, games after. Off by default —
     when it is on, this is a locked gate with the way through right on it,
     not a telling-off. */
  const gateOn = !!settings().gamesAfterDaily;
  const practiceLeft = words.wordsLeftToday().length;
  const gated = gateOn && words.allWords().length > 0 && practiceLeft > 0;

  if (gated) {
    body.append(el('div', { class: 'card center' },
      el('div', { style: { fontSize: '2rem' }, text: '✨' }),
      el('h2', { text: 'Practice first, then games' }),
      el('p', { class: 'muted', text:
        `${practiceLeft} ${practiceLeft === 1 ? 'word' : 'words'} left today. Games open up straight after.` }),
      button('Today’s Practice', { cls: 'btn btn-primary', emoji: '✨',
        onClick: () => navigate('/daily') })
    ));
  }

  const left = games.starsLeftToday();
  body.append(el('div', { class: 'card card-tight center' },
    el('div', { class: 'tiny muted', text: left > 0
      ? `★ ${left} game ${left === 1 ? 'star' : 'stars'} still to earn today`
      : 'You have earned all of today’s game stars — play on just for fun!' })
  ));

  const grid = el('div', { class: 'game-grid' });

  games.GAMES.forEach(game => {
    const { ok, reason } = games.availability(game);
    const plays = games.playedToday(game.id);
    const playable = ok && !gated;

    const card = el('button', {
      class: `game-card ${game.tint}${playable ? '' : ' game-card-locked'}`,
      type: 'button',
      disabled: !playable,
      onClick: () => navigate(`/play?id=${game.id}`),
    },
      el('span', { class: 'game-emoji', text: game.emoji }),
      el('span', { class: 'game-name', text: game.name }),
      el('small', { class: 'game-blurb', text: game.blurb }),
      el('small', { class: 'game-role', text: `\u{1F43E} ${game.buddyRole}` }),
      !ok ? el('small', { class: 'game-note', text: reason })
          : plays ? el('small', { class: 'game-note',
              text: plays === 1 ? 'Played once today' : `Played ${plays} times today` })
          : null
    );
    grid.append(card);
  });

  body.append(grid);
  body.append(el('p', { class: 'tiny muted center', style: { marginTop: '4px' }, text:
    'Games are extra practice. Spelling a whole word from memory in Crossword or Tic Tac Toe still counts towards mastering it — and a game can never undo a word you know.' }));

  body.append(button('Go home', { cls: 'btn btn-quiet btn-block', emoji: '\u{1F3E0}',
    onClick: () => navigate('/') }));

  mount(container, body);
  return () => buddy.stop();
}
