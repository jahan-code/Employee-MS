"use client";

import { useCallback, useEffect, useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

 type Row = {
  id: string;
  type: string;
  from: string;
  to: string;
  days: number;
  status: string;
  reason: string;
  decidedAt: string | null;
  decisionNote: string;
};

export default function EmployeeLeave() {
  const [rows, setRows] = useState<Row[]>([]);
  const [remaining, setRemaining] = useState<{ annual: number; sick: number; quotaAnnual: number; quotaSick: number; usedAnnual: number; usedSick: number } | null>(null);
  const [type, setType] = useState("annual");
  const [from, setFrom] = useState(formatDateInput(new Date()));
  const [to, setTo] = useState(formatDateInput(new Date()));
  const [reason, setReason] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const load = useCallback(async () => {
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/leave", { cache: "no-store" });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error ?? "Failed to load");
      setRows(data.leaves as Row[]);
      if (data.remaining) setRemaining(data.remaining as typeof remaining);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  function handleSubmit() {
    startTransition(async () => {
      setError(null);
      try {
        const res = await fetch("/api/leave", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ type, from, to, reason })
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data?.error ?? "Submit failed");
        setReason("");
        await load();
      } catch (e) {
        setError(e instanceof Error ? e.message : "Submit failed");
      }
    });
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="grid gap-1">
          <span className="text-xs text-muted-foreground">Type</span>
          <select
            value={type}
            onChange={(e) => setType(e.target.value)}
            className="rounded-md border border-border bg-card px-2 py-1 text-sm text-foreground shadow-sm transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
          >
            <option value="annual">Annual</option>
            <option value="sick">Sick</option>
            <option value="unpaid">Unpaid</option>
            <option value="other">Other</option>
          </select>
        </label>
        <label className="grid gap-1">
          <span className="text-xs text-muted-foreground">From</span>
          <input
            type="date"
            value={from}
            onChange={(e) => setFrom(e.target.value)}
            className="rounded-md border border-border bg-card px-2 py-1 text-sm text-foreground shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
          />
        </label>
        <label className="grid gap-1">
          <span className="text-xs text-muted-foreground">To</span>
          <input
            type="date"
            value={to}
            onChange={(e) => setTo(e.target.value)}
            className="rounded-md border border-border bg-card px-2 py-1 text-sm text-foreground shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
          />
        </label>
        <label className="grid gap-1 sm:col-span-2">
          <span className="text-xs text-muted-foreground">Reason (optional)</span>
          <input
            type="text"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            className="rounded-md border border-border bg-card px-3 py-2 text-sm text-foreground shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
          />
        </label>
        <div className="sm:col-span-2">
          <Button onClick={handleSubmit} disabled={isPending}>{isPending ? "Submitting..." : "Submit request"}</Button>
        </div>
      </div>

      {remaining ? (
        <div className="rounded-md border border-border bg-card/70 p-4 text-sm text-muted-foreground backdrop-blur-sm">
          <div className="font-medium text-foreground">Your leave balance</div>
          <div className="mt-1 grid gap-1 sm:grid-cols-2">
            <div>Annual: {remaining.annual} days remaining (used {remaining.usedAnnual}/{remaining.quotaAnnual})</div>
            <div>Sick: {remaining.sick} days remaining (used {remaining.usedSick}/{remaining.quotaSick})</div>
          </div>
          <BalanceHint type={type} from={from} to={to} remaining={remaining} />
        </div>
      ) : null}

      {error ? (<p className="text-sm text-destructive" role="alert">{error}</p>) : null}

      <div className="overflow-x-auto rounded-md border border-border bg-card/50 backdrop-blur-sm shadow-sm">
        <table className="w-full text-left text-sm">
          <thead className="bg-card/80 text-muted-foreground backdrop-blur">
            <tr>
              <th className="px-3 py-2">Type</th>
              <th className="px-3 py-2">From</th>
              <th className="px-3 py-2">To</th>
              <th className="px-3 py-2">Days</th>
              <th className="px-3 py-2">Status</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <tr key={`s-${i}`} className="border-t border-border/50">
                  <td className="px-3 py-2"><Skeleton className="h-4 w-24" /></td>
                  <td className="px-3 py-2"><Skeleton className="h-4 w-28" /></td>
                  <td className="px-3 py-2"><Skeleton className="h-4 w-28" /></td>
                  <td className="px-3 py-2"><Skeleton className="h-4 w-12" /></td>
                  <td className="px-3 py-2"><Skeleton className="h-4 w-20" /></td>
                </tr>
              ))
            ) : rows.length === 0 ? (
              <tr><td colSpan={5} className="px-3 py-10 text-center text-muted-foreground">No leave requests yet.</td></tr>
            ) : (
              rows.map((r) => (
                <tr key={r.id} className="border-t border-border/50 transition-colors hover:bg-muted/40">
                  <td className="px-3 py-2 capitalize text-foreground/90">{r.type}</td>
                  <td className="px-3 py-2 text-foreground/80">{new Date(r.from).toLocaleDateString()}</td>
                  <td className="px-3 py-2 text-foreground/80">{new Date(r.to).toLocaleDateString()}</td>
                  <td className="px-3 py-2 text-foreground">{r.days}</td>
                  <td className="px-3 py-2 capitalize text-muted-foreground">{r.status}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function formatDateInput(d: Date) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function BalanceHint({ type, from, to, remaining }: { type: string; from: string; to: string; remaining: { annual: number; sick: number } }) {
  const days = diffDays(from, to);
  const rem = type === "annual" ? remaining.annual : type === "sick" ? remaining.sick : Infinity;
  if ((type === "annual" || type === "sick") && days > rem) {
    return <p className="mt-2 text-xs text-rose-400">Requested {days} day(s) exceeds remaining {type} balance ({rem}).</p>;
  }
  return null;
}

function diffDays(from: string, to: string) {
  const a = new Date(from);
  const b = new Date(to);
  a.setHours(0,0,0,0);
  b.setHours(0,0,0,0);
  return Math.max(0, Math.round((b.getTime() - a.getTime()) / 86400000) + 1);
}
