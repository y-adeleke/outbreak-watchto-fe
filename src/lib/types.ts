export interface OutbreakListDto {
  outbreakId: number;
  facilityName: string;
  outbreakType: string;
  isActive: boolean;
}

export interface OutbreakDetailDto extends OutbreakListDto {
  causativeAgent1?: string | null;
  causativeAgent2?: string | null;
  dateBegan: string;
  dateDeclaredOver?: string | null;
}

export interface OutbreakCreateUpdateDto {
  facilityId: number;
  outbreakType: string;
  causativeAgent1?: string | null;
  causativeAgent2?: string | null;
  dateBegan: string;
  dateDeclaredOver?: string | null;
  isActive: boolean;
}

export interface FacilityListDto {
  facilityId: number;
  name: string;
  address: string;
  setting: string;
}

export type FacilityDetailDto = FacilityListDto;

export interface FacilityCreateUpdateDto {
  name: string;
  address: string;
  setting: string;
}

export interface CaseStatDto {
  caseStatId: number;
  outbreakId: number;
  residentCases: number;
  staffCases: number;
  deaths: number;
}

export interface CaseStatCreateUpdateDto {
  outbreakId: number;
  residentCases: number;
  staffCases: number;
  deaths: number;
}

export type JsonPatchOperation = {
  op: "replace" | "add" | "remove";
  path: string;
  value?: unknown;
};

export interface ApiErrorShape {
  status: number;
  message: string;
}

export interface OverviewMetrics {
  totalOutbreaks: number;
  activeOutbreaks: number;
  resolvedOutbreaks: number;
  impactedFacilities: number;
  totalResidentCases: number;
  totalStaffCases: number;
  fatalities: number;
}
