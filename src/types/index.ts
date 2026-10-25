// ─────────────────────────────────────────────────────────────
// Shared domain types. No runtime code lives here.
// Closed sets (rarity, element, personality…) are unions so config
// files are checked for completeness. Open sets (species, egg pools)
// are plain strings so new content is added purely through config.
// ─────────────────────────────────────────────────────────────

export type Rarity = 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary' | 'mythic';
export type ElementId = 'fire' | 'water' | 'earth' | 'wind' | 'light' | 'shadow' | 'nature';
export type PersonalityId =
  | 'brave' | 'curious' | 'playful' | 'shy' | 'lazy' | 'mischievous' | 'kind' | 'adventurous';
export type SpeciesId = string;
export type EggPoolId = string;
export type TraitId = string;

export type StatKey = 'vitality' | 'strength' | 'agility' | 'intellect' | 'charm';
export type BaseStats = Record<StatKey, number>;

// ── Appearance ───────────────────────────────────────────────
export type BodyShape = 'round' | 'plump' | 'slim' | 'blob';
export type EyeStyle = 'round' | 'sleepy' | 'sparkle' | 'sharp';
export type EarStyle = 'pointed' | 'tall' | 'round' | 'long' | 'floppy' | 'none';
export type TailStyle = 'bushy' | 'thin' | 'curled' | 'puff' | 'none';
export type MarkingStyle = 'none' | 'blaze' | 'spots' | 'stripes' | 'star' | 'socks' | 'freckles';

export interface Palette {
  name: string;
  primary: string;
  secondary: string;
  marking: string;
}

export interface PetAppearance {
  body: BodyShape;
  eyes: EyeStyle;
  ears: EarStyle;
  tail: TailStyle;
  primaryColor: string;
  secondaryColor: string;
  markings: MarkingStyle;
  markingColor: string;
  paletteName: string;
}

// ── Egg ──────────────────────────────────────────────────────
export type EggAction = 'tap' | 'observe' | 'incubate' | 'wait';

/** Decided when the egg is laid, revealed only through the pet it becomes. */
export interface HiddenTraits {
  elementAffinity: ElementId;
  personalityLean: PersonalityId;
  statBias: StatKey;
  /** 0..1 — how much the shell shimmers. */
  luster: number;
}

export interface Egg {
  id: string;
  createdAt: number;
  rarity: Rarity;
  speciesPool: EggPoolId;
  hiddenTraits: HiddenTraits;
  hatchProgress: number;
  hatchRequired: number;
  seed: string;
  /** Timestamp of the last time each action was used (for cooldowns). */
  lastActionAt: Partial<Record<EggAction, number>>;
  /** Last time passive warming was applied. */
  lastTickAt: number;
}

// ── Pet ──────────────────────────────────────────────────────
export interface Pet {
  id: string;
  eggId: string;
  name: string;
  /** The first name the player chose. Never changes. */
  originalName: string;
  species: SpeciesId;
  rarity: Rarity;
  personality: PersonalityId;
  element: ElementId;
  baseStats: BaseStats;
  appearance: PetAppearance;
  traits: TraitId[];
  createdAt: number;
  generation: number;
  level: number;
  experience: number;
  friendship: number;
  /** 0–100. 100 = completely satisfied, 0 = extremely hungry. */
  hunger: number;
  /** 0–100. 100 = very happy, 0 = unhappy. */
  happiness: number;
  /** 0–100. 100 = fully rested, 0 = exhausted. */
  energy: number;

  // ── Added in v0.2 (older saves are upgraded in game/state.ts) ──
  /** When the stats above were last simulated forward in time. */
  careUpdatedAt: number;
  /** Set while the pet is asleep. */
  sleep: { since: number } | null;
  /** Last use of each care action ("pet", "play", "feed:apple"…), for cooldowns. */
  lastActionAt: Record<string, number>;
  /** Friendship earned on the current local day. A daily cap keeps bonding slow. */
  friendshipToday: { day: string; gained: number };

  // ── Added in v0.4 ──
  equipment: Equipment;
  /** Cosmetic worn on top (looks only). */
  cosmetic: ItemId | null;
  /** Temporary bonuses; used up when the next adventure starts. */
  boosts: Boost[];
}

// ── Game state ───────────────────────────────────────────────
export type GamePhase = 'welcome' | 'egg' | 'hatching' | 'naming' | 'intro' | 'pet';

