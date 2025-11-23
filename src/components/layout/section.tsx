import { ReactNode } from 'react';

interface SectionProps {
  id?: string;
  eyebrow?: string;
  title: string;
  description?: string;
  children: ReactNode;
}

export function Section({
  eyebrow,
  title,
  description,
  children,
  id,
}: SectionProps) {
  return (
    <section id={id} className="mx-auto w-full max-w-5xl px-4 py-12">
      <div className="mb-8 space-y-2 text-left">
        {eyebrow && (
          <p className="text-sm uppercase tracking-widest text-primary">
            {eyebrow}
          </p>
        )}
        <h2 className="text-3xl font-semibold md:text-4xl">{title}</h2>
        {description && (
          <p className="text-base text-muted-foreground">{description}</p>
        )}
      </div>
      <div className="rounded-3xl border border-dashed border-border/60 bg-card/50 p-6 shadow-sm backdrop-blur">
        {children}
      </div>
    </section>
  );
}
