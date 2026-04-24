"use client";

import { type ReactNode } from "react";

import { DashboardGauge } from "@/components/dashboard/dashboard-metrics";
import { type ReferenceDistribution, type ScoreBand } from "@/lib/survey/results/types";

type DashboardGaugeCardProps = {
  title: string;
  description: string;
  sentence: string;
  score: number;
  band: ScoreBand;
  reference: ReferenceDistribution;
  lowLabel?: string;
  highLabel?: string;
  children?: ReactNode;
};

export function DashboardGaugeCard({
  title,
  description,
  sentence,
  score,
  band,
  reference,
  lowLabel,
  highLabel,
  children,
}: DashboardGaugeCardProps) {
  return (
    <section className="rounded-[2.2rem] border border-[var(--line)] bg-[var(--surface-panel)] px-5 py-6 shadow-[var(--shadow-soft)] sm:px-6 sm:py-7">
      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.08fr)_18rem] xl:items-start">
        <div>
          <h2 className="font-display text-3xl text-[var(--ink)]">{title}</h2>
          <p className="mt-3 max-w-4xl text-base leading-7 text-[var(--ink-soft)]">{description}</p>
          <p className="mt-5 text-lg font-semibold leading-8 text-[var(--ink)]">{sentence}</p>
        </div>

        <DashboardGauge
          score={score}
          band={band}
          lowLabel={lowLabel}
          highLabel={highLabel}
          median={reference.mean}
          iqrStart={reference.iqrStart}
          iqrEnd={reference.iqrEnd}
        />
      </div>

      {children ? <div className="mt-6 border-t border-[var(--line)] pt-4">{children}</div> : null}
    </section>
  );
}
