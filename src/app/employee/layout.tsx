import { redirect } from "next/navigation";
import { AppShell } from "@/components/ui/app-shell";
import { getServerAuthSession } from "@/lib/auth";
import { LayoutDashboard, PlaneTakeoff } from "lucide-react";

export default async function EmployeeLayout({ children }: { children: React.ReactNode }) {
  const session = await getServerAuthSession();
  if (!session) redirect("/login");
  if (session.user?.role !== "employee") redirect("/");

  return (
    <AppShell
      nav={[
        { href: "/employee", label: "Dashboard", icon: <LayoutDashboard className="h-4 w-4" /> },
        { href: "/employee/leave", label: "Leave", icon: <PlaneTakeoff className="h-4 w-4" /> },
      ]}
      title="Employee Portal"
      subtitle=""
      breadcrumbs={[]}
    >
      {children}
    </AppShell>
  );
}
