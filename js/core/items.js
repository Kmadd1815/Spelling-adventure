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

/** How many decorations can be on show in her scene at once. */
export const SCENE_SLOTS = 3;

export const CATEGORY = {
  hat:       { key: 'hat',       label: 'Hats',        emoji: '\u{1F452}' },
  accessory: { key: 'accessory', label: 'Accessories', emoji: '\u{1F380}' },
  decor:     { key: 'decor',     label: 'Decorations', emoji: '\u{1FA91}' },
};

/* ---------- The catalogue ----------

   Priced against roughly 200 stars in a good week: something small most
   weeks, something nice after a week of saving, and a couple of things
   worth working towards for a month.

   `price: null` means the item cannot be bought at any price. Those are
   earned through milestones and recorded with where they came from. */

export const CATALOG = [
  /* ---- Hats ---- */
  { id: 'bow',           name: 'Little Bow',      category: 'hat', price: 40,
    blurb: 'A neat ribbon bow.' },
  { id: 'party_hat',     name: 'Party Hat',       category: 'hat', price: 65,
    blurb: 'For celebrating a good spelling day.' },
  { id: 'flower_crown',  name: 'Flower Crown',    category: 'hat', price: 110,
    blurb: 'Woven from spring flowers.' },
  { id: 'wizard_hat',    name: 'Wizard Hat',      category: 'hat', price: 190,
    blurb: 'Every good speller needs one.' },
  { id: 'gold_crown',    name: 'Golden Crown',    category: 'hat', price: 550,
    blurb: 'Heavy, shiny, and extremely fancy.' },

  /* ---- Accessories ---- */
  { id: 'bowtie',        name: 'Bow Tie',         category: 'accessory', price: 45,
    blurb: 'Very smart.' },
  { id: 'scarf',         name: 'Cozy Scarf',      category: 'accessory', price: 75,
    blurb: 'Soft and stripy.' },
  { id: 'goggles',       name: 'Swim Goggles',    category: 'accessory', price: 130,
    blurb: 'An axolotl is already good at swimming, but still.' },
  { id: 'cape',          name: 'Hero Cape',       category: 'accessory', price: 220,
    blurb: 'Swooshes when you walk.' },
  { id: 'star_glasses',  name: 'Star Glasses',    category: 'accessory', price: 300,
    blurb: 'The world looks sparklier through these.' },

  /* ---- Decorations ---- */
  { id: 'pebbles',       name: 'Pretty Pebbles',  category: 'decor', price: 35,
    blurb: 'Smooth river stones.' },
  { id: 'toy_ball',      name: 'Bouncy Ball',     category: 'decor', price: 45,
    blurb: 'Bounces surprisingly high.' },
  { id: 'potted_plant',  name: 'Potted Plant',    category: 'decor', price: 55,
    blurb: 'A cheerful little fern.' },
  { id: 'lamp',          name: 'Toadstool Lamp',  category: 'decor', price: 85,
    blurb: 'Glows softly in the evening.' },
  { id: 'teddy',         name: 'Teddy Bear',      category: 'decor', price: 120,
    blurb: 'A friend for your friend.' },
  { id: 'rug',           name: 'Stripey Rug',     category: 'decor', price: 160,
    blurb: 'Warm underfoot.' },
  { id: 'bookshelf',     name: 'Book Nook',       category: 'decor', price: 240,
    blurb: 'Full of stories.' },
  { id: 'lantern',       name: 'Paper Lantern',   category: 'decor', price: 280,
    blurb: 'Sways gently.' },
  { id: 'little_tree',   name: 'Little Tree',     category: 'decor', price: 420,
    blurb: 'It might grow. Nobody is sure.' },
  { id: 'fish_tank',     name: 'Fish Tank',       category: 'decor', price: 650,
    blurb: 'Three fish. They have names.' },
  { id: 'castle',        name: 'Castle Playset',  category: 'decor', price: 900,
    blurb: 'A whole tiny kingdom.' },

  /* ---- Special. Earned only; no price exists for these. ---- */
  { id: 'sprout_charm',   name: 'Little Sprout Charm', category: 'accessory', price: null,
    blurb: 'Your very first mastered word.' },
  { id: 'blossom_lamp',   name: 'Blossom Lamp',        category: 'decor',     price: null,
    blurb: 'Ten words, all yours.' },
  { id: 'star_rug',       name: 'Starlight Rug',       category: 'decor',     price: null,
    blurb: 'Twenty-five words mastered.' },
  { id: 'golden_quill',   name: 'Golden Quill',        category: 'accessory', price: null,
    blurb: 'Fifty words mastered.' },
  { id: 'champion_crown', name: 'Word Champion Crown', category: 'hat',       price: null,
    blurb: 'One hundred words. A champion.' },
  { id: 'word_castle',    name: 'Tiny Word Castle',    category: 'decor',     price: null,
    blurb: 'Two hundred words mastered.' },
  { id: 'cozy_candle',    name: 'Cozy Candle',         category: 'decor',     price: null,
    blurb: 'Three days in a row.' },
  { id: 'week_banner',    name: 'Seven-Day Banner',    category: 'decor',     price: null,
    blurb: 'A whole week of practice.' },
  { id: 'sun_mobile',     name: 'Sunbeam Mobile',      category: 'decor',     price: null,
    blurb: 'Thirty days of practice.' },
  { id: 'ribbon_shelf',   name: 'Ribbon Shelf',        category: 'decor',     price: null,
    blurb: 'A whole list completed.' },
  { id: 'trophy_shelf',   name: 'Trophy Shelf',        category: 'decor',     price: null,
    blurb: 'Five lists completed.' },
];

