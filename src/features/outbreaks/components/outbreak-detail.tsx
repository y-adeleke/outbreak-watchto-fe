"use client";

import { useMemo } from "react";
import { useOutbreak, useCaseStats } from "@/features/api/hooks";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { OutbreakStatusBadge } from "./outbreak-status-badge";

interface Props {
  outbreakId: number;
}

export function OutbreakDetail({ outbreakId }: Props) {
  const { data, isLoading } = useOutbreak(outbreakId);
  const { data: stats } = useCaseStats();

  const stat = useMemo(() => stats?.find((entry) => entry.outbreakId === outbreakId), [stats, outbreakId]);

  if (isLoading) {
    return <Skeleton className="h-64 w-full" />;
  }

  if (!data) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Outbreak not found</CardTitle>
          <CardDescription>The requested outbreak does not exist or has been deleted.</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
          <div>
            <CardDescription>ID #{data.outbreakId}</CardDescription>
            <CardTitle>{data.facilityName}</CardTitle>
          </div>
          <OutbreakStatusBadge isActive={data.isActive} />
        </CardHeader>
        <CardContent className="grid gap-6 md:grid-cols-2">
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">Outbreak type</p>
            <p className="text-lg font-medium">{data.outbreakType}</p>
          </div>
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">Causative agents</p>
            <div className="flex flex-wrap gap-2">
              {[data.causativeAgent1, data.causativeAgent2].filter(Boolean).map((agent) => (
                <Badge key={agent} variant="destructive">
                  {agent}
                </Badge>
              ))}
              {!data.causativeAgent1 && !data.causativeAgent2 && <span className="text-sm text-muted-foreground">Unknown</span>}
            </div>
          </div>
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">Date began</p>
            <p className="text-lg font-medium">{new Date(data.dateBegan).toLocaleDateString()}</p>
          </div>
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">Date declared over</p>
            <p className="text-lg font-medium">{data.dateDeclaredOver ? new Date(data.dateDeclaredOver).toLocaleDateString() : "Still active"}</p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Case statistics</CardTitle>
          <CardDescription>Pulled from /api/casestats.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-3">
          {[
            { label: "Resident cases", value: stat?.residentCases, className: "text-blue-700" },
            { label: "Staff cases", value: stat?.staffCases, className: "text-green-700" },
            { label: "Deaths", value: stat?.deaths, className: "text-red-700" },
          ].map((item) => (
            <div key={item.label} className="rounded-2xl border bg-muted/30 p-4 text-center">
              <p className="text-sm text-muted-foreground">{item.label}</p>
              <p className={`text-3xl font-semibold ${item.className}`}>{item.value ?? "No data"}</p>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
