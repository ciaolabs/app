"use client";

import { memo, useEffect, useMemo, useState } from "react";
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

type PlotDimensions = {
  width: number;
  height: number;
  centerY: number;
  left: number;
  right: number;
  topLabelY: number;
  axisLabelY: number;
  tickHalfHeight: number;
  halfHeightMax: number;
  fontPercent: number;
  fontAxis: number;
  fontAnnotation: number;
  meanRadius: number;
  selectedRadius: number;
  strokeWidth: number;
  minHeightClass: string;
};

// Desktop keeps the original wide layout untouched. Mobile uses a squarer
// viewBox with much larger type and markers, so once the SVG is scaled down to
// a phone width the axis numbers and percentages stay legible instead of
// collapsing to a few pixels tall.
const DESKTOP_DIMENSIONS: PlotDimensions = {
  width: 960,
  height: 260,
  centerY: 130,
  left: 18,
  right: 942,
  topLabelY: 26,
  axisLabelY: 232,
  tickHalfHeight: 8,
  halfHeightMax: 60,
  fontPercent: 11,
  fontAxis: 12,
  fontAnnotation: 12,
  meanRadius: 6,
  selectedRadius: 10,
  strokeWidth: 1.2,
  minHeightClass: "min-h-50",
};

const MOBILE_DIMENSIONS: PlotDimensions = {
  width: 420,
  height: 300,
  centerY: 150,
  left: 28,
  right: 392,
  topLabelY: 42,
  axisLabelY: 278,
  tickHalfHeight: 12,
  halfHeightMax: 80,
  fontPercent: 22,
  fontAxis: 26,
  fontAnnotation: 22,
  meanRadius: 11,
  selectedRadius: 16,
  strokeWidth: 2,
  minHeightClass: "min-h-[13rem]",
};

type ViolinLayout = {
  total: number;
  violinPath: string;
  meanX: number;
  ticks: ReadonlyArray<{ x: number; index: number; percent: number }>;
};

function buildLayout(distribution: number[], dims: PlotDimensions): ViolinLayout {
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
    .range([dims.left, dims.right]);
  const halfHeightScale = scaleLinear()
    .domain([0, highestCount])
    .range([0, dims.halfHeightMax]);

  const violinPath =
    area<PlotPoint>()
      .x((point) => xScale(point.value))
      .y0((point) => dims.centerY - halfHeightScale(point.count))
      .y1((point) => dims.centerY + halfHeightScale(point.count))
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
    ticks,
  };
}

// Tracks the same `lg` breakpoint the survey layout uses, so the plot switches
// to its larger mobile configuration below 1024px.
function useIsMobilePlot() {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const query = window.matchMedia?.("(max-width: 1023px)");
    if (!query) {
      return;
    }

    const update = () => setIsMobile(query.matches);
    update();
    query.addEventListener("change", update);

    return () => query.removeEventListener("change", update);
  }, []);

  return isMobile;
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
  const isMobile = useIsMobilePlot();
  const dims = isMobile ? MOBILE_DIMENSIONS : DESKTOP_DIMENSIONS;
  const layout = useMemo(() => buildLayout(distribution, dims), [distribution, dims]);
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
          viewBox={`0 0 ${dims.width} ${dims.height}`}
          className={`h-full w-full ${dims.minHeightClass}`}
          role="img"
          aria-label="Violin plot showing the seeded distribution of responses for this question"
        >
          <line
            x1={dims.left}
            x2={dims.right}
            y1={dims.centerY}
            y2={dims.centerY}
            stroke="var(--plot-grid)"
            strokeWidth={dims.strokeWidth}
          />

          {layout.ticks.map(({ x, index }) => (
            <line
              key={`tick-${index}`}
              x1={x}
              x2={x}
              y1={dims.centerY - dims.tickHalfHeight}
              y2={dims.centerY + dims.tickHalfHeight}
              stroke="var(--plot-grid)"
              strokeWidth={dims.strokeWidth}
              opacity="0.7"
            />
          ))}

          <path d={layout.violinPath} fill="var(--plot-label)" fillOpacity="0.18" />

          {layout.ticks.map(({ x, index, percent }) => (
            <g key={`${index}-${percent}`}>
              <text
                x={x}
                y={dims.topLabelY}
                fill="var(--plot-label)"
                fontSize={dims.fontPercent}
                textAnchor="middle"
              >
                {percent}%
              </text>
              <text
                x={x}
                y={dims.axisLabelY}
                fill="var(--plot-label)"
                fontSize={dims.fontAxis}
                textAnchor="middle"
              >
                {index + 1}
              </text>
            </g>
          ))}

          <circle
            cx={layout.meanX}
            cy={dims.centerY}
            r={dims.meanRadius}
            fill="var(--muted)"
            opacity="0.75"
          />
          <text
            x={layout.meanX + dims.meanRadius + 6}
            y={dims.centerY + 22}
            fill="var(--muted)"
            fontSize={dims.fontAnnotation}
            textAnchor="start"
          >
            Others
          </text>

          {selectedTick ? (
            <>
              <text
                x={selectedTick.x}
                y={dims.centerY - 22}
                fill="var(--plot-label)"
                fontSize={dims.fontAnnotation}
                textAnchor="middle"
              >
                My score
              </text>
              <circle
                cx={selectedTick.x}
                cy={dims.centerY}
                r={dims.selectedRadius}
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
