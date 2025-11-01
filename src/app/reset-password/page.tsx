import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import ResetPasswordForm from "@/components/auth/reset-password-form";
import Link from "next/link";

export default async function ResetPasswordPage(props: { searchParams: Promise<{ token?: string }> }) {
  const sp = await props.searchParams;
  const token = sp?.token ?? "";
  return (
    <div className="flex min-h-screen items-center justify-center bg-linear-to-br from-background via-background to-background p-6 text-foreground">
      <Card className="w-full max-w-md border-border bg-card/80 backdrop-blur-xl shadow-2xl">
        <CardHeader className="space-y-1 pb-6">
          <div className="mb-2 flex items-center gap-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
              <svg className="h-6 w-6 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </div>
            <span className="text-xl font-semibold">Employee MS</span>
          </div>
          <CardTitle className="text-2xl font-bold">Set new password</CardTitle>
          <CardDescription className="text-muted-foreground">
            Choose a strong password for your account
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <ResetPasswordForm token={token} />
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
