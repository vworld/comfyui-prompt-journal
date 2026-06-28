import { useState } from 'react';
import DropZone from '../components/DropZone';
import IdentityStrip from '../components/IdentityStrip';
import WorkflowAndSettings from '../components/WorkflowAndSettings';
import MediaRow from '../components/MediaRow';
import PromptsAccordion from '../components/PromptsAccordion';
import CaptureField from '../components/CaptureField';
import ActionFooter from '../components/ActionFooter';
import MediaLightbox from '../components/MediaLightbox';
import UpdateLlmResponseModal from '../components/UpdateLlmResponseModal';
import ShotPickerModal from '../components/ShotPickerModal';

import { uploadGeneration, updateManualReview, updateEnrichedReview, assetFileUrl } from '../api/generations';
import { getShotGenerationCount } from '../api/shots';
import { splitAssets, mediaKindFromMime, buildLlmContext } from '../api/transforms';
import { ApiError } from '../api/client';

function formatSettings(generation) {
  const settings = {};
  if (generation.output_width && generation.output_height) {
    settings.resolution = `${generation.output_width}\u00d7${generation.output_height}`;
  }
  if (generation.fps) settings.fps = `${generation.fps} fps`;
  if (generation.duration_seconds) settings.duration = `${generation.duration_seconds.toFixed?.(2) ?? generation.duration_seconds}s`;
  if (generation.steps) settings.steps = `${generation.steps} steps`;
  if (generation.cfg != null) settings.cfg = `cfg ${generation.cfg}`;
  if (generation.sampler || generation.scheduler) {
    settings.sampler = [generation.sampler, generation.scheduler].filter(Boolean).join(' / ');
  }
  return settings;
}

function formatPrompts(generation) {
  const prompts = generation.all_prompts_json;
  if (Array.isArray(prompts) && prompts.length > 0) {
    return prompts
      .filter((p) => p.text)
      .map((p) => ({
        tag: p.title || p.role || 'Prompt',
        text: p.text,
        tone: p.role === 'negative' ? 'negative' : undefined,
      }));
  }
  // Fallback for older/simpler generations with only prompt/negative_prompt set.
  const fallback = [];
  if (generation.prompt) fallback.push({ tag: 'Positive', text: generation.prompt, tone: 'positive' });
  if (generation.negative_prompt) fallback.push({ tag: 'Negative', text: generation.negative_prompt, tone: 'negative' });
  return fallback;
}

