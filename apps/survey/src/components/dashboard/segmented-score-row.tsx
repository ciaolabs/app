"use client";

import { SegmentedScoreBar } from "@/components/dashboard/dashboard-metrics";
import { type ScoreBand } from "@/lib/survey/results/types";

type SegmentedScoreRowProps = {
  title: string;
  description: string;
  score: number;
  band: ScoreBand;
  sentence: string;
  lowLabel?: string;
  highLabel?: string;
};

export function SegmentedScoreRow({
  title,
  description,
  score,
  band,
  sentence,
  lowLabel,
  highLabel,
}: SegmentedScoreRowProps) {
  return (
    <article className="grid gap-5 px-1 py-5 lg:grid-cols-[minmax(0,1fr)_18rem] lg:items-start">
      <div>
        <h3 className="text-[1.45rem] leading-tight text-[var(--ink)]">{title}</h3>
        <p className="mt-2 max-w-2xl text-[15px] leading-7 text-[var(--ink-soft)]">{description}</p>
      </div>

      <div>
        <p className="text-right text-xl font-semibold text-[var(--ink)]">{score}/50</p>
        <div className="mt-3">
          <SegmentedScoreBar value={score} maxValue={50} band={band} />
        </div>
        {lowLabel && highLabel ? (
          <div className="mt-2 flex items-start justify-between gap-4 text-sm leading-5 text-[var(--ink)]">
            <span className="max-w-[7rem]">{lowLabel}</span>
            <span className="max-w-[7rem] text-right">{highLabel}</span>
          </div>
        ) : null}
        <p className="mt-3 text-right text-base leading-7 text-[var(--ink-soft)]">{sentence}</p>
      </div>
    </article>
  );
}
