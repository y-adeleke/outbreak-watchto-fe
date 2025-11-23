import type { Metadata } from "next";
import { FacilityDirectory } from "@/features/facilities/components/facility-directory";

export const metadata: Metadata = {
  title: "Facilities | OutbreakWatchTO",
  description: "Directory of long-term care and congregate settings impacted by outbreaks.",
};

export default function FacilitiesPage() {
  return (
    <main className="mx-auto max-w-6xl px-4 py-10 space-y-6">
      <div className="space-y-2">
        <p className="text-sm uppercase tracking-wider text-primary">Facilities</p>
        <h1 className="text-3xl font-semibold">Toronto institutions under surveillance</h1>
        <p className="text-muted-foreground">Addresses, care settings, and current outbreak counts.</p>
      </div>
      <FacilityDirectory />
    </main>
  );
}
