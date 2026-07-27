import { useEffect, useRef, useState } from "react";

import type { CreateItemField, FieldValidationResult, HierarchyLevel } from "./types";
import type { ReactNode } from "react";

import { SearchCombobox } from "@/components/shared/SearchCombobox";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
} from "@/components/ui/input-group";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useAlert } from "@/context/AlertContext";

export interface CreateItemDialogProps<T> {
  level: HierarchyLevel;
  levelLabel: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** The row's typed-but-unmatched query at the moment Add was clicked — seeds `name`. */
  initialName: string;
  /** Name is always rendered (outside `fields`), so it always needs its own check. */
  validateName: (name: string, signal: AbortSignal) => Promise<FieldValidationResult>;
  /**
   * Fields beyond `name`. Each level's real payload shape differs (Project
   * needs `project_type`; Scene/Clip/Shot need `number`/`comments`), so the
   * field set — and how raw string values map onto the real *CreateRequest
   * type — is entirely the caller's responsibility.
   */
  fields?: CreateItemField[];
  /**
   * Receives raw string values keyed by `name` plus each field's `key`.
   * The caller trims/parses these into the real request type and calls the
   * actual create* API function (createProject, createScene, ...).
   */
  onSubmit: (rawValues: Record<string, string>) => Promise<T>;
  onCreated: (item: T) => void;
}

export function CreateItemDialog<T>({
  levelLabel,
  open,
  onOpenChange,
  initialName,
  validateName,
  fields = [],
  onSubmit,
  onCreated,
}: Readonly<CreateItemDialogProps<T>>) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent showCloseButton={false} className="w-full max-w-sm">
        {/*
          Rendered only while open, and keyed on initialName as a safety net.
          Because the form fully unmounts when `open` becomes false, its
          state (name, field values, validation, error) resets naturally on
          the next open — no effect/setState-in-effect needed to sync it.
        */}
        {open ? (
          <CreateItemForm
            key={initialName}
            levelLabel={levelLabel}
            initialName={initialName}
            validateName={validateName}
            fields={fields}
            onSubmit={onSubmit}
            onCreated={onCreated}
            onOpenChange={onOpenChange}
          />
        ) : null}
      </DialogContent>
    </Dialog>
  );
}

interface CreateItemFormProps<T> {
  levelLabel: string;
  initialName: string;
  validateName: (name: string, signal: AbortSignal) => Promise<FieldValidationResult>;
  fields: CreateItemField[];
  onSubmit: (rawValues: Record<string, string>) => Promise<T>;
  onCreated: (item: T) => void;
  onOpenChange: (open: boolean) => void;
}

interface FieldValidationState {
  status: "idle" | "checking" | "invalid";
  message?: string;
}

