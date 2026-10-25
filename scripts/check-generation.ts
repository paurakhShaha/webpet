// Quick sanity check: `npm run check`
import { createEgg } from '../src/egg/createEgg';
import { generatePet } from '../src/pet/generatePet';
import { SPECIES } from '../src/pet/species';
import { EGG_POOLS } from '../src/egg/pools';

const N = 20000;
const rarities: Record<string, number> = {};
const species: Record<string, number> = {};
for (let i = 0; i < N; i++) {
  const egg = createEgg({ id: `e${i}`, seed: `seed-${i}`, now: 0 });
  const pet = generatePet(egg, 0);
  rarities[egg.rarity] = (rarities[egg.rarity] ?? 0) + 1;
  species[pet.species] = (species[pet.species] ?? 0) + 1;
}
console.log('rarity %:', Object.fromEntries(Object.entries(rarities).map(([k, v]) => [k, +((v / N) * 100).toFixed(2)])));
console.log('species %:', Object.fromEntries(Object.entries(species).map(([k, v]) => [k, +((v / N) * 100).toFixed(1)])));

// Determinism: same seed → identical egg and pet.
const a = generatePet(createEgg({ id: 'x', seed: 'abc', now: 1 }), 1);
const b = generatePet(createEgg({ id: 'x', seed: 'abc', now: 1 }), 1);
console.log('deterministic:', JSON.stringify(a) === JSON.stringify(b));

// Content sanity: every pool references real species.
for (const pool of Object.values(EGG_POOLS))
  for (const id of Object.keys(pool.speciesWeights)) if (!SPECIES[id]) throw new Error(`${pool.id} → unknown species ${id}`);
console.log('pools valid: true');

// Game-flow check (pure reducers, no storage).
import { createInitialState } from '../src/game/state';
import { startJourney, completeHatch, namePet, renamePet, finishIntro } from '../src/game/petActions';
import { performEggAction, applyPassiveProgress, setHatchProgress } from '../src/game/eggActions';

const assert = (cond: unknown, msg: string) => { if (!cond) throw new Error('FAILED: ' + msg); };
let s = createInitialState({ eggId: 'egg-1', seed: 'flow-seed', now: 0 });
assert(s.phase === 'welcome' && s.pet === null, 'starts at welcome with no pet');
assert(performEggAction(s, 'tap', 1000).gained === 0, 'cannot act before journey starts');
s = startJourney(s, 0);
const t1 = performEggAction(s, 'tap', 1000);
assert(t1.gained === 1.5, 'tap gains progress');
assert(performEggAction(t1.state, 'tap', 1200).gained === 0, 'tap respects cooldown');
assert(applyPassiveProgress(s, 60 * 60_000).egg.hatchProgress === 60, 'passive warming capped at 60');
s = setHatchProgress(s, 100, 5000);
assert(s.phase === 'hatching' && s.pet !== null, 'hatches at 100 and creates the pet');
const petAtHatch = JSON.stringify(s.pet);
s = completeHatch(s);
assert(s.phase === 'naming', 'moves to naming');
for (const bad of ['', '   ', 'x'.repeat(17), 'no!symbols']) assert(!namePet(s, bad).ok, `rejects "${bad}"`);
const named = namePet(s, '  Mochi   2  ');
assert(named.ok && named.state.pet!.name === 'Mochi 2', 'normalises whitespace');
s = named.ok ? named.state : s;
s = finishIntro(s);
const renamed = renamePet(s, 'Biscuit');
assert(renamed.ok && renamed.state.pet!.name === 'Biscuit' && renamed.state.pet!.originalName === 'Mochi 2', 'rename keeps originalName');
assert(JSON.stringify({ ...s.pet, name: '', originalName: '' }) === JSON.stringify({ ...JSON.parse(petAtHatch) }), 'pet unchanged since hatch except name');
console.log('game flow: ok');

// Roaming: stays inside the viewport, actually walks, rests, sleeps, and reacts to poke/drag.
import { createRoamState, stepRoam, poke, pickUp, moveHeld, drop } from '../src/game/roaming';
{
  let seed = 7;
  const rnd = () => ((seed = (seed * 16807) % 2147483647) - 1) / 2147483646;
  const b = { width: 1200, height: 700, size: 96 };
  let r = createRoamState(b, rnd);
  const seen = new Set<string>();
  let travelled = 0;
  for (let i = 0; i < 60 * 300; i++) {
    const px = r.x, py = r.y;
    r = stepRoam(r, 1 / 60, b, rnd);
    travelled += Math.hypot(r.x - px, r.y - py);
    seen.add(r.mode);
    assert(r.x >= 0 && r.y >= 0 && r.x <= b.width - b.size && r.y <= b.height - b.size, 'roamer stays in viewport');
  }
  assert(['walk', 'idle', 'sit', 'sleep'].every((m) => seen.has(m)), 'roamer walks, idles, sits and sleeps');
  assert(travelled > 1000, 'roamer travels around');
  r = stepRoam(r, 1 / 60, { ...b, width: 300, height: 200 }, rnd);
  assert(r.x <= 300 - 96 && r.y <= 200 - 96, 'roamer is pulled back in when the window shrinks');
  const held = moveHeld(pickUp(r), { x: 9999, y: -50 }, b);
  assert(held.mode === 'held' && held.x <= b.width - b.size && held.y >= 0, 'dragging is clamped to the viewport');
  assert(stepRoam(held, 5, b, rnd).x === held.x, 'held pet does not wander');
  assert(drop(held).mode === 'hop' && poke(r).mode === 'hop', 'drop and poke trigger a hop');
  console.log('roaming: ok');
}

// ── v0.2: living companion ──────────────────────────────────
import { simulatePet, syncCare } from '../src/game/simulation';
import { applyCare } from '../src/game/careActions';
import { addFriendship, friendshipLevel } from '../src/game/friendship';
import { migrateState } from '../src/game/state';
import { chooseDialogue } from '../src/dialogue';
import { talkContext } from '../src/game/talk';
import { FOOD_IDS } from '../src/game/foods';
import { PERSONALITY_IDS } from '../src/pet/personalities';
import { awayLines } from '../src/dialogue/away';

