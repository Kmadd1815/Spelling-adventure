/* What happens when she taps something she has put out.

   Her own idea, and a good one: "she taps the bed and the axolotl lays
   down for a quick nap, she taps the bookcase and the axolotl reads for a
   second, tap the plant to water it... And other decorations could have a
   small animation if not a direct interaction."

   So there are two kinds of answer, and every single thing in the room has
   one of them:

     A VISIT. The axolotl walks over, does something for a few seconds, and
     says a line about it. This is for the things it makes sense to use —
     a bed, a bookshelf, a plant, a tea set.

     A FIDGET. The thing itself moves and the axolotl looks over at it from
     wherever it is. This is for everything else: blocks that stack and
     topple, bunting that ripples, a clock whose hands spin round, a ball
     that bounces.

   NOTHING IS EVER SILENT. An item with no entry here still gets a nudge
   and a line, because a child who taps something and gets nothing learns
   that tapping things does nothing, and stops.

   None of it costs anything and none of it can be used up. This is not a
   reward and not a currency; it is the room answering when she touches it.
*/

/* The poses the axolotl can strike. Each one is a CSS class on the pet and
   a length of time to hold it. */
export const POSES = {
  nap:    { ms: 4200, z: true },
  read:   { ms: 3400 },
  water:  { ms: 2800 },
  play:   { ms: 2600 },
  sip:    { ms: 2800 },
  sniff:  { ms: 2400 },
  cuddle: { ms: 3000 },
  peer:   { ms: 2600 },
};

const V = (pose, lines, item = '') => ({ kind: 'visit', pose, lines, item });
const F = (item, lines) => ({ kind: 'fidget', item, lines });

/* ---------- The things she can use ---------- */

