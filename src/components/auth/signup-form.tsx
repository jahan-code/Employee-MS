"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Eye, EyeOff, Loader2, AlertCircle, CheckCircle2 } from "lucide-react";

export function SignupForm() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [formState, setFormState] = useState({ name: "", email: "", password: "" });
  const [showPassword, setShowPassword] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);

    startTransition(async () => {
      try {
        const res = await fetch("/api/signup", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(formState),
        });

        const data = await res.json();
        if (!res.ok) {
          setError(data?.error ?? "Signup failed");
          return;
        }

        setSuccess(true);
        setTimeout(() => {
          router.replace("/login");
        }, 2000);
      } catch {
        setError("Network error. Please try again.");
      }
    });
  }

  if (success) {
    return (
      <div className="space-y-4 text-center">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
          <CheckCircle2 className="h-6 w-6 text-primary" />
        </div>
        <div className="space-y-2">
          <h3 className="text-lg font-semibold text-foreground">Account created!</h3>
          <p className="text-sm text-muted-foreground">
            Redirecting you to login...
          </p>
        </div>
      </div>
    );
  }

  return (
    <form className="space-y-5" onSubmit={handleSubmit}>
      <div className="space-y-2">
        <Label htmlFor="name" className="text-sm font-medium text-foreground">
          Full name
        </Label>
        <Input
          id="name"
          type="text"
          autoComplete="name"
          placeholder="John Doe"
          required
          value={formState.name}
          onChange={(event) => setFormState((prev) => ({ ...prev, name: event.target.value }))}
          className="h-11 bg-card border-border focus-visible:ring-2 focus-visible:ring-primary/40"
          disabled={isPending}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="email" className="text-sm font-medium text-foreground">
          Email address
        </Label>
        <Input
          id="email"
          type="email"
          autoComplete="email"
          placeholder="name@company.com"
          required
          value={formState.email}
          onChange={(event) => setFormState((prev) => ({ ...prev, email: event.target.value }))}
          className="h-11 bg-card border-border focus-visible:ring-2 focus-visible:ring-primary/40"
          disabled={isPending}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="password" className="text-sm font-medium text-foreground">
          Password
        </Label>
        <div className="relative">
          <Input
            id="password"
            type={showPassword ? "text" : "password"}
            autoComplete="new-password"
            placeholder="At least 6 characters"
            required
            minLength={6}
            value={formState.password}
            onChange={(event) => setFormState((prev) => ({ ...prev, password: event.target.value }))}
            className="h-11 bg-card border-border pr-10 focus-visible:ring-2 focus-visible:ring-primary/40"
            disabled={isPending}
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
            tabIndex={-1}
          >
            {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        </div>
        <p className="text-xs text-muted-foreground">Must be at least 6 characters long</p>
      </div>
      {error ? (
        <div className="flex items-start gap-2 rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
          <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
          <p>{error}</p>
        </div>
      ) : null}
      <Button 
        type="submit" 
        className="w-full h-11 font-medium" 
        disabled={isPending}
      >
        {isPending ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Creating account...
          </>
        ) : (
          "Create account"
        )}
      </Button>
      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <span className="w-full border-t border-border" />
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-card px-2 text-muted-foreground">Or</span>
        </div>
      </div>
      <div className="text-center text-sm">
        <p className="text-muted-foreground">
          Already have an account?{" "}
          <Link href="/login" className="font-medium text-primary hover:text-primary/80 transition-colors">
            Sign in
          </Link>
        </p>
      </div>
    </form>
  );
}
