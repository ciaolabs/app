"use client";

import { memo, useMemo } from "react";
import { max, sum } from "d3-array";
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
const HEIGHT = 260;
const VIOLIN_CENTER_Y = 130;
const PLOT_LEFT = 18;
const PLOT_RIGHT = WIDTH - 18;
const TOP_LABEL_Y = 26;
const AXIS_LABEL_Y = 232;
const TICK_HALF_HEIGHT = 8;

type ViolinLayout = {
  total: number;
  violinPath: string;
  meanX: number;
  xScale: (value: number) => number;
  ticks: ReadonlyArray<{ x: number; index: number; percent: number }>;
};

function buildLayout(distribution: number[]): ViolinLayout {
  const total = sum(distribution);
  const highestCount = max(distribution) ?? 1;
  const weightedSum = distribution.reduce(
    (acc, count, index) => acc + (index + 1) * count,
    0,
  );
  const mean = total > 0 ? weightedSum / total : (distribution.length + 1) / 2;
  const points: PlotPoint[] = [
    { value: 0.5, count: 0 },
    ...distribution.map((count, index) => ({ value: index + 1, count })),
    { value: distribution.length + 0.5, count: 0 },
  ];

  const xScale = scaleLinear()
    .domain([0.5, distribution.length + 0.5])
    .range([PLOT_LEFT, PLOT_RIGHT]);
  const halfHeightScale = scaleLinear().domain([0, highestCount]).range([0, 60]);

  const violinPath =
    area<PlotPoint>()
      .x((point) => xScale(point.value))
      .y0((point) => VIOLIN_CENTER_Y - halfHeightScale(point.count))
      .y1((point) => VIOLIN_CENTER_Y + halfHeightScale(point.count))
      .curve(curveCatmullRom.alpha(0.5))(points) ?? "";

  const ticks = distribution.map((count, index) => ({
    x: xScale(index + 1),
    index,
    percent: total > 0 ? Math.round((count / total) * 100) : 0,
  }));

  return {
    total,
    violinPath,
    meanX: xScale(mean),
    xScale: (value: number) => xScale(value),
    ticks,
  };
}

const SelectedReadout = memo(function SelectedReadout({ value }: { value: LikertValue }) {
  return (
    <div className="rounded-full border border-[#238E98] bg-[#2CA0AB] px-3 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-white shadow-(--shadow-soft)">
      Selected: {value}
    </div>
  );
});

export const ViolinPlot = memo(function ViolinPlot({
  distribution,
  selectedValue,
  className,
}: ViolinPlotProps) {
  const layout = useMemo(() => buildLayout(distribution), [distribution]);
  const selectedTick = layout.ticks.find((tick) => tick.index + 1 === selectedValue);

  return (
    <div
      className={[
        "flex h-full min-h-0 flex-col rounded-[1.5rem] border border-[var(--line)] bg-[var(--surface-panel-strong)] p-4 shadow-[var(--shadow-soft)]",
        className ?? "",
      ].join(" ")}
    >
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="clay-label">
            Response pattern
          </p>
        </div>
        <SelectedReadout value={selectedValue} />
      </div>

      <div className="mt-4 min-h-0 flex-1">
        <svg
          viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
          className="h-full min-h-50 w-full"
          role="img"
          aria-label="Violin plot showing the seeded distribution of responses for this question"
        >
          <line
            x1={PLOT_LEFT}
            x2={PLOT_RIGHT}
            y1={VIOLIN_CENTER_Y}
            y2={VIOLIN_CENTER_Y}
            stroke="var(--plot-grid)"
            strokeWidth="1.2"
          />

          {layout.ticks.map(({ x, index }) => (
            <line
              key={`tick-${index}`}
              x1={x}
              x2={x}
              y1={VIOLIN_CENTER_Y - TICK_HALF_HEIGHT}
              y2={VIOLIN_CENTER_Y + TICK_HALF_HEIGHT}
              stroke="var(--plot-grid)"
              strokeWidth="1.2"
              opacity="0.7"
            />
          ))}

          <path d={layout.violinPath} fill="var(--plot-label)" fillOpacity="0.18" />

          {layout.ticks.map(({ x, index, percent }) => (
            <g key={`${index}-${percent}`}>
              <text
                x={x}
                y={TOP_LABEL_Y}
                fill="var(--plot-label)"
                fontSize="11"
                textAnchor="middle"
              >
                {percent}%
              </text>
              <text
                x={x}
                y={AXIS_LABEL_Y}
                fill="var(--plot-label)"
                fontSize="12"
                textAnchor="middle"
              >
                {index + 1}
              </text>
            </g>
          ))}

          <circle
            cx={layout.meanX}
            cy={VIOLIN_CENTER_Y}
            r={6}
            fill="var(--muted)"
            opacity="0.75"
          />
          <text
            x={layout.meanX + 12}
            y={VIOLIN_CENTER_Y + 22}
            fill="var(--muted)"
            fontSize="12"
            textAnchor="start"
          >
            Others
          </text>

          {selectedTick ? (
            <>
              <text
                x={selectedTick.x}
                y={VIOLIN_CENTER_Y - 22}
                fill="var(--plot-label)"
                fontSize="12"
                textAnchor="middle"
              >
                My score
              </text>
              <circle
                cx={selectedTick.x}
                cy={VIOLIN_CENTER_Y}
                r={10}
                fill="var(--clay-lemon-500)"
                stroke="var(--surface-panel-strong)"
                strokeWidth="3"
              />
            </>
          ) : null}
        </svg>
      </div>
    </div>
  );
});
