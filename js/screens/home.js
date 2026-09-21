/* The hub. Pet front and centre, one obvious thing to do, everything else
   one tap away. */

import { el, mount, button, modal } from '../ui/dom.js';
import { navigate } from '../ui/router.js';
import { petSVG } from '../ui/art.js';
import * as pet from '../core/pet.js';
import * as words from '../core/words.js';
import * as items from '../core/items.js';
import { decorSVG } from '../ui/item-art.js';
import { currentSeason, applySeasonTheme } from '../core/season.js';

export default function homeScreen(container) {
  const season = currentSeason();
  applySeasonTheme(season);

  const info = pet.pet();
  const active = words.activeWords().length;
  const hasWords = words.allWords().length > 0;
  const leftToday = words.wordsLeftToday().length;
  const dailyDone = words.dailyPracticeDone();

  /* Her scene: the pet, whatever it is wearing, and up to three things she
     has chosen to put out. */
  const scene = el('div', { class: 'hero-scene' },
    ...items.sceneItems().map(item =>
      el('div', { class: 'scene-item', html: decorSVG(item.id, { size: 92 }) })),
    el('div', { class: 'scene-pet', html: petSVG({
      coat: info.coat, stage: info.stage, happy: true,
      hat: items.equipped().hat, accessory: items.equipped().accessory,
    }) })
  );

  const hero = el('div', { class: 'hub-hero' },
    el('div', { class: 'hero-season-chip', text: `${season.emoji} ${season.name}` }),
    el('div', { class: 'pet-speech', text: pet.greeting() }),
    scene
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
      el('p', { class: 'muted', text: 'Time for a new list. You can still practice your mastered words any time.' })
    ));
  } else if (dailyDone) {
    // Every active word has had its turn today. The button goes quiet rather
    // than vanishing, so finishing the day's work is visibly an ending.
    body.append(el('button', {
      class: 'btn btn-lg btn-block', type: 'button', disabled: true,
      style: { opacity: '.55' },
    },
      el('span', { class: 'emoji', style: { fontSize: '1.6rem' }, text: '\u2705' }),
      el('span', {}, 'All done for today!')
    ));
    body.append(el('div', { class: 'center tiny muted',
      text: 'Come back tomorrow \u2014 or tap Practice for extra words.' }));
  } else {
    body.append(el('button', {
      class: 'btn btn-primary btn-lg btn-block', type: 'button',
      onClick: () => navigate('/daily'),
    },
      el('span', { class: 'emoji', style: { fontSize: '1.6rem' }, text: '\u2728' }),
      el('span', {}, 'Today\u2019s Practice')
    ));
    body.append(el('div', { class: 'center tiny muted',
      text: `${leftToday} of ${active} ${active === 1 ? 'word' : 'words'} left today` }));
  }

  const testTile = el('button', {
    class: 'hub-tile t-blue', type: 'button', onClick: chooseTest,
  },
    el('span', { class: 'emoji', text: '\u270F\uFE0F' }),
    el('span', { text: 'Take a Test' }),
    el('small', { text: 'Show what you know' })
  );

  body.append(el('div', { class: 'hub-grid' },
    tile('Practice', 'Extra words', '\u{1F4DA}', 't-orange', '/practice'),
    testTile,
    tile('My Words', 'See your list', '\u{1F5C2}\uFE0F', 't-green', '/words'),
    tile('My Pet', info.name, '\u{1F43E}', 't-purple', '/pet')
  ));

  body.append(el('div', { class: 'hub-grid hub-grid-3' },
    smallTile('Shop', '\u{1F6CD}\uFE0F', 't-pink', '/shop'),
    smallTile('Progress', '\u{1F4CA}', 't-gold', '/progress'),
    smallTile('Collection', '\u{1F4D6}', 't-purple', '/progress?tab=collection'),
    smallTile('Grown-ups', '\u{1F510}', 't-blue', '/parent')
  ));

  mount(container, body);

  /* Two kinds of test now, so a chooser keeps both off the hub without
     hiding either one. */
  function chooseTest() {
    const lists = words.activeLists().filter(l => words.wordsInList(l.id).length > 0);
    const close = modal('Which test?', [
      button('Practice Test', { cls: 'btn btn-blue btn-block btn-lg', emoji: '\u{1F4DD}',
        onClick: () => { close(); navigate('/test'); } }),
      el('p', { class: 'tiny muted center', style: { margin: '6px 0 16px' },
        text: 'A short quiz. No answers until the end.' }),

      lists.length
        ? button('Full Spelling Test', { cls: 'btn btn-purple btn-block btn-lg', emoji: '\u{1F3C5}',
            onClick: () => { close(); chooseList(lists); } })
        : null,
      lists.length
        ? el('p', { class: 'tiny muted center', style: { margin: '6px 0 0' },
            text: 'Every word on a whole list, just like the real test.' })
        : null,

      button('Never mind', { cls: 'btn btn-quiet btn-block', style: { marginTop: '18px' },
        onClick: () => close() }),
    ]);
  }

  function chooseList(lists) {
    if (lists.length === 1) return navigate(`/fulltest?listId=${lists[0].id}`);
    const close = modal('Which list?', [
      el('div', { class: 'stack-sm' }, lists.map(list =>
        button(`${list.name} (${words.wordsInList(list.id).length} words)`, {
          cls: 'btn btn-quiet btn-block',
          onClick: () => { close(); navigate(`/fulltest?listId=${list.id}`); },
        }))),
      button('Never mind', { cls: 'btn btn-quiet btn-block', style: { marginTop: '16px' },
        onClick: () => close() }),
    ]);
  }
}
