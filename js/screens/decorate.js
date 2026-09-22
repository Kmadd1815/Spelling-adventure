/* Decorating.

   The scene on top, every slot underneath. Each slot shows only what she
   owns for it and says plainly how many can be out at once, so "two wall
   decorations" is something she can see rather than something she discovers
   by being refused.

   Two scenes share this screen once the garden is open. They do not share
   anything else: the slots are separate lists, so a rug can never end up on
   the grass and a tree can never end up in her bedroom.
*/

import { el, mount, button, segmented } from '../ui/dom.js';
import { toast } from '../ui/toast.js';
import { navigate } from '../ui/router.js';
import { buildRoom } from '../ui/room.js';
import { buildGarden } from '../ui/garden.js';
import { itemSVG } from '../ui/item-art.js';
import { petSVG } from '../ui/art.js';
import * as items from '../core/items.js';
import * as pet from '../core/pet.js';
import { gardenOpen } from '../core/garden.js';

/* The order they are offered in walks the room the way a person would
   decorate it: surfaces first, then the big pieces, then the details. */
const ORDER = ['wallpaper', 'flooring', 'window', 'door', 'bed', 'rug', 'wallDecor', 'floorDecor'];

/* And the same walk round the garden: what it is made of, then what is
   standing in it. */
const GARDEN_ORDER = ['sky', 'ground', 'fence', 'tree', 'water', 'gardenDecor'];

const SLOT_EMOJI = {
  wallpaper: '\u{1F3A8}', flooring: '\u{1FA9F}', window: '\u{1FA9F}', door: '\u{1F6AA}',
  bed: '\u{1F6CF}️', rug: '\u{1FA9E}', wallDecor: '\u{1F5BC}️', floorDecor: '\u{1FA91}',
  sky: '\u{2601}\uFE0F', ground: '\u{1F33F}', fence: '\u{1F6A7}', tree: '\u{1F333}',
  water: '\u{1F4A7}', gardenDecor: '\u{1F344}',
};

export default function decorateScreen(container) {
  const asked = new URLSearchParams(location.hash.split('?')[1] || '').get('where');
  let where = (asked === 'garden' && gardenOpen()) ? 'garden' : 'room';

  function render() {
    const info = pet.pet();
    const worn = items.equipped();
    const outside = where === 'garden' && gardenOpen();

    const petHTML = petSVG({
      coat: info.coat, stage: info.stage, mood: 'happy',
      hat: worn.hat, accessory: worn.accessory,
    });
    const scene = outside ? buildGarden({ petHTML }) : buildRoom({ petHTML });

    const body = el('div', { class: 'stack' });

    if (gardenOpen()) {
      body.append(segmented(
        [{ value: 'room', label: '\u{1F6CF}\uFE0F My Room' },
         { value: 'garden', label: '\u{1F333} The Garden' }],
        where,
        v => { where = v; render(); }
      ));
    }

    body.append(
      el('div', { style: { position: 'relative' } }, scene),
      el('p', { class: 'center tiny muted', text: 'Tap something to put it out or take it away.' })
    );

    (outside ? GARDEN_ORDER : ORDER).forEach(slot => body.append(slotSection(slot)));

    body.append(el('div', { class: 'row' },
      button('Shop for more', { cls: 'btn btn-pink grow', emoji: '\u{1F6CD}️',
        onClick: () => navigate('/shop') }),
      button('Go home', { cls: 'btn btn-primary grow', emoji: '\u{1F3E0}',
        onClick: () => navigate('/') })
    ));

    mount(container, body);
  }

  function slotSection(slot) {
    const spec = items.SLOTS[slot];
    const owned = items.ownedOf(slot);
    const { used, max } = items.slotUsage(slot);

    const header = el('div', { class: 'slot-row' },
      el('span', { style: { fontSize: '1.2rem' }, text: SLOT_EMOJI[slot] || '✨' }),
      el('h3', { class: 'grow', text: spec.label }),
      el('span', { class: `slot-count${used >= max ? ' full' : ''}`,
        text: max > 1 ? `${used} of ${max} out` : (used ? 'chosen' : 'none') })
    );

    const strip = el('div', { class: 'decor-strip' });

    if (!owned.length) {
      strip.append(el('div', { class: 'decor-empty',
        text: `Nothing yet — the shop has ${spec.label.toLowerCase()}.` }));
    } else {
      // A single-choice slot can be emptied again; a wallpaper cannot, since
      // a room always has walls — and nor can the sky or the ground, for the
      // same reason.
      const clearable = max === 1 && !['wallpaper', 'flooring', 'sky', 'ground'].includes(slot);
      if (clearable && used) {
        strip.append(el('button', {
          class: 'wardrobe-item', type: 'button',
          onClick: () => { items.unequip(items.inSlot(slot)[0]); render(); },
        },
          el('div', { class: 'wardrobe-art', style: { fontSize: '1.8rem', lineHeight: '62px' }, text: '\u{1F6AB}' }),
          el('div', { class: 'wardrobe-name', text: 'None' })
        ));
      }

      owned.forEach(item => {
        const on = items.isEquipped(item.id);
        strip.append(el('button', {
          class: `wardrobe-item${on ? ' on' : ''}`, type: 'button',
          onClick: () => choose(item),
        },
          el('div', { class: 'wardrobe-art', html: itemSVG(item, { size: 62 }) }),
          el('div', { class: 'wardrobe-name', text: item.name }),
          items.isSpecial(item) ? el('div', { class: 'wardrobe-tag', text: '✨ Earned' }) : null,
          on ? el('div', { class: 'wardrobe-on', text: '✓' }) : null
        ));
      });
    }

    return el('div', { class: 'card card-tight' }, header, strip);
  }

  function choose(item) {
    const result = items.toggleEquip(item.id);
    if (!result.ok && result.reason === 'full') {
      const spec = items.SLOTS[item.category];
      toast(`Only ${spec.max} ${spec.label.toLowerCase()} at a time — take one down first`, { ms: 4200 });
      return;
    }
    render();
  }

  render();
}
