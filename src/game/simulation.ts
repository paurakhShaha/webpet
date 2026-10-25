import type { AwaySummary, GameState, Pet } from '@/types';
import { clamp } from '@/utils/format';
import { CARE_CONFIG as C } from './careConfig';

const HOUR = 3_600_000;
const decay = (value: number, amount: number, floor: number) => (value <= floor ? value : Math.max(floor, value - amount));

export interface SimulationReport {
  elapsedMs: number;
  sleptMs: number;
  hungerDelta: number;
  happinessDelta: number;
  energyDelta: number;
  wokeUp: boolean;
}

/**
 * Moves the pet forward to `now`. Pure and timer-free: it works from stored
 * timestamps, so it covers time the browser was closed. Stats are clamped to
 * 0–100 and can't be pushed below gentle floors by time alone.
 */
export function simulatePet(pet: Pet, now: number): { pet: Pet; report: SimulationReport | null } {
  if (now < pet.careUpdatedAt) return { pet: { ...pet, careUpdatedAt: now }, report: null }; // clock went backwards
  const elapsed = Math.min(now - pet.careUpdatedAt, C.maxElapsedMs);
  if (elapsed <= 0) return { pet, report: null };

  let { hunger, happiness, energy, sleep } = pet;
  let hours = elapsed / HOUR;
  let sleptHours = 0;
  let wokeUp = false;

  if (sleep) {
    const hoursToFull = (100 - energy) / C.sleep.energyPerHour;
    const asleep = Math.min(hours, hoursToFull);
    energy = Math.min(100, energy + asleep * C.sleep.energyPerHour);
    hunger = decay(hunger, asleep * C.sleep.hungerPerHour, C.floors.hunger);
    sleptHours = asleep;
    hours -= asleep;
    if (energy >= 100 - 1e-6) { energy = 100; sleep = null; wokeUp = true; }
  }

  if (!sleep && hours > 0) {
    const d = C.decay;
    const penalty = (hunger < d.lowThreshold ? d.hungryPenalty : 0) + (energy < d.lowThreshold ? d.tiredPenalty : 0);
    hunger = decay(hunger, hours * d.hunger, C.floors.hunger);
    energy = decay(energy, hours * d.energy, C.floors.energy);
    happiness = decay(happiness, hours * (d.happiness + penalty), C.floors.happiness);
  }

  const next: Pet = {
    ...pet,
    hunger: clamp(hunger, 0, 100),
    happiness: clamp(happiness, 0, 100),
    energy: clamp(energy, 0, 100),
    sleep,
    careUpdatedAt: now,
  };
  return {
    pet: next,
    report: {
      elapsedMs: elapsed,
      sleptMs: sleptHours * HOUR,
      hungerDelta: next.hunger - pet.hunger,
      happinessDelta: next.happiness - pet.happiness,
      energyDelta: next.energy - pet.energy,
      wokeUp,
    },
  };
}

function mergeSummary(prev: AwaySummary | null, r: SimulationReport, now: number): AwaySummary {
  return {
    awayMs: (prev?.awayMs ?? 0) + r.elapsedMs,
    sleptMs: (prev?.sleptMs ?? 0) + r.sleptMs,
    hungerDelta: (prev?.hungerDelta ?? 0) + r.hungerDelta,
    happinessDelta: (prev?.happinessDelta ?? 0) + r.happinessDelta,
    energyDelta: (prev?.energyDelta ?? 0) + r.energyDelta,
    wokeUp: (prev?.wokeUp ?? false) || r.wokeUp,
    at: now,
  };
}

/**
 * Brings the saved pet up to date. Call when the extension opens and before every action.
 * Returns the same object when there's nothing worth saving.
 */
export function syncCare(state: GameState, now: number): GameState {
  if (!state.pet || (state.phase !== 'pet' && state.phase !== 'intro')) return state;
  const { pet, report } = simulatePet(state.pet, now);
  if (!report && pet === state.pet) return state;
  if (report && report.elapsedMs < C.minSyncMs) return state;
  const summarise = report && report.elapsedMs >= C.awaySummaryMinMs;
  return { ...state, pet, awaySummary: summarise ? mergeSummary(state.awaySummary, report, now) : state.awaySummary };
}

export const dismissAwaySummary = (state: GameState): GameState =>
  state.awaySummary ? { ...state, awaySummary: null } : state;
