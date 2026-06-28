import { useRef, useState } from 'react';

export default function CaptureField({ label, value, onChange, placeholder }) {
  const [focused, setFocused] = useState(false);
  const textareaRef = useRef(null);

  const handleDivClick = () => {
    setFocused(true);
    requestAnimationFrame(() => textareaRef.current?.focus());
  };

  return (
    <div className="flex items-start gap-2.5 border-b border-border px-3.5 py-2 last:border-b-0">
      <span className="w-16 flex-none pt-2 font-mono text-[10.5px] uppercase tracking-wide text-text-faint">
        {label}
      </span>

      <div className="h-16 min-w-0 flex-1">
        {focused ? (
          <textarea
            ref={textareaRef}
            value={value}
            onChange={(event) => onChange(event.target.value)}
            onBlur={() => setFocused(false)}
            placeholder={placeholder}
            autoFocus
            className="h-full w-full resize-none rounded border border-accent-dim bg-panel px-2.5 py-2 text-[15px] leading-relaxed text-text outline-none placeholder:text-text-faint"
          />
        ) : (
          <button
            type="button"
            onClick={handleDivClick}
            className="block h-full w-full overflow-y-auto rounded border border-transparent px-2.5 py-2 text-left text-[15px] leading-relaxed hover:border-border hover:bg-panel"
          >
            {value ? (
              <span className="whitespace-pre-wrap text-text">{value}</span>
            ) : (
              <span className="text-text-faint">{placeholder}</span>
            )}
          </button>
        )}
      </div>
    </div>
  );
}
