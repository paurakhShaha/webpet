// Styles for the roaming pet, isolated in a shadow root.
// The page has no access to our design tokens, so the few colours used here
// mirror src/assets/tokens.css (surface, border, text, shadow — light and dark).
export const ROAM_CSS = `
:host { all: initial; }
.pet {
  --surface: #fffdf8; --border: #e8e0d4; --text: #3f3a34; --shadow: rgba(63, 58, 52, 0.18);
  position: absolute; left: 0; top: 0;
  pointer-events: auto; touch-action: none; user-select: none; -webkit-user-select: none;
  cursor: grab; will-change: transform;
}
@media (prefers-color-scheme: dark) {
  .pet { --surface: #29332e; --border: #3c4942; --text: #f4f0e7; --shadow: rgba(0, 0, 0, 0.4); }
}
.pet.held { cursor: grabbing; }
.sprite { position: absolute; inset: 0; }
canvas { display: block; image-rendering: pixelated; image-rendering: crisp-edges; }
.shadow {
  position: absolute; left: 50%; bottom: 3%; height: 6%; width: 52%;
  transform: translateX(-50%); border-radius: 50%; background: var(--shadow);
}
.bubble {
  position: absolute; bottom: 100%; left: 50%; transform: translateX(-50%);
  margin-bottom: 2px; padding: 3px 9px; white-space: nowrap;
  font: 600 12px/1.3 ui-rounded, system-ui, -apple-system, "Segoe UI", sans-serif;
  color: var(--text); background: var(--surface); border: 1px solid var(--border);
  border-radius: 8px; box-shadow: 0 2px 8px var(--shadow); pointer-events: none;
}
.zzz {
  position: absolute; left: 70%; top: 4%; pointer-events: none;
  font: 700 13px/1 ui-rounded, system-ui, sans-serif; color: var(--text); opacity: 0.7;
  animation: zzz 2.4s steps(6, end) infinite;
}
.heart { position: absolute; top: 4%; pointer-events: none; animation: heart 1s steps(8, end) forwards; }
@keyframes zzz { 0% { transform: translate(0, 0); opacity: 0 } 30% { opacity: 0.8 } 100% { transform: translate(8px, -16px); opacity: 0 } }
@keyframes heart { 0% { transform: translateY(0); opacity: 1 } 100% { transform: translateY(-36px); opacity: 0 } }
@media (prefers-reduced-motion: reduce) { .zzz, .heart { animation-duration: 0.001ms; } }
`;