export interface GameState {
  version: number;
  createdAt: number;
  updatedAt: number;
  phase: GamePhase;
  egg: Egg;
  pet: Pet | null;
  /** What happened while the player was away; shown once, then dismissed. */
  awaySummary: AwaySummary | null;
  /** Added in v0.3. */
  adventure: AdventureState;
  /** Added in v0.4. */
  inventory: InventoryState;
  shop: ShopState;
  quests: QuestsState;
  progress: ProgressState;
  /** Added in v0.5. */
  world: WorldState;
  journal: JournalState;
}

// ── Config shapes ────────────────────────────────────────────
export interface RarityDefinition {
  id: Rarity;
  label: string;
  /** Relative weight. Doesn't need to sum to 100. */
  weight: number;
  color: string;
  statMultiplier: number;
  traitCount: number;
  /** 0..1 visual aura strength around egg and pet. */
  aura: number;
}

export interface ElementDefinition {
  id: ElementId;
  label: string;
  color: string;
  description: string;
}

export interface PersonalityDefinition {
  id: PersonalityId;
  label: string;
  description: string;
  statBonus: Partial<BaseStats>;
}

export interface SpeciesAppearanceOptions {
  bodies: BodyShape[];
  eyes: EyeStyle[];
  ears: EarStyle[];
  tails: TailStyle[];
  palettes: Palette[];
  markings: MarkingStyle[];
}

export interface EvolutionFamily {
  familyId: string;
  stage: number;
  /** Placeholder for v0.2+ — species this one can evolve into. */
  evolvesTo: SpeciesId[];
}

export interface SpeciesDefinition {
  id: SpeciesId;
  name: string;
  description: string;
  baseStats: BaseStats;
  elements: ElementId[];
  personalities: PersonalityId[];
  appearance: SpeciesAppearanceOptions;
  evolution: EvolutionFamily;
}

export interface EggPoolDefinition {
  id: EggPoolId;
  label: string;
  hint: string;
  speciesWeights: Record<SpeciesId, number>;
}

export interface TraitDefinition {
  id: TraitId;
  label: string;
  description: string;
  minRarity?: Rarity;
}

export type ThemePreference = 'system' | 'light' | 'dark';
export interface Settings {
  theme: ThemePreference;
  /** Let the pet roam around web pages. */
  roam: boolean;
  /** Occasional speech bubbles while roaming. */
  chatter: boolean;
  /** Notify when an adventure finishes. */
  notifications: boolean;
}

// ── v0.2: living companion ───────────────────────────────────
export type Mood = 'sleeping' | 'hungry' | 'tired' | 'sad' | 'happy' | 'content';
export type TimeOfDay = 'morning' | 'afternoon' | 'evening' | 'night';
export type ReactionId = 'happy' | 'sleepy' | 'surprised' | 'playful' | 'shy';
export type FoodId = string;
export type PetAnimation =
  | 'idle' | 'blink' | 'bounce' | 'eat' | 'happy' | 'sad' | 'sleep' | 'play' | 'groom' | 'hide' | 'surprised' | 'yawn' | 'levelup';
export type Expression = 'normal' | 'blink' | 'happy' | 'sad' | 'sleep' | 'eat' | 'surprised' | 'shy' | 'yawn';

export interface FoodDefinition {
  id: FoodId;
  name: string;
  hungerRestored: number;
  happinessBonus: number;
  rarity: Rarity;
  cooldownMs: number;
}

export interface AwaySummary {
  awayMs: number;
  sleptMs: number;
  hungerDelta: number;
  happinessDelta: number;
  energyDelta: number;
  wokeUp: boolean;
  at: number;
}

// ── v0.3: adventures ─────────────────────────────────────────
export type Difficulty = 'easy' | 'normal' | 'hard';
export type RiskLevel = 'low' | 'medium' | 'high';
export type DurationId = '15m' | '30m' | '1h' | '2h' | '4h' | '8h';
export type LocationId = string;
export type EnemyId = string;
export type ItemId = string;

export interface CombatStats {
  hp: number;
  attack: number;
  defense: number;
  speed: number;
  luck: number;
  magic: number;
}

export interface EnemyDefinition {
  id: EnemyId;
  name: string;
  description: string;
  hp: number;
  attack: number;
  defense: number;
  speed: number;
  xp: number;
  gold: number;
  /** Magical attacks partly ignore defense. */
  magical?: boolean;
  icon: string;
}

