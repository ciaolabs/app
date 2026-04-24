import React from "react";
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { DashboardGaugeCard } from "@/components/dashboard/dashboard-gauge-card";
import { SegmentedScoreRow } from "@/components/dashboard/segmented-score-row";

describe("values-beliefs dashboard primitives", () => {
  it("renders a gauge card with belief anchors", () => {
    render(
      React.createElement(DashboardGaugeCard, {
        title: "Safe vs. Dangerous",
        description: "Belief that the world is safe.",
        sentence: "You see the world as more Safe than 59% of people.",
        score: 31,
        band: "High",
        reference: {
          mean: 24,
          sd: 8,
          iqrStart: 18,
          iqrEnd: 29,
        },
        lowLabel: "Dangerous",
        highLabel: "Safe",
      }),
    );

    expect(screen.getByRole("heading", { name: "Safe vs. Dangerous" })).toBeInTheDocument();
    expect(screen.getByText("Dangerous")).toBeInTheDocument();
    expect(screen.getByText("Safe")).toBeInTheDocument();
    expect(screen.getByText("You see the world as more Safe than 59% of people.")).toBeInTheDocument();
  });

  it("renders segmented rows with higher and lower percentile variants", () => {
    render(
      <div>
        <SegmentedScoreRow
          title="Benevolence - Caring"
          description="Belief in caring for others."
          score={47}
          band="High"
          sentence="Higher than 61% of people."
        />
        <SegmentedScoreRow
          title="Interactive vs. Indifferent"
          description="Belief that the world reacts to your influence."
          score={24}
          band="Middle"
          sentence="Lower than 31% of people."
          lowLabel="Indifferent"
          highLabel="Interactive"
        />
      </div>,
    );

    expect(screen.getByText("Higher than 61% of people.")).toBeInTheDocument();
    expect(screen.getByText("Lower than 31% of people.")).toBeInTheDocument();
    expect(screen.getByText("Indifferent")).toBeInTheDocument();
    expect(screen.getByText("Interactive")).toBeInTheDocument();
  });
});
