"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, Mail, CheckCircle2 } from "lucide-react";

export default function ForgotPasswordForm() {
  const [email, setEmail] = useState("");
  const [msg, setMsg] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [isPending, startTransition] = useTransition();

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    startTransition(async () => {
      setMsg(null);
      setSuccess(false);
      try {
        await fetch("/api/password-reset/request", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email })
        });
        setSuccess(true);
        setMsg("If the email exists, a reset link has been sent.");
      } catch {
        setSuccess(true);
        setMsg("If the email exists, a reset link has been sent.");
      }
    });
  }

  if (success && msg) {
    return (
      <div className="space-y-4 text-center">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
          <CheckCircle2 className="h-6 w-6 text-primary" />
        </div>
        <div className="space-y-2">
          <h3 className="text-lg font-semibold text-foreground">Check your email</h3>
          <p className="text-sm text-muted-foreground">{msg}</p>
        </div>
      </div>
    );
  }

  return (
    <form className="space-y-5" onSubmit={handleSubmit}>
      <div className="space-y-2">
        <Label htmlFor="email" className="text-sm font-medium text-foreground">
          Email address
        </Label>
        <div className="relative">
          <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="name@company.com"
            required
            className="h-11 bg-card border-border pl-10 focus-visible:ring-2 focus-visible:ring-primary/40"
            disabled={isPending}
          />
        </div>
      </div>
      <Button 
        type="submit" 
        className="w-full h-11 font-medium" 
        disabled={isPending}
      >
        {isPending ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Sending...
          </>
        ) : (
          "Send reset link"
        )}
      </Button>
    </form>
  );
}
