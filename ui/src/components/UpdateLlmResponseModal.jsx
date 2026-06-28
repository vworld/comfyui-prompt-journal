import { useState } from 'react';
import { parseStrictJson, validateEnrichedReviewPayload } from '../api/validation';

export default function UpdateLlmResponseModal({ open, onClose, onSubmit }) {
  const [text, setText] = useState('');
  const [errors, setErrors] = useState([]);
  const [submitting, setSubmitting] = useState(false);

  if (!open) return null;

  const handleFileChange = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const content = await file.text();
    setText(content);
    setErrors([]);
    event.target.value = '';
  };

  const handleSubmit = async () => {
    const { value, error: parseError } = parseStrictJson(text);

    if (parseError) {
      setErrors([`Invalid JSON: ${parseError}`]);
      return;
    }

    const { valid, errors: validationErrors } = validateEnrichedReviewPayload(value);

    if (!valid) {
      setErrors(validationErrors);
      return;
    }

    setErrors([]);
    setSubmitting(true);
    try {
      await onSubmit(value);
      setText('');
    } catch (err) {
      setErrors([err.message || 'Failed to save.']);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4">
      <div className="flex max-h-[80vh] w-full max-w-2xl flex-col rounded-lg border border-border bg-panel">
        <div className="flex items-center justify-between border-b border-border px-5 py-3.5">
          <h2 className="text-base font-semibold text-text">Update LLM Response</h2>
          <button
            type="button"
            onClick={onClose}
            className="text-text-faint hover:text-text"
            aria-label="Close"
          >
            ✕
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-4">
          <p className="mb-3 text-[13.5px] text-text-muted">
            Paste the JSON response from the LLM, or upload a <code className="font-mono">.json</code> file. Must
            match the expected schema exactly — no automatic cleanup is applied.
          </p>

          <textarea
            value={text}
            onChange={(event) => setText(event.target.value)}
            placeholder={'{\n  "shot_id": 42,\n  "cleaned_intent": "...",\n  ...\n}'}
            className="h-56 w-full resize-none rounded border border-border bg-bg px-3 py-2 font-mono text-[13px] text-text outline-none placeholder:text-text-faint focus:border-accent-dim"
          />

          <div className="mt-2 flex items-center gap-2">
            <label className="cursor-pointer rounded border border-border-strong px-2.5 py-1.5 text-[12px] font-mono text-text-muted hover:border-accent-dim hover:text-text">
              Upload .json file
              <input type="file" accept=".json" className="hidden" onChange={handleFileChange} />
            </label>
          </div>

          {errors.length > 0 && (
            <div className="mt-3 rounded border border-attention/40 bg-attention/10 px-3 py-2">
              {errors.map((err, i) => (
                <div key={i} className="font-mono text-[12px] text-attention">
                  {err}
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="flex items-center justify-end gap-2 border-t border-border px-5 py-3.5">
          <button
            type="button"
            onClick={onClose}
            className="rounded border border-border px-3.5 py-2 text-[13px] text-text-muted hover:text-text"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={!text.trim() || submitting}
            className="rounded bg-accent px-3.5 py-2 text-[13px] font-semibold text-bg disabled:opacity-50"
          >
            {submitting ? 'Saving…' : 'Save'}
          </button>
        </div>
      </div>
    </div>
  );
}
