/* Items, ownership and what is being worn or displayed.

   Three separate layers, deliberately never merged:

     STARS       the currency, in progress.stars
     COLLECTION  everything she owns, in collection.items
     EQUIPPED    the few things on show right now, in `equipped`

   She can own thirty decorations and display three. Owning is permanent;
   displaying is a choice she can change any time.

   The hard rule — special items are earned, never bought — is structural
   rather than a check that could be forgotten: a special item has no price
   field at all, and the shop is defined as "items that have a price". There
   is nowhere to put a price on a milestone reward, so one cannot leak in.
*/

import { getState, update } from './state.js';
import { emit } from './bus.js';

/* ---------- Slots ----------

   A room is not a shelf with three spaces on it. Each kind of thing has its
   own place and its own limit, which is what stops a room from turning into
   a pile and what makes choosing between two rugs a real decision. */

export const SLOTS = {
  wallpaper:  { max: 1, label: 'Wallpaper',    group: 'room' },
  flooring:   { max: 1, label: 'Flooring',     group: 'room' },
  window:     { max: 1, label: 'Window',       group: 'room' },
  door:       { max: 1, label: 'Door',         group: 'room' },
  wallDecor:  { max: 2, label: 'On the walls', group: 'decor' },
  bed:        { max: 1, label: 'Bed',          group: 'furniture' },
  rug:        { max: 1, label: 'Rug',          group: 'furniture' },
  floorDecor: { max: 3, label: 'On the floor', group: 'furniture' },
  hat:        { max: 1, label: 'Hat',          group: 'pet' },
  accessory:  { max: 1, label: 'Accessory',    group: 'pet' },
};

export const isMulti = slot => (SLOTS[slot]?.max ?? 1) > 1;

/* Shop tabs, so ten slots do not become ten tabs. */
export const SHOP_TABS = [
  { key: 'wear',   label: 'Wear',    emoji: '\u{1F452}', slots: ['hat', 'accessory'] },
  { key: 'room',   label: 'Room',    emoji: '\u{1F6AA}', slots: ['wallpaper', 'flooring', 'window', 'door'] },
  { key: 'furn',   label: 'Furniture', emoji: '\u{1FA91}', slots: ['bed', 'rug', 'floorDecor'] },
  { key: 'walls',  label: 'Wall art', emoji: '\u{1F5BC}\uFE0F', slots: ['wallDecor'] },
];

/* ---------- The catalogue ----------

   Priced against roughly 200 stars in a good week: something small most
   weeks, something nice after a week of saving, and a few things worth
   working towards for a month.

     price > 0     sold in the shop
     price === 0   a starter, owned from the very beginning
     price === null  earned only; there is no number to charge
*/

