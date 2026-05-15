import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { ComparisonHero } from "@/components/comparison-hero";
import { ComparisonInputForm } from "@/components/comparison-input-form";
import { ComparisonResultView } from "@/components/comparison-result";
import { supportedComparisonDomainOptions, supportedInputsForDomain, compareInputs } from "@/lib/services/compare";

function noop() {}

describe("comparison UI hierarchy", () => {
  it("frames the hero around a single comparison decision", () => {
    const html = renderToStaticMarkup(
      <ComparisonHero
        onApplyPreset={() => {
          return;
        }}
      />
    );

    expect(html).toContain("Ask one comparison question. Get one clear recommendation.");
    expect(html).toContain("Winner first");
    expect(html).toContain("Evidence on demand");
    expect(html).toContain("Start with an example");
  });

  it("guides the empty-state input workflow and folds the long example list", () => {
    const domainOptions = supportedComparisonDomainOptions();
    const html = renderToStaticMarkup(
      <ComparisonInputForm
        activeDomain="watches"
        domainOptions={domainOptions}
        error={null}
        isPending={false}
        leftInput=""
        rightInput=""
        supportedInputs={supportedInputsForDomain("watches")}
        validationMessage="Enter two supported names, references, or source URLs."
        onLeftInputChange={noop}
        onRightInputChange={noop}
        onDomainChange={noop}
        onUseAsLeft={noop}
        onUseAsRight={noop}
        onUseSupportedInput={noop}
        onSwapInputs={noop}
        onClearInputs={noop}
        onSubmit={noop}
      />
    );

    expect(html).toContain("Comparison workspace");
    expect(html).toContain("What are you deciding between?");
    expect(html).toContain("Get the recommendation");
    expect(html).toContain("Tap one to fill");
    expect(html).toContain("Browse supported examples");
  });

  it("keeps the result view verdict-first and moves deeper analysis behind disclosures", () => {
    const comparisonResult = compareInputs({
      domain: "watches",
      leftInput: "Rolex Air-King",
      rightInput: "Rolex Explorer"
    });

    expect(comparisonResult.status).toBe("completed");

    if (comparisonResult.status !== "completed") {
      throw new Error("Expected watch comparison fixture to resolve.");
    }

    const html = renderToStaticMarkup(
      <ComparisonResultView brain={null} result={comparisonResult.comparison} savedComparisonPath={null} />
    );

    expect(html).toContain("Decision ready");
    expect(html).toContain("Stronger choice");
    expect(html).toContain("Exception case");
    expect(html).toContain("More ways to interrogate this recommendation");
    expect(html).toContain("Model exceptions and alternate constraints");
    expect(html).toContain("Inspect evidence, limits, and confidence");
  });
});
