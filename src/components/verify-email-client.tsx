"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle2, XCircle, Loader2 } from "lucide-react";
import Link from "next/link";

export default function VerifyEmailClient({ token }: { token: string }) {
  const [status, setStatus] = useState<"pending" | "success" | "error">("pending");
  const [message, setMessage] = useState("Verifying...");

  useEffect(() => {
    async function run() {
      try {
        const url = new URL("/api/verify-email", window.location.origin);
        url.searchParams.set("token", token);
        const res = await fetch(url.toString());
        const data = await res.json();
        if (!res.ok) throw new Error(data?.error ?? "Verification failed");
        setStatus("success");
        setMessage("Email verified successfully. You can close this tab and log in.");
      } catch (e) {
        setStatus("error");
        setMessage(e instanceof Error ? e.message : "Verification failed");
      }
    }
    if (token) run();
  }, [token]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-linear-to-br from-slate-950 via-slate-900 to-slate-950 p-6 text-white">
      <Card className="w-full max-w-md border-slate-800 bg-slate-900/80 backdrop-blur-xl shadow-2xl">
        <CardHeader className="space-y-1 pb-6">
          <div className="mb-2 flex items-center gap-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-cyan-500/10">
              <svg className="h-6 w-6 text-cyan-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            </div>
            <span className="text-xl font-semibold">Employee MS</span>
          </div>
          <CardTitle className="text-2xl font-bold">Email Verification</CardTitle>
          <CardDescription className="text-slate-400">
            {status === "pending" && "Verifying your email address..."}
            {status === "success" && "Your email has been verified"}
            {status === "error" && "Verification failed"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4 text-center">
            {status === "pending" && (
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-cyan-500/10">
                <Loader2 className="h-6 w-6 animate-spin text-cyan-400" />
              </div>
            )}
            {status === "success" && (
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-green-500/10">
                <CheckCircle2 className="h-6 w-6 text-green-400" />
              </div>
            )}
            {status === "error" && (
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-red-500/10">
                <XCircle className="h-6 w-6 text-red-400" />
              </div>
            )}
            <div className="space-y-2">
              <p className={cn(
                "text-sm",
                status === "error" ? "text-red-400" : "text-slate-300"
              )}>
                {message}
              </p>
              {status === "success" && (
                <Link 
                  href="/login"
                  className="inline-block mt-4 text-sm font-medium text-primary hover:text-primary/80 transition-colors"
                >
                  Return to login →
                </Link>
              )}
              {status === "error" && (
                <Link 
                  href="/verify-email/request"
                  className="inline-block mt-4 text-sm font-medium text-primary hover:text-primary/80 transition-colors"
                >
                  Try sending the email again
                </Link>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function cn(...classes: (string | boolean | undefined)[]) {
  return classes.filter(Boolean).join(" ");
}