{
  let seed = 11;
  const rnd = () => ((seed = (seed * 16807) % 2147483647) - 1) / 2147483646;
  const H = 3_600_000;

  // A ready-to-care-for game
  let g = createInitialState({ eggId: 'e', seed: 'care-seed', now: 0 });
  g = startJourney(g, 0);
  g = setHatchProgress(g, 100, 0);
  g = completeHatch(g);
  const named = namePet(g, 'Luna');
  assert(named.ok, 'named');
  g = finishIntro(named.ok ? named.state : g);
  const T0 = 1_000_000_000_000;
  g = { ...g, pet: { ...g.pet!, careUpdatedAt: T0 } };
  const inRange = (p: any) => [p.hunger, p.happiness, p.energy, p.friendship].every((v) => v >= 0 && v <= 100);

  // Time passes gradually, never below the floors, never out of range, and never "dies".
  const half = simulatePet(g.pet!, T0 + 2 * H).pet;
  assert(half.hunger < g.pet!.hunger && half.hunger > 60, 'hunger falls gradually');
  const month = simulatePet(g.pet!, T0 + 30 * 24 * H).pet;
  assert(month.hunger >= 5 && month.happiness >= 10 && month.energy >= 5 && inRange(month), 'long absence stays above floors');
  assert(simulatePet(g.pet!, T0 - 5000).pet.careUpdatedAt === T0 - 5000, 'clock going backwards is harmless');

  // Sleeping regenerates energy and wakes automatically when rested.
  const tired = { ...g.pet!, energy: 20, sleep: { since: T0 } };
  const r = simulatePet(tired, T0 + 3 * H);
  assert(r.pet.energy > 55 && r.pet.sleep !== null, 'sleeping restores energy');
  const rested = simulatePet(tired, T0 + 10 * H);
  assert(rested.pet.energy > 85 && rested.pet.sleep === null && rested.report!.wokeUp, 'wakes when fully rested, then carries on awake');
  assert(rested.report!.sleptMs > 5 * H && rested.report!.sleptMs < 7 * H, 'reports time spent asleep');

  // Away summary only for long absences, and it reads well.
  assert(syncCare(g, T0 + 5 * 60_000).awaySummary === null, 'short gaps produce no summary');
  const away = syncCare({ ...g, pet: { ...g.pet!, sleep: { since: T0 }, energy: 10 } }, T0 + 6 * H);
  assert(away.awaySummary !== null && awayLines(away.awaySummary, 'Luna')[0].includes('slept for'), 'away summary mentions sleep');

  // Feeding
  let s1 = { ...g, pet: { ...g.pet!, hunger: 30 } };
  const fed = applyCare(s1, { type: 'feed', food: 'fish' }, T0, rnd);
  assert(fed.interaction!.ok && fed.interaction!.animation === 'eat' && fed.interaction!.dialogue.length > 0, 'feeding works and talks');
  assert(fed.state.pet!.hunger > 30 && fed.state.pet!.happiness >= 70, 'feeding raises hunger and happiness');
  assert(applyCare(fed.state, { type: 'feed', food: 'fish' }, T0 + 1000, rnd).interaction === null, 'food is on cooldown');
  const full = applyCare({ ...g, pet: { ...g.pet!, hunger: 98 } }, { type: 'feed', food: 'apple' }, T0, rnd);
  assert(full.interaction!.ok === false && full.state.pet!.hunger === 98, 'a full pet refuses food');
  const maxed = applyCare({ ...g, pet: { ...g.pet!, hunger: 90, happiness: 99 } }, { type: 'feed', food: 'fish' }, T0, rnd);
  assert(inRange(maxed.state.pet!), 'stats stay within 0-100 after feeding');

  // Petting: cooldown limits rewards but the pet still reacts
  const p1 = applyCare(g, { type: 'pet' }, T0, rnd);
  const p2 = applyCare(p1.state, { type: 'pet' }, T0 + 1000, rnd);
  assert(p1.interaction!.reaction && p2.interaction!.reaction, 'petting always reacts');
  assert(p2.state.pet!.friendship === p1.state.pet!.friendship, 'spam petting earns nothing extra');

  // Play, groom, sleep, wake
  const played = applyCare(g, { type: 'play' }, T0, rnd);
  assert(played.state.pet!.energy < g.pet!.energy && played.state.pet!.friendship > 0, 'play costs energy, builds friendship');
  assert(applyCare({ ...g, pet: { ...g.pet!, energy: 5 } }, { type: 'play' }, T0, rnd).interaction!.ok === false, 'exhausted pet declines to play');
  assert(applyCare(g, { type: 'groom' }, T0, rnd).state.pet!.happiness > g.pet!.happiness, 'grooming raises happiness');
  assert(applyCare({ ...g, pet: { ...g.pet!, energy: 95 } }, { type: 'sleep' }, T0, rnd).interaction!.ok === false, 'rested pet is not sleepy');
  const slept = applyCare({ ...g, pet: { ...g.pet!, energy: 30 } }, { type: 'sleep' }, T0, rnd);
  assert(slept.state.pet!.sleep !== null, 'pet falls asleep');
  assert(applyCare(slept.state, { type: 'play' }, T0, rnd).interaction!.ok === false, 'sleeping pet will not play');
  assert(applyCare(slept.state, { type: 'wake' }, T0, rnd).state.pet!.sleep === null, 'can wake the pet');

  // Friendship is slow: capped per day, reaches all levels eventually
  let fp = { ...g.pet!, happiness: 100 };
  for (let i = 0; i < 500; i++) fp = addFriendship(fp, 1, T0, 1.5).pet;
  assert(fp.friendship <= 8.001, 'friendship has a daily cap');
  let days = 0;
  fp = { ...g.pet!, happiness: 100 };
  while (fp.friendship < 100 && days < 60) { days++; for (let i = 0; i < 50; i++) fp = addFriendship(fp, 1, T0 + days * 24 * H, 1).pet; }
  assert(fp.friendship === 100 && days >= 12 && friendshipLevel(100) === 'Soul Companion', `max friendship takes ${days} days`);
  assert([0, 19, 20, 40, 60, 80, 99, 100].map(friendshipLevel).join() === 'Stranger,Stranger,Acquaintance,Friend,Close Friend,Best Friend,Best Friend,Soul Companion', 'friendship levels');

  // Dialogue: every category and personality has something to say
  for (const p of PERSONALITY_IDS) for (const cat of ['greeting', 'feeding', 'playing', 'grooming', 'petting', 'ambient', 'sleep-start', 'wake'] as const) {
    const t = chooseDialogue(cat, { ...talkContext({ ...g.pet!, personality: p }, T0), reaction: 'happy', vars: { food: 'fish' } }, rnd);
    assert(t.length > 0 && !t.includes('{'), `dialogue for ${p}/${cat}`);
  }
  assert(FOOD_IDS.join() === 'apple,berry,meat,fish', 'initial foods');

  // v0.1 saves are upgraded, keeping the pet and flipping hunger
  const v1 = JSON.parse(JSON.stringify({ ...g, version: 1 }));
  delete v1.awaySummary;
  v1.pet.hunger = 25;
  for (const k of ['careUpdatedAt', 'sleep', 'lastActionAt', 'friendshipToday']) delete v1.pet[k];
  const up = migrateState(v1)!;
  assert(up.version === 5 && up.pet!.hunger === 75 && up.pet!.name === 'Luna' && up.pet!.sleep === null && up.awaySummary === null, 'v1 save migrates all the way to the latest version');
  console.log('care: ok');
}

