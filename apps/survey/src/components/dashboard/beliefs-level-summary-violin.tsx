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

// 6 tick marks at Likert-response positions on the 0-50 scale
const TICK_VALUES = [0, 10, 20, 30, 40, 50] as const;

// Inline style for grid — dynamic Tailwind classes aren't statically analysable
const ROW_GRID_STYLE: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "minmax(0, 5.75rem) minmax(0, 1fr) minmax(0, 5.75rem) 3.75rem",
  alignItems: "center",
  gap: "0.75rem",
};

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

function MiniReferenceViolin({
  item,
  annotated,
}: {
  item: PolarScaleResult;
  annotated?: boolean;
}) {
  const points = buildReferenceDistribution(item.reference);
  const highestDensity = max(points, (point) => point.density) ?? 1;
  const xScale = scaleLinear().domain([-1, 51]).range([PLOT_LEFT, PLOT_RIGHT]);
  const halfHeightScale = scaleLinear().domain([0, highestDensity]).range([0, 13]);

  const violinPath =
    area<PlotPoint>()
      .x((point) => xScale(point.value))
      .y0((point) => CENTER_Y - halfHeightScale(point.density))
      .y1((point) => CENTER_Y + halfHeightScale(point.density))
      .curve(curveCatmullRom.alpha(0.5))(points) ?? "";

  const scoreX = xScale(clamp(item.score, 0, 50));
  const meanX = xScale(clamp(item.reference.mean, 0, 50));

  // Percentage-based positions for HTML overlays (works with preserveAspectRatio="none")
  const scoreXPct = (scoreX / PLOT_WIDTH) * 100;
  const meanXPct = (meanX / PLOT_WIDTH) * 100;
  const tickXs = TICK_VALUES.map((v) => xScale(v));

  const svgEl = (
    <svg
      viewBox={`0 0 ${PLOT_WIDTH} ${PLOT_HEIGHT}`}
      // preserveAspectRatio="none" makes the violin fill the full column width
      preserveAspectRatio="none"
      className="h-10 w-full"
      aria-hidden="true"
    >
      {/* Center axis — vectorEffect keeps stroke at 1px despite horizontal stretch */}
      <line
        x1={PLOT_LEFT}
        x2={PLOT_RIGHT}
        y1={CENTER_Y}
        y2={CENTER_Y}
        stroke="var(--plot-grid)"
        strokeWidth="1"
        vectorEffect="non-scaling-stroke"
      />

      {/* 6 interval tick marks at Likert positions */}
      {tickXs.map((x, i) => (
        <line
          key={i}
          x1={x}
          x2={x}
          y1={CENTER_Y - 5}
          y2={CENTER_Y + 5}
          stroke="var(--plot-grid)"
          strokeWidth="1"
          opacity="0.7"
          vectorEffect="non-scaling-stroke"
        />
      ))}

      {/* Violin body */}
      <path d={violinPath} fill="var(--plot-label)" fillOpacity="0.18" />
    </svg>
  );

  // Dots are HTML divs — SVG circles become ellipses with preserveAspectRatio="none"
  // because X and Y scale differently. HTML divs with border-radius: 50% stay circular.
  const dotsEl = (
    <div className="pointer-events-none absolute inset-0">
      <div
        className="absolute -translate-x-1/2 -translate-y-1/2 rounded-full"
        style={{
          left: `${meanXPct}%`,
          top: "50%",
          width: "5px",
          height: "5px",
          backgroundColor: "var(--muted)",
          opacity: 0.75,
        }}
      />
      <div
        className="absolute -translate-x-1/2 -translate-y-1/2 rounded-full"
        style={{
          left: `${scoreXPct}%`,
          top: "50%",
          width: "10px",
          height: "10px",
          backgroundColor: scoreBandColor(item.band),
          boxShadow: "0 0 0 1.5px white",
        }}
      />
    </div>
  );

  if (!annotated) {
    return (
      <div className="relative">
        {svgEl}
        {dotsEl}
      </div>
    );
  }

  // For the first (annotated) row, overlay HTML labels above/below.
  // Percentage positioning aligns them with the HTML dot overlays.
  return (
    <div className="relative">
      <span
        className="pointer-events-none absolute whitespace-nowrap text-[11px] leading-none text-[var(--plot-label)]"
        style={{
          bottom: "calc(100% + 5px)",
          left: `${scoreXPct}%`,
          transform: "translateX(-50%)",
        }}
      >
        My score
      </span>
      {svgEl}
      {dotsEl}
      <span
        className="pointer-events-none absolute whitespace-nowrap text-[11px] leading-none text-[var(--muted)]"
        style={{
          top: "calc(100% + 5px)",
          left: `calc(${meanXPct}% + 8px)`,
        }}
      >
        Others
      </span>
    </div>
  );
}

function SummaryRow({
  item,
  annotated,
}: {
  item: PolarScaleResult;
  annotated?: boolean;
}) {
  const highlightHigh = item.percentileDirection === "higher";

  return (
    <li style={ROW_GRID_STYLE}>
      <span
        className={
          highlightHigh
            ? "text-sm text-[var(--ink-soft)]"
            : "text-sm font-semibold text-[var(--ink)]"
        }
      >
        {item.lowLabel}
      </span>
      <MiniReferenceViolin item={item} annotated={annotated} />
      <span
        className={
          highlightHigh
            ? "text-right text-sm font-semibold text-[var(--ink)]"
            : "text-right text-sm text-[var(--ink-soft)]"
        }
      >
        {item.highLabel}
      </span>
      <span className="text-right text-sm text-[var(--ink-soft)]">
        {formatOrdinal(item.percentile)}
      </span>
    </li>
  );
}

export function BeliefsLevelSummaryViolin({
  groups,
}: BeliefsLevelSummaryViolinProps) {
  return (
    <section
      data-pdf-capture
      aria-label="Beliefs level summary violin"
      className="rounded-[1.5rem] border border-[var(--line)] bg-[var(--surface-panel)] px-5 py-6 shadow-[var(--shadow-soft)] sm:px-6 sm:py-7"
    >
      <div className="flex items-end justify-between gap-4">
        <div>
          <p className="clay-label">Beliefs summary</p>
          <h2 className="mt-2 font-display text-4xl text-[var(--ink)]">
            I believe the world is...
          </h2>
        </div>
        <span className="shrink-0 pb-1 text-xs font-semibold uppercase tracking-[0.18em] text-[var(--muted)]">
          Percentile
        </span>
      </div>

      <div className="mt-6 space-y-6">
        {groups.map((group, groupIndex) => (
          <div
            key={group.id}
            className={groupIndex === 0 ? "" : "border-t border-[var(--line)] pt-5"}
          >
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[var(--muted)]">
              {group.label}
            </p>
            {/* Extra top margin on first group so the "My score" overflow label has room */}
            <ul className={`space-y-3 ${groupIndex === 0 ? "mt-7" : "mt-3"}`}>
              {group.items.map((item, itemIndex) => (
                <SummaryRow
                  key={item.id}
                  item={item}
                  annotated={groupIndex === 0 && itemIndex === 0}
                />
              ))}
            </ul>
          </div>
        ))}
      </div>
    </section>
  );
}