export const CATALOG = [
  /* ---- Hats ---- */
  { id: 'bow',           name: 'Little Bow',      category: 'hat', price: 40,  blurb: 'A neat ribbon bow.' },
  { id: 'party_hat',     name: 'Party Hat',       category: 'hat', price: 65,  blurb: 'For celebrating a good spelling day.' },
  { id: 'flower_crown',  name: 'Flower Crown',    category: 'hat', price: 110, blurb: 'Woven from spring flowers.' },
  { id: 'wizard_hat',    name: 'Wizard Hat',      category: 'hat', price: 190, blurb: 'Every good speller needs one.' },
  { id: 'gold_crown',    name: 'Golden Crown',    category: 'hat', price: 550, blurb: 'Heavy, shiny, and extremely fancy.' },

  /* ---- Accessories ---- */
  { id: 'bowtie',        name: 'Bow Tie',         category: 'accessory', price: 45,  blurb: 'Very smart.' },
  { id: 'scarf',         name: 'Cozy Scarf',      category: 'accessory', price: 75,  blurb: 'Soft and stripy.' },
  { id: 'goggles',       name: 'Swim Goggles',    category: 'accessory', price: 130, blurb: 'An axolotl is already good at swimming, but still.' },
  { id: 'cape',          name: 'Hero Cape',       category: 'accessory', price: 220, blurb: 'Swooshes when you walk.' },
  { id: 'star_glasses',  name: 'Star Glasses',    category: 'accessory', price: 300, blurb: 'The world looks sparklier through these.' },

  /* ---- Wallpaper ---- */
  { id: 'wall_plain',    name: 'Soft Cream',      category: 'wallpaper', price: 0,   blurb: 'Simple and warm.' },
  { id: 'wall_stripes',  name: 'Mint Stripes',    category: 'wallpaper', price: 80,  blurb: 'Fresh and tidy.' },
  { id: 'wall_dots',     name: 'Pink Polka',      category: 'wallpaper', price: 95,  blurb: 'Dotty in the best way.' },
  { id: 'wall_stars',    name: 'Starry Night',    category: 'wallpaper', price: 170, blurb: 'A whole sky indoors.' },
  { id: 'wall_flowers',  name: 'Flower Garden',   category: 'wallpaper', price: 210, blurb: 'Climbing blossoms.' },

  /* ---- Flooring ---- */
  { id: 'floor_wood',    name: 'Warm Wood',       category: 'flooring', price: 0,   blurb: 'Honest floorboards.' },
  { id: 'floor_tile',    name: 'Checker Tile',    category: 'flooring', price: 90,  blurb: 'Squeaky clean squares.' },
  { id: 'floor_grass',   name: 'Soft Grass',      category: 'flooring', price: 140, blurb: 'Somehow indoors.' },
  { id: 'floor_stone',   name: 'River Stone',     category: 'flooring', price: 160, blurb: 'Cool and smooth.' },
  { id: 'floor_pond',    name: 'Shallow Pond',    category: 'flooring', price: 320, blurb: 'Perfect for an axolotl.' },

  /* ---- Windows ---- */
  { id: 'window_round',  name: 'Round Window',    category: 'window', price: 120, blurb: 'A porthole to the garden.' },
  { id: 'window_cottage',name: 'Cottage Window',  category: 'window', price: 180, blurb: 'Four panes and a sill.' },
  { id: 'window_arch',   name: 'Arched Window',   category: 'window', price: 260, blurb: 'Grand and sunny.' },

  /* ---- Doors ---- */
  { id: 'door_wood',     name: 'Wooden Door',     category: 'door', price: 140, blurb: 'Solid and friendly.' },
  { id: 'door_round',    name: 'Round Door',      category: 'door', price: 230, blurb: 'Like a burrow entrance.' },
  { id: 'door_fancy',    name: 'Fancy Door',      category: 'door', price: 300, blurb: 'For important guests.' },

  /* ---- Beds ---- */
  { id: 'bed_cushion',   name: 'Round Cushion',   category: 'bed', price: 150, blurb: 'Squishy and round.' },
  { id: 'bed_cozy',      name: 'Cozy Bed',        category: 'bed', price: 280, blurb: 'Blanket and everything.' },
  { id: 'bed_shell',     name: 'Shell Bed',       category: 'bed', price: 480, blurb: 'A giant sleeping shell.' },

  /* ---- Rugs ---- */
  { id: 'rug',           name: 'Stripey Rug',     category: 'rug', price: 160, blurb: 'Warm underfoot.' },
  { id: 'rug_round',     name: 'Round Rug',       category: 'rug', price: 210, blurb: 'Soft in every direction.' },

  /* ---- On the walls ---- */
  { id: 'frame',         name: 'Picture Frame',   category: 'wallDecor', price: 70,  blurb: 'A painting of a pond.' },
  { id: 'clock',         name: 'Wall Clock',      category: 'wallDecor', price: 110, blurb: 'Always says tea time.' },
  { id: 'bunting',       name: 'Bunting',         category: 'wallDecor', price: 130, blurb: 'Strung corner to corner.' },
  { id: 'lantern',       name: 'Paper Lantern',   category: 'wallDecor', price: 280, blurb: 'Sways gently.' },

  /* ---- On the floor ---- */
  { id: 'pebbles',       name: 'Pretty Pebbles',  category: 'floorDecor', price: 35,  blurb: 'Smooth river stones.' },
  { id: 'toy_ball',      name: 'Bouncy Ball',     category: 'floorDecor', price: 45,  blurb: 'Bounces surprisingly high.' },
  { id: 'potted_plant',  name: 'Potted Plant',    category: 'floorDecor', price: 55,  blurb: 'A cheerful little fern.' },
  { id: 'lamp',          name: 'Toadstool Lamp',  category: 'floorDecor', price: 85,  blurb: 'Glows softly in the evening.' },
  { id: 'teddy',         name: 'Teddy Bear',      category: 'floorDecor', price: 120, blurb: 'A friend for your friend.' },
  { id: 'bookshelf',     name: 'Book Nook',       category: 'floorDecor', price: 240, blurb: 'Full of stories.' },
  { id: 'little_tree',   name: 'Little Tree',     category: 'floorDecor', price: 420, blurb: 'It might grow. Nobody is sure.' },
  { id: 'fish_tank',     name: 'Fish Tank',       category: 'floorDecor', price: 650, blurb: 'Three fish. They have names.' },
  { id: 'castle',        name: 'Castle Playset',  category: 'floorDecor', price: 900, blurb: 'A whole tiny kingdom.' },

  /* ---- Special. Earned only; no price exists for these. ---- */
  { id: 'sprout_charm',   name: 'Little Sprout Charm', category: 'accessory',  price: null, blurb: 'Your very first mastered word.' },
  { id: 'blossom_lamp',   name: 'Blossom Lamp',        category: 'floorDecor', price: null, blurb: 'Ten words, all yours.' },
  { id: 'star_rug',       name: 'Starlight Rug',       category: 'rug',        price: null, blurb: 'Twenty-five words mastered.' },
  { id: 'golden_quill',   name: 'Golden Quill',        category: 'accessory',  price: null, blurb: 'Fifty words mastered.' },
  { id: 'champion_crown', name: 'Word Champion Crown', category: 'hat',        price: null, blurb: 'One hundred words. A champion.' },
  { id: 'word_castle',    name: 'Tiny Word Castle',    category: 'floorDecor', price: null, blurb: 'Two hundred words mastered.' },
  { id: 'cozy_candle',    name: 'Cozy Candle',         category: 'floorDecor', price: null, blurb: 'Three days in a row.' },
  { id: 'week_banner',    name: 'Seven-Day Banner',    category: 'wallDecor',  price: null, blurb: 'A whole week of practice.' },
  { id: 'sun_mobile',     name: 'Sunbeam Mobile',      category: 'wallDecor',  price: null, blurb: 'Thirty days of practice.' },
  { id: 'ribbon_shelf',   name: 'Ribbon Shelf',        category: 'wallDecor',  price: null, blurb: 'A whole list completed.' },
  { id: 'trophy_shelf',   name: 'Trophy Shelf',        category: 'wallDecor',  price: null, blurb: 'Five lists completed.' },
];

