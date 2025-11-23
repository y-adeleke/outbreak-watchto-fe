"use client";

import { FormEvent, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ResultConsole } from "@/features/api/components/result-console";
import { useFacilities } from "@/features/api/hooks";
import { apiClient } from "@/lib/api";
import type { FacilityCreateUpdateDto, JsonPatchOperation } from "@/lib/types";

const facilityPatchFields = [
  { value: "name", label: "Name" },
  { value: "address", label: "Address" },
  { value: "setting", label: "Setting" },
] as const;

const formatJson = (value: unknown) => JSON.stringify(value, null, 2);

const buildFacilityDto = (form: HTMLFormElement): FacilityCreateUpdateDto => {
  const data = new FormData(form);
  return {
    name: String(data.get("name") ?? ""),
    address: String(data.get("address") ?? ""),
    setting: String(data.get("setting") ?? ""),
  };
};

export function FacilityActionsPanel() {
  const facilitiesQuery = useFacilities();
  const queryClient = useQueryClient();

  const [getAllOutput, setGetAllOutput] = useState<string | null>(null);
  const [getByIdOutput, setGetByIdOutput] = useState<string | null>(null);
  const [mutationOutput, setMutationOutput] = useState<string | null>(null);
  const [patchField, setPatchField] = useState<(typeof facilityPatchFields)[number]["value"]>("name");

  const invalidateFacilities = (id?: number) => {
    queryClient.invalidateQueries({ queryKey: ["facilities"] });
    if (id) {
      queryClient.invalidateQueries({ queryKey: ["facility", id] });
    }
  };

  const createMutation = useMutation({
    mutationFn: (payload: FacilityCreateUpdateDto) => apiClient.createFacility(payload),
    onSuccess: (data) => {
      setMutationOutput(formatJson(data));
      invalidateFacilities(data.facilityId);
    },
    onError: (error: Error) => setMutationOutput(error.message),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: FacilityCreateUpdateDto }) => apiClient.updateFacility(id, payload),
    onSuccess: (_, variables) => {
      setMutationOutput(`Facility ${variables.id} updated.`);
      invalidateFacilities(variables.id);
    },
    onError: (error: Error) => setMutationOutput(error.message),
  });

  const patchMutation = useMutation({
    mutationFn: ({ id, operations }: { id: number; operations: JsonPatchOperation[] }) => apiClient.patchFacility(id, operations),
    onSuccess: (_, variables) => {
      setMutationOutput(`Facility ${variables.id} patched: ${formatJson(variables.operations)}`);
      invalidateFacilities(variables.id);
    },
    onError: (error: Error) => setMutationOutput(error.message),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => apiClient.deleteFacility(id),
    onSuccess: (_, id) => {
      setMutationOutput(`Facility ${id} deleted.`);
      invalidateFacilities(id);
    },
    onError: (error: Error) => setMutationOutput(error.message),
  });

  const handleGetAll = async () => {
    const result = await facilitiesQuery.refetch();
    setGetAllOutput(formatJson(result.data ?? []));
  };

  const handleGetById = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const id = Number(data.get("lookupId"));
    if (!id) {
      setGetByIdOutput("Provide a valid facility ID.");
      return;
    }

    try {
      const facility = await apiClient.getFacilityById(id);
      setGetByIdOutput(formatJson(facility));
    } catch (error) {
      setGetByIdOutput(error instanceof Error ? error.message : String(error));
    }
  };

  const handleCreate = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const payload = buildFacilityDto(event.currentTarget);
    createMutation.mutate(payload);
    event.currentTarget.reset();
  };

  const handlePut = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = event.currentTarget;
    const data = new FormData(form);
    const id = Number(data.get("targetId"));
    if (!id) {
      setMutationOutput("Provide a valid facility ID for PUT.");
      return;
    }
    const payload = buildFacilityDto(form);
    updateMutation.mutate({ id, payload });
  };

  const handlePatch = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const id = Number(data.get("patchId"));
    if (!id) {
      setMutationOutput("Provide a valid facility ID for PATCH.");
      return;
    }

    const value = String(data.get("patchValue") ?? "");
    if (value.trim().length === 0) {
      setMutationOutput("Provide a value to patch.");
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
      setMutationOutput("Provide a valid facility ID for DELETE.");
      return;
    }
    deleteMutation.mutate(id);
    event.currentTarget.reset();
  };

  return (
    <Card className="border-2 border-teal-200 bg-white shadow-xl">
      <CardHeader>
        <CardTitle className="text-2xl">Facility API console</CardTitle>
        <CardDescription>
          Drive every method exposed by <code className="font-mono">FacilitiesController</code> directly from the web client.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="get-all">
          <TabsList className="overflow-x-auto">
            <TabsTrigger value="get-all">GET /facilities</TabsTrigger>
            <TabsTrigger value="get-by-id">GET /facilities/:id</TabsTrigger>
            <TabsTrigger value="post">POST</TabsTrigger>
            <TabsTrigger value="put">PUT</TabsTrigger>
            <TabsTrigger value="patch">PATCH</TabsTrigger>
            <TabsTrigger value="delete">DELETE</TabsTrigger>
          </TabsList>

          <TabsContent value="get-all" className="space-y-4">
            <p className="text-sm text-slate-600">
              The directory cards above come from <code className="font-mono">GET /api/facilities</code>. Use the button below to force a refetch and inspect the payload.
            </p>
            <Button onClick={handleGetAll} disabled={facilitiesQuery.isFetching}>
              {facilitiesQuery.isFetching ? "Fetching..." : "Fetch facilities"}
            </Button>
            <ResultConsole label="GET /api/facilities" payload={getAllOutput} />
          </TabsContent>

          <TabsContent value="get-by-id" className="space-y-4">
            <form className="space-y-4" onSubmit={handleGetById}>
              <div className="grid gap-2">
                <label className="text-sm font-medium" htmlFor="fac-lookup">
                  Facility ID
                </label>
                <Input id="fac-lookup" name="lookupId" type="number" min="1" placeholder="e.g. 2" required />
              </div>
              <Button type="submit">Fetch facility</Button>
            </form>
            <ResultConsole label="GET /api/facilities/:id" payload={getByIdOutput} />
          </TabsContent>

          <TabsContent value="post" className="space-y-4">
            <form className="grid gap-4 md:grid-cols-3" onSubmit={handleCreate}>
              <div className="grid gap-2">
                <label className="text-sm font-medium" htmlFor="facility-name-create">
                  Name
                </label>
                <Input id="facility-name-create" name="name" placeholder="Elm Manor" required />
              </div>
              <div className="grid gap-2 md:col-span-2">
                <label className="text-sm font-medium" htmlFor="facility-address-create">
                  Address
                </label>
                <Input id="facility-address-create" name="address" placeholder="123 Queen St W" required />
              </div>
              <div className="grid gap-2">
                <label className="text-sm font-medium" htmlFor="facility-setting-create">
                  Setting
                </label>
                <Input id="facility-setting-create" name="setting" placeholder="Long-term care" required />
              </div>
              <div className="flex items-end">
                <Button type="submit" disabled={createMutation.isPending}>
                  {createMutation.isPending ? "Creating..." : "Create facility"}
                </Button>
              </div>
            </form>
            <ResultConsole label="POST /api/facilities" payload={mutationOutput} />
          </TabsContent>

          <TabsContent value="put" className="space-y-4">
            <form className="grid gap-4 md:grid-cols-3" onSubmit={handlePut}>
              <div className="grid gap-2">
                <label className="text-sm font-medium" htmlFor="facility-id-put">
                  Facility ID
                </label>
                <Input id="facility-id-put" name="targetId" type="number" min="1" required />
              </div>
              <div className="grid gap-2">
                <label className="text-sm font-medium" htmlFor="facility-name-put">
                  Name
                </label>
                <Input id="facility-name-put" name="name" required />
              </div>
              <div className="grid gap-2 md:col-span-2">
                <label className="text-sm font-medium" htmlFor="facility-address-put">
                  Address
                </label>
                <Input id="facility-address-put" name="address" required />
              </div>
              <div className="grid gap-2">
                <label className="text-sm font-medium" htmlFor="facility-setting-put">
                  Setting
                </label>
                <Input id="facility-setting-put" name="setting" required />
              </div>
              <div className="flex items-end">
                <Button type="submit" disabled={updateMutation.isPending}>
                  {updateMutation.isPending ? "Updating..." : "PUT update"}
                </Button>
              </div>
            </form>
            <ResultConsole label="PUT /api/facilities/:id" payload={mutationOutput} />
          </TabsContent>

          <TabsContent value="patch" className="space-y-4">
            <form className="grid gap-4 md:grid-cols-3" onSubmit={handlePatch}>
              <div className="grid gap-2">
                <label className="text-sm font-medium" htmlFor="facility-id-patch">
                  Facility ID
                </label>
                <Input id="facility-id-patch" name="patchId" type="number" min="1" required />
              </div>
              <div className="grid gap-2">
                <label className="text-sm font-medium" htmlFor="facility-field-patch">
                  Field
                </label>
                <select
                  id="facility-field-patch"
                  name="patchField"
                  className="rounded-md border px-3 py-2"
                  value={patchField}
                  onChange={(event) => setPatchField(event.target.value as (typeof facilityPatchFields)[number]["value"])}>
                  {facilityPatchFields.map((field) => (
                    <option key={field.value} value={field.value}>
                      {field.label}
                    </option>
                  ))}
                </select>
              </div>
              <div className="grid gap-2 md:col-span-2">
                <label className="text-sm font-medium" htmlFor="facility-value-patch">
                  New value
                </label>
                <Input id="facility-value-patch" name="patchValue" placeholder="Enter new value" />
              </div>
              <div className="md:col-span-3">
                <Button type="submit" disabled={patchMutation.isPending}>
                  {patchMutation.isPending ? "Patching..." : "Send PATCH"}
                </Button>
              </div>
            </form>
            <ResultConsole label="PATCH /api/facilities/:id" payload={mutationOutput} />
          </TabsContent>

          <TabsContent value="delete" className="space-y-4">
            <form className="flex flex-col gap-4 md:flex-row md:items-end" onSubmit={handleDelete}>
              <div className="flex-1">
                <label className="text-sm font-medium" htmlFor="facility-delete">
                  Facility ID
                </label>
                <Input id="facility-delete" name="deleteId" type="number" min="1" required />
              </div>
              <Button type="submit" variant="destructive" disabled={deleteMutation.isPending}>
                {deleteMutation.isPending ? "Deleting..." : "Delete facility"}
              </Button>
            </form>
            <ResultConsole label="DELETE /api/facilities/:id" payload={mutationOutput} />
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
