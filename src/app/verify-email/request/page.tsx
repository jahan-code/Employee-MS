import VerifyRequestForm from "@/components/auth/verify-request-form";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";

export default function VerifyEmailRequestPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-linear-to-br from-background via-background to-background p-6 text-foreground">
      <Card className="w-full max-w-md border-border bg-card/80 backdrop-blur-xl shadow-2xl">
        <CardHeader className="space-y-1 pb-6">
          <div className="mb-2 flex items-center gap-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
              <svg className="h-6 w-6 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8m-2 8h-2a2 2 0 01-2-2V8m-4 4h4" />
              </svg>
            </div>
            <span className="text-xl font-semibold">Employee MS</span>
          </div>
          <CardTitle className="text-2xl font-bold">Send a new verification link</CardTitle>
          <CardDescription className="text-muted-foreground">
            Confirm your email address so we can activate your account.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <VerifyRequestForm />
          <div className="text-center">
            <Link href="/login" className="text-sm text-primary hover:text-primary/80 transition-colors">
              ← Back to login
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
