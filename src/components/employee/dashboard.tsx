"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { LogIn, LogOut, HandCoins, Timer, Info, RefreshCw } from "lucide-react";

const COMPANY_SETTINGS_KEY = "company-settings";

type Status =
  | { kind: "loading" }
  | { kind: "checked_in"; checkIn: string; recordId: string }
  | { kind: "checked_out"; lastWorkedSeconds?: number };

export default function EmployeeDashboard() {
  const [status, setStatus] = useState<Status>({ kind: "loading" });
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [tick, setTick] = useState(0);
  const [companySettings, setCompanySettings] = useState<{ officeStart?: string; officeEnd?: string } | null>(null);
  const [currentTime, setCurrentTime] = useState(() => new Date());
  const autoCheckoutRef = useRef<string | null>(null);

  async function refresh() {
    setError(null);
    try {
      const res = await fetch("/api/attendance/status", { cache: "no-store" });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error ?? "Failed to load status");
      if (data.status === "checked_in") {
        setStatus({ kind: "checked_in", checkIn: data.checkIn, recordId: data.recordId });
      } else {
        setStatus({ kind: "checked_out" });
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong");
    }
  }

  useEffect(() => {
    refresh();
  }, []);

  // Live ticker updates every second while checked in
  useEffect(() => {
    if (status.kind !== "checked_in") return;
    setTick(0); // reset
    const id = setInterval(() => setTick((t) => t + 1), 1000);
    return () => clearInterval(id);
  }, [status.kind]);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const syncSettings = () => {
      try {
        const raw = window.localStorage.getItem(COMPANY_SETTINGS_KEY);
        if (!raw) {
          setCompanySettings(null);
          return;
        }
        const parsed = JSON.parse(raw) as { officeStart?: string; officeEnd?: string } | null;
        setCompanySettings(parsed ?? null);
      } catch {
        setCompanySettings(null);
      }
    };

    syncSettings();

    const handleStorage = (event: StorageEvent) => {
      if (!event.key || event.key === COMPANY_SETTINGS_KEY) {
        syncSettings();
      }
    };

    const handleCustom = () => syncSettings();

    window.addEventListener("storage", handleStorage);
    window.addEventListener("company-settings-sync", handleCustom);

    return () => {
      window.removeEventListener("storage", handleStorage);
      window.removeEventListener("company-settings-sync", handleCustom);
    };
  }, []);

  useEffect(() => {
    const id = setInterval(() => setCurrentTime(new Date()), 60_000);
    return () => clearInterval(id);
  }, []);

  const officeStart = companySettings?.officeStart?.trim() || "";
  const officeEnd = companySettings?.officeEnd?.trim() || "";
  const hasOfficeWindow = Boolean(officeStart && officeEnd && isValidTime(officeStart) && isValidTime(officeEnd));
  const withinOfficeHours = !hasOfficeWindow || isWithinOfficeHours(officeStart, officeEnd, currentTime);

  function handleCheckIn() {
    startTransition(async () => {
      setError(null);
      if (!withinOfficeHours && hasOfficeWindow) {
        setError("Check-in is only available during configured office hours.");
        return;
      }
      const res = await fetch("/api/attendance/check-in", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ officeStart, officeEnd }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data?.error ?? "Check-in failed");
        return;
      }
      await refresh();
    });
  }

  function handleCheckOut() {
    startTransition(async () => {
      setError(null);
      const res = await fetch("/api/attendance/check-out", { method: "POST" });
      const data = await res.json();
      if (!res.ok) {
        setError(data?.error ?? "Check-out failed");
        return;
      }
      setStatus({ kind: "checked_out", lastWorkedSeconds: typeof data?.durationMinutes === "number" ? data.durationMinutes * 60 : undefined });
    });
  }

  useEffect(() => {
    if (status.kind !== "checked_in") {
      autoCheckoutRef.current = null;
      return;
    }
    if (hasOfficeWindow && !withinOfficeHours) {
      if (autoCheckoutRef.current === status.recordId) return;
      autoCheckoutRef.current = status.recordId;
      handleCheckOut();
    }
  }, [status, hasOfficeWindow, withinOfficeHours]);

  const elapsedLabel = getElapsedLabel(status, tick);
  const workedLabel = getWorkedLabel(status);

  return (
    <div className="space-y-6">
      <Card className="border-border bg-card/80 shadow-xl backdrop-blur">
        <CardHeader className="flex flex-row items-start justify-between gap-4">
          <div>
            <CardTitle className="text-2xl">Today&apos;s Status</CardTitle>
            <CardDescription className="mt-1 flex items-center gap-2 text-xs text-muted-foreground">
              View your current attendance state and time tracked.
              <button
                type="button"
                className="inline-flex h-6 w-6 items-center justify-center rounded-lg border border-transparent bg-transparent text-muted-foreground/80 transition-colors hover:text-primary disabled:opacity-30"
                aria-label="Refresh status"
                onClick={() => refresh()}
                disabled={status.kind === "loading"}
              >
                <RefreshCw className="h-3.5 w-3.5" />
              </button>
            </CardDescription>
          </div>
          {status.kind === "loading" ? (
            <Skeleton className="h-8 w-28" />
          ) : (
            <Badge
              variant={status.kind === "checked_in" ? "default" : "secondary"}
              className={cn(
                "inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold",
                status.kind === "checked_in" ? "bg-primary/15 text-primary" : "bg-muted text-muted-foreground"
              )}
            >
              <span className="flex h-1.5 w-1.5 rounded-full bg-current" aria-hidden="true" />
              {status.kind === "checked_in" ? "Checked In" : "Checked Out"}
            </Badge>
          )}
        </CardHeader>
        <CardContent>
          {status.kind === "checked_in" ? (
            <div className="space-y-4">
              <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
                <Timer className="h-4 w-4 text-primary" />
                <span>
                  Checked in at{" "}
                  <span className="font-medium text-foreground">
                    {new Date(status.checkIn).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                  </span>
                </span>
              </div>
              <div className="flex items-center gap-4 rounded-lg border border-border/60 bg-muted/30 px-4 py-3">
                <div className="flex h-3 w-3 animate-pulse items-center justify-center">
                  <span className="h-2 w-2 rounded-full bg-emerald-400" />
                </div>
                <div>
                  <p className="font-mono text-3xl font-semibold text-foreground">{elapsedLabel}</p>
                  <p className="text-xs text-muted-foreground">Time elapsed</p>
                </div>
              </div>
              <p className="flex items-center gap-2 text-xs text-muted-foreground">
                <Info className="h-3.5 w-3.5" />
                We&apos;ll keep counting while you&apos;re checked in.
              </p>
            </div>
          ) : status.kind === "checked_out" ? (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">You&apos;re not checked in at the moment.</p>
              {workedLabel ? (
                <div className="rounded-lg border border-border/60 bg-muted/30 px-4 py-3">
                  <p className="font-mono text-2xl font-semibold text-foreground/90">{workedLabel}</p>
                  <p className="text-xs text-muted-foreground">Time worked during your last session</p>
                </div>
              ) : (
                <p className="text-xs text-muted-foreground">Start a new session to begin tracking your time.</p>
              )}
            </div>
          ) : (
            <div className="space-y-2">
              <Skeleton className="h-4 w-40" />
              <Skeleton className="h-8 w-32" />
            </div>
          )}
        </CardContent>
      </Card>

      {error ? (
        <div className="flex items-start gap-2 rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
          <svg className="h-4 w-4 mt-0.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <p>{error}</p>
        </div>
      ) : null}

      {!withinOfficeHours && hasOfficeWindow ? (
        <div className="flex items-start gap-2 rounded-lg border border-border/60 bg-muted/30 p-3 text-xs text-muted-foreground">
          <Info className="h-4 w-4 text-primary" />
          <div>
            <p>
              Office hours are {formatOfficeWindow(officeStart, officeEnd)}. Check-in opens only during this window.
              {status.kind === "checked_in" ? " You were automatically checked out once the day ended." : ""}
            </p>
          </div>
        </div>
      ) : null}

      <div className="grid gap-3 sm:grid-cols-2">
        {status.kind === "loading" ? (
          <>
            <Skeleton className="h-14 w-full" />
            <Skeleton className="h-14 w-full" />
          </>
        ) : status.kind === "checked_in" ? (
          <>
            <Button
              onClick={handleCheckOut}
              disabled={isPending}
              className="h-14 w-full bg-destructive text-destructive-foreground font-medium text-base sm:col-span-2"
            >
              <LogOut className="mr-2 h-5 w-5" />
              {isPending ? "Checking out..." : "Check Out"}
            </Button>
            <Link href="/employee/leave" className="sm:col-span-2">
              <Button variant="outline" className="h-12 w-full">
                <HandCoins className="mr-2 h-4 w-4" /> Manage Leave
              </Button>
            </Link>
          </>
        ) : (
          <>
            <Button
              onClick={handleCheckIn}
              disabled={isPending || (hasOfficeWindow && !withinOfficeHours)}
              className="h-14 w-full bg-primary text-primary-foreground font-medium text-base sm:col-span-2"
            >
              <LogIn className="mr-2 h-5 w-5" />
              {isPending ? "Checking in..." : "Check In"}
            </Button>
            <Link href="/employee/leave" className="sm:col-span-2">
              <Button variant="outline" className="h-12 w-full">
                <HandCoins className="mr-2 h-4 w-4" /> Manage Leave
              </Button>
            </Link>
          </>
        )}
      </div>
    </div>
  );
}

