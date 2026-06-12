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
    <article className="grid gap-3 px-1 py-3 lg:grid-cols-[minmax(0,1fr)_18rem] lg:items-start">
      <div>
        <h3 className="text-base leading-tight text-(--ink)">{title}</h3>
        <p className="mt-1 max-w-2xl text-[13px] leading-6 text-(--ink-soft)">{description}</p>
      </div>

      <div>
        <p className="text-right text-sm font-semibold text-(--ink)">{score}/50</p>
        <div className="mt-2">
          <SegmentedScoreBar value={score} maxValue={50} band={band} />
        </div>
        {lowLabel && highLabel ? (
          <div className="mt-1 flex items-start justify-between gap-4 text-xs leading-5 text-(--ink)">
            <span className="max-w-[7rem]">{lowLabel}</span>
            <span className="max-w-[7rem] text-right">{highLabel}</span>
          </div>
        ) : null}
        <p className="mt-2 text-right text-sm leading-6 text-(--ink-soft)">{sentence}</p>
      </div>
    </article>
  );
}
