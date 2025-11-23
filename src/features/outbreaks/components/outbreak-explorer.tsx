"use client";

import Link from "next/link";
import { FormEvent, useMemo, useRef, useState } from "react";
import { MoreHorizontal, Search } from "lucide-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { useCaseStats, useFacilities, useOutbreaks } from "@/features/api/hooks";
import { OutbreakStatusBadge } from "./outbreak-status-badge";
import { apiClient } from "@/lib/api";
import type { OutbreakCreateUpdateDto, OutbreakDetailDto, OutbreakListDto } from "@/lib/types";

type StatusFilter = "all" | "active" | "resolved";

const buildDto = (form: HTMLFormElement): OutbreakCreateUpdateDto => {
  const data = new FormData(form);
  const dateBegan = String(data.get("dateBegan") ?? "");
  const dateDeclaredOver = String(data.get("dateDeclaredOver") ?? "");

  return {
    facilityId: Number(data.get("facilityId")),
    outbreakType: String(data.get("outbreakType") ?? ""),
    causativeAgent1: (data.get("causativeAgent1") as string) || null,
    causativeAgent2: (data.get("causativeAgent2") as string) || null,
    dateBegan: new Date(`${dateBegan}T00:00:00`).toISOString(),
    dateDeclaredOver: dateDeclaredOver ? new Date(`${dateDeclaredOver}T00:00:00`).toISOString() : null,
    isActive: data.get("isActive") === "true",
  };
};

const asDateInput = (iso?: string | null) => (iso ? iso.split("T")[0] : "");

