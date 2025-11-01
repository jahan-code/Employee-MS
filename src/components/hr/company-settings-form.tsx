"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { AlertCircle, CheckCircle2, RefreshCw, Upload } from "lucide-react";

const STORAGE_KEY = "company-settings";
const MAX_LOGO_BYTES = 2 * 1024 * 1024; // 2MB

export function CompanySettingsForm() {
  const [companyName, setCompanyName] = useState("");
  const [logoUrl, setLogoUrl] = useState("");
  const [logoFileName, setLogoFileName] = useState("");
  const [description, setDescription] = useState("");
  const [officeStart, setOfficeStart] = useState("");
  const [officeEnd, setOfficeEnd] = useState("");
  const [allowedIps, setAllowedIps] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [savedAt, setSavedAt] = useState<Date | null>(null);
  const [logoError, setLogoError] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const stored = window.localStorage.getItem(STORAGE_KEY);
      if (!stored) return;
      const parsed = JSON.parse(stored) as {
        name?: string;
        logoUrl?: string;
        description?: string;
        logoFileName?: string;
        officeStart?: string;
        officeEnd?: string;
        allowedIps?: string[];
      } | null;
      if (!parsed) return;
      setCompanyName(parsed.name ?? "");
      setLogoUrl(parsed.logoUrl ?? "");
      setLogoFileName(parsed.logoFileName ?? "");
      setDescription(parsed.description ?? "");
      setOfficeStart(parsed.officeStart ?? "");
      setOfficeEnd(parsed.officeEnd ?? "");
      setAllowedIps((parsed.allowedIps ?? []).join("\n"));
    } catch (error) {
      console.warn("Failed to parse stored company settings", error);
    }
  }, []);

  function persist(data: {
    name: string;
    logoUrl: string;
    description: string;
    logoFileName?: string;
    officeStart?: string;
    officeEnd?: string;
    allowedIps?: string[];
  }) {
    if (typeof window === "undefined") return;
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    window.dispatchEvent(new Event("company-settings-sync"));
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSaving(true);
    setFormError(null);
    try {
      const trimmedStart = officeStart.trim();
      const trimmedEnd = officeEnd.trim();
      const parsedIps = parseAllowedIps(allowedIps);
      if (parsedIps.error) {
        throw new Error(parsedIps.error);
      }
      if (trimmedStart && trimmedEnd) {
        if (!isValidTime(trimmedStart) || !isValidTime(trimmedEnd)) {
          throw new Error("Please enter office hours in HH:MM format.");
        }
        if (!isStartBeforeEnd(trimmedStart, trimmedEnd)) {
          throw new Error("Office end time must be after the start time.");
        }
      }

      persist({
        name: companyName.trim(),
        logoUrl: logoUrl.trim(),
        description: description.trim(),
        logoFileName: logoFileName.trim(),
        officeStart: trimmedStart,
        officeEnd: trimmedEnd,
        allowedIps: parsedIps.values,
      });
      setSavedAt(new Date());
    } catch (error) {
      setFormError(error instanceof Error ? error.message : "Something went wrong while saving.");
    } finally {
      setIsSaving(false);
    }
  }

  function handleReset() {
    setCompanyName("");
    setLogoUrl("");
    setLogoFileName("");
    setDescription("");
    setOfficeStart("");
    setOfficeEnd("");
    setAllowedIps("");
    setLogoError(null);
    setFormError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
    persist({ name: "", logoUrl: "", description: "", logoFileName: "", officeStart: "", officeEnd: "", allowedIps: [] });
    setSavedAt(new Date());
  }

  function handleRemoveLogo() {
    setLogoUrl("");
    setLogoFileName("");
    setLogoError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  }

  async function handleLogoSelect(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    if (!file.type.startsWith("image/")) {
      setLogoError("Please choose an image file (PNG, JPG, GIF, or SVG).");
      if (fileInputRef.current) fileInputRef.current.value = "";
      return;
    }

    if (file.size > MAX_LOGO_BYTES) {
      setLogoError("Please select an image smaller than 2MB.");
      if (fileInputRef.current) fileInputRef.current.value = "";
      return;
    }

    try {
      const dataUrl = await fileToDataUrl(file);
      setLogoUrl(dataUrl);
      setLogoFileName(file.name);
      setLogoError(null);
      setSavedAt(null);
    } catch (error) {
      console.warn("Failed to read logo file", error);
      setLogoError(error instanceof Error ? error.message : "We couldn't read that image. Try a different file.");
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  async function fileToDataUrl(file: File) {
    if (typeof window === "undefined") throw new Error("Cannot read files on the server");
    const arrayBuffer = await file.arrayBuffer();
    const base64 = arrayBufferToBase64(arrayBuffer);
    const mime = file.type || "application/octet-stream";
    return `data:${mime};base64,${base64}`;
  }

  function arrayBufferToBase64(buffer: ArrayBuffer) {
    const bytes = new Uint8Array(buffer);
    const chunkSize = 0x8000;
    let binary = "";
    for (let i = 0; i < bytes.length; i += chunkSize) {
      const chunk = bytes.subarray(i, i + chunkSize);
      binary += String.fromCharCode(...chunk);
    }
    try {
      return window.btoa(binary);
    } catch {
      throw new Error("We couldn't encode that image. Try a different file.");
    }
  }

  function isValidTime(value: string) {
    return /^([01]\d|2[0-3]):[0-5]\d$/.test(value);
  }

  function isStartBeforeEnd(start: string, end: string) {
    return start < end;
  }

  type ParsedIpsResult = { values: string[]; error: string | null };

  function parseAllowedIps(value: string): ParsedIpsResult {
    if (!value.trim()) {
      return { values: [], error: null };
    }
    const lines = value
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter(Boolean);

    for (const line of lines) {
      if (!isValidIpv4(line) && !isValidIpv4Cidr(line)) {
        return { values: [], error: `"${line}" is not a valid IPv4 address or CIDR range.` };
      }
    }

    return { values: [...lines], error: null };
  }

  function isValidIpv4(value: string) {
    const ipv4Segment = "(?:25[0-5]|2[0-4]\\d|1?\\d?\\d)";
    const ipv4Pattern = new RegExp(`^${ipv4Segment}(\\.${ipv4Segment}){3}$`);
    return ipv4Pattern.test(value);
  }

  function isValidIpv4Cidr(value: string) {
    const [ip, prefix] = value.split("/");
    if (!prefix) return false;
    if (!isValidIpv4(ip)) return false;
    const num = Number(prefix);
    return Number.isInteger(num) && num >= 0 && num <= 32;
  }

  return (
    <Card className="border-border bg-card/80 shadow-xl backdrop-blur">
      <CardHeader>
        <CardTitle>Company information</CardTitle>
        <CardDescription>Control the brand name, logo, and helpful details shown across the HR portal.</CardDescription>
      </CardHeader>
      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-6">
          <div className="grid gap-1.5">
            <Label htmlFor="company-name">Company name</Label>
            <Input
              id="company-name"
              value={companyName}
              onChange={(event) => setCompanyName(event.target.value)}
              placeholder="Acme Corp"
              required
              className="h-11"
            />
            <p className="text-xs text-muted-foreground">Appears in the sidebar, header, and verification emails.</p>
          </div>

          <div className="grid gap-3 rounded-lg border border-border/60 bg-muted/20 p-4">
            <div>
              <h3 className="text-sm font-medium text-foreground">Office hours</h3>
              <p className="text-xs text-muted-foreground">Employees can only check in between these times.</p>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="grid gap-1.5">
                <Label htmlFor="office-start">Start time</Label>
                <Input
                  id="office-start"
                  type="time"
                  value={officeStart}
                  onChange={(event) => setOfficeStart(event.target.value)}
                  className="h-11"
                />
              </div>
              <div className="grid gap-1.5">
                <Label htmlFor="office-end">End time</Label>
                <Input
                  id="office-end"
                  type="time"
                  value={officeEnd}
                  onChange={(event) => setOfficeEnd(event.target.value)}
                  className="h-11"
                />
              </div>
            </div>
            <p className="text-xs text-muted-foreground">Leave blank to allow check-ins at any time.</p>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="allowed-ips">Approved office IPs</Label>
            <textarea
              id="allowed-ips"
              value={allowedIps}
              onChange={(event) => setAllowedIps(event.target.value)}
              rows={4}
              placeholder="203.99.176.10\n203.99.176.0/24"
              className="min-h-[120px] rounded-md border border-border bg-card px-3 py-2 text-sm text-foreground shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
            />
            <p className="text-xs text-muted-foreground">One IP or CIDR range per line (e.g. 203.99.176.10 or 203.99.176.0/24). Employees must connect through these public IPs to check in.</p>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="company-logo">Logo</Label>
            <Input
              id="company-logo"
              ref={fileInputRef}
              type="file"
              accept="image/png,image/jpeg,image/gif,image/svg+xml"
              onChange={handleLogoSelect}
              className="h-11"
            />
            <p className="text-xs text-muted-foreground">Upload a square logo (PNG, JPG, GIF, or SVG · max 2MB). Leave empty to use your initials.</p>
            {logoError ? <p className="text-xs text-destructive">{logoError}</p> : null}
            {logoUrl ? (
              <div className="flex items-center gap-3 rounded-lg border border-border/60 bg-muted/20 px-3 py-2">
                <span className="flex h-12 w-12 items-center justify-center overflow-hidden rounded-md bg-card">
                  <Image src={logoUrl} alt="Uploaded logo preview" width={48} height={48} className="h-full w-full object-cover" />
                </span>
                <div className="flex-1 truncate">
                  <p className="text-sm font-medium text-foreground truncate">{logoFileName || "Uploaded logo"}</p>
                  <p className="text-xs text-muted-foreground">Visible in the sidebar and header.</p>
                </div>
                <Button type="button" variant="ghost" size="sm" onClick={handleRemoveLogo}>
                  Remove
                </Button>
              </div>
            ) : null}
          </div>

          <div className="grid gap-1.5">
            <Label htmlFor="company-description">Notes</Label>
            <textarea
              id="company-description"
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              placeholder="Internal notes or onboarding instructions."
              rows={4}
              className="min-h-[120px] resize-none rounded-md border border-border bg-card px-3 py-2 text-sm text-foreground shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
            />
            <p className="text-xs text-muted-foreground">Shown only here for administrators.</p>
          </div>

          {formError ? (
            <div className="flex items-start gap-2 rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-xs text-destructive">
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
              <span>{formError}</span>
            </div>
          ) : null}

          {savedAt ? (
            <div className="flex items-center gap-2 rounded-lg border border-primary/30 bg-primary/10 px-3 py-2 text-xs text-primary">
              <CheckCircle2 className="h-4 w-4" />
              <span>Saved {savedAt.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</span>
            </div>
          ) : null}
        </CardContent>
        <CardFooter className="flex flex-wrap items-center justify-between gap-3">
          <Button type="button" variant="ghost" className="gap-2" onClick={handleReset}>
            <RefreshCw className="h-4 w-4" />
            Reset
          </Button>
          <div className="flex gap-3">
            <Button type="submit" className="gap-2" disabled={isSaving}>
              <Upload className={cn("h-4 w-4", isSaving && "animate-spin")} />
              {isSaving ? "Saving" : "Save changes"}
            </Button>
          </div>
        </CardFooter>
      </form>
    </Card>
  );
}
