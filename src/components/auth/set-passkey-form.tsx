"use client";

import { useState, useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function SetPasskeyForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token") ?? "";
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [passkey, setPasskey] = useState("");

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);

    startTransition(async () => {
      const res = await fetch("/api/set-passkey", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, passkey }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data?.error ?? "Failed to verify passkey");
        return;
      }
      router.replace("/login");
    });
  }

  return (
    <form className="space-y-6" onSubmit={handleSubmit}>
      {!token ? (
        <p className="text-sm text-red-500" role="alert">Invalid or missing link. Please open the link from your email.</p>
      ) : null}
      <div className="space-y-2">
        <Label htmlFor="passkey">Passkey</Label>
        <Input
          id="passkey"
          type="password"
          required
          value={passkey}
          onChange={(e) => setPasskey(e.target.value)}
        />
      </div>
      {error ? (
        <p className="text-sm text-red-500" role="alert">{error}</p>
      ) : null}
      <Button type="submit" className="w-full" disabled={isPending || !token}>
        {isPending ? "Verifying..." : "Verify"}
      </Button>
    </form>
  );
}
