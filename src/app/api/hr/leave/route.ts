import { NextResponse } from "next/server";
import { getServerAuthSession } from "@/lib/auth";
import { connectToDatabase } from "@/lib/db";
import { Leave } from "@/models/leave";

export async function GET() {
  try {
    const session = await getServerAuthSession();
    if (!session || session.user?.role !== "hr") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    await connectToDatabase();
    const list = (await Leave.find()
      .sort({ createdAt: -1 })
      .populate({ path: "user", select: "name email", options: { lean: true } })
      .lean()) as Array<Record<string, unknown>>;
    const rows = list.map((r) => {
      const u = r.user as Record<string, unknown> | undefined;
      return {
      id: String(r._id as string | number | bigint | undefined ?? ""),
      user: String((u?._id as string | number | bigint | undefined) ?? ""),
      userName: String((u?.name as string | undefined) ?? ""),
      userEmail: String((u?.email as string | undefined) ?? ""),
      type: String(r.type ?? "annual"),
      from: r.from as Date | string,
      to: r.to as Date | string,
      days: typeof r.days === "number" ? (r.days as number) : 0,
      status: String(r.status ?? "pending"),
      reason: (r.reason as string | undefined) ?? "",
      decidedBy: (r.decidedBy as string | undefined) ?? "",
      decidedAt: (r.decidedAt as Date | string | undefined) ?? null,
      decisionNote: (r.decisionNote as string | undefined) ?? "",
      createdAt: r.createdAt as Date | string,
    }});
    return NextResponse.json({ leaves: rows });
  } catch {
    return NextResponse.json({ error: "Failed to load" }, { status: 500 });
  }
}
