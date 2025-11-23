"use client";

import { FormEvent, useMemo, useRef, useState } from "react";
import { MapPin, Building, MoreHorizontal } from "lucide-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { useFacilities, useOutbreaks } from "@/features/api/hooks";
import { apiClient } from "@/lib/api";
import type { FacilityCreateUpdateDto, FacilityDetailDto, FacilityListDto } from "@/lib/types";

const buildDto = (form: HTMLFormElement): FacilityCreateUpdateDto => {
  const data = new FormData(form);
  return {
    name: String(data.get("name") ?? ""),
    address: String(data.get("address") ?? ""),
    setting: String(data.get("setting") ?? ""),
  };
};

export function FacilityDirectory() {
  const { data: facilities, isLoading } = useFacilities();
  const { data: outbreaks } = useOutbreaks();
  const queryClient = useQueryClient();

  const [query, setQuery] = useState("");
  const [createOpen, setCreateOpen] = useState(false);
  const [editFacility, setEditFacility] = useState<FacilityListDto | null>(null);
  const [patchFacility, setPatchFacility] = useState<FacilityListDto | null>(null);
  const [patchField, setPatchField] = useState<"name" | "address" | "setting">("name");
  const [patchValue, setPatchValue] = useState("");
  const [detailOpen, setDetailOpen] = useState(false);
  const [detailPayload, setDetailPayload] = useState<FacilityDetailDto | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<FacilityListDto | null>(null);
  const [actionMessage, setActionMessage] = useState<string | null>(null);

  const createFormRef = useRef<HTMLFormElement>(null);
  const editFormRef = useRef<HTMLFormElement>(null);

  const statsByFacility = useMemo(() => {
    if (!outbreaks) return {};
    return outbreaks.reduce<Record<string, number>>((acc, outbreak) => {
      acc[outbreak.facilityName] = (acc[outbreak.facilityName] ?? 0) + (outbreak.isActive ? 1 : 0);
      return acc;
    }, {});
  }, [outbreaks]);

  const filtered = useMemo(() => {
    if (!facilities) return [];
    return facilities.filter((facility) => [facility.name, facility.address, facility.setting].join(" ").toLowerCase().includes(query.toLowerCase()));
  }, [facilities, query]);

  const invalidate = (id?: number) => {
    queryClient.invalidateQueries({ queryKey: ["facilities"] });
    if (id) {
      queryClient.invalidateQueries({ queryKey: ["facility", id] });
    }
  };

  const createMutation = useMutation({
    mutationFn: (payload: FacilityCreateUpdateDto) => apiClient.createFacility(payload),
    onSuccess: (result) => {
      setActionMessage(`Created facility #${result.facilityId}`);
      createFormRef.current?.reset();
      setCreateOpen(false);
      invalidate(result.facilityId);
    },
    onError: (error: Error) => setActionMessage(error.message),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: FacilityCreateUpdateDto }) => apiClient.updateFacility(id, payload),
    onSuccess: (_, vars) => {
      setActionMessage(`Updated facility #${vars.id}`);
      setEditFacility(null);
      editFormRef.current?.reset();
      invalidate(vars.id);
    },
    onError: (error: Error) => setActionMessage(error.message),
  });

  const patchMutation = useMutation({
    mutationFn: ({ id, field, value }: { id: number; field: string; value: string }) => apiClient.patchFacility(id, [{ op: "replace", path: `/${field}`, value }]),
    onSuccess: (_, vars) => {
      setActionMessage(`Patched facility #${vars.id}`);
      setPatchFacility(null);
      setPatchValue("");
      invalidate(vars.id);
    },
    onError: (error: Error) => setActionMessage(error.message),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => apiClient.deleteFacility(id),
    onSuccess: (_, id) => {
      setActionMessage(`Deleted facility #${id}`);
      setDeleteTarget(null);
      invalidate(id);
    },
    onError: (error: Error) => setActionMessage(error.message),
  });

  const handleCreate = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    createMutation.mutate(buildDto(event.currentTarget));
  };

  const handleEdit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!editFacility) return;
    updateMutation.mutate({ id: editFacility.facilityId, payload: buildDto(event.currentTarget) });
  };

  const handlePatch = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!patchFacility) return;
    if (!patchValue.trim()) {
      setActionMessage("Provide a value to patch.");
      return;
    }
    patchMutation.mutate({ id: patchFacility.facilityId, field: patchField, value: patchValue });
  };

  const openDetail = async (id: number) => {
    setDetailOpen(true);
    setDetailLoading(true);
    try {
      const payload = await apiClient.getFacilityById(id);
      setDetailPayload(payload);
    } catch (error) {
      setActionMessage(error instanceof Error ? error.message : String(error));
      setDetailPayload(null);
    } finally {
      setDetailLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 rounded-2xl border border-emerald-200 bg-linear-to-br from-white to-emerald-50 p-4 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-sm uppercase tracking-wide text-primary">Facility directory</p>
          <p className="text-sm text-muted-foreground">Data sourced from /api/facilities with outbreak counts computed from /api/outbreaks.</p>
        </div>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <Input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search by name, setting, or address" className="w-full sm:w-64" />
          <Dialog open={createOpen} onOpenChange={(open) => setCreateOpen(open)}>
            <DialogTrigger asChild>
              <Button className="bg-green-700 hover:bg-green-800" size="sm">
                New facility
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[840px]">
              <DialogHeader>
                <DialogTitle>Create facility</DialogTitle>
                <DialogDescription>POST /api/facilities</DialogDescription>
              </DialogHeader>
              <form ref={createFormRef} onSubmit={handleCreate} className="space-y-3">
                <div className="grid gap-2">
                  <label className="text-sm font-medium" htmlFor="facilityName-create">
                    Name
                  </label>
                  <Input id="facilityName-create" name="name" placeholder="Elm Manor" required />
                </div>
                <div className="grid gap-2">
                  <label className="text-sm font-medium" htmlFor="facilityAddress-create">
                    Address
                  </label>
                  <Input id="facilityAddress-create" name="address" placeholder="123 Queen St W" required />
                </div>
                <div className="grid gap-2">
                  <label className="text-sm font-medium" htmlFor="facilitySetting-create">
                    Setting
                  </label>
                  <Input id="facilitySetting-create" name="setting" placeholder="Long-term care" required />
                </div>
                <DialogFooter>
                  <Button className="bg-green-700 hover:bg-green-800 cursor-pointer" type="submit" disabled={createMutation.isPending}>
                    {createMutation.isPending ? "Creating…" : "Create"}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>
      {actionMessage && <p className="rounded-lg border bg-muted/40 px-4 py-3 text-sm text-muted-foreground">{actionMessage}</p>}
      {isLoading ? (
        <div className="grid gap-4 md:grid-cols-2">
          {Array.from({ length: 4 }).map((_, index) => (
            <Skeleton key={index} className="h-32 w-full" />
          ))}
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {filtered.map((facility) => (
            <Card key={facility.facilityId} className="border border-emerald-100 bg-white shadow-sm">
              <CardHeader className="flex items-start justify-between space-y-0">
                <div>
                  <CardTitle className="flex items-center gap-2 text-base">
                    <Building className="h-4 w-4 text-muted-foreground" />
                    {facility.name}
                  </CardTitle>
                  <CardDescription className="mt-2 flex items-center gap-2">
                    <MapPin className="h-4 w-4" />
                    {facility.address}
                  </CardDescription>
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" aria-label="Open actions">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => openDetail(facility.facilityId)}>View record</DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setEditFacility(facility)}>Edit details</DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => {
                        setPatchFacility(facility);
                        setPatchField("name");
                        setPatchValue("");
                      }}>
                      Quick patch
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => setDeleteTarget(facility)}>Delete facility</DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </CardHeader>
              <CardContent className="flex items-center justify-between text-sm">
                <p className="text-muted-foreground">Setting: {facility.setting}</p>
                <p className="font-medium">
                  Active outbreaks: <span className="text-primary">{statsByFacility[facility.name] ?? 0}</span>
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
      {!isLoading && filtered.length === 0 && <p className="text-center text-sm text-muted-foreground">No facilities match your search.</p>}

      <Dialog open={!!editFacility} onOpenChange={(open) => !open && setEditFacility(null)}>
        <DialogContent className="sm:max-w-[840px]">
          <DialogHeader>
            <DialogTitle>Edit facility</DialogTitle>
            <DialogDescription>PUT /api/facilities/{editFacility?.facilityId}</DialogDescription>
          </DialogHeader>
          {editFacility && (
            <form key={editFacility.facilityId} ref={editFormRef} onSubmit={handleEdit} className="space-y-3">
              <div className="grid gap-2">
                <label className="text-sm font-medium" htmlFor="facilityName-edit">
                  Name
                </label>
                <Input id="facilityName-edit" name="name" defaultValue={editFacility.name} required />
              </div>
              <div className="grid gap-2">
                <label className="text-sm font-medium" htmlFor="facilityAddress-edit">
                  Address
                </label>
                <Input id="facilityAddress-edit" name="address" defaultValue={editFacility.address} required />
              </div>
              <div className="grid gap-2">
                <label className="text-sm font-medium" htmlFor="facilitySetting-edit">
                  Setting
                </label>
                <Input id="facilitySetting-edit" name="setting" defaultValue={editFacility.setting} required />
              </div>
              <DialogFooter>
                <Button className="bg-green-700 hover:bg-green-800 cursor-pointer" type="submit" disabled={updateMutation.isPending}>
                  {updateMutation.isPending ? "Saving…" : "Save changes"}
                </Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={!!patchFacility} onOpenChange={(open) => !open && setPatchFacility(null)}>
        <DialogContent className="sm:max-w-[720px]">
          <DialogHeader>
            <DialogTitle>Patch facility</DialogTitle>
            <DialogDescription>PATCH /api/facilities/{patchFacility?.facilityId}</DialogDescription>
          </DialogHeader>
          {patchFacility && (
            <form onSubmit={handlePatch} className="space-y-3">
              <div className="grid gap-2">
                <label className="text-sm font-medium" htmlFor="patchField">
                  Field
                </label>
                <select id="patchField" className="rounded-md border px-3 py-2" value={patchField} onChange={(event) => setPatchField(event.target.value as typeof patchField)}>
                  <option value="name">Name</option>
                  <option value="address">Address</option>
                  <option value="setting">Setting</option>
                </select>
              </div>
              <div className="grid gap-2">
                <label className="text-sm font-medium" htmlFor="patchValue">
                  New value
                </label>
                <Input id="patchValue" value={patchValue} onChange={(event) => setPatchValue(event.target.value)} placeholder="Enter value" required />
              </div>
              <DialogFooter>
                <Button className="bg-green-700 hover:bg-green-800 cursor-pointer" type="submit" disabled={patchMutation.isPending}>
                  {patchMutation.isPending ? "Updating…" : "Send patch"}
                </Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={detailOpen} onOpenChange={(open) => setDetailOpen(open)}>
        <DialogContent className="sm:max-w-[760px]">
          <DialogHeader>
            <DialogTitle>Facility details</DialogTitle>
            <DialogDescription>GET /api/facilities/{detailPayload?.facilityId}</DialogDescription>
          </DialogHeader>
          {detailLoading ? (
            <p className="text-sm text-muted-foreground">Loading details…</p>
          ) : (
            detailPayload && (
              <div className="grid gap-4">
                <div>
                  <p className="text-xs uppercase text-muted-foreground">Name</p>
                  <p className="font-medium">{detailPayload.name}</p>
                </div>
                <div>
                  <p className="text-xs uppercase text-muted-foreground">Address</p>
                  <p className="font-medium">{detailPayload.address}</p>
                </div>
                <div>
                  <p className="text-xs uppercase text-muted-foreground">Setting</p>
                  <p className="font-medium">{detailPayload.setting}</p>
                </div>
              </div>
            )
          )}
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete facility</AlertDialogTitle>
            <AlertDialogDescription>This will permanently remove facility #{deleteTarget?.facilityId}.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction className="bg-red-800" onClick={() => deleteTarget && deleteMutation.mutate(deleteTarget.facilityId)} disabled={deleteMutation.isPending}>
              {deleteMutation.isPending ? "Deleting…" : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
