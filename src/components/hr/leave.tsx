"use client";

import { useEffect, useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { RefreshCw, Check, X } from "lucide-react";

 type Row = {
  id: string;
  user: string;
  userName?: string;
  userEmail?: string;
  type: string;
  from: string;
  to: string;
  days: number;
  status: string;
  reason: string;
  decidedBy: string;
  decidedAt: string | null;
  decisionNote: string;
  createdAt: string;
};

export default function HRLeave() {
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  async function load() {
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/hr/leave", { cache: "no-store" });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error ?? "Failed to load");
      setRows(data.leaves as Row[]);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

function statusVariant(status: string): "default" | "secondary" | "destructive" {
  switch (status) {
    case "approved":
    case "checked_in":
      return "default";
    case "denied":
      return "destructive";
    default:
      return "secondary";
  }
}

  useEffect(() => { load(); }, []);

  function decide(id: string, status: "approved" | "denied") {
    startTransition(async () => {
      setError(null);
      try {
        const res = await fetch(`/api/hr/leave/${id}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ status }) });
        const data = await res.json();
        if (!res.ok) throw new Error(data?.error ?? "Failed to update");
        await load();
      } catch (e) {
        setError(e instanceof Error ? e.message : "Failed to update");
      }
    });
  }

  const pendingCount = rows.filter(r => r.status === "pending").length;
  const approvedCount = rows.filter(r => r.status === "approved").length;
  const deniedCount = rows.filter(r => r.status === "denied").length;

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-lg border border-border bg-card/70 p-4 backdrop-blur-sm transition-colors">
          <div className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Pending</div>
          <div className="mt-2 text-2xl font-semibold text-amber-400">{pendingCount}</div>
        </div>
        <div className="rounded-lg border border-border bg-card/70 p-4 backdrop-blur-sm transition-colors">
          <div className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Approved</div>
          <div className="mt-2 text-2xl font-semibold text-emerald-400">{approvedCount}</div>
        </div>
        <div className="rounded-lg border border-border bg-card/70 p-4 backdrop-blur-sm transition-colors">
          <div className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Denied</div>
          <div className="mt-2 text-2xl font-semibold text-red-400">{deniedCount}</div>
        </div>
      </div>

      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Leave Requests</h2>
        <div className="flex gap-2">
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
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide">User</th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide">Type</th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide">From</th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide">To</th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide">Days</th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide">Reason</th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide">Status</th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              Array.from({ length: 6 }).map((_, i) => (
                <tr key={`s-${i}`} className="border-t border-border/60">
                  <td className="px-4 py-3"><Skeleton className="h-4 w-40" /></td>
                  <td className="px-4 py-3"><Skeleton className="h-4 w-32" /></td>
                  <td className="px-4 py-3"><Skeleton className="h-4 w-32" /></td>
                  <td className="px-4 py-3"><Skeleton className="h-4 w-32" /></td>
                  <td className="px-4 py-3"><Skeleton className="h-4 w-16" /></td>
                  <td className="px-4 py-3"><Skeleton className="h-4 w-48" /></td>
                  <td className="px-4 py-3"><Skeleton className="h-4 w-16" /></td>
                  <td className="px-4 py-3"><Skeleton className="h-8 w-28" /></td>
                </tr>
              ))
            ) : rows.length === 0 ? (
              <tr><td colSpan={8} className="px-4 py-12 text-center text-muted-foreground">No leave requests found.</td></tr>
            ) : (
              rows.map((r) => (
                <tr key={r.id} className="border-t border-border/60 transition-colors hover:bg-muted/50">
                  <td className="px-4 py-3 text-foreground">
                    <div className="space-y-0.5">
                      <div className="font-medium text-foreground">{r.userName ?? r.user}</div>
                      <div className="text-xs text-muted-foreground">{r.userEmail ?? "-"}</div>
                    </div>
                  </td>
                  <td className="px-4 py-3 capitalize text-foreground/80">{r.type}</td>
                  <td className="px-4 py-3 text-foreground/80">{new Date(r.from).toLocaleDateString()}</td>
                  <td className="px-4 py-3 text-foreground/80">{new Date(r.to).toLocaleDateString()}</td>
                  <td className="px-4 py-3 text-foreground">{r.days}</td>
                  <td className="px-4 py-3 text-foreground/80">{r.reason || "-"}</td>
                  <td className="px-4 py-3">
                    <Badge variant={statusVariant(r.status)}>{r.status}</Badge>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2">
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => decide(r.id, "approved")} 
                        disabled={isPending || r.status !== "pending"}
                        className="text-green-400 hover:text-green-300"
                      >
                        <Check className="mr-1 h-3 w-3" /> Approve
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => decide(r.id, "denied")} 
                        disabled={isPending || r.status !== "pending"}
                        className="text-red-400 hover:text-red-300"
                      >
                        <X className="mr-1 h-3 w-3" /> Deny
                      </Button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
