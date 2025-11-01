import { redirect } from "next/navigation";
import { getServerAuthSession } from "@/lib/auth";

export async function requireAuth() {
  const session = await getServerAuthSession();

  if (!session || !session.user?.id) {
    redirect("/login");
  }

  return session;
}

export async function requireRole(role: "employee" | "hr") {
  const session = await requireAuth();
  const userRole = session.user?.role ?? "employee";

  if (userRole !== role) {
    if (userRole === "hr") {
      redirect("/hr");
    }

    redirect("/employee");
  }

  return session;
}
