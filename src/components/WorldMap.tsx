import { Lock, Sparkles } from 'lucide-react';
import { useMemo } from 'react';
import type { GameState, Season, WorldNow } from '@/types';
import { REGIONS, regionRank, regionStatus, type RegionDefinition } from '@/world/regions';
import type { WorldEventInstance } from '@/world/events';
import { regionIcon } from './worldIcons';

// ── The illustrated map ──────────────────────────────────────
// Drawn from plain shapes in the design tokens (so it follows light/dark), with the season, time of day and
// weather layered on top. Everything that moves is slow and optional.

const T = (name: string) => `var(--color-${name})`;
const SEASON_TINT: Record<Season, string> = { spring: T('primary'), summer: T('accent-yellow'), autumn: T('hunger'), winter: T('accent-blue') };
const LAND = 'M8 38 C6 24 20 14 34 12 C48 10 58 12 70 10 C84 8 94 20 94 36 C96 50 96 62 92 74 C88 88 74 96 60 96 C52 96 50 104 40 104 C28 104 20 96 16 86 C10 74 10 54 8 38 Z';

/** Fixed pseudo-random spots so rain, snow and stars don't jump around between renders. */
const spots = (n: number, seed: number) => Array.from({ length: n }, (_, i) => ({
  x: ((i * 37 + seed * 11) % 100), y: ((i * 53 + seed * 7) % 118), d: ((i * 29 + seed) % 10) / 10,
}));
const RAIN = spots(26, 3);
const SNOW = spots(30, 5);
const STARS = spots(22, 9);

/** Time-of-day tint, stars and weather, drawn inside any 100×120 SVG. Reused over the map and the pet's stage. */
export function WeatherLayer({ world }: { world: WorldNow }) {
  const { time, weather } = world;
  const night = time === 'night';
  return (
    <g>
      {/* Time of day */}
      {time === 'morning' && <rect width="100" height="120" fill={T('accent-yellow')} fillOpacity="0.1" />}
      {time === 'evening' && <rect width="100" height="120" fill={T('secondary-hover')} fillOpacity="0.2" />}
      {night && (
        <>
          <rect width="100" height="120" fill={T('element-shadow')} fillOpacity="0.4" />
          {STARS.map((s, i) => <rect key={i} className="anim-twinkle" style={{ animationDelay: `${s.d * 2}s` }} x={s.x} y={s.y * 0.5} width="0.9" height="0.9" fill={T('accent-yellow')} />)}
        </>
      )}

      {/* Weather */}
      {weather === 'storm' && <rect width="100" height="120" fill={T('text')} fillOpacity="0.14" />}
      {(weather === 'rain' || weather === 'storm') && RAIN.map((r, i) => (
        <line key={i} className="map-rain" style={{ animationDelay: `-${r.d * 1.1}s` }} x1={r.x} y1="0" x2={r.x - 0.8} y2="3.2" stroke={T('info')} strokeOpacity="0.7" strokeWidth="0.35" />
      ))}
      {weather === 'snow' && SNOW.map((r, i) => <circle key={i} className="map-snow" style={{ animationDelay: `-${r.d * 7}s` }} cx={r.x} cy="0" r="0.6" fill={T('surface')} />)}
      {weather === 'fog' && [22, 55, 86].map((y, i) => (
        <g key={i} className="map-fog" style={{ animationDelay: `-${i * 3}s` }}><rect x="-10" y={y} width="120" height="14" rx="7" fill={T('surface')} fillOpacity="0.5" /></g>
      ))}
    </g>
  );
}

