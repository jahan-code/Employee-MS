import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import ForgotPasswordForm from "@/components/auth/forgot-password-form";
import Link from "next/link";

export default function ForgotPasswordPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-linear-to-br from-background via-background to-background p-6 text-foreground">
      <Card className="w-full max-w-md border-border bg-card/80 backdrop-blur-xl shadow-2xl">
        <CardHeader className="space-y-1 pb-6">
          <div className="mb-2 flex items-center gap-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
              <svg className="h-6 w-6 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
              </svg>
            </div>
            <span className="text-xl font-semibold">Employee MS</span>
          </div>
          <CardTitle className="text-2xl font-bold">Reset your password</CardTitle>
          <CardDescription className="text-muted-foreground">
            Enter your email and we&apos;ll send you a reset link
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <ForgotPasswordForm />
          <div className="text-center">
            <Link 
              href="/login" 
              className="text-sm text-primary hover:text-primary/80 transition-colors"
            >
              ← Back to login
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