function CreateItemForm<T>({
  levelLabel,
  initialName,
  validateName,
  fields,
  onSubmit,
  onCreated,
  onOpenChange,
}: Readonly<CreateItemFormProps<T>>) {
  const [name, setName] = useState(initialName);
  const [fieldValues, setFieldValues] = useState<Record<string, string>>(() =>
    Object.fromEntries(fields.map((field) => [field.key, ""])),
  );
  const [fieldValidation, setFieldValidation] = useState<Record<string, FieldValidationState>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Keyed by "name" plus each field's key. Lets a stale in-flight check be
  // cancelled if the value changes again (or the form unmounts) before it
  // resolves.
  const validationControllers = useRef<Record<string, AbortController>>({});
  useEffect(() => {
    return () => {
      // eslint-disable-next-line react-hooks/exhaustive-deps, react-x/exhaustive-deps
      for (const controller of Object.values(validationControllers.current)) controller.abort();
    };
  }, []);

  const runValidation = async (
    key: string,
    validate: (value: string, signal: AbortSignal) => Promise<FieldValidationResult>,
    value: string,
  ) => {
    validationControllers.current[key]?.abort();
    const controller = new AbortController();
    validationControllers.current[key] = controller;

    const trimmed = value.trim();
    // if (!trimmed) {
    //   setFieldValidation((prev) => ({ ...prev, [key]: { status: "idle" } }));
    //   return;
    // }

    setFieldValidation((prev) => ({ ...prev, [key]: { status: "checking" } }));
    try {
      const result = await validate(trimmed, controller.signal);
      if (controller.signal.aborted) return;
      setFieldValidation((prev) => ({
        ...prev,
        [key]: result.isValid ? { status: "idle" } : { status: "invalid", message: result.message },
      }));
    } catch (error_) {
      if (controller.signal.aborted) return;
      console.error(`Validation failed for "${key}"`, error_);
      // Fail open: a broken validation *check* shouldn't itself block
      // submission — the create call remains the final authority per spec.
      setFieldValidation((prev) => ({ ...prev, [key]: { status: "idle" } }));
    }
  };

  const setFieldValue = (key: string, value: string) =>
    setFieldValues((prev) => ({ ...prev, [key]: value }));

  const missingRequiredField = fields.some(
    (field) => field.required && !fieldValues[field.key]?.trim(),
  );
  const hasBlockingValidation = Object.values(fieldValidation).some(
    (state) => state.status === "checking" || state.status === "invalid",
  );
  const canSubmit = name.trim().length > 0 && !missingRequiredField && !hasBlockingValidation;

  const handleCreate = async () => {
    if (!canSubmit) return;

    setIsSubmitting(true);
    setError(null);
    try {
      const created = await onSubmit({ name: name.trim(), ...fieldValues });
      onCreated(created);
      onOpenChange(false);
    } catch (error_) {
      console.error(`Failed to create ${levelLabel.toLowerCase()}`, error_);
      setError(`Couldn't create this ${levelLabel.toLowerCase()}. Try again.`);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <DialogHeader>
        <DialogTitle>Create {levelLabel}</DialogTitle>
      </DialogHeader>

      <div className="space-y-3">
        <div className="space-y-1.5">
          <Label htmlFor="create-item-name">Name</Label>
          <Input
            id="create-item-name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            onBlur={() => void runValidation("name", validateName, name)}
            placeholder="Name"
            autoFocus
          />
          {fieldValidation.name?.status === "checking" ? (
            <p className="text-xs text-muted-foreground">Checking…</p>
          ) : null}
          {fieldValidation.name?.status === "invalid" ? (
            <p className="text-xs text-destructive">{fieldValidation.name.message}</p>
          ) : null}
        </div>

        {
          // Triggered due to runValidation using refs for abortController
          // eslint-disable-next-line react-hooks/refs
          fields.map((field) => (
            <div key={field.key} className="space-y-1.5">
              <Label htmlFor={`create-item-${field.key}`}>
                {field.label}
                {field.required ? " *" : ""}
              </Label>
              {renderField({
                field,
                value: fieldValues[field.key] ?? "",
                onChange: (value) => setFieldValue(field.key, value),
                validationState: fieldValidation[field.key],
                onFieldBlur: () => {
                  if (field.validate) {
                    void runValidation(field.key, field.validate, fieldValues[field.key] ?? "");
                  }
                },
              })}
            </div>
          ))
        }
        {error ? <p className="text-xs text-destructive">{error}</p> : null}
      </div>

      <DialogFooter>
        <Button variant="secondary" onClick={() => onOpenChange(false)} disabled={isSubmitting}>
          Cancel
        </Button>
        <Button onClick={() => void handleCreate()} disabled={isSubmitting || !canSubmit}>
          {isSubmitting ? "Creating…" : "Create"}
        </Button>
      </DialogFooter>
    </>
  );
}

function renderField({
  field,
  value,
  onChange,
  validationState,
  onFieldBlur,
}: {
  field: CreateItemField;
  value: string;
  onChange: (value: string) => void;
  validationState: FieldValidationState | undefined;
  onFieldBlur: () => void;
}): ReactNode {
  const id = `create-item-${field.key}`;

  switch (field.type) {
    case "textarea": {
      return (
        <Textarea
          id={id}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={field.placeholder}
        />
      );
    }
    case "number": {
      return (
        <NumberField
          field={field}
          value={value}
          onChange={onChange}
          validationState={validationState}
          onBlur={onFieldBlur}
        />
      );
    }
    case "combo": {
      return <ComboField field={field} value={value} onChange={onChange} />;
    }
    // eslint-disable-next-line unicorn/no-useless-switch-case
    case "text":
    default: {
      return (
        <Input
          id={id}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={field.placeholder}
        />
      );
    }
  }
}

/**
 * Number input with optional uniqueness validation (on blur) and an
 * optional "Use next number" button. Overwriting a non-empty value via that
 * button asks for confirmation first; filling an empty field doesn't, since
 * there's nothing to lose.
 */
function NumberField({
  field,
  value,
  onChange,
  validationState,
  onBlur,
}: Readonly<{
  field: CreateItemField;
  value: string;
  onChange: (value: string) => void;
  validationState?: FieldValidationState;
  onBlur: () => void;
}>) {
  const { confirm: confirmAlert } = useAlert();
  const [maxNumber, setMaxNumber] = useState<number | null>(null);
  const [isFetchingNext, setIsFetchingNext] = useState(false);
  const id = `create-item-${field.key}`;

  const handleUseNext = async () => {
    if (!field.getNextNumber) return;

    if (value.trim()) {
      const confirmed = await confirmAlert({
        title: "Replace current number?",
        description: `This will replace "${value}" with the next available number.`,
        confirmText: "Replace",
        cancelText: "Cancel",
      });
      if (!confirmed) return;
    }

    setIsFetchingNext(true);
    try {
      const result = await field.getNextNumber();
      onChange(String(result.next_number));
      setMaxNumber(result.max_number);
    } catch (error) {
      console.error(`Failed to fetch next ${field.label.toLowerCase()}`, error);
    } finally {
      setIsFetchingNext(false);
    }
  };

  return (
    <div className="space-y-1">
      <div className="flex gap-2">
        <InputGroup>
          <InputGroupInput
            id={id}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            onBlur={onBlur}
            placeholder={field.placeholder}
          />
          {field.getNextNumber && (
            <InputGroupAddon align="inline-end">
              <InputGroupButton
                variant="secondary"
                onClick={() => void handleUseNext()}
                disabled={isFetchingNext}
              >
                Use next
              </InputGroupButton>
            </InputGroupAddon>
          )}
        </InputGroup>
      </div>
      {maxNumber === null ? null : (
        <p className="text-xs text-muted-foreground">Highest used so far: {maxNumber}</p>
      )}
      {validationState?.status === "checking" ? (
        <p className="text-xs text-muted-foreground">Checking…</p>
      ) : null}
      {validationState?.status === "invalid" ? (
        <p className="text-xs text-destructive">{validationState.message}</p>
      ) : null}
    </div>
  );
}

/**
 * Text input with search-backed suggestions, where the suggestion list is
 * advisory only. The field's value is always whatever text is currently
 * shown — picking a suggestion just fills that text in; it never blocks
 * free entry of something new.
 */
function ComboField({
  field,
  value,
  onChange,
}: Readonly<{
  field: CreateItemField;
  value: string;
  onChange: (value: string) => void;
}>) {
  const [selected, setSelected] = useState<string | null>(value || null);

  return (
    <SearchCombobox<string>
      value={selected}
      onValueChange={(item) => {
        setSelected(item);
        onChange(item ?? "");
      }}
      search={field.search ?? (() => Promise.resolve([]))}
      itemKey={(item) => item}
      itemLabel={(item) => item}
      placeholder={field.placeholder}
      emptyText={field.emptyText}
      searchQuery={{
        inputValue: value,
        onInputValueChange: (query) => {
          setSelected(null);
          onChange(query);
        },
      }}
      minSearchLength={0}
    />
  );
}
