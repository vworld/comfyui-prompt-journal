export default function IdentityStrip({ shot, attemptCount, onSelectShot, onOpenNav }) {
  return (
    <div className="flex h-11 flex-none items-center gap-3.5 border-b border-border bg-panel px-3.5 font-mono text-[13px]">
      <button
        type="button"
        onClick={onOpenNav}
        aria-label="Open navigation"
        title="Browse projects / shots"
        className="flex size-7 flex-none items-center justify-center rounded border border-border text-text-muted hover:border-accent-dim hover:text-text"
      >
        ☰
      </button>

      <span className="flex-none whitespace-nowrap border-r border-border pr-3.5 text-[11px] font-semibold uppercase tracking-wide text-text-faint">
        Review Console
      </span>

      <button
        type="button"
        onClick={onSelectShot}
        className="flex flex-none items-center gap-2 whitespace-nowrap rounded bg-attention px-2.5 py-1.5 text-[12px] font-semibold text-bg hover:brightness-110"
      >
        {shot ? 'Change Shot' : 'Select Shot'}
        <kbd className="rounded bg-black/20 px-1 py-px text-[10px] font-normal">⌥S</kbd>
      </button>

      <div className="flex min-w-0 items-center gap-2 overflow-hidden whitespace-nowrap text-text-muted">
        {shot ? (
          <>
            <span className="text-text-faint">/</span>
            <span>{shot.projectName}</span>
            <span className="text-text-faint">→</span>
            <span>{shot.sceneName}</span>
            <span className="text-text-faint">→</span>
            <span>{shot.clipName}</span>
            <span className="text-text-faint">→</span>
            <b className="font-semibold text-text">{shot.shotName}</b>
          </>
        ) : (
          <span className="text-text-faint">No shot selected yet</span>
        )}
      </div>

      {shot && attemptCount != null && (
        <span className="ml-auto flex-none whitespace-nowrap rounded-full border border-border bg-panel-raised px-2.5 py-0.5 text-[11.5px] text-text-muted">
          Attempt #{attemptCount + 1} for this shot
        </span>
      )}
    </div>
  );
}
