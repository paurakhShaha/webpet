import type { Expression, Pet, PetAnimation } from '@/types';
import { ANIMATION_EXPRESSION, ANIMATION_MS } from '@/game/animation';
import { ROAM_CONFIG as C } from '@/game/config';
import { getMood } from '@/game/mood';
import {
  clampToBounds, createRoamState, drop, forceSleep, hopToward, moveHeld, pickUp, poke, stepRoam, wake,
  type RoamBounds, type RoamState,
} from '@/game/roaming';
import { simulatePet } from '@/game/simulation';
import { ambientLine } from '@/game/talk';
import { worldAt } from '@/world/clock';
import type { WorldState } from '@/types';
import { PET_MESSAGE, type PetMessageResponse } from '@/messaging';
import { ELEMENTS } from '@/pet/elements';
import { RARITY_CONFIG } from '@/rarity/config';
import type { Grid } from '@/pixel/grid';
import { PET_GRID_SIZE, renderPetGrid } from '@/pixel/petSprite';
import { PROPS } from '@/pixel/props';
import { ROAM_CSS } from './styles';

function paint(canvas: HTMLCanvasElement, grid: Grid) {
  canvas.width = grid.w;
  canvas.height = grid.h;
  const ctx = canvas.getContext('2d');
  if (!ctx) return;
  grid.cells.forEach((color, i) => {
    if (!color) return;
    ctx.fillStyle = color;
    ctx.fillRect(i % grid.w, Math.floor(i / grid.w), 1, 1);
  });
}

export interface Roamer {
  setPet(pet: Pet): void;
  setWorld(world: WorldState): void;
  setChatter(on: boolean): void;
  destroy(): void;
}

