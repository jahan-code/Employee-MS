import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { SetPasskeyForm } from "@/components/auth/set-passkey-form";

export default async function SetPasskeyPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  await searchParams;

  return (
    <div className="flex min-h-screen items-center justify-center bg-linear-to-br from-slate-950 via-slate-900 to-slate-950 p-4 text-white">
      <Card className="w-full max-w-md border-slate-800 bg-slate-900/60 backdrop-blur">
        <CardHeader>
          <CardTitle className="text-2xl font-semibold">Set your passkey</CardTitle>
          <CardDescription className="text-slate-400">
            Enter the passkey provided by HR to complete your account setup.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <SetPasskeyForm />
        </CardContent>
      </Card>
    </div>
  );
}