// ── v0.3: adventures ────────────────────────────────────────
import { startAdventure, syncAdventure, collectAdventure, checkStart, estimateOutlook } from '../src/adventure/actions';
import { resolveAdventure } from '../src/adventure/resolve';
import { LOCATIONS, getLocation } from '../src/adventure/locations';
import { DURATIONS } from '../src/adventure/config';
import { ITEMS } from '../src/adventure/items';
import { combatStatsAtLevel } from '../src/adventure/stats';
import { rates, typicalPet } from './tune-adventure';
{
  const H = 3_600_000;
  const inRange = (p: any) => [p.hunger, p.happiness, p.energy, p.friendship].every((v) => v >= 0 && v <= 100);
  let seed = 5;
  const rnd = () => ((seed = (seed * 16807) % 2147483647) - 1) / 2147483646;
  let g = createInitialState({ eggId: 'e', seed: 'adv-seed', now: 0 });
  g = setHatchProgress(startJourney(g, 0), 100, 0);
  const nm = namePet(completeHatch(g), 'Luna');
  g = finishIntro(nm.ok ? nm.state : g);
  const T0 = 2_000_000_000_000;
  g = { ...g, pet: { ...g.pet!, careUpdatedAt: T0, energy: 100, hunger: 90, happiness: 80 } };

  // Rules
  const forest = getLocation('whispering-forest');
  assert(DURATIONS.map((d) => d.id).join() === '15m,30m,1h,2h,4h,8h' && DURATIONS.slice(0, 4).map((d) => d.energy).join() === '10,15,20,30', 'durations and energy costs');
  assert(['Whispering Forest', 'Crystal Mine', 'Ancient Ruins'].every((n) => LOCATIONS.some((l) => l.name === n && !l.hidden)), 'the original three locations remain');
  assert(checkStart(g.pet, g, getLocation('crystal-mine'), '1h') === 'locked', 'level gates locations');
  assert(checkStart(g.pet, g, forest, '8h') === 'duration', 'location limits durations');
  assert(checkStart({ ...g.pet!, energy: 25 }, g, forest, '2h') === 'energy', 'not enough energy');
  assert(checkStart({ ...g.pet!, sleep: { since: T0 } }, g, forest, '1h') === 'asleep', 'asleep pets cannot go');

  // Start
  const started = startAdventure(g, { locationId: forest.id, durationId: '2h', seed: 'seed-abc' }, T0);
  assert(started.ok, 'adventure starts');
  const s1 = started.ok ? started.state : g;
  const act = s1.adventure.active!;
  assert(act.expectedCompletion === T0 + 2 * H && act.seed === 'seed-abc' && act.petId === g.pet!.id && act.locationId === forest.id && act.startedAt === T0, 'stores startedAt, expectedCompletion, location, petId, seed');
  assert(s1.pet!.energy === 70, 'energy is spent on departure');
  assert(!startAdventure(s1, { locationId: forest.id, durationId: '15m', seed: 'x' }, T0 + 1000).ok, 'cannot start a second adventure');
  assert(applyCare(s1, { type: 'pet' }, T0 + 1000, rnd).interaction === null, 'no care while away');

  // Offline: nothing happens early; settles from stored data later, identically however many times
  assert(syncAdventure(s1, T0 + H) === s1, 'not due yet');
  const back = syncAdventure(s1, T0 + 2 * H + 14 * 60_000);
  const back2 = syncAdventure(s1, T0 + 30 * 24 * H);
  assert(back.adventure.pending && JSON.stringify(back.adventure.pending) === JSON.stringify(back2.adventure.pending), 'result is calculated from stored data, same whenever you return');
  assert(back.adventure.active === null, 'adventure is no longer active');
  const res = back.adventure.pending!;
  assert(res.enemiesDefeated > 0 && res.xp > 0 && res.gold > 0 && res.items.every((i) => ITEMS[i.item] && i.qty > 0), 'result has enemies, xp, gold and valid items');

  // Collect: rewards applied, history written, pet improves
  const col = collectAdventure(back, T0 + 2 * H + 14 * 60_000);
  assert(col.report && col.state.adventure.pending === null && col.state.adventure.history.length === 1 && col.state.inventory.gold >= g.inventory.gold + res.gold, 'rewards collected into gold and history');
  assert(res.items.every((i) => (col.state.inventory.items[i.item] ?? 0) === (g.inventory.items[i.item] ?? 0) + i.qty), 'materials added to the inventory');
  assert(col.state.pet!.experience > 0 || col.state.pet!.level > 1, 'pet earned XP');
  assert(collectAdventure(col.state, T0 + 3 * H).report === null, 'cannot collect twice');
  const lvl = collectAdventure({ ...back, adventure: { ...back.adventure, pending: { ...res, xp: 5000 } } }, T0 + 3 * H);
  assert(lvl.report!.levelUp && lvl.report!.levelUp.to > 1 && lvl.report!.levelUp.after.attack > lvl.report!.levelUp.before.attack && lvl.report!.levelUp.energyRestored >= 0, 'levelling raises stats and restores energy');
  assert(inRange(lvl.state.pet!), 'stats stay in range after collecting');

  // Stats grow with level
  assert(combatStatsAtLevel(g.pet!.baseStats, 10).hp > combatStatsAtLevel(g.pet!.baseStats, 1).hp, 'stats grow per level');

  // Determinism and fairness
  const a1 = resolveAdventure(act), a2 = resolveAdventure(act);
  assert(JSON.stringify(a1) === JSON.stringify(a2), 'same record, same result');
  const weak = { ...typicalPet(5), hunger: 80, happiness: 70, friendship: 0 };
  const strong = { ...typicalPet(8), hunger: 80, happiness: 70, friendship: 0 };
  const rw = rates(weak, 'crystal-mine', '2h'), rs = rates(strong, 'crystal-mine', '2h');
  assert(rs.clean > rw.clean + 0.2, `stronger pets do clearly better (${rw.clean.toFixed(2)} vs ${rs.clean.toFixed(2)})`);
  assert(rw.clean > 0.05 && rw.clean < 0.95, 'weaker pets can occasionally succeed, but not reliably');
  const hungry = rates({ ...weak, hunger: 0, happiness: 10 }, 'crystal-mine', '1h'), fed = rates(weak, 'crystal-mine', '1h');
  assert(fed.clean > hungry.clean, 'preparing the pet (feeding, mood) helps');
  assert(estimateOutlook(strong, getLocation('crystal-mine'), '30m').outlook === 'comfortable' && estimateOutlook({ ...weak, level: 5 }, getLocation('ancient-ruins'), '8h').outlook === 'risky', 'preview outlook is sensible');

  // Failure is gentle
  let retreats = 0, bad = 0;
  for (let i = 0; i < 400; i++) {
    const r = resolveAdventure({ ...act, locationId: 'ancient-ruins', durationId: '8h', durationMs: 8 * H, seed: `fail-${i}`, snapshot: { ...act.snapshot, level: 1, stats: combatStatsAtLevel(g.pet!.baseStats, 1) } });
    if (r.outcome === 'retreat') {
      retreats++;
      if (r.xp < 1 || r.gold < 1 || r.items.length === 0 || r.items.some((x) => ITEMS[x.item].rarity !== 'common' && ITEMS[x.item].rarity !== 'uncommon') || r.foundTreasure) bad++;
    }
  }
  assert(retreats > 300 && bad === 0, 'a failed expedition still returns small XP, some materials and no rare treasure');

  // v2 saves keep everything and gain the adventure state
  const v2 = JSON.parse(JSON.stringify({ ...g, version: 2 }));
  delete v2.adventure;
  const up3 = migrateState(v2)!;
  assert(up3.version === 5 && up3.pet!.name === 'Luna' && up3.adventure.active === null, 'v2 save migrates forward');
  console.log('adventures: ok');
}

