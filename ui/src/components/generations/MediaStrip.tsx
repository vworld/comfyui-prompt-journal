import { GalleryHorizontal } from "lucide-react";
import { useState } from "react";
// eslint-disable-next-line import-x/no-named-as-default
import Lightbox, { type Slide, type SlideImage, type SlideVideo } from "yet-another-react-lightbox";
import Captions from "yet-another-react-lightbox/plugins/captions";
import Fullscreen from "yet-another-react-lightbox/plugins/fullscreen";
import Inline from "yet-another-react-lightbox/plugins/inline";
import Thumbnails from "yet-another-react-lightbox/plugins/thumbnails";
import Video from "yet-another-react-lightbox/plugins/video";
import Zoom from "yet-another-react-lightbox/plugins/zoom";

import type { GenerationAssetResponse } from "@/types";

import { assetFileUrl } from "@/api/generations";
import { mediaKindFromMime } from "@/api/transforms";

interface SlideCustom {
  type: "audio" | "unknown";
  src: string;
  title: string;
}

/**
 * Renders a custom slide for audio assets. yet-another-react-lightbox has
 * no built-in audio slide type, so this hooks into its render.slide
 * extension point (returns undefined for non-audio slides, letting the
 * library fall back to its own image/video rendering).
 */
function renderCustomSlide({ slide }: { slide: Slide | SlideCustom }) {
  if (slide.type !== "audio" && slide.type !== "unknown") return;

  return (
    <div className="flex h-full w-full flex-col items-center justify-center gap-4 px-10">
      <div className="text-5xl">{slide.type === "audio" ? "🎵" : "Unknown"}</div>
      <div className="max-w-md truncate font-mono text-sm text-text-muted">{slide.title}</div>
      <audio src={slide.src} controls autoPlay className="w-full max-w-md" />
    </div>
  );
}

function lightboxSlides(
  generationAsset: GenerationAssetResponse,
): SlideImage | SlideVideo | SlideCustom {
  const asset = generationAsset.asset;
  const mediaKind = mediaKindFromMime(asset.mime_type);
  switch (mediaKind) {
    case "image": {
      return {
        type: "image",
        src: assetFileUrl(asset.id),
        title: `${asset.file_name} (${generationAsset.role})`,
        width: asset.width ?? undefined,
        height: asset.height ?? undefined,
      };
    }
    case "video": {
      return {
        type: "video",
        sources: [
          {
            src: assetFileUrl(asset.id),
            type: asset.mime_type ?? "video/mp4", //check if default is a problem
          },
        ],
        height: asset.height ?? undefined,
        width: asset.width ?? undefined,
        title: `${asset.file_name} (${generationAsset.role})`,
        muted: false,
      };
    }
    case "audio":
    case "unknown": {
      return {
        type: mediaKind,
        src: assetFileUrl(asset.id),
        title: `${asset.file_name} (${generationAsset.role})`,
      };
    }
  }
}

export default function MediaStrip({ assets }: Readonly<{ assets: GenerationAssetResponse[] }>) {
  const [open, setOpen] = useState(false);
  const [index, setIndex] = useState(0);

  const toggleOpen = (state: boolean) => () => setOpen(state);

  const updateIndex =
    (when: boolean) =>
    ({ index: current }: { index: number }) => {
      if (when === open) {
        setIndex(current);
      }
    };

  const sortedAssets = [...assets].toSorted(
    (a, b) => Number(b.assoc_type === "output") - Number(a.assoc_type === "output"),
  );

  const slides = sortedAssets.map((s) => lightboxSlides(s));

  return (
    <>
      <div className={"flex flex-col h-full"}>
        <Lightbox
          index={index}
          slides={slides as Slide[]}
          plugins={[Inline, Video, Captions, Thumbnails, Fullscreen]}
          styles={{
            captionsTitle: { font: "var(--font-mono)", fontSize: "var(--text-sm)" },
            thumbnail: { border: "1px oklch(1 0 0 / 10%)" },
            thumbnailsTrack: { backgroundColor: "#111114", justifyContent: "start" },
            thumbnailsContainer: {
              backgroundColor: "#111114",
              padding: 10,
            },
          }}
          thumbnails={{ vignette: false, showToggle: true, hidden: true }}
          on={{
            view: updateIndex(false),
            click: toggleOpen(true),
          }}
          carousel={{
            padding: 0,
            spacing: 0,
            imageFit: "contain",
            finite: true,
          }}
          inline={{
            style: {
              width: "100%",
              height: "100%",
              margin: "0 auto",
            },
          }}
          render={{
            slide: (slide) => renderCustomSlide(slide),
            iconThumbnailsVisible: () => <GalleryHorizontal className="size-5" />,
            iconThumbnailsHidden: () => (
              <div className="relative">
                <GalleryHorizontal className="size-5" />
                <div className="absolute top-1/2 left-1/2 h-0 w-[140%] -translate-x-1/2 -translate-y-1/2 rotate-45 border-t-2 border-current/90" />
              </div>
            ),
          }}
        />
      </div>

      <Lightbox
        open={open}
        close={toggleOpen(false)}
        index={index}
        slides={slides as Slide[]}
        plugins={[Video, Captions, Fullscreen, Zoom, Thumbnails]}
        on={{ view: updateIndex(true) }}
        animation={{ fade: 0 }}
        controller={{ closeOnPullDown: true, closeOnBackdropClick: true }}
      />
    </>
  );
}
