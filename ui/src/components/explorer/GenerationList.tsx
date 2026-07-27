import { useCallback, useEffect, useRef, useState } from "react";

import type { GenerationWithAssetsResponse, PaginatedResponse } from "@/types";

import { getGenerations } from "@/api/generations";
import { useExplorerTree } from "@/components/explorer/tree-context/use-explorer-tree";
import { AssetIcon } from "@/components/shared/AssetIcon";
import { Button } from "@/components/ui/button";
import { useAlert } from "@/context/AlertContext";

interface GenerationListProps {
  readonly withShot: boolean;
  readonly pageSize?: number;
  readonly onGenerationClick: (generationId: number) => void;
}

const PAGE_SIZE = 20;

function sortGenerations(generations: GenerationWithAssetsResponse[]) {
  return generations.toSorted((a, b) => a.id - b.id);
}

function scrollSelfIntoView(el: HTMLElement | null, selectedId: number | null, id: number) {
  if (!el || id !== selectedId) return;
  el.scrollIntoView({ block: "nearest" });
}

export default function GenerationList({
  withShot,
  pageSize = PAGE_SIZE,
  onGenerationClick,
}: GenerationListProps) {
  const [generations, setGenerations] = useState<GenerationWithAssetsResponse[]>([]);
  //const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const loaderRef = useRef<HTMLDivElement | null>(null);
  const loadingRef = useRef(false);

  const {
    assignedSelectedId,
    unassignedSelectedId,
    assignedTotal,
    unassignedTotal,
    setAssignedTotal,
    setUnassignedTotal,
  } = useExplorerTree();
  const { reportError } = useAlert();

  const selectedId = withShot ? assignedSelectedId : unassignedSelectedId;
  const total = withShot ? assignedTotal : unassignedTotal;
  const setTotal = withShot ? setAssignedTotal : setUnassignedTotal;

  const loadGenerations = useCallback(
    async (offset: number, limit: number, append = false) => {
      if (loadingRef.current) return;

      loadingRef.current = true;
      setLoading(true);
      setError(null);

      try {
        const result: PaginatedResponse<GenerationWithAssetsResponse> = await getGenerations(
          withShot,
          offset,
          limit,
        );
        setGenerations((prev) => (append ? [...prev, ...result.items] : result.items));
        setTotal(result.total);
      } catch {
        setError("Failed to load generations");
      } finally {
        loadingRef.current = false;
        setLoading(false);
      }
    },
    [withShot],
  );

  useEffect(() => {
    // initial load
    // eslint-disable-next-line react-hooks/set-state-in-effect, react-x/set-state-in-effect
    setGenerations([]);
    // eslint-disable-next-line react-x/set-state-in-effect
    setTotal(0);

    void loadGenerations(0, pageSize, false);
  }, [loadGenerations, pageSize]);

  useEffect(() => {
    const loader = loaderRef.current;
    if (!loader) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;
        if (loadingRef.current) return;
        if (generations.length >= total) return;

        void loadGenerations(generations.length, pageSize, true);
      },
      { rootMargin: "200px", threshold: 0.1 },
    );
    observer.observe(loader);

    return () => observer.disconnect();
  }, [generations.length, total, pageSize, loadGenerations]);

  useEffect(
    () => {
      const abort = new AbortController();
      const hasSelected = (id: number, gens: GenerationWithAssetsResponse[]) =>
        gens.some((g) => g.id === id);

      const loadGeneration = (assigned: boolean, offset: number, limit: number) => {
        return getGenerations(assigned, offset, limit, undefined, abort.signal);
      };

      async function loadUntilFound() {
        if (selectedId === null || loading) return;
        const gen = [...generations];
        const requiredId = selectedId;

        // check it the id already exists
        if (hasSelected(requiredId, gen)) return;

        let maxGenCount = total;

        try {
          setLoading(true);

          // load the first page - would help base the total whether gen is empty or not
          const nextPage = await loadGeneration(withShot, gen.length, pageSize);
          maxGenCount = nextPage.total;
          gen.push(...nextPage.items);

          if (!hasSelected(requiredId, gen)) {
            while (gen.length < maxGenCount && !abort.signal.aborted) {
              const response = await loadGeneration(withShot, gen.length, pageSize);
              gen.push(...response.items);
              if (hasSelected(requiredId, response.items)) {
                break;
              }
            }
          }
        } catch (error) {
          void reportError(error);
        } finally {
          setLoading(false);
          if (!abort.signal.aborted) {
            setGenerations(gen);
            setTotal(maxGenCount);
          }
        }
      }

      if (selectedId === null || loading) return;

      void loadUntilFound();

      return () => abort.abort();
    },
    // missing from deps - loading, generations and total
    // - none of which should requires recomputing
    // eslint-disable-next-line react-hooks/exhaustive-deps, react-x/exhaustive-deps
    [pageSize, reportError, selectedId, withShot],
  );

  if (error) {
    return <div className="text-sm text-red-500">{error}</div>;
  }

  if (generations.length === 0 && !loading) {
    return <div className="text-sm text-muted-foreground">No generations yet</div>;
  }

  const sortedGenerations = sortGenerations(generations);

  return (
    <div className="flex flex-col gap-1">
      {sortedGenerations.map((gen) => (
        <Button
          ref={(el: HTMLElement | null) => {
            scrollSelfIntoView(el, selectedId, gen.id);
          }}
          key={gen.id}
          variant={selectedId === gen.id ? "secondary" : "ghost"}
          onClick={() => onGenerationClick(gen.id)}
          className="h-8 flex items-center justify-start text-sm w-full min-h-0"
        >
          <AssetIcon outputAsset={gen.output_asset!} />
          <span className="">
            {gen.id}. {gen.output_asset?.file_name ?? `output-${gen.id}`}
          </span>
        </Button>
      ))}
      <div ref={loaderRef} className="min-h-[1rem] shrink-0" />
      {loading && <div className="text-xs text-muted-foreground px-1">Loading...</div>}
    </div>
  );
}
