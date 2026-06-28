import { useCallback, useRef, useState } from 'react';

const ACCEPTED_EXTENSIONS = ['.png', '.webp', '.gif', '.jpg', '.jpeg', '.mp4', '.mov', '.webm', '.mkv'];

function isAcceptedFile(file) {
  const name = file.name.toLowerCase();
  return ACCEPTED_EXTENSIONS.some((ext) => name.endsWith(ext));
}

export default function DropZone({ onFileAccepted }) {
  const [isDraggingOver, setIsDraggingOver] = useState(false);
  const [error, setError] = useState(null);
  const dragCounterRef = useRef(0);
  const inputRef = useRef(null);

  const handleFiles = useCallback(
    (fileList) => {
      const files = Array.from(fileList || []);
      if (files.length === 0) return;

      if (files.length > 1) {
        setError('Drop one file at a time — only the first will be used right now.');
      }

      const file = files[0];

      if (!isAcceptedFile(file)) {
        setError(`Unsupported file type: "${file.name}". Expected an image or video output file.`);
        return;
      }

      setError(null);
      onFileAccepted(file);
    },
    [onFileAccepted],
  );

  const handleDragEnter = useCallback((event) => {
    event.preventDefault();
    dragCounterRef.current += 1;
    setIsDraggingOver(true);
  }, []);

  const handleDragLeave = useCallback((event) => {
    event.preventDefault();
    dragCounterRef.current -= 1;
    if (dragCounterRef.current <= 0) {
      dragCounterRef.current = 0;
      setIsDraggingOver(false);
    }
  }, []);

  const handleDragOver = useCallback((event) => {
    event.preventDefault();
  }, []);

  const handleDrop = useCallback(
    (event) => {
      event.preventDefault();
      dragCounterRef.current = 0;
      setIsDraggingOver(false);
      handleFiles(event.dataTransfer?.files);
    },
    [handleFiles],
  );

  const handleInputChange = (event) => {
    handleFiles(event.target.files);
    event.target.value = '';
  };

  return (
    <div
      onDragEnter={handleDragEnter}
      onDragLeave={handleDragLeave}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
      className={`m-6 flex h-full w-full items-center justify-center rounded-xl border-2 border-dashed transition-colors ${
        isDraggingOver ? 'border-accent bg-panel-raised' : 'border-border-strong bg-panel'
      }`}
    >
      <div className="flex flex-col items-center gap-1.5 pointer-events-none text-center">
        <div className={`mb-2 text-4xl transition-colors ${isDraggingOver ? 'text-accent translate-y-1' : 'text-text-faint'}`}>
          {isDraggingOver ? '⬇' : '＋'}
        </div>
        <div className="text-lg font-semibold text-text">
          {isDraggingOver ? 'Drop it' : 'Drag a generation output here'}
        </div>
        <div className="mb-3.5 font-mono text-[12.5px] text-text-muted">
          Image or video file with embedded ComfyUI metadata
        </div>
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          className="pointer-events-auto rounded-md border border-accent-dim px-3.5 py-1.5 font-mono text-[12.5px] text-accent hover:bg-accent-dim hover:text-text"
        >
          or browse files
        </button>
        <input
          ref={inputRef}
          type="file"
          accept={ACCEPTED_EXTENSIONS.join(',')}
          className="hidden"
          onChange={handleInputChange}
        />
        {error && (
          <div className="pointer-events-auto mt-4 max-w-md font-mono text-[12px] text-attention">{error}</div>
        )}
      </div>
    </div>
  );
}
