"use client";

import { max, quantileSorted, range, sum } from "d3-array";
import { scaleLinear } from "d3-scale";
import { area, curveCatmullRom } from "d3-shape";

import { LikertValue } from "@/lib/survey/types";

type ViolinPlotProps = {
  distribution: number[];
  labels: readonly string[];
  selectedValue: LikertValue;
  className?: string;
};

type PlotPoint = {
  value: number;
  count: number;
};

const WIDTH = 960;
const HEIGHT = 390;
const VIOLIN_CENTER_Y = 148;
const PLOT_LEFT = 18;
const PLOT_RIGHT = WIDTH - 18;
const TOP_LABEL_Y = 30;
const AXIS_DOT_Y = 298;
const AXIS_LABEL_Y = 320;
const STATS_CURVE_BASE_Y = 356;
const STATS_CURVE_CONTROL_Y = 336;
const STATS_BAR_Y = 372;

function clamp(value: number, minValue: number, maxValue: number) {
  return Math.min(maxValue, Math.max(minValue, value));
}

export function ViolinPlot({
  distribution,
  selectedValue,
  className,
}: ViolinPlotProps) {
  const total = sum(distribution);
  const highestCount = max(distribution) ?? 1;
  const expandedValues = distribution.flatMap((count, index) => range(count).map(() => index + 1));
  const q1 = quantileSorted(expandedValues, 0.25) ?? 1;
  const median = quantileSorted(expandedValues, 0.5) ?? 1;
  const q3 = quantileSorted(expandedValues, 0.75) ?? distribution.length;
  const iqr = q3 - q1;
  const whiskerLow = clamp(q1 - iqr * 1.5, 1, distribution.length);
  const whiskerHigh = clamp(q3 + iqr * 1.5, 1, distribution.length);
  const points: PlotPoint[] = [
    { value: 0.5, count: 0 },
    ...distribution.map((count, index) => ({
      value: index + 1,
      count,
    })),
    { value: distribution.length + 0.5, count: 0 },
  ];

  const xScale = scaleLinear()
    .domain([0.5, distribution.length + 0.5])
    .range([PLOT_LEFT, PLOT_RIGHT]);
  const halfHeightScale = scaleLinear().domain([0, highestCount]).range([0, 88]);

  const violinPath =
    area<PlotPoint>()
      .x((point) => xScale(point.value))
      .y0((point) => VIOLIN_CENTER_Y - halfHeightScale(point.count))
      .y1((point) => VIOLIN_CENTER_Y + halfHeightScale(point.count))
      .curve(curveCatmullRom.alpha(0.5))(points) ?? "";

  const q1X = xScale(q1);
  const medianX = xScale(median);
  const q3X = xScale(q3);
  const whiskerLowX = xScale(whiskerLow);
  const whiskerHighX = xScale(whiskerHigh);
  const whiskerArcPath = `M ${whiskerLowX} ${STATS_CURVE_BASE_Y} Q ${medianX} ${STATS_CURVE_CONTROL_Y} ${whiskerHighX} ${STATS_CURVE_BASE_Y}`;
  const medianDotY =
    ((1 - 0.5) ** 2) * STATS_CURVE_BASE_Y +
    2 * (1 - 0.5) * 0.5 * STATS_CURVE_CONTROL_Y +
    (0.5 ** 2) * STATS_CURVE_BASE_Y;

  return (
    <div
      className={[
        "flex h-full min-h-0 flex-col rounded-[1.8rem] border border-[var(--line)] bg-[var(--surface-panel-strong)] p-4 shadow-[var(--shadow-soft)]",
        className ?? "",
      ].join(" ")}
    >
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[var(--muted)]">
            Response pattern
          </p>
        </div>
        <div className="rounded-full bg-[var(--accent-mint)] px-3 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-[var(--selected-contrast)]">
          Selected: {selectedValue}
        </div>
      </div>

      <div className="mt-4 min-h-0 flex-1">
        <svg
          viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
          className="h-full min-h-[240px] w-full"
          role="img"
          aria-label="Violin plot showing the seeded distribution of responses for this question"
        >
          <defs>
            <linearGradient id="violin-fill" x1="0%" x2="100%" y1="0%" y2="100%">
              <stop offset="0%" stopColor="var(--plot-fill-start)" />
              <stop offset="100%" stopColor="var(--plot-fill-end)" />
            </linearGradient>
            <linearGradient id="iqr-fill" x1="0%" x2="100%" y1="0%" y2="0%">
              <stop offset="0%" stopColor="var(--accent-lilac)" />
              <stop offset="100%" stopColor="var(--accent-mint)" />
            </linearGradient>
          </defs>

          {distribution.map((count, index) => {
            const x = xScale(index + 1);
            const percent = Math.round((count / total) * 100);

            return (
              <g key={`${index + 1}-${count}`}>
                <circle cx={x} cy={AXIS_DOT_Y} r={2.5} fill="var(--plot-grid)" />
                <text
                  x={x}
                  y={AXIS_LABEL_Y}
                  fill="var(--plot-label)"
                  fontSize="12"
                  textAnchor="middle"
                >
                  {index + 1}
                </text>
                <text
                  x={x}
                  y={TOP_LABEL_Y}
                  fill="var(--plot-label)"
                  fontSize="11"
                  textAnchor="middle"
                >
                  {percent}%
                </text>
              </g>
            );
          })}

          <line
            x1={PLOT_LEFT}
            x2={PLOT_RIGHT}
            y1={VIOLIN_CENTER_Y}
            y2={VIOLIN_CENTER_Y}
            stroke="var(--plot-grid)"
            strokeDasharray="10 10"
            strokeWidth="1.2"
          />

          <path d={violinPath} fill="url(#violin-fill)" stroke="var(--plot-stroke)" strokeWidth="1.5" />

          <line
            x1={PLOT_LEFT}
            x2={PLOT_RIGHT}
            y1={AXIS_DOT_Y}
            y2={AXIS_DOT_Y}
            stroke="var(--plot-grid)"
            strokeDasharray="5 10"
            strokeWidth="1.2"
          />

          <path
            d={whiskerArcPath}
            fill="none"
            stroke="var(--plot-label)"
            strokeWidth="8"
            strokeLinecap="round"
            opacity="0.9"
          />
          <line
            x1={q1X}
            x2={q3X}
            y1={STATS_BAR_Y}
            y2={STATS_BAR_Y}
            stroke="url(#iqr-fill)"
            strokeWidth="12"
            strokeLinecap="round"
          />
          <circle
            cx={medianX}
            cy={medianDotY}
            r={11}
            fill="var(--plot-label)"
            stroke="var(--surface)"
            strokeWidth="4"
          />
        </svg>
      </div>
    </div>
  );
}