export type ItemType = 'food' | 'material' | 'equipment' | 'accessory' | 'special';
/** Slots that change stats. Cosmetics are purely visual and have their own slot. */
export type EquipSlot = 'weapon' | 'armor' | 'accessory' | 'charm';
export type CombatStat = keyof CombatStats;

/** What an item does. `stat` applies while equipped; the rest happen once, when the item is used. */
export type ItemEffect =
  | { kind: 'stat'; stat: CombatStat; amount: number }
  | { kind: 'hunger' | 'happiness' | 'energy'; amount: number }
  | { kind: 'boost'; stat: CombatStat; amount: number };

export interface ItemMetadata {
  /** Where it's worn. `cosmetic` items change looks only. */
  slot?: EquipSlot | 'cosmetic';
  levelRequired?: number;
  /** Price in the shop (listings can override). */
  shopPrice?: number;
  unsellable?: boolean;
  /** Sold only by this wandering vendor. */
  vendor?: 'traveler';
}

export interface ItemDefinition {
  id: ItemId;
  name: string;
  description: string;
  type: ItemType;
  rarity: Rarity;
  icon: string;
  effects: ItemEffect[];
  sellValue: number;
  metadata: ItemMetadata;
}

/** A definition plus how many the player owns. */
export interface InventoryItem extends ItemDefinition {
  quantity: number;
}

export type Equipment = Record<EquipSlot, ItemId | null>;

/** A temporary bonus that lasts until the next adventure begins. */
export interface Boost {
  stat: CombatStat;
  amount: number;
  source: ItemId;
}

export interface InventoryState {
  gold: number;
  items: Record<ItemId, number>;
}

export interface ShopState {
  /** Which stock rotation `purchases` belongs to. */
  rotationId: number;
  purchases: Record<string, number>;
  /** Local day the free daily basket was last claimed. */
  basketDay: string;
}

export interface DropEntry {
  item: ItemId;
  /** Chance per roll (before luck). */
  chance: number;
  qty: [number, number];
  /** Only drops in these seasons (seasonal collectibles). */
  season?: Season[];
  /** Only drops at these times of day. */
  time?: WorldTime[];
  /** Multiplies the chance in certain weather or times (e.g. herbs after rain). */
  boost?: { weather?: Partial<Record<Weather, number>>; time?: Partial<Record<WorldTime, number>> };
}

export interface RewardTable {
  xpMultiplier: number;
  goldMultiplier: number;
  /** Rolled after every won battle. */
  drops: DropEntry[];
  /** Rolled a few times per completed adventure; never awarded on a retreat. */
  treasure: DropEntry[];
}

export interface LocationDefinition {
  id: LocationId;
  name: string;
  description: string;
  difficulty: Difficulty;
  minimumLevel: number;
  durationOptions: DurationId[];
  /** `time` limits an enemy to certain times of day (night creatures). */
  enemyTypes: { enemy: EnemyId; weight: number; time?: WorldTime[] }[];
  rewardTable: RewardTable;
  riskLevel: RiskLevel;
  /** Scales enemy strength. */
  enemyPower: number;
  favoredElement?: ElementId;
  icon: string;
  /** Also needs this story flag (set by a quest or a discovery). */
  requiresFlag?: string;
  /** Which part of the world this belongs to. */
  region: RegionId;
  /** Hidden places only show on the map once discovered. */
  hidden?: boolean;
}

export interface ItemStack {
  item: ItemId;
  qty: number;
}

/** Everything the result depends on is frozen at departure, so the outcome is a pure function of this record. */
export interface AdventureSnapshot {
  level: number;
  stats: CombatStats;
  /** Food, mood and friendship before leaving. */
  condition: number;
  /** Bonus when the pet's element suits the location. */
  affinity: number;
}

export interface ActiveAdventure {
  id: string;
  locationId: LocationId;
  petId: string;
  durationId: DurationId;
  durationMs: number;
  startedAt: number;
  expectedCompletion: number;
  seed: string;
  energyCost: number;
  snapshot: AdventureSnapshot;
  /** The world as it was when the trip began (v0.5). Optional so older trips still resolve. */
  world?: { seed: string; season: Season; known: string[] };
}

/** triumph = comfortable win, success = won but hurt, retreat = pet had to turn back. */
export type AdventureOutcome = 'triumph' | 'success' | 'retreat';

