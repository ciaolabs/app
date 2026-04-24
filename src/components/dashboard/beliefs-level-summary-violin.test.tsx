import React from "react";
import { render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { BeliefsLevelSummaryViolin } from "@/components/dashboard/beliefs-level-summary-violin";
import { type PolarScaleResult } from "@/lib/survey/results/types";

function makeBelief(overrides: Partial<PolarScaleResult>): PolarScaleResult {
  return {
    id: overrides.id ?? "good",
    label: overrides.label ?? "Good",
    description: overrides.description ?? "Belief that the world is good.",
    lowLabel: overrides.lowLabel ?? "Bad",
    highLabel: overrides.highLabel ?? "Good",
    score: overrides.score ?? 32,
    percentile: overrides.percentile ?? 50,
    percentileDirection: overrides.percentileDirection ?? "higher",
    percentileMagnitude: overrides.percentileMagnitude ?? 50,
    percentileText: overrides.percentileText ?? "Higher than 50% of reference respondents",
    comparisonLabel: overrides.comparisonLabel ?? "Good",
    comparisonText: overrides.comparisonText ?? "More Good than 50% of reference respondents",
    reference: overrides.reference ?? {
      mean: 26,
      sd: 7.5,
      iqrStart: 21,
      iqrEnd: 31,
    },
    band: overrides.band ?? "High",
  };
}

describe("BeliefsLevelSummaryViolin", () => {
  it("renders the three levels with the expected row counts and labels", () => {
    render(
      React.createElement(BeliefsLevelSummaryViolin, {
        groups: [
          {
            id: "level-1",
            label: "Level 1",
            items: [makeBelief({ id: "good", lowLabel: "Bad", highLabel: "Good", percentile: 50 })],
          },
          {
            id: "level-2",
            label: "Level 2",
            items: [
              makeBelief({ id: "enticing", lowLabel: "Dull", highLabel: "Enticing", percentile: 30 }),
              makeBelief({ id: "safe", lowLabel: "Dangerous", highLabel: "Safe", percentile: 59 }),
              makeBelief({ id: "alive", lowLabel: "Mechanistic", highLabel: "Alive", percentile: 64 }),
            ],
          },
          {
            id: "level-3",
            label: "Level 3",
            items: [
              makeBelief({ id: "meaningful", lowLabel: "Meaningless", highLabel: "Meaningful", percentile: 94 }),
              makeBelief({ id: "interesting", lowLabel: "Boring", highLabel: "Interesting", percentile: 75 }),
            ],
          },
        ],
      }),
    );

    const panel = screen.getByLabelText("Beliefs level summary violin");
    expect(within(panel).getByText("I believe the world is...")).toBeInTheDocument();
    expect(within(panel).getByText("Level 1")).toBeInTheDocument();
    expect(within(panel).getByText("Level 2")).toBeInTheDocument();
    expect(within(panel).getByText("Level 3")).toBeInTheDocument();
    expect(within(panel).getAllByRole("listitem")).toHaveLength(6);
    expect(within(panel).getByText("Good")).toBeInTheDocument();
    expect(within(panel).getByText("Meaningful")).toBeInTheDocument();
    expect(within(panel).getByText("94th")).toBeInTheDocument();
  });
});
