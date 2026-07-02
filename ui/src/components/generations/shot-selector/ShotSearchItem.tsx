import { Check, ChevronRight } from "lucide-react";

import type { ShotSearchResult } from "@/types";

import { HoverCard, HoverCardContent, HoverCardTrigger } from "@/components/ui/hover-card";
import { Item, ItemContent, ItemDescription, ItemTitle } from "@/components/ui/item";
import { cn } from "@/lib/utils";

interface ShotSearchItemProps {
  shot: ShotSearchResult;
  selected: boolean;
  onClick: (shot_id: number) => void;
  className?: string;
}

export function ShotSearchItem({
  shot,
  selected = false,
  onClick,
  className,
}: Readonly<ShotSearchItemProps>) {
  return (
    <HoverCard>
      <HoverCardTrigger delay={500}>
        <Item
          variant="outline"
          onClick={() => onClick(shot.shot_id)}
          className={cn(
            "w-full cursor-pointer select-none",
            "transition-[background-color,border-color] duration-150 py-4",
            selected
              ? "bg-muted border-transparent"
              : "hover:bg-accent/20 hover:border-border/30 border-accent-foreground/18",
            className,
          )}
        >
          <ItemContent>
            <ItemTitle className="flex w-full items-center gap-2">
              {selected && <Check className="size-4 shrink-0" />}
              <span className="text-muted-foreground">
                {shot.scene_number ?? 0}.{shot.clip_number ?? 0}.{shot.shot_number ?? 0}:{" "}
              </span>
              {shot.shot_name}
            </ItemTitle>

            <ItemDescription className="flex items-center">
              {shot.project_name} <ChevronRight className="size-3.5 text-accent-foreground mx-1" />{" "}
              {shot.scene_name} <ChevronRight className="size-3.5 text-accent-foreground mx-1" />{" "}
              {shot.clip_name}
            </ItemDescription>
          </ItemContent>
        </Item>
      </HoverCardTrigger>

      <HoverCardContent side="top" className="w-auto max-w-[80vw] p-0">
        <div className="grid grid-cols-[max-content_1fr] text-xs font-mono">
          <span className="border-b px-3 py-2 text-muted-foreground">Project</span>
          <span className="border-b px-3 py-2 wrap-break-word">{shot.project_name}</span>

          <span className="border-b px-3 py-2 text-muted-foreground">Scene</span>
          <span className="border-b px-3 py-2 wrap-break-word">
            {shot.scene_number ?? 0}: {shot.scene_name}
          </span>

          <span className="border-b px-3 py-2 text-muted-foreground">Clip</span>
          <span className="border-b px-3 py-2 wrap-break-word">
            {shot.clip_number ?? 0}: {shot.clip_name}
          </span>

          <span className="px-3 py-2 text-muted-foreground">Shot</span>
          <span className="px-3 py-2 wrap-break-word">
            {shot.number ?? 0}: {shot.shot_name}
          </span>
        </div>
      </HoverCardContent>
    </HoverCard>
  );
}
