/* The pet screen.

   There is no hunger bar, no mood, and no timer. The only meter on this
   screen measures words mastered, which is the only thing that makes the
   pet grow. */

import { el, mount, button, bar, modal } from '../ui/dom.js';
import { petSVG, petThumbSVG } from '../ui/art.js';
import { navigate } from '../ui/router.js';
import * as pet from '../core/pet.js';
import { COATS } from '../core/pet.js';
import { ownedSpecials } from '../core/rewards.js';
import { currentSeason, applySeasonTheme } from '../core/season.js';

export default function petScreen(container) {
  function render() {
    const info = pet.pet();
    const growth = pet.growthProgress();
    const season = currentSeason();
    applySeasonTheme(season);

    const stage = el('div', { class: 'hub-hero' },
      el('div', { class: 'hero-season-chip', text: `${season.emoji} ${season.name}` }),
      el('div', { class: 'pet-speech', text: pet.greeting() }),
      el('div', { html: petSVG({ coat: info.coat, stage: info.stage, happy: true }) })
    );

    const growthCard = el('div', { class: 'card' },
      el('h2', { text: `${info.name} the Axolotl` }),
      el('p', { class: 'muted tiny', text: `Right now: ${info.stage.name}` }),
      bar(growth.pct, { gold: true }),
      el('p', { class: 'tiny muted', style: { marginTop: '8px' }, text: growth.next
        ? `${growth.goal - growth.have} more mastered ${growth.goal - growth.have === 1 ? 'word' : 'words'} until ${info.name} grows into a ${growth.next.name}.`
        : `${info.name} is fully grown and absolutely radiant.` })
    );

    const specials = ownedSpecials();
    const treasures = el('div', { class: 'card' },
      el('h3', { text: '✨ Treasures' }),
      specials.length
        ? el('div', { class: 'stack-sm' }, specials.slice().reverse().slice(0, 6).map(item =>
            el('div', { class: 'word-row' },
              el('div', { style: { fontSize: '1.6rem' }, text: item.emoji }),
              el('div', { class: 'grow' },
                el('div', { class: 'w-text', text: item.name }),
                el('div', { class: 'w-meta', text: item.source })
              )
            )))
        : el('p', { class: 'muted tiny', text: 'Special treasures show up here when you earn them.' }),
      specials.length > 6
        ? button('See them all', { cls: 'btn btn-quiet btn-block', style: { marginTop: '10px' },
            onClick: () => navigate('/progress?tab=collection') })
        : null
    );

    const actions = el('div', { class: 'row' },
      button('Rename', { cls: 'btn btn-quiet grow', emoji: '✏️', onClick: renameDialog }),
      button('Change coat', { cls: 'btn btn-quiet grow', emoji: '\u{1F3A8}', onClick: coatDialog })
    );

    mount(container, el('div', { class: 'stack' },
      stage, growthCard, treasures, actions,
      button('Go practice', { cls: 'btn btn-primary btn-block', emoji: '✨',
        onClick: () => navigate('/practice') })
    ));
  }

  function renameDialog() {
    const input = el('input', { type: 'text', maxlength: '16', value: pet.pet().name });
    const close = modal('Name your friend', [
      input,
      el('div', { class: 'row', style: { marginTop: '14px' } },
        button('Cancel', { cls: 'btn btn-quiet grow', onClick: () => close() }),
        button('Save', { cls: 'btn btn-primary grow', onClick: () => {
          pet.setPet({ name: input.value });
          close(); render();
        } })
      ),
    ]);
    setTimeout(() => input.focus(), 50);
  }

  function coatDialog() {
    const current = pet.pet().coat.key;
    const grid = el('div', { class: 'hub-grid' });
    COATS.forEach(coat => {
      grid.append(el('button', {
        class: `hub-tile ${coat.key === current ? 't-orange' : 't-green'}`, type: 'button',
        onClick: () => { pet.setPet({ coat: coat.key }); close(); render(); },
      },
        el('span', { html: petThumbSVG(coat.key) }),
        el('span', { text: coat.name })
      ));
    });
    const close = modal('Choose a coat', [
      el('p', { class: 'muted tiny', text: 'Only the colour changes \u2014 everything you have earned stays exactly the same.' }),
      grid,
      button('Cancel', { cls: 'btn btn-quiet btn-block', style: { marginTop: '12px' },
        onClick: () => close() }),
    ]);
  }

  render();
}
