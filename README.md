# WebPet v0.5

A Chrome (MV3) extension. You install it, a mysterious egg appears, and it hatches into a pixel-art pet
generated from the egg's seed.

## Run it

```bash
npm install
npm run build          # outputs dist/
```

Chrome → `chrome://extensions` → enable Developer mode → **Load unpacked** → select `dist/`.
(A prebuilt `dist/` is included.) Click the toolbar icon for the popup; the panel icon in its header opens the side panel.

Other scripts: `npm run smoke` (renders the main screens in jsdom), `npm run tune` (adventure balance report), `npm run dev` (UI in a normal tab at `/popup.html`, storage falls back to localStorage,
shows a "skip to hatch" button), `npm run typecheck`, `npm run check` (rarity odds, determinism, game-flow checks).

To reset while testing: `chrome://extensions` → WebPet → Service worker → console →
`chrome.storage.local.clear()`, then reload the extension.

## Architecture

```
src/
  types/       shared types only
  rarity/      rarity config (odds live here) + roll
  egg/         createEgg (seed → egg), pools (which species an egg can hatch), egg look, stages
  world/       clock (time, season, weather), regions, discoveries, exploration, events, NPCs
  journal/     the persistent journal and derived pet milestones
  inventory/   item catalog, ledger, InventoryService, equipment rules, stat comparison
  shop/        listings (built from the catalog), rotation, buying, daily basket, shopkeeper lines
  quests/      quest data, derived progress, claiming
  achievements/ permanent achievements
  progression/ counters (track), XP and level-ups, level unlocks, starter defaults
  adventure/   locations, enemies, items, stats, combat, result calculation, start/settle/collect rules
  dialogue/    structured dialogue data (greetings, feeding, playing, sleeping, grooming, petting, personality, needs…) + the line-picking engine
  pet/         species, personalities, elements, traits, names, generatePet (seed → pet)
  game/        config/balance, state, pure reducers (egg actions, naming, phases), messages
  storage/     the only code that touches chrome.storage (load/save/update/ensure/subscribe)
  content/     content script: the pet roaming over web pages (vanilla DOM, built separately as content.js)
  background/  service worker: creates the save on install (idempotent)
  components/  React UI; screens are driven by `state.phase`
  popup/ sidepanel/  entry points (same App, two shells)
  pixel/       procedural pixel-art renderers (pet, egg, decor) → grids of colours
  assets/      tokens.css (all colours), styles.css, fonts
```

- **One egg, ever.** `createNewGame()` returns the existing save if there is one, and all storage writes go
  through a Web Lock, so the service worker and a popup opening simultaneously cannot lay two eggs.
- **Determinism.** Egg and pet are pure functions of `egg.seed`. Each concern (species, appearance, stats…) uses its
  own RNG fork, so adding a new roll later won't change existing pets.
- **The pet is created when hatching starts** and saved immediately, so closing the popup mid-animation is safe.
  `phase` is persisted: welcome → egg → hatching → naming → intro → pet.
- **Names:** `pet.name` can change; `pet.originalName` is set once.
- **Popup and side panel stay in sync** through `chrome.storage.onChanged`.

## Extending

- **New species:** add an object to `src/pet/species.ts` and list it in a pool in `src/egg/pools.ts`.
- **Rarity odds / stat multipliers:** `src/rarity/config.ts`. **Hatch pacing:** `src/game/config.ts`.
- **Real artwork:** replace `PetSprite` / `EggSprite`; they only read `PetAppearance` / `EggLook`.
- **New save fields:** bump `SAVE_VERSION` and add a step to `MIGRATIONS` in `src/game/state.ts`.
- **Nav tabs:** flip `enabled` in `src/game/navigation.ts` (v0.1: only Pet works).

## Design system

- **All colours are tokens** in `src/assets/tokens.css` (`--color-background`, `--color-surface`, `--color-primary`,
  status, rarity and element sets…). Components use Tailwind utilities backed by them (`bg-surface`, `text-text-muted`) —
  no hex values in components. Light values are in `@theme`; a dedicated dark theme overrides them
  (follows the OS, with a toggle in the header saved via `storage`).
