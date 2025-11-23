import Link from 'next/link';
import { siteConfig } from '@/config/site';

export function SiteFooter() {
  return (
    <footer className="border-t bg-muted/40">
      <div className="mx-auto flex max-w-6xl flex-col gap-4 px-4 py-8 text-sm text-muted-foreground md:flex-row md:items-center md:justify-between">
        <div>
          <p className="font-semibold text-foreground">{siteConfig.name}</p>
          <p>Powered by Toronto Public Health outbreak feeds.</p>
        </div>
        <div className="flex flex-wrap gap-6">
          <Link href={`mailto:${siteConfig.contactEmail}`}>Contact</Link>
          <Link href={siteConfig.github} target="_blank" rel="noreferrer">
            GitHub
          </Link>
          <Link href={siteConfig.linkedin} target="_blank" rel="noreferrer">
            LinkedIn
          </Link>
        </div>
      </div>
    </footer>
  );
}
