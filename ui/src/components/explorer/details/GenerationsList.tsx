import { Film, Image, Video } from "lucide-react";

import type { GenerationDetailResponse } from "@/types";

import { assetFileUrl } from "@/api/generations";
import { useExplorerTree } from "@/components/explorer/tree-context/use-explorer-tree";
import { Badge } from "@/components/ui/badge";
import { Card, CardHeader } from "@/components/ui/card";
import { HoverCard, HoverCardContent, HoverCardTrigger } from "@/components/ui/hover-card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { formatDate } from "@/lib/date-fmt";

interface GenerationsListProps {
  readonly generations: GenerationDetailResponse[];
  readonly onGenerationClick: (generationId: number) => void;
}

function getOutputAsset(gen: GenerationDetailResponse) {
  return gen.generation_assets.find((a) => a.assoc_type === "output")?.asset;
}

function getMediaPreview(gen: GenerationDetailResponse) {
  const asset = getOutputAsset(gen);
  if (!asset) return null;

  const { mime_type, file_name } = asset;
  const url = assetFileUrl(asset.id);

  if (mime_type?.startsWith("image/")) {
    return (
      <img src={url} alt={file_name} className="max-h-48 max-w-72 object-contain" loading="lazy" />
    );
  }
  if (mime_type?.startsWith("video/")) {
    return (
      <video
        src={url}
        className="max-h-48 max-w-72 object-contain"
        muted
        autoPlay
        playsInline
        loop
      />
    );
  }
  // For other types (audio, unknown), just show filename
  return <span className="text-sm text-muted-foreground">{file_name}</span>;
}

function getMediaIcon(gen: GenerationDetailResponse) {
  const asset = getOutputAsset(gen);
  if (!asset) return <Film className="size-4" />;

  const { mime_type } = asset;
  if (mime_type?.startsWith("image/")) return <Image className="size-4" />;
  if (mime_type?.startsWith("video/")) return <Video className="size-4" />;
  return <Film className="size-4" />;
}

export default function GenerationsList({ generations, onGenerationClick }: GenerationsListProps) {
  const { sort } = useExplorerTree();

  if (generations.length === 0) {
    return <div className="text-sm text-muted-foreground">No generations yet</div>;
  }
  const sortedGenerations = sort.generations(generations);

  return (
    <div className="flex flex-col h-full w-full min-h-0 gap-2 overflow-hidden">
      <ScrollArea className="h-full w-full" scrollbarProps={{ gutterClassName: "bg-workspace" }}>
        <div className="flex flex-col gap-2 mb-2">
          {sortedGenerations.map((gen) => {
            const asset = getOutputAsset(gen);
            const hasReview = gen.raw_review?.trim() !== "" && gen.raw_review != null;

            return (
              <Card
                key={gen.id}
                className="min-h-0 shrink-0 cursor-pointer bg-workspace hover:bg-card font-mono"
                onClick={() => onGenerationClick(gen.id)}
              >
                <CardHeader className="flex flex-col gap-1 py-2">
                  {/* Row 1: Attempt num and date */}
                  <div className="flex items-center gap-2 text-sm pb-2">
                    <span className="font-medium">Attempt #{gen.attempt_num}</span>
                    <span className="text-muted-foreground">•</span>
                    <HoverCard>
                      <HoverCardTrigger delay={100} closeDelay={800}>
                        <div className="flex items-center gap-1 text-muted-foreground hover:underline hover:text-foreground/80 underline-offset-3">
                          {getMediaIcon(gen)}
                          <span className="">{asset?.file_name ?? "?"}</span>
                        </div>
                      </HoverCardTrigger>
                      <HoverCardContent className="w-auto p-2" side="top">
                        {getMediaPreview(gen)}
                      </HoverCardContent>
                    </HoverCard>
                  </div>

                  {/* Row 2: FileName (with hover), workflow, accepted, reviewed, resolution */}
                  <div className="flex items-center gap-3 text-xs-plus">
                    <Badge variant="secondary" className="text-xs">
                      {gen.workflow_name ?? "—"}
                    </Badge>
                    <span className="text-muted-foreground">
                      {formatDate(new Date(gen.added_on * 1000))}
                    </span>

                    <Badge variant={gen.accepted ? "default" : "secondary"} className="text-xs">
                      {gen.accepted ? "Accepted" : "Pending"}
                    </Badge>

                    <Badge variant={hasReview ? "outline" : "secondary"} className="text-xs">
                      {hasReview ? "Reviewed" : "Unreviewed"}
                    </Badge>

                    {asset && (
                      <span className="text-muted-foreground">
                        {asset.width ?? "?"}x{asset.height ?? "?"}
                      </span>
                    )}
                  </div>
                </CardHeader>
              </Card>
            );
          })}
        </div>
      </ScrollArea>
    </div>
  );
}
