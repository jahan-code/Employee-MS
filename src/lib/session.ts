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

  if (session.user.role !== role) {
    if (session.user.role === "hr") {
      redirect("/hr");
    }

    redirect("/employee");
  }

  return session;
}
