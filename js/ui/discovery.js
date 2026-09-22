/* The little ceremony around a pet discovery.

   A present she has to open is worth far more than a line of text saying
   she got something, so the box waits for a tap and the item is not named
   until she opens it.
*/

import { el, modal, button } from './dom.js';
import { itemSVG } from './item-art.js';
import { petSVG } from './art.js';
import { confetti } from './toast.js';
import { burst } from './fx.js';
import { discoveryLine } from '../core/discovery.js';
import * as pet from '../core/pet.js';
import * as items from '../core/items.js';
import { SLOTS } from '../core/items.js';

/**
 * Show the axolotl presenting something it found.
 * @param {object} item  a catalogue entry
 * @returns {Promise<void>} resolves once she closes it
 */
export function showDiscovery(item) {
  return new Promise(resolve => {
    const info = pet.pet();
    const worn = items.equipped();
    const drawPet = mood => petSVG({
      coat: info.coat, stage: info.stage, mood, alive: true,
      hat: worn.hat, accessory: worn.accessory,
    });

    const figure = el('div', { class: 'find-pet', html: drawPet('excited') });
    const caption = el('p', { class: 'find-line', text: discoveryLine() });
    const stage = el('div', { class: 'find-stage' });

    const box = el('button', {
      class: 'find-box', type: 'button', 'aria-label': 'Open it',
      onClick: open,
    }, el('span', { class: 'find-box-art', text: '\u{1F381}' }),
       el('span', { class: 'find-box-hint', text: 'Tap to open' }));
    stage.append(box);

    const body = el('div', { class: 'find-wrap' }, figure, caption, stage);
    const close = modal(null, [body], { dismissable: false });

    let opened = false;

    function open() {
      if (opened) return;
      opened = true;

      caption.textContent = `${item.name}!`;
      figure.innerHTML = drawPet('love');
      confetti(26);

      const slotLabel = SLOTS[item.category]?.label || '';
      stage.replaceChildren(
        el('div', { class: 'find-item', html: itemSVG(item, { size: 132 }) }),
        el('div', { class: 'find-name', text: item.name }),
        item.blurb ? el('div', { class: 'tiny muted', text: item.blurb }) : null,
        slotLabel ? el('div', { class: 'tiny muted', text: `Goes in: ${slotLabel}` }) : null,
        button('Lovely!', {
          cls: 'btn btn-primary btn-block', style: { marginTop: '14px' },
          onClick: () => { close(); resolve(); },
        })
      );
      burst(body, 'sparkles', { origin: figure });
    }
  });
}
