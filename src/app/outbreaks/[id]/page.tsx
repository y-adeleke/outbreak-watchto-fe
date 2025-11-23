import type { Metadata } from "next";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { OutbreakDetail } from "@/features/outbreaks/components/outbreak-detail";

interface PageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params;
  return {
    title: `Outbreak ${id} | OutbreakWatchTO`,
    description: "Detailed outbreak view powered by the OutbreakWatchTO API.",
  };
}

export default async function OutbreakDetailPage({ params }: PageProps) {
  const { id } = await params;
  const outbreakId = Number(id);
  console.log("outbreakId:", outbreakId, id);

  return (
    <main className="mx-auto max-w-4xl px-4 py-10 space-y-6">
      <Button asChild variant="ghost" size="sm">
        <Link href="/outbreaks">← Back to outbreaks</Link>
      </Button>
      <OutbreakDetail outbreakId={outbreakId} />
    </main>
  );
}
