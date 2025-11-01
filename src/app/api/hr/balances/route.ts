import { NextResponse } from "next/server";
import { getServerAuthSession } from "@/lib/auth";
import { connectToDatabase } from "@/lib/db";
import { User } from "@/models/user";
import { Leave } from "@/models/leave";

export async function GET() {
  try {
    const session = await getServerAuthSession();
    if (!session || session.user?.role !== "hr") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    await connectToDatabase();

    const employees = (await User.find({ role: "employee" })
      .select("name email leaveQuotaAnnual leaveQuotaSick")
      .lean()) as Array<Record<string, unknown>>;

    const rows = await Promise.all(
      employees.map(async (e) => {
        const id = String((e._id as string | number | bigint | undefined) ?? "");
        const name = String((e.name as string | undefined) ?? "");
        const email = String((e.email as string | undefined) ?? "");
        const qa = (e["leaveQuotaAnnual"] as number | undefined) ?? 20;
        const qs = (e["leaveQuotaSick"] as number | undefined) ?? 10;
        const approved = (await Leave.find({ user: id, status: "approved" })
          .select("type days")
          .lean()) as Array<Record<string, unknown>>;
        const usedAnnual = approved
          .filter((r) => String(r.type ?? "") === "annual")
          .reduce((s, r) => s + (typeof r.days === "number" ? (r.days as number) : 0), 0);
        const usedSick = approved
          .filter((r) => String(r.type ?? "") === "sick")
          .reduce((s, r) => s + (typeof r.days === "number" ? (r.days as number) : 0), 0);
        return {
          id,
          name,
          email,
          quotaAnnual: qa,
          quotaSick: qs,
          usedAnnual,
          usedSick,
          remainingAnnual: Math.max(0, qa - usedAnnual),
          remainingSick: Math.max(0, qs - usedSick),
        } as const;
      })
    );

    return NextResponse.json({ employees: rows });
  } catch {
    return NextResponse.json({ error: "Failed to load balances" }, { status: 500 });
  }
}
