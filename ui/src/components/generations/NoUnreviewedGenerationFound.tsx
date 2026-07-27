import { open } from "@tauri-apps/plugin-dialog";
import { Inbox } from "lucide-react";

import StatsTable from "@/components/shared/StatsTable";
import { Button } from "@/components/ui/button";
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import { nativeImportQueue } from "@/context/drag-drop/lib/NativeImportQueue";

async function browseFiles() {
  const paths = await open({ multiple: true });
  if (paths) {
    nativeImportQueue.onDrop(paths);
  }
}

export default function NoUnreviewedGenerationFound() {
  return (
    <Empty className="bg-workspace gap-3">
      <EmptyHeader>
        <EmptyMedia variant="icon">
          <Inbox className="" />
        </EmptyMedia>
        <EmptyTitle>No Unreviewed Generations</EmptyTitle>
        <EmptyDescription>
          <span className="">Drag and drop ComfyUI output files </span>{" "}
          <span className="font-semibold text-accent-foreground/80">anywhere </span>{" "}
          <span>in the app.</span>{" "}
          <span className="font-semibold text-accent-foreground/80">
            No import screen required.
          </span>
        </EmptyDescription>
      </EmptyHeader>
      <EmptyContent className="flex-col justify-center gap-3">
        <div className="flex gap-2">
          <Button>Generations</Button>
          <Button variant="outline" onClick={() => void browseFiles()}>
            Import Files
          </Button>
        </div>
        <StatsTable open={true} className="w-60" />
      </EmptyContent>
    </Empty>
  );
}
