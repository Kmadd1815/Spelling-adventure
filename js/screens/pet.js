/* The pet screen.

   There is no hunger bar, no mood, and no timer. The only meter on this
   screen measures words mastered, which is the only thing that makes the
   pet grow. */

import { el, mount, button, bar, modal } from '../ui/dom.js';
import { toast } from '../ui/toast.js';
import { petSVG, petThumbSVG } from '../ui/art.js';
import { navigate } from '../ui/router.js';
import * as pet from '../core/pet.js';
import { COATS } from '../core/pet.js';
import * as items from '../core/items.js';
import { itemSVG, decorSVG } from '../ui/item-art.js';
import { currentSeason, applySeasonTheme } from '../core/season.js';

export default function petScreen(container) {
  function render() {
    const info = pet.pet();
    const growth = pet.growthProgress();
    const season = currentSeason();
    applySeasonTheme(season);

    const worn = items.equipped();
    const stage = el('div', { class: 'hub-hero' },
      el('div', { class: 'hero-season-chip', text: `${season.emoji} ${season.name}` }),
      el('div', { class: 'pet-speech', text: pet.greeting() }),
      el('div', { class: 'hero-scene' },
        ...items.sceneItems().map(item =>
          el('div', { class: 'scene-item', html: decorSVG(item.id, { size: 92 }) })),
        el('div', { class: 'scene-pet', html: petSVG({
          coat: info.coat, stage: info.stage, happy: true,
          hat: worn.hat, accessory: worn.accessory,
        }) })
      )
    );

    const growthCard = el('div', { class: 'card' },
      el('h2', { text: `${info.name} the Axolotl` }),
      el('p', { class: 'muted tiny', text: `Right now: ${info.stage.name}` }),
      bar(growth.pct, { gold: true }),
      el('p', { class: 'tiny muted', style: { marginTop: '8px' }, text: growth.next
        ? `${growth.goal - growth.have} more mastered ${growth.goal - growth.have === 1 ? 'word' : 'words'} until ${info.name} grows into a ${growth.next.name}.`
        : `${info.name} is fully grown and absolutely radiant.` })
    );

    /* The wardrobe. Owning is permanent; what is on show is a handful of
       slots she can rearrange whenever she likes. */
    function shelf(categoryKey, title, hint) {
      const owned = items.ownedOf(categoryKey);
      if (!owned.length) {
        return el('div', { class: 'card' },
          el('h3', { text: title }),
          el('p', { class: 'muted tiny', text: hint })
        );
      }
      return el('div', { class: 'card' },
        el('h3', { text: title }),
        el('div', { class: 'wardrobe-grid' }, owned.map(item => {
          const on = items.isEquipped(item.id);
          return el('button', {
            class: `wardrobe-item${on ? ' on' : ''}`, type: 'button',
            onClick: () => {
              const r = items.toggleEquip(item.id);
              if (!r.ok && r.reason === 'scene full') {
                toast(`Only ${items.SCENE_SLOTS} things out at once \u2014 put one away first`, { ms: 4200 });
                return;
              }
              render();
            },
          },
            el('div', { class: 'wardrobe-art', html: itemSVG(item, { size: 62 }) }),
            el('div', { class: 'wardrobe-name', text: item.name }),
            item.price == null ? el('div', { class: 'wardrobe-tag', text: '\u2728 Earned' }) : null,
            on ? el('div', { class: 'wardrobe-on', text: '\u2713' }) : null
          );
        }))
      );
    }

    const sceneCount = worn.scene.length;
    const wardrobe = el('div', { class: 'stack' },
      shelf('hat', '\u{1F452} Hats', 'Hats she buys or earns will show up here.'),
      shelf('accessory', '\u{1F380} Accessories', 'Accessories will show up here.'),
      shelf('decor', `\u{1FA91} Decorations (${sceneCount} of ${items.SCENE_SLOTS} out)`,
        'Decorations will show up here once she has some.')
    );

    const actions = el('div', { class: 'row' },
      button('Rename', { cls: 'btn btn-quiet grow', emoji: '✏️', onClick: renameDialog }),
      button('Change coat', { cls: 'btn btn-quiet grow', emoji: '\u{1F3A8}', onClick: coatDialog })
    );

    mount(container, el('div', { class: 'stack' },
      stage, growthCard, wardrobe, actions,
      button('Go to the shop', { cls: 'btn btn-pink btn-block', emoji: '\u{1F6CD}\uFE0F',
        onClick: () => navigate('/shop') }),
      button('Go practice', { cls: 'btn btn-primary btn-block', emoji: '\u2728',
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
