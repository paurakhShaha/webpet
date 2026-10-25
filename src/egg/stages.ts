/** How the egg feels at each stretch of progress. Ordered by `from`. */
const STAGES = [
  { from: 0,  label: 'Cool to the touch' },
  { from: 25, label: 'Faintly warm' },
  { from: 50, label: 'Warm, with a slow pulse' },
  { from: 75, label: 'Restless' },
] as const;

export function getEggStage(progress: number): string {
  let label: string = STAGES[0].label;
  for (const stage of STAGES) if (progress >= stage.from) label = stage.label;
  return label;
}