const PLAYS = {
  /* Beds. Every one of them is a nap. */
  bed_cushion: V('nap', ['Just five minutes.', 'This cushion is the best one.']),
  bed_cozy:    V('nap', ['Night night.', 'Just a little nap…'], 'dp-squish'),
  bed_shell:   V('nap', ['It is cool in here.', 'Shhh. Shell time.']),
  bed_hammock: V('nap', ['Swiiing.', 'I could stay up here all day.'], 'dp-sway'),
  bed_lilypad: V('nap', ['Floaty.', 'A lily pad is a very good bed.'], 'dp-bob'),
  bed_mushroom:V('nap', ['Spotty and soft.', 'Mushroom nap!'], 'dp-squish'),
  bed_cloud:   V('nap', ['I am on a cloud.', 'Soft. Very soft.'], 'dp-bob'),

  /* Things to read, water, drink and poke. */
  bookshelf:   V('read', ['I like the one with the frog in it.',
                          'Just one more page.', 'This book is about words!'], 'dp-wiggle'),
  small_shelf: V('peer', ['I like how you put these.', 'Everything in its place.']),
  potted_plant:V('water', ['There you go, little plant.', 'Grow grow grow.'], 'dp-grow'),
  plant_cactus:V('water', ['Careful. Spiky.', 'A very small drink for a very small cactus.'], 'dp-grow'),
  plant_succulent: V('water', ['You do not need much, do you.'], 'dp-grow'),
  plant_flowers:   V('sniff', ['They smell like the garden.'], 'dp-grow'),
  plant_big_leaf:  V('water', ['Big leaves, big drink.'], 'dp-grow'),
  plant_tall:      V('water', ['You are taller than me now.'], 'dp-grow'),
  plant_bonsai:    V('peer', ['A tiny tree. A TINY tree.'], 'dp-wiggle'),
  watering_can:    V('play', ['Filling up!'], 'dp-tip'),
  tea_set:     V('sip', ['One sugar, please.', 'Mmm. Tea.'], 'dp-wiggle'),
  teddy:       V('cuddle', ['Hello bear.', 'Bear needed a cuddle.'], 'dp-squish'),
  ghost_friend:V('cuddle', ['You are not scary at all.'], 'dp-bob'),
  fish_tank:   V('peer', ['Hello in there!', 'That one keeps looking at me.'], 'dp-bob'),
  easel:       V('play', ['I painted the pond.', 'Do you like it?'], 'dp-wiggle'),
  rocking_horse: V('play', ['Giddy up!'], 'dp-sway'),
  stool:       V('play', ['Up I get. Oh. Down I get.'], 'dp-wiggle'),
  music_box:   V('peer', ['Listen!'], 'dp-turn'),
  snow_globe:  V('peer', ['It is snowing in there.'], 'dp-sway'),
  glow_jar:    V('peer', ['They wake up when I come close.'], 'dp-pulse'),
  mirror:      V('peer', ['Hello, handsome.', 'That one looks exactly like me.']),
  castle:      V('play', ['I am the king of this castle.'], 'dp-wiggle'),
  word_castle: V('play', ['A castle made of letters!'], 'dp-wiggle'),
  birthday_cake: V('sniff', ['Is it for me? It is for me.'], 'dp-pulse'),
  pumpkin_pie: V('sniff', ['Mmmmm. Pie.'], 'dp-wiggle'),

  /* The window, which is how the weather gets in. */
  window_plain:   V('peer', ['It is doing something out there.'], 'dp-wiggle'),
  window_round:   V('peer', ['A round window for a round axolotl.'], 'dp-wiggle'),
  window_cottage: V('peer', ['I can see the whole garden!'], 'dp-wiggle'),
  window_arch:    V('peer', ['Look how far you can see.'], 'dp-wiggle'),
  window_flower:  V('peer', ['Flowers on the inside AND the outside.'], 'dp-grow'),
  window_star:    V('peer', ['I am waiting for the first star.'], 'dp-twinkle'),

  /* Outdoors. */
  bird_bath:   V('peer', ['The bird lets me watch.'], ''),
  flower_bed:  V('sniff', ['These are my favourite.'], 'dp-grow'),
  rope_swing:  V('play', ['Higher! Higher!'], 'dp-sway'),
  garden_bench:V('nap', ['A sit down in the sun.']),
  mushrooms:   V('sniff', ['Do not eat them. I checked.'], 'dp-wiggle'),
  mushroom_ring: V('play', ['Round and round the ring.'], 'dp-wiggle'),
  birdhouse:   V('peer', ['Anybody home?'], 'dp-wiggle'),
  stepping_stones: V('play', ['Hop. Hop. Hop!'], 'dp-wiggle'),
  wheelbarrow: V('play', ['Full of leaves!'], 'dp-sway'),
  lamp_post:   V('peer', ['It comes on all by itself.'], 'dp-pulse'),
  lantern_post:V('peer', ['Warm little light.'], 'dp-pulse'),
  toadstool_cluster: V('sniff', ['Spotty!'], 'dp-wiggle'),
};

/* ---------- The things that just do something ---------- */