- **Pixel art stays in the sprites.** `src/pixel/` turns `PetAppearance` / egg look into a colour grid; `PixelCanvas`
  draws it 1:1 and CSS scales it with `image-rendering: pixelated`. Sprite motion steps in whole art-pixels.
  Sprite palettes (species colours, egg shells) are art data, not UI tokens.
- **Rarity** appears as a border/dot and a faint glow, never a flooded card. Badge text stays in the normal text colour.
- Type: Nunito (bundled). Icons: Lucide. Radii 8/12/16/20px.

## Roaming

Once the pet is named, a content script (`src/content/`) lets it wander over every http(s) page in a Shadow DOM overlay:
it walks to random spots, idles, sits, sleeps (with a little "z z"), blinks, and can be **dragged** and dropped anywhere.
**Clicking** makes it hop, show its name and float a few hearts. It stays put under `prefers-reduced-motion`.

- Behaviour is pure logic in `src/game/roaming.ts` (tuned by `ROAM_CONFIG`); the content script only renders it.
- The content script only *reads* WebPet's saved data and never touches page contents. It runs in the top frame only.
- Toggle it with the "Let {name} roam" switch on the Pet screen (saved in settings, applies live to open tabs).
- Tabs that were already open when you installed or reloaded the extension need a refresh to get the pet.
- `content.js` is a separate build (`vite.content.config.ts`) because content scripts can't be ES modules; `npm run build` runs both.

## v0.2 — a living companion

**Stats** (`hunger`, `happiness`, `energy`, `friendship`, all 0–100): 100 hunger = satisfied, 0 = very hungry; 100 energy = rested.
Every change is clamped to 0–100.

**Time without timers.** Each pet stores `careUpdatedAt`. `simulatePet(pet, now)` (`src/game/simulation.ts`) moves the pet forward by
the elapsed time — piecewise, so a pet that was sleeping wakes up when rested and then carries on awake. It runs when the popup opens and
before every action; the Pet screen also recomputes the *displayed* stats once a second without writing anything. Time alone never pushes a
stat below gentle floors (hunger 5, happiness 10, energy 5) and at most 72h is simulated, so the pet can't die or suffer from being offline.
Absences of 30+ minutes produce a dismissible summary ("While you were away, Luna slept for 6 hours.").

**Care** (`src/game/careActions.ts`, pure: `applyCare(state, request, now, rnd)` → new state + an `Interaction`):
feeding (Apple, Berry, Meat, Fish in `src/game/foods.ts`; each pet has a favourite, derived from its id), petting (five reactions weighted by
personality, mood and friendship), playing, grooming, sleeping/waking. Cooldowns keep rewards from being farmed; refusals
("too full", "too tired", "I'm sleeping") are in-character. All numbers are in `src/game/careConfig.ts`.

**Friendship** has six levels (Stranger → Soul Companion) and grows slowly: happier pets bond faster, but there's a daily cap
(≈ 13+ days to reach 100). Care also earns XP toward levels.

**Dialogue** (`src/dialogue/`) is data, not JSX. Each line can be restricted by personality, mood, time of day, reaction, friendship and
happiness; the engine favours lines that match more of the situation. Add a line by adding one `line(...)` entry.

**Animations** are pixel expressions (`src/pixel/petSprite.ts`: normal, blink, happy, sad, eat, surprised, shy, yawn, sleep) plus
step-based motion (idle bob, bounce, chew, happy hops, play, hide, startle, breathing while asleep) and small props (food, ball, hearts, Zs).
The roaming pet uses the same expressions, curls up when asleep, and can be petted — the page asks the background worker to record it.

**Saves:** v1 → v2 is migrated automatically (`MIGRATIONS` in `src/game/state.ts`): hunger is flipped to the new meaning and care fields are added.

## v0.3 — adventures

**The loop:** care for the pet → pick a place and a trip length → close the browser → come back → "Welcome back." / "While you were away…"
with rewards appearing one by one → collect → XP, level-ups, gold and materials → harder places.

