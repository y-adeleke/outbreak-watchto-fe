"use client";

import Link from "next/link";
import { Play } from "lucide-react";
import { Button } from "@/components/ui/button";

export function Hero() {
  return (
    <section className="relative overflow-hidden bg-gradient-to-b from-white via-cyan-50/40 to-white">
      <div className="mx-auto flex max-w-6xl flex-col gap-10 px-4 py-20 md:flex-row md:items-center">
        <div className="flex-1 space-y-6">
          <h1 className="text-4xl font-semibold leading-tight md:text-5xl">Real-time outbreak intelligence for Toronto&apos;s most vulnerable communities.</h1>
          <p className="text-lg text-muted-foreground">
            OutbreakWatchTO ingests official data from Toronto Public Health and transforms it into a collaborative command center for long-term care and congregate settings.
          </p>
          <div className="flex flex-col gap-3 sm:flex-row">
            <Button asChild size="lg">
              <Link href="/outbreaks">Explore active outbreaks</Link>
            </Button>
            <Button asChild variant="outline" size="lg">
              <Link href="#learn-more" className="inline-flex items-center gap-2">
                <Play className="h-4 w-4" />
                Learn how it works
              </Link>
            </Button>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="rounded-2xl border border-cyan-200 bg-white p-5 shadow-sm">
              <p className="text-sm text-muted-foreground">Data freshness</p>
              <p className="text-3xl font-semibold">Nightly</p>
              <p className="text-sm text-muted-foreground">Automatic ingestion from Toronto Public Health with validation and anomaly detection.</p>
            </div>
            <div className="rounded-2xl border border-cyan-200 bg-white p-5 shadow-sm">
              <p className="text-sm text-muted-foreground">APIs exposed</p>
              <p className="text-3xl font-semibold">3+</p>
              <p className="text-sm text-muted-foreground">Outbreaks, facilities, and case stats available over REST with JSON Patch support.</p>
            </div>
          </div>
        </div>
        <div className="flex-1 rounded-3xl border border-cyan-100 bg-white/80 p-6 shadow-lg backdrop-blur">
          <div className="space-y-6">
            <div>
              <p className="text-sm font-semibold text-primary">API schema</p>
              <p className="text-sm text-muted-foreground">Outbreak DTOs include type, causative agents, facility names, and lifecycle tracking.</p>
            </div>
            <div className="grid gap-4">
              {[
                { label: "GET /api/outbreaks", detail: "Paginated listing with facility metadata." },
                { label: "GET /api/facilities", detail: "Address + setting for every institution." },
                { label: "GET /api/casestats", detail: "Resident/staff case counts and outcomes." },
              ].map((item) => (
                <div key={item.label} className="rounded-2xl border border-cyan-200 bg-cyan-50 p-5">
                  <p className="text-sm font-semibold text-cyan-700">{item.label}</p>
                  <p className="text-sm text-muted-foreground">{item.detail}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
