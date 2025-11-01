"use client";

import { useCallback, useEffect, useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { signOut } from "next-auth/react";

type Row = {
  id: string;
  checkIn: string;
  checkOut: string | null;
  durationMinutes: number | null;
  createdAt: string;
};

export default function EmployeeAttendanceDetail({ employeeId }: { employeeId: string }) {
  const [rows, setRows] = useState<Row[]>([]);
  const [from, setFrom] = useState(() => formatDateInput(new Date()));
  const [to, setTo] = useState(() => formatDateInput(new Date()));
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const load = useCallback(async () => {
    setError(null);
    setLoading(true);
    try {
      const params = new URLSearchParams({ from, to });
      const res = await fetch(`/api/hr/employee/${employeeId}/attendance?${params.toString()}`, { cache: "no-store" });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error ?? "Failed to load attendance");
      setRows(data.attendance as Row[]);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }, [employeeId, from, to]);

  useEffect(() => {
    load();
  }, [load]);

  function handleApply() {
    startTransition(() => load());
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm">
          <Link href="/hr" className="underline">Back to HR</Link>
        </div>
        <Button variant="outline" onClick={() => signOut({ callbackUrl: "/login" })}>Logout</Button>
      </div>
      <div className="flex flex-wrap items-end gap-3 text-sm text-slate-300">
        <label className="grid gap-1">
          <span className="text-xs text-slate-400">From</span>
          <input type="date" value={from} onChange={(e) => setFrom(e.target.value)} className="rounded border border-slate-700 bg-slate-900 px-2 py-1" />
        </label>
        <label className="grid gap-1">
          <span className="text-xs text-slate-400">To</span>
          <input type="date" value={to} onChange={(e) => setTo(e.target.value)} className="rounded border border-slate-700 bg-slate-900 px-2 py-1" />
        </label>
        <Button variant="outline" onClick={handleApply} disabled={isPending}>{isPending ? "Refreshing..." : "Apply"}</Button>
      </div>

      {error ? (<p className="text-sm text-red-500" role="alert">{error}</p>) : null}

      <div className="overflow-x-auto rounded-md border border-slate-800">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-900/60 text-slate-300">
            <tr>
              <th className="px-3 py-2">Check-in</th>
              <th className="px-3 py-2">Check-out</th>
              <th className="px-3 py-2">Duration</th>
              <th className="px-3 py-2">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={4} className="px-3 py-6 text-center text-slate-400">Loading...</td></tr>
            ) : rows.length === 0 ? (
              <tr><td colSpan={4} className="px-3 py-6 text-center text-slate-400">No records</td></tr>
            ) : (
              rows.map((r) => (
                <EditableRow key={r.id} row={r} onSaved={load} />
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function EditableRow({ row, onSaved }: { row: Row; onSaved: () => void }) {
  const [checkIn, setCheckIn] = useState(() => toLocalInputValue(row.checkIn));
  const [checkOut, setCheckOut] = useState(() => (row.checkOut ? toLocalInputValue(row.checkOut) : ""));
  const [reason, setReason] = useState("");
  const [saving, startSaving] = useTransition();
  const [err, setErr] = useState<string | null>(null);

  function handleSave() {
    startSaving(async () => {
      setErr(null);
      try {
        const payload: { checkIn: string; checkOut: string | null; reason?: string } = {
          checkIn: new Date(checkIn).toISOString(),
          checkOut: checkOut ? new Date(checkOut).toISOString() : null,
          reason: reason || undefined,
        };
        const res = await fetch(`/api/hr/attendance/${row.id}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
        const data = await res.json();
        if (!res.ok) throw new Error(data?.error ?? "Update failed");
        onSaved();
      } catch (e) {
        setErr(e instanceof Error ? e.message : "Update failed");
      }
    });
  }

  return (
    <tr className="border-t border-slate-800">
      <td className="px-3 py-2">
        <input type="datetime-local" value={checkIn} onChange={(e) => setCheckIn(e.target.value)} className="rounded border border-slate-700 bg-slate-900 px-2 py-1" />
      </td>
      <td className="px-3 py-2">
        <input type="datetime-local" value={checkOut} onChange={(e) => setCheckOut(e.target.value)} className="rounded border border-slate-700 bg-slate-900 px-2 py-1" />
      </td>
      <td className="px-3 py-2">{formatMinutes(row.durationMinutes ?? 0)}</td>
      <td className="px-3 py-2 space-y-2">
        {err ? (<p className="text-xs text-red-500" role="alert">{err}</p>) : null}
        <div className="flex flex-col gap-2 sm:flex-row">
          <input
            type="text"
            placeholder="Reason (optional)"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            className="w-full rounded border border-slate-700 bg-slate-900 px-2 py-1"
          />
          <Button onClick={handleSave} disabled={saving}>{saving ? "Saving..." : "Save"}</Button>
        </div>
      </td>
    </tr>
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

function toLocalInputValue(value: string) {
  const dt = new Date(value);
  const y = dt.getFullYear();
  const m = String(dt.getMonth() + 1).padStart(2, "0");
  const d = String(dt.getDate()).padStart(2, "0");
  const hh = String(dt.getHours()).padStart(2, "0");
  const mm = String(dt.getMinutes()).padStart(2, "0");
  return `${y}-${m}-${d}T${hh}:${mm}`;
}
