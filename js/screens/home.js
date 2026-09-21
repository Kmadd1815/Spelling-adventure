/* The hub. Pet front and centre, one obvious thing to do, everything else
   one tap away. */

import { el, mount, button } from '../ui/dom.js';
import { navigate } from '../ui/router.js';
import { petSVG } from '../ui/art.js';
import * as pet from '../core/pet.js';
import * as words from '../core/words.js';
import { currentSeason, applySeasonTheme } from '../core/season.js';

export default function homeScreen(container) {
  const season = currentSeason();
  applySeasonTheme(season);

  const info = pet.pet();
  const active = words.activeWords().length;
  const hasWords = words.allWords().length > 0;

  const hero = el('div', { class: 'hub-hero' },
    el('div', { class: 'hero-season-chip', text: `${season.emoji} ${season.name}` }),
    el('div', { class: 'pet-speech', text: pet.greeting() }),
    el('div', { html: petSVG({ coat: info.coat, stage: info.stage, happy: true }) })
  );

  const tile = (label, sub, emoji, cls, to) =>
    el('button', { class: `hub-tile ${cls}`, type: 'button', onClick: () => navigate(to) },
      el('span', { class: 'emoji', text: emoji }),
      el('span', { text: label }),
      sub ? el('small', { text: sub }) : null
    );

  const smallTile = (label, emoji, cls, to) =>
    el('button', { class: `hub-tile hub-tile-sm ${cls}`, type: 'button', onClick: () => navigate(to) },
      el('span', { class: 'emoji', text: emoji }),
      el('span', { text: label })
    );

  const body = el('div', { class: 'stack' }, hero);

  if (!hasWords) {
    body.append(el('div', { class: 'card center' },
      el('h2', { text: 'No words yet' }),
      el('p', { class: 'muted', text: 'Ask a grown-up to add this week’s spelling list.' }),
      button('Open Parent Area', { cls: 'btn btn-primary', emoji: '\u{1F510}',
        onClick: () => navigate('/parent') })
    ));
  } else if (active === 0) {
    body.append(el('div', { class: 'card center' },
      el('div', { style: { fontSize: '2rem' }, text: '\u{1F31F}' }),
      el('h2', { text: 'You mastered every word!' }),
      el('p', { class: 'muted', text: 'Time for a new list. You can still practise your mastered words any time.' })
    ));
  } else {
    body.append(el('button', {
      class: 'btn btn-primary btn-lg btn-block', type: 'button',
      onClick: () => navigate('/practice'),
    },
      el('span', { class: 'emoji', style: { fontSize: '1.6rem' }, text: '✨' }),
      el('span', {}, `Today’s Practice`)
    ));
    body.append(el('div', { class: 'center tiny muted',
      text: `${active} ${active === 1 ? 'word' : 'words'} in your practice list` }));
  }

  body.append(el('div', { class: 'hub-grid' },
    tile('Practice', 'Listen & spell', '\u{1F4DA}', 't-orange', '/practice'),
    tile('Spelling Test', 'Show what you know', '✏️', 't-blue', '/test'),
    tile('My Words', 'See your list', '\u{1F5C2}️', 't-green', '/words'),
    tile('My Pet', info.name, '\u{1F43E}', 't-purple', '/pet')
  ));

  body.append(el('div', { class: 'hub-grid hub-grid-3' },
    smallTile('Progress', '\u{1F4CA}', 't-gold', '/progress'),
    smallTile('Collection', '\u{1F4D6}', 't-pink', '/progress?tab=collection'),
    smallTile('Grown-ups', '\u{1F510}', 't-blue', '/parent')
  ));

  mount(container, body);
}
