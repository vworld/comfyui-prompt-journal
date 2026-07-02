import { Pencil } from "lucide-react";
import { type ReactNode, useCallback, useEffect, useRef, useState } from "react";

import { Button } from "@/components/ui/button";
import {
  Combobox,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxInput,
  ComboboxItem,
  ComboboxList,
} from "@/components/ui/combobox";
import { useDebounce } from "@/hooks/use-debounce";

/**
 * An asynchronous, single-select combobox that searches options on demand.
 *
 * - The component is controlled with respect to the selected value.
 * - Search results are loaded asynchronously via the `search` callback.
 * - Searches are automatically debounced and any in-flight request is
 *   cancelled before a new search is started.
 * - By default, the search query is managed internally. If `searchQuery`
 *   is provided, the query becomes controlled by the parent.
 * - Once an item is selected, the combobox collapses into a read-only
 *   display. Clicking the display re-enters edit mode.
 */
export interface SearchComboboxProps<T> {
  /**
   * The currently selected item.
   *
   * A value of `null` indicates that no item is currently selected.
   */
  value: T | null;

  /**
   * Invoked whenever the selected item changes.
   */
  onValueChange: (value: T | null) => void;

  /**
   * Controls the search query displayed in the input.
   *
   * When omitted, the component manages the search query internally.
   * Provide this when the parent needs to observe or control the user's
   * search text (for example, to support creating new entities from the
   * current query).
   */
  searchQuery?: {
    /**
     * The current search query.
     */
    inputValue: string;

    /**
     * Invoked whenever the search query changes.
     */
    onInputValueChange: (value: string) => void;
  };

  /**
   * Performs an asynchronous search.
   *
   * The supplied AbortSignal is aborted whenever a newer search is started
   * or the component unmounts. Implementations should pass the signal to
   * their HTTP client where supported.
   */
  search: (query: string, signal: AbortSignal) => Promise<T[]>;

  /**
   * Performs a search on first load
   */
  searchOnLoad?: boolean;

  /**
   * Returns a stable, unique key for an item.
   *
   * Example: `(item) => item.id;`
   */
  itemKey: (item: T) => React.Key;

  /**
   * Returns the text representation of an item.
   *
   * This is used for displaying the selected value and populating the
   * input when editing begins.
   *
   * Example `(item) => item.label;`
   */
  itemLabel: (item: T) => string;

  /**
   * Custom renderer for an item's contents.
   *
   * When omitted, `itemLabel(item)` is rendered.
   */
  renderItemContent?: (item: T) => React.ReactNode;

  /**
   * Placeholder displayed when the input is empty.
   *
   * @default "Search..."
   */
  placeholder?: string;

  /**
   * Disables user interaction.
   *
   * @default false
   */
  disabled?: boolean;

  /**
   * Debounce duration, in milliseconds, before a search is performed.
   *
   * @default 300
   */
  debounce?: number;

  /**
   * Minimum number of characters required before a search is triggered.
   *
   * @default 2
   */
  minSearchLength?: number;

  /**
   * Content displayed while a search is in progress.
   *
   * @default "Searching..."
   */
  loadingText?: React.ReactNode;

  /**
   * Content displayed when no matching results are returned.
   *
   * @default "No results"
   */
  emptyText?: React.ReactNode;

  /**
   * Content displayed before enough characters have been entered to
   * initiate a search.
   *
   * @default "Start typing..."
   */
  initialText?: React.ReactNode;

  /**
   * Returns the content displayed when the search callback throws an error.
   *
   * Errors thrown from `search` are caught by the component and passed to this
   * callback. The callback may return inline UI, trigger side effects (such as
   * displaying a toast) and return `null`, or both.
   *
   * The `search` callback should generally allow errors to propagate rather than
   * catching them internally so that the component can manage the search error
   * state consistently.
   *
   * @default () => "Search failed"
   */
  renderErrorContent?: (error: unknown) => React.ReactNode;
  /**
   * Can be used to log messages during debug.
   * This is a dev time prop and has to be used manually.
   */
  debugId?: string;
}

