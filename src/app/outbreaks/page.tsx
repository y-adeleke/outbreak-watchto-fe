import type { Metadata } from "next";
import { OutbreakExplorer } from "@/features/outbreaks/components/outbreak-explorer";

export const metadata: Metadata = {
  title: "Outbreaks | OutbreakWatchTO",
  description: "Live monitoring of outbreaks reported by Toronto Public Health with filtering and detailed drill-downs.",
};

export default function OutbreaksPage() {
  return (
    <main className="mx-auto max-w-6xl px-4 py-10">
      <div className="mb-8 space-y-2">
        <p className="text-sm uppercase tracking-wider text-primary">Outbreak operations</p>
        <h1 className="text-3xl font-semibold">Active + historical outbreaks</h1>
      </div>
      <OutbreakExplorer />
    </main>
  );
}
