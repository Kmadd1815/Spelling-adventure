/* The hub. Pet front and centre, one obvious thing to do, everything else
   one tap away. */

import { el, mount, button, modal } from '../ui/dom.js';
import { navigate } from '../ui/router.js';
import { petSVG } from '../ui/art.js';
import * as pet from '../core/pet.js';
import * as words from '../core/words.js';
import * as items from '../core/items.js';
import { buildRoom } from '../ui/room.js';
import { burst, hop } from '../ui/fx.js';
import { currentSeason, applySeasonTheme, seasonLine } from '../core/season.js';
import * as events from '../core/events.js';
import { gardenOpen, gateLine } from '../core/garden.js';
import { speak } from '../core/speech.js';
import { settings } from '../core/state.js';

export default function homeScreen(container) {
  const season = currentSeason();
  applySeasonTheme(season);

  const info = pet.pet();
  const active = words.activeWords().length;
  const hasWords = words.allWords().length > 0;
  const leftToday = words.wordsLeftToday().length;
  const dailyDone = words.dailyPracticeDone();
  /* Mastered words come back to be checked; see REVIEW_LADDER in
     core/words.js. Capped the same way the session caps them, so the
     number on screen is the number she will actually be asked. */
  const reviewsDue = settings().reviewMastered === false ? 0
    : Math.min(words.wordsDueForReview().length, Math.max(0, settings().reviewsPerDay ?? 2));

  /* Now and then the axolotl mentions the time of year rather than saying
     one of its usual hellos. Often enough to notice, rarely enough that it
     never feels like the weather report. */
  const bubble = el('div', { class: 'room-speech',
    text: Math.random() < 0.35 ? seasonLine(season) : pet.greeting() });

  const drawPet = mood => petSVG({
    coat: info.coat, stage: info.stage, mood,
    hat: items.equipped().hat, accessory: items.equipped().accessory,
  });

  /* The axolotl is tappable wherever it appears. Petting costs nothing and
     is never used up, so there is always something nice to do here. */
  const petProps = {
    class: 'room-pet pet-tappable',
    role: 'button', tabindex: '0',
    'aria-label': `Pet ${info.name}`,
    onClick: () => {
      pet.noteMoment();
      const spec = pet.INTERACTIONS.pet;
      const node = room.querySelector('.room-pet');
      node.innerHTML = drawPet(spec.mood);
      hop(node);
      bubble.textContent = pet.interactionLine('pet');
      burst(room, spec.effect, { origin: node });
      setTimeout(() => { node.innerHTML = drawPet('happy'); }, 2200);
    },
  };

  /* Tapping the door either goes outside or says how far off it is. It is
     never just refused: a shut door with a number on it is something to
     work towards, a shut door without one is a bug. */
  const room = buildRoom({
    petHTML: drawPet('happy'), petProps,
    onDoor: () => {
      if (gardenOpen()) { navigate('/garden'); return; }
      bubble.textContent = gateLine();
      speak(bubble.textContent);
    },
  });

  const hero = el('div', { class: 'hub-hero hub-hero-room', style: { position: 'relative' } },
    el('div', { class: 'room-season-chip', text: `${season.emoji} ${season.name}` }),
    bubble,
    room
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

  /* An event sits on top of the season rather than replacing anything, so
     it gets a banner above the day's work and never takes its place. */
  const live = events.liveEvent();
  if (live) {
    const left = events.daysLeft(live);
    const next = events.nextReward(live);
    body.append(el('button', {
      class: 'event-banner', type: 'button', onClick: () => navigate('/event'),
    },
      el('span', { class: 'event-emoji', text: live.emoji }),
      el('span', { class: 'grow' },
        el('span', { class: 'event-title', text: live.name }),
        el('small', { text: next
          ? `${next.at - events.progress(live.id).count} more to find something new`
          : 'You found everything \u2014 come and play anyway' })
      ),
      el('small', { class: 'event-days', text: left === 1 ? 'Last day!' : `${left} days left` })
    ));
  }

  if (!hasWords) {
    body.append(el('div', { class: 'card center' },
      el('h2', { text: 'No words yet' }),
      el('p', { class: 'muted', text: 'Ask a grown-up to add this week’s spelling list.' }),
      button('Open Parent Area', { cls: 'btn btn-primary', emoji: '\u{1F510}',
        onClick: () => navigate('/parent') })
    ));
  } else if (active === 0) {
    /* Everything mastered. That used to be the end of the road on this
       screen — a congratulations card and no button — which quietly made
       the review words unreachable in exactly the situation they exist
       for: a finished list, where the schedule is the only thing still
       asking her anything. */
    body.append(el('div', { class: 'card center' },
      el('div', { style: { fontSize: '2rem' }, text: '\u{1F31F}' }),
      el('h2', { text: 'You mastered every word!' }),
      el('p', { class: 'muted', text: reviewsDue
        ? 'Time for a new list \u2014 and there are some old ones to say hello to.'
        : 'Time for a new list. You can still practice your mastered words any time.' })
    ));
    if (reviewsDue) {
      body.append(el('button', {
        class: 'btn btn-primary btn-lg btn-block', type: 'button',
        onClick: () => navigate('/daily'),
      },
        el('span', { class: 'emoji', style: { fontSize: '1.6rem' }, text: '\u2B50' }),
        el('span', {}, 'Do you still remember?')
      ));
      body.append(el('div', { class: 'center tiny muted',
        text: `${reviewsDue} word${reviewsDue === 1 ? '' : 's'} you learned a while back.` }));
    }
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
    smallTile('Games', '\u{1F3AE}', 't-blue', '/games'),
    smallTile('Shop', '\u{1F6CD}\uFE0F', 't-pink', '/shop'),
    smallTile('Decorate', '\u{1FA91}', 't-green', '/decorate'),
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
