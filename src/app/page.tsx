import { CallToAction } from "@/components/landing/cta";
import { DataPreview } from "@/components/landing/data-preview";
import { Hero } from "@/components/landing/hero";
import { HowItWorks } from "@/components/landing/how-it-works";
import { MetricsGrid } from "@/components/landing/metrics-grid";

export default function Home() {
  return (
    <main className="flex flex-col bg-linear-to-b from-white via-slate-50 to-white">
      <Hero />
      <MetricsGrid />
      <DataPreview />
      <HowItWorks />
      <CallToAction />
    </main>
  );
}