const FIDGETS = {
  /* The fence. A visit would send the axolotl to the very back of the
     garden and leave it standing in a hedge, so the fence waves instead
     and gets looked at from wherever it is. */
  fence_picket: F('dp-sway', ['My fence!', 'Nobody gets past this.']),
  fence_hedge:  F('dp-sway', ['Rustle rustle.', 'Something lives in there.']),
  fence_stone:  F('dp-nudge', ['Good solid wall, this.']),

  toy_blocks:  F('dp-stack',   ['Up they go!', 'Oh no. Down they go.']),
  toy_ball:    F('dp-bounce',  ['Bouncy!', 'Get it get it get it!']),
  bunting:     F('dp-flutter', ['It is windy in here.', 'Flappy!']),
  week_banner: F('dp-flutter', ['Seven whole days.']),
  party_banner:F('dp-flutter', ['Party time!']),
  birthday_banner: F('dp-flutter', ['Hooray!']),
  bat_garland: F('dp-flutter', ['Spooky. A bit.']),
  star_garland:F('dp-twinkle', ['They are twinkling!']),
  heart_garland: F('dp-flutter', ['Hearts everywhere.']),
  fairy_lights:F('dp-twinkle', ['Ooooh.']),
  clock:       F('dp-tick',    ['Is that the time?']),
  midnight_clock: F('dp-tick', ['Nearly midnight!']),
  cloud_mobile:F('dp-turn',    ['Round and round.']),
  sun_mobile:  F('dp-turn',    ['Here comes the sun.']),
  ribbon_shelf:F('dp-wiggle',  ['Tidy.']),
  trophy_shelf:F('dp-pulse',   ['I won that. Probably.']),
  balloon_bunch: F('dp-bob',   ['Do not let go!']),
  cozy_candle: F('dp-pulse',   ['Flicker flicker.']),
  pumpkin_lantern: F('dp-pulse', ['Boo!']),
  sparkler_jar: F('dp-twinkle',['Sparkly!']),
  butterflies: F('dp-flutter', ['They tickle.']),
  rainbow_arch:F('dp-pulse',   ['All the colours.']),
  paper_boat:  F('dp-sway',    ['Off it sails.']),
  moon_shell:  F('dp-pulse',   ['It hums if you listen.']),
  star_map:    F('dp-twinkle', ['That one is mine.']),
  pinboard:    F('dp-wiggle',  ['All my important things.']),
  map:         F('dp-flutter', ['X marks the spot!']),
  frame:       F('dp-wiggle',  ['That is a good picture.']),
  wall_planter:F('dp-sway',    ['Hanging about.']),
  spring_wreath: F('dp-turn',  ['It smells like spring.']),
  leaf_wreath: F('dp-turn',    ['Crunchy.']),
  stocking:    F('dp-sway',    ['Is there something in it?']),
  holiday_tree:F('dp-twinkle', ['Twinkly tree!']),
  candy_bucket:F('dp-wiggle',  ['Just one. Maybe two.']),
  egg_basket:  F('dp-wiggle',  ['Do not drop them!']),
  harvest_basket: F('dp-wiggle', ['Look at all this.']),
  cornucopia:  F('dp-wiggle',  ['It never runs out.']),
  tulip_pot:   F('dp-sway',    ['Spring is here.']),
  pebbles:     F('dp-wiggle',  ['This one is my favourite.']),
  little_tree: F('dp-sway',    ['Little tree, little leaves.']),
  blossom_lamp:F('dp-pulse',   ['Soft and pink.']),
  mushroom_stool: F('dp-squish', ['Boing.']),
  toadstool_lamp: F('dp-pulse', ['Glowy.']),
  floor_lamp:  F('dp-pulse',   ['Light on. Light off. Light on.']),
  beanbag:     F('dp-squish',  ['Squish!']),
  sprout_charm:F('dp-grow',    ['Grow, little one.']),
};

/* Nothing is silent. */
const PLAIN = ['dp-nudge', ['Hello, you.', 'I like this one.', 'You put this here!',
                            'This is my favourite thing. They are all my favourite thing.']];

/**
 * What tapping this item should do.
 * @param {string} itemId
 * @returns {{kind:'visit'|'fidget', pose?:string, item:string, lines:string[]}}
 */
export function playFor(itemId) {
  if (PLAYS[itemId]) return PLAYS[itemId];
  if (FIDGETS[itemId]) return FIDGETS[itemId];
  return { kind: 'fidget', item: PLAIN[0], lines: PLAIN[1] };
}

/** One of the lines, at random. */
export function lineFor(itemId) {
  const play = playFor(itemId);
  return play.lines[Math.floor(Math.random() * play.lines.length)];
}

/** Everything with an entry, for the tests to walk. */
export const KNOWN = { ...PLAYS, ...FIDGETS };