export function MapArt({ world, riftRevealed }: { world: WorldNow; riftRevealed: boolean }) {
  const { season } = world;
  return (
    <svg viewBox="0 0 100 120" className="absolute inset-0 h-full w-full" role="img" aria-label="Illustrated map of the world" preserveAspectRatio="xMidYMid slice">
      <rect width="100" height="120" fill={T('accent-blue')} fillOpacity="0.32" />
      {[[10, 112], [74, 108], [88, 90], [4, 20], [92, 112], [58, 114]].map(([x, y], i) => (
        <path key={i} className="map-wave" style={{ animationDelay: `${i * 0.7}s` }} d={`M${x} ${y} q2 -1.4 4 0 t4 0 t4 0`} fill="none" stroke={T('accent-blue')} strokeWidth="0.7" strokeLinecap="round" />
      ))}

      {/* Land, with the season painted over it */}
      <path d={LAND} fill={T('background-alt')} stroke={T('border-hover')} strokeWidth="0.6" />
      <path d={LAND} fill={SEASON_TINT[season]} fillOpacity="0.17" />

      {/* Regions */}
      <ellipse cx="19" cy="45" rx="15" ry="18" fill={T('primary')} fillOpacity="0.35" />
      <ellipse cx="36" cy="23" rx="15" ry="10" fill={T('accent-purple')} fillOpacity="0.3" />
      <ellipse cx="66" cy="20" rx="15" ry="11" fill={T('text-disabled')} fillOpacity="0.3" />
      <ellipse cx="79" cy="50" rx="13" ry="14" fill={T('element-earth')} fillOpacity="0.28" />
      <ellipse cx="47" cy="54" rx="14" ry="11" fill={T('secondary')} fillOpacity="0.38" />
      <ellipse cx="40" cy="82" rx="18" ry="10" fill={T('accent-blue')} fillOpacity="0.42" />

      {/* Paths */}
      <g fill="none" stroke={T('border-hover')} strokeWidth="0.7" strokeDasharray="1.2 1.6" strokeLinecap="round">
        <path d="M47 54 Q30 52 19 45" /><path d="M47 54 Q40 38 36 23" /><path d="M47 54 Q64 55 79 50" /><path d="M47 54 Q43 68 40 81" />
        <path d="M36 23 Q50 16 66 20" /><path d="M79 50 Q76 32 66 20" /><path d="M66 20 Q78 10 85 8" strokeOpacity="0.5" />
      </g>

      {/* Forest: trees */}
      {[[10, 38], [15, 33], [22, 36], [13, 46], [20, 50], [9, 54], [26, 46], [17, 58]].map(([x, y], i) => (
        <g key={i}><rect x={x - 0.4} y={y + 1} width="0.8" height="2" fill={T('element-earth')} /><circle cx={x} cy={y} r="2.6" fill={season === 'autumn' ? T('hunger') : season === 'winter' ? T('surface') : T('primary-dark')} /><circle cx={x - 0.6} cy={y - 0.6} r="1.2" fill={season === 'autumn' ? T('warning') : T('primary')} fillOpacity="0.8" /></g>
      ))}
      {/* Mine: crystals */}
      {[[30, 24, 2.4], [35, 20, 3], [41, 25, 2.2], [37, 28, 1.8]].map(([x, y, r], i) => (
        <path key={i} d={`M${x} ${y - r} l${r * 0.6} ${r} l${-r * 0.6} ${r} l${-r * 0.6} ${-r} Z`} fill={T('accent-purple')} stroke={T('element-shadow')} strokeWidth="0.3" />
      ))}
      {/* Peaks */}
      {[[60, 24, 7], [67, 20, 9], [74, 24, 6]].map(([x, y, w], i) => (
        <g key={i}><path d={`M${x - w / 2} ${y + 4} L${x} ${y - w * 0.7} L${x + w / 2} ${y + 4} Z`} fill={T('text-muted')} fillOpacity="0.7" /><path d={`M${x - w * 0.16} ${y - w * 0.4} L${x} ${y - w * 0.7} L${x + w * 0.16} ${y - w * 0.4} Z`} fill={T('surface')} /></g>
      ))}
      {/* Ruins: broken columns */}
      {[[74, 48, 5], [79, 46, 7], [84, 49, 4], [79, 55, 3]].map(([x, y, h], i) => (
        <rect key={i} x={x - 1} y={y} width="2" height={h} fill={T('element-earth')} stroke={T('border-hover')} strokeWidth="0.3" />
      ))}
      {/* Village: houses and chimney smoke */}
      {[[43, 55], [48, 52], [52, 56]].map(([x, y], i) => (
        <g key={i}><rect x={x - 2} y={y} width="4" height="3" fill={T('surface')} stroke={T('border-hover')} strokeWidth="0.3" /><path d={`M${x - 2.6} ${y} L${x} ${y - 2.4} L${x + 2.6} ${y} Z`} fill={T('secondary-hover')} /></g>
      ))}
      {[0, 1, 2].map((i) => <circle key={i} className="map-smoke" style={{ animationDelay: `${i}s` }} cx="48.6" cy="49" r="0.9" fill={T('surface')} />)}
      {/* Coast: lanterns under the water */}
      {[[33, 82], [40, 85], [47, 81]].map(([x, y], i) => <circle key={i} cx={x} cy={y} r="0.9" fill={T('warning')} className="map-wave" style={{ animationDelay: `${i * 0.9}s` }} />)}

      {/* The Rift floats over the corner of the map */}
      <g>
        <ellipse cx="85" cy="9" rx="9" ry="4.4" fill={T('accent-purple')} fillOpacity="0.55" stroke={T('element-shadow')} strokeWidth="0.4" />
        {[[81, 8], [85, 5], [89, 9], [86, 11]].map(([x, y], i) => <rect key={i} className="anim-twinkle" style={{ animationDelay: `${i * 0.4}s` }} x={x} y={y} width="1" height="1" fill={T('accent-yellow')} />)}
        {!riftRevealed && <><ellipse cx="85" cy="9" rx="11" ry="6" fill={T('surface')} fillOpacity="0.92" /><text x="85" y="11.2" textAnchor="middle" fontSize="6" fill={T('text-muted')} fontWeight="700">?</text></>}
      </g>

      {/* Clouds */}
      {[[8, 12, 0], [20, 98, 25], [40, 70, 48]].map(([x, y, delay], i) => (
        <g key={i} className="map-cloud" style={{ animationDelay: `-${delay}s` }}>
          <ellipse cx={x} cy={y} rx="6" ry="2.2" fill={T('surface')} fillOpacity="0.85" /><ellipse cx={x + 3} cy={y - 1.4} rx="3.6" ry="2" fill={T('surface')} fillOpacity="0.85" />
        </g>
      ))}

      <WeatherLayer world={world} />
    </svg>
  );
}

