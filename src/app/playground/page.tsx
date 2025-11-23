import type { Metadata } from 'next';
import { OutbreakActionsPanel } from '@/features/outbreaks/components/outbreak-actions-panel';
import { FacilityActionsPanel } from '@/features/facilities/components/facility-actions-panel';
import { CaseStatsActionsPanel } from '@/features/case-stats/components/case-stats-actions-panel';

export const metadata: Metadata = {
  title: 'API Playground | OutbreakWatchTO',
  description:
    'Postman-like playground to exercise every HTTP verb for outbreaks, facilities, and case stats.',
};

export default function PlaygroundPage() {
  return (
    <main className="mx-auto max-w-6xl px-4 py-10 space-y-10">
      <div className="space-y-2">
        <p className="text-sm uppercase tracking-wider text-primary">API playground</p>
        <h1 className="text-3xl font-semibold">Exercise every endpoint</h1>
        <p className="text-muted-foreground">
          This page centralizes the Postman-style consoles for all controllers. Use it for explicit
          verb testing; the main pages have user-first forms for the same actions.
        </p>
      </div>
      <OutbreakActionsPanel />
      <FacilityActionsPanel />
      <CaseStatsActionsPanel />
    </main>
  );
}
