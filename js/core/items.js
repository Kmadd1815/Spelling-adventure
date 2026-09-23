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

  /* Outdoors. A bed on the grass would look like a bug rather than a
     choice, so the garden has its own slots and nothing crosses over. */
  sky:        { max: 1, label: 'Sky',            group: 'garden' },
  ground:     { max: 1, label: 'Ground',         group: 'garden' },
  tree:       { max: 1, label: 'Tree',           group: 'garden' },
  water:      { max: 1, label: 'Water',          group: 'garden' },
  fence:      { max: 1, label: 'Fence',          group: 'garden' },
  gardenDecor:{ max: 3, label: 'In the garden',  group: 'garden' },
};

/** The slots that belong outdoors, in the order the garden draws them. */
export const GARDEN_SLOTS = ['sky', 'ground', 'fence', 'tree', 'water', 'gardenDecor'];

export const isMulti = slot => (SLOTS[slot]?.max ?? 1) > 1;

/* Shop tabs, so ten slots do not become ten tabs. */
export const SHOP_TABS = [
  { key: 'wear',   label: 'Wear',    emoji: '\u{1F452}', slots: ['hat', 'accessory'] },
  { key: 'room',   label: 'Room',    emoji: '\u{1F6AA}', slots: ['wallpaper', 'flooring', 'window', 'door'] },
  { key: 'furn',   label: 'Furniture', emoji: '\u{1FA91}', slots: ['bed', 'rug', 'floorDecor'] },
  { key: 'walls',  label: 'Wall art', emoji: '\u{1F5BC}\uFE0F', slots: ['wallDecor'] },
  /* Hidden until the gate opens — see screens/shop.js. A tab full of things
     for a place she cannot visit yet would only be a tease. */
  { key: 'garden', label: 'Garden',  emoji: '\u{1F333}',
    slots: ['sky', 'ground', 'tree', 'water', 'fence', 'gardenDecor'] },
];

/* ---------- The catalogue ----------

   Priced against roughly 200 stars in a good week: something small most
   weeks, something nice after a week of saving, and a few things worth
   working towards for a month.

     price > 0     sold in the shop
     price === 0   a starter, owned from the very beginning
     price === null  earned only; there is no number to charge

   `season` is a hint, never a gate. An item that suits the time of year is
   pointed out in the shop and nothing more: everything stays buyable all
   year, because a thing she was saving up for quietly vanishing in
   December would be a punishment for saving.
*/