// ── Region markers ───────────────────────────────────────────

interface Props {
  game: GameState;
  world: WorldNow;
  events: WorldEventInstance[];
  onOpen: (r: RegionDefinition) => void;
}

export function WorldMap({ game, world, events, onOpen }: Props) {
  const riftRevealed = useMemo(() => {
    const rift = REGIONS.find((r) => r.id === 'rift')!;
    return regionStatus(game, rift).revealed;
  }, [game]);

  return (
    <div className="relative aspect-[5/6] w-full overflow-hidden rounded-xl border border-border bg-surface shadow-card" data-season={world.season}>
      <MapArt world={world} riftRevealed={riftRevealed} />
      {REGIONS.map((r) => {
        const st = regionStatus(game, r);
        const Icon = regionIcon(r.icon);
        const rank = st.open ? regionRank(game, r.id) : null;
        const fresh = st.open && r.id !== 'village' && r.id !== 'forest' && !game.world.regionsSeen.includes(r.id);
        const happening = events.some((e) => e.region === r.id);
        const unknown = !st.revealed;
        const side = r.position.x > 68 ? 'right-0' : r.position.x < 32 ? 'left-0' : 'left-1/2 -translate-x-1/2';
        const need = st.requirements.filter((q) => !q.met);
        return (
          <div key={r.id} className="group absolute z-10 -translate-x-1/2 -translate-y-1/2" style={{ left: `${r.position.x}%`, top: `${r.position.y / 1.2}%` }}>
            <button
              onClick={() => onOpen(r)}
              aria-label={unknown ? 'An unknown place' : `${r.name}${st.open ? '' : ' (locked)'}`}
              className="flex flex-col items-center gap-0.5 outline-offset-4"
            >
              <span className={`relative grid size-[42px] place-items-center rounded-lg border-2 shadow-card transition ${fresh ? 'map-node-new' : ''} ${
                st.open ? 'border-border-selected bg-surface text-primary-dark hover:bg-surface-hover' : 'border-dashed border-border-hover bg-background-alt text-text-disabled'
              }`}>
                {unknown ? <span className="text-lg font-bold">?</span> : st.open ? <Icon size={20} aria-hidden /> : <Lock size={16} aria-hidden />}
                {fresh && <span className="absolute -right-2 -top-2 rounded-sm bg-secondary px-1 text-[9px] font-bold text-text-on-secondary">New</span>}
                {happening && <span className="absolute -left-1.5 -top-1.5 grid size-4 place-items-center rounded-sm bg-accent-yellow text-text"><Sparkles size={10} aria-hidden /></span>}
              </span>
              <span className="max-w-[84px] rounded-sm bg-surface/90 px-1 text-center text-[10px] font-bold leading-tight text-text">{unknown ? 'Unknown' : r.name}</span>
              <span className="h-1 w-9 overflow-hidden rounded-sm bg-surface-active" aria-hidden>
                <span className="block h-full rounded-sm" style={{ width: `${Math.round((st.open ? rank!.progress : st.progress) * 100)}%`, background: st.open ? T('primary') : T('warning') }} />
              </span>
            </button>
            <div role="tooltip" className={`pointer-events-none absolute bottom-full z-30 mb-2 w-44 rounded-lg border border-border bg-surface p-2.5 text-left opacity-0 shadow-raised transition group-focus-within:opacity-100 group-hover:opacity-100 ${side}`}>
              <p className="text-xs font-bold text-text">{unknown ? 'Something strange in the sky…' : r.name}</p>
              {!unknown && <p className="mt-0.5 text-[11px] leading-snug text-text-muted">{r.tagline}</p>}
              {!unknown && st.open && rank && <p className="mt-1 text-[11px] font-semibold text-text">{rank.rank} · {rank.trips} {rank.trips === 1 ? 'trip' : 'trips'}</p>}
              {!unknown && !st.open && need.slice(0, 2).map((q) => <p key={q.label} className="mt-1 text-[11px] text-text">&bull; {q.label}{q.target ? ` (${q.current ?? 0}/${q.target})` : ''}</p>)}
            </div>
          </div>
        );
      })}
    </div>
  );
}
