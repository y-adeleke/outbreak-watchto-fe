import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/api';
import type {
  CaseStatDto,
  FacilityListDto,
  OutbreakDetailDto,
  OutbreakListDto,
  OverviewMetrics,
} from '@/lib/types';

const queryKeys = {
  outbreaks: ['outbreaks'] as const,
  outbreak: (id: number) => ['outbreak', id] as const,
  facilities: ['facilities'] as const,
  caseStats: ['case-stats'] as const,
};

export const useOutbreaks = () =>
  useQuery<OutbreakListDto[]>({
    queryKey: queryKeys.outbreaks,
    queryFn: apiClient.getOutbreaks,
  });

export const useOutbreak = (id: number) =>
  useQuery<OutbreakDetailDto>({
    queryKey: queryKeys.outbreak(id),
    queryFn: () => apiClient.getOutbreakById(id),
    enabled: Number.isFinite(id),
  });

export const useFacilities = () =>
  useQuery<FacilityListDto[]>({
    queryKey: queryKeys.facilities,
    queryFn: apiClient.getFacilities,
  });

export const useCaseStats = () =>
  useQuery<CaseStatDto[]>({
    queryKey: queryKeys.caseStats,
    queryFn: apiClient.getCaseStats,
  });

export const useOverviewMetrics = () => {
  const outbreaksQuery = useOutbreaks();
  const facilitiesQuery = useFacilities();
  const statsQuery = useCaseStats();

  const metrics = useMemo<OverviewMetrics | undefined>(() => {
    if (
      !outbreaksQuery.data ||
      !facilitiesQuery.data ||
      !statsQuery.data
    ) {
      return undefined;
    }

    const totalOutbreaks = outbreaksQuery.data.length;
    const activeOutbreaks = outbreaksQuery.data.filter(
      (o) => o.isActive,
    ).length;
    const resolvedOutbreaks = totalOutbreaks - activeOutbreaks;
    const impactedFacilities = new Set(
      outbreaksQuery.data
        .filter((o) => o.isActive)
        .map((o) => o.facilityName),
    ).size;
    const totalResidentCases = statsQuery.data.reduce(
      (sum, stat) => sum + stat.residentCases,
      0,
    );
    const totalStaffCases = statsQuery.data.reduce(
      (sum, stat) => sum + stat.staffCases,
      0,
    );
    const fatalities = statsQuery.data.reduce(
      (sum, stat) => sum + stat.deaths,
      0,
    );

    return {
      totalOutbreaks,
      activeOutbreaks,
      resolvedOutbreaks,
      impactedFacilities,
      totalResidentCases,
      totalStaffCases,
      fatalities,
    };
  }, [outbreaksQuery.data, facilitiesQuery.data, statsQuery.data]);

  return {
    metrics,
    outbreaksQuery,
    facilitiesQuery,
    statsQuery,
  };
};