export default function CreatePage() {
  const [stage, setStage] = useState('idle'); // idle | uploading | ready
  const [droppedFile, setDroppedFile] = useState(null);
  const [generation, setGeneration] = useState(null);
  const [uploadError, setUploadError] = useState(null);

  const [shot, setShot] = useState(null);
  const [attemptCount, setAttemptCount] = useState(null);
  const [intent, setIntent] = useState('');
  const [review, setReview] = useState('');

  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState(null);

  const [shotPickerOpen, setShotPickerOpen] = useState(false);
  const [llmModalOpen, setLlmModalOpen] = useState(false);
  const [lightbox, setLightbox] = useState(null); // { slides, index } | null

  const handleFileAccepted = async (file) => {
    setDroppedFile(file);
    setUploadError(null);
    setStage('uploading');

    try {
      const result = await uploadGeneration(file);
      setGeneration(result);
      setIntent(result.raw_intent || '');
      setReview(result.raw_review || '');
      setStage('ready');
    } catch (err) {
      setUploadError(err instanceof ApiError ? err.message : 'Upload failed.');
      setStage('idle');
    }
  };

  const handleReset = () => {
    setStage('idle');
    setDroppedFile(null);
    setGeneration(null);
    setUploadError(null);
    setShot(null);
    setAttemptCount(null);
    setIntent('');
    setReview('');
    setSubmitError(null);
  };

  const handleShotSelected = async (selectedShot) => {
    setShot(selectedShot);
    setShotPickerOpen(false);
    try {
      const count = await getShotGenerationCount(selectedShot.shot_id);
      setAttemptCount(count);
    } catch {
      setAttemptCount(null);
    }
  };

  const handleExpandMedia = (assets, clickedIndex) => {
    const slides = assets.map((asset) => ({
      kind: mediaKindFromMime(asset.mime_type),
      src: assetFileUrl(asset.id),
      title: asset.file_name,
      width: asset.width,
      height: asset.height,
    }));
    setLightbox({ slides, index: clickedIndex });
  };

  const handleSubmit = async () => {
    if (!shot || !generation) return;
    setSubmitting(true);
    setSubmitError(null);
    try {
      const updated = await updateManualReview(generation.id, {
        shot_id: shot.shot_id,
        raw_intent: intent,
        raw_review: review,
      });
      setGeneration(updated);
    } catch (err) {
      setSubmitError(err instanceof ApiError ? err.message : 'Submit failed.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleCopyContext = async () => {
    if (!generation) return;
    const context = buildLlmContext(generation, { rawIntent: intent, rawReview: review });
    await navigator.clipboard.writeText(JSON.stringify(context, null, 2));
  };

  const handleUpdateLlmResponse = async (payload) => {
    const updated = await updateEnrichedReview(generation.id, payload);
    setGeneration(updated);
    setLlmModalOpen(false);
  };

  if (stage === 'idle') {
    return (
      <div className="flex h-screen min-h-screen justify-center overflow-hidden bg-[#0e0f11]">
        <div className="flex h-full w-full max-w-console flex-col overflow-hidden border-x border-border bg-bg">
          <DropZone onFileAccepted={handleFileAccepted} />
          {uploadError && (
            <div className="border-t border-border bg-panel px-4 py-3 font-mono text-[12.5px] text-attention">
              {uploadError}
            </div>
          )}
        </div>
      </div>
    );
  }

  if (stage === 'uploading') {
    return (
      <div className="flex h-screen min-h-screen justify-center overflow-hidden bg-[#0e0f11]">
        <div className="flex h-full w-full max-w-console flex-col items-center justify-center gap-4 border-x border-border bg-bg font-mono text-[13px] text-text-muted">
          <div className="size-7 animate-spin rounded-full border-2 border-border-strong border-t-accent" />
          <div>Uploading and reading metadata from {droppedFile?.name}…</div>
        </div>
      </div>
    );
  }

  const { output, input } = splitAssets(generation);
  const outputAsset = output[0]?.asset;
  const inputAssets = input.map((a) => a.asset);

  return (
    <div className="flex min-h-screen justify-center bg-[#0e0f11]">
      <div className="flex w-full max-w-console flex-col border-x border-border bg-bg">
        <IdentityStrip
          shot={shot}
          attemptCount={attemptCount}
          onSelectShot={() => setShotPickerOpen(true)}
          onOpenNav={() => {}}
        />

        <WorkflowAndSettings
          workflowName={generation.workflow_name}
          workflowType={generation.workflow_type}
          modelName={generation.primary_model_name}
          seed={generation.seed}
          settings={formatSettings(generation)}
        />

        {outputAsset && (
          <MediaRow output={outputAsset} inputs={inputAssets} onExpandMedia={handleExpandMedia} />
        )}

        <PromptsAccordion prompts={formatPrompts(generation)} />

        <div className="flex-none border-t border-border bg-panel">
          <CaptureField
            label="Intent"
            value={intent}
            onChange={setIntent}
            placeholder="What was this generation trying to achieve?"
          />
          <CaptureField
            label="Review"
            value={review}
            onChange={setReview}
            placeholder="How did it turn out? Note anything that needs a regen."
          />
        </div>

        {submitError && (
          <div className="flex-none border-t border-border bg-panel px-4 py-2 font-mono text-[12.5px] text-attention">
            {submitError}
          </div>
        )}

        <ActionFooter
          onSubmit={handleSubmit}
          onCopyContext={handleCopyContext}
          onUpdateLlmResponse={() => setLlmModalOpen(true)}
          onReset={handleReset}
          canSubmit={Boolean(shot)}
          submitting={submitting}
        />
      </div>

      <ShotPickerModal
        open={shotPickerOpen}
        onClose={() => setShotPickerOpen(false)}
        onSelect={handleShotSelected}
      />

      <UpdateLlmResponseModal
        open={llmModalOpen}
        onClose={() => setLlmModalOpen(false)}
        onSubmit={handleUpdateLlmResponse}
      />

      {lightbox && (
        <MediaLightbox
          open
          index={lightbox.index}
          slides={lightbox.slides}
          onClose={() => setLightbox(null)}
        />
      )}
    </div>
  );
}
