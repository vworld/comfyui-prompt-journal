import { open } from "@tauri-apps/plugin-dialog";

import StatsTable from "@/components/StatsTable";
import { Button } from "@/components/ui/button";
import { HoverCard, HoverCardContent, HoverCardTrigger } from "@/components/ui/hover-card";
import { useSidebar } from "@/components/ui/sidebar";
import { nativeImportQueue } from "@/context/drag-drop/lib/NativeImportQueue";

async function browseFiles() {
  const paths = await open({ multiple: true });
  if (paths) {
    nativeImportQueue.onDrop(paths);
  }
}

export default function SidebarFooterApp() {
  const { open } = useSidebar();
  return (
    <div className="flex flex-col mb-4 gap-10">
      <StatsTable open={open} />

      <HoverCard>
        <HoverCardTrigger>
          <Button className="w-full" variant="default" size="lg" onClick={() => void browseFiles()}>
            Import ComfyUI Output
          </Button>
        </HoverCardTrigger>
        <HoverCardContent className="bg-background">
          Tip: You can also drag and drop ComfyUI output files anywhere in the app, at any time.
        </HoverCardContent>
      </HoverCard>
    </div>
  );
}
