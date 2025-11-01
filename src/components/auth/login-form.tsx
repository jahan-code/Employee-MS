"use client";

import { useState, useTransition } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Link from "next/link";
import { Eye, EyeOff, Loader2, AlertCircle, Info } from "lucide-react";

export function LoginForm() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [formState, setFormState] = useState({ email: "", password: "" });
  const [showPassword, setShowPassword] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);

    startTransition(async () => {
      const result = await signIn("credentials", {
        email: formState.email,
        password: formState.password,
        redirect: false,
      });

      if (result?.error) {
        setError(result.error);
        return;
      }

      router.replace("/");
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
          autoComplete="email"
          placeholder="name@company.com"
          required
          value={formState.email}
          onChange={(event) =>
            setFormState((prev) => ({ ...prev, email: event.target.value }))
          }
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
            autoComplete="current-password"
            placeholder="Enter your password"
            required
            value={formState.password}
            onChange={(event) =>
              setFormState((prev) => ({ ...prev, password: event.target.value }))
            }
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
      </div>
      {error ? (
        <div className="flex items-start gap-2 rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
          <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
          <p>{error}</p>
        </div>
      ) : null}
      <div className="rounded-lg border border-primary/20 bg-primary/10 p-3 text-xs text-primary">
        <div className="flex items-start gap-2">
          <Info className="mt-0.5 h-4 w-4 shrink-0" />
          <p>
            Didn&apos;t receive your verification email?{" "}
            <Link href="/verify-email/request" className="font-medium text-primary underline-offset-2 hover:underline">
              Send another link
            </Link>
            .
          </p>
        </div>
      </div>
      <div className="text-right text-xs text-muted-foreground">
        <Link href="/forgot-password" className="hover:text-primary/80 transition-colors">
          Need help signing in?
        </Link>
      </div>
      <Button 
        type="submit" 
        className="w-full h-11 font-medium" 
        disabled={isPending}
      >
        {isPending ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Signing in...
          </>
        ) : (
          "Sign in"
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
          Don&apos;t have an account?{" "}
          <Link href="/signup" className="font-medium text-primary hover:text-primary/80 transition-colors">
            Sign up
          </Link>
        </p>
      </div>
    </form>
  );
}
