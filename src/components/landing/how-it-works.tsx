import { Section } from '@/components/layout/section';
import { Badge } from '@/components/ui/badge';

const steps = [
  {
    title: 'Ingest + Validate',
    description:
      'CSV outbreak bulletins from Toronto Public Health are parsed nightly with facility deduplication and sanity checks.',
    detail:
      'Seeder service enforces idempotency so we never double count historical records.',
  },
  {
    title: 'Normalize + Store',
    description:
      'Entity Framework Core persists facilities, outbreaks, and case stats with referential integrity and AutoMapper DTOs.',
    detail:
      'Repositories expose async CRUD plus JSON Patch for partial updates.',
  },
  {
    title: 'Activate Insights',
    description:
      'This Next.js experience fetches the API in real time, caching responses via TanStack Query and surfacing actionable views.',
    detail:
      'shadcn/ui + Tailwind provide an accessible design system tuned for operations teams.',
  },
];

export function HowItWorks() {
  return (
    <Section
      id="learn-more"
      eyebrow="Platform"
      title="Purpose-built for outbreak intelligence pipelines"
      description="Every layer—from ingestion through visualization—is transparent, documented, and production ready."
    >
      <div className="grid gap-6 md:grid-cols-3">
        {steps.map((step, index) => (
          <div
            key={step.title}
            className="rounded-2xl border border-amber-200 bg-white p-6 shadow-sm"
          >
            <Badge variant="outline" className="mb-4 rounded-full px-3 py-1">
              Step {index + 1}
            </Badge>
            <h3 className="text-xl font-semibold">{step.title}</h3>
            <p className="mt-2 text-sm text-muted-foreground">
              {step.description}
            </p>
            <p className="mt-4 text-sm text-foreground/80">{step.detail}</p>
          </div>
        ))}
      </div>
    </Section>
  );
}
