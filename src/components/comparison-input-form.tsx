"use client";

interface ComparisonInputFormProps {
  error: string | null;
  isPending: boolean;
  leftInput: string;
  rightInput: string;
  supportedInputs: string[];
  validationMessage: string | null;
  onLeftInputChange: (value: string) => void;
  onRightInputChange: (value: string) => void;
  onUseAsLeft: (value: string) => void;
  onUseAsRight: (value: string) => void;
  onUseSupportedInput: (value: string) => void;
  onSwapInputs: () => void;
  onClearInputs: () => void;
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
  supportedInputs,
  validationMessage,
  onLeftInputChange,
  onRightInputChange,
  onUseAsLeft,
  onUseAsRight,
  onUseSupportedInput,
  onSwapInputs,
  onClearInputs,
  onSubmit
}: ComparisonInputFormProps) {
  return (
    <form action={onSubmit} className="surface-form space-y-5 p-6">
      <InputField
        id="leftInput"
        label="First input"
        placeholder="Rolex Air-King or a supported source URL"
        value={leftInput}
        onChange={onLeftInputChange}
      />
      <InputField
        id="rightInput"
        label="Second input"
        placeholder="Rolex Explorer or a supported source URL"
        value={rightInput}
        onChange={onRightInputChange}
      />
      <div className="grid gap-3 sm:grid-cols-2">
        <button type="button" className="pill-muted body-copy-strong px-4 py-3 text-sm transition" onClick={onSwapInputs}>
          Swap inputs
        </button>
        <button type="button" className="pill-muted body-copy-strong px-4 py-3 text-sm transition" onClick={onClearInputs}>
          Clear inputs
        </button>
      </div>
      <button
        type="submit"
        disabled={isPending || Boolean(validationMessage)}
        className="action-button eyebrow eyebrow-tight w-full px-5 py-4 font-semibold"
      >
        {isPending ? "Analyzing" : "Explain the difference"}
      </button>
      {validationMessage ? <p className="status-warning p-4 text-sm">{validationMessage}</p> : null}
      <p className="body-copy body-copy-faint text-sm">
        The first adapter supports curated mechanical watch names and matching source URLs. The comparison core is now
        domain-based, so services and other categories can be added as adapters.
      </p>
      <div className="grid gap-3">
        {supportedInputs.map((supportedInput) => (
          <div key={supportedInput} className="catalog-picker-row">
            <button
              type="button"
              className="catalog-picker-name body-copy-strong text-left text-sm transition"
              onClick={() => onUseSupportedInput(supportedInput)}
            >
              {supportedInput}
            </button>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                className="pill-muted eyebrow eyebrow-tight px-3 py-2 text-xs transition"
                onClick={() => onUseAsLeft(supportedInput)}
              >
                First
              </button>
              <button
                type="button"
                className="pill-muted eyebrow eyebrow-tight px-3 py-2 text-xs transition"
                onClick={() => onUseAsRight(supportedInput)}
              >
                Second
              </button>
            </div>
          </div>
        ))}
      </div>
      {error ? <p className="status-danger p-4 text-sm">{error}</p> : null}
    </form>
  );
}
