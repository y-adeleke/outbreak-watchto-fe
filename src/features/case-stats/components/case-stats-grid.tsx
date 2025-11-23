"use client";

import { FormEvent, useMemo, useRef, useState } from "react";
import { Activity, HeartPulse, MoreHorizontal, Users } from "lucide-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { useCaseStats, useOutbreaks } from "@/features/api/hooks";
import { apiClient } from "@/lib/api";
import type { CaseStatCreateUpdateDto, CaseStatDto } from "@/lib/types";

const buildDto = (form: HTMLFormElement): CaseStatCreateUpdateDto => {
  const data = new FormData(form);
  return {
    outbreakId: Number(data.get("outbreakId")),
    residentCases: Number(data.get("residentCases")),
    staffCases: Number(data.get("staffCases")),
    deaths: Number(data.get("deaths")),
  };
};

export function CaseStatsGrid() {
  const { data, isLoading } = useCaseStats();
  const { data: outbreaks } = useOutbreaks();
  const queryClient = useQueryClient();

  const [createOpen, setCreateOpen] = useState(false);
  const [editStat, setEditStat] = useState<CaseStatDto | null>(null);
  const [patchStat, setPatchStat] = useState<CaseStatDto | null>(null);
  const [patchField, setPatchField] = useState<"residentCases" | "staffCases" | "deaths">("residentCases");
  const [patchValue, setPatchValue] = useState("");
  const [detailOpen, setDetailOpen] = useState(false);
  const [detailPayload, setDetailPayload] = useState<CaseStatDto | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<CaseStatDto | null>(null);
  const [actionMessage, setActionMessage] = useState<string | null>(null);

  const createFormRef = useRef<HTMLFormElement>(null);
  const editFormRef = useRef<HTMLFormElement>(null);

  const totals = useMemo(() => {
    if (!data) {
      return { residents: 0, staff: 0, deaths: 0 };
    }

    return data.reduce(
      (memo, entry) => ({
        residents: memo.residents + entry.residentCases,
        staff: memo.staff + entry.staffCases,
        deaths: memo.deaths + entry.deaths,
      }),
      { residents: 0, staff: 0, deaths: 0 }
    );
  }, [data]);

  const outbreakName = (outbreakId: number) => outbreaks?.find((o) => o.outbreakId === outbreakId)?.facilityName ?? `Outbreak #${outbreakId}`;

  const invalidate = (id?: number) => {
    queryClient.invalidateQueries({ queryKey: ["case-stats"] });
    if (id) {
      queryClient.invalidateQueries({ queryKey: ["case-stat", id] });
    }
  };

  const createMutation = useMutation({
    mutationFn: (payload: CaseStatCreateUpdateDto) => apiClient.createCaseStat(payload),
    onSuccess: (result) => {
      setActionMessage(`Created case stat #${result.caseStatId}`);
      createFormRef.current?.reset();
      setCreateOpen(false);
      invalidate(result.caseStatId);
    },
    onError: (error: Error) => setActionMessage(error.message),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: CaseStatCreateUpdateDto }) => apiClient.updateCaseStat(id, payload),
    onSuccess: (_, vars) => {
      setActionMessage(`Updated case stat #${vars.id}`);
      setEditStat(null);
      editFormRef.current?.reset();
      invalidate(vars.id);
    },
    onError: (error: Error) => setActionMessage(error.message),
  });

  const patchMutation = useMutation({
    mutationFn: ({ id, field, value }: { id: number; field: string; value: number }) => apiClient.patchCaseStat(id, [{ op: "replace", path: `/${field}`, value }]),
    onSuccess: (_, vars) => {
      setActionMessage(`Patched case stat #${vars.id}`);
      setPatchStat(null);
      setPatchValue("");
      invalidate(vars.id);
    },
    onError: (error: Error) => setActionMessage(error.message),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => apiClient.deleteCaseStat(id),
    onSuccess: (_, id) => {
      setActionMessage(`Deleted case stat #${id}`);
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
    if (!editStat) return;
    updateMutation.mutate({ id: editStat.caseStatId, payload: buildDto(event.currentTarget) });
  };

  const handlePatch = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!patchStat) return;
    const value = Number(patchValue);
    if (Number.isNaN(value)) {
      setActionMessage("Provide a numeric value.");
      return;
    }
    patchMutation.mutate({ id: patchStat.caseStatId, field: patchField, value });
  };

  const openDetail = async (id: number) => {
    setDetailOpen(true);
    setDetailLoading(true);
    try {
      const payload = await apiClient.getCaseStatById(id);
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
      <div className="grid gap-4 md:grid-cols-3">
        {[
          { label: "Resident cases", value: totals.residents, icon: Users },
          { label: "Staff cases", value: totals.staff, icon: Activity },
          { label: "Deaths reported", value: totals.deaths, icon: HeartPulse },
        ].map((metric) => (
          <Card key={metric.label} className="border border-amber-100 bg-linear-to-br from-white to-amber-50/70">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardDescription>{metric.label}</CardDescription>
              <metric.icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <CardTitle className="text-3xl font-semibold">{metric.value.toLocaleString()}</CardTitle>
            </CardContent>
          </Card>
        ))}
      </div>
      <Card>
        <CardHeader className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <CardTitle>Case statistics by outbreak</CardTitle>
            <CardDescription>Drive CRUD + PATCH on /api/casestats.</CardDescription>
          </div>
          <Dialog open={createOpen} onOpenChange={(open) => setCreateOpen(open)}>
            <DialogTrigger asChild>
              <Button className="bg-green-800 hover:bg-green-900 cursor-pointer" size="sm">
                Add case stat
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[840px]">
              <DialogHeader>
                <DialogTitle>Create case stat</DialogTitle>
                <DialogDescription>POST /api/casestats</DialogDescription>
              </DialogHeader>
              <form ref={createFormRef} onSubmit={handleCreate} className="space-y-3">
                <div className="grid gap-2">
                  <label className="text-sm font-medium" htmlFor="outbreakId-create">
                    Outbreak
                  </label>
                  <select id="outbreakId-create" name="outbreakId" required className="rounded-md border px-3 py-2">
                    <option value="">Select outbreak</option>
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
                <DialogFooter>
                  <Button className="bg-green-800 hover:bg-green-900 cursor-pointer" type="submit" disabled={createMutation.isPending}>
                    {createMutation.isPending ? "Creating…" : "Create"}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto rounded-2xl border">
            {actionMessage && <p className="rounded-lg border bg-muted/40 px-4 py-3 text-sm text-muted-foreground">{actionMessage}</p>}
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Outbreak</TableHead>
                  <TableHead>Residents</TableHead>
                  <TableHead>Staff</TableHead>
                  <TableHead>Deaths</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading &&
                  Array.from({ length: 6 }).map((_, index) => (
                    <TableRow key={index}>
                      <TableCell colSpan={5}>
                        <Skeleton className="h-8 w-full" />
                      </TableCell>
                    </TableRow>
                  ))}
                {!isLoading &&
                  data?.map((entry) => (
                    <TableRow key={entry.caseStatId}>
                      <TableCell>{outbreakName(entry.outbreakId)}</TableCell>
                      <TableCell>{entry.residentCases}</TableCell>
                      <TableCell>{entry.staffCases}</TableCell>
                      <TableCell>{entry.deaths}</TableCell>
                      <TableCell className="flex flex-col gap-2 md:flex-row md:justify-end">
                        <Button variant="ghost" size="sm" onClick={() => openDetail(entry.caseStatId)}>
                          Inspect
                        </Button>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" aria-label="Open actions">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => setEditStat(entry)}>Edit details</DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => {
                                setPatchStat(entry);
                                setPatchField("residentCases");
                                setPatchValue("");
                              }}>
                              Adjust value
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={() => setDeleteTarget(entry)}>Delete stat</DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                {!isLoading && (data?.length ?? 0) === 0 && (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center text-sm text-muted-foreground">
                      No case statistics captured yet.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <Dialog open={!!editStat} onOpenChange={(open) => !open && setEditStat(null)}>
        <DialogContent className="sm:max-w-[900px]">
          <DialogHeader>
            <DialogTitle>Edit case stat</DialogTitle>
            <DialogDescription>PUT /api/casestats/{editStat?.caseStatId}</DialogDescription>
          </DialogHeader>
          {editStat && (
            <form key={editStat.caseStatId} ref={editFormRef} onSubmit={handleEdit} className="space-y-3">
              <div className="grid gap-2">
                <label className="text-sm font-medium" htmlFor="outbreakId-edit">
                  Outbreak
                </label>
                <select id="outbreakId-edit" name="outbreakId" required className="rounded-md border px-3 py-2" defaultValue={editStat.outbreakId}>
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
                <label className="text-sm font-medium" htmlFor="residentCases-edit">
                  Resident cases
                </label>
                <Input id="residentCases-edit" name="residentCases" type="number" min="0" defaultValue={editStat.residentCases} required />
              </div>
              <div className="grid gap-2">
                <label className="text-sm font-medium" htmlFor="staffCases-edit">
                  Staff cases
                </label>
                <Input id="staffCases-edit" name="staffCases" type="number" min="0" defaultValue={editStat.staffCases} required />
              </div>
              <div className="grid gap-2">
                <label className="text-sm font-medium" htmlFor="deaths-edit">
                  Deaths
                </label>
                <Input id="deaths-edit" name="deaths" type="number" min="0" defaultValue={editStat.deaths} required />
              </div>
              <DialogFooter>
                <Button className="bg-green-800 hover:bg-green-900 cursor-pointer" type="submit" disabled={updateMutation.isPending}>
                  {updateMutation.isPending ? "Saving…" : "Save changes"}
                </Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={!!patchStat} onOpenChange={(open) => !open && setPatchStat(null)}>
        <DialogContent className="sm:max-w-[720px]">
          <DialogHeader>
            <DialogTitle>Patch case stat</DialogTitle>
            <DialogDescription>PATCH /api/casestats/{patchStat?.caseStatId}</DialogDescription>
          </DialogHeader>
          {patchStat && (
            <form onSubmit={handlePatch} className="space-y-3">
              <div className="grid gap-2">
                <label className="text-sm font-medium" htmlFor="patchField">
                  Field
                </label>
                <select id="patchField" className="rounded-md border px-3 py-2" value={patchField} onChange={(event) => setPatchField(event.target.value as typeof patchField)}>
                  <option value="residentCases">Resident cases</option>
                  <option value="staffCases">Staff cases</option>
                  <option value="deaths">Deaths</option>
                </select>
              </div>
              <div className="grid gap-2">
                <label className="text-sm font-medium" htmlFor="patchValue">
                  New value
                </label>
                <Input id="patchValue" value={patchValue} onChange={(event) => setPatchValue(event.target.value)} type="number" min="0" required />
              </div>
              <DialogFooter>
                <Button className="bg-green-800 hover:bg-green-900 cursor-pointer" type="submit" disabled={patchMutation.isPending}>
                  {patchMutation.isPending ? "Updating…" : "Send patch"}
                </Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={detailOpen} onOpenChange={(open) => setDetailOpen(open)}>
        <DialogContent className="sm-max-w-[740px]">
          <DialogHeader>
            <DialogTitle>Case stat details</DialogTitle>
            <DialogDescription>GET /api/casestats/{detailPayload?.caseStatId}</DialogDescription>
          </DialogHeader>
          {detailLoading ? (
            <p className="text-sm text-muted-foreground">Loading details…</p>
          ) : (
            detailPayload && (
              <div className="grid gap-4">
                <div>
                  <p className="text-xs uppercase text-muted-foreground">Outbreak</p>
                  <p className="font-medium">{outbreakName(detailPayload.outbreakId)}</p>
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <p className="text-xs uppercase text-muted-foreground">Residents</p>
                    <p className="font-medium">{detailPayload.residentCases}</p>
                  </div>
                  <div>
                    <p className="text-xs uppercase text-muted-foreground">Staff</p>
                    <p className="font-medium">{detailPayload.staffCases}</p>
                  </div>
                  <div>
                    <p className="text-xs uppercase text-muted-foreground">Deaths</p>
                    <p className="font-medium">{detailPayload.deaths}</p>
                  </div>
                </div>
              </div>
            )
          )}
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete case stat</AlertDialogTitle>
            <AlertDialogDescription>This will permanently remove case stat #{deleteTarget?.caseStatId}.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction className="bg-red-800 hover:bg-red-900" onClick={() => deleteTarget && deleteMutation.mutate(deleteTarget.caseStatId)} disabled={deleteMutation.isPending}>
              {deleteMutation.isPending ? "Deleting…" : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
