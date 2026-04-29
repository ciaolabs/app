"use client";

import { max, range } from "d3-array";
import { scaleLinear } from "d3-scale";
import { area, curveCatmullRom } from "d3-shape";

import { scoreBandColor } from "@/components/dashboard/dashboard-metrics";
import { type PolarScaleResult, type ReferenceDistribution } from "@/lib/survey/results/types";

type BeliefsLevelSummaryGroup = {
  id: string;
  label: string;
  items: readonly PolarScaleResult[];
};

type BeliefsLevelSummaryViolinProps = {
  groups: readonly BeliefsLevelSummaryGroup[];
};

type PlotPoint = {
  value: number;
  density: number;
};

const PLOT_WIDTH = 360;
const PLOT_HEIGHT = 40;
const PLOT_LEFT = 10;
const PLOT_RIGHT = PLOT_WIDTH - 10;
const CENTER_Y = PLOT_HEIGHT / 2;
const SUMMARY_GRID_COLUMNS =
  "minmax(0,5.75rem)_minmax(0,1fr)_minmax(0,5.75rem)_3.75rem";

function clamp(value: number, minValue: number, maxValue: number) {
  return Math.min(maxValue, Math.max(minValue, value));
}

function gaussian(value: number, mean: number, sd: number) {
  const safeSd = Math.max(sd, 1.5);
  return Math.exp(-((value - mean) ** 2) / (2 * safeSd ** 2));
}

function formatOrdinal(value: number) {
  const whole = Math.round(value);
  const mod100 = whole % 100;

  if (mod100 >= 11 && mod100 <= 13) {
    return `${whole}th`;
  }

  switch (whole % 10) {
    case 1:
      return `${whole}st`;
    case 2:
      return `${whole}nd`;
    case 3:
      return `${whole}rd`;
    default:
      return `${whole}th`;
  }
}

function buildReferenceDistribution(reference: ReferenceDistribution) {
  return [
    { value: -1, density: 0 },
    ...range(0, 51).map((value) => ({
      value,
      density: gaussian(value, reference.mean, reference.sd),
    })),
    { value: 51, density: 0 },
  ] satisfies PlotPoint[];
}

function MiniReferenceViolin({ item }: { item: PolarScaleResult }) {
  const points = buildReferenceDistribution(item.reference);
  const highestDensity = max(points, (point) => point.density) ?? 1;
  const xScale = scaleLinear().domain([-1, 51]).range([PLOT_LEFT, PLOT_RIGHT]);
  const halfHeightScale = scaleLinear().domain([0, highestDensity]).range([0, 12]);
  const violinPath =
    area<PlotPoint>()
      .x((point) => xScale(point.value))
      .y0((point) => CENTER_Y - halfHeightScale(point.density))
      .y1((point) => CENTER_Y + halfHeightScale(point.density))
      .curve(curveCatmullRom.alpha(0.5))(points) ?? "";
  const scoreX = xScale(clamp(item.score, 0, 50));
  const meanX = xScale(clamp(item.reference.mean, 0, 50));

  return (
    <svg
      viewBox={`0 0 ${PLOT_WIDTH} ${PLOT_HEIGHT}`}
      className="h-9 w-full"
      aria-hidden="true"
    >
      <line
        x1={PLOT_LEFT}
        x2={PLOT_RIGHT}
        y1={CENTER_Y}
        y2={CENTER_Y}
        stroke="var(--plot-grid)"
        strokeWidth="1.1"
      />
      <path
        d={violinPath}
        fill="color-mix(in srgb, var(--surface-panel-strong) 68%, var(--accent-blue) 32%)"
        opacity="0.9"
      />
      <circle cx={meanX} cy={CENTER_Y} r={2.2} fill="var(--muted)" />
      <circle
        cx={scoreX}
        cy={CENTER_Y}
        r={4}
        fill={scoreBandColor(item.band)}
        stroke="white"
        strokeWidth="1.5"
      />
    </svg>
  );
}

function SummaryRow({ item }: { item: PolarScaleResult }) {
  const highlightHigh = item.percentileDirection === "higher";

  return (
    <li className={`grid grid-cols-[${SUMMARY_GRID_COLUMNS}] items-center gap-3`}>
      <span className={highlightHigh ? "text-sm text-[var(--ink-soft)]" : "text-sm font-semibold text-[var(--ink)]"}>
        {item.lowLabel}
      </span>
      <MiniReferenceViolin item={item} />
      <span className={highlightHigh ? "text-sm font-semibold text-[var(--ink)] text-right" : "text-sm text-[var(--ink-soft)] text-right"}>
        {item.highLabel}
      </span>
      <span className="text-right text-sm text-[var(--ink-soft)]">{formatOrdinal(item.percentile)}</span>
    </li>
  );
}

export function BeliefsLevelSummaryViolin({ groups }: BeliefsLevelSummaryViolinProps) {
  return (
    <section
      data-pdf-capture
      aria-label="Beliefs level summary violin"
      className="rounded-[1.5rem] border border-[var(--line)] bg-[var(--surface-panel)] px-5 py-6 shadow-[var(--shadow-soft)] sm:px-6 sm:py-7"
    >
      <div className={`grid gap-4 lg:grid-cols-[${SUMMARY_GRID_COLUMNS}] lg:items-end`}>
        <div className="lg:col-span-2">
          <p className="clay-label">
            Beliefs summary
          </p>
          <h2 className="mt-2 font-display text-4xl text-[var(--ink)]">I believe the world is...</h2>
        </div>
        <div className="hidden contents text-xs font-semibold uppercase tracking-[0.18em] text-[var(--muted)] lg:contents">
          <span className="text-right">My score</span>
          <span className="text-right">Percentile</span>
        </div>
      </div>

      <div className="mt-6 space-y-6">
        {groups.map((group, index) => (
          <div
            key={group.id}
            className={index === 0 ? "" : "border-t border-[var(--line)] pt-5"}
          >
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[var(--muted)]">
              {group.label}
            </p>
            <ul className="mt-3 space-y-3">
              {group.items.map((item) => (
                <SummaryRow key={item.id} item={item} />
              ))}
            </ul>
          </div>
        ))}
      </div>
    </section>
  );
}
