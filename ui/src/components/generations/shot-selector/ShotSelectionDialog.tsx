import { SearchIcon } from "lucide-react";
import { useEffect, useState } from "react";

import type { ShotHierarchicalResponse, ShotSearchResult } from "@/types";

import { searchShots } from "@/api/shots";
import { ShotSearchItem } from "@/components/generations/shot-selector/ShotSearchItem";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogFooter } from "@/components/ui/dialog";
import { InputGroup, InputGroupAddon, InputGroupInput } from "@/components/ui/input-group";
import { Separator } from "@/components/ui/separator";
import { Spinner } from "@/components/ui/spinner";
import { useDebounce } from "@/hooks/use-debounce";

export default function ShotSelectionDialog({
  selectedShot,
  open,
  setOpen,
  setOpenCreate,
  onSelect,
}: Readonly<{
  selectedShot: ShotHierarchicalResponse | null;
  open: boolean;
  setOpen: (open: boolean) => void;
  setOpenCreate: (open: boolean) => void;
  onSelect: (shot_id: number) => void;
}>) {
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState<string>("");
  const [searchResults, setSearchResults] = useState<ShotSearchResult[]>([]);

  const { debounce } = useDebounce();

  useEffect(() => {
    if (!open) return;

    async function searchShotRequest() {
      try {
        const data = await searchShots(query);
        setSearchResults(data);
      } catch (error_) {
        setError(error_ instanceof Error ? error_.message : "Search failed.");
        setSearchResults([]);
      } finally {
        setLoading(false);
      }
    }

    debounce(searchShotRequest);
  }, [debounce, query, open]);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent
        showCloseButton={false}
        className="p-0 sm:max-w-140 w-140 rounded-lg bg-accent/90 gap-0"
      >
        <div className="max-h-[50vh] min-h-90 m-1 bg-workspace rounded-lg overflow-auto no-scrollbar mx-2 mt-2">
          <div className="flex flex-col pt-3 gap-4">
            <div className="px-2 w-full">
              <InputGroup>
                <InputGroupInput
                  id="inline-start-input"
                  placeholder="Search shots by name, project, scene, clip…"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                />
                <InputGroupAddon align="inline-start">
                  <SearchIcon className="text-muted-foreground" />
                </InputGroupAddon>
              </InputGroup>
            </div>

            <Separator className="" />

            {loading && (
              <div className="flex gap-2 px-2 font-mono text-xs-plus text-muted-foreground">
                <Spinner />
                Searching…
              </div>
            )}

            {!loading && error && (
              <div className="px-2 font-mono text-xs-plus text-destructive">{error}</div>
            )}

            {!loading && !error && searchResults.length === 0 && (
              <div className="px-2 font-mono text-xs-plus text-muted-foreground ">
                {query ? "No matching shots." : "Type to search."}
              </div>
            )}

            {searchResults.map((r) => (
              <div className="px-2 w-full" key={r.shot_id}>
                <ShotSearchItem
                  shot={r}
                  selected={selectedShot?.id === r.shot_id}
                  onClick={onSelect}
                />
              </div>
            ))}
          </div>
        </div>

        <DialogFooter className="h-10 items-center px-2">
          <div className="flex w-full justify-end items-center">
            <Button
              variant="secondary"
              className="bg-card text-accent-foreground h-8"
              onClick={() => setOpenCreate(true)}
            >
              Create New Shot
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
