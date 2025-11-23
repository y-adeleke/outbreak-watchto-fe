interface ResultConsoleProps {
  label: string;
  payload: string | null;
}

export function ResultConsole({ label, payload }: ResultConsoleProps) {
  return (
    <div className="rounded-xl border bg-muted/20 p-4">
      <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{label}</p>
      <pre className="mt-2 max-h-64 overflow-y-auto whitespace-pre-wrap wrap-break-word font-mono text-xs text-slate-800 dark:text-slate-100">{payload ?? "No output yet"}</pre>
    </div>
  );
}
