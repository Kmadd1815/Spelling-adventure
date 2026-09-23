/* My Progress — the child's version.

   Deliberately not a report card: no percentages, no grades, no "you are
   behind". Counts of things she has actually done, and the next nice thing
   coming up. */

import { el, mount, button, stat, bar, segmented, modal } from '../ui/dom.js';
import { navigate } from '../ui/router.js';
import * as words from '../core/words.js';
import * as pet from '../core/pet.js';
import * as rewards from '../core/rewards.js';
import * as items from '../core/items.js';
import { itemSVG } from '../ui/item-art.js';
import { getState } from '../core/state.js';
import { gardenOpen, mastered, GARDEN_AT } from '../core/garden.js';

export default function progressScreen(container, params) {
  let tab = params.tab === 'collection' ? 'collection' : 'progress';

  function render() {
    const tabs = segmented([
      { value: 'progress',   label: '\u{1F4CA} Progress' },
      { value: 'collection', label: '\u{1F4D6} Collection' },
    ], tab, value => { tab = value; render(); });

    mount(container, el('div', { class: 'stack' },
      tabs,
      tab === 'progress' ? progressTab() : collectionTab()
    ));
  }

  function progressTab() {
    const s = words.summary();
    const p = getState().progress;
    const growth = pet.growthProgress();
    const info = pet.pet();
    const next = rewards.nextMilestone();

    const body = el('div', { class: 'stack' });

    body.append(el('div', { class: 'stat-grid' },
      stat(s.mastered, '⭐ Mastered'),
      stat(s.active, '\u{1F331} Practicing'),
      stat(p.currentStreak, '\u{1F525} Practice days'),
      stat(p.stars, '★ Stars')
    ));

    body.append(el('div', { class: 'card' },
      el('h3', { text: `${info.name} is growing` }),
      bar(growth.pct, { gold: true }),
      el('p', { class: 'tiny muted', style: { marginTop: '8px' }, text: growth.next
        ? `${growth.goal - growth.have} more mastered words until ${growth.next.name}.`
        : 'Fully grown!' })
    ));

    if (next) {
      const pct = next.goal ? next.have / next.goal : 0;
      body.append(el('div', { class: 'card' },
        el('h3', { text: `${next.milestone.emoji} Next: ${next.milestone.title}` }),
        bar(pct),
        el('p', { class: 'tiny muted', style: { marginTop: '8px' },
          text: `${next.have} of ${next.goal} words mastered` })
      ));
    }

    /* The garden is the one thing in the app she cannot reach yet, so it
       gets a bar of its own until she can. Once it is open it disappears
       from here — a finished goal on a progress screen is clutter. */
    if (!gardenOpen()) {
      body.append(el('div', { class: 'card' },
        el('h3', { text: '\u{1F333} Next: The Garden Gate' }),
        bar(mastered() / GARDEN_AT),
        el('p', { class: 'tiny muted', style: { marginTop: '8px' },
          text: `${mastered()} of ${GARDEN_AT} words mastered. Then the door in your room opens onto a garden.` })
      ));
    }

    const earned = rewards.earnedMilestones();
    if (earned.length) {
      body.append(el('div', { class: 'card' },
        el('h3', { text: '\u{1F3C6} Things you have done' }),
        el('div', { class: 'stack-sm' }, earned.slice().reverse().map(m =>
          el('div', { class: 'word-row' },
            el('div', { style: { fontSize: '1.5rem' }, text: m.emoji }),
            el('div', { class: 'grow' },
              el('div', { class: 'w-text', text: m.title }),
              el('div', { class: 'w-meta', text: m.blurb })
            )
          )))
      ));
    }

    body.append(el('div', { class: 'stat-grid' },
      stat(p.sessionsCompleted, 'Practices'),
      stat(p.testsCompleted, 'Tests'),
      /* Not "best streak" any more: practice days only go up, so the best
         one is always today's and the tile said nothing. */
      stat(getState().collection.items.length, 'Treasures'),
      stat(s.total, 'Words total')
    ));

    body.append(button('Keep going', { cls: 'btn btn-primary btn-block', emoji: '✨',
      onClick: () => navigate('/practice') }));

    return body;
  }

  /* The Collection Book. Everything she owns shown in full, everything
     still out there as a silhouette — so there is always something to find
     without ever spoiling what it is. */
  function collectionTab() {
    const stats = items.collectionStats();
    const body = el('div', { class: 'stack' });

    body.append(el('div', { class: 'card center' },
      el('h3', { text: `${stats.owned} of ${stats.total} things collected` }),
      bar(stats.pct, { gold: true }),
      el('p', { class: 'tiny muted', style: { marginTop: '8px' },
        text: 'Some are bought in the shop. Some can only be earned.' })
    ));

    for (const [slot, spec] of Object.entries(items.SLOTS)) {
      const all = items.itemsForSlot(slot);
      if (!all.length) continue;
      const mine = all.filter(i => items.owns(i.id));
      body.append(el('div', { class: 'section-title',
        text: `${spec.label} \u2014 ${mine.length} of ${all.length}` }));
      body.append(el('div', { class: 'book-grid' }, all.map(bookEntry)));
    }

    return body;
  }

  function bookEntry(item) {
    const owned = items.owns(item.id);
    const special = items.isSpecial(item);

    if (!owned) {
      return el('div', { class: 'book-cell locked' },
        el('div', { class: 'book-art', text: '?' }),
        el('div', { class: 'book-name', text: special ? 'Earn it' : `\u2605 ${item.price}` })
      );
    }
    return el('button', {
      class: `book-cell${special ? ' special' : ''}`, type: 'button',
      onClick: () => showItem(item),
    },
      el('div', { class: 'book-art', html: itemSVG(item, { size: 62 }) }),
      el('div', { class: 'book-name', text: item.name }),
      items.isEquipped(item.id) ? el('div', { class: 'wardrobe-on', text: '\u2713' }) : null
    );
  }

  /* Every item records how she came by it — the whole point of the book. */
  function showItem(item) {
    const close = modal(item.name, [
      el('div', { class: 'center', html: itemSVG(item, { size: 140 }) }),
      el('p', { class: 'center muted tiny', text: item.blurb }),
      el('div', { class: 'card card-tight center', style: { background: '#fdf2e3', marginTop: '12px' } },
        el('div', { class: 'tiny', style: { fontWeight: '800' }, text: 'How you got it' }),
        el('div', { class: 'tiny', text: items.sourceOf(item.id) || 'Unknown' })
      ),
      item.price == null
        ? el('p', { class: 'center tiny muted', style: { marginTop: '10px' },
            text: '\u2728 This one cannot be bought \u2014 only earned.' })
        : null,
      button('Close', { cls: 'btn btn-primary btn-block', style: { marginTop: '16px' },
        onClick: () => close() }),
    ]);
  }

  render();
}
