# Review Console — Create Page

Fully wired against the real ComfyUI Prompt Journal API (see
`openapi.json` you provided). No more placeholder/dummy data — every
button calls a real endpoint matching the confirmed contract.

## Run it

```
npm install
cp .env.example .env   # adjust VITE_API_BASE_URL if your API isn't on :8000
npm run dev
```

Make sure your FastAPI backend is running and reachable at the URL in
`.env`. Drag any image/video file onto the page — it uploads via
`POST /api/uploads`, and the console populates from the real
`GenerationDetailResponse` returned.

## What's wired to the real API

- **Drop/upload** → `POST /api/uploads` (multipart: file, file_last_modified, file_orig_name)
- **Shot picker** → `GET /api/shots/search?q=` (debounced 200ms)
- **Attempt count badge** → `GET /api/shots/{id}/generations/count`
- **Submit Review** → `PATCH /api/generations/{id}/manual-review`
- **Update LLM Response** → `PATCH /api/generations/{id}` (strict client-side
  validation against `GenerationEnrichedReviewUpdateRequest`'s shape before
  sending — rejects malformed/incomplete JSON with a clear error, no
  auto-cleanup of markdown fences or stray text)
- **Media display** → `<img>`/`<video>`/`<audio>` point directly at
  `GET /api/assets/{id}/file` (range requests work natively for video
  scrubbing, since FastAPI's FileResponse supports them)
- **Copy LLM Context** → assembled client-side from already-loaded
  generation data (no network call — see `buildLlmContext` in
  `src/api/transforms.js`), written to the clipboard as JSON

## Structure

```
src/
├── api/
│   ├── client.js       # fetch wrapper, error handling, FastAPI 422 formatting
│   ├── shots.js         # search, generation count
│   ├── generations.js    # upload, get, manual-review patch, enriched-review patch, asset file URL
│   ├── transforms.js     # derive display data from GenerationDetailResponse (asset splitting, media kind, LLM context assembly)
│   └── validation.js     # strict schema validation for pasted LLM JSON
├── components/        # IdentityStrip, WorkflowAndSettings, MediaRow, PromptsAccordion,
│                       # CaptureField, ActionFooter, DropZone, ShotPickerModal,
│                       # UpdateLlmResponseModal, MediaLightbox
├── pages/
│   └── CreatePage.jsx   # assembles everything, owns all page state
└── styles/
    └── tokens.css        # Tailwind v4 @theme — colors, fonts, the max-w-console cap
```

## Design notes from the last review round

- Page no longer forces a fixed height or disables scrolling — it uses
  `min-h-screen`, so it grows naturally (e.g. with many expanded prompts)
  and scrolls when content genuinely doesn't fit, rather than clipping.
- Primary/readable text is now the default color; muted/faint tones are
  reserved for genuine hints (placeholders, kbd labels), not content
  meant to be read carefully.
- Settings render as solid-color badges (not muted dots) for visual
  muscle-memory — each field type keeps the same color everywhere.
- Workflow name/type/model and the settings badges share one line, with
  seed right-aligned, reclaiming the line the old separate
  "workflow summary" row used.
- Media grid adapts to however many input references exist (no hardcoded
  count), uses real width/height from the API for aspect-correct tiles,
  and gives audio files a distinct (non-broken-image) tile.
- Lightbox (click any media tile) uses `yet-another-react-lightbox` —
  native image/video slides via its video plugin, plus a custom
  `render.slide` audio player since the library has no built-in audio
  slide type.

## Known limitations / next steps

- `models_json` (the model list with LoRA strengths etc.) isn't rendered
  anywhere yet — it exists on `GenerationDetailResponse` but wasn't part
  of the locked layout.
- No handling yet for what happens if `POST /api/uploads` succeeds but
  the file has no embedded ComfyUI metadata at all (the upload endpoint's
  description suggests it validates this server-side and would presumably
  reject with a 422 — the current error display shows whatever message
  the API returns, but hasn't been tested against that exact case).
- The Review/Update page (separate from this Create page, per the design
  decision to keep them as two distinct screens) hasn't been built yet.
- Hierarchy browse/navigation (the ☰ icon in the identity strip) is a
  no-op placeholder — mechanism (sidebar vs modal vs dropdown) was
  explicitly deferred.