export function OutbreakExplorer() {
  const { data, isLoading } = useOutbreaks();
  const { data: stats } = useCaseStats();
  const { data: facilities } = useFacilities();
  const queryClient = useQueryClient();

  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<StatusFilter>("all");
  const [createOpen, setCreateOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [detailOpen, setDetailOpen] = useState(false);
  const [detailData, setDetailData] = useState<OutbreakDetailDto | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [editData, setEditData] = useState<OutbreakDetailDto | null>(null);
  const [editLoading, setEditLoading] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<OutbreakListDto | null>(null);
  const [actionMessage, setActionMessage] = useState<string | null>(null);

  const createFormRef = useRef<HTMLFormElement>(null);
  const editFormRef = useRef<HTMLFormElement>(null);

  const filtered = useMemo(() => {
    if (!data) return [];
    return data.filter((outbreak) => {
      const matchesQuery = outbreak.facilityName.toLowerCase().includes(query.toLowerCase()) || outbreak.outbreakType.toLowerCase().includes(query.toLowerCase());
      const matchesStatus = status === "all" || (status === "active" && outbreak.isActive) || (status === "resolved" && !outbreak.isActive);
      return matchesQuery && matchesStatus;
    });
  }, [data, query, status]);

  const totals = useMemo(() => {
    if (!data) return { total: 0, active: 0, resolved: 0 };
    const active = data.filter((o) => o.isActive).length;
    return { total: data.length, active, resolved: data.length - active };
  }, [data]);

  const statLookup = useMemo(
    () =>
      (stats ?? []).reduce<Record<number, { totalCases: number }>>((memo, entry) => {
        memo[entry.outbreakId] = {
          totalCases: entry.residentCases + entry.staffCases,
        };
        return memo;
      }, {}),
    [stats]
  );

  const invalidate = (id?: number) => {
    queryClient.invalidateQueries({ queryKey: ["outbreaks"] });
    if (id) {
      queryClient.invalidateQueries({ queryKey: ["outbreak", id] });
    }
  };

  const createMutation = useMutation({
    mutationFn: (payload: OutbreakCreateUpdateDto) => apiClient.createOutbreak(payload),
    onSuccess: (result) => {
      setActionMessage(`Created outbreak #${result.outbreakId}`);
      createFormRef.current?.reset();
      setCreateOpen(false);
      invalidate(result.outbreakId);
    },
    onError: (error: Error) => setActionMessage(error.message),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: OutbreakCreateUpdateDto }) => apiClient.updateOutbreak(id, payload),
    onSuccess: (_, vars) => {
      setActionMessage(`Updated outbreak #${vars.id}`);
      setEditOpen(false);
      setEditData(null);
      editFormRef.current?.reset();
      invalidate(vars.id);
    },
    onError: (error: Error) => setActionMessage(error.message),
  });

  const patchMutation = useMutation({
    mutationFn: ({ id, isActive }: { id: number; isActive: boolean }) =>
      apiClient.patchOutbreak(id, [
        {
          op: "replace",
          path: "/isActive",
          value: isActive,
        },
      ]),
    onSuccess: (_, vars) => {
      setActionMessage(`Status updated for outbreak #${vars.id}`);
      invalidate(vars.id);
    },
    onError: (error: Error) => setActionMessage(error.message),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => apiClient.deleteOutbreak(id),
    onSuccess: (_, id) => {
      setActionMessage(`Deleted outbreak #${id}`);
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
    if (!editData) return;
    updateMutation.mutate({ id: editData.outbreakId, payload: buildDto(event.currentTarget) });
  };

  const openEditDialog = async (id: number) => {
    setEditOpen(true);
    setEditLoading(true);
    try {
      const detail = await apiClient.getOutbreakById(id);
      setEditData(detail);
    } catch (error) {
      setActionMessage(error instanceof Error ? error.message : String(error));
      setEditOpen(false);
    } finally {
      setEditLoading(false);
    }
  };

  const openDetailDialog = async (id: number) => {
    setDetailOpen(true);
    setDetailLoading(true);
    try {
      const detail = await apiClient.getOutbreakById(id);
      setDetailData(detail);
    } catch (error) {
      setActionMessage(error instanceof Error ? error.message : String(error));
      setDetailData(null);
    } finally {
      setDetailLoading(false);
    }
  };

  const facilityIdForName = (facilityName: string) => facilities?.find((facility) => facility.name === facilityName)?.facilityId?.toString() ?? "";

  const editFacilityDefault = editData ? facilityIdForName(editData.facilityName) : "";
  const editStatusDefault = String(editData?.isActive ?? true);

  return (
    <div className="space-y-8">
      <div className="grid gap-4 md:grid-cols-3">
        {[
          { label: "Total outbreaks", value: totals.total, className: "text-blue-700" },
          { label: "Active now", value: totals.active, className: "text-red-700" },
          { label: "Resolved", value: totals.resolved, className: "text-green-700" },
        ].map((metric) => (
          <Card key={metric.label} className="border border-blue-100 bg-linear-to-br from-white to-blue-50/60">
            <CardHeader>
              <CardDescription>{metric.label}</CardDescription>
              <CardTitle className={`text-3xl ${metric.className}`}>{metric.value}</CardTitle>
            </CardHeader>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <CardTitle>Explore outbreaks</CardTitle>
            <CardDescription>Filter, inspect, and remediate outbreak metadata.</CardDescription>
          </div>
          <Dialog open={createOpen} onOpenChange={(open) => setCreateOpen(open)}>
            <DialogTrigger asChild>
              <Button className="bg-red-700 hover:bg-red-800 cursor-pointer" size="sm">
                New outbreak
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[920px]">
              <DialogHeader>
                <DialogTitle>Create outbreak</DialogTitle>
                <DialogDescription>POST /api/outbreaks</DialogDescription>
              </DialogHeader>
              <form ref={createFormRef} onSubmit={handleCreate} className="space-y-3">
                <div className="grid gap-2">
                  <label className="text-sm font-medium" htmlFor="facilityId-create">
                    Facility
                  </label>
                  <select id="facilityId-create" name="facilityId" required className="rounded-md border px-3 py-2" defaultValue="">
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
                  <label className="text-sm font-medium" htmlFor="outbreakType-create">
                    Outbreak type
                  </label>
                  <Input id="outbreakType-create" name="outbreakType" placeholder="Respiratory" required />
                </div>
                <div className="grid gap-2">
                  <label className="text-sm font-medium" htmlFor="ca1-create">
                    Causative agent 1
                  </label>
                  <Input id="ca1-create" name="causativeAgent1" placeholder="Influenza" />
                </div>
                <div className="grid gap-2">
                  <label className="text-sm font-medium" htmlFor="ca2-create">
                    Causative agent 2
                  </label>
                  <Input id="ca2-create" name="causativeAgent2" placeholder="RSV" />
                </div>
                <div className="grid gap-2">
                  <label className="text-sm font-medium" htmlFor="dateBegan-create">
                    Date began
                  </label>
                  <Input id="dateBegan-create" name="dateBegan" type="date" required />
                </div>
                <div className="grid gap-2">
                  <label className="text-sm font-medium" htmlFor="dateOver-create">
                    Date declared over
                  </label>
                  <Input id="dateOver-create" name="dateDeclaredOver" type="date" />
                </div>
                <div className="grid gap-2">
                  <label className="text-sm font-medium" htmlFor="status-create">
                    Status
                  </label>
                  <select id="status-create" name="isActive" className="rounded-md border px-3 py-2">
                    <option value="true">Active</option>
                    <option value="false">Resolved</option>
                  </select>
                </div>
                <DialogFooter>
                  <Button type="submit" disabled={createMutation.isPending}>
                    {createMutation.isPending ? "Creating…" : "Create"}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div className="flex flex-1 items-center gap-2 rounded-full border bg-muted/40 px-3 py-1.5">
              <Search className="h-4 w-4 text-muted-foreground" />
              <Input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search by facility or outbreak type" className="border-none bg-transparent" />
            </div>
            <div className="flex items-center gap-2">
              {(["all", "active", "resolved"] satisfies StatusFilter[]).map((filter) => (
                <Button key={filter} variant={status === filter ? "default" : "outline"} size="sm" onClick={() => setStatus(filter)} className="capitalize">
                  {filter}
                </Button>
              ))}
            </div>
          </div>
          {actionMessage && <p className="rounded-lg border bg-muted/40 px-4 py-3 text-sm text-muted-foreground">{actionMessage}</p>}
          <div className="overflow-x-auto rounded-2xl border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>ID</TableHead>
                  <TableHead>Facility</TableHead>
                  <TableHead>Outbreak type</TableHead>
                  <TableHead>Cases tracked</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-center">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading &&
                  Array.from({ length: 5 }).map((_, index) => (
                    <TableRow key={index}>
                      <TableCell colSpan={6}>
                        <Skeleton className="h-8 w-full" />
                      </TableCell>
                    </TableRow>
                  ))}
                {!isLoading &&
                  filtered.map((outbreak) => (
                    <TableRow key={outbreak.outbreakId}>
                      <TableCell className="font-mono text-xs">#{outbreak.outbreakId}</TableCell>
                      <TableCell>{outbreak.facilityName}</TableCell>
                      <TableCell>{outbreak.outbreakType}</TableCell>
                      <TableCell>{statLookup[outbreak.outbreakId]?.totalCases ?? "—"}</TableCell>
                      <TableCell>
                        <OutbreakStatusBadge isActive={outbreak.isActive} />
                      </TableCell>
                      <TableCell className="flex flex-col gap-2 md:flex-row md:justify-end">
                        <Button variant="ghost" size="sm" onClick={() => openDetailDialog(outbreak.outbreakId)}>
                          Inspect
                        </Button>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" aria-label="Open actions">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => openEditDialog(outbreak.outbreakId)}>Edit details</DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() =>
                                patchMutation.mutate({
                                  id: outbreak.outbreakId,
                                  isActive: !outbreak.isActive,
                                })
                              }>
                              {outbreak.isActive ? "Mark resolved" : "Mark active"}
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={() => setDeleteTarget(outbreak)}>Delete outbreak</DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem asChild>
                              <Link href={`/outbreaks/${outbreak.outbreakId}`}>Open detail page</Link>
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                {!isLoading && filtered.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center text-sm text-muted-foreground">
                      No outbreaks match your search.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <Dialog open={editOpen} onOpenChange={(open) => setEditOpen(open)}>
        <DialogContent className="sm:max-w-[980px]">
          <DialogHeader>
            <DialogTitle>Edit outbreak</DialogTitle>
            <DialogDescription>PUT /api/outbreaks/:id</DialogDescription>
          </DialogHeader>
          {editLoading && <p className="text-sm text-muted-foreground">Loading outbreak…</p>}
          {!editLoading && (
            <form key={editData?.outbreakId ?? "new-edit"} ref={editFormRef} onSubmit={handleEdit} className="space-y-3">
              <div className="grid gap-2">
                <label className="text-sm font-medium" htmlFor="facilityId-edit">
                  Facility
                </label>
                <select id="facilityId-edit" name="facilityId" required className="rounded-md border px-3 py-2" defaultValue={editFacilityDefault}>
                  <option value="" disabled>
                    Select facility
                  </option>
                  {facilities?.map((facility) => (
                    <option key={facility.facilityId} value={facility.facilityId}>
                      #{facility.facilityId} · {facility.name}
                    </option>
                  ))}
                </select>
                {!editFacilityDefault && editData && <p className="text-xs text-muted-foreground">Facility set to {editData?.facilityName}. Re-select if you need to change it.</p>}
              </div>
              <div className="grid gap-2">
                <label className="text-sm font-medium" htmlFor="outbreakType-edit">
                  Outbreak type
                </label>
                <Input id="outbreakType-edit" name="outbreakType" defaultValue={editData?.outbreakType} required />
              </div>
              <div className="grid gap-2">
                <label className="text-sm font-medium" htmlFor="ca1-edit">
                  Causative agent 1
                </label>
                <Input id="ca1-edit" name="causativeAgent1" defaultValue={editData?.causativeAgent1 ?? ""} />
              </div>
              <div className="grid gap-2">
                <label className="text-sm font-medium" htmlFor="ca2-edit">
                  Causative agent 2
                </label>
                <Input id="ca2-edit" name="causativeAgent2" defaultValue={editData?.causativeAgent2 ?? ""} />
              </div>
              <div className="grid gap-2">
                <label className="text-sm font-medium" htmlFor="dateBegan-edit">
                  Date began
                </label>
                <Input id="dateBegan-edit" name="dateBegan" type="date" defaultValue={asDateInput(editData?.dateBegan)} required />
              </div>
              <div className="grid gap-2">
                <label className="text-sm font-medium" htmlFor="dateOver-edit">
                  Date declared over
                </label>
                <Input id="dateOver-edit" name="dateDeclaredOver" type="date" defaultValue={asDateInput(editData?.dateDeclaredOver ?? null)} />
              </div>
              <div className="grid gap-2">
                <label className="text-sm font-medium" htmlFor="status-edit">
                  Status
                </label>
                <select id="status-edit" name="isActive" className="rounded-md border px-3 py-2" defaultValue={editStatusDefault}>
                  <option value="true">Active</option>
                  <option value="false">Resolved</option>
                </select>
              </div>
              <DialogFooter>
                <Button type="submit" disabled={updateMutation.isPending}>
                  {updateMutation.isPending ? "Saving…" : "Save changes"}
                </Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={detailOpen} onOpenChange={(open) => setDetailOpen(open)}>
        <DialogContent className="sm:max-w-[760px]">
          <DialogHeader>
            <DialogTitle>Outbreak details</DialogTitle>
            <DialogDescription>GET /api/outbreaks/:id</DialogDescription>
          </DialogHeader>
          {detailLoading && <p className="text-sm text-muted-foreground">Loading details…</p>}
          {!detailLoading && detailData && (
            <div className="grid gap-4">
              <div>
                <p className="text-xs uppercase text-muted-foreground">Facility</p>
                <p className="font-medium">{detailData.facilityName}</p>
              </div>
              <div className="grid gap-1">
                <p className="text-xs uppercase text-muted-foreground">Outbreak type</p>
                <p className="font-medium">{detailData.outbreakType}</p>
              </div>
              <div className="grid gap-1">
                <p className="text-xs uppercase text-muted-foreground">Causative agents</p>
                <p className="font-medium">
                  {detailData.causativeAgent1 || "—"} / {detailData.causativeAgent2 || "—"}
                </p>
              </div>
              <div className="grid gap-1">
                <p className="text-xs uppercase text-muted-foreground">Dates</p>
                <p className="font-medium">
                  Began {new Date(detailData.dateBegan).toLocaleDateString()}
                  {detailData.dateDeclaredOver ? ` · Resolved ${new Date(detailData.dateDeclaredOver).toLocaleDateString()}` : " · Active"}
                </p>
              </div>
              <div className="grid gap-1">
                <p className="text-xs uppercase text-muted-foreground">Status</p>
                <OutbreakStatusBadge isActive={detailData.isActive} />
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete outbreak</AlertDialogTitle>
            <AlertDialogDescription>This will permanently remove outbreak #{deleteTarget?.outbreakId}. This action cannot be undone.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction className="bg-red-800 hover:bg-red-900" onClick={() => deleteTarget && deleteMutation.mutate(deleteTarget.outbreakId)} disabled={deleteMutation.isPending}>
              {deleteMutation.isPending ? "Deleting…" : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
