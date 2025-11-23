"use client";

import { FormEvent, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ResultConsole } from "@/features/api/components/result-console";
import { useCaseStats, useOutbreaks } from "@/features/api/hooks";
import { apiClient } from "@/lib/api";
import type { CaseStatCreateUpdateDto, JsonPatchOperation } from "@/lib/types";

const casePatchFields = [
  { value: "outbreakId", label: "Outbreak ID", type: "number" as const },
  { value: "residentCases", label: "Resident cases", type: "number" as const },
  { value: "staffCases", label: "Staff cases", type: "number" as const },
  { value: "deaths", label: "Deaths", type: "number" as const },
];

const formatJson = (value: unknown) => JSON.stringify(value, null, 2);

const buildCaseDto = (form: HTMLFormElement): CaseStatCreateUpdateDto => {
  const data = new FormData(form);
  return {
    outbreakId: Number(data.get("outbreakId")),
    residentCases: Number(data.get("residentCases")),
    staffCases: Number(data.get("staffCases")),
    deaths: Number(data.get("deaths")),
  };
};

export function CaseStatsActionsPanel() {
  const caseStatsQuery = useCaseStats();
  const { data: outbreaks } = useOutbreaks();
  const queryClient = useQueryClient();

  const [getAllOutput, setGetAllOutput] = useState<string | null>(null);
  const [getByIdOutput, setGetByIdOutput] = useState<string | null>(null);
  const [mutationOutput, setMutationOutput] = useState<string | null>(null);
  const [patchField, setPatchField] = useState<(typeof casePatchFields)[number]["value"]>("residentCases");

  const invalidateCaseStats = (id?: number) => {
    queryClient.invalidateQueries({ queryKey: ["case-stats"] });
    if (id) {
      queryClient.invalidateQueries({ queryKey: ["case-stat", id] });
    }
  };

  const createMutation = useMutation({
    mutationFn: (payload: CaseStatCreateUpdateDto) => apiClient.createCaseStat(payload),
    onSuccess: (data) => {
      setMutationOutput(formatJson(data));
      invalidateCaseStats(data.caseStatId);
    },
    onError: (error: Error) => setMutationOutput(error.message),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: CaseStatCreateUpdateDto }) => apiClient.updateCaseStat(id, payload),
    onSuccess: (_, variables) => {
      setMutationOutput(`CaseStat ${variables.id} updated.`);
      invalidateCaseStats(variables.id);
    },
    onError: (error: Error) => setMutationOutput(error.message),
  });

  const patchMutation = useMutation({
    mutationFn: ({ id, operations }: { id: number; operations: JsonPatchOperation[] }) => apiClient.patchCaseStat(id, operations),
    onSuccess: (_, variables) => {
      setMutationOutput(`CaseStat ${variables.id} patched: ${formatJson(variables.operations)}`);
      invalidateCaseStats(variables.id);
    },
    onError: (error: Error) => setMutationOutput(error.message),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => apiClient.deleteCaseStat(id),
    onSuccess: (_, id) => {
      setMutationOutput(`CaseStat ${id} deleted.`);
      invalidateCaseStats(id);
    },
    onError: (error: Error) => setMutationOutput(error.message),
  });

  const handleGetAll = async () => {
    const result = await caseStatsQuery.refetch();
    setGetAllOutput(formatJson(result.data ?? []));
  };

  const handleGetById = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const id = Number(data.get("lookupId"));
    if (!id) {
      setGetByIdOutput("Provide a valid caseStat ID.");
      return;
    }
    try {
      const record = await apiClient.getCaseStatById(id);
      setGetByIdOutput(formatJson(record));
    } catch (error) {
      setGetByIdOutput(error instanceof Error ? error.message : String(error));
    }
  };

  const handleCreate = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const payload = buildCaseDto(event.currentTarget);
    createMutation.mutate(payload);
    event.currentTarget.reset();
  };

  const handlePut = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = event.currentTarget;
    const data = new FormData(form);
    const id = Number(data.get("targetId"));
    if (!id) {
      setMutationOutput("Provide a valid caseStat ID for PUT.");
      return;
    }
    const payload = buildCaseDto(form);
    updateMutation.mutate({ id, payload });
  };

  const handlePatch = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const id = Number(data.get("patchId"));
    if (!id) {
      setMutationOutput("Provide a valid caseStat ID for PATCH.");
      return;
    }

    const value = Number(data.get("patchValue"));
    if (Number.isNaN(value)) {
      setMutationOutput("Provide a numeric value.");
      return;
    }

    const operations: JsonPatchOperation[] = [{ op: "replace", path: `/${patchField}`, value }];

    patchMutation.mutate({ id, operations });
  };

  const handleDelete = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const id = Number(data.get("deleteId"));
    if (!id) {
      setMutationOutput("Provide a valid caseStat ID for DELETE.");
      return;
    }
    deleteMutation.mutate(id);
    event.currentTarget.reset();
  };

  return (
    <Card className="border-2 border-amber-200 bg-white shadow-xl">
      <CardHeader>
        <CardTitle className="text-2xl">Case statistics API console</CardTitle>
        <CardDescription>Drive CRUD + PATCH flows for the CaseStatsController endpoints.</CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="get-all">
          <TabsList className="overflow-x-auto">
            <TabsTrigger value="get-all">GET /casestats</TabsTrigger>
            <TabsTrigger value="get-by-id">GET /casestats/:id</TabsTrigger>
            <TabsTrigger value="post">POST</TabsTrigger>
            <TabsTrigger value="put">PUT</TabsTrigger>
            <TabsTrigger value="patch">PATCH</TabsTrigger>
            <TabsTrigger value="delete">DELETE</TabsTrigger>
          </TabsList>

          <TabsContent value="get-all" className="space-y-4">
            <p className="text-sm text-slate-600">
              The totals above stream from <code className="font-mono">GET /api/casestats</code>. Trigger a manual refresh to exercise the HttpClient.
            </p>
            <Button onClick={handleGetAll} disabled={caseStatsQuery.isFetching}>
              {caseStatsQuery.isFetching ? "Fetching..." : "Fetch case stats"}
            </Button>
            <ResultConsole label="GET /api/casestats" payload={getAllOutput} />
          </TabsContent>

          <TabsContent value="get-by-id" className="space-y-4">
            <form className="space-y-4" onSubmit={handleGetById}>
              <div className="grid gap-2">
                <label className="text-sm font-medium" htmlFor="case-lookup">
                  CaseStat ID
                </label>
                <Input id="case-lookup" name="lookupId" type="number" min="1" placeholder="e.g. 3" required />
              </div>
              <Button type="submit">Fetch stat</Button>
            </form>
            <ResultConsole label="GET /api/casestats/:id" payload={getByIdOutput} />
          </TabsContent>

          <TabsContent value="post" className="space-y-4">
            <form className="grid gap-4 md:grid-cols-4" onSubmit={handleCreate}>
              <div className="grid gap-2">
                <label className="text-sm font-medium" htmlFor="case-outbreak-create">
                  Outbreak
                </label>
                <select id="case-outbreak-create" name="outbreakId" required className="rounded-md border px-3 py-2" defaultValue="">
                  <option value="" disabled>
                    Select outbreak
                  </option>
                  {outbreaks?.map((outbreak) => (
                    <option key={outbreak.outbreakId} value={outbreak.outbreakId}>
                      #{outbreak.outbreakId} · {outbreak.facilityName}
                    </option>
                  ))}
                </select>
              </div>
              <div className="grid gap-2">
                <label className="text-sm font-medium" htmlFor="residentCases-create">
                  Resident cases
                </label>
                <Input id="residentCases-create" name="residentCases" type="number" min="0" required />
              </div>
              <div className="grid gap-2">
                <label className="text-sm font-medium" htmlFor="staffCases-create">
                  Staff cases
                </label>
                <Input id="staffCases-create" name="staffCases" type="number" min="0" required />
              </div>
              <div className="grid gap-2">
                <label className="text-sm font-medium" htmlFor="deaths-create">
                  Deaths
                </label>
                <Input id="deaths-create" name="deaths" type="number" min="0" required />
              </div>
              <div className="md:col-span-4">
                <Button type="submit" disabled={createMutation.isPending}>
                  {createMutation.isPending ? "Creating..." : "Create case stat"}
                </Button>
              </div>
            </form>
            <ResultConsole label="POST /api/casestats" payload={mutationOutput} />
          </TabsContent>

          <TabsContent value="put" className="space-y-4">
            <form className="grid gap-4 md:grid-cols-4" onSubmit={handlePut}>
              <div className="grid gap-2">
                <label className="text-sm font-medium" htmlFor="case-id-put">
                  CaseStat ID
                </label>
                <Input id="case-id-put" name="targetId" type="number" min="1" required />
              </div>
              <div className="grid gap-2">
                <label className="text-sm font-medium" htmlFor="case-outbreak-put">
                  Outbreak
                </label>
                <select id="case-outbreak-put" name="outbreakId" required className="rounded-md border px-3 py-2" defaultValue="">
                  <option value="" disabled>
                    Select outbreak
                  </option>
                  {outbreaks?.map((outbreak) => (
                    <option key={outbreak.outbreakId} value={outbreak.outbreakId}>
                      #{outbreak.outbreakId} · {outbreak.facilityName}
                    </option>
                  ))}
                </select>
              </div>
              <div className="grid gap-2">
                <label className="text-sm font-medium" htmlFor="residentCases-put">
                  Resident cases
                </label>
                <Input id="residentCases-put" name="residentCases" type="number" min="0" required />
              </div>
              <div className="grid gap-2">
                <label className="text-sm font-medium" htmlFor="staffCases-put">
                  Staff cases
                </label>
                <Input id="staffCases-put" name="staffCases" type="number" min="0" required />
              </div>
              <div className="grid gap-2">
                <label className="text-sm font-medium" htmlFor="deaths-put">
                  Deaths
                </label>
                <Input id="deaths-put" name="deaths" type="number" min="0" required />
              </div>
              <div className="md:col-span-4">
                <Button type="submit" disabled={updateMutation.isPending}>
                  {updateMutation.isPending ? "Updating..." : "PUT update"}
                </Button>
              </div>
            </form>
            <ResultConsole label="PUT /api/casestats/:id" payload={mutationOutput} />
          </TabsContent>

          <TabsContent value="patch" className="space-y-4">
            <form className="grid gap-4 md:grid-cols-3" onSubmit={handlePatch}>
              <div className="grid gap-2">
                <label className="text-sm font-medium" htmlFor="case-id-patch">
                  CaseStat ID
                </label>
                <Input id="case-id-patch" name="patchId" type="number" min="1" required />
              </div>
              <div className="grid gap-2">
                <label className="text-sm font-medium" htmlFor="case-field-patch">
                  Field
                </label>
                <select
                  id="case-field-patch"
                  name="patchField"
                  className="rounded-md border px-3 py-2"
                  value={patchField}
                  onChange={(event) => setPatchField(event.target.value as (typeof casePatchFields)[number]["value"])}>
                  {casePatchFields.map((field) => (
                    <option key={field.value} value={field.value}>
                      {field.label}
                    </option>
                  ))}
                </select>
              </div>
              <div className="grid gap-2">
                <label className="text-sm font-medium" htmlFor="case-value-patch">
                  New value
                </label>
                <Input id="case-value-patch" name="patchValue" type="number" min="0" required />
              </div>
              <div className="md:col-span-3">
                <Button type="submit" disabled={patchMutation.isPending}>
                  {patchMutation.isPending ? "Patching..." : "Send PATCH"}
                </Button>
              </div>
            </form>
            <ResultConsole label="PATCH /api/casestats/:id" payload={mutationOutput} />
          </TabsContent>

          <TabsContent value="delete" className="space-y-4">
            <form className="flex flex-col gap-4 md:flex-row md:items-end" onSubmit={handleDelete}>
              <div className="flex-1">
                <label className="text-sm font-medium" htmlFor="case-delete">
                  CaseStat ID
                </label>
                <Input id="case-delete" name="deleteId" type="number" min="1" required />
              </div>
              <Button type="submit" variant="destructive" disabled={deleteMutation.isPending}>
                {deleteMutation.isPending ? "Deleting..." : "Delete case stat"}
              </Button>
            </form>
            <ResultConsole label="DELETE /api/casestats/:id" payload={mutationOutput} />
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
