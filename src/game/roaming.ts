import { ROAM_CONFIG as C } from './config';

// Pure roaming behaviour. No DOM, no timers: give it the time step and the
// viewport and it returns the next state. The content script only renders it.

export type RoamMode = 'idle' | 'walk' | 'sit' | 'sleep' | 'held' | 'hop';
type RestMode = 'idle' | 'sit' | 'sleep';

export interface Point { x: number; y: number }
export interface RoamBounds { width: number; height: number; size: number }
export interface RoamState {
  /** Top-left of the sprite box, in viewport pixels. */
  x: number;
  y: number;
  facing: 1 | -1;
  mode: RoamMode;
  /** Seconds left in the current rest or hop. */
  timer: number;
  target: Point | null;
  /** Where to go after a hop. */
  resume: RoamMode;
}
type Rnd = () => number;

const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));
const between = ([lo, hi]: readonly [number, number], rnd: Rnd) => lo + (hi - lo) * rnd();

export function clampToBounds(p: Point, b: RoamBounds): Point {
  return {
    x: clamp(p.x, C.margin, Math.max(C.margin, b.width - b.size - C.margin)),
    y: clamp(p.y, C.margin, Math.max(C.margin, b.height - b.size - C.margin)),
  };
}

const randomPoint = (b: RoamBounds, rnd: Rnd): Point =>
  clampToBounds({ x: rnd() * b.width, y: rnd() * b.height }, b);

function pickRest(rnd: Rnd, avoid?: RestMode): RestMode {
  const entries = Object.entries(C.restWeights) as [RestMode, number][];
  let roll = rnd() * entries.reduce((sum, [, w]) => sum + w, 0);
  let picked: RestMode = 'idle';
  for (const [mode, weight] of entries) {
    roll -= weight;
    if (roll < 0) { picked = mode; break; }
  }
  return picked === avoid && picked === 'sleep' ? 'idle' : picked;
}

function startRest(s: RoamState, rnd: Rnd, avoid?: RestMode): RoamState {
  const mode = pickRest(rnd, avoid);
  return { ...s, mode, timer: between(C.rest[mode], rnd), target: null };
}

function startWalk(s: RoamState, b: RoamBounds, rnd: Rnd): RoamState {
  let target = randomPoint(b, rnd);
  for (let i = 0; i < 4 && Math.hypot(target.x - s.x, target.y - s.y) < C.minWalkDistance; i++) target = randomPoint(b, rnd);
  return { ...s, mode: 'walk', target, timer: 0 };
}

export function createRoamState(b: RoamBounds, rnd: Rnd): RoamState {
  const p = randomPoint(b, rnd);
  return startRest({ ...p, facing: 1, mode: 'idle', timer: 0, target: null, resume: 'idle' }, rnd);
}

export function stepRoam(state: RoamState, dt: number, b: RoamBounds, rnd: Rnd): RoamState {
  const s: RoamState = { ...state, ...clampToBounds(state, b) };

  switch (s.mode) {
    case 'held':
      return s;

    case 'hop': {
      const timer = s.timer - dt;
      if (timer > 0) return { ...s, timer };
      if (s.resume === 'walk' && s.target) return { ...s, mode: 'walk', timer: 0 };
      return { ...s, mode: 'idle', timer: between([1, 2.5], rnd), target: null };
    }

    case 'walk': {
      if (!s.target) return startRest(s, rnd);
      const target = clampToBounds(s.target, b);
      const dx = target.x - s.x, dy = target.y - s.y;
      const dist = Math.hypot(dx, dy);
      const step = C.speed * dt;
      if (dist <= step) return startRest({ ...s, ...target, target: null }, rnd);
      return {
        ...s,
        target,
        x: s.x + (dx / dist) * step,
        y: s.y + (dy / dist) * step,
        facing: Math.abs(dx) > 2 ? (dx > 0 ? 1 : -1) : s.facing,
      };
    }

    default: {
      const timer = s.timer - dt;
      if (timer > 0) return { ...s, timer };
      return rnd() < C.walkChanceAfterRest ? startWalk(s, b, rnd) : startRest(s, rnd, s.mode as RestMode);
    }
  }
}

// ── Interaction ──────────────────────────────────────────────

export const pickUp = (s: RoamState): RoamState => ({ ...s, mode: 'held', target: null, resume: 'idle' });

export const moveHeld = (s: RoamState, p: Point, b: RoamBounds): RoamState => ({ ...s, ...clampToBounds(p, b) });

/** Let go: a small landing hop, then carry on. */
export const drop = (s: RoamState): RoamState => ({ ...s, mode: 'hop', timer: C.hopSeconds * 0.6, resume: 'idle', target: null });

/** A click: hop in place, then resume whatever it was doing. */
export function poke(s: RoamState): RoamState {
  if (s.mode === 'held') return s;
  if (s.mode === 'hop') return { ...s, timer: C.hopSeconds };
  return { ...s, mode: 'hop', timer: C.hopSeconds, resume: s.mode === 'walk' ? 'walk' : 'idle' };
}

/** Curl up in place while the pet is asleep (kept until `wake`). */
export const forceSleep = (s: RoamState): RoamState =>
  s.mode === 'sleep' || s.mode === 'held' ? s : { ...s, mode: 'sleep', timer: 1e9, target: null };

export const wake = (s: RoamState): RoamState =>
  s.mode === 'sleep' && s.timer > 1e6 ? { ...s, mode: 'idle', timer: 1.5 } : s;

/** A playful pet takes a few hops toward where you clicked. */
export function hopToward(s: RoamState, p: Point, b: RoamBounds, reach = 48): RoamState {
  const dx = p.x - (s.x + b.size / 2), dy = p.y - (s.y + b.size / 2);
  const dist = Math.hypot(dx, dy) || 1;
  const target = clampToBounds({ x: s.x + (dx / dist) * Math.min(reach, dist), y: s.y + (dy / dist) * Math.min(reach, dist) }, b);
  return { ...s, mode: 'walk', target, timer: 0, facing: dx >= 0 ? 1 : -1 };
}
