import { describe, expect, it } from "vitest";
import { buildFallbackAnalysis, type RetrievedSource } from "./trauma-analyzer";

const sources: RetrievedSource[] = [
  {
    title: "Trauma",
    publisher: "American Psychological Association",
    url: "https://www.apa.org/topics/trauma",
    type: "clinical",
    whyItMatters: "Clinical overview",
  },
];

describe("trauma analyzer safety framing", () => {
  it("uses probabilistic language and includes source grounding", () => {
    const result = buildFallbackAnalysis("When I hear raised voices, my chest tightens and I go quiet.", sources);
    expect(result.framing.toLowerCase()).toContain("may share");
    expect(result.framing.toLowerCase()).not.toContain("definitely");
    expect(result.citations).toHaveLength(1);
    expect(result.sourceNote).toContain("not a diagnosis");
  });

  it("adds urgent support guidance when a safety concern is mentioned", () => {
    const result = buildFallbackAnalysis("I feel overwhelmed and I am worried I might hurt myself tonight.", sources);
    expect(result.nextSteps.urgentSupport.toLowerCase()).toContain("emergency");
    expect(result.nextSteps.urgentSupport.toLowerCase()).toContain("crisis");
  });
});
