import Link from 'next/link';
import { Section } from '@/components/layout/section';
import { Button } from '@/components/ui/button';

export function CallToAction() {
  return (
    <Section
      eyebrow="Ready to deploy"
      title="Connect your operations team to real-time outbreak intelligence"
      description="Spin up the API + frontend locally, deploy to your preferred cloud, or fork the repository for your team."
    >
      <div className="flex flex-col items-center gap-4 text-center">
        <p className="text-muted-foreground">
          This UI is backed by ASP.NET Core with CSV ingestion, repository pattern, AutoMapper, and JSON Patch support.
        </p>
        <div className="flex flex-col gap-3 sm:flex-row">
          <Button asChild size="lg">
            <Link href="/outbreaks">View outbreaks</Link>
          </Button>
          <Button asChild variant="outline" size="lg">
            <Link href="/facilities">Review facilities</Link>
          </Button>
        </div>
      </div>
    </Section>
  );
}
