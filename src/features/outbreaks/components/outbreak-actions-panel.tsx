"use client";

import { FormEvent, useMemo, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { apiClient } from "@/lib/api";
import type { JsonPatchOperation, OutbreakCreateUpdateDto } from "@/lib/types";
import { useFacilities, useOutbreaks } from "@/features/api/hooks";
import { ResultConsole } from "@/features/api/components/result-console";

const outbreakPatchableFields = [
  { value: "outbreakType", label: "Outbreak type", type: "text" as const },
  { value: "facilityId", label: "Facility ID", type: "number" as const },
  { value: "causativeAgent1", label: "Causative agent 1", type: "text" as const, nullable: true },
  { value: "causativeAgent2", label: "Causative agent 2", type: "text" as const, nullable: true },
  { value: "dateBegan", label: "Date began", type: "date" as const },
  { value: "dateDeclaredOver", label: "Date declared over", type: "date" as const, nullable: true },
  { value: "isActive", label: "Is active", type: "boolean" as const },
];

const formatJson = (value: unknown) => JSON.stringify(value, null, 2);

const toIsoOrNull = (value: string | null) => (value && value.length > 0 ? new Date(`${value}T00:00:00`).toISOString() : null);

const buildOutbreakDto = (form: HTMLFormElement): OutbreakCreateUpdateDto => {
  const data = new FormData(form);
  return {
    facilityId: Number(data.get("facilityId")),
    outbreakType: String(data.get("outbreakType") ?? ""),
    causativeAgent1: (data.get("causativeAgent1") as string) || null,
    causativeAgent2: (data.get("causativeAgent2") as string) || null,
    dateBegan: new Date(`${data.get("dateBegan")}T00:00:00`).toISOString(),
    dateDeclaredOver: toIsoOrNull(data.get("dateDeclaredOver") as string | null),
    isActive: data.get("isActive") === "true",
  };
};

const coercePatchValue = (value: string, config: (typeof outbreakPatchableFields)[number]): unknown => {
  if (config.type === "number") return Number(value);
  if (config.type === "boolean") return value === "true";
  if (config.type === "date") return value ? new Date(`${value}T00:00:00`).toISOString() : config.nullable ? null : undefined;
  if (config.nullable && value.trim().length === 0) {
    return null;
  }
  return value;
};

export function OutbreakActionsPanel() {
  const outbreaksQuery = useOutbreaks();
  const { data: facilities } = useFacilities();
  const queryClient = useQueryClient();

  const [getAllOutput, setGetAllOutput] = useState<string | null>(null);
  const [getByIdOutput, setGetByIdOutput] = useState<string | null>(null);
  const [mutationOutput, setMutationOutput] = useState<string | null>(null);
  const [patchFieldKey, setPatchFieldKey] = useState<(typeof outbreakPatchableFields)[number]["value"]>(outbreakPatchableFields[0].value);

  const patchField = useMemo(() => outbreakPatchableFields.find((field) => field.value === patchFieldKey) ?? outbreakPatchableFields[0], [patchFieldKey]);

  const invalidateOutbreakQueries = (id?: number) => {
    queryClient.invalidateQueries({ queryKey: ["outbreaks"] });
    if (id) {
      queryClient.invalidateQueries({ queryKey: ["outbreak", id] });
    }
  };

  const createMutation = useMutation({
    mutationFn: (payload: OutbreakCreateUpdateDto) => apiClient.createOutbreak(payload),
    onSuccess: (data) => {
      setMutationOutput(formatJson(data));
      invalidateOutbreakQueries(data.outbreakId);
    },
    onError: (error: Error) => setMutationOutput(error.message),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: OutbreakCreateUpdateDto }) => apiClient.updateOutbreak(id, payload),
    onSuccess: (_, variables) => {
      setMutationOutput(`Outbreak ${variables.id} updated via PUT.`);
      invalidateOutbreakQueries(variables.id);
    },
    onError: (error: Error) => setMutationOutput(error.message),
  });

  const patchMutation = useMutation({
    mutationFn: ({ id, operations }: { id: number; operations: JsonPatchOperation[] }) => apiClient.patchOutbreak(id, operations),
    onSuccess: (_, variables) => {
      setMutationOutput(`Outbreak ${variables.id} updated via PATCH: ${formatJson(variables.operations)}`);
      invalidateOutbreakQueries(variables.id);
    },
    onError: (error: Error) => setMutationOutput(error.message),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => apiClient.deleteOutbreak(id),
    onSuccess: (_, id) => {
      setMutationOutput(`Outbreak ${id} deleted.`);
      invalidateOutbreakQueries(id);
    },
    onError: (error: Error) => setMutationOutput(error.message),
  });

  const handleGetAll = async () => {
    const result = await outbreaksQuery.refetch();
    setGetAllOutput(formatJson(result.data ?? []));
  };

  const handleGetById = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const id = Number(data.get("lookupId"));
    if (!id) {
      setGetByIdOutput("Please provide a valid numeric ID.");
      return;
    }

    try {
      const record = await apiClient.getOutbreakById(id);
      setGetByIdOutput(formatJson(record));
    } catch (error) {
      setGetByIdOutput(error instanceof Error ? error.message : String(error));
    }
  };

  const handleCreate = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const payload = buildOutbreakDto(event.currentTarget);
    createMutation.mutate(payload);
    event.currentTarget.reset();
  };

  const handlePut = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = event.currentTarget;
    const data = new FormData(form);
    const id = Number(data.get("targetId"));
    if (!id) {
      setMutationOutput("Provide a valid outbreak ID for PUT.");
      return;
    }
    const payload = buildOutbreakDto(form);
    updateMutation.mutate({ id, payload });
  };

  const handlePatch = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const id = Number(data.get("patchId"));
    if (!id) {
      setMutationOutput("Provide a valid outbreak ID for PATCH.");
      return;
    }
    const rawValue = String(data.get("patchValue") ?? "");
    const config = patchField;
    const value = coercePatchValue(rawValue, config);

    if (value === undefined) {
      setMutationOutput("Please provide a value for the selected field.");
      return;
    }

    const operations: JsonPatchOperation[] = [
      {
        op: "replace",
        path: `/${config.value}`,
        value,
      },
    ];

    patchMutation.mutate({ id, operations });
  };

  const handleDelete = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const id = Number(data.get("deleteId"));
    if (!id) {
      setMutationOutput("Provide a valid outbreak ID for DELETE.");
      return;
    }
    deleteMutation.mutate(id);
    event.currentTarget.reset();
  };

  return (
    <Card className="border-2 border-blue-200 bg-white shadow-xl">
      <CardHeader>
        <CardTitle className="text-2xl">HTTP client playground</CardTitle>
        <CardDescription>Each tab below issues a live request against the OutbreaksController using our shared HttpClient wrapper. All six required HTTP verbs are wired up.</CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="get-all">
          <TabsList className="overflow-x-auto">
            <TabsTrigger value="get-all">GET /outbreaks</TabsTrigger>
            <TabsTrigger value="get-by-id">GET /outbreaks/:id</TabsTrigger>
            <TabsTrigger value="post">POST</TabsTrigger>
            <TabsTrigger value="put">PUT</TabsTrigger>
            <TabsTrigger value="patch">PATCH</TabsTrigger>
            <TabsTrigger value="delete">DELETE</TabsTrigger>
          </TabsList>

          <TabsContent value="get-all" className="space-y-4">
            <p className="text-sm text-slate-600">
              The explorer grid above calls <code className="font-mono">GET /api/outbreaks</code> on load via TanStack Query. Use the button below to manually invoke the HttpClient and inspect the
              response payload.
            </p>
            <Button onClick={handleGetAll} disabled={outbreaksQuery.isFetching}>
              {outbreaksQuery.isFetching ? "Fetching..." : "Fetch outbreaks"}
            </Button>
            <ResultConsole label="GET /api/outbreaks response" payload={getAllOutput} />
          </TabsContent>

          <TabsContent value="get-by-id" className="space-y-4">
            <form className="space-y-4" onSubmit={handleGetById}>
              <div className="grid gap-2">
                <label className="text-sm font-medium" htmlFor="lookupId">
                  Outbreak ID
                </label>
                <Input id="lookupId" name="lookupId" type="number" min="1" placeholder="e.g. 1" required />
              </div>
              <Button type="submit">Fetch outbreak</Button>
            </form>
            <ResultConsole label="GET /api/outbreaks/:id" payload={getByIdOutput} />
          </TabsContent>

          <TabsContent value="post" className="space-y-4">
            <form className="grid gap-4 md:grid-cols-2" onSubmit={handleCreate}>
              <div className="grid gap-2">
                <label className="text-sm font-medium" htmlFor="facilityId">
                  Facility
                </label>
                <select id="facilityId" name="facilityId" required className="rounded-md border px-3 py-2" defaultValue="">
                  <option value="" disabled>
                    Select facility
                  </option>
                  {facilities?.map((facility) => (
                    <option key={facility.facilityId} value={facility.facilityId}>
                      #{facility.facilityId} · {facility.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="grid gap-2">
                <label className="text-sm font-medium" htmlFor="outbreakType">
                  Outbreak type
                </label>
                <Input id="outbreakType" name="outbreakType" required placeholder="Respiratory" />
              </div>
              <div className="grid gap-2">
                <label className="text-sm font-medium" htmlFor="causativeAgent1">
                  Causative agent 1
                </label>
                <Input id="causativeAgent1" name="causativeAgent1" placeholder="Influenza" />
              </div>
              <div className="grid gap-2">
                <label className="text-sm font-medium" htmlFor="causativeAgent2">
                  Causative agent 2
                </label>
                <Input id="causativeAgent2" name="causativeAgent2" placeholder="RSV" />
              </div>
              <div className="grid gap-2">
                <label className="text-sm font-medium" htmlFor="dateBegan">
                  Date began
                </label>
                <Input id="dateBegan" name="dateBegan" type="date" required />
              </div>
              <div className="grid gap-2">
                <label className="text-sm font-medium" htmlFor="dateDeclaredOver">
                  Date declared over
                </label>
                <Input id="dateDeclaredOver" name="dateDeclaredOver" type="date" />
              </div>
              <div className="grid gap-2">
                <label className="text-sm font-medium" htmlFor="isActive">
                  Status
                </label>
                <select id="isActive" name="isActive" className="rounded-md border px-3 py-2">
                  <option value="true">Active</option>
                  <option value="false">Resolved</option>
                </select>
              </div>
              <div className="flex items-end">
                <Button type="submit" className="w-full" disabled={createMutation.isPending}>
                  {createMutation.isPending ? "Creating..." : "Create outbreak"}
                </Button>
              </div>
            </form>
            <ResultConsole label="POST /api/outbreaks" payload={mutationOutput} />
          </TabsContent>

          <TabsContent value="put" className="space-y-4">
            <form className="grid gap-4 md:grid-cols-2" onSubmit={handlePut}>
              <div className="grid gap-2">
                <label className="text-sm font-medium" htmlFor="targetId">
                  Outbreak ID
                </label>
                <Input id="targetId" name="targetId" type="number" min="1" required />
              </div>
              {/* reuse fields */}
              <div className="grid gap-2">
                <label className="text-sm font-medium" htmlFor="facilityId-put">
                  Facility
                </label>
                <select id="facilityId-put" name="facilityId" required className="rounded-md border px-3 py-2" defaultValue="">
                  <option value="" disabled>
                    Select facility
                  </option>
                  {facilities?.map((facility) => (
                    <option key={facility.facilityId} value={facility.facilityId}>
                      #{facility.facilityId} · {facility.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="grid gap-2">
                <label className="text-sm font-medium" htmlFor="outbreakType-put">
                  Outbreak type
                </label>
                <Input id="outbreakType-put" name="outbreakType" required />
              </div>
              <div className="grid gap-2">
                <label className="text-sm font-medium" htmlFor="causativeAgent1-put">
                  Causative agent 1
                </label>
                <Input id="causativeAgent1-put" name="causativeAgent1" />
              </div>
              <div className="grid gap-2">
                <label className="text-sm font-medium" htmlFor="causativeAgent2-put">
                  Causative agent 2
                </label>
                <Input id="causativeAgent2-put" name="causativeAgent2" />
              </div>
              <div className="grid gap-2">
                <label className="text-sm font-medium" htmlFor="dateBegan-put">
                  Date began
                </label>
                <Input id="dateBegan-put" name="dateBegan" type="date" required />
              </div>
              <div className="grid gap-2">
                <label className="text-sm font-medium" htmlFor="dateDeclaredOver-put">
                  Date declared over
                </label>
                <Input id="dateDeclaredOver-put" name="dateDeclaredOver" type="date" />
              </div>
              <div className="grid gap-2">
                <label className="text-sm font-medium" htmlFor="isActive-put">
                  Status
                </label>
                <select id="isActive-put" name="isActive" className="rounded-md border px-3 py-2">
                  <option value="true">Active</option>
                  <option value="false">Resolved</option>
                </select>
              </div>
              <div className="flex items-end">
                <Button type="submit" className="w-full" disabled={updateMutation.isPending}>
                  {updateMutation.isPending ? "Updating..." : "PUT update"}
                </Button>
              </div>
            </form>
            <ResultConsole label="PUT /api/outbreaks/:id" payload={mutationOutput} />
          </TabsContent>

          <TabsContent value="patch" className="space-y-4">
            <form className="grid gap-4 md:grid-cols-2" onSubmit={handlePatch}>
              <div className="grid gap-2">
                <label className="text-sm font-medium" htmlFor="patchId">
                  Outbreak ID
                </label>
                <Input id="patchId" name="patchId" type="number" min="1" required />
              </div>
              <div className="grid gap-2">
                <label className="text-sm font-medium" htmlFor="patchField">
                  Field
                </label>
                <select
                  id="patchField"
                  name="patchField"
                  className="rounded-md border px-3 py-2"
                  value={patchFieldKey}
                  onChange={(event) => setPatchFieldKey(event.target.value as (typeof outbreakPatchableFields)[number]["value"])}>
                  {outbreakPatchableFields.map((field) => (
                    <option key={field.value} value={field.value}>
                      {field.label}
                    </option>
                  ))}
                </select>
              </div>
              <div className="grid gap-2 md:col-span-2">
                <label className="text-sm font-medium" htmlFor="patchValue">
                  New value
                </label>
                {patchField.type === "boolean" ? (
                  <select id="patchValue" name="patchValue" className="rounded-md border px-3 py-2">
                    <option value="true">true</option>
                    <option value="false">false</option>
                  </select>
                ) : patchField.type === "date" ? (
                  <Input id="patchValue" name="patchValue" type="date" />
                ) : (
                  <Input id="patchValue" name="patchValue" placeholder="Enter value" />
                )}
                {patchField.nullable && <p className="text-xs text-muted-foreground">Leave the field empty to send null.</p>}
              </div>
              <div className="md:col-span-2">
                <Button type="submit" disabled={patchMutation.isPending}>
                  {patchMutation.isPending ? "Patching..." : "Send PATCH"}
                </Button>
              </div>
            </form>
            <ResultConsole label="PATCH /api/outbreaks/:id" payload={mutationOutput} />
          </TabsContent>

          <TabsContent value="delete" className="space-y-4">
            <form className="flex flex-col gap-4 md:flex-row md:items-end" onSubmit={handleDelete}>
              <div className="flex-1">
                <label className="text-sm font-medium" htmlFor="deleteId">
                  Outbreak ID
                </label>
                <Input id="deleteId" name="deleteId" type="number" min="1" required />
              </div>
              <Button type="submit" variant="destructive" disabled={deleteMutation.isPending}>
                {deleteMutation.isPending ? "Deleting..." : "Delete"}
              </Button>
            </form>
            <ResultConsole label="DELETE /api/outbreaks/:id" payload={mutationOutput} />
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
