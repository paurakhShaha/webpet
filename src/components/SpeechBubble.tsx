export interface Speech {
  key: number;
  text: string;
  narration?: string;
  notice?: string;
}

/** The pet's words, with a small pixel-square tail. */
export function SpeechBubble({ speech }: { speech: Speech }) {
  return (
    <div key={speech.key} role="status" aria-live="polite" className="anim-rise relative max-w-[88%] rounded-md border border-border bg-surface px-3 py-2 text-center shadow-card">
      <p className="text-sm font-semibold leading-snug text-text">{speech.text}</p>
      {speech.narration && <p className="mt-0.5 text-xs italic text-text-muted">{speech.narration}</p>}
      {speech.notice && <p className="mt-1 text-xs font-semibold text-primary-dark">{speech.notice}</p>}
      <span aria-hidden className="absolute -bottom-[5px] left-1/2 size-2.5 -translate-x-1/2 rotate-45 border-b border-r border-border bg-surface" />
    </div>
  );
}