export const CATALOG = [
  /* ---- Hats ---- */
  { id: 'bow',           name: 'Little Bow',      category: 'hat', price: 40,  blurb: 'A neat ribbon bow.' },
  { id: 'party_hat',     name: 'Party Hat',       category: 'hat', price: 65,  blurb: 'For celebrating a good spelling day.' },
  { id: 'flower_crown',  name: 'Flower Crown',    category: 'hat', price: 110, blurb: 'Woven from spring flowers.', season: 'spring' },
  { id: 'wizard_hat',    name: 'Wizard Hat',      category: 'hat', price: 190, blurb: 'Every good speller needs one.' },
  { id: 'gold_crown',    name: 'Golden Crown',    category: 'hat', price: 550, blurb: 'Heavy, shiny, and extremely fancy.' },

  /* ---- Accessories ---- */
  { id: 'bowtie',        name: 'Bow Tie',         category: 'accessory', price: 45,  blurb: 'Very smart.' },
  { id: 'scarf',         name: 'Cozy Scarf',      category: 'accessory', price: 75,  blurb: 'Soft and stripy.', season: 'fall' },
  { id: 'goggles',       name: 'Swim Goggles',    category: 'accessory', price: 130, blurb: 'An axolotl is already good at swimming, but still.', season: 'summer' },
  { id: 'cape',          name: 'Hero Cape',       category: 'accessory', price: 220, blurb: 'Swooshes when you walk.' },
  { id: 'star_glasses',  name: 'Star Glasses',    category: 'accessory', price: 300, blurb: 'The world looks sparklier through these.' },

  /* ---- Wallpaper ---- */
  { id: 'wall_plain',    name: 'Soft Cream',      category: 'wallpaper', price: 0,   blurb: 'Simple and warm.' },
  { id: 'wall_stripes',  name: 'Mint Stripes',    category: 'wallpaper', price: 80,  blurb: 'Fresh and tidy.' },
  { id: 'wall_dots',     name: 'Pink Polka',      category: 'wallpaper', price: 95,  blurb: 'Dotty in the best way.' },
  { id: 'wall_stars',    name: 'Starry Night',    category: 'wallpaper', price: 170, blurb: 'A whole sky indoors.' },
  { id: 'wall_flowers',  name: 'Flower Garden',   category: 'wallpaper', price: 210, blurb: 'Climbing blossoms.', season: 'spring' },

  /* ---- Flooring ---- */
  { id: 'floor_wood',    name: 'Warm Wood',       category: 'flooring', price: 0,   blurb: 'Honest floorboards.' },
  { id: 'floor_tile',    name: 'Checker Tile',    category: 'flooring', price: 90,  blurb: 'Squeaky clean squares.' },
  { id: 'floor_grass',   name: 'Soft Grass',      category: 'flooring', price: 140, blurb: 'Somehow indoors.' },
  { id: 'floor_stone',   name: 'River Stone',     category: 'flooring', price: 160, blurb: 'Cool and smooth.' },
  { id: 'floor_pond',    name: 'Shallow Pond',    category: 'flooring', price: 320, blurb: 'Perfect for an axolotl.' },

  /* ---- Windows ---- */
  { id: 'window_plain',  name: 'Plain Window',    category: 'window', price: 0,   blurb: 'Looks out on the garden.' },
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
  { id: 'lantern',       name: 'Paper Lantern',   category: 'wallDecor', price: 280, blurb: 'Sways gently.', season: 'fall' },

  /* ---- The garden: sky ---- */
  { id: 'sky_day',       name: 'Blue Sky',        category: 'sky', price: 0,   blurb: 'A good day to be outside.' },
  { id: 'sky_sunset',    name: 'Sunset',          category: 'sky', price: 150, blurb: 'The whole sky goes orange.' },
  { id: 'sky_night',     name: 'Starry Night',    category: 'sky', price: 260, blurb: 'Quiet, and full of stars.', season: 'winter' },
  { id: 'sky_rainbow',   name: 'Rainbow Sky',     category: 'sky', price: 340, blurb: 'It must have just rained.', season: 'spring' },

  /* ---- The garden: ground ---- */
  { id: 'ground_grass',  name: 'Green Grass',     category: 'ground', price: 0,   blurb: 'Soft and a bit tickly.' },
  { id: 'ground_sand',   name: 'Sandy Shore',     category: 'ground', price: 120, blurb: 'Warm under your feet.', season: 'summer' },
  { id: 'ground_path',   name: 'Stone Path',      category: 'ground', price: 140, blurb: 'Winds off somewhere.' },
  { id: 'ground_meadow', name: 'Wildflower Meadow', category: 'ground', price: 190, blurb: 'Flowers everywhere at once.', season: 'spring' },

  /* ---- The garden: trees ---- */
  { id: 'tree_pine',     name: 'Pine Tree',       category: 'tree', price: 180, blurb: 'Green all winter long.', season: 'winter' },
  { id: 'tree_apple',    name: 'Apple Tree',      category: 'tree', price: 200, blurb: 'Six apples, if you count.', season: 'fall' },
  { id: 'tree_blossom',  name: 'Blossom Tree',    category: 'tree', price: 270, blurb: 'Pink for a few weeks a year.', season: 'spring' },
  { id: 'tree_willow',   name: 'Willow',          category: 'tree', price: 330, blurb: 'Leans over the water.', season: 'summer' },

  /* ---- The garden: water ---- */
  { id: 'pond_small',    name: 'Little Pond',     category: 'water', price: 150, blurb: 'Just deep enough.' },
  { id: 'pond_lily',     name: 'Lily Pond',       category: 'water', price: 240, blurb: 'Lily pads to sit on.', season: 'summer' },
  { id: 'pond_stars',    name: 'Wishing Pool',    category: 'water', price: 360, blurb: 'It holds the sky.' },

  /* ---- The garden: fences ---- */
  { id: 'fence_picket',  name: 'Picket Fence',    category: 'fence', price: 110, blurb: 'Neat and white.' },
  { id: 'fence_hedge',   name: 'Hedge',           category: 'fence', price: 160, blurb: 'Trimmed flat on top.' },
  { id: 'fence_stone',   name: 'Stone Wall',      category: 'fence', price: 230, blurb: 'Old, and covered in moss.', season: 'fall' },

  /* ---- The garden: everything else ---- */
  { id: 'mushrooms',     name: 'Toadstools',      category: 'gardenDecor', price: 50,  blurb: 'Red with white spots.', season: 'fall' },
  { id: 'stepping_stones', name: 'Stepping Stones', category: 'gardenDecor', price: 70,  blurb: 'Hop, hop, hop.' },
  { id: 'birdhouse',     name: 'Birdhouse',       category: 'gardenDecor', price: 90,  blurb: 'Somebody lives here.' },
  { id: 'flower_bed',    name: 'Flower Bed',      category: 'gardenDecor', price: 105, blurb: 'Planted in tidy rows.', season: 'spring' },
  { id: 'wheelbarrow',   name: 'Wheelbarrow',     category: 'gardenDecor', price: 125, blurb: 'Full of leaves.', season: 'fall' },
  { id: 'garden_bench',  name: 'Garden Bench',    category: 'gardenDecor', price: 145, blurb: 'For sitting and thinking.' },
  { id: 'lamp_post',     name: 'Lamp Post',       category: 'gardenDecor', price: 195, blurb: 'Comes on by itself.', season: 'winter' },
  { id: 'rope_swing',    name: 'Rope Swing',      category: 'gardenDecor', price: 220, blurb: 'Goes surprisingly high.', season: 'summer' },

  /* ---- On the floor ---- */
  { id: 'pebbles',       name: 'Pretty Pebbles',  category: 'floorDecor', price: 35,  blurb: 'Smooth river stones.' },
  { id: 'toy_ball',      name: 'Bouncy Ball',     category: 'floorDecor', price: 45,  blurb: 'Bounces surprisingly high.' },
  { id: 'potted_plant',  name: 'Potted Plant',    category: 'floorDecor', price: 55,  blurb: 'A cheerful little fern.' },
  { id: 'lamp',          name: 'Toadstool Lamp',  category: 'floorDecor', price: 85,  blurb: 'Glows softly in the evening.' },
  { id: 'teddy',         name: 'Teddy Bear',      category: 'floorDecor', price: 120, blurb: 'A friend for your friend.' },
  { id: 'bookshelf',     name: 'Book Nook',       category: 'floorDecor', price: 240, blurb: 'Full of stories.', season: 'fall' },
  { id: 'little_tree',   name: 'Little Tree',     category: 'floorDecor', price: 420, blurb: 'It might grow. Nobody is sure.' },
  { id: 'fish_tank',     name: 'Fish Tank',       category: 'floorDecor', price: 650, blurb: 'Three fish. They have names.' },
  { id: 'castle',        name: 'Castle Playset',  category: 'floorDecor', price: 900, blurb: 'A whole tiny kingdom.' },

  /* ================= Second wave =================
     Sized for about thirty weeks of use. The gap this fills is not the total
     cost — it is how much exists at each price. Eight things under eighty
     stars meant the cheap end ran dry in a month, so this leans low and mid
     so there is always something new within reach. */

  /* ---- More hats ---- */
  { id: 'flower_pin',   name: 'Flower Pin',      category: 'hat', price: 45,  blurb: 'One perfect daisy.' },
  { id: 'headband',     name: 'Headband',        category: 'hat', price: 55,  blurb: 'Keeps the gills tidy.' },
  { id: 'sun_hat',      name: 'Sun Hat',         category: 'hat', price: 60,  blurb: 'Wide brim, very summery.', season: 'summer' },
  { id: 'beanie',       name: 'Woolly Beanie',   category: 'hat', price: 75,  blurb: 'With a bobble on top.', season: 'winter' },
  { id: 'chef_hat',     name: 'Chef Hat',        category: 'hat', price: 100, blurb: 'For very serious cooking.' },
  { id: 'pirate_hat',   name: 'Pirate Hat',      category: 'hat', price: 170, blurb: 'Arr.' },
  { id: 'tiara',        name: 'Sparkle Tiara',   category: 'hat', price: 360, blurb: 'Catches the light beautifully.' },

  /* ---- More to wear ---- */
  { id: 'bell_collar',  name: 'Bell Collar',     category: 'accessory', price: 50,  blurb: 'Jingles when you wiggle.' },
  { id: 'necklace',     name: 'Bead Necklace',   category: 'accessory', price: 65,  blurb: 'Hand-threaded, obviously.' },
  { id: 'flower_lei',   name: 'Flower Lei',      category: 'accessory', price: 85,  blurb: 'A ring of blossoms.', season: 'summer' },
  { id: 'snorkel',      name: 'Snorkel',         category: 'accessory', price: 115, blurb: 'Completely unnecessary. Wonderful.', season: 'summer' },
  { id: 'backpack',     name: 'Little Backpack', category: 'accessory', price: 140, blurb: 'For carrying snacks.' },
  { id: 'sweater',      name: 'Stripy Sweater',  category: 'accessory', price: 175, blurb: 'Knitted with love.' },
  { id: 'fairy_wings',  name: 'Fairy Wings',     category: 'accessory', price: 330, blurb: 'They shimmer.' },

  /* ---- More wallpaper ---- */
  { id: 'wall_clouds',  name: 'Cloudy Sky',      category: 'wallpaper', price: 110, blurb: 'Soft and drifting.', season: 'winter' },
  { id: 'wall_rainbow', name: 'Rainbow Stripes', category: 'wallpaper', price: 185, blurb: 'Every colour at once.' },
  { id: 'wall_books',   name: 'Library Wall',    category: 'wallpaper', price: 240, blurb: 'Books all the way up.' },
  { id: 'wall_ocean',   name: 'Deep Ocean',      category: 'wallpaper', price: 270, blurb: 'Where an axolotl belongs.' },

  /* ---- More flooring ---- */
  { id: 'floor_moss',   name: 'Mossy Floor',     category: 'flooring', price: 105, blurb: 'Springy and green.' },
  { id: 'floor_sand',   name: 'Soft Sand',       category: 'flooring', price: 125, blurb: 'Warm between the toes.', season: 'summer' },
  { id: 'floor_marble', name: 'Marble',          category: 'flooring', price: 230, blurb: 'Rather grand.', season: 'winter' },
  { id: 'floor_petals', name: 'Fallen Petals',   category: 'flooring', price: 290, blurb: 'Pink all over.', season: 'fall' },

  /* ---- More windows and doors ---- */
  { id: 'window_flower',name: 'Flower Box',      category: 'window', price: 210, blurb: 'A window with a garden on it.' },
  { id: 'window_star',  name: 'Star Window',     category: 'window', price: 330, blurb: 'Shaped like a star.' },
  { id: 'door_barn',    name: 'Barn Door',       category: 'door', price: 185, blurb: 'Opens in two halves.' },
  { id: 'door_star',    name: 'Starlight Door',  category: 'door', price: 340, blurb: 'Glows around the edges.' },

  /* ---- More beds ---- */
  { id: 'bed_hammock',  name: 'Hammock',         category: 'bed', price: 195, blurb: 'Swings very gently.' },
  { id: 'bed_lilypad',  name: 'Lily Pad Bed',    category: 'bed', price: 255, blurb: 'Floats, sort of.' },
  { id: 'bed_mushroom', name: 'Mushroom Bed',    category: 'bed', price: 330, blurb: 'Red with white spots.' },
  { id: 'bed_cloud',    name: 'Cloud Bed',       category: 'bed', price: 520, blurb: 'As soft as it looks.', season: 'winter' },

  /* ---- More rugs ---- */
  { id: 'rug_moss',     name: 'Moss Mat',        category: 'rug', price: 130, blurb: 'A little patch of forest.' },
  { id: 'rug_star',     name: 'Star Rug',        category: 'rug', price: 175, blurb: 'Five points, very tidy.' },
  { id: 'rug_flower',   name: 'Flower Rug',      category: 'rug', price: 240, blurb: 'Petals all around.', season: 'spring' },
  { id: 'rug_cloud',    name: 'Cloud Rug',       category: 'rug', price: 300, blurb: 'Like standing on the sky.', season: 'winter' },

  /* ---- More for the walls ---- */
  { id: 'butterflies',  name: 'Butterflies',     category: 'wallDecor', price: 60,  blurb: 'Three, mid-flutter.', season: 'spring' },
  { id: 'small_shelf',  name: 'Little Shelf',    category: 'wallDecor', price: 85,  blurb: 'Just big enough.' },
  { id: 'mirror',       name: 'Round Mirror',    category: 'wallDecor', price: 115, blurb: 'Who is that handsome axolotl?' },
  { id: 'wall_planter', name: 'Hanging Planter', category: 'wallDecor', price: 135, blurb: 'Trailing leaves.' },
  { id: 'map',          name: 'Treasure Map',    category: 'wallDecor', price: 160, blurb: 'X is somewhere.' },
  { id: 'fairy_lights', name: 'Fairy Lights',    category: 'wallDecor', price: 195, blurb: 'Warm little bulbs.', season: 'winter' },
  { id: 'rainbow_arch', name: 'Rainbow',         category: 'wallDecor', price: 250, blurb: 'Indoors, which is rare.', season: 'spring' },

  /* ---- Plants, properly ---- */
  { id: 'plant_cactus',    name: 'Little Cactus',  category: 'floorDecor', price: 60,  blurb: 'Prickly but friendly.' },
  { id: 'plant_succulent', name: 'Succulent',      category: 'floorDecor', price: 70,  blurb: 'Almost impossible to kill.' },
  { id: 'plant_flowers',   name: 'Flower Pot',     category: 'floorDecor', price: 95,  blurb: 'Three blooms, all different.', season: 'spring' },
  /* Its own id, and not 'mushrooms'. The indoor one and the garden one were
     both filed under that, and since the last row of a duplicate pair wins
     the lookup, every Toadstool she bought — including the one on the
     garden shelf — was filed as indoor furniture and could never be put out
     in the garden at all. */
  { id: 'toadstool_cluster', name: 'Toadstool Cluster', category: 'floorDecor', price: 110, blurb: 'A small red cluster.', season: 'fall' },
  { id: 'plant_big_leaf',  name: 'Big Leaf Plant', category: 'floorDecor', price: 165, blurb: 'Enormous cheerful leaves.' },
  { id: 'plant_tall',      name: 'Tall Palm',      category: 'floorDecor', price: 145, blurb: 'Reaches right up.', season: 'summer' },
  { id: 'plant_bonsai',    name: 'Bonsai Tree',    category: 'floorDecor', price: 190, blurb: 'Tiny and very old.', season: 'fall' },

  /* ---- More for the floor ---- */
  { id: 'watering_can',    name: 'Watering Can',   category: 'floorDecor', price: 40,  blurb: 'For all those plants.' },
  { id: 'toy_blocks',      name: 'Toy Blocks',     category: 'floorDecor', price: 55,  blurb: 'Spells a word, if you like.' },
  { id: 'stool',           name: 'Little Stool',   category: 'floorDecor', price: 80,  blurb: 'Three sturdy legs.' },
  { id: 'floor_lamp',      name: 'Standing Lamp',  category: 'floorDecor', price: 175, blurb: 'Leans over to read by.' },
  { id: 'easel',           name: 'Painting Easel', category: 'floorDecor', price: 225, blurb: 'A masterpiece in progress.' },
  { id: 'rocking_horse',   name: 'Rocking Horse',  category: 'floorDecor', price: 290, blurb: 'Creaks pleasantly.' },

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

  /* Found by the axolotl after a spelling session. Never in the shop, never
     required for anything — the whole point is that they turn up. */
  { id: 'glow_jar',       name: 'Jar of Fireflies',    category: 'floorDecor', price: null, blurb: 'Something the axolotl found.' },
  { id: 'moon_shell',     name: 'Moon Shell',          category: 'floorDecor', price: null, blurb: 'Something the axolotl found.' },
  { id: 'star_map',       name: 'Star Map',            category: 'wallDecor',  price: null, blurb: 'Something the axolotl found.' },
  { id: 'paper_boat',     name: 'Paper Boat',          category: 'floorDecor', price: null, blurb: 'Something the axolotl found.' },
  { id: 'mushroom_stool', name: 'Mushroom Stool',      category: 'floorDecor', price: null, blurb: 'Something the axolotl found.' },
  { id: 'feather_cap',    name: 'Feather Cap',         category: 'hat',        price: null, blurb: 'Something the axolotl found.' },

  /* Halloween 2026 — earned only during the Haunted Spelling Hunt, and kept
     for good afterwards. A later year gets its own set rather than these. */
  { id: 'pumpkin_lantern', name: 'Pumpkin Lantern',    category: 'floorDecor', price: null, blurb: 'Haunted Spelling Hunt, 2026.' },
  { id: 'witch_hat',       name: 'Little Witch Hat',   category: 'hat',        price: null, blurb: 'Haunted Spelling Hunt, 2026.' },
  { id: 'bat_garland',     name: 'Bat Garland',        category: 'wallDecor',  price: null, blurb: 'Haunted Spelling Hunt, 2026.' },
  { id: 'candy_bucket',    name: 'Candy Bucket',       category: 'floorDecor', price: null, blurb: 'Haunted Spelling Hunt, 2026.' },
  { id: 'ghost_friend',    name: 'Little Ghost Friend', category: 'floorDecor', price: null, blurb: 'Haunted Spelling Hunt, 2026.' },

  /* Birthday Week. The only event that comes back every year, so these are
     hers from the first one and the party happens regardless after that. */
  { id: 'birthday_cake',  name: 'Birthday Cake',       category: 'floorDecor', price: null, blurb: 'Your birthday week.' },
  { id: 'balloon_bunch',  name: 'Bunch of Balloons',   category: 'floorDecor', price: null, blurb: 'Your birthday week.' },
  { id: 'party_banner',   name: 'Birthday Banner',     category: 'wallDecor',  price: null, blurb: 'Your birthday week.' },
  { id: 'birthday_sash',  name: 'Birthday Sash',       category: 'accessory',  price: null, blurb: 'Your birthday week.' },

  /* Gathering Week, 2026 */
  { id: 'pumpkin_pie',    name: 'Pumpkin Pie',         category: 'floorDecor', price: null, blurb: 'Gathering Week, 2026.' },
  { id: 'acorn_hat',      name: 'Acorn Cap',           category: 'hat',        price: null, blurb: 'Gathering Week, 2026.' },
  { id: 'leaf_wreath',    name: 'Leaf Wreath',         category: 'wallDecor',  price: null, blurb: 'Gathering Week, 2026.' },
  { id: 'cornucopia',     name: 'Harvest Basket',      category: 'floorDecor', price: null, blurb: 'Gathering Week, 2026.' },

  /* Trim the Tree, 2026 */
  { id: 'holiday_tree',   name: 'Little Holiday Tree', category: 'floorDecor', price: null, blurb: 'Trim the Tree, 2026.' },
  { id: 'stocking',       name: 'Stocking',            category: 'wallDecor',  price: null, blurb: 'Trim the Tree, 2026.' },
  { id: 'santa_hat',      name: 'Holiday Hat',         category: 'hat',        price: null, blurb: 'Trim the Tree, 2026.' },
  { id: 'snow_globe',     name: 'Snow Globe',          category: 'floorDecor', price: null, blurb: 'Trim the Tree, 2026.' },

  /* Midnight Sparklers, into 2027 */
  { id: 'sparkler_jar',   name: 'Jar of Sparklers',    category: 'floorDecor', price: null, blurb: 'Midnight Sparklers, 2027.' },
  { id: 'party_horn',     name: 'Party Horn',          category: 'accessory',  price: null, blurb: 'Midnight Sparklers, 2027.' },
  { id: 'star_garland',   name: 'Star Garland',        category: 'wallDecor',  price: null, blurb: 'Midnight Sparklers, 2027.' },
  { id: 'midnight_clock', name: 'Midnight Clock',      category: 'wallDecor',  price: null, blurb: 'Midnight Sparklers, 2027.' },

  /* Spring Egg Hunt, 2027 */
  { id: 'egg_basket',     name: 'Basket of Eggs',      category: 'floorDecor', price: null, blurb: 'Spring Egg Hunt, 2027.' },
  { id: 'bunny_ears',     name: 'Bunny Ears',          category: 'hat',        price: null, blurb: 'Spring Egg Hunt, 2027.' },
  { id: 'tulip_pot',      name: 'Pot of Tulips',       category: 'floorDecor', price: null, blurb: 'Spring Egg Hunt, 2027.' },
  { id: 'spring_wreath',  name: 'Spring Wreath',       category: 'wallDecor',  price: null, blurb: 'Spring Egg Hunt, 2027.' },
];

/* Built by hand rather than from Map(entries), because Map keeps the LAST
   of a duplicate pair without a word. Two rows under one id is not a near
   miss — it decides which slot the item lives in, and it cost the garden
   its toadstools for a whole release. */
const BY_ID = new Map();
for (const item of CATALOG) {
  if (BY_ID.has(item.id)) {
    throw new Error(`items.js: '${item.id}' is in the catalogue twice. ` +
      'One id is one item: two rows means the second silently decides its ' +
      'slot, its price and its name.');
  }
  BY_ID.set(item.id, item);
}

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

/** Shop items that suit a given season. A hint for the shop, nothing more. */
export const itemsInSeason = seasonKey =>
  CATALOG.filter(i => i.price > 0 && i.season === seasonKey);

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
