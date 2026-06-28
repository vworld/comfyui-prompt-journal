import { useState } from 'react';

function PromptItem({ tag, text, tone, defaultOpen }) {
  const [open, setOpen] = useState(defaultOpen);

  const tagColor = tone === 'negative' ? 'text-attention' : 'text-accent';

  return (
    <div className="overflow-hidden rounded-md border border-border">
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        aria-expanded={open}
        className="flex w-full items-center gap-2.5 bg-panel-raised px-3 py-2 text-left text-[13px] text-text-muted"
      >
        <span className={`flex-none font-mono text-[10.5px] uppercase tracking-wide ${tagColor}`}>{tag}</span>
        {!open && <span className="min-w-0 flex-1 truncate text-text-muted">{text}</span>}
        <span
          className={`ml-auto flex-none text-[10px] text-text-faint transition-transform ${open ? 'rotate-90' : ''}`}
        >
          ▸
        </span>
      </button>
      {open && (
        <div className="whitespace-pre-wrap border-t border-border px-3.5 py-3 text-[15px] leading-relaxed text-text">
          {text}
        </div>
      )}
    </div>
  );
}

/**
 * @param {{ prompts: Array<{ tag: string, text: string, tone?: string }> }} props
 */
export default function PromptsAccordion({ prompts }) {
  return (
    <div className="flex-none bg-panel">
      <div className="flex items-center justify-between px-3.5 pb-1.5 pt-2 font-mono text-[10px] uppercase tracking-wide text-text-faint">
        <span>Prompts</span>
        <span className="rounded-full bg-panel-raised px-1.5 py-0.5 text-text-muted">{prompts.length}</span>
      </div>
      <div className="flex flex-col gap-1.5 px-2.5 pb-2.5">
        {prompts.map((prompt, index) => (
          <PromptItem
            key={`${prompt.tag}-${index}`}
            tag={prompt.tag}
            text={prompt.text}
            tone={prompt.tone}
            defaultOpen={index === 0}
          />
        ))}
      </div>
    </div>
  );
}
