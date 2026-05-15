"use client";

import type { ComparisonDomainOption } from "@/types/comparison";

interface ComparisonInputFormProps {
  activeDomain: string;
  domainOptions: ComparisonDomainOption[];
  error: string | null;
  isPending: boolean;
  leftInput: string;
  rightInput: string;
  supportedInputs: string[];
  validationMessage: string | null;
  onLeftInputChange: (value: string) => void;
  onRightInputChange: (value: string) => void;
  onDomainChange: (domain: string) => void;
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
  activeDomain,
  domainOptions,
  error,
  isPending,
  leftInput,
  rightInput,
  supportedInputs,
  validationMessage,
  onDomainChange,
  onLeftInputChange,
  onRightInputChange,
  onUseAsLeft,
  onUseAsRight,
  onUseSupportedInput,
  onSwapInputs,
  onClearInputs,
  onSubmit
}: ComparisonInputFormProps) {
  const selectedDomain = domainOptions.find((option) => option.domain === activeDomain) ?? domainOptions[0];
  const inputHints = selectedDomain.inputHints;
  const quickExamples = supportedInputs.slice(0, 6);
  const remainingExamples = supportedInputs.slice(6);
  const nextQuickFillTarget = !leftInput.trim() ? inputHints.leftLabel : !rightInput.trim() ? inputHints.rightLabel : inputHints.rightLabel;

  return (
    <form action={onSubmit} className="surface-form space-y-5 p-6">
      <div className="space-y-2">
        <p className="eyebrow">Comparison workspace</p>
        <h2 className="title-section">What are you deciding between?</h2>
        <p className="body-copy body-copy-faint text-sm">
          Enter two options in the same domain. Use examples only if you need help finding supported names.
        </p>
      </div>
      <div>
        <label htmlFor="domain" className="eyebrow mb-2 block">
          Comparison domain
        </label>
        <select
          id="domain"
          name="domain"
          className="field-input w-full px-4 py-4 text-base"
          value={activeDomain}
          onChange={(event) => onDomainChange(event.target.value)}
        >
          {domainOptions.map((option) => (
            <option key={option.domain} value={option.domain}>
              {option.label}
            </option>
          ))}
        </select>
        <p className="body-copy body-copy-faint mt-2 text-sm">{selectedDomain.description}</p>
      </div>
      <InputField
        id="leftInput"
        label={inputHints.leftLabel}
        placeholder={inputHints.placeholder}
        value={leftInput}
        onChange={onLeftInputChange}
      />
      <InputField
        id="rightInput"
        label={inputHints.rightLabel}
        placeholder={inputHints.placeholder}
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
        {isPending ? "Analyzing" : "Get the recommendation"}
      </button>
      {validationMessage ? <p className="status-warning p-4 text-sm">{validationMessage}</p> : null}
      <p className="body-copy body-copy-faint text-sm">{inputHints.helperText}</p>
      <div className="space-y-3">
        <div>
          <p className="eyebrow mb-3">Quick examples</p>
          <p className="body-copy body-copy-faint mb-3 text-sm">
            Tap one to fill <span className="body-copy-strong">{nextQuickFillTarget.toLowerCase()}</span>. Tap a second
            example to complete the pair.
          </p>
          <div className="flex flex-wrap gap-2">
            {quickExamples.map((supportedInput) => (
              <button
                key={supportedInput}
                type="button"
                className="pill-muted body-copy-strong px-4 py-2 text-sm transition"
                onClick={() => onUseSupportedInput(supportedInput)}
              >
                {supportedInput}
              </button>
            ))}
          </div>
        </div>

        <details className="surface-item p-4">
          <summary className="disclosure-trigger">
            <span>Browse supported examples</span>
            <span className="body-copy body-copy-faint text-xs">{supportedInputs.length} available</span>
          </summary>
          <div className="mt-4 grid gap-3">
            <p className="body-copy body-copy-faint text-sm">
              Use the main button to place an example automatically, or target it directly as the first or second input.
            </p>
            {quickExamples.map((supportedInput) => (
              <div key={`picker-${supportedInput}`} className="catalog-picker-row">
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

            {remainingExamples.length ? (
              <div className="divider-muted pt-4">
                <p className="eyebrow mb-3">More supported options</p>
                <div className="grid gap-3">
                  {remainingExamples.map((supportedInput) => (
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
              </div>
            ) : null}
          </div>
        </details>
      </div>
      {error ? <p className="status-danger p-4 text-sm">{error}</p> : null}
    </form>
  );
}
