'use client';

import { TrendingUp, ShieldCheck, Activity, Users } from 'lucide-react';
import { Section } from '@/components/layout/section';
import { Skeleton } from '@/components/ui/skeleton';
import { useOverviewMetrics } from '@/features/api/hooks';

const metricsIcons = [
  { key: 'activeOutbreaks', label: 'Active outbreaks', icon: Activity },
  { key: 'impactedFacilities', label: 'Impacted facilities', icon: ShieldCheck },
  { key: 'totalResidentCases', label: 'Resident cases tracked', icon: Users },
  { key: 'fatalities', label: 'Reported fatalities', icon: TrendingUp },
] as const;

export function MetricsGrid() {
  const { metrics, outbreaksQuery, statsQuery } = useOverviewMetrics();
  const isLoading = outbreaksQuery.isLoading || statsQuery.isLoading;

  return (
    <Section
      eyebrow="Live metrics"
      title="Ground-truth numbers that matter to operations teams"
      description="We combine outbreak lifecycle data with case statistics to generate trusted situational awareness."
    >
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {metricsIcons.map(({ key, label, icon: Icon }) => (
          <div
            key={key}
            className="space-y-2 rounded-2xl border border-emerald-200 bg-white p-5 shadow-sm"
          >
            <div className="flex items-center gap-3">
              <div className="rounded-full bg-emerald-100 p-2">
                <Icon className="h-5 w-5 text-emerald-700" />
              </div>
              <p className="text-sm text-muted-foreground">{label}</p>
            </div>
            {isLoading || !metrics ? (
              <Skeleton className="h-10 w-24" />
            ) : (
              <p className="text-3xl font-semibold">
                {metrics[key].toLocaleString()}
              </p>
            )}
          </div>
        ))}
      </div>
    </Section>
  );
}
