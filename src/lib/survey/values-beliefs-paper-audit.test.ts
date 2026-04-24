import { describe, expect, it } from "vitest";

import {
  PRIMAL_AGGREGATE_ITEM_NUMBERS,
  PRIMAL_AGGREGATE_ONLY_ITEMS,
  PRIMAL_TERTIARY_SCALES,
  PVQ_RR_BASIC_VALUES,
  PVQ_RR_HIGHER_ORDER_VALUES,
  PVQ_RR_SOURCE_ITEMS,
} from "@/lib/survey/values-beliefs-source";

describe("values and beliefs paper audit", () => {
  it("preserves the PI-99 tertiary structure, item count, and reverse keys", () => {
    const tertiaryItemNumbers = PRIMAL_TERTIARY_SCALES.flatMap((scale) => scale.itemNumbers);
    const reverseItemNumbers = [
      ...PRIMAL_TERTIARY_SCALES.flatMap((scale) => scale.reverseItemNumbers),
      ...PRIMAL_AGGREGATE_ONLY_ITEMS.filter((item) => item.reverse).map((item) => item.number),
    ];
    const allItemNumbers = [...tertiaryItemNumbers, ...PRIMAL_AGGREGATE_ONLY_ITEMS.map((item) => item.number)];

    expect(PRIMAL_TERTIARY_SCALES).toHaveLength(22);
    expect(tertiaryItemNumbers).toHaveLength(96);
    expect(PRIMAL_AGGREGATE_ONLY_ITEMS).toHaveLength(3);
    expect(new Set(allItemNumbers).size).toBe(99);
    expect(Math.min(...allItemNumbers)).toBe(1);
    expect(Math.max(...allItemNumbers)).toBe(99);
    expect(reverseItemNumbers).toHaveLength(39);
  });

  it("preserves the PI-99 primary and secondary aggregate memberships", () => {
    expect(PRIMAL_AGGREGATE_ITEM_NUMBERS.good).toHaveLength(71);
    expect(PRIMAL_AGGREGATE_ITEM_NUMBERS.safe).toHaveLength(29);
    expect(PRIMAL_AGGREGATE_ITEM_NUMBERS.enticing).toHaveLength(28);
    expect(PRIMAL_AGGREGATE_ITEM_NUMBERS.alive).toHaveLength(14);
    expect(PRIMAL_AGGREGATE_ITEM_NUMBERS.good.slice(0, 4)).toEqual([6, 7, 8, 9]);
    expect(PRIMAL_AGGREGATE_ITEM_NUMBERS.safe.slice(0, 4)).toEqual([23, 24, 25, 26]);
    expect(PRIMAL_AGGREGATE_ITEM_NUMBERS.enticing.slice(-2)).toEqual([97, 98]);
    expect(PRIMAL_AGGREGATE_ITEM_NUMBERS.alive).toContain(61);
  });

  it("preserves the PVQ-RR item count and 19 x 3 value mapping", () => {
    const scoredItemNumbers = PVQ_RR_BASIC_VALUES.flatMap((value) => value.itemNumbers);

    expect(PVQ_RR_SOURCE_ITEMS).toHaveLength(57);
    expect(PVQ_RR_BASIC_VALUES).toHaveLength(19);
    expect(PVQ_RR_BASIC_VALUES.every((value) => value.itemNumbers.length === 3)).toBe(true);
    expect(new Set(scoredItemNumbers).size).toBe(57);
    expect(Math.min(...scoredItemNumbers)).toBe(1);
    expect(Math.max(...scoredItemNumbers)).toBe(57);
    expect(PVQ_RR_HIGHER_ORDER_VALUES).toHaveLength(4);
  });

  it("preserves the higher-order PVQ-RR groupings from the scoring instructions", () => {
    expect(PVQ_RR_HIGHER_ORDER_VALUES.find((value) => value.code === "openness-to-change")?.basicValueCodes).toEqual([
      "self-direction-thought",
      "self-direction-action",
      "stimulation",
      "hedonism",
    ]);
    expect(PVQ_RR_HIGHER_ORDER_VALUES.find((value) => value.code === "self-transcendence")?.basicValueCodes).toEqual([
      "universalism-nature",
      "universalism-concern",
      "universalism-tolerance",
      "benevolence-caring",
      "benevolence-dependability",
    ]);
    expect(PVQ_RR_HIGHER_ORDER_VALUES.find((value) => value.code === "conservation")?.basicValueCodes).toEqual([
      "security-societal",
      "security-personal",
      "conformity-rules",
      "conformity-interpersonal",
      "tradition",
    ]);
    expect(PVQ_RR_HIGHER_ORDER_VALUES.find((value) => value.code === "self-enhancement")?.basicValueCodes).toEqual([
      "achievement",
      "power-resources",
      "power-dominance",
    ]);
  });
});
