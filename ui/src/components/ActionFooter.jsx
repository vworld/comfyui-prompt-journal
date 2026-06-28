export default function ActionFooter({ onSubmit, onCopyContext, onUpdateLlmResponse, onReset, canSubmit, submitting }) {
  return (
    <div className="flex h-13 flex-none items-center gap-2.5 border-t border-border bg-panel px-3.5">
      <button
        type="button"
        onClick={onSubmit}
        disabled={!canSubmit || submitting}
        className="flex items-center gap-2 rounded-md bg-accent px-4 py-2.5 font-mono text-[13px] font-semibold text-bg hover:brightness-105 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {submitting ? 'Submitting…' : 'Submit Review'}
        <kbd className="rounded border border-black/25 px-1 py-px text-[10px] text-bg/70">⌘↵</kbd>
      </button>

      <button
        type="button"
        onClick={onCopyContext}
        className="rounded-md border border-border bg-panel-raised px-4 py-2.5 font-mono text-[13px] text-text hover:border-border-strong"
      >
        Copy LLM Context
      </button>

      <button
        type="button"
        onClick={onUpdateLlmResponse}
        className="rounded-md border border-border bg-panel-raised px-4 py-2.5 font-mono text-[13px] text-text hover:border-border-strong"
      >
        Update LLM Response
      </button>

      <button
        type="button"
        onClick={onReset}
        className="rounded-md px-3 py-2.5 font-mono text-[13px] text-text-faint hover:text-text-muted"
      >
        Drop another file
      </button>

      <div className="flex-1" />

      <span className="whitespace-nowrap font-mono text-[11px] text-text-faint">
        ⌥S select shot · ⌘↵ submit
      </span>
    </div>
  );
}
