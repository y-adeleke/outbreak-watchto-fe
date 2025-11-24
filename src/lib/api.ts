import type {
  CaseStatCreateUpdateDto,
  CaseStatDto,
  FacilityCreateUpdateDto,
  FacilityDetailDto,
  FacilityListDto,
  JsonPatchOperation,
  OutbreakCreateUpdateDto,
  OutbreakDetailDto,
  OutbreakListDto,
} from "./types";

const API_BASE_URL = "https://34.111.66.96.nip.io/outbreakwatchapi";
const API_KEY = process.env.NEXT_PUBLIC_API_KEY;

class HttpClient {
  constructor(private readonly baseUrl: string, private readonly apiKey?: string) {}

  async request<T>(path: string, init?: RequestInit): Promise<T> {
    // ALWAYS safe-join
    const url = new URL(`${this.baseUrl.replace(/\/$/, "")}/${path.replace(/^\//, "")}`);

    if (this.apiKey) {
      url.searchParams.set("apikey", this.apiKey);
    }

    const response = await fetch(url.toString(), {
      ...init,
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
        ...init?.headers,
      },
      cache: "no-store",
    });

    if (!response.ok) {
      const body = await response.text();
      throw new Error(`API request failed (${response.status}): ${body || response.statusText}`);
    }

    if (response.status === 204) {
      return undefined as T;
    }

    return (await response.json()) as T;
  }
}

const httpClient = new HttpClient(API_BASE_URL, API_KEY || undefined);

export const apiClient = {
  // Outbreaks
  getOutbreaks: () => httpClient.request<OutbreakListDto[]>("/outbreaks"),
  getOutbreakById: (id: number) => httpClient.request<OutbreakDetailDto>(`/outbreaks/${id}`),
  createOutbreak: (payload: OutbreakCreateUpdateDto) =>
    httpClient.request<OutbreakDetailDto>("/outbreaks", {
      method: "POST",
      body: JSON.stringify(payload),
    }),
  updateOutbreak: (id: number, payload: OutbreakCreateUpdateDto) =>
    httpClient.request<void>(`/outbreaks/${id}`, {
      method: "PUT",
      body: JSON.stringify(payload),
    }),
  patchOutbreak: (id: number, operations: JsonPatchOperation[]) =>
    httpClient.request<void>(`/outbreaks/${id}`, {
      method: "PATCH",
      body: JSON.stringify(operations),
    }),
  deleteOutbreak: (id: number) =>
    httpClient.request<void>(`/outbreaks/${id}`, {
      method: "DELETE",
    }),

  // Facilities
  getFacilities: () => httpClient.request<FacilityListDto[]>("/facilities"),
  getFacilityById: (id: number) => httpClient.request<FacilityDetailDto>(`/facilities/${id}`),
  createFacility: (payload: FacilityCreateUpdateDto) =>
    httpClient.request<FacilityDetailDto>("/facilities", {
      method: "POST",
      body: JSON.stringify(payload),
    }),
  updateFacility: (id: number, payload: FacilityCreateUpdateDto) =>
    httpClient.request<void>(`/facilities/${id}`, {
      method: "PUT",
      body: JSON.stringify(payload),
    }),
  patchFacility: (id: number, operations: JsonPatchOperation[]) =>
    httpClient.request<void>(`/facilities/${id}`, {
      method: "PATCH",
      body: JSON.stringify(operations),
    }),
  deleteFacility: (id: number) =>
    httpClient.request<void>(`/facilities/${id}`, {
      method: "DELETE",
    }),

  // Case stats
  getCaseStats: () => httpClient.request<CaseStatDto[]>("/casestats"),
  getCaseStatById: (id: number) => httpClient.request<CaseStatDto>(`/casestats/${id}`),
  createCaseStat: (payload: CaseStatCreateUpdateDto) =>
    httpClient.request<CaseStatDto>("/casestats", {
      method: "POST",
      body: JSON.stringify(payload),
    }),
  updateCaseStat: (id: number, payload: CaseStatCreateUpdateDto) =>
    httpClient.request<void>(`/casestats/${id}`, {
      method: "PUT",
      body: JSON.stringify(payload),
    }),
  patchCaseStat: (id: number, operations: JsonPatchOperation[]) =>
    httpClient.request<void>(`/casestats/${id}`, {
      method: "PATCH",
      body: JSON.stringify(operations),
    }),
  deleteCaseStat: (id: number) =>
    httpClient.request<void>(`/casestats/${id}`, {
      method: "DELETE",
    }),
};
