import { redirect } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { LoginForm } from "@/components/auth/login-form";
import { getServerAuthSession } from "@/lib/auth";

export default async function LoginPage() {
  const session = await getServerAuthSession();

  if (session) {
    redirect("/");
  }

  return (
    <div className="flex min-h-screen bg-linear-to-br from-background via-background to-background text-foreground">
      {/* Left side - Branding */}
      <div className="hidden lg:flex lg:w-1/2 lg:flex-col lg:justify-center lg:px-12 xl:px-20">
        <div className="space-y-6">
          <div className="space-y-2">
            <h1 className="text-4xl font-bold tracking-tight xl:text-5xl">
              Employee Management
            </h1>
            <p className="text-lg text-muted-foreground">
              Streamline attendance, leave, and workforce management
            </p>
          </div>
          <div className="space-y-4 text-muted-foreground">
            <div className="flex items-start gap-3">
              <div className="mt-1 flex h-6 w-6 items-center justify-center rounded-full bg-primary/10 text-primary">
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <div>
                <p className="font-medium text-foreground">Real-time Attendance Tracking</p>
                <p className="text-sm text-muted-foreground">Monitor employee check-ins and work hours</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="mt-1 flex h-6 w-6 items-center justify-center rounded-full bg-primary/10 text-primary">
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <div>
                <p className="font-medium text-foreground">Leave Management</p>
                <p className="text-sm text-muted-foreground">Handle leave requests and balance tracking</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="mt-1 flex h-6 w-6 items-center justify-center rounded-full bg-primary/10 text-primary">
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <div>
                <p className="font-medium text-foreground">Comprehensive Reports</p>
                <p className="text-sm text-muted-foreground">Generate detailed analytics and insights</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Right side - Login Form */}
      <div className="flex w-full items-center justify-center p-6 lg:w-1/2 lg:p-12">
        <Card className="w-full max-w-md border-border bg-card/80 backdrop-blur-xl shadow-2xl">
          <CardHeader className="space-y-1 pb-6">
            <div className="mb-2 flex items-center gap-2">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                <svg className="h-6 w-6 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </div>
              <span className="text-xl font-semibold">Employee MS</span>
            </div>
            <CardTitle className="text-2xl font-bold">Welcome back</CardTitle>
            <CardDescription className="text-muted-foreground">
              Enter your credentials to access your account
            </CardDescription>
          </CardHeader>
          <CardContent>
            <LoginForm />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
