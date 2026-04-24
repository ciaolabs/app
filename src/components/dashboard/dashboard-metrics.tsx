"use client";

import { type ScoreBand } from "@/lib/survey/results/types";

const SVG_PRECISION = 1000;

function clamp(value: number, minValue: number, maxValue: number) {
  return Math.min(maxValue, Math.max(minValue, value));
}

function roundSvgCoordinate(value: number) {
  return Math.round(value * SVG_PRECISION) / SVG_PRECISION;
}

function polarX(centerX: number, angle: number, radius: number) {
  return roundSvgCoordinate(centerX + Math.cos(angle) * radius);
}

function polarY(centerY: number, angle: number, radius: number) {
  return roundSvgCoordinate(centerY - Math.sin(angle) * radius);
}

export function scoreBandColor(band: ScoreBand) {
  if (band === "High") {
    return "var(--accent-blue)";
  }

  if (band === "Low") {
    return "var(--accent-coral)";
  }

  return "var(--accent-sand)";
}

export function scoreBandAccent(band: ScoreBand) {
  if (band === "High") {
    return "rgba(127, 169, 209, 0.75)";
  }

  if (band === "Low") {
    return "rgba(230, 121, 109, 0.78)";
  }

  return "rgba(227, 218, 204, 0.92)";
}

type DashboardGaugeProps = {
  score: number;
  band: ScoreBand;
  label?: string;
  lowLabel?: string;
  highLabel?: string;
  median?: number;
  iqrStart?: number;
  iqrEnd?: number;
  className?: string;
};

export function DashboardGauge({
  score,
  band,
  label,
  lowLabel,
  highLabel,
  median,
  iqrStart,
  iqrEnd,
  className,
}: DashboardGaugeProps) {
  const radius = 82;
  const circumference = Math.PI * radius;
  const progress = score / 50;
  const dashOffset = circumference * (1 - progress);
  const centerX = 100;
  const centerY = 94;
  const path = `M ${centerX - radius} ${centerY} A ${radius} ${radius} 0 0 1 ${centerX + radius} ${centerY}`;
  const startValue = clamp((iqrStart ?? median ?? 25) - 1.5, 0, 50);
  const endValue = clamp((iqrEnd ?? median ?? 35) + 1.5, 0, 50);
  const medianValue = clamp(median ?? Math.round((startValue + endValue) / 2), 0, 50);
  const iqrStartAngle = Math.PI * (1 - startValue / 50);
  const iqrEndAngle = Math.PI * (1 - endValue / 50);
  const medianAngle = Math.PI * (1 - medianValue / 50);
  const iqrRadius = radius + 22;
  const iqrPath = `M ${polarX(centerX, iqrStartAngle, iqrRadius)} ${polarY(centerY, iqrStartAngle, iqrRadius)} A ${iqrRadius} ${iqrRadius} 0 0 1 ${polarX(centerX, iqrEndAngle, iqrRadius)} ${polarY(centerY, iqrEndAngle, iqrRadius)}`;
  const medianX = polarX(centerX, medianAngle, iqrRadius);
  const medianY = polarY(centerY, medianAngle, iqrRadius);

  return (
    <div className={["flex flex-col items-center gap-2", className ?? ""].join(" ")}>
      <svg viewBox="0 0 200 118" className="h-[9.5rem] w-full max-w-[12.75rem] overflow-visible">
        <path
          d={path}
          fill="none"
          stroke="var(--line)"
          strokeWidth="14"
          strokeLinecap="round"
          opacity="0.55"
        />
        <path
          d={path}
          fill="none"
          stroke={scoreBandAccent(band)}
          strokeWidth="14"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={dashOffset}
        />
        {[0, 10, 20, 30, 40, 50].map((tick) => {
          const angle = Math.PI * (1 - tick / 50);
          const outerX = polarX(centerX, angle, radius + 4);
          const outerY = polarY(centerY, angle, radius + 4);
          const innerX = polarX(centerX, angle, radius - 6);
          const innerY = polarY(centerY, angle, radius - 6);
          const labelX = polarX(centerX, angle, radius - 28);
          const labelY = roundSvgCoordinate(polarY(centerY, angle, radius - 28) + 6);

          return (
            <g key={tick}>
              <line
                x1={innerX}
                y1={innerY}
                x2={outerX}
                y2={outerY}
                stroke="var(--line-strong)"
                strokeWidth="1.5"
              />
              <text
                x={labelX}
                y={labelY}
                fill="var(--muted)"
                fontSize="9"
                textAnchor="middle"
              >
                {tick}
              </text>
            </g>
          );
        })}
        <path
          d={iqrPath}
          fill="none"
          stroke="var(--muted)"
          strokeWidth="2.5"
          opacity="0.75"
        />
        <circle cx={medianX} cy={medianY} r="4" fill="var(--muted)" />
      </svg>
      <div className="-mt-14 text-center">
        <p className="text-[2.75rem] leading-none text-[var(--ink)]">{score}</p>
        <p className="mt-1 text-lg text-[var(--ink-soft)]">{band}</p>
      </div>
      {lowLabel && highLabel ? (
        <div className="mt-1 flex w-full max-w-[12.75rem] items-center justify-between gap-4 text-sm text-[var(--ink)]">
          <span>{lowLabel}</span>
          <span>{highLabel}</span>
        </div>
      ) : label ? (
        <p className="max-w-[12.75rem] text-center text-[1.35rem] leading-tight text-[var(--ink)]">
          {label}
        </p>
      ) : null}
      {median !== undefined ? (
        <p className="text-sm text-[var(--muted)]">Majority of people (IQR)</p>
      ) : null}
    </div>
  );
}

type SegmentedScoreBarProps = {
  value: number;
  maxValue: number;
  band: ScoreBand;
  minPercent?: number;
  className?: string;
};

export function SegmentedScoreBar({
  value,
  maxValue,
  band,
  minPercent = 6,
  className,
}: SegmentedScoreBarProps) {
  const width = clamp((value / maxValue) * 100, minPercent, 100);

  return (
    <div
      className={[
        "relative h-4 overflow-hidden rounded-full bg-[var(--surface-inset)]",
        className ?? "",
      ].join(" ")}
    >
      <div
        className="absolute inset-y-0 left-0 rounded-full"
        style={{
          width: `${width}%`,
          background: `linear-gradient(90deg, color-mix(in srgb, ${scoreBandColor(band)} 18%, transparent), color-mix(in srgb, ${scoreBandColor(band)} 62%, rgba(255,255,255,0.08)))`,
        }}
      />
      <div
        className="absolute inset-0 opacity-85"
        style={{
          backgroundImage:
            "linear-gradient(90deg, transparent calc(20% - 1px), var(--surface-panel) calc(20% - 1px), var(--surface-panel) 20%, transparent 20%, transparent calc(40% - 1px), var(--surface-panel) calc(40% - 1px), var(--surface-panel) 40%, transparent 40%, transparent calc(60% - 1px), var(--surface-panel) calc(60% - 1px), var(--surface-panel) 60%, transparent 60%, transparent calc(80% - 1px), var(--surface-panel) calc(80% - 1px), var(--surface-panel) 80%, transparent 80%)",
        }}
      />
    </div>
  );
}
