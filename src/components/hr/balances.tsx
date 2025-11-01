"use client";

import { useEffect, useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { RefreshCw } from "lucide-react";
import { cn } from "@/lib/utils";

 type Row = {
  id: string;
  name: string;
  email: string;
  quotaAnnual: number;
  quotaSick: number;
  usedAnnual: number;
  usedSick: number;
  remainingAnnual: number;
  remainingSick: number;
};

export default function HRBalances() {
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  async function load() {
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/hr/balances", { cache: "no-store" });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error ?? "Failed to load balances");
      setRows(data.employees as Row[]);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  function save(id: string, quotaAnnual: number, quotaSick: number) {
    startTransition(async () => {
      try {
        const res = await fetch(`/api/hr/balances/${id}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ quotaAnnual, quotaSick }) });
        const data = await res.json();
        if (!res.ok) throw new Error(data?.error ?? "Failed to update");
        await load();
      } catch (e) {
        setError(e instanceof Error ? e.message : "Failed to update");
      }
    });
  }

  const totalAnnualUsed = rows.reduce((sum, r) => sum + r.usedAnnual, 0);
  const totalSickUsed = rows.reduce((sum, r) => sum + r.usedSick, 0);
  const totalAnnualRemaining = rows.reduce((sum, r) => sum + r.remainingAnnual, 0);
  const totalSickRemaining = rows.reduce((sum, r) => sum + r.remainingSick, 0);

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-lg border border-border bg-card/70 p-4 backdrop-blur-sm transition-colors">
          <div className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Annual Used</div>
          <div className="mt-2 text-2xl font-semibold">{totalAnnualUsed} days</div>
        </div>
        <div className="rounded-lg border border-border bg-card/70 p-4 backdrop-blur-sm transition-colors">
          <div className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Annual Remaining</div>
          <div className="mt-2 text-2xl font-semibold">{totalAnnualRemaining} days</div>
        </div>
        <div className="rounded-lg border border-border bg-card/70 p-4 backdrop-blur-sm transition-colors">
          <div className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Sick Used</div>
          <div className="mt-2 text-2xl font-semibold">{totalSickUsed} days</div>
        </div>
        <div className="rounded-lg border border-border bg-card/70 p-4 backdrop-blur-sm transition-colors">
          <div className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Sick Remaining</div>
          <div className="mt-2 text-2xl font-semibold">{totalSickRemaining} days</div>
        </div>
      </div>

      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Employee Leave Quotas</h2>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => load()} disabled={isPending}>
            <RefreshCw className={cn("mr-2 h-4 w-4", isPending && "animate-spin")} /> {isPending ? "Refreshing..." : "Refresh"}
          </Button>
        </div>
      </div>
      {error ? (<p className="text-sm text-destructive" role="alert">{error}</p>) : null}
      <div className="overflow-x-auto rounded-lg border border-border bg-card/60 backdrop-blur-sm shadow-sm">
        <table className="w-full text-left text-sm">
          <thead className="sticky top-0 bg-card/90 text-muted-foreground backdrop-blur">
            <tr className="border-b border-border/80">
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide">Name</th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide">Email</th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide">Annual Leave</th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide">Sick Leave</th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              Array.from({ length: 6 }).map((_, i) => (
                <tr key={`s-${i}`} className="border-t border-border/60">
                  <td className="px-4 py-3"><Skeleton className="h-4 w-40" /></td>
                  <td className="px-4 py-3"><Skeleton className="h-4 w-56" /></td>
                  <td className="px-4 py-3"><Skeleton className="h-8 w-44" /></td>
                  <td className="px-4 py-3"><Skeleton className="h-8 w-44" /></td>
                  <td className="px-4 py-3"><Skeleton className="h-8 w-24" /></td>
                </tr>
              ))
            ) : rows.length === 0 ? (
              <tr><td colSpan={5} className="px-4 py-12 text-center text-muted-foreground">No employees found.</td></tr>
            ) : (
              rows.map((r) => (
                <EditRow key={r.id} row={r} onSave={save} />
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function EditRow({ row, onSave }: { row: Row; onSave: (id: string, qa: number, qs: number) => void }) {
  const [qa, setQa] = useState(row.quotaAnnual);
  const [qs, setQs] = useState(row.quotaSick);
  const changed = qa !== row.quotaAnnual || qs !== row.quotaSick;
  return (
    <tr className="border-t border-border/60 transition-colors hover:bg-muted/50">
      <td className="px-4 py-3 font-medium text-foreground">{row.name}</td>
      <td className="px-4 py-3 text-muted-foreground">{row.email}</td>
      <td className="px-4 py-3">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5">
            <span className="text-xs text-muted-foreground">Quota:</span>
            <input 
              type="number" 
              value={qa} 
              onChange={(e) => setQa(Number(e.target.value))} 
              className="w-16 rounded-md border border-border bg-card px-2 py-1 text-sm text-foreground shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40" 
            />
          </div>
          <div className="text-xs text-muted-foreground">
            <span className="text-foreground/70">Used:</span> {row.usedAnnual} · <span className="text-foreground/70">Rem:</span> {row.remainingAnnual}
          </div>
        </div>
      </td>
      <td className="px-4 py-3">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5">
            <span className="text-xs text-muted-foreground">Quota:</span>
            <input 
              type="number" 
              value={qs} 
              onChange={(e) => setQs(Number(e.target.value))} 
              className="w-16 rounded-md border border-border bg-card px-2 py-1 text-sm text-foreground shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40" 
            />
          </div>
          <div className="text-xs text-muted-foreground">
            <span className="text-foreground/70">Used:</span> {row.usedSick} · <span className="text-foreground/70">Rem:</span> {row.remainingSick}
          </div>
        </div>
      </td>
      <td className="px-4 py-3">
        <Button 
          variant="outline" 
          size="sm" 
          onClick={() => onSave(row.id, qa, qs)}
          disabled={!changed}
        >
          Save
        </Button>
      </td>
    </tr>
  );
}
