import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

interface FormTextAreaFieldProps {
  value: string;
  onChange: (value: string) => void;
  validator?: (value: string) => Promise<unknown>;
  error?: string | null;
  id?: string;
  label: string;
  required?: boolean;
  placeholder?: string;
  disabled?: boolean;
}

export function FormTextAreaField({
  value,
  onChange,
  validator,
  error,
  id,
  label,
  required,
  placeholder,
  disabled,
}: Readonly<FormTextAreaFieldProps>) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={id}>
        {label}
        {required ? " *" : ""}
      </Label>
      <Textarea
        id={id}
        className="w-full"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onBlur={validator ? () => void validator(value) : undefined}
        placeholder={placeholder}
        disabled={disabled}
      />
      {error ? <p className="text-xs text-destructive">{error}</p> : null}
    </div>
  );
}
