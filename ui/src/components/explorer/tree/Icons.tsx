import {
  ChevronDown,
  ChevronRight,
  Clapperboard,
  Film,
  FolderIcon,
  Sparkles,
  Video,
} from "lucide-react";

import type { TreeNode } from "@/components/explorer/types";

export function TreeNodeIcon({ kind }: { readonly kind: TreeNode["kind"] }) {
  switch (kind) {
    case "project": {
      return <FolderIcon className="h-4 w-4 shrink-0" />;
    }
    case "scene": {
      return <Film className="h-4 w-4 shrink-0" />;
    }
    case "clip": {
      return <Clapperboard className="h-4 w-4 shrink-0" />;
    }
    case "shot": {
      return <Video className="h-4 w-4 shrink-0" />;
    }
    case "generation": {
      return <Sparkles className="h-4 w-4 shrink-0" />;
    }
  }
}

export function OpenIcon() {
  return <ChevronDown />;
}

export function ClosedIcon() {
  return <ChevronRight />;
}
