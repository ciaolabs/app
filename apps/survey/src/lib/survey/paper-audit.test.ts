import { describe, expect, it } from "vitest";

import { QUESTION_COUNT } from "@/lib/survey/constants";
import { surveyQuestions } from "@/lib/survey/questions";
import { ambiScaleDefinitions } from "@/lib/survey/results/scoring-data";
import {
  appendixAItems,
  appendixBDuplicateKeyGroups,
  appendixBInventorySummary,
  appendixBScales,
  documentedSummaryConflicts,
} from "../../../tests/fixtures/ambi-paper";

function normalizePromptToAppendixDescription(prompt: string) {
  const withoutTrailingPeriod = prompt.endsWith(".") ? prompt.slice(0, -1) : prompt;

  if (!withoutTrailingPeriod.startsWith("I ")) {
    return withoutTrailingPeriod;
  }

  return `${withoutTrailingPeriod.charAt(2).toUpperCase()}${withoutTrailingPeriod.slice(3)}`;
}

function buildInventorySummary(
  scales: {
    inventoryLabel: string;
    keyedItems: { order: number }[];
  }[],
) {
  return scales.reduce<Record<string, { scaleCount: number; uniqueItemCount: number }>>(
    (summary, scale) => {
      const current = summary[scale.inventoryLabel] ?? { scaleCount: 0, uniqueItemCount: 0 };
      const uniqueOrders = new Set(
        scales
          .filter((candidate) => candidate.inventoryLabel === scale.inventoryLabel)
          .flatMap((candidate) => candidate.keyedItems.map((item) => item.order)),
      );

      summary[scale.inventoryLabel] = {
        scaleCount: current.scaleCount + 1,
        uniqueItemCount: uniqueOrders.size,
      };

      return summary;
    },
    {},
  );
}

function buildDuplicateKeyGroups(
  scales: {
    scaleNo: number;
    inventoryLabel: string;
    name: string;
    keyedItems: { order: number; reverse: boolean }[];
  }[],
) {
  const groupedByKey = new Map<string, typeof scales>();

  for (const scale of scales) {
    const canonicalKey = scale.keyedItems
      .map((item) => `${item.order}${item.reverse ? "R" : ""}`)
      .sort()
      .join(",");
    const current = groupedByKey.get(canonicalKey) ?? [];
    current.push(scale);
    groupedByKey.set(canonicalKey, current);
  }

  return [...groupedByKey.values()]
    .filter((group) => group.length > 1)
    .map((group) => ({
      scaleNumbers: group.map((entry) => entry.scaleNo).sort((left, right) => left - right),
      entries: group
        .map((entry) => ({
          scaleNo: entry.scaleNo,
          inventoryLabel: entry.inventoryLabel,
          name: entry.name,
        }))
        .sort((left, right) => left.scaleNo - right.scaleNo),
    }))
    .sort((left, right) => left.scaleNumbers[0] - right.scaleNumbers[0]);
}

describe("AMBI paper audit", () => {
  it("matches Appendix A order, IPIP IDs, and normalized item text", () => {
    const actualQuestions = surveyQuestions.map((question) => ({
      order: question.order,
      id: question.id,
      description: normalizePromptToAppendixDescription(question.prompt),
    }));

    expect(QUESTION_COUNT).toBe(181);
    expect(surveyQuestions).toHaveLength(181);
    expect(new Set(surveyQuestions.map((question) => question.id)).size).toBe(181);
    expect(actualQuestions).toEqual(appendixAItems);
  });

  it("matches Appendix B scale definitions, scoring keys, and reliability fields", () => {
    const actualScales = ambiScaleDefinitions.map((scale) => ({
      scaleNo: scale.scaleNo,
      inventoryLabel: scale.inventoryLabel,
      name: scale.name,
      key: scale.key,
      keyedItems: scale.keyedItems,
      convergentCorrelation: scale.convergentCorrelation,
      alphaGa: scale.alphaGa,
      alphaOriginal: scale.alphaOriginal,
    }));

    expect(ambiScaleDefinitions).toHaveLength(203);
    expect(new Set(ambiScaleDefinitions.map((scale) => scale.scaleNo)).size).toBe(203);
    expect(new Set(ambiScaleDefinitions.map((scale) => scale.inventoryLabel)).size).toBe(8);
    expect(actualScales).toEqual(appendixBScales);
  });

  it("preserves appendix-derived inventory summaries and documented exceptions", () => {
    const actualSummary = buildInventorySummary(ambiScaleDefinitions);
    const actualDuplicateGroups = buildDuplicateKeyGroups(ambiScaleDefinitions);

    expect(actualSummary).toEqual(appendixBInventorySummary);
    expect(actualSummary["HPI"]).toEqual({ scaleCount: 44, uniqueItemCount: 121 });
    expect(actualDuplicateGroups).toEqual(appendixBDuplicateKeyGroups);
    expect(actualDuplicateGroups).toEqual([
      {
        scaleNumbers: [32, 69],
        entries: [
          { scaleNo: 32, inventoryLabel: "HEXACO-PI", name: "Fairness" },
          { scaleNo: 69, inventoryLabel: "JPI-R", name: "Responsibility" },
        ],
      },
      {
        scaleNumbers: [62, 73],
        entries: [
          { scaleNo: 62, inventoryLabel: "JPI-R", name: "Sociability" },
          { scaleNo: 73, inventoryLabel: "MPQ", name: "Social Closeness" },
        ],
      },
      {
        scaleNumbers: [77, 88],
        entries: [
          { scaleNo: 77, inventoryLabel: "MPQ", name: "Control" },
          { scaleNo: 88, inventoryLabel: "6-FPQ", name: "Deliberativeness" },
        ],
      },
      {
        scaleNumbers: [127, 128, 129],
        entries: [
          { scaleNo: 127, inventoryLabel: "TCI", name: "Spiritual acceptance" },
          { scaleNo: 128, inventoryLabel: "TCI", name: "Enlightened" },
          { scaleNo: 129, inventoryLabel: "TCI", name: "Idealistic" },
        ],
      },
      {
        scaleNumbers: [142, 162],
        entries: [
          { scaleNo: 142, inventoryLabel: "CPI", name: "Well-being" },
          { scaleNo: 162, inventoryLabel: "HPI", name: "No guilt" },
        ],
      },
    ]);
    expect(documentedSummaryConflicts.map((conflict) => conflict.id).sort()).toEqual([
      "appendix-b-cross-inventory-duplicate-equations",
      "table-3-hpi-item-count",
    ]);
  });
});
