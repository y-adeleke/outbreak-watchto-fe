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

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL as string;
const API_KEY = process.env.NEXT_PUBLIC_API_KEY;

class HttpClient {
  constructor(private readonly baseUrl: string, private readonly defaultHeaders: HeadersInit = {}) {}

  async request<T>(path: string, init?: RequestInit): Promise<T> {
    const response = await fetch(`${this.baseUrl}${path}`, {
      ...init,
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
        ...this.defaultHeaders,
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

const httpClient = new HttpClient(API_BASE_URL, API_KEY ? { "x-api-key": API_KEY } : {});

export const apiClient = {
  // Outbreaks
  getOutbreaks: () => httpClient.request<OutbreakListDto[]>("/api/outbreaks"),
  getOutbreakById: (id: number) => httpClient.request<OutbreakDetailDto>(`/api/outbreaks/${id}`),
  createOutbreak: (payload: OutbreakCreateUpdateDto) =>
    httpClient.request<OutbreakDetailDto>("/api/outbreaks", {
      method: "POST",
      body: JSON.stringify(payload),
    }),
  updateOutbreak: (id: number, payload: OutbreakCreateUpdateDto) =>
    httpClient.request<void>(`/api/outbreaks/${id}`, {
      method: "PUT",
      body: JSON.stringify(payload),
    }),
  patchOutbreak: (id: number, operations: JsonPatchOperation[]) =>
    httpClient.request<void>(`/api/outbreaks/${id}`, {
      method: "PATCH",
      body: JSON.stringify(operations),
    }),
  deleteOutbreak: (id: number) =>
    httpClient.request<void>(`/api/outbreaks/${id}`, {
      method: "DELETE",
    }),

  // Facilities
  getFacilities: () => httpClient.request<FacilityListDto[]>("/api/facilities"),
  getFacilityById: (id: number) => httpClient.request<FacilityDetailDto>(`/api/facilities/${id}`),
  createFacility: (payload: FacilityCreateUpdateDto) =>
    httpClient.request<FacilityDetailDto>("/api/facilities", {
      method: "POST",
      body: JSON.stringify(payload),
    }),
  updateFacility: (id: number, payload: FacilityCreateUpdateDto) =>
    httpClient.request<void>(`/api/facilities/${id}`, {
      method: "PUT",
      body: JSON.stringify(payload),
    }),
  patchFacility: (id: number, operations: JsonPatchOperation[]) =>
    httpClient.request<void>(`/api/facilities/${id}`, {
      method: "PATCH",
      body: JSON.stringify(operations),
    }),
  deleteFacility: (id: number) =>
    httpClient.request<void>(`/api/facilities/${id}`, {
      method: "DELETE",
    }),

  // Case stats
  getCaseStats: () => httpClient.request<CaseStatDto[]>("/api/casestats"),
  getCaseStatById: (id: number) => httpClient.request<CaseStatDto>(`/api/casestats/${id}`),
  createCaseStat: (payload: CaseStatCreateUpdateDto) =>
    httpClient.request<CaseStatDto>("/api/casestats", {
      method: "POST",
      body: JSON.stringify(payload),
    }),
  updateCaseStat: (id: number, payload: CaseStatCreateUpdateDto) =>
    httpClient.request<void>(`/api/casestats/${id}`, {
      method: "PUT",
      body: JSON.stringify(payload),
    }),
  patchCaseStat: (id: number, operations: JsonPatchOperation[]) =>
    httpClient.request<void>(`/api/casestats/${id}`, {
      method: "PATCH",
      body: JSON.stringify(operations),
    }),
  deleteCaseStat: (id: number) =>
    httpClient.request<void>(`/api/casestats/${id}`, {
      method: "DELETE",
    }),
};