**Nothing runs while you're away.** Starting a trip stores `startedAt`, `expectedCompletion`, `locationId`, `petId`, a random `seed`
and a snapshot of the pet's stats and condition. When the popup opens (or the alarm fires), `resolveAdventure(active)` works the result out
from that record. It is pure, so the same record always gives the same result, however late you return (browser closed, computer asleep).

**Combat** (`src/adventure/combat.ts`) is an automatic, deterministic duel per enemy: Attack and Magic deal damage, Defense soaks it,
Speed decides who opens, Luck gives crits and dodges. The pet keeps its HP between fights, heals a little after each and a lot at camp.
The six stats (HP, Attack, Defense, Speed, Magic, Luck) derive from the pet's base stats and level, so they rise every level.
Outcome also depends on difficulty, condition (fed, happy, close friends do a little better), element affinity, luck and the seed.
`npm run tune` prints win rates: a stronger pet is clearly better, a weaker one occasionally gets through.
Equipment has a placeholder hook (`getEquipmentBonus`).

**Failure is gentle.** If the pet has to turn back it returns about a third of the XP and gold, a few common materials and never rare
treasure. Nothing is lost and the pet is never harmed.

**Energy.** 15m = 10, 30m = 15, 1h = 20, 2h = 30, 4h = 40, 8h = 55 (all in `src/adventure/config.ts`). Not enough energy, or asleep, means no trip.
Levelling up restores some energy.

**Notifications.** `chrome.alarms` wakes the background worker at the finish time (and it re-checks at browser start). It settles the result,
puts a "!" on the toolbar icon and sends one notification per adventure. Turn it off in Settings.

**Data to extend:** locations in `locations.ts` (difficulty, risk, minimum level, durations, enemies, reward table), enemies in `enemies.ts`,
materials in `items.ts`. The XP curve is `base + perLevel × level^exponent` in `careConfig.ts`.

**Saves:** v2 → v3 adds the `adventure` block (active trip, uncollected result, history, gold, materials). v0.1 and v0.2 saves upgrade in order.

## v0.4 — a lightweight RPG

**One catalog, one service.** Every item (food, materials, equipment, accessories, special items) is defined once in `src/inventory/catalog.ts`
with `id, name, description, type, rarity, icon, effects, sellValue, metadata`; ownership is a count per id. The **InventoryService**
(`src/inventory/service.ts`) is the only place that changes what you own — add/remove, gold, selling, equipping, using tonics. Adventures, quests,
the shop and feeding all call it, so the rules exist exactly once. Feeding now uses food from the bag. The same six rarities are used everywhere.

