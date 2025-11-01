import { redirect } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { SignupForm } from "@/components/auth/signup-form";
import { getServerAuthSession } from "@/lib/auth";

export default async function SignupPage() {
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
              Join Our Team
            </h1>
            <p className="text-lg text-muted-foreground">
              Start managing your work efficiently with our platform
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
                <p className="font-medium text-foreground">Quick Setup</p>
                <p className="text-sm text-muted-foreground">Get started in less than 2 minutes</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="mt-1 flex h-6 w-6 items-center justify-center rounded-full bg-primary/10 text-primary">
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <div>
                <p className="font-medium text-foreground">Secure Access</p>
                <p className="text-sm text-muted-foreground">Your data is encrypted and protected</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="mt-1 flex h-6 w-6 items-center justify-center rounded-full bg-primary/10 text-primary">
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <div>
                <p className="font-medium text-foreground">24/7 Support</p>
                <p className="text-sm text-muted-foreground">We&apos;re here to help whenever you need</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Right side - Signup Form */}
      <div className="flex w-full items-center justify-center p-6 lg:w-1/2 lg:p-12">
        <Card className="w-full max-w-md border-border bg-card/80 backdrop-blur-xl shadow-2xl">
          <CardHeader className="space-y-1 pb-6">
            <div className="mb-2 flex items-center gap-2">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                <svg className="h-6 w-6 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                </svg>
              </div>
              <span className="text-xl font-semibold">Employee MS</span>
            </div>
            <CardTitle className="text-2xl font-bold">Create your account</CardTitle>
            <CardDescription className="text-muted-foreground">
              Enter your details to get started
            </CardDescription>
          </CardHeader>
          <CardContent>
            <SignupForm />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
