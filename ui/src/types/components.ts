// ============================================================
// Component Prop Types
// These types define the interface for UI components that
// do not currently exist in the codebase.
// ============================================================

import type { AssetResponse } from "./api/assets";
import type { GenerationUpdateRequest } from "./api/generations";
import type { ShotHierarchicalResponse, ShotSearchResult } from "./api/shots";

// Lightbox slide item
export interface MediaSlide {
  kind: "image" | "video" | "audio" | "unknown";
  src: string;
  title: string;
  width: number | null;
  height: number | null;
}

// Formatted prompt entry used by PromptsAccordion
export interface FormattedPrompt {
  tag: string;
  text: string;
  tone?: "positive" | "negative";
}

// Workflow settings display object
export interface WorkflowSettings {
  resolution?: string;
  fps?: string;
  duration?: string;
  steps?: string;
  cfg?: string;
  sampler?: string;
}

// -------------------------------------------
// DropZone
// -------------------------------------------
export interface DropZoneProps {
  onFileAccepted: (file: File) => void;
  uploadError: string | null;
  setUploadError: (error: string) => void;
}

// -------------------------------------------
// IdentityStrip
// -------------------------------------------
export interface IdentityStripProps {
  shot: ShotHierarchicalResponse | null;
  attemptCount: number | null;
  onSelectShot: () => void;
  onOpenNav: () => void;
}

// -------------------------------------------
// WorkflowAndSettings
// -------------------------------------------
export interface WorkflowAndSettingsProps {
  workflowName: string | null;
  workflowType: string | null;
  modelName: string | null;
  seed: number | null;
  settings: WorkflowSettings;
}

// -------------------------------------------
// MediaRow
// -------------------------------------------
export interface MediaRowProps {
  output: AssetResponse;
  inputs: AssetResponse[];
  onExpandMedia: (assets: AssetResponse[], clickedIndex: number) => void;
}

// -------------------------------------------
// PromptsAccordion
// -------------------------------------------
export interface PromptsAccordionProps {
  prompts: FormattedPrompt[];
}

// -------------------------------------------
// CaptureField
// -------------------------------------------
export interface CaptureFieldProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

// -------------------------------------------
// ActionFooter
// -------------------------------------------
export interface ActionFooterProps {
  shot: ShotHierarchicalResponse | null;
  onSubmit: () => Promise<void>;
  onCopyContext: () => Promise<void>;
  onUpdateLlmResponse: () => void;
  onReset: () => void;
  canSubmit: boolean;
  submitting: boolean;
}

// -------------------------------------------
// MediaLightbox
// -------------------------------------------
export interface MediaLightboxProps {
  open: boolean;
  index: number;
  slides: MediaSlide[];
  onClose: () => void;
}

// -------------------------------------------
// UpdateLlmResponseModal
// -------------------------------------------
export interface UpdateLlmResponseModalProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (generationId: number, payload: GenerationUpdateRequest) => Promise<void>;
}

// -------------------------------------------
// ShotPickerModal
// -------------------------------------------
export interface ShotPickerModalProps {
  open: boolean;
  onClose: () => void;
  onSelect: (shot: ShotSearchResult) => Promise<void>;
}
