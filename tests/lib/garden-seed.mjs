/* Seed a save with the gate open and a garden worth looking at. */
export const SEED = opts => {
  const now = Date.now();
  const { words = 22, garden = {}, season } = opts;
  localStorage.clear();
  localStorage.setItem('spelling-adventure:v1', JSON.stringify({
    schemaVersion: 1, createdAt: now,
    child: { name: 'T', petCoat: 'peach', petName: 'Axo', setupComplete: true },
    lists: [{ id: 'l1', name: 'W', week: '', description: '', archived: false, createdAt: now }],
    /* `words` of them already mastered, so the gate is open. */
    words: Array.from({ length: words + 4 }, (_, i) => ({
      id: 'w' + i, listId: 'l1', text: 'word' + i, definition: '', sentence: '', hint: '',
      /* Only the first `words` of them are mastered — the streak has to be
         zero on the rest, or a word with three credits counts as mastered
         whatever masteredAt says and the count comes out wrong. */
      tags: [], attempts: 3, correctCount: i < words ? 3 : 1, incorrectCount: 0,
      streak: i < words ? 3 : 0,
      lastCreditDay: null, lastDailyDay: null, recent: [], firstSeen: now, lastSeen: now,
      lastCorrect: now, lastMissed: null,
      masteredAt: i < words ? now : null, createdAt: now })),
    progress: { stars: 3000, lastBackupAt: now, lastBackupMastered: 0, milestonesEarned: [] },
    equipped: {
      wallpaper: 'wall_plain', flooring: 'floor_wood', window: 'window_cottage',
      door: 'door_wood', bed: 'bed_cozy', rug: 'rug', hat: null, accessory: null,
      wallDecor: ['frame'], floorDecor: ['potted_plant'],
      sky: 'sky_day', ground: 'ground_grass', tree: 'tree_apple',
      water: 'pond_small', fence: 'fence_picket',
      gardenDecor: ['birdhouse', 'mushrooms', 'garden_bench'],
      ...garden,
    },
    collection: { items: ['window_cottage','door_wood','bed_cozy','rug','frame','potted_plant',
      'sky_day','sky_sunset','sky_night','sky_rainbow','ground_grass','ground_sand','ground_path',
      'ground_meadow','tree_apple','tree_pine','tree_blossom','tree_willow','pond_small','pond_lily',
      'pond_stars','fence_picket','fence_hedge','fence_stone','birdhouse','mushrooms','garden_bench',
      'flower_bed','wheelbarrow','lamp_post','rope_swing','stepping_stones']
      .map((id, i) => ({ id: 'o' + i, itemId: id, source: 'test', earnedAt: now })) } }));
};