export interface AdventureResult {
  id: string;
  locationId: LocationId;
  petId: string;
  durationId: DurationId;
  durationMs: number;
  startedAt: number;
  /** When the adventure was due to end (not when the player came back). */
  completedAt: number;
  outcome: AdventureOutcome;
  battlesPlanned: number;
  enemiesDefeated: number;
  enemyCounts: Record<EnemyId, number>;
  xp: number;
  gold: number;
  items: ItemStack[];
  /** How much health the pet had left at the end (0–1). */
  hpRemaining: number;
  /** True if a rare treasure was found. */
  foundTreasure: boolean;
  /** Things discovered along the way (ids from world/discoveries). */
  discoveries?: string[];
  /** Time, weather and season when the trip began. */
  startWorld?: WorldNow;
}

export interface AdventureRecord {
  id: string;
  locationId: LocationId;
  startedAt: number;
  completedAt: number;
  durationId: DurationId;
  outcome: AdventureOutcome;
  enemies: number;
  xp: number;
  gold: number;
  items: ItemStack[];
  levelsGained: number;
}

export interface AdventureState {
  active: ActiveAdventure | null;
  /** Finished but rewards not collected yet. */
  pending: AdventureResult | null;
  history: AdventureRecord[];
  completed: number;
  /** Last adventure we sent a notification for (so we never notify twice). */
  notifiedId: string | null;
}

// ── v0.4: quests, progress ───────────────────────────────────
export type QuestType = 'daily' | 'weekly' | 'story' | 'exploration' | 'achievement';

export interface QuestObjective {
  /** Name of a lifetime counter (see progression/track.ts). */
  metric: string;
  target: number;
  label: string;
}

export interface QuestReward {
  gold?: number;
  xp?: number;
  items?: ItemStack[];
  /** Story flag to set (e.g. opens a new area). */
  flag?: string;
  flagText?: string;
}

export interface QuestDefinition {
  id: string;
  type: QuestType;
  title: string;
  description: string;
  objectives: QuestObjective[];
  reward: QuestReward;
  minLevel?: number;
  /** Quests that must be claimed first. */
  requires?: string[];
  requiresFlag?: string;
  /** Only offered when the world is like this (e.g. only at night). Once offered, it stays. */
  when?: { time?: WorldTime[]; weather?: Weather[]; season?: Season[] };
  /** Which NPC asks for it. They must have been met. */
  giver?: NpcId;
  /** Hidden until its flag is found. */
  secret?: boolean;
}

export interface QuestProgress {
  id: string;
  startedAt: number;
  /** Counter values when the quest began; progress = counter now − baseline. */
  baseline: Record<string, number>;
  claimedAt: number | null;
}

export interface QuestsState {
  active: Record<string, QuestProgress>;
  claimed: string[];
  dailyDay: string;
  weeklyKey: string;
}

export interface ProgressState {
  /** Lifetime counters: adventures, feeds, gold-earned… Quests and achievements read these. */
  counters: Record<string, number>;
  flags: string[];
  /** Achievement id → when it was earned. Permanent. */
  achievements: Record<string, number>;
  unseenAchievements: string[];
  tipsSeen: string[];
}

// ── v0.5: the living world ───────────────────────────────────
export type Season = 'spring' | 'summer' | 'autumn' | 'winter';
export type WorldTime = 'morning' | 'day' | 'evening' | 'night';
export type Weather = 'clear' | 'rain' | 'storm' | 'snow' | 'fog';
export type RegionId = string;
export type NpcId = string;

export interface WorldNow {
  time: WorldTime;
  weather: Weather;
  season: Season;
}

export interface WorldState {
  /** Seeds the weather and random events, so the world is the same every time you look at the same moment. */
  seed: string;
  /** `auto` follows the calendar; players in other hemispheres can pick a season. */
  seasonMode: 'auto' | Season;
  /** World events that have been dealt with (old ones are tidied away). */
  eventsDone: string[];
  eventPurchases: Record<string, number>;
  /** Regions the player has looked at, so new ones can be marked. */
  regionsSeen: string[];
}

export type JournalSection = 'memories' | 'discoveries' | 'adventures' | 'events' | 'milestones';

export interface JournalEntry {
  id: string;
  at: number;
  section: JournalSection;
  title: string;
  text: string;
}

export interface JournalState {
  entries: JournalEntry[];
  /** Things already written down, so "first time" moments are recorded once. */
  keys: string[];
}