**Stats stay apart.** `statBreakdown(pet)` returns base (from level), equipment and temporary bonuses separately, plus the total.
HP, Attack, Defense, Speed, Luck and Magic grow with level. Tonics give boosts that last until the next adventure begins (they're frozen
into that trip's snapshot, then used up). Cosmetics change looks only. The Equipment screen previews any item with `before → after  +n`
(on hover, focus or tap) and has an optional "Details" view of the breakdown.

**Shop.** Sections: Food, Gear, Materials, Style, plus Sell. Staples are always stocked; the rest rotates every 12 hours (seeded, so it's stable
within a rotation), limited per item and gated by the pet's level — new gear and cosmetics appear as it levels. A free daily basket means nobody
is ever stuck without food. Give an item a `shopPrice` in the catalog and it's for sale.

**Quests.** Daily (3), weekly (2), story, exploration and long-term goals. Objectives read lifetime counters (`feeds`, `adventures:<place>`,
`treasures`…) that every system updates through one function, `track()`. Progress is derived (counter now − counter at start), so there's nothing
to keep in sync. Story quests form a chain that also teaches the game; *The Strange Light* (3 forest adventures) opens the Ancient Ruins path.
Rewards can include gold, XP, items and story unlocks.

**Achievements** (First Steps, First Adventure, First Level Up, Treasure Hunter, Best Friends, Dungeon Explorer…) are checked after every event,
stored permanently, and shown in the Journal with a quiet toast when earned.

**Level progression** unlocks areas, gear, quests and cosmetics, all derived from the game data. The level-up screen lists what's new.

**Gentle by design:** Pet and Adventure still work on their own. Each new section opens with a one-time tip, advanced detail is behind
optional toggles, and everything is described in plain words.

**Saves:** `version: 4`. v3 → v4 moves gold and materials into the inventory (nothing lost), adds starter food (food used to be unlimited),
seeds the counters from your adventure history and opens the ruins path for pets that were already level 12+. Migrations are chained in `MIGRATIONS`.

## v0.5 — a world that feels alive

**The map.** The Adventure tab now opens on an illustrated world map (`WorldMap.tsx`): seven regions drawn from plain shapes in the design tokens,
with the season tinting the land, the hour tinting the sky, and rain, snow, fog or storm drifting over it. Tooltips explain each place, a small bar
shows rank (open regions) or how close you are to opening it (locked ones), and the Cosmic Rift stays a "?" until something hints at it.
Tap a region for its page: rank, who's there, places to explore, what lives and grows there (unknown things stay "???"), related quests and what's
happening now. Data lives in `world/regions.ts`; locations in `adventure/locations.ts` now belong to a region.

**Unlocking.** Any mix of level, story flags, exploration counters and discoveries: Mine (level 5), Ruins (level 12 + the story quest),
Sunken Coast (level 16 + the Tide Chart, a special discovery), Dragon Peaks (level 22 + exploring the coast), Cosmic Rift (level 30 + the story
of the falling stars). Locked regions list exactly what's needed, in vague words for secrets.

**Exploration.** Trips that go well roll for discoveries along the way (`world/explore.ts`): hidden places, treasure, NPCs, rare resources, secret
quests and mysterious objects. Each has a base chance (mostly low), may only happen at certain times, in certain weather or seasons, and one-time
finds can't repeat. Hidden places appear on the map only once found. Nothing is listed up front; the region page shows "???" and a nudge.

**The world clock** (`world/clock.ts`) follows the player's own local date and time: morning, day, evening, night; four seasons from the calendar
(or chosen in Settings for other hemispheres); weather chosen per three-hour block from the world seed and season. Night creatures only appear at
night, rain makes herbs easier to find, fog improves the odds of strange encounters, and each season has its own collectibles. An adventure freezes
the world seed and season at departure, so its result is still a pure function of its record.

**Events.** Every four hours has a chance of something happening, generated from the world seed (so it's the same for any moment, with no
background process): a traveling merchant, a mysterious creature, a meteor, a rare bloom, a treasure map, plus seasonal ones (Harvest Fair, snow spirit,
fireflies, Blossom Day). They last a few hours, can be dealt with once, and show on the map and in their region.

**NPCs.** Mossy (Village Merchant), Brannoch (Blacksmith) and Thistle (Potion Maker) run the shop shelves; Old Wren (Old Explorer) is found by
exploring; the Mystery Traveler is found at night or in fog and only appears in the evening, at night or in fog. Each has dialogue that reacts
to time, weather and season, plus optional requests. Add one in `world/npcs.ts`.

**Journal & memory.** Five sections (Memories, Discoveries, Adventures, Important Events, Pet Milestones), written automatically from game events
(`journal/journal.ts`), e.g. "September 29 — Luna found their first rare item: Forest Crystal." Milestones are derived from the save, so each is written once.
The journal is capped at 400 notes and drops the oldest trip notes first.

**Privacy.** WebPet reads no browsing history, tabs, cookies, pages or URLs, and requests no permission for them. The content script only draws
the pet. The world runs on the local clock. All data stays in `chrome.storage.local`; nothing is sent anywhere. `npm run check` enforces this by
scanning the manifest and source for browsing APIs and network calls.

**Saves:** `version: 5`. v4 → v5 adds the world seed (stable across loads) and a journal seeded from your history (hatching, trips, achievements), with
levels, friendships and opened regions marked as already known rather than written up all at once.