const BY_ID = new Map(CATALOG.map(i => [i.id, i]));

export const byId = id => BY_ID.get(id) || null;

/** Sold in the shop: exactly the items that carry a price above zero. */
export const shopItems = () => CATALOG.filter(i => i.price > 0);

/** Hers from the very first launch, so the room is never blank. */
export const starterItems = () => CATALOG.filter(i => i.price === 0);

/** Earned only. No price exists for these, so none can reach a shelf. */
export const specialItems = () => CATALOG.filter(i => i.price === null);

export const isSpecial = item => !!item && item.price === null;
export const isStarter = item => !!item && item.price === 0;

export const itemsForSlot = slot => CATALOG.filter(i => i.category === slot);

/* ---------- Ownership ---------- */

export function ownedRecords() {
  return getState().collection.items;
}

export function owns(itemId) {
  const item = byId(itemId);
  if (!item) return false;
  if (item.price === 0) return true;          // starters need no record
  return ownedRecords().some(r => r.itemId === itemId);
}

/** Everything she owns in a slot, starters included. */
export function ownedOf(slot) {
  return CATALOG.filter(i => i.category === slot && owns(i.id));
}

export function sourceOf(itemId) {
  const item = byId(itemId);
  if (item && item.price === 0) return 'Yours from the start';
  return ownedRecords().find(r => r.itemId === itemId)?.source || null;
}

export function grant(itemId, source = 'Earned') {
  const item = byId(itemId);
  if (!item || owns(itemId)) return null;
  return update(state => {
    const record = {
      id: `own_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 6)}`,
      itemId, source, earnedAt: Date.now(),
    };
    state.collection.items.push(record);
    emit('item:granted', { item, record });
    return record;
  });
}

/* ---------- What is on show ----------
   Owning is forever. This is the handful of choices layered on top. */

export function equipped() {
  const e = getState().equipped;
  const out = {};
  for (const [slot, spec] of Object.entries(SLOTS)) {
    out[slot] = spec.max > 1 ? (e[slot] || []).slice() : (e[slot] ?? null);
  }
  return out;
}

export function inSlot(slot) {
  const e = getState().equipped;
  return SLOTS[slot]?.max > 1 ? (e[slot] || []).slice() : (e[slot] ? [e[slot]] : []);
}

export function isEquipped(itemId) {
  const item = byId(itemId);
  if (!item) return false;
  return inSlot(item.category).includes(itemId);
}

export function slotUsage(slot) {
  return { used: inSlot(slot).length, max: SLOTS[slot]?.max ?? 1 };
}

/**
 * Put an item on show.
 * Single slots swap straight over — choosing a new rug simply rolls up the
 * old one. Multi slots fill up and then refuse, so she has to decide what
 * comes down first rather than the room quietly growing.
 */
export function equip(itemId) {
  const item = byId(itemId);
  if (!item) return { ok: false, reason: 'unknown' };
  if (!owns(itemId)) return { ok: false, reason: 'not owned' };
  if (isEquipped(itemId)) return { ok: true };

  const slot = item.category;
  const spec = SLOTS[slot];
  if (!spec) return { ok: false, reason: 'no slot' };

  if (spec.max > 1) {
    if (inSlot(slot).length >= spec.max) return { ok: false, reason: 'full', slot };
    update(state => { state.equipped[slot] = [...(state.equipped[slot] || []), itemId]; });
  } else {
    update(state => { state.equipped[slot] = itemId; });
  }
  emit('item:equipped', item);
  return { ok: true };
}

export function unequip(itemId) {
  const item = byId(itemId);
  if (!item) return;
  const slot = item.category;
  update(state => {
    if (SLOTS[slot]?.max > 1) {
      state.equipped[slot] = (state.equipped[slot] || []).filter(id => id !== itemId);
    } else if (state.equipped[slot] === itemId) {
      state.equipped[slot] = null;
    }
  });
  emit('item:unequipped', item);
}

export function toggleEquip(itemId) {
  return isEquipped(itemId) ? (unequip(itemId), { ok: true }) : equip(itemId);
}

/* ---------- Collection progress ---------- */

export function collectionStats() {
  const owned = CATALOG.filter(i => owns(i.id)).length;
  return { owned, total: CATALOG.length, pct: CATALOG.length ? owned / CATALOG.length : 0 };
}
