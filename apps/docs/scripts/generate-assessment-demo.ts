import { mkdir, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import {
  frameworkDefinitions,
  inventoryOrder,
  scaleDisplayOverrides,
} from "../../survey/src/lib/survey/results/metadata";
import { ambiScaleDefinitions } from "../../survey/src/lib/survey/results/scoring-data";
import {
  PRIMAL_AGGREGATE_ITEM_NUMBERS,
  PRIMAL_AGGREGATE_ONLY_ITEMS,
  PRIMAL_TERTIARY_SCALES,
  PVQ_RR_BASIC_VALUES,
  PVQ_RR_HIGHER_ORDER_VALUES,
} from "../../survey/src/lib/survey/values-beliefs-source";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const OUTPUT_PATH = join(__dirname, "../content/docs/demo.mdx");

const primalAggregateDescriptions = {
  good: "Belief that the world is fundamentally good rather than bad.",
  safe: "Belief that the world is stable, fair, protective, and less dangerous.",
  enticing: "Belief that the world is interesting, beautiful, meaningful, and worth exploring.",
  alive: "Belief that the world feels intentional, interactive, and personally involving.",
} as const;

function cell(value: string | number | null | undefined) {
  return String(value ?? "")
    .replaceAll("|", "\\|")
    .replaceAll("\n", " ")
    .trim();
}

function itemList(items: readonly number[]) {
  return items.join(", ");
}

function keyedCount(items: readonly number[]) {
  return `${items.length} item${items.length === 1 ? "" : "s"}`;
}

function makeTable(headers: readonly string[], rows: readonly (readonly string[])[]) {
  return [
    `| ${headers.map(cell).join(" | ")} |`,
    `| ${headers.map(() => "---").join(" | ")} |`,
    ...rows.map((row) => `| ${row.map(cell).join(" | ")} |`),
  ].join("\n");
}

function personalitySection() {
  const lines = [
    "## Measures of Your Personality",
    "",
    "The personality catalogue is generated from the AMBI scale definitions audited against Appendix B of Yarkoni (2010). Each row shows the user-facing value name, the source scale label, and a compact description.",
    "",
  ];

  for (const inventoryCode of inventoryOrder) {
    const framework = frameworkDefinitions[inventoryCode];
    const scales = ambiScaleDefinitions.filter(
      (scale) => scale.inventoryCode === inventoryCode,
    );

    lines.push(`### ${framework.heading}`, "");
    lines.push(
      makeTable(
        ["No.", "Value", "Paper label", "Description"],
        scales.map((scale) => {
          const override = scaleDisplayOverrides[scale.scaleNo];

          return [
            String(scale.scaleNo),
            override?.displayName ?? scale.name,
            scale.name,
            override?.description ??
              `AMBI-derived ${scale.inventoryLabel} scale from the paper appendix.`,
          ];
        }),
      ),
      "",
    );
  }

  return lines.join("\n");
}

function personalValuesSection() {
  const higherOrderByCode = new Map(
    PVQ_RR_HIGHER_ORDER_VALUES.map((value) => [value.code, value.label]),
  );

  return [
    "## Personal Values",
    "",
    "The Personal Values part of the survey follows the PVQ-RR structure: 19 basic values, grouped into four higher-order motivations, with Face and Humility tracked as adjacent basic values.",
    "",
    "### Higher-order values",
    "",
    makeTable(
      ["Value", "Included basic values", "Description"],
      PVQ_RR_HIGHER_ORDER_VALUES.map((value) => [
        value.label,
        value.basicValueCodes
          .map((code) => PVQ_RR_BASIC_VALUES.find((basic) => basic.code === code)?.label ?? code)
          .join(", "),
        value.description,
      ]),
    ),
    "",
    "### Basic values",
    "",
    makeTable(
      ["Value", "Group", "Items", "Description"],
      PVQ_RR_BASIC_VALUES.map((value) => [
        value.label,
        value.higherOrder === "other"
          ? "Other"
          : higherOrderByCode.get(value.higherOrder) ?? value.higherOrder,
        itemList(value.itemNumbers),
        value.description,
      ]),
    ),
    "",
  ].join("\n");
}

function personalBeliefsSection() {
  const aggregateRows = [
    [
      "Primary",
      "Good",
      keyedCount(PRIMAL_AGGREGATE_ITEM_NUMBERS.good),
      primalAggregateDescriptions.good,
    ],
    [
      "Secondary",
      "Safe",
      keyedCount(PRIMAL_AGGREGATE_ITEM_NUMBERS.safe),
      primalAggregateDescriptions.safe,
    ],
    [
      "Secondary",
      "Enticing",
      keyedCount(PRIMAL_AGGREGATE_ITEM_NUMBERS.enticing),
      primalAggregateDescriptions.enticing,
    ],
    [
      "Secondary",
      "Alive",
      keyedCount(PRIMAL_AGGREGATE_ITEM_NUMBERS.alive),
      primalAggregateDescriptions.alive,
    ],
  ];

  return [
    "## Personal Beliefs",
    "",
    "The Personal Beliefs part of the survey follows the PI-99 primal world beliefs structure. The aggregate scores summarize broad assumptions about what the world is like; tertiary primals describe narrower belief values.",
    "",
    "### Aggregate primals",
    "",
    makeTable(["Level", "Value", "Items", "Description"], aggregateRows),
    "",
    "### Tertiary primals",
    "",
    makeTable(
      ["Value", "Low pole", "High pole", "Items", "Reverse-keyed items", "Description"],
      PRIMAL_TERTIARY_SCALES.map((scale) => [
        scale.label,
        scale.lowLabel,
        scale.highLabel,
        itemList(scale.itemNumbers),
        itemList(scale.reverseItemNumbers),
        scale.description,
      ]),
    ),
    "",
    "### Aggregate-only PI-99 items",
    "",
    makeTable(
      ["Item", "Reverse-keyed", "Prompt"],
      PRIMAL_AGGREGATE_ONLY_ITEMS.map((item) => [
        String(item.number),
        item.reverse ? "Yes" : "No",
        item.prompt,
      ]),
    ),
  ].join("\n");
}

async function main() {
  const content = [
    "---",
    "title: Demo assessment value catalogue",
    "description: Paper-derived personality scales, personal values, and belief values used by Ciao.",
    "docId: assessment-values-demo",
    "---",
    "",
    "This demo page describes the values surfaced by Ciao's `Measures of Your Personality` and `Personal Values and Beliefs` surveys.",
    "",
    "Return to [Hello world](/docs).",
    "",
    "## Source notes",
    "",
    "- Personality values come from the AMBI scale definitions audited against Yarkoni (2010).",
    "- Belief values come from the PI-99 primal world beliefs structure used in the local papers.",
    "- Personal value labels and groupings follow the app's PVQ-RR source definitions.",
    "",
    personalitySection(),
    personalValuesSection(),
    personalBeliefsSection(),
    "",
    "Return to [Hello world](/docs).",
    "",
  ].join("\n");

  await mkdir(dirname(OUTPUT_PATH), { recursive: true });
  await writeFile(OUTPUT_PATH, content, "utf8");
  console.log(`Generated ${OUTPUT_PATH}`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