export function SearchCombobox<T>({
  value,
  onValueChange,
  searchQuery: searchQueryControl,
  search,
  searchOnLoad = true,
  itemKey,
  itemLabel,
  renderItemContent: renderItem,
  placeholder = "Search...",
  disabled,
  debounce = 300,
  minSearchLength = 2,
  loadingText = "Searching...",
  emptyText = "No results",
  initialText = "Start typing...",
  renderErrorContent: errorText = () => "Search failed",
}: Readonly<SearchComboboxProps<T>>) {
  const [items, setItems] = useState<T[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<unknown>(null);
  const [query, setQuery] = useState<string>("");
  const [isEditing, setIsEditing] = useState<boolean>(value === null);
  const [optionsOpen, setOptionsOpen] = useState<boolean>(false);

  const abortRef = useRef<AbortController | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const debounced = useDebounce();

  const queryState = searchQueryControl ? searchQueryControl.inputValue : query;
  const setQueryState = searchQueryControl ? searchQueryControl.onInputValueChange : setQuery;

  const performSearch = useCallback(
    (query: string, initialSearch = false) => {
      if (!initialSearch && query.trim().length < minSearchLength) {
        // only called sync in useEffect which runs once and is gated with initialSearch flag
        /* eslint-disable react-x/set-state-in-effect */
        setItems([]);
        setLoading(false);
        setError(null);
        return;
      }

      debounced.debounce(async () => {
        abortRef.current?.abort();

        const controller = new AbortController();
        abortRef.current = controller;

        setLoading(true);
        setError(null);

        try {
          const results = await search(query, controller.signal);

          if (!controller.signal.aborted) {
            setItems(results);
          }
        } catch (error) {
          if (!controller.signal.aborted) {
            setError(error);
            setItems([]);
          }
        } finally {
          if (!controller.signal.aborted) {
            setLoading(false);
          }
        }
      }, debounce);
    },
    [debounce, debounced, minSearchLength, search],
  );

  const beginEditing = () => {
    setError(null);
    if (value) setQueryState(itemLabel(value));
    setIsEditing(true);

    requestAnimationFrame(() => {
      inputRef.current?.focus();
      setOptionsOpen(true);
    });
  };

  const getEmptyText = (): ReactNode => {
    if (loading) return loadingText as ReactNode;
    if (error) return errorText(error);
    if (queryState.length < minSearchLength) return initialText as ReactNode;
    return emptyText as ReactNode;
  };

  useEffect(() => {
    return () => {
      abortRef.current?.abort();
    };
  }, []);

  useEffect(() => {
    // Exit edit mode whenever a value is supplied.
    //
    // Usually this happens when the user selects an option, but the parent may also
    // populate the value (e.g. after creating a new entity from the "not found"
    // workflow).
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (value) setIsEditing(false);
  }, [value]);

  return !isEditing && value ? (
    <Button
      variant="ghost"
      className="h-7 w-full justify-between px-3 font-normal"
      onClick={beginEditing}
    >
      <span className="truncate">{itemLabel(value)}</span>
      <Pencil className="size-3.5 opacity-50" />
    </Button>
  ) : (
    <Combobox
      items={items}
      value={value}
      inputValue={queryState}
      filter={null}
      autoHighlight={true}
      itemToStringLabel={itemLabel}
      open={optionsOpen}
      onOpenChange={setOptionsOpen}
      onValueChange={(nextSelectedValue) => {
        //console.log(debugId, "valueChange", value);
        onValueChange(nextSelectedValue);
        //setIsEditing(false);
      }}
      onInputValueChange={(value, details) => {
        //console.log(debugId, "inputChange", { value, reason: details.reason });
        if (["item-press", "none", "input-clear"].includes(details.reason)) {
          return;
        }

        setQueryState(value);

        performSearch(value);
      }}
    >
      <ComboboxInput
        placeholder={placeholder}
        disabled={disabled}
        showClear
        showTrigger
        className="w-full"
        ref={inputRef}
        onFocus={() => {
          if (searchOnLoad) performSearch(queryState);
        }}
        onBlur={() => {
          if (value) setIsEditing(false);
        }}
      />

      <ComboboxContent>
        <ComboboxEmpty>{getEmptyText()}</ComboboxEmpty>

        <ComboboxList>
          {(item: T) => (
            <ComboboxItem key={itemKey(item)} value={item}>
              {renderItem ? renderItem(item) : itemLabel(item)}
            </ComboboxItem>
          )}
        </ComboboxList>
      </ComboboxContent>
    </Combobox>
  );
}
