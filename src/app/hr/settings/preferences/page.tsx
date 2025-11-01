import { Metadata } from "next";
import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/ui/theme-toggle";

export const metadata: Metadata = {
  title: "Preferences",
  description: "Tune notification and appearance preferences.",
};

export default function HRPreferencesPage() {
  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h1 className="text-2xl font-semibold text-foreground">Preferences</h1>
        <p className="text-sm text-muted-foreground">
          Configure how updates, alerts, and themes work for your team.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="border-border bg-card/80 shadow-xl backdrop-blur">
          <CardHeader>
            <CardTitle>Notifications</CardTitle>
            <CardDescription>Choose which email alerts the HR team receives.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 text-sm text-muted-foreground">
            <p>Notification toggles are coming soon. For now, manage alert settings from the admin console.</p>
            <Button asChild variant="outline" size="sm" className="w-fit">
              <Link href="/hr/reports">View latest reports</Link>
            </Button>
          </CardContent>
        </Card>

        <Card className="border-border bg-card/80 shadow-xl backdrop-blur">
          <CardHeader>
            <CardTitle>Appearance</CardTitle>
            <CardDescription>Preview light and dark mode while we build per-user themes.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 text-sm text-muted-foreground">
            <p>Theme options sync to your account soon. Use the toggle to preview the current theme.</p>
            <div className="flex items-center gap-3 rounded-lg border border-border px-4 py-3">
              <ThemeToggle />
              <div>
                <p className="text-sm font-medium text-foreground">Current theme</p>
                <p className="text-xs text-muted-foreground">Switch to test readability and contrast.</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
