import { useEffect, useRef, useState } from 'react';
import { searchShots } from '../api/shots';
import { ApiError } from '../api/client';

const DEBOUNCE_MS = 200;

export default function ShotPickerModal({ open, onClose, onSelect }) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const debounceRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    if (open) {
      setQuery('');
      setResults([]);
      setError(null);
      requestAnimationFrame(() => inputRef.current?.focus());
    }
  }, [open]);

  useEffect(() => {
    if (!open) return;

    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await searchShots(query);
        setResults(data);
      } catch (err) {
        setError(err instanceof ApiError ? err.message : 'Search failed.');
        setResults([]);
      } finally {
        setLoading(false);
      }
    }, DEBOUNCE_MS);

    return () => clearTimeout(debounceRef.current);
  }, [query, open]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/60 px-4 pt-24">
      <div className="flex max-h-[70vh] w-full max-w-xl flex-col rounded-lg border border-border bg-panel">
        <div className="flex items-center gap-2 border-b border-border px-4 py-3">
          <span className="text-text-faint">🔍</span>
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search shots by name, project, scene, clip…"
            className="flex-1 bg-transparent text-[14px] text-text outline-none placeholder:text-text-faint"
          />
          <button type="button" onClick={onClose} className="text-text-faint hover:text-text">
            ✕
          </button>
        </div>

        <div className="flex-1 overflow-y-auto">
          {loading && <div className="px-4 py-3 font-mono text-[12.5px] text-text-faint">Searching…</div>}

          {error && <div className="px-4 py-3 font-mono text-[12.5px] text-attention">{error}</div>}

          {!loading && !error && results.length === 0 && (
            <div className="px-4 py-3 font-mono text-[12.5px] text-text-faint">
              {query ? 'No matching shots.' : 'Type to search.'}
            </div>
          )}

          {results.map((shot) => (
            <button
              key={shot.shot_id}
              type="button"
              onClick={() =>
                onSelect({
                  shot_id: shot.shot_id,
                  shotName: shot.shot_name,
                  projectName: shot.project_name,
                  sceneName: shot.scene_name,
                  clipName: shot.clip_name,
                })
              }
              className="flex w-full flex-col gap-0.5 border-b border-border px-4 py-2.5 text-left hover:bg-panel-raised"
            >
              <span className="text-[14px] text-text">{shot.shot_name}</span>
              <span className="font-mono text-[11.5px] text-text-muted">
                {shot.project_name} → {shot.scene_name} → {shot.clip_name}
              </span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
