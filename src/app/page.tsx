import { redirect } from "next/navigation";
import { getServerAuthSession } from "@/lib/auth";

export default async function Home() {
  const session = await getServerAuthSession();

  if (!session) {
    redirect("/login");
  }

  if (session.user.role === "hr") {
    redirect("/hr");
  }

  redirect("/employee");
}
