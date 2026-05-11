"use client";

interface ComparisonInputFormProps {
  error: string | null;
  isPending: boolean;
  leftInput: string;
  rightInput: string;
  onLeftInputChange: (value: string) => void;
  onRightInputChange: (value: string) => void;
  onSubmit: (formData: FormData) => void;
}

function InputField({
  id,
  label,
  placeholder,
  value,
  onChange
}: {
  id: string;
  label: string;
  placeholder: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <div>
      <label htmlFor={id} className="eyebrow mb-2 block">
        {label}
      </label>
      <input
        id={id}
        name={id}
        required
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="field-input placeholder-muted w-full px-4 py-4 text-base"
        placeholder={placeholder}
      />
    </div>
  );
}

export function ComparisonInputForm({
  error,
  isPending,
  leftInput,
  rightInput,
  onLeftInputChange,
  onRightInputChange,
  onSubmit
}: ComparisonInputFormProps) {
  return (
    <form action={onSubmit} className="surface-form space-y-5 p-6">
      <InputField
        id="leftInput"
        label="First watch"
        placeholder="Rolex Air-King or a supported product URL"
        value={leftInput}
        onChange={onLeftInputChange}
      />
      <InputField
        id="rightInput"
        label="Second watch"
        placeholder="Rolex Explorer or a supported product URL"
        value={rightInput}
        onChange={onRightInputChange}
      />
      <button type="submit" disabled={isPending} className="action-button eyebrow eyebrow-tight w-full px-5 py-4 font-semibold">
        {isPending ? "Analyzing" : "Explain the difference"}
      </button>
      <p className="body-copy body-copy-faint text-sm">
        V1 uses a curated enthusiast watch catalog so the comparison logic stays grounded instead of hand-wavy.
      </p>
      {error ? <p className="status-danger p-4 text-sm">{error}</p> : null}
    </form>
  );
}
