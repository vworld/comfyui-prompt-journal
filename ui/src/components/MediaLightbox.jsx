import Lightbox from 'yet-another-react-lightbox';
import Video from 'yet-another-react-lightbox/plugins/video';
import 'yet-another-react-lightbox/styles.css';

/**
 * Renders a custom slide for audio assets. yet-another-react-lightbox has
 * no built-in audio slide type, so this hooks into its render.slide
 * extension point (returns undefined for non-audio slides, letting the
 * library fall back to its own image/video rendering).
 */
function renderSlide({ slide }) {
  if (slide.type !== 'audio') return undefined;

  return (
    <div className="flex h-full w-full flex-col items-center justify-center gap-4 px-10">
      <div className="text-5xl">🎵</div>
      <div className="max-w-md truncate font-mono text-sm text-text-muted">{slide.title}</div>
      {/* eslint-disable-next-line jsx-a11y/media-has-caption */}
      <audio src={slide.src} controls autoPlay className="w-full max-w-md" />
    </div>
  );
}

/**
 * @param {{
 *   open: boolean,
 *   index: number,
 *   slides: Array<{ kind: 'image'|'video'|'audio'|'unknown', src: string, title: string, width?: number, height?: number }>,
 *   onClose: () => void,
 * }} props
 */
export default function MediaLightbox({ open, index, slides, onClose }) {
  const lightboxSlides = slides.map((slide) => {
    if (slide.kind === 'video') {
      return {
        type: 'video',
        width: slide.width,
        height: slide.height,
        sources: [{ src: slide.src, type: 'video/mp4' }],
        title: slide.title,
      };
    }

    if (slide.kind === 'audio') {
      return {
        type: 'audio',
        src: slide.src,
        title: slide.title,
      };
    }

    // image, or unknown — render as an image slide; unknown file types
    // will simply fail to load an image preview, which is an acceptable
    // degradation until a dedicated "unsupported file" slide is needed.
    return {
      type: 'image',
      src: slide.src,
      width: slide.width,
      height: slide.height,
      alt: slide.title,
    };
  });

  return (
    <Lightbox
      open={open}
      close={onClose}
      index={index}
      slides={lightboxSlides}
      plugins={[Video]}
      render={{ slide: renderSlide }}
    />
  );
}
