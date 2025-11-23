import type { Metadata } from "next";
import { CaseStatsGrid } from "@/features/case-stats/components/case-stats-grid";

export const metadata: Metadata = {
  title: "Case statistics | OutbreakWatchTO",
  description: "Resident and staff case numbers with outcomes aggregated per outbreak.",
};

export default function CaseStatsPage() {
  return (
    <main className="mx-auto max-w-6xl px-4 py-10 space-y-6">
      <div className="space-y-2">
        <p className="text-sm uppercase tracking-wider text-primary">Case intelligence</p>
        <h1 className="text-3xl font-semibold">Resident and staff impact tracking</h1>
        <p className="text-muted-foreground">Data is synthesized from the /api/casestats endpoint seeded with sample figures to mimic operational reporting.</p>
      </div>
      <CaseStatsGrid />
    </main>
  );
}
