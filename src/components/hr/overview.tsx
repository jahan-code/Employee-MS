"use client";

import { useCallback, useEffect, useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Download, RefreshCw } from "lucide-react";
import { cn } from "@/lib/utils";
import Link from "next/link";

type EmployeeRow = {
  id: string;
  name: string;
  email: string;
  status: "checked_in" | "checked_out";
  checkIn: string | null;
  minutes: number;
};

export default function HROverview() {
  const [rows, setRows] = useState<EmployeeRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [from, setFrom] = useState(() => formatDateInput(new Date()));
  const [to, setTo] = useState(() => formatDateInput(new Date()));
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const load = useCallback(async () => {
    setError(null);
    setLoading(true);
    try {
      const params = new URLSearchParams({ from, to });
      const res = await fetch(`/api/hr/overview?${params.toString()}`, { cache: "no-store" });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error ?? "Failed to load overview");
      setRows(data.employees as EmployeeRow[]);
      setLastUpdated(new Date());
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }, [from, to]);

  useEffect(() => {
    load();
    const id = setInterval(load, 60_000);
    return () => clearInterval(id);
  }, [load]);

  function handleRefresh() {
    startTransition(() => load());
  }

  function setToday() {
    const d = new Date();
    const v = formatDateInput(d);
    setFrom(v);
    setTo(v);
  }

  function setThisWeek() {
    const d = new Date();
    const day = d.getDay();
    const diffToMonday = (day + 6) % 7; // 0=>Mon
    const start = new Date(d);
    start.setDate(d.getDate() - diffToMonday);
    const end = new Date(start);
    end.setDate(start.getDate() + 6);
    setFrom(formatDateInput(start));
    setTo(formatDateInput(end));
  }

  function setThisMonth() {
    const d = new Date();
    const start = new Date(d.getFullYear(), d.getMonth(), 1);
    const end = new Date(d.getFullYear(), d.getMonth() + 1, 0);
    setFrom(formatDateInput(start));
    setTo(formatDateInput(end));
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-2xl font-semibold tracking-tight">Attendance overview</h1>
          <p className="text-sm text-muted-foreground">
            Monitor check-ins, hours worked, and spot trends across your team.
          </p>
        </div>
        <div className="flex flex-col items-start gap-2 text-xs text-muted-foreground sm:flex-row sm:items-center sm:gap-3">
          <Badge variant="outline" className="px-2 py-1 font-medium">
            {formatRangeLabel(from, to)}
          </Badge>
          {lastUpdated ? (
            <span>Last updated {formatUpdatedTime(lastUpdated)}</span>
          ) : null}
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <div className="rounded-lg border border-border bg-card/70 p-4 backdrop-blur-sm transition-colors">
          <div className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Total Employees</div>
          <div className="mt-2 text-2xl font-semibold">{rows.length}</div>
        </div>
        <div className="rounded-lg border border-border bg-card/70 p-4 backdrop-blur-sm transition-colors">
          <div className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Total Hours (Range)</div>
          <div className="mt-2 text-2xl font-semibold">{formatMinutes(rows.reduce((s, r) => s + (typeof r.minutes === "number" ? r.minutes : 0), 0))}</div>
        </div>
        <div className="rounded-lg border border-border bg-card/70 p-4 backdrop-blur-sm transition-colors sm:col-span-2 lg:col-span-1">
          <div className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Checked In</div>
          <div className="mt-2 text-2xl font-semibold">{rows.filter(r => r.status === "checked_in").length}</div>
        </div>
      </div>

      {/* Filters Section */}
      <div className="rounded-lg border border-border/80 bg-card/60 p-4 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold">Filter by date</h2>
            <p className="text-xs text-muted-foreground">Choose a range to update metrics and exports.</p>
          </div>
          <a
            href={`/api/hr/overview?${new URLSearchParams({ from, to, format: "csv" }).toString()}`}
            className="inline-flex items-center gap-2 rounded-md border border-border bg-card px-3 py-2 text-sm text-foreground shadow-sm transition-colors hover:bg-muted"
          >
            <Download className="h-4 w-4" /> Export CSV
          </a>
        </div>

        <div className="mt-4 flex flex-wrap items-end gap-3">
          <label className="grid gap-1.5">
            <span className="text-xs font-medium text-muted-foreground">From</span>
            <input
              type="date"
              value={from}
              onChange={(e) => setFrom(e.target.value)}
              className="h-9 rounded-md border border-border bg-card px-3 py-2 text-sm text-foreground shadow-sm transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
            />
          </label>
          <label className="grid gap-1.5">
            <span className="text-xs font-medium text-muted-foreground">To</span>
            <input
              type="date"
              value={to}
              onChange={(e) => setTo(e.target.value)}
              className="h-9 rounded-md border border-border bg-card px-3 py-2 text-sm text-foreground shadow-sm transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
            />
          </label>
          <Button variant="outline" size="sm" onClick={handleRefresh} disabled={isPending}>
            <RefreshCw className={cn("mr-2 h-4 w-4", isPending && "animate-spin")} />
            {isPending ? "Refreshing..." : "Apply"}
          </Button>
          <div className="flex gap-2">
            <Button type="button" variant="secondary" size="sm" onClick={() => { setToday(); handleRefresh(); }}>Today</Button>
            <Button type="button" variant="secondary" size="sm" onClick={() => { setThisWeek(); handleRefresh(); }}>Week</Button>
            <Button type="button" variant="secondary" size="sm" onClick={() => { setThisMonth(); handleRefresh(); }}>Month</Button>
          </div>
        </div>
      </div>
      {error ? (
        <p className="text-sm text-destructive" role="alert">{error}</p>
      ) : null}
      <div className="overflow-x-auto rounded-lg border border-border bg-card/60 backdrop-blur-sm shadow-sm">
        <table className="w-full text-left text-sm">
          <thead className="sticky top-0 bg-card/90 text-muted-foreground backdrop-blur">
            <tr className="border-b border-border/80">
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide">Name</th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide">Email</th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide">Status</th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide">Check-in</th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide">Hours</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              Array.from({ length: 6 }).map((_, i) => (
                <tr key={`s-${i}`} className="border-t border-border/60">
                  <td className="px-4 py-3"><Skeleton className="h-4 w-40" /></td>
                  <td className="px-4 py-3"><Skeleton className="h-4 w-56" /></td>
                  <td className="px-4 py-3"><Skeleton className="h-5 w-24" /></td>
                  <td className="px-4 py-3"><Skeleton className="h-4 w-28" /></td>
                  <td className="px-4 py-3"><Skeleton className="h-4 w-20" /></td>
                </tr>
              ))
            ) : rows.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-12 text-center text-muted-foreground">No employees found for this range.</td>
              </tr>
            ) : (
              rows.map((r) => (
                <tr key={r.id} className="border-t border-border/60 transition-colors hover:bg-muted/50">
                  <td className="px-4 py-3"><Link href={`/hr/employee/${r.id}`} className="font-medium text-foreground hover:text-primary hover:underline">{r.name}</Link></td>
                  <td className="px-4 py-3"><Link href={`mailto:${r.email}`} className="text-muted-foreground hover:text-foreground hover:underline">{r.email}</Link></td>
                  <td className="px-4 py-3">
                    <Badge variant={r.status === "checked_in" ? "default" : "secondary"}>
                      {r.status === "checked_in" ? "Checked In" : "Checked Out"}
                    </Badge>
                  </td>
                  <td className="px-4 py-3 text-foreground/80">{r.checkIn ? new Date(r.checkIn).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : "-"}</td>
                  <td className="px-4 py-3 font-mono text-foreground/80">{formatMinutes(typeof r.minutes === "number" ? r.minutes : 0)}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function formatMinutes(mins: number) {
  const m = Math.max(0, Math.floor(mins));
  const hh = String(Math.floor(m / 60)).padStart(2, "0");
  const mm = String(m % 60).padStart(2, "0");
  return `${hh}:${mm}`;
}

function formatDateInput(d: Date) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function formatRangeLabel(from: string, to: string) {
  if (!from || !to) return "All time";
  if (from === to) {
    return formatDisplayDate(from);
  }
  return `${formatDisplayDate(from)} – ${formatDisplayDate(to)}`;
}

function formatDisplayDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

function formatUpdatedTime(date: Date) {
  return date.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" });
}
