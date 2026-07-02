import { BookCopy, FileBracesCorner } from "lucide-react";
import { useState } from "react";

import type { UseGenerationState } from "@/components/generations/use-generation-state";

import { validateEnrichedReviewPayload } from "@/api/validation";
import { JsonImportPanel } from "@/components/generations/footer/JsonImportDialog";
import { JsonViewerDialog } from "@/components/generations/footer/JsonViewerDialog";
import { Button } from "@/components/ui/button";
import { HoverCard, HoverCardContent, HoverCardTrigger } from "@/components/ui/hover-card";

function validatePastedJson(json: unknown): string[] | null {
  const validation = validateEnrichedReviewPayload(json);
  if (!validation.valid) return validation.errors;
  return null;
}

export default function ManualLLM({
  llmContext,
}: Readonly<{
  llmContext: UseGenerationState["llmContext"];
}>) {
  const [openLLMContextModal, setOpenLLMContextModal] = useState(false);
  const [openLLMResponseModal, setOpenLLMResponseModal] = useState(false);
  const [llmContextObj, setLlmContextObj] = useState<Awaited<
    ReturnType<(typeof llmContext)["getLLMContext"]>
  > | null>(null);

  async function openViewModal() {
    setLlmContextObj((await llmContext.getLLMContext()) ?? null);
    setOpenLLMContextModal(true);
  }

  return (
    <>
      {/* Copy LLM Context */}
      <HoverCard>
        <HoverCardTrigger>
          <Button variant="ghost" size="icon" onClick={() => void llmContext.copyLLMContext()}>
            <BookCopy className="size-4.5 text-muted-foreground" />
          </Button>
        </HoverCardTrigger>
        <HoverCardContent className="w-fit flex-col gap-0.5">
          <div className="mb-2">
            <span>Copy LLM Context</span>
            <Button variant="link" onClick={() => void openViewModal()}>
              Open in popup
            </Button>
          </div>
          <div>For manually copying context to an LLM chart.</div>
        </HoverCardContent>
      </HoverCard>

      {/* Paste LLM Response */}

      <HoverCard>
        <HoverCardTrigger>
          <Button variant="ghost" size="icon" onClick={() => setOpenLLMResponseModal(true)}>
            <FileBracesCorner className="size-4.5 text-muted-foreground" />
          </Button>
        </HoverCardTrigger>
        <HoverCardContent className="flex-col gap-0.5 w-fit">
          <div className="mb-2">Paste LLM Response</div>
          <div className="mb-1">
            For importing LLM response after manual processing of LLM Context.
          </div>
          <div>The response has to be json and should match the schema.</div>
        </HoverCardContent>
      </HoverCard>

      <JsonViewerDialog
        title="LLM Context"
        description="This can be passed to an LLM model."
        open={openLLMContextModal}
        onOpenChange={setOpenLLMContextModal}
        value={llmContextObj ?? {}}
        className="sm:max-w-[85vw] max-h-[85vh] w-175 h-195"
      />

      <JsonImportPanel
        open={openLLMResponseModal}
        onOpenChange={setOpenLLMResponseModal}
        title="LLM Response JSON"
        description="Response should be a json and must match the required shape"
        placeholder={`{
  "generation_id": 42,

  "cleaned_intent": "...",
  "cleaned_review": "...",
  "failure_description": "...",
  "suspected_causes": "...",
  "correction_strategy": "...",

  "_note": [
    "generation_id is required.",
    "All other fields are optional.",
    "Optional fields may be null.",
    "Unrecognized fields are rejected."
  ]
}`}
        validate={validatePastedJson}
        onImport={llmContext.updateLLMResponse}
        className="sm:max-w-[85vw] max-h-[85vh] w-175 h-195"
      />
    </>
  );
}
