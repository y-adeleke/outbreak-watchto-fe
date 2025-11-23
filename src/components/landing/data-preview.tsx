'use client';

import Link from 'next/link';
import { ArrowUpRight, Activity } from 'lucide-react';
import { Section } from '@/components/layout/section';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useOutbreaks } from '@/features/api/hooks';

export function DataPreview() {
  const { data, isLoading } = useOutbreaks();
  const preview = data?.slice(0, 5) ?? [];

  return (
    <Section
      eyebrow="Live preview"
      title="See the API output without leaving the page"
      description="The widgets below run against the same REST endpoints your applications can consume."
    >
      <div className="space-y-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm uppercase tracking-wide text-primary">/api/outbreaks</p>
            <p className="text-sm text-muted-foreground">
              Sorted by most recently reported outbreaks.
            </p>
          </div>
          <Button asChild variant="outline" size="sm">
            <Link href="/outbreaks" className="inline-flex items-center gap-2">
              Open outbreaks explorer
              <ArrowUpRight className="h-4 w-4" />
            </Link>
          </Button>
        </div>
        <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>ID</TableHead>
                <TableHead>Facility</TableHead>
                <TableHead>Outbreak type</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading &&
                Array.from({ length: 5 }).map((_, index) => (
                  <TableRow key={index}>
                    <TableCell colSpan={4}>
                      <Skeleton className="h-6 w-full" />
                    </TableCell>
                  </TableRow>
                ))}
              {!isLoading &&
                preview.map((outbreak) => (
                  <TableRow key={outbreak.outbreakId}>
                    <TableCell className="font-mono text-sm">
                      #{outbreak.outbreakId}
                    </TableCell>
                    <TableCell>{outbreak.facilityName}</TableCell>
                    <TableCell>{outbreak.outbreakType}</TableCell>
                    <TableCell>
                      <Badge
                        variant={outbreak.isActive ? 'default' : 'secondary'}
                        className="inline-flex items-center gap-1"
                      >
                        <Activity className="h-3 w-3" />
                        {outbreak.isActive ? 'Active' : 'Resolved'}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              {!isLoading && preview.length === 0 && (
                <TableRow>
                  <TableCell colSpan={4} className="text-center text-sm text-muted-foreground">
                    No outbreak data available yet.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    </Section>
  );
}
