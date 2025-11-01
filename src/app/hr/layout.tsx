import { redirect } from "next/navigation";
import { AppShell } from "@/components/ui/app-shell";
import { getServerAuthSession } from "@/lib/auth";
import { LayoutPanelTop, BarChart3, PiggyBank, Settings2, Building2 } from "lucide-react";

export default async function HRLayout({ children }: { children: React.ReactNode }) {
  const session = await getServerAuthSession();
  if (!session) redirect("/login");
  if (session.user?.role !== "hr") redirect("/");

  return (
    <AppShell
      nav={[
        { href: "/hr", label: "Overview", icon: <LayoutPanelTop className="h-4 w-4" /> },
        { href: "/hr/reports", label: "Reports", icon: <BarChart3 className="h-4 w-4" /> },
        { href: "/hr/balances", label: "Balances", icon: <PiggyBank className="h-4 w-4" /> },
      ]}
      title="HR Portal"
      subtitle=""
      breadcrumbs={[]}
      companyName={session.user?.companyName}
      settingsNav={[
        { href: "/hr/settings/company", label: "Company profile", icon: <Building2 className="h-4 w-4" /> },
        { href: "/hr/settings/preferences", label: "Preferences", icon: <Settings2 className="h-4 w-4" /> },
      ]}
    >
      {children}
    </AppShell>
  );
}
