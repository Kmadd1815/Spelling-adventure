/* The shop.

   It sells exactly one thing: catalogue items that have a price. Special
   items have no price field, so there is nothing here that could put one on
   a shelf — the rule holds by construction rather than by a check.

   Prices are set against roughly two hundred stars in a good week: something
   small most weeks, something nice after saving, and a couple of things worth
   a month of work.
*/

import { el, mount, button, segmented, confirmDialog, modal } from '../ui/dom.js';
import { toast, confetti } from '../ui/toast.js';
import { navigate } from '../ui/router.js';
import { itemSVG } from '../ui/item-art.js';
import * as items from '../core/items.js';
import * as rewards from '../core/rewards.js';
import { currentSeason } from '../core/season.js';
import { gardenOpen } from '../core/garden.js';
import { pondOpen } from '../core/pond.js';

export default function shopScreen(container) {
  /* The Garden tab is hidden until the gate opens. A tab full of things for
     a place she cannot visit yet would be a tease, and the garden screen
     links straight here with ?tab=garden once it is hers. */
  const OPEN = { garden: gardenOpen, pond: pondOpen };
  const tabs = () => items.SHOP_TABS.filter(t => !OPEN[t.key] || OPEN[t.key]());

  const wanted = new URLSearchParams(location.hash.split('?')[1] || '').get('tab');
  let tab = tabs().some(t => t.key === wanted) ? wanted : tabs()[0].key;

  function render() {
    const stars = rewards.stars();
    const season = currentSeason();
    const activeTab = tabs().find(t => t.key === tab) || tabs()[0];
    /* Things that suit the time of year come first in their tab and wear a
       little leaf. Nothing is ever withheld because of the date — an item
       she was saving up for quietly vanishing in December would punish her
       for saving. */
    const forSale = items.shopItems()
      .filter(i => activeTab.slots.includes(i.category))
      .sort((a, b) => (b.season === season.key) - (a.season === season.key));
    const cheapest = items.shopItems().filter(i => !items.owns(i.id))
      .reduce((lo, i) => (lo === null || i.price < lo ? i.price : lo), null);

    const body = el('div', { class: 'stack' },
      el('div', { class: 'card center shop-purse' },
        el('div', { class: 'star-chip', style: { fontSize: '1.3rem' } },
          el('span', { class: 'star-chip-icon', text: '★' }), String(stars)),
        el('p', { class: 'muted tiny', style: { marginTop: '8px' }, text: cheapest === null
          ? 'You own everything in the shop!'
          : stars >= cheapest
            ? 'Tap something to buy it.'
            : `Save up ${cheapest - stars} more and you can buy something.` })
      ),

      /* Ten slots would be ten tabs, so they are grouped the way a person
         would shop: things to wear, the room itself, furniture, wall art. */
      segmented(
        tabs().map(t => ({ value: t.key, label: `${t.emoji} ${t.label}` })),
        tab,
        v => { tab = v; render(); }
      ),

      el('div', { class: 'shop-grid' }, forSale.map(item => card(item, season)))
    );

    body.append(el('p', { class: 'center tiny muted', text:
      `${season.emoji} marks what suits ${season.name}. Everything stays on the shelves all year.` }));
    body.append(el('p', { class: 'center tiny muted', text:
      'Special treasures are not sold here — those are earned.' }));
    body.append(button('Go home', { cls: 'btn btn-quiet btn-block', emoji: '\u{1F3E0}',
      onClick: () => navigate('/') }));

    mount(container, body);
  }

  function card(item, season = currentSeason()) {
    const owned = items.owns(item.id);
    const afford = rewards.stars() >= item.price;
    const inSeason = item.season === season.key;

    return el('button', {
      class: `shop-card${owned ? ' owned' : afford ? '' : ' cant-afford'}${inSeason ? ' in-season' : ''}`,
      type: 'button',
      onClick: () => (owned ? alreadyOwned(item) : tryBuy(item)),
    },
      inSeason ? el('span', { class: 'season-tag', title: `Suits ${season.name}`,
        text: season.emoji }) : null,
      el('div', { class: 'shop-art', html: itemSVG(item, { size: 92 }) }),
      el('div', { class: 'shop-name', text: item.name }),
      owned
        ? el('div', { class: 'shop-owned', text: '✓ Owned' })
        : el('div', { class: `shop-price${afford ? '' : ' dim'}` },
            el('span', { text: '★' }), String(item.price))
    );
  }

  async function tryBuy(item) {
    const stars = rewards.stars();
    if (stars < item.price) {
      // Never a scolding — just how much further there is to go.
      modal(item.name, [
        el('div', { class: 'center', html: itemSVG(item, { size: 120 }) }),
        el('p', { class: 'center', text: item.blurb }),
        el('p', { class: 'center', style: { fontWeight: '900', fontSize: '1.1rem' },
          text: `★ ${item.price}` }),
        el('p', { class: 'center muted', text:
          `You have ${stars}. ${item.price - stars} more to go — you are getting there!` }),
        button('Keep saving', { cls: 'btn btn-primary btn-block', style: { marginTop: '14px' },
          onClick: () => document.querySelector('.modal-back')?.remove() }),
      ]);
      return;
    }

    const yes = await confirmDialog({
      title: `Buy ${item.name}?`,
      message: `${item.blurb}\n\nIt costs ${item.price} stars. You have ${stars}, and will have ${stars - item.price} left.`,
      confirmLabel: `Buy for ★ ${item.price}`,
    });
    if (!yes) return;

    // Spend first, and only grant if the stars actually left her purse.
    if (!rewards.spendStars(item.price, `shop:${item.id}`)) {
      toast('Not quite enough stars yet');
      return;
    }
    items.grant(item.id, 'Bought in the shop');
    confetti(24);

    const close = modal('It’s yours!', [
      el('div', { class: 'center', html: itemSVG(item, { size: 150 }) }),
      el('h3', { class: 'center', text: item.name }),
      el('p', { class: 'center muted tiny', text: item.blurb }),
      el('div', { class: 'row', style: { marginTop: '16px' } },
        button('Keep shopping', { cls: 'btn btn-quiet grow', onClick: () => { close(); render(); } }),
        button(item.category === 'hat' || item.category === 'accessory' ? 'Wear it now' : 'Put it out',
          { cls: 'btn btn-primary grow', onClick: () => { close(); wearNow(item); } })
      ),
    ]);
  }

  function wearNow(item) {
    const result = items.equip(item.id);
    if (!result.ok && result.reason === 'scene full') {
      toast('Your scene is full — put something away on the Pet screen first', { ms: 4600 });
      render();
      return;
    }
    navigate('/pet');
  }

  function alreadyOwned(item) {
    const on = items.isEquipped(item.id);
    const close = modal(item.name, [
      el('div', { class: 'center', html: itemSVG(item, { size: 140 }) }),
      el('p', { class: 'center muted tiny', text: item.blurb }),
      el('p', { class: 'center tiny', text: on ? 'Out on display right now.' : 'Safe in your collection.' }),
      el('div', { class: 'row', style: { marginTop: '16px' } },
        button('Close', { cls: 'btn btn-quiet grow', onClick: () => close() }),
        button(on ? 'Put it away' : (item.category === 'hat' || item.category === 'accessory' ? 'Wear it' : 'Put it out'),
          { cls: 'btn btn-primary grow', onClick: () => {
            const r = items.toggleEquip(item.id);
            if (!r.ok && r.reason === 'full') {
              const spec = items.SLOTS[item.category];
              toast(`Only ${spec.max} ${spec.label.toLowerCase()} at a time`, { ms: 4000 });
            }
            close(); render();
          } })
      ),
    ]);
  }

  render();
}
