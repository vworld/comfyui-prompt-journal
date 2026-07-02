import { Film, Lock, Plus } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export interface ShotRowProps {
  enabled: boolean;
  query: string;
  onQueryChange: (query: string) => void;
  placeholderEnabled: string;
  placeholderDisabled: string;
  onAddClick: () => void;
  isAddBtnEnabled: boolean;
  /** Inline error from the immediate-create path (empty name, create failure). */
  error?: string;
}

export function ShotRow({
  enabled,
  query,
  onQueryChange,
  placeholderEnabled,
  placeholderDisabled,
  onAddClick,
  isAddBtnEnabled,
  error,
}: Readonly<ShotRowProps>) {
  const RowIcon = enabled ? Film : Lock;

  return (
    <div className="space-y-1">
      <div className="flex flex-wrap items-center gap-3">
        <RowIcon
          className={`size-4 shrink-0 ${enabled ? "text-foreground" : "text-muted-foreground"}`}
        />
        <span className="w-20 shrink-0 text-xs font-medium">Shot</span>
        <div className="min-w-0 flex-1">
          <Input
            value={query}
            onChange={(e) => onQueryChange(e.target.value)}
            placeholder={enabled ? placeholderEnabled : placeholderDisabled}
            disabled={!enabled}
          />
        </div>
        <Button
          variant="outline"
          size="sm"
          className="shrink-0 text-xs"
          onClick={onAddClick}
          disabled={!isAddBtnEnabled}
        >
          <Plus className="size-3.5" />
          Create
        </Button>
      </div>
      {error ? <p className="pl-23 text-xs text-destructive">{error}</p> : null}
    </div>
  );
}