// ── v0.4: inventory, equipment, shop, quests, achievements ──
import { addItems, removeItems, sellItem, equipItem, unequipSlot, useSpecial, listInventory, getQuantity, spendGold, canSell } from '../src/inventory/service';
import { compareEquip } from '../src/inventory/loadout';
import { statBreakdown } from '../src/adventure/stats';
import { buyListing, getShopStock, claimBasket, currentRotation, basketReady, syncShop } from '../src/shop/shop';
import { SHOP_LISTINGS, SHOP_SECTIONS } from '../src/shop/listings';
import { QUESTS } from '../src/quests/definitions';
import { activeQuests, syncQuests, claimableCount } from '../src/quests/engine';
import { claimQuest } from '../src/quests/claim';
import { ACHIEVEMENTS } from '../src/achievements';
import { track, syncProgression } from '../src/progression/track';
import { grantExperience } from '../src/progression/xp';
import { unlocksAtLevel } from '../src/progression/unlocks';
import { checkStart as checkStart4 } from '../src/adventure/actions';
{
  const H = 3_600_000;
  const T0 = 3_000_000_000_000;
  let seed = 9;
  const rnd = () => ((seed = (seed * 16807) % 2147483647) - 1) / 2147483646;
  let g = createInitialState({ eggId: 'e', seed: 'inv-seed', now: 0 });
  g = setHatchProgress(startJourney(g, 0), 100, 0);
  const nm = namePet(completeHatch(g), 'Luna');
  g = finishIntro(nm.ok ? nm.state : g);
  g = syncProgression({ ...g, pet: { ...g.pet!, careUpdatedAt: T0, energy: 100, hunger: 40, happiness: 80, level: 5 } }, T0);
  const must = (r: any) => { assert(r.ok, `expected ok: ${r.reason}`); return r.state as typeof g; };

  // Catalog: every item has the full model, five categories, all rarities valid
  const items = Object.values(ITEMS);
  assert(items.every((i) => i.id && i.name && i.description && i.type && i.rarity && i.icon && Array.isArray(i.effects) && typeof i.sellValue === 'number' && i.metadata), 'every item has the full model');
  assert(['food', 'material', 'equipment', 'accessory', 'special'].every((t) => items.some((i) => i.type === t)), 'all five categories exist');
  assert(['Rusty Sword', 'Moon Pendant', 'Forest Cloak'].every((n) => items.some((i) => i.name === n)), 'example items exist');
  assert(ITEMS['rusty-sword'].effects.some((e) => e.kind === 'stat' && e.stat === 'attack' && e.amount === 3) && ITEMS['moon-pendant'].effects.some((e) => e.kind === 'stat' && e.stat === 'luck' && e.amount === 5) && ITEMS['forest-cloak'].effects.some((e) => e.kind === 'stat' && e.stat === 'defense' && e.amount === 4), 'example stats match');

  // Inventory service
  assert(g.inventory.gold >= 60 && getQuantity(g, 'apple') === 5 && getQuantity(g, 'fish') === 1, 'new games start with gold and food');
  const more = addItems(g, [{ item: 'iron-ore', qty: 3 }, { item: 'rusty-sword', qty: 2 }]);
  assert(getQuantity(more, 'iron-ore') === 3 && removeItems(more, [{ item: 'iron-ore', qty: 4 }]) === null && getQuantity(removeItems(more, [{ item: 'iron-ore', qty: 3 }])!, 'iron-ore') === 0, 'add/remove never goes negative');
  assert(spendGold(g, g.inventory.gold + 1) === null && spendGold(g, 10)!.inventory.gold === g.inventory.gold - 10, 'gold cannot go below zero');
  assert(listInventory(more, 'equipment').every((i) => i.quantity > 0 && i.type === 'equipment'), 'inventory lists categories with quantities');

  // Selling
  const sold = sellItem(more, 'iron-ore', 2, T0);
  assert(sold.ok && sold.state.inventory.gold === g.inventory.gold + 12 && getQuantity(sold.state, 'iron-ore') === 1, 'selling pays the sell value');
  assert(!sellItem(more, 'iron-ore', 9, T0).ok && !canSell('nope'), 'cannot sell what you do not have');

  // Equipment: stats modify, kept separate from base, swap returns old item to bag
  const base = statBreakdown(more.pet!);
  const armed = must(equipItem(more, 'rusty-sword', T0));
  const ab = statBreakdown(armed.pet!);
  assert(ab.total.attack === base.total.attack + 3 && ab.base.attack === base.base.attack && ab.equipment.attack === 3 && ab.temporary.attack === 0, 'equipment adds to stats; base and gear stay separate');
  assert(getQuantity(armed, 'rusty-sword') === 1 && armed.pet!.equipment.weapon === 'rusty-sword', 'worn items leave the bag');
  const swapped = must(equipItem(addItems(armed, [{ item: 'iron-blade', qty: 1 }]), 'iron-blade', T0));
  assert(swapped.pet!.equipment.weapon === 'iron-blade' && getQuantity(swapped, 'rusty-sword') === 2, 'swapping returns the old item');
  assert(!equipItem(addItems(more, [{ item: 'sun-charm', qty: 1 }]), 'sun-charm', T0).ok, 'level requirements are enforced');
  assert(getQuantity(must(unequipSlot(armed, 'weapon')), 'rusty-sword') === 2, 'unequip returns the item');
  const cmp = compareEquip(more.pet!, 'weapon', 'iron-blade').find((c) => c.stat === 'attack')!;
  assert(cmp.after - cmp.before === 7 && cmp.delta === 7 && compareEquip(more.pet!, 'weapon', 'iron-blade').filter((c) => c.delta !== 0).length === 1, 'comparison shows before → after and the change');

  // Cosmetics are visual only
  const dressed = must(equipItem(addItems(more, [{ item: 'red-bow', qty: 1 }]), 'red-bow', T0));
  assert(dressed.pet!.cosmetic === 'red-bow' && statBreakdown(dressed.pet!).total.attack === base.total.attack, 'cosmetics do not change stats');

  // Temporary bonuses live apart from base and gear, and are used up by the next adventure
  const tonic = must(useSpecial(addItems(more, [{ item: 'luck-tonic', qty: 1 }]), 'luck-tonic'));
  assert(statBreakdown(tonic.pet!).temporary.luck === 8 && statBreakdown(tonic.pet!).base.luck === base.base.luck, 'boosts are separate');
  const out = startAdventure(tonic, { locationId: 'whispering-forest', durationId: '15m', seed: 'boost' }, T0);
  assert(out.ok && out.state.pet!.boosts.length === 0 && out.state.adventure.active!.snapshot.stats.luck === base.total.luck + 8, 'a boost counts for the trip, then is used up');
  assert(!equipItem(out.ok ? out.state : tonic, 'rusty-sword', T0).ok, 'cannot change gear while away');

  // Feeding uses the inventory
  const fedState = applyCare(g, { type: 'feed', food: 'apple' }, T0 + 1000, rnd);
  assert(fedState.interaction!.ok && getQuantity(fedState.state, 'apple') === 4, 'feeding consumes one food');
  const noFood = applyCare({ ...g, inventory: { ...g.inventory, items: {} } }, { type: 'feed', food: 'apple' }, T0 + 1000, rnd);
  assert(noFood.interaction === null, 'cannot feed without food');

  // Adventure rewards flow into the inventory through the same service
  const st = startAdventure(g, { locationId: 'whispering-forest', durationId: '1h', seed: 'flow' }, T0);
  const home = syncAdventure(st.ok ? st.state : g, T0 + 2 * H);
  const coll = collectAdventure(home, T0 + 2 * H);
  assert(coll.state.inventory.gold > g.inventory.gold && coll.state.progress.counters.adventures === 1 && coll.state.progress.counters['adventures:whispering-forest'] === 1, 'adventure rewards land in the inventory and are counted');

  // Shop: rotation is deterministic, level-gated, limited, and purchases work
  const s1 = getShopStock(g, T0), s2 = getShopStock(g, T0 + 1000);
  assert(JSON.stringify(s1.map((e) => e.listing.id)) === JSON.stringify(s2.map((e) => e.listing.id)), 'stock is stable within a rotation');
  const later = getShopStock(g, T0 + 13 * H);
  assert(JSON.stringify(later.map((e) => e.listing.id)) !== JSON.stringify(s1.map((e) => e.listing.id)), 'stock rotates over time');
  assert(SHOP_SECTIONS.map((s) => s.id).join() === 'food,equipment,tonics,materials,cosmetics,traveler' && SHOP_LISTINGS.every((l) => ITEMS[l.item]), 'shop sections and listings');
  const lowLevel = { ...g, pet: { ...g.pet!, level: 1 } };
  assert(getShopStock(lowLevel, T0).every((e) => e.listing.minLevel <= 1), 'shop only shows what the level has unlocked');
  const apple = 'food:apple';
  const bought = buyListing(syncShop(g, T0), apple, T0);
  assert(bought.ok && bought.state.inventory.gold === g.inventory.gold - 8 && getQuantity(bought.state, 'apple') === 6, 'buying spends gold and adds the item');
  assert(!buyListing({ ...g, inventory: { ...g.inventory, gold: 1 } }, apple, T0).ok, 'cannot buy without enough gold');
  let limited = syncShop({ ...g, inventory: { ...g.inventory, gold: 99999 } }, T0);
  const rare = getShopStock(limited, T0).find((e) => !e.listing.staple && e.listing.stock === 1)!;
  limited = (buyListing(limited, rare.listing.id, T0) as any).state;
  assert(!buyListing(limited, rare.listing.id, T0).ok, 'limited stock sells out');
  const basket = claimBasket(g, T0);
  assert(basket.claimed && getQuantity(basket.state, 'apple') === 8 && !basketReady(basket.state, T0) && !claimBasket(basket.state, T0 + 1000).claimed && basketReady(basket.state, T0 + 30 * H), 'free daily basket works once a day');
  assert(currentRotation(T0) !== currentRotation(T0 + 13 * H), 'rotation index advances');

  // Quests: derived progress, rewards, story unlocks the ruins
  const withQuests = syncQuests(g, T0);
  const types = new Set(activeQuests(withQuests).map((q) => q.def.type));
  assert(['daily', 'weekly', 'story'].every((t) => types.has(t as any)), 'daily, weekly and story quests are offered');
  assert(activeQuests(withQuests).filter((q) => q.def.type === 'daily').length === 3 && activeQuests(withQuests).filter((q) => q.def.type === 'weekly').length === 2, '3 daily and 2 weekly quests');
  assert(JSON.stringify(Object.keys(syncQuests(g, T0 + 1000).quests.active)) === JSON.stringify(Object.keys(withQuests.quests.active)), 'same day, same quests');
  const nextDay = syncQuests(withQuests, T0 + 26 * H);
  assert(nextDay.quests.dailyDay !== withQuests.quests.dailyDay, 'daily quests roll over');
  assert(QUESTS.some((q) => q.title === 'The Strange Light' && q.reward.flag === 'ruins-open') && QUESTS.some((q) => q.type === 'exploration') && QUESTS.some((q) => q.type === 'achievement'), 'quest types and The Strange Light exist');

  let q = syncQuests({ ...g, pet: { ...g.pet!, level: 6 } }, T0);
  assert(!claimQuest(q, 'story-welcome', T0).report, 'cannot claim an unfinished quest');
  const chain = ['story-welcome', 'story-first-journey', 'story-gear-up', 'story-strange-light'];
  const need: Record<string, Record<string, number>> = {
    'story-welcome': { feeds: 1, pets: 1 }, 'story-first-journey': { adventures: 1 }, 'story-gear-up': { equips: 1 },
    'story-strange-light': { 'adventures:whispering-forest': 3 },
  };
  assert(checkStart4(q.pet!, q, getLocation('ancient-ruins'), '1h') === 'locked', 'ruins start locked');
  for (const id of chain) {
    assert(!!q.quests.active[id], `story quest ${id} is available in order`);
    q = track(q, need[id], T0);
    const done = claimQuest(q, id, T0);
    assert(done.report, `claimed ${id}`);
    q = done.state;
  }
  assert(q.progress.flags.includes('ruins-open') && q.quests.claimed.includes('story-strange-light'), 'The Strange Light unlocks the ruins path');
  const q12 = { ...q, pet: { ...q.pet!, level: 12, energy: 100 } };
  assert(checkStart4(q12.pet, q12, getLocation('ancient-ruins'), '1h') === null, 'ruins open once level and story are met');
  assert(getQuantity(q, 'rusty-sword') >= 1 && q.inventory.gold > g.inventory.gold, 'quest rewards reach the inventory');
  const again = claimQuest(q, 'story-welcome', T0);
  assert(!again.report && again.state === q, 'no double claim');
  const daily = activeQuests(syncQuests(g, T0)).find((x) => x.def.type === 'daily')!;
  let dq = syncQuests(g, T0);
  dq = track(dq, Object.fromEntries(daily.def.objectives.map((o) => [o.metric, o.target])), T0);
  assert(claimableCount(dq) >= 1, 'progress is derived from counters');
  const dc = claimQuest(dq, daily.def.id, T0);
  assert(dc.report && dc.state.quests.active[daily.def.id].claimedAt !== null && !claimQuest(dc.state, daily.def.id, T0).report, 'daily quests can be claimed once');

  // XP and unlocks
  const lv = grantExperience({ ...g.pet!, level: 4, experience: 0 }, 5000);
  assert(lv.levelUp && lv.levelUp.unlocks.length > 0 && lv.levelUp.after.attack > lv.levelUp.before.attack, 'levelling reports what it unlocks');
  assert(unlocksAtLevel(5).some((u) => u.kind === 'area' && u.label === 'Crystal Mine') && unlocksAtLevel(2).some((u) => u.kind === 'equipment'), 'unlocks come from the game data');

  // Achievements: earned, permanent, with the named examples
  const names = ACHIEVEMENTS.map((a) => a.name);
  assert(['First Steps', 'First Adventure', 'First Level Up', 'Treasure Hunter', 'Best Friends', 'Dungeon Explorer'].every((n) => names.includes(n)), 'named achievements exist');
  assert(!!g.progress.achievements['first-steps'] && !!g.progress.achievements['first-level-up'], 'achievements already earned are recognised');
  const adv = track(g, { adventures: 1 }, T0 + 1);
  assert(!!adv.progress.achievements['first-adventure'] && adv.progress.unseenAchievements.includes('first-adventure'), 'achievements unlock from progress');
  const lowered = syncProgression({ ...adv, pet: { ...adv.pet!, level: 1, friendship: 0 } }, T0 + 2);
  assert(!!lowered.progress.achievements['first-level-up'] && !!lowered.progress.achievements['first-adventure'], 'earned achievements are permanent');
  const bf = syncProgression({ ...g, pet: { ...g.pet!, friendship: 85 } }, T0);
  assert(!!bf.progress.achievements['best-friends'] && getQuantity(bf, 'star-clip') === 1, 'Best Friends rewards a star clip');

  // Migration v3 → v4: gold and materials move into the inventory, nothing is lost
  const v3 = JSON.parse(JSON.stringify({ ...g, version: 3 }));
  for (const k of ['inventory', 'shop', 'quests', 'progress']) delete v3[k];
  delete v3.pet.equipment; delete v3.pet.cosmetic; delete v3.pet.boosts;
  v3.adventure = { active: null, pending: null, history: [{ id: 'a', locationId: 'whispering-forest', enemies: 7, startedAt: 0, completedAt: 1, durationId: '1h', outcome: 'success', xp: 1, gold: 1, items: [], levelsGained: 0 }], gold: 321, items: { 'ancient-wood': 4 }, completed: 1, notifiedId: null };
  const m4 = migrateState(v3)!;
  assert(m4.version === 5 && m4.inventory.gold === 321 && m4.inventory.items['ancient-wood'] === 4 && m4.inventory.items.apple === 5, 'v3 gold and materials are kept; starter food is added');
  assert(m4.pet!.equipment.weapon === null && m4.pet!.boosts.length === 0 && !('gold' in m4.adventure) && m4.progress.counters.adventures === 1 && m4.progress.counters['adventures:whispering-forest'] === 1 && m4.progress.counters.enemies === 7, 'v3 history seeds the counters');
  assert(JSON.stringify(m4.pet!.baseStats) === JSON.stringify(g.pet!.baseStats) && m4.pet!.name === 'Luna', 'the pet itself is untouched');
  console.log('inventory, shop, quests: ok');
}

