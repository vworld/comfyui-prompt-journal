import { mediaKindFromMime } from '../api/transforms';

const KIND_ICON = {
  image: '🖼',
  video: '▶',
  audio: '🎵',
  unknown: '📄',
};

function MediaTile({ asset, onExpand }) {
  const kind = mediaKindFromMime(asset.mime_type);
  const aspectRatio = asset.width && asset.height ? `${asset.width} / ${asset.height}` : '16 / 9';

  if (kind === 'audio') {
    return (
      <button
        type="button"
        onClick={onExpand}
        className="group flex h-full w-28 flex-none flex-col items-center justify-center gap-1.5 rounded-md border border-border bg-gradient-to-br from-panel-raised to-bg p-3 hover:border-accent-dim"
      >
        <span className="text-2xl text-text-muted">{KIND_ICON.audio}</span>
        <span className="w-full truncate px-1 text-center font-mono text-[11px] text-text-muted">
          {asset.file_name}
        </span>
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={onExpand}
      style={{ aspectRatio }}
      className="group relative flex h-full max-w-full items-center justify-center overflow-hidden rounded-md border border-border bg-gradient-to-br from-panel-raised to-bg hover:border-accent-dim"
    >
      <span className="text-3xl text-text-faint group-hover:text-text-muted">{KIND_ICON[kind]}</span>
      <span className="absolute bottom-1.5 right-2 font-mono text-[9px] text-text-faint opacity-0 group-hover:opacity-100">
        ⤢ expand
      </span>
      <span className="absolute inset-x-0 bottom-0 truncate bg-bg/70 px-1.5 py-0.5 font-mono text-[10px] text-text-muted">
        {asset.file_name}
      </span>
    </button>
  );
}

/**
 * @param {{
 *   output: object|null,
 *   inputs: object[],
 *   onExpandMedia: (allAssets: object[], clickedIndex: number) => void,
 * }} props
 */
export default function MediaRow({ output, inputs, onExpandMedia }) {
  const allAssets = output ? [output, ...inputs] : inputs;

  return (
    <div className="flex max-h-72 min-h-44 flex-none gap-px overflow-hidden bg-border">
      {output && (
        <div className="flex flex-[0_0_44%] items-center justify-center bg-panel p-2.5">
          <div className="h-full max-w-full">
            <MediaTile asset={output} onExpand={() => onExpandMedia(allAssets, 0)} />
          </div>
        </div>
      )}

      <div className="flex min-w-0 flex-1 flex-col bg-panel">
        <div className="flex flex-none items-center gap-2 px-2.5 pb-1.5 pt-2 font-mono text-[10px] uppercase tracking-wide text-text-faint">
          <span>Input References</span>
          <span className="rounded-full bg-panel-raised px-1.5 py-0.5 text-text-muted">{inputs.length}</span>
        </div>
        <div className="min-h-0 flex-1 overflow-auto px-2.5 pb-2.5">
          {inputs.length === 0 ? (
            <div className="flex h-full items-center justify-center font-mono text-[11px] text-text-faint">
              No input references
            </div>
          ) : (
            <div className="flex h-full flex-wrap items-start gap-1.5">
              {inputs.map((asset, i) => (
                <div key={asset.id ?? asset.file_name} className="h-full max-h-32">
                  <MediaTile asset={asset} onExpand={() => onExpandMedia(allAssets, output ? i + 1 : i)} />
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