const BY_ID = new Map(CATALOG.map(i => [i.id, i]));

export const byId = id => BY_ID.get(id) || null;

/** Everything the shop is allowed to sell: exactly the items with a price. */
export const shopItems = () => CATALOG.filter(i => i.price != null);

/** Everything that cannot be bought, only earned. */
export const specialItems = () => CATALOG.filter(i => i.price == null);

export const isSpecial = item => !item || item.price == null;

/* ---------- Ownership ---------- */

export function ownedRecords() {
  return getState().collection.items;
}

export function owns(itemId) {
  return ownedRecords().some(r => r.itemId === itemId);
}

export function ownedOf(category) {
  return ownedRecords()
    .map(r => ({ ...byId(r.itemId), record: r }))
    .filter(i => i.id && i.category === category);
}

/** How she came by it, for the Collection Book. */
export function sourceOf(itemId) {
  return ownedRecords().find(r => r.itemId === itemId)?.source || null;
}

/**
 * Put an item in her collection. `source` is free text describing how she
 * got it — the shop, or the name of the milestone that awarded it.
 */
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

/* ---------- Equipping ----------
   Owning is forever; displaying is a handful of slots she chooses. */

export function equipped() {
  const e = getState().equipped;
  return { hat: e.hat, accessory: e.accessory, scene: e.scene.slice() };
}

export function isEquipped(itemId) {
  const e = getState().equipped;
  return e.hat === itemId || e.accessory === itemId || e.scene.includes(itemId);
}

/**
 * Wear or display an item. Hats and accessories replace whatever is in that
 * slot; decorations fill the next free scene slot, or refuse when the scene
 * is full so she has to decide what comes down first.
 * @returns {{ok: boolean, reason?: string}}
 */
export function equip(itemId) {
  const item = byId(itemId);
  if (!item) return { ok: false, reason: 'unknown' };
  if (!owns(itemId)) return { ok: false, reason: 'not owned' };
  if (isEquipped(itemId)) return { ok: true };

  if (item.category === 'decor') {
    if (getState().equipped.scene.length >= SCENE_SLOTS) {
      return { ok: false, reason: 'scene full' };
    }
    update(state => { state.equipped.scene.push(itemId); });
  } else {
    update(state => { state.equipped[item.category] = itemId; });
  }
  emit('item:equipped', item);
  return { ok: true };
}

export function unequip(itemId) {
  const item = byId(itemId);
  if (!item) return;
  update(state => {
    if (item.category === 'decor') {
      state.equipped.scene = state.equipped.scene.filter(id => id !== itemId);
    } else if (state.equipped[item.category] === itemId) {
      state.equipped[item.category] = null;
    }
  });
  emit('item:unequipped', item);
}

export function toggleEquip(itemId) {
  return isEquipped(itemId) ? (unequip(itemId), { ok: true }) : equip(itemId);
}

/** Items currently on show in her scene, in the order she placed them. */
export function sceneItems() {
  return getState().equipped.scene.map(byId).filter(Boolean);
}

export const equippedHat       = () => byId(getState().equipped.hat);
export const equippedAccessory = () => byId(getState().equipped.accessory);

/* ---------- Collection progress ---------- */

export function collectionStats() {
  const owned = ownedRecords().length;
  return { owned, total: CATALOG.length, pct: CATALOG.length ? owned / CATALOG.length : 0 };
}