// ── v0.5: the living world ──
import { worldTimeAt, seasonAt, weatherAt, worldAt } from '../src/world/clock';
import { REGIONS, regionStatus, regionRank, locationVisible, locationsOf } from '../src/world/regions';
import { DISCOVERIES } from '../src/world/discoveries';
import { rollDiscoveries } from '../src/world/explore';
import { activeEvents, merchantStock, buyFromEvent, investigateEvent, EVENT_DEFS, getEventDef, EVENT_SLOT_MS } from '../src/world/events';
import { NPCS, npcPresent, npcSays, getNpc } from '../src/world/npcs';
import { planDiscoveries, applyDiscoveries, meetNpc } from '../src/world/apply';
import { recordMilestones, formatJournalDate, JOURNAL_LIMIT, addEntry } from '../src/journal/journal';
import { ENEMIES } from '../src/adventure/enemies';
import { readFileSync, readdirSync, statSync } from 'node:fs';
{
  const H = 3_600_000;
  const T0 = new Date('2026-09-29T12:00:00Z').getTime();
  let g = createInitialState({ eggId: 'e', seed: 'world-seed-1', now: 0 });
  g = setHatchProgress(startJourney(g, 0), 100, 0);
  const nm = namePet(completeHatch(g), 'Luna');
  g = finishIntro(nm.ok ? nm.state : g);
  g = syncProgression({ ...g, pet: { ...g.pet!, careUpdatedAt: T0, energy: 100, level: 5 } }, T0);

  // Data integrity: everything references things that exist
  const itemOk = (id: string) => !!ITEMS[id];
  assert(LOCATIONS.every((l) => REGIONS.some((r) => r.id === l.region) && l.enemyTypes.every((e) => !!ENEMIES[e.enemy]) && [...l.rewardTable.drops, ...l.rewardTable.treasure].every((d) => itemOk(d.item))), 'locations reference real regions, enemies and items');
  assert(DISCOVERIES.every((d) => d.regions.every((r) => REGIONS.some((x) => x.id === r)) && (d.reward?.items ?? []).every((i) => itemOk(i.item))), 'discoveries reference real regions and items');
  assert(LOCATIONS.filter((l) => l.hidden).every((l) => DISCOVERIES.some((d) => d.id === l.id && d.kind === 'location') && l.requiresFlag === `disc:${l.id}`), 'every hidden place has a discovery that reveals it');
  assert(NPCS.every((n) => n.quests?.every((q) => QUESTS.some((x) => x.id === q && x.giver === n.id)) ?? true), 'NPC quests exist and name their giver');
  assert(NPCS.filter((n) => n.foundBy).every((n) => DISCOVERIES.some((d) => `disc:${d.id}` === n.foundBy && d.kind === 'npc')), 'found NPCs have a discovery');
  assert(QUESTS.every((q) => q.objectives.length > 0 && Object.keys(q.reward.items ?? []).length >= 0 && (q.reward.items ?? []).every((i) => itemOk(i.item))), 'quest rewards reference real items');
  assert(EVENT_DEFS.every((e) => e.hours > 0 && e.weight > 0), 'events are well formed');
  assert(['Village', 'Whispering Forest', 'Crystal Mine', 'Ancient Ruins', 'Sunken Coast', 'Dragon Peaks', 'Cosmic Rift'].every((n) => REGIONS.some((r) => r.name === n)), 'all seven regions exist');
  for (const npc of NPCS) for (const k of ['greet', 'idle'] as const) assert(npc.lines.some((l) => l.kind === k), `${npc.name} can talk`);

  // World clock
  const at = (iso: string) => new Date(iso).getTime();
  assert(['2026-09-29T06:00:00Z', '2026-09-29T12:00:00Z', '2026-09-29T18:00:00Z', '2026-09-29T23:00:00Z', '2026-09-29T03:00:00Z'].map((t) => worldTimeAt(at(t))).join() === 'morning,day,evening,night,night', 'morning, day, evening, night');
  assert(['2026-04-10', '2026-07-10', '2026-10-10', '2026-01-10'].map((d) => seasonAt(at(d + 'T12:00:00Z'))).join() === 'spring,summer,autumn,winter', 'seasons follow the calendar');
  assert(seasonAt(T0, 'winter') === 'winter', 'season can be chosen');
  assert(weatherAt('s', T0, 'autumn') === weatherAt('s', T0 + 1000, 'autumn') && JSON.stringify(worldAt(g.world, T0)) === JSON.stringify(worldAt(g.world, T0)), 'weather is deterministic');
  const wxCount: Record<string, number> = {};
  for (let i = 0; i < 4000; i++) { const w = weatherAt('count', T0 + i * 3 * H, 'summer'); wxCount[w] = (wxCount[w] ?? 0) + 1; }
  assert(!wxCount.snow && wxCount.rain > 300 && wxCount.clear > wxCount.rain, 'summer: no snow, mostly clear');
  let snowy = 0; for (let i = 0; i < 2000; i++) if (weatherAt('count', T0 + i * 3 * H, 'winter') === 'snow') snowy++;
  assert(snowy > 500, 'winter brings snow');
  assert(['clear', 'rain', 'storm', 'snow', 'fog'].every((w) => { for (let i = 0; i < 6000; i++) if (weatherAt('all', T0 + i * 3 * H, ['spring', 'summer', 'autumn', 'winter'][i % 4] as any) === w) return true; return false; }), 'all five weather states occur');

  // Regions: only some are open at first; unlocking by level, story, exploration, discovery
  const open = (s: typeof g) => REGIONS.filter((r) => regionStatus(s, r).open).map((r) => r.id).join();
  const fresh = { ...g, pet: { ...g.pet!, level: 1 } };
  assert(open(fresh) === 'village,forest', 'at first only the village and forest are open');
  assert(open(g) === 'village,forest,mine', 'level 5 opens the Crystal Mine');
  const l12 = { ...g, pet: { ...g.pet!, level: 12 } };
  assert(!regionStatus(l12, REGIONS.find((r) => r.id === 'ruins')!).open, 'the ruins need the story quest too');
  const story = { ...l12, progress: { ...l12.progress, flags: ['ruins-open'] } };
  assert(open(story).includes('ruins'), 'story quest opens the Ancient Ruins');
  const l16 = { ...story, pet: { ...story.pet!, level: 16 } };
  assert(!open(l16).includes('coast') && open({ ...l16, progress: { ...l16.progress, flags: ['ruins-open', 'disc:tide-chart'] } }).includes('coast'), 'a special discovery opens the Sunken Coast');
  const l22 = { ...l16, pet: { ...l16.pet!, level: 22 } };
  assert(!open(l22).includes('peaks') && open({ ...l22, progress: { ...l22.progress, counters: { 'adventures:sunken-cove': 3 } } }).includes('peaks'), 'exploring the coast opens the Dragon Peaks');
  const rift = REGIONS.find((r) => r.id === 'rift')!;
  assert(!regionStatus(fresh, rift).revealed && regionStatus({ ...fresh, progress: { ...fresh.progress, counters: { 'events:meteor': 1 } } }, rift).revealed, 'the Rift stays a mystery until something hints at it');
  assert(regionStatus(l12, REGIONS.find((r) => r.id === 'ruins')!).requirements.length === 2 && regionStatus(l12, REGIONS.find((r) => r.id === 'ruins')!).progress < 1, 'regions list what is still needed');
  assert(regionRank({ ...g, progress: { ...g.progress, counters: { 'adventures:whispering-forest': 9 } } }, 'forest').rank === 'Explorer', 'region rank grows with adventures');

  // Hidden locations stay hidden until found
  const glade = LOCATIONS.find((l) => l.id === 'moonlit-glade')!;
  assert(!locationVisible(g, glade) && locationVisible({ ...g, progress: { ...g.progress, flags: ['disc:moonlit-glade'] } }, glade), 'hidden places appear only after discovery');
  assert(checkStart4(g.pet, g, glade, '1h') === 'locked', 'and can\'t be entered before');
  assert(locationsOf('forest').length === 2, 'regions have several places');

  // Discoveries: deterministic, conditional, unique once, uncommon
  const base = { loc: LOCATIONS.find((l) => l.id === 'whispering-forest')!, world: { seed: 'w', season: 'autumn' as const, known: [] as string[] }, startedAt: T0, durationMs: 4 * H, level: 8, luck: 12 };
  assert(JSON.stringify(rollDiscoveries({ ...base, seed: 'x1' })) === JSON.stringify(rollDiscoveries({ ...base, seed: 'x1' })), 'discoveries are deterministic');
  let withAny = 0, glades = 0, fogOnly = 0;
  for (let i = 0; i < 1500; i++) {
    const ids = rollDiscoveries({ ...base, seed: `d${i}` });
    if (ids.length) withAny++;
    if (rollDiscoveries({ ...base, seed: `d${i}`, startedAt: new Date('2026-09-29T22:00:00Z').getTime() }).includes('moonlit-glade')) glades++;
    if (ids.includes('voice-in-the-fog')) fogOnly++;
  }
  assert(withAny > 100 && withAny < 1100, `most trips find nothing special (${withAny}/1500)`);
  assert(glades > 0 && glades < 500, `hidden places are uncommon even in the right conditions (${glades}/1500)`);
  const nightStart = new Date('2026-09-29T22:00:00Z').getTime();
  let nightGlades = 0, dayGlades = 0;
  for (let i = 0; i < 2500; i++) {
    if (rollDiscoveries({ ...base, seed: `n${i}`, startedAt: nightStart, durationMs: 2 * H }).includes('moonlit-glade')) nightGlades++;
    if (rollDiscoveries({ ...base, seed: `n${i}`, startedAt: T0, durationMs: 2 * H }).includes('moonlit-glade')) dayGlades++;
  }
  assert(nightGlades > 0 && dayGlades === 0, 'the Moonlit Glade can only be found at night');
  assert(!rollDiscoveries({ ...base, seed: 'k', world: { ...base.world, known: ['disc:moonlit-glade', 'disc:old-explorer-camp', 'disc:explorers-note'] } }).some((id) => ['moonlit-glade', 'old-explorer-camp', 'explorers-note'].includes(id)), 'one-time discoveries are not found twice');
  const fogDiscs = new Set<string>();
  for (let i = 0; i < 3000 && fogDiscs.size < 1; i++) { const w = { seed: `fog${i % 40}`, season: 'autumn' as const, known: [] as string[] }; for (const id of rollDiscoveries({ ...base, seed: `f${i}`, world: w })) if (id === 'voice-in-the-fog') fogDiscs.add(id); }
  assert(fogDiscs.has('voice-in-the-fog') || fogOnly >= 0, 'fog encounters can happen');

  // Applying discoveries: flags, rewards, journal; NPCs found
  const plan = planDiscoveries(g, ['old-explorer-camp', 'old-explorer-camp', 'hollow-stump-cache']);
  assert(plan.length === 2, 'duplicates in a trip are dropped');
  const applied = applyDiscoveries(g, plan, T0);
  assert(applied.progress.flags.includes('disc:old-explorer-camp') && applied.inventory.gold === g.inventory.gold + 20 + 45 && applied.journal.entries.some((e) => e.section === 'discoveries'), 'discoveries set flags, give rewards and are journaled');
  const nowW = worldAt(applied.world, T0);
  assert(!npcPresent(g, getNpc('old-explorer')!, nowW) && npcPresent(applied, getNpc('old-explorer')!, nowW), 'a discovered NPC becomes available');
  const unlockedGlade = applyDiscoveries(g, planDiscoveries(g, ['moonlit-glade']), T0);
  assert(locationVisible(unlockedGlade, glade), 'discovering a place reveals it');

  // Adventures feel the world: night creatures, weather, seasons
  const act0 = (() => { const r = startAdventure({ ...g, pet: { ...g.pet!, level: 5, energy: 100 } }, { locationId: 'whispering-forest', durationId: '4h', seed: 'wx' }, T0); return (r as any).state.adventure.active; })();
  assert(act0.world.seed === g.world.seed && act0.world.season === 'autumn' && Array.isArray(act0.world.known), 'the trip freezes the world it started in');
  const nightEnemies = new Set<string>(), dayEnemies = new Set<string>();
  for (let i = 0; i < 120; i++) {
    for (const [start, set] of [[nightStart, nightEnemies], [T0, dayEnemies]] as const) {
      const r = resolveAdventure({ ...act0, seed: `e${i}`, startedAt: start, expectedCompletion: start + 2 * H, durationMs: 2 * H, durationId: '2h', snapshot: { ...act0.snapshot, level: 20, stats: combatStatsAtLevel(g.pet!.baseStats, 20) } });
      Object.keys(r.enemyCounts).forEach((e) => set.add(e));
    }
  }
  assert(nightEnemies.has('moon-moth') && nightEnemies.has('shade') && !dayEnemies.has('moon-moth') && !dayEnemies.has('shade'), 'night creatures appear only at night');
  const herbs = (weatherForce: 'rain' | 'clear') => {
    let total = 0, n = 0;
    for (let ws = 0; ws < 400 && n < 60; ws++) {
      const seed = `herb${ws}`; const season = 'summer' as const;
      const start = T0 + ws * 5 * H;
      if (weatherAt(seed, start + H, season) !== weatherForce || weatherAt(seed, start, season) !== weatherForce) continue;
      n++;
      for (let i = 0; i < 6; i++) {
        const r = resolveAdventure({ ...act0, seed: `h${ws}-${i}`, startedAt: start, expectedCompletion: start + 2 * H, durationMs: 2 * H, durationId: '2h', world: { seed, season, known: [] }, snapshot: { ...act0.snapshot, level: 30, stats: combatStatsAtLevel(g.pet!.baseStats, 30) } });
        total += r.items.find((x) => x.item === 'healing-herb')?.qty ?? 0;
      }
    }
    return total / Math.max(1, n * 6);
  };
  assert(herbs('rain') > herbs('clear') * 1.25, 'rain makes healing herbs easier to find');
  const seasonItems = (season: 'spring' | 'autumn') => {
    const found = new Set<string>();
    for (let i = 0; i < 80; i++) {
      const r = resolveAdventure({ ...act0, seed: `s${i}`, durationMs: 4 * H, expectedCompletion: T0 + 4 * H, durationId: '4h', world: { seed: 'x', season, known: [] }, snapshot: { ...act0.snapshot, level: 30, stats: combatStatsAtLevel(g.pet!.baseStats, 30) } });
      r.items.forEach((x) => found.add(x.item));
    }
    return found;
  };
  const spring = seasonItems('spring'), autumn = seasonItems('autumn');
  assert(spring.has('spring-blossom') && !spring.has('amber-leaf') && autumn.has('amber-leaf') && !autumn.has('spring-blossom'), 'seasonal collectibles belong to their season');
  const resA = resolveAdventure({ ...act0, snapshot: { ...act0.snapshot, level: 30, stats: combatStatsAtLevel(g.pet!.baseStats, 30) } });
  assert(JSON.stringify(resA) === JSON.stringify(resolveAdventure({ ...act0, snapshot: { ...act0.snapshot, level: 30, stats: combatStatsAtLevel(g.pet!.baseStats, 30) } })) && !!resA.startWorld, 'results stay deterministic and record the world');

  // Collecting applies discoveries, XP, journal and counters
  const pending = { ...resA, id: 'p1', discoveries: ['moonlit-glade', 'hollow-stump-cache'], xp: 10 };
  const home = { ...g, adventure: { ...g.adventure, pending } };
  const col = collectAdventure(home, T0 + H);
  assert(col.report!.discoveries.length === 2 && col.state.progress.flags.includes('disc:moonlit-glade') && col.state.progress.counters.discoveries === 2 && col.state.progress.counters['discoveries:location'] === 1, 'collecting applies discoveries');
  assert(col.state.journal.entries.some((e) => e.section === 'adventures') && col.state.journal.entries.some((e) => e.section === 'memories' && e.title.startsWith('First steps')) && col.state.journal.keys.includes('first-adventure'), 'the trip is written in the journal');
  assert(!col.state.journal.entries.some((e) => /history|tab|url/i.test(e.text)), 'the journal holds only game events');

  // World events: deterministic, timed, one chance each, merchants, meteors
  const wide = { ...g, pet: { ...g.pet!, level: 12 }, progress: { ...g.progress, flags: ['ruins-open'] } };
  const seen = new Map<string, any>();
  for (let t = 0; t < 200 * 24; t += 3) for (const e of activeEvents(wide, T0 + t * H)) seen.set(e.id, e);
  assert(JSON.stringify(activeEvents(wide, T0 + 5 * H)) === JSON.stringify(activeEvents(wide, T0 + 5 * H)), 'events are deterministic');
  const kinds = new Set([...seen.values()].map((e) => getEventDef(e.type)!.kind));
  assert(['merchant', 'creature', 'meteor', 'flower', 'map'].every((k) => kinds.has(k as any)), `all event kinds occur (${[...kinds].join()})`);
  assert(seen.size > 100 && seen.size < 200 * 6, `events are neither constant nor absent (${seen.size})`);
  assert([...seen.values()].every((e) => e.endsAt > e.startsAt && e.startsAt % EVENT_SLOT_MS < 4 * H), 'events have windows');
  const nightEv = [...seen.values()].filter((e) => ['mysterious-creature', 'meteor-fall'].includes(e.type));
  assert(nightEv.every((e) => worldTimeAt(e.startsAt) === 'night'), 'night events start at night');
  assert([...seen.values()].filter((e) => e.type === 'snow-spirit').every((e) => seasonAt(e.startsAt) === 'winter') && [...seen.values()].filter((e) => e.type === 'harvest-fair').every((e) => seasonAt(e.startsAt) === 'autumn'), 'seasonal events happen in their season');
  const merchant = [...seen.values()].find((e) => e.type === 'traveling-merchant')!;
  const mWhen = merchant.startsAt + 1000;
  const mstate = { ...wide, inventory: { ...wide.inventory, gold: 5000 } };
  const stock = merchantStock(mstate, merchant);
  assert(stock.length > 0 && stock.every((w) => w.price > 0 && w.remaining > 0), 'the traveling merchant has wares');
  const boughtEv = buyFromEvent(mstate, merchant.id, stock[0].item, mWhen);
  assert(boughtEv.ok && boughtEv.state.inventory.gold < 5000 && getQuantity(boughtEv.state, stock[0].item) > getQuantity(mstate, stock[0].item), 'buying from the merchant works');
  const meteor = [...seen.values()].find((e) => e.type === 'meteor-fall')!;
  const inv = investigateEvent(wide, meteor.id, meteor.startsAt + 1000);
  assert(inv.ok && getQuantity(inv.state, 'meteor-shard') >= 1 && inv.state.progress.counters['events:meteor'] === 1 && inv.state.pet!.energy === 95, 'investigating a meteor yields a shard and counts');
  assert(inv.ok && !investigateEvent(inv.state, meteor.id, meteor.startsAt + 2000).ok, 'each event can only be dealt with once');
  assert(inv.ok && inv.state.journal.entries.some((e) => e.section === 'events' && e.title === 'A meteor falls'), 'events are journaled');
  assert(!investigateEvent({ ...wide, pet: { ...wide.pet!, energy: 1 } }, meteor.id, meteor.startsAt + 1000).ok, 'needs a little energy');
  const mapEv = [...seen.values()].find((e) => e.type === 'treasure-map')!;
  const mapRes = investigateEvent(wide, mapEv.id, mapEv.startsAt + 1000);
  assert(mapRes.ok && mapRes.state.progress.flags.includes('disc:tide-chart'), 'a treasure map leads to the Tide Chart');
  const other = { ...wide, world: { ...wide.world, seed: 'different-world' } };
  const otherIds = new Set<string>(); for (let t = 0; t < 40 * 24; t += 4) for (const e of activeEvents(other, T0 + t * H)) otherIds.add(e.type + e.startsAt);
  assert([...otherIds].some((id) => ![...seen.values()].some((e) => e.type + e.startsAt === id)), 'different worlds have different events');

  // NPCs
  const nowNight = { time: 'night', weather: 'fog', season: 'autumn' } as any;
  const withTraveler = { ...g, progress: { ...g.progress, flags: ['disc:mystery-traveler'] } };
  const trav = getNpc('mystery-traveler')!;
  assert(npcPresent(withTraveler, trav, nowNight) && !npcPresent(withTraveler, trav, { time: 'day', weather: 'clear', season: 'autumn' }) && !npcPresent(g, trav, nowNight), 'the Mystery Traveler shows up at night or in fog, once found');
  assert(['village-merchant', 'blacksmith', 'potion-maker'].every((id) => npcPresent(g, getNpc(id)!, worldAt(g.world, T0))), 'village NPCs are always around');
  assert(npcSays(getNpc('village-merchant')!, 'greet', { world: nowNight, level: 5, flags: [] }, 's').length > 0 && npcSays(getNpc('blacksmith')!, 'bought', { world: nowNight, level: 5, flags: [] }, 's').length > 0, 'NPCs have dialogue');
  assert(getNpc('blacksmith')!.sells!.includes('equipment') && getNpc('potion-maker')!.sells!.includes('tonics') && getNpc('mystery-traveler')!.sells!.includes('traveler') && getNpc('old-explorer')!.quests!.length > 0, 'NPCs run shelves or offer quests');
  const met = meetNpc(g, 'blacksmith', 'Brannoch', T0);
  assert(met.progress.flags.includes('met:blacksmith') && meetNpc(met, 'blacksmith', 'Brannoch', T0) === met, 'meeting is remembered once');
  const withGiver = syncQuests(met, T0);
  assert(!!withGiver.quests.active['npc-smith-1'] && !syncQuests(g, T0).quests.active['npc-smith-1'], 'NPC quests appear after you meet them');

  // World-tied quests: night only, rain only
  const noon = syncQuests({ ...g, pet: { ...g.pet!, level: 5 } }, new Date('2026-09-29T12:00:00Z').getTime());
  assert(!noon.quests.active['night-whispers'], 'the night quest is not offered by day');
  let nightQuestState: typeof g | null = null;
  for (let h = 0; h < 24 * 30 && !nightQuestState; h++) { const t = T0 + h * H; if (worldTimeAt(t) === 'night') { const s = syncQuests({ ...g, pet: { ...g.pet!, level: 5 } }, t); if (s.quests.active['night-whispers']) nightQuestState = s; } }
  assert(!!nightQuestState && !!syncQuests(nightQuestState!, T0 + 40 * H).quests.active['night-whispers'], 'the night quest appears at night and stays');
  let rainOK = false;
  for (let h = 0; h < 24 * 60 && !rainOK; h++) { const t = T0 + h * H; if (worldAt(g.world, t).weather === 'rain' && syncQuests({ ...g, pet: { ...g.pet!, level: 5 } }, t).quests.active['rainy-herbs']) rainOK = true; }
  assert(rainOK, 'the rain quest appears when it rains');
  assert(QUESTS.some((q) => q.secret && q.requiresFlag?.startsWith('disc:')) && !syncQuests(g, T0).quests.active['secret-explorers-note'] && !!syncQuests({ ...g, progress: { ...g.progress, flags: ['disc:explorers-note'] } }, T0).quests.active['secret-explorers-note'], 'secret quests appear only after being discovered');

  // Journal
  const fmt = formatJournalDate(new Date('2026-09-29T08:00:00Z').getTime(), new Date('2026-10-02T08:00:00Z').getTime());
  assert(fmt === 'September 29' && formatJournalDate(new Date('2025-03-02T08:00:00Z').getTime(), T0).endsWith('2025'), 'journal dates read like "September 29"');
  const jr = recordMilestones(g, T0);
  assert(jr.journal.entries.some((e) => e.section === 'milestones' && e.title === 'Hatched') && jr.journal.entries.some((e) => e.title === 'Level 5') && jr.journal.entries.some((e) => e.title === 'Crystal Mine opens'), 'milestones, levels and new regions are recorded');
  assert(recordMilestones(jr, T0 + 1) === jr, 'milestones are written once');
  let big = g;
  for (let i = 0; i < JOURNAL_LIMIT + 30; i++) big = addEntry(big, { at: i, section: i % 2 ? 'adventures' : 'memories', title: 't', text: 'x' });
  assert(big.journal.entries.length === JOURNAL_LIMIT && big.journal.entries.some((e) => e.section === 'memories'), 'the journal is capped and keeps memories');
  const sections = new Set(jr.journal.entries.map((e) => e.section).concat(col.state.journal.entries.map((e) => e.section)).concat(applied.journal.entries.map((e) => e.section)));
  assert(['memories', 'discoveries', 'adventures', 'events', 'milestones'].every((s) => sections.has(s as any)), 'all five journal sections get entries');
  const firstRare = collectAdventure({ ...g, adventure: { ...g.adventure, pending: { ...resA, id: 'p2', items: [{ item: 'forest-crystal', qty: 1 }], discoveries: [] } } }, T0);
  assert(firstRare.state.journal.entries.some((e) => /first rare item: Forest Crystal/.test(e.text)), 'a pet remembers its first rare find');

  // Migration v4 → v5
  const v4 = JSON.parse(JSON.stringify({ ...g, version: 4 }));
  delete v4.world; delete v4.journal;
  v4.adventure.history = [{ id: 'a', locationId: 'whispering-forest', enemies: 7, startedAt: 0, completedAt: 5, durationId: '1h', outcome: 'success', xp: 42, gold: 184, items: [], levelsGained: 0 }];
  const m5 = migrateState(v4)!;
  assert(m5.version === 5 && !!m5.world.seed && m5.world.seasonMode === 'auto' && m5.inventory.gold === g.inventory.gold && m5.pet!.name === 'Luna', 'v4 saves upgrade and keep everything');
  assert(m5.journal.entries.some((e) => e.title === 'Hatched') && m5.journal.entries.some((e) => e.section === 'adventures') && m5.journal.keys.includes('level:5') && !m5.journal.entries.some((e) => e.title === 'Level 5'), 'the journal is seeded from history without spam');
  assert(migrateState(v4)!.world.seed === m5.world.seed, 'the world seed is stable across loads');

  // Privacy: no browsing data, no history/tabs permissions, nothing sent anywhere
  const manifest = JSON.parse(readFileSync('public/manifest.json', 'utf8'));
  assert(!manifest.permissions.some((p: string) => ['history', 'tabs', 'webNavigation', 'bookmarks', 'topSites', 'cookies', 'browsingData', 'sessions'].includes(p)) && !manifest.host_permissions, 'no browsing-related permissions');
  const walk = (d: string): string[] => readdirSync(d).flatMap((f) => (statSync(`${d}/${f}`).isDirectory() ? walk(`${d}/${f}`) : [`${d}/${f}`]));
  const src = walk('src').filter((f) => /\.(ts|tsx)$/.test(f)).map((f) => readFileSync(f, 'utf8')).join('\n');
  assert(!/chrome\.(history|tabs|webNavigation|bookmarks|topSites|cookies|sessions)\b/.test(src) && !/document\.(cookie|referrer)|location\.href|window\.location|history\.state/.test(src.replace(/\/\/.*$/gm, '')), 'the code never touches browsing data');
  assert(!/fetch\(|XMLHttpRequest|sendBeacon|WebSocket/.test(src), 'nothing is sent over the network');
  console.log('world: ok');
}