export function mountRoamer(initial: Pet, opts: { chatter: boolean; world?: WorldState }): Roamer {
  const scale = C.scale;
  const size = PET_GRID_SIZE * scale;
  const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const bounds = (): RoamBounds => ({
    width: document.documentElement.clientWidth,
    height: document.documentElement.clientHeight,
    size,
  });

  // ── DOM (a shadow root keeps page styles out and ours in) ──
  const host = document.createElement('div');
  host.id = 'webpet-roamer';
  host.style.cssText = 'all:initial;position:fixed;inset:0;pointer-events:none;z-index:2147483647;';
  const root = host.attachShadow({ mode: 'open' });
  const style = document.createElement('style');
  style.textContent = ROAM_CSS;

  const petEl = document.createElement('div');
  petEl.className = 'pet';
  petEl.style.width = petEl.style.height = `${size}px`;
  const shadowEl = Object.assign(document.createElement('div'), { className: 'shadow' });
  const spriteEl = Object.assign(document.createElement('div'), { className: 'sprite' });
  const canvas = document.createElement('canvas');
  canvas.setAttribute('aria-hidden', 'true');
  canvas.style.cssText = `width:${size}px;height:${size}px`;
  const bubble = Object.assign(document.createElement('div'), { className: 'bubble' });
  bubble.hidden = true;
  const zzz = Object.assign(document.createElement('div'), { className: 'zzz', textContent: 'z z' });
  zzz.hidden = true;
  spriteEl.append(canvas);
  petEl.append(shadowEl, spriteEl, bubble, zzz);
  root.append(style, petEl);
  document.documentElement.append(host);

  // ── Pet data ──
  let saved = initial;
  let live = initial;
  let chatter = opts.chatter;
  let worldState = opts.world;
  const frames = new Map<Expression, Grid>();
  const iris = () => ELEMENTS[saved.element].color;
  const frame = (e: Expression): Grid => {
    let g = frames.get(e);
    if (!g) { g = renderPetGrid(saved.appearance, iris(), { expression: e, cosmetic: saved.cosmetic }); frames.set(e, g); }
    return g;
  };
  const refreshLive = () => { live = simulatePet(saved, Date.now()).pet; };
  const setPet = (pet: Pet) => {
    saved = pet;
    frames.clear();
    current = null;
    refreshLive();
    const rarity = RARITY_CONFIG[pet.rarity];
    // Epic and above get a very faint glow; everything else stays plain.
    spriteEl.style.filter = rarity.aura >= 0.4 ? `drop-shadow(0 0 5px ${rarity.color}99)` : '';
  };

  // ── Behaviour state ──
  let state: RoamState = createRoamState(bounds(), Math.random);
  let t = 0;
  let current: Grid | null = null;
  let nextBlink = 2;
  let blinkUntil = 0;
  let bubbleUntil = 0;
  let activity: { animation: PetAnimation; until: number } | null = null;
  let nextChatter = 90 + Math.random() * 120;
  let nextLive = 0;
  setPet(initial);

  const showBubble = (text: string, seconds: number) => {
    if (!text) return;
    bubble.textContent = text;
    bubble.hidden = false;
    bubbleUntil = t + seconds;
  };
  const spawnHearts = () => {
    for (let i = 0; i < 3; i++) {
      const heart = document.createElement('canvas');
      heart.className = 'heart';
      paint(heart, PROPS.heart);
      heart.style.cssText = `width:${PROPS.heart.w * 2}px;height:${PROPS.heart.h * 2}px;left:${size * (0.25 + i * 0.22)}px;animation-delay:${i * 120}ms`;
      petEl.append(heart);
      setTimeout(() => heart.remove(), 1300 + i * 120);
    }
  };

  // ── Petting: asks the background worker, then acts out the result ──
  const pet = async (pointer: { x: number; y: number }, before: RoamState) => {
    state = poke(before);
    let res: PetMessageResponse | undefined;
    try {
      res = (await chrome.runtime.sendMessage({ type: PET_MESSAGE })) as PetMessageResponse | undefined;
    } catch { /* extension was reloaded; fall back to a plain hop */ }
    const i = res?.interaction;
    if (!i) { spawnHearts(); return; }
    showBubble(i.dialogue, 3.2);
    if (i.animation === 'happy' || i.animation === 'groom') spawnHearts();
    if (i.animation !== 'sleep') activity = { animation: i.animation, until: t + ANIMATION_MS[i.animation] / 1000 };
    if (i.reaction === 'playful') state = hopToward(before, pointer, bounds());
    else if (i.reaction === 'shy' || i.animation === 'sleep') state = { ...before, mode: before.mode === 'sleep' ? 'sleep' : 'idle', timer: 2.5, target: null };
  };

  // ── Drag & click ──
  let dragging = false;
  let moved = false;
  let before: RoamState = state;
  let grab = { x: 0, y: 0 };
  let start = { x: 0, y: 0 };

  petEl.addEventListener('pointerdown', (e) => {
    e.preventDefault();
    petEl.setPointerCapture(e.pointerId);
    dragging = true;
    moved = false;
    before = state;
    grab = { x: e.clientX - state.x, y: e.clientY - state.y };
    start = { x: e.clientX, y: e.clientY };
    state = pickUp(state);
    petEl.classList.add('held');
  });
  petEl.addEventListener('pointermove', (e) => {
    if (!dragging) return;
    if (Math.hypot(e.clientX - start.x, e.clientY - start.y) > 4) moved = true;
    if (moved) state = moveHeld(state, { x: e.clientX - grab.x, y: e.clientY - grab.y }, bounds());
  });
  const release = (e: PointerEvent) => {
    if (!dragging) return;
    dragging = false;
    petEl.classList.remove('held');
    if (moved) state = drop(state);
    else void pet({ x: e.clientX, y: e.clientY }, before);
  };
  petEl.addEventListener('pointerup', release);
  petEl.addEventListener('pointercancel', release);

  // ── Render ──
  const render = () => {
    const { mode } = state;
    const mood = getMood(live);
    const animating = activity && t < activity.until ? activity.animation : null;
    if (!animating) activity = null;

    let lift = 0; // art pixels, negative = up
    if (mode === 'walk') lift = -Math.round(Math.abs(Math.sin(t * 10)) * 2);
    else if (mode === 'idle') lift = Math.floor(t / 1.2) % 2 === 0 ? 0 : -1;
    else if (mode === 'sit' || mode === 'sleep') lift = 1;
    else if (mode === 'held') lift = -3;
    else if (mode === 'hop') lift = -Math.round(Math.sin(Math.PI * (1 - state.timer / C.hopSeconds)) * 5);
    if (mode !== 'held' && mode !== 'walk') {
      if (animating === 'happy' || animating === 'groom' || animating === 'bounce') lift = -Math.round(Math.abs(Math.sin(t * 9)) * 3);
      else if (animating === 'hide') lift = 6;
      else if (animating === 'surprised') lift = t % 0.9 < 0.3 ? -4 : 0;
      else if (animating === 'yawn' || (mood === 'sad' && mode === 'idle')) lift = 1;
    }

    petEl.style.transform = `translate(${Math.round(state.x)}px, ${Math.round(state.y)}px)`;
    spriteEl.style.transform = `translateY(${lift * scale}px) scaleX(${state.facing})`;
    shadowEl.style.opacity = String(Math.max(0.4, 1 + Math.min(0, lift) / 8));

    if (t >= nextBlink) { blinkUntil = t + 0.16; nextBlink = t + 3 + Math.random() * 3; }
    let expression: Expression = 'normal';
    if (mode === 'sleep') expression = 'sleep';
    else if (animating) expression = ANIMATION_EXPRESSION[animating];
    else if (mood === 'sad') expression = 'sad';
    else if (t < blinkUntil) expression = 'blink';
    const grid = frame(expression);
    if (grid !== current) { paint(canvas, grid); current = grid; }

    zzz.hidden = mode !== 'sleep';
    if (!bubble.hidden && t >= bubbleUntil) bubble.hidden = true;
  };

  let raf = 0;
  let last = performance.now();
  const destroy = () => {
    cancelAnimationFrame(raf);
    host.remove();
  };
  const alive = () => {
    try { return !!chrome.runtime?.id; } catch { return false; }
  };
  const tick = (now: number) => {
    // After the extension is reloaded, orphaned pages clean themselves up.
    if (!alive()) return destroy();
    const dt = Math.min(0.1, (now - last) / 1000);
    last = now;
    t += dt;
    const b = bounds();

    if (t >= nextLive) { refreshLive(); nextLive = t + 1; }
    // Follow the pet's sleep state: curl up when it falls asleep, stretch when it wakes.
    if (live.sleep) state = forceSleep(state);
    else state = wake(state);

    const frozen = reducedMotion && state.mode !== 'held' && state.mode !== 'hop';
    state = frozen || state.timer > 1e6 ? { ...state, ...clampToBounds(state, b) } : stepRoam(state, dt, b, Math.random);

    // A little unprompted chatter, rarely: needs first, personality otherwise.
    if (chatter && t >= nextChatter && !live.sleep && state.mode !== 'held') {
      showBubble(ambientLine(live, Date.now(), Math.random, worldState ? worldAt(worldState, Date.now()) : undefined), 4.5);
      nextChatter = t + 120 + Math.random() * 180;
    }

    render();
    raf = requestAnimationFrame(tick);
  };
  raf = requestAnimationFrame(tick);

  return { setPet, setWorld: (w) => { worldState = w; }, setChatter: (on) => { chatter = on; }, destroy };
}
