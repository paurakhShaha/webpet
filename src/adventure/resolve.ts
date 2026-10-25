import type { ActiveAdventure, AdventureOutcome, AdventureResult, DropEntry, ItemStack, Season, Weather, WorldTime } from '@/types';
import { createRng, type Rng } from '@/utils/rng';
import { seasonAt, weatherAt, worldTimeAt } from '@/world/clock';
import { rollDiscoveries } from '@/world/explore';
import { ADVENTURE_CONFIG as A, RARITY_SORT } from './config';
import { scaleEnemy, simulateBattle, toFighter } from './combat';
import { getEnemy } from './enemies';
import { getItem } from './items';
import { getLocation } from './locations';

const HOUR = 3_600_000;

interface Moment { time: WorldTime; weather: Weather; season: Season }

/**
 * Seasonal drops only appear in their season, some only at certain times, and rain, fog, night and so on can make
 * a drop more likely. All of it is decided by the moment the fight happens, which is known from the trip record.
 */
function rollDrops(entries: DropEntry[], luck: number, bonus: number, rng: Rng, into: Map<string, number>, at: Moment) {
  for (const e of entries) {
    if (e.season && !e.season.includes(at.season)) continue;
    if (e.time && !e.time.includes(at.time)) continue;
    const mult = (e.boost?.weather?.[at.weather] ?? 1) * (e.boost?.time?.[at.time] ?? 1);
    if (rng.chance(Math.min(0.95, e.chance * bonus * mult * (1 + luck * A.luckDropBonus)))) {
      into.set(e.item, (into.get(e.item) ?? 0) + rng.int(e.qty[0], e.qty[1]));
    }
  }
}

/**
 * Plays out an adventure from its stored record. Pure and deterministic: the same record always gives the
 * same result, so it can be calculated whenever the player comes back, days later, in any browser session.
 *
 * Outcome depends on the pet's stats and level (frozen at departure), the location's difficulty, luck and the seed.
 * It is never a coin flip: a stronger pet wins far more often, but a weaker one can still get lucky.
 * The world matters too: night creatures come out at night, and weather, season and time change what's found.
 */
export function resolveAdventure(active: ActiveAdventure): AdventureResult {
  const loc = getLocation(active.locationId);
  const rng = createRng(active.seed);
  const { snapshot } = active;
  const hours = active.durationMs / HOUR;
  const wseed = active.world?.seed ?? 'world';
  const season = active.world?.season ?? seasonAt(active.startedAt);
  const momentAt = (ts: number): Moment => ({ time: worldTimeAt(ts), weather: weatherAt(wseed, ts, season), season });

  const planned = Math.max(1, Math.round(hours * A.battlesPerHour + rng.fork('count').float(-A.battleVariance, A.battleVariance)));
  const multiplier = snapshot.condition * snapshot.affinity;
  const pet = toFighter(snapshot.stats, multiplier);
  const maxHp = pet.hp;
  let hp = maxHp;
  let minHpFraction = 1;

  let xp = 0, gold = 0, won = 0;
  const counts: Record<string, number> = {};
  const drops = new Map<string, number>();
  let retreated = false;

  for (let n = 0; n < planned; n++) {
    const at = momentAt(active.startedAt + (active.durationMs * (n + 0.5)) / planned);
    const brng = rng.fork(`battle-${n}`);
    const pool = loc.enemyTypes.filter((e) => !e.time || e.time.includes(at.time));
    const enemyDef = getEnemy(brng.fork('pick').weighted(pool, (e) => e.weight).enemy);
    const result = simulateBattle({ ...pet, currentHp: hp }, scaleEnemy(enemyDef, loc.enemyPower), !!enemyDef.magical, brng.fork('fight'));
    if (!result.won) { retreated = true; break; }

    won++;
    counts[enemyDef.id] = (counts[enemyDef.id] ?? 0) + 1;
    xp += enemyDef.xp * loc.rewardTable.xpMultiplier * brng.fork('xp').float(0.9, 1.1);
    gold += enemyDef.gold * loc.rewardTable.goldMultiplier * brng.fork('gold').float(0.85, 1.15);
    rollDrops(loc.rewardTable.drops, snapshot.stats.luck, 1, brng.fork('drops'), drops, at);

    hp = Math.min(maxHp, result.petHp + maxHp * A.restHealFraction);
    if ((n + 1) % A.campEvery === 0) hp = Math.min(maxHp, hp + maxHp * A.campHealFraction);
    minHpFraction = Math.min(minHpFraction, result.petHp / maxHp);
  }

  const outcome: AdventureOutcome = retreated ? 'retreat' : minHpFraction >= A.triumphMinHp ? 'triumph' : 'success';
  const bonus = A.outcomeBonus[outcome];
  let foundTreasure = false;
  let discoveries: string[] = [];

  if (outcome === 'retreat') {
    // Not devastating: a little XP and gold, a few common materials, never rare treasure.
    xp = Math.max(A.retreat.minXp, Math.round(xp * A.retreat.rewardFraction));
    gold = Math.max(A.retreat.minGold, Math.round(gold * A.retreat.rewardFraction));
    for (const item of [...drops.keys()]) if (RARITY_SORT[getItem(item).rarity] > 0) drops.delete(item);
    if (drops.size === 0) {
      const consolation = loc.rewardTable.drops.find((d) => !d.season && !d.time && getItem(d.item).rarity === 'common');
      if (consolation) drops.set(consolation.item, 1);
    }
  } else {
    xp = Math.round(xp * bonus);
    gold = Math.round(gold * bonus);
    const trng = rng.fork('treasure');
    const treasure = new Map<string, number>();
    const rolls = Math.max(1, Math.floor(hours * A.treasureRollsPerHour));
    const end = momentAt(active.startedAt + active.durationMs / 2);
    for (let i = 0; i < rolls; i++) {
      rollDrops(loc.rewardTable.treasure, snapshot.stats.luck, outcome === 'triumph' ? A.triumphTreasureBonus : 1, trng.fork(`roll-${i}`), treasure, end);
    }
    foundTreasure = treasure.size > 0;
    for (const [item, qty] of treasure) drops.set(item, (drops.get(item) ?? 0) + qty);

    // Exploring: hidden places, rare resources, new faces. Only on trips that go well.
    discoveries = rollDiscoveries({
      loc, seed: active.seed,
      world: { seed: wseed, season, known: active.world?.known ?? [] },
      startedAt: active.startedAt, durationMs: active.durationMs, level: snapshot.level, luck: snapshot.stats.luck,
    });
  }

  const items: ItemStack[] = [...drops.entries()]
    .map(([item, qty]) => ({ item, qty }))
    .sort((a, b) => RARITY_SORT[getItem(a.item).rarity] - RARITY_SORT[getItem(b.item).rarity] || a.item.localeCompare(b.item));

  return {
    id: active.id,
    locationId: active.locationId,
    petId: active.petId,
    durationId: active.durationId,
    durationMs: active.durationMs,
    startedAt: active.startedAt,
    completedAt: active.expectedCompletion,
    outcome,
    battlesPlanned: planned,
    enemiesDefeated: won,
    enemyCounts: counts,
    xp: Math.round(xp),
    gold: Math.round(gold),
    items,
    hpRemaining: Math.max(0, hp / maxHp),
    foundTreasure,
    discoveries,
    startWorld: momentAt(active.startedAt),
  };
}
