// UI smoke test (`npm run smoke`): renders the main screens in jsdom with a v0.3 game state and fails on any error.
import { JSDOM } from 'jsdom';
const dom = new JSDOM('<!doctype html><div id="root"></div>', { url: 'https://example.test/', pretendToBeVisual: true });
Object.assign(globalThis, { window: dom.window, document: dom.window.document, HTMLElement: dom.window.HTMLElement, Node: dom.window.Node, IS_REACT_ACT_ENVIRONMENT: true });
(dom.window as any).matchMedia = (q: string) => ({ matches: false, media: q, addEventListener() {}, removeEventListener() {}, addListener() {}, removeListener() {} });
(globalThis as any).matchMedia = (dom.window as any).matchMedia;
(dom.window.HTMLCanvasElement.prototype as any).getContext = () => ({ clearRect() {}, fillRect() {}, set fillStyle(_v: string) {} });
(globalThis as any).localStorage = dom.window.localStorage;
(globalThis as any).requestAnimationFrame = (cb: FrameRequestCallback) => setTimeout(() => cb(performance.now()), 16);
(globalThis as any).cancelAnimationFrame = (id: number) => clearTimeout(id);

const errors: string[] = [];
const origError = console.error;
console.error = (...a: unknown[]) => { const m = a.map(String).join(' '); if (!/not implemented|act\(/i.test(m)) errors.push(m); origError(...a); };

const { createRoot } = await import('react-dom/client');
const { act } = await import('react');
const React = await import('react');
const { createInitialState } = await import('../src/game/state');
const { startJourney, completeHatch, namePet, finishIntro } = await import('../src/game/petActions');
const { setHatchProgress } = await import('../src/game/eggActions');
const { startAdventure, syncAdventure } = await import('../src/adventure/actions');
const { AdventureScreen } = await import('../src/components/AdventureScreen');
const { ReturnScreen } = await import('../src/components/ReturnScreen');
const { LevelUpScreen } = await import('../src/components/LevelUpScreen');
const { PetScreen } = await import('../src/components/PetScreen');
const { ThemeContext } = await import('../src/components/useTheme');

let g = createInitialState({ eggId: 'e', seed: 'smoke', now: 0 });
g = setHatchProgress(startJourney(g, 0), 100, 0);
const nm = namePet(completeHatch(g), 'Luna');
g = finishIntro(nm.ok ? nm.state : g);
const T = Date.now();
g = { ...g, pet: { ...g.pet!, careUpdatedAt: T, level: 6, energy: 90, hunger: 80, happiness: 80 } };

const update = async (fn: (s: typeof g) => typeof g) => fn(g);
const root = createRoot(document.getElementById('root')!);
const wrap = (el: React.ReactElement) => React.createElement(ThemeContext.Provider, { value: { effective: 'light' as const, toggle() {} } }, el);
const text = () => document.body.textContent ?? '';
const click = async (label: RegExp | string) => {
  const el = [...document.querySelectorAll('button')].find((b) => (typeof label === 'string' ? b.textContent?.includes(label) : label.test(b.textContent ?? '')));
  if (!el) throw new Error(`no button: ${label}`);
  await act(async () => { el.dispatchEvent(new dom.window.MouseEvent('click', { bubbles: true })); });
};
const wait = async (ms: number) => { for (let t = 0; t < ms; t += 100) await act(async () => { await new Promise((r) => setTimeout(r, 100)); }); };
const check = (cond: unknown, msg: string) => { if (!cond) throw new Error('SMOKE FAILED: ' + msg); };

const props = { game: g, update, variant: 'popup' as const, onNavigate() {}, onLevelUp() {}, onOpenShop() {} };
await act(async () => root.render(wrap(React.createElement(AdventureScreen, props))));
check(/The World/.test(text()) && !!document.querySelector('svg[aria-label="Illustrated map of the world"]'), 'the world map is shown');
check(['Village', 'Whispering Forest', 'Crystal Mine', 'Ancient Ruins', 'Sunken Coast', 'Dragon Peaks'].every((n) => text().includes(n)), 'six regions are on the map');
check(/Unknown/.test(text()) && !/Cosmic Rift/.test(text()), 'the Cosmic Rift stays a mystery at first');
check(document.querySelectorAll('[role="tooltip"]').length === 7 && !!document.querySelector('ul[aria-label="The world right now"]'), 'tooltips and world chips are present');
await click(/Ancient Ruins/);
check(/Not open yet/.test(text()) && /Reach level 12/.test(text()) && /strange light/.test(text()), 'a locked region lists what it needs');
await click('World map');
await click(/Village/);
check(/Who.s here/.test(text()) && /Mossy/.test(text()) && /Brannoch/.test(text()) && /Thistle/.test(text()) && !/Old Wren/.test(text()) && !/Traveler/.test(text()), 'village NPCs are here; undiscovered ones are not');
await click(/Mossy/);
check(/Village Merchant/.test(text()) && /Browse wares/.test(text()), 'talking to an NPC');
await click('Back'); await click('World map');
await click(/Whispering Forest/);
check(/Places to explore/.test(text()) && /What lives here/.test(text()) && /Resources/.test(text()) && /\?\?\?/.test(text()) && /Some places only reveal themselves/.test(text()), 'a region shows what is known and hints at more');
check(!/Moonlit Glade/.test(text()), 'hidden places are not revealed');
await click(/Whispering Forest/);
check(/Start Adventure/.test(text()) && /Expected rewards/.test(text()) && /Difficulty/.test(text()) && /Risk/.test(text()) && /How long\?/.test(text()), 'preview shows difficulty, risk, duration, rewards');
await click('4h');
check(/4 hours/.test(text()), 'duration selector works');
await click('Back'); await click('World map');

// Away view
const started = startAdventure(g, { locationId: 'whispering-forest', durationId: '2h', seed: 's1' }, T);
check(started.ok, 'start');
const away = started.ok ? started.state : g;
await act(async () => root.render(wrap(React.createElement(AdventureScreen, { ...props, game: away }))));
check(/is out exploring/.test(text()) && /Back in/.test(text()), 'away view');
await act(async () => root.render(wrap(React.createElement(PetScreen, { game: away, update, variant: 'popup', onRename: async () => null, onNavigate() {} }))));
check(/is out at the Whispering Forest/.test(text()), 'pet screen shows the pet is away');

// Return + level up
const back = syncAdventure(away, T + 3 * 3_600_000);
const result = back.adventure.pending!;
await act(async () => root.render(wrap(React.createElement(ReturnScreen, { pet: back.pet!, result, onCollect: async () => {} }))));
check(/Welcome back/.test(text()), 'welcome back');
await wait(1700);
check(/While you were away/.test(text()), 'while you were away');
await wait(1500);
await wait(650 * (5 + result.items.length + (result.discoveries?.length ?? 0)) + 800);
check(/Adventure Complete/.test(text()) && /Location/.test(text()) && /Enemies/.test(text()) && /XP/.test(text()) && /Gold/.test(text()) && /Collect Rewards/.test(text()), 'results list');
const collectBtn = [...document.querySelectorAll('button')].find((b) => /Collect Rewards/.test(b.textContent ?? ''))!;
check(!collectBtn.hasAttribute('disabled'), 'collect enabled after rewards appear');
const info = { from: 6, to: 7, before: { hp: 100, attack: 20, defense: 15, speed: 25, luck: 20, magic: 20 }, after: { hp: 108, attack: 22, defense: 16, speed: 27, luck: 21, magic: 22 }, energyRestored: 15, unlocks: [{ kind: 'area' as const, label: 'Crystal Mine' }] };
await act(async () => root.render(wrap(React.createElement(LevelUpScreen, { pet: back.pet!, info, onContinue() {} }))));
await wait(2600);
check(/Level up!/.test(text()) && /Lv 7/.test(text()) && /Energy restored \+15/.test(text()), 'level-up screen');

// ── v0.4: the whole app against real (local) storage ──
const { App } = await import('../src/components/App');
const { syncProgression } = await import('../src/progression/track');
const { addItems } = await import('../src/inventory/service');
let seeded = syncProgression(addItems({ ...g, pet: { ...g.pet!, level: 5, careUpdatedAt: Date.now(), energy: 100, hunger: 60, happiness: 80 } }, [{ item: 'rusty-sword', qty: 1 }, { item: 'iron-blade', qty: 1 }, { item: 'iron-ore', qty: 3 }]), Date.now());
localStorage.setItem('webpet:game', JSON.stringify(seeded));
const saved = () => JSON.parse(localStorage.getItem('webpet:game')!) as typeof seeded;
await act(async () => root.render(wrap(React.createElement(App, { variant: 'popup' }))));
await wait(300);
const nav = async (label: string) => { const b = [...document.querySelectorAll('nav button')].find((x) => x.textContent?.includes(label)); if (!b) throw new Error('no nav ' + label); await act(async () => { b.dispatchEvent(new dom.window.MouseEvent('click', { bubbles: true })); }); await wait(200); };
check(document.querySelectorAll('nav button').length === 7 && ['Pet', 'Adventure', 'Inventory', 'Equipment', 'Quests', 'Shop', 'Journal'].every((n) => text().includes(n)), 'seven sections in the navigation');

await nav('Inventory');
check(/Inventory/.test(text()) && /Food/.test(text()) && /Materials/.test(text()) && /Equipment/.test(text()) && /Accessories/.test(text()) && /Special/.test(text()), 'inventory shows the five categories');
await click('Apple');
check(/Feed /.test(text()) && /Crisp and simple/.test(text()), 'item details appear');
await click(/^Materials/);
await click('Iron Ore');
await click(/Sell 1/);
await wait(200);
check(saved().inventory.items['iron-ore'] === 2 && saved().inventory.gold > seeded.inventory.gold, 'selling updates the saved inventory and gold');

await nav('Equipment');
check(/Weapon/.test(text()) && /Armor/.test(text()) && /Accessory/.test(text()) && /Charm/.test(text()) && /stats/.test(text()), 'equipment slots and stats');
await click(/^Weapon$/);
const row = [...document.querySelectorAll('li button')].find((b) => b.textContent?.includes('Iron Blade'))!;
await act(async () => { row.dispatchEvent(new dom.window.MouseEvent('mouseover', { bubbles: true })); row.dispatchEvent(new dom.window.FocusEvent('focus')); (row as HTMLElement).focus(); });
await wait(100);
check(/\u2192/.test(text()) && /\+7/.test(text()), 'hovering shows the comparison (before → after, +7)');
await click(/Iron Blade/);
await wait(200);
check(saved().pet!.equipment.weapon === 'iron-blade', 'equipping saves the loadout');

await nav('Shop');
check(/Mossy/.test(text()) && /Free daily basket/.test(text()) && /Sell/.test(text()), 'shop with shopkeeper and daily basket');
const goldBefore = saved().inventory.gold;
const buyBtn = [...document.querySelectorAll('li button')].find((b) => /8/.test(b.textContent ?? '') && !b.hasAttribute('disabled'))!;
await act(async () => { buyBtn.dispatchEvent(new dom.window.MouseEvent('click', { bubbles: true })); });
await wait(200);
check(saved().inventory.gold === goldBefore - 8, 'buying spends gold and persists');
await click('Claim'); await wait(150);
check(saved().shop.basketDay !== '', 'daily basket claimed');

await nav('Quests');
check(/Quests/.test(text()) && /Daily/.test(text()) && /Weekly/.test(text()), 'quests: daily and weekly');
await click('Story');
check(/Story/.test(text()) && /(A Warm Welcome|Out the Door|Dressed for the Part|The Strange Light)/.test(text()), 'story quest is shown');
await click('Explore');
check(/Explore|Forest Wanderer|Lucky Find/.test(text()), 'exploration quests');

await nav('Journal');
const tabLabels = [...document.querySelectorAll('[role="tab"]')].map((t) => t.textContent);
check(['Memories', 'Finds', 'Trips', 'Events', 'Pet'].every((n) => tabLabels.includes(n)), 'journal has its five sections');
check(/Memories/.test(text()) && /Special moments will be remembered|First|found/.test(text()), 'memories section');
await click('Pet');
check(/Pet Milestones/.test(text()) && /Hatched/.test(text()) && /First Steps/.test(text()) && /Best Friends/.test(text()) && /Dungeon Explorer/.test(text()) && /Coming up/.test(text()), 'pet milestones, achievements and what is next');
await click('Events');
check(/Important Events/.test(text()), 'important events section');

await nav('Pet');
check(/Hunger/.test(text()) && /Happiness/.test(text()) && /Energy/.test(text()), 'pet screen still intact');
// World events on the map
const { Happenings } = await import('../src/components/Happenings');
const { activeEvents } = await import('../src/world/events');
const rich = { ...saved(), inventory: { ...saved().inventory, gold: 9999 } };
let merchantEv: any = null, evNow = 0;
for (let h = 0; h < 24 * 90 && !merchantEv; h++) { evNow = Date.now() + h * 3_600_000; merchantEv = activeEvents(rich, evNow).find((e) => e.type === 'traveling-merchant'); }
check(!!merchantEv, 'a traveling merchant turns up within three months');
await act(async () => root.render(wrap(React.createElement(Happenings, { game: rich, update: async (fn: any) => fn(rich), events: [merchantEv], now: evNow, onLevelUp() {} }))));
check(/A traveling merchant arrives/.test(text()) && /Browse wares/.test(text()) && /left/.test(text()), 'a world event is shown with its time left');
await click('Browse wares');
check(document.querySelectorAll('li li button').length >= 1, 'the merchant shows wares to buy');
await act(async () => root.render(wrap(React.createElement(App, { variant: 'popup' }))));
await wait(300);
await click(/Settings/).catch(() => {});
const gear = document.querySelector('button[aria-label="Settings"]'); if (gear) await act(async () => { gear.dispatchEvent(new dom.window.MouseEvent('click', { bubbles: true })); });
await wait(100);
check(/World season/.test(text()) && /Your privacy/.test(text()) && /never reads your browsing history/.test(text()), 'settings: season choice and privacy note');
const winter = [...document.querySelectorAll('[role="radio"]')].find((b) => b.textContent === 'Winter')!;
await act(async () => { winter.dispatchEvent(new dom.window.MouseEvent('click', { bubbles: true })); }); await wait(200);
check(saved().world.seasonMode === 'winter', 'the season choice is saved');
check(errors.length === 0, `console errors: ${errors.join(' | ')}`);
console.log('ui smoke: ok');
process.exit(0);
