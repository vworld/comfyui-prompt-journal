const SETTING_BADGES = [
  { key: 'resolution', bg: 'bg-badge-resolution-bg', text: 'text-badge-resolution-text' },
  { key: 'fps', bg: 'bg-badge-fps-bg', text: 'text-badge-fps-text' },
  { key: 'duration', bg: 'bg-badge-duration-bg', text: 'text-badge-duration-text' },
  { key: 'steps', bg: 'bg-badge-steps-bg', text: 'text-badge-steps-text' },
  { key: 'cfg', bg: 'bg-badge-cfg-bg', text: 'text-badge-cfg-text' },
  { key: 'sampler', bg: 'bg-badge-sampler-bg', text: 'text-badge-sampler-text' },
];

export default function WorkflowAndSettings({ workflowName, workflowType, modelName, seed, settings }) {
  return (
    <div className="flex flex-none flex-wrap items-center justify-between gap-x-6 gap-y-2 border-b border-border bg-panel px-3.5 py-2">
      <div className="flex flex-none items-center gap-2 whitespace-nowrap font-mono text-[13px] text-text-muted">
        <span className="font-semibold text-text">{workflowName}</span>
        <span className="text-text-faint">|</span>
        <span>{workflowType}</span>
        <span className="text-text-faint">|</span>
        <span>{modelName}</span>
      </div>

      <div className="flex flex-wrap items-center gap-1.5">
        {SETTING_BADGES.map(({ key, bg, text }) => {
          const value = settings?.[key];
          if (value == null || value === '') return null;
          return (
            <span
              key={key}
              className={`whitespace-nowrap rounded-full px-2.5 py-1 font-mono text-[12.5px] font-medium ${bg} ${text}`}
            >
              {value}
            </span>
          );
        })}
      </div>

      <div className="flex-none whitespace-nowrap font-mono text-[13px] font-medium text-text">
        Seed: {seed}
      </div>
    </div>
  );
}
