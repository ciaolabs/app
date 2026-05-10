import { describe, expect, it } from "vitest";

import {
  displayScoreFromMean,
  percentileDetailsFor,
  scoreBandFor,
} from "@/lib/survey/results/score-band";

describe("scoreBandFor", () => {
  // Boundary tests pinning the threshold rule. Drift here would silently
  // re-shape every survey result; the explorer flagged these as untested.
  it("classifies the lower boundary", () => {
    expect(scoreBandFor(18)).toBe("Low");
    expect(scoreBandFor(19)).toBe("Low");
    expect(scoreBandFor(20)).toBe("Middle");
  });

  it("classifies the upper boundary", () => {
    expect(scoreBandFor(30)).toBe("Middle");
    expect(scoreBandFor(31)).toBe("High");
    expect(scoreBandFor(32)).toBe("High");
  });

  it("classifies the extremes", () => {
    expect(scoreBandFor(0)).toBe("Low");
    expect(scoreBandFor(50)).toBe("High");
  });
});

describe("percentileDetailsFor", () => {
  it("treats the 50 boundary as the higher branch", () => {
    const details = percentileDetailsFor(50, "people");
    expect(details).toEqual({
      percentile: 50,
      percentileDirection: "higher",
      percentileMagnitude: 50,
      percentileText: "Higher than 50% of people",
    });
  });

  it("flips to lower on values just below 50, with magnitude inverted", () => {
    const details = percentileDetailsFor(49, "people");
    expect(details).toEqual({
      percentile: 49,
      percentileDirection: "lower",
      percentileMagnitude: 51,
      percentileText: "Lower than 51% of people",
    });
  });

  it("clamps below 1 up to the lower bound", () => {
    const details = percentileDetailsFor(0, "people");
    expect(details.percentile).toBe(1);
    expect(details.percentileDirection).toBe("lower");
    expect(details.percentileMagnitude).toBe(99);
    expect(details.percentileText).toBe("Lower than 99% of people");
  });

  it("clamps above 99 down to the upper bound", () => {
    const details = percentileDetailsFor(200, "people");
    expect(details.percentile).toBe(99);
    expect(details.percentileDirection).toBe("higher");
    expect(details.percentileMagnitude).toBe(99);
  });

  it("inserts the comparison noun verbatim", () => {
    expect(percentileDetailsFor(80, "reference respondents").percentileText).toBe(
      "Higher than 80% of reference respondents",
    );
    expect(percentileDetailsFor(20, "people").percentileText).toBe("Lower than 80% of people");
  });

  it("rounds non-integer percentiles before classifying", () => {
    expect(percentileDetailsFor(49.6, "people").percentile).toBe(50);
    expect(percentileDetailsFor(49.4, "people").percentile).toBe(49);
  });
});

describe("displayScoreFromMean", () => {
  it("maps the bottom of the response scale to 0", () => {
    expect(displayScoreFromMean(1)).toBe(0);
  });

  it("maps the top of the response scale to 50", () => {
    expect(displayScoreFromMean(6)).toBe(50);
  });

  it("maps the midpoint to 25", () => {
    expect(displayScoreFromMean(3.5)).toBe(25);
  });

  it("clamps below the lower bound", () => {
    expect(displayScoreFromMean(0)).toBe(0);
    expect(displayScoreFromMean(-2)).toBe(0);
  });

  it("clamps above the upper bound", () => {
    expect(displayScoreFromMean(7)).toBe(50);
    expect(displayScoreFromMean(100)).toBe(50);
  });

  it("rounds to the nearest integer", () => {
    // 2.7 → ((1.7)/5)*50 = 17
    expect(displayScoreFromMean(2.7)).toBe(17);
    // 4.3 → ((3.3)/5)*50 = 33
    expect(displayScoreFromMean(4.3)).toBe(33);
  });
});