function formatHMS(totalSeconds: number) {
  const s = Math.max(0, Math.floor(totalSeconds));
  const hh = String(Math.floor(s / 3600)).padStart(2, "0");
  const mm = String(Math.floor((s % 3600) / 60)).padStart(2, "0");
  const ss = String(s % 60).padStart(2, "0");
  return `${hh}:${mm}:${ss}`;
}

function getElapsedLabel(status: Status, tick: number) {
  if (status.kind !== "checked_in") return "";
  const checkInMs = new Date(status.checkIn).getTime();
  const nowMs = Date.now();
  const seconds = Math.floor((nowMs - checkInMs) / 1000);
  // tick ensures this recomputes every second
  void tick;
  return formatHMS(seconds);
}

function getWorkedLabel(status: Status) {
  if (status.kind !== "checked_out" || typeof status.lastWorkedSeconds !== "number") return "";
  return formatHMS(status.lastWorkedSeconds);
}

function isValidTime(value: string) {
  return /^([01]\d|2[0-3]):[0-5]\d$/.test(value);
}

function timeStringToMinutes(value: string) {
  const [hh, mm] = value.split(":").map(Number);
  return hh * 60 + mm;
}

function isWithinOfficeHours(start: string, end: string, current: Date) {
  if (!isValidTime(start) || !isValidTime(end) || start >= end) return true;
  const minutes = current.getHours() * 60 + current.getMinutes();
  return minutes >= timeStringToMinutes(start) && minutes <= timeStringToMinutes(end);
}

function formatOfficeWindow(start: string, end: string) {
  if (!isValidTime(start) || !isValidTime(end)) return "not configured";
  return `${start} – ${end}`;
}
