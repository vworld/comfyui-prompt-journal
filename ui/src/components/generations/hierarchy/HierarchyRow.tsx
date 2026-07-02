import { Lock, type LucideIcon, Plus } from "lucide-react";

import type { HierarchyLevel } from "./types";
import type { Key } from "react";

import { SearchCombobox } from "@/components/SearchCombobox";
import { Button } from "@/components/ui/button";

export interface HierarchyRowProps<T> {
  level: HierarchyLevel;
  /** Icon shown when the row is enabled (FolderOpen / FolderTree / Clapperboard). */
  icon: LucideIcon;
  label: string;
  enabled: boolean;

  /** Combobox text — shown while typing, regardless of whether it resolves to `value`. */
  query: string;
  onQueryChange: (query: string) => void;

  /** The resolved search result, or null if the current query hasn't been matched/selected. */
  value: T | null;
  onSelect: (item: T | null) => void;

  search: (query: string, signal: AbortSignal) => Promise<T[]>;
  itemKey: (item: T) => Key;
  itemLabel: (item: T) => string;

  placeholderEnabled: string;
  placeholderDisabled: string;
  emptyText: string;

  onAddClick: () => void;
  /** Add is only ever actionable once there's something to prefill the create dialog with. */
  isAddBtnEnabled: boolean;
  /** Inline error from the immediate-create path (empty name, create failure). */
  error?: string;
}

export function HierarchyRow<T>({
  icon: Icon,
  label,
  enabled,
  query,
  onQueryChange,
  value,
  onSelect,
  search,
  itemKey,
  itemLabel,
  placeholderEnabled,
  placeholderDisabled,
  emptyText,
  onAddClick,
  isAddBtnEnabled,
  error,
}: Readonly<HierarchyRowProps<T>>) {
  const RowIcon = enabled ? Icon : Lock;

  return (
    <div className="space-y-1">
      <div className="flex flex-wrap items-center gap-3">
        <RowIcon
          className={`size-4 shrink-0 ${enabled ? "text-foreground" : "text-muted-foreground"}`}
        />
        <span className="w-20 shrink-0 text-xs font-medium">{label}</span>
        <div className="min-w-0 flex-1">
          <SearchCombobox
            value={value}
            onValueChange={onSelect}
            search={search}
            itemKey={itemKey}
            itemLabel={itemLabel}
            placeholder={enabled ? placeholderEnabled : placeholderDisabled}
            emptyText={emptyText}
            searchQuery={{ inputValue: query, onInputValueChange: onQueryChange }}
            minSearchLength={0}
            disabled={!enabled}
            debugId={label}
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
