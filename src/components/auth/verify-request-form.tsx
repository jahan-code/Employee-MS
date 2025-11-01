"use client";

import { FormEvent, useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AlertCircle, MailCheck } from "lucide-react";

export default function VerifyRequestForm() {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);
  const [isPending, startTransition] = useTransition();

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    startTransition(async () => {
      setMessage(null);
      setIsSuccess(false);
      try {
        await fetch("/api/verify-email/request", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email }),
        });
        setMessage("If that email is registered, we just sent a new verification link.");
        setIsSuccess(true);
      } catch {
        setMessage("If that email is registered, we just sent a new verification link.");
      }
    });
  }

  return (
    <form className="space-y-5" onSubmit={handleSubmit}>
      <div className="space-y-2">
        <Label htmlFor="email" className="text-sm font-medium text-foreground">
          Email address
        </Label>
        <Input
          id="email"
          type="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          placeholder="you@example.com"
          autoComplete="email"
          required
          className="h-11 bg-card border-border focus-visible:ring-2 focus-visible:ring-primary/40"
          disabled={isPending}
        />
      </div>
      <Button type="submit" disabled={isPending} className="w-full h-11 font-medium">
        {isPending ? "Sending..." : "Email me a link"}
      </Button>
      {message ? (
        <div
          className={`flex items-start gap-2 rounded-lg border p-3 text-sm ${
            isSuccess
              ? "border-emerald-400/30 bg-emerald-500/10 text-emerald-400"
              : "border-muted border-dashed bg-muted/40 text-muted-foreground"
          }`}
        >
          {isSuccess ? (
            <MailCheck className="mt-0.5 h-4 w-4 shrink-0" />
          ) : (
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
          )}
          <p>{message}</p>
        </div>
      ) : null}
    </form>
  );
}
