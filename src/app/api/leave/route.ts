import { NextResponse } from "next/server";
import { z } from "zod";
import { getServerAuthSession } from "@/lib/auth";
import { connectToDatabase } from "@/lib/db";
import { Leave } from "@/models/leave";
import { User } from "@/models/user";

const createSchema = z.object({
  type: z.enum(["annual", "sick", "unpaid", "other"]).default("annual"),
  from: z.coerce.date(),
  to: z.coerce.date(),
  reason: z.string().max(500).optional(),
});

function countDays(from: Date, to: Date) {
  const start = new Date(from);
  const end = new Date(to);
  start.setHours(0, 0, 0, 0);
  end.setHours(0, 0, 0, 0);
  return Math.max(0, Math.round((end.getTime() - start.getTime()) / 86400000) + 1);
}

export async function GET() {
  try {
    const session = await getServerAuthSession();
    const userId = session?.user?.id;
    const role = session?.user?.role;
    if (!session || !userId || role !== "employee") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    await connectToDatabase();
    const list = await Leave.find({ user: userId }).sort({ createdAt: -1 }).lean();
    const rows = (list as Array<Record<string, unknown>>).map((r) => ({
      id: String(r._id as string | number | bigint | undefined ?? ""),
      type: String(r.type ?? "annual"),
      from: r.from as Date | string,
      to: r.to as Date | string,
      days: typeof r.days === "number" ? (r.days as number) : 0,
      status: String(r.status ?? "pending"),
      reason: (r.reason as string | undefined) ?? "",
      decidedAt: (r.decidedAt as Date | string | undefined) ?? null,
      decisionNote: (r.decisionNote as string | undefined) ?? "",
    }));
    // Compute balances
    const user = (await User.findById(userId).lean()) as Record<string, unknown> | null;
    const qa = user?.["leaveQuotaAnnual"] as number | undefined;
    const qs = user?.["leaveQuotaSick"] as number | undefined;
    const quotaAnnual = typeof qa === "number" ? qa : 20;
    const quotaSick = typeof qs === "number" ? qs : 10;
    const usedAnnual = rows.filter((r) => r.status === "approved" && r.type === "annual").reduce((s, r) => s + r.days, 0);
    const usedSick = rows.filter((r) => r.status === "approved" && r.type === "sick").reduce((s, r) => s + r.days, 0);
    const remaining = {
      annual: Math.max(0, quotaAnnual - usedAnnual),
      sick: Math.max(0, quotaSick - usedSick),
      quotaAnnual,
      quotaSick,
      usedAnnual,
      usedSick,
    };
    return NextResponse.json({ leaves: rows, remaining });
  } catch {
    return NextResponse.json({ error: "Failed to load leaves" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await getServerAuthSession();
    const userId = session?.user?.id;
    const role = session?.user?.role;
    if (!session || !userId || role !== "employee") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    await connectToDatabase();
    const json = await req.json();
    const parsed = createSchema.safeParse(json);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid input" }, { status: 400 });
    }
    const from = new Date(parsed.data.from);
    const to = new Date(parsed.data.to);
    const days = countDays(from, to);

    // Enforce balance for annual/sick
    if (parsed.data.type === "annual" || parsed.data.type === "sick") {
      const existing = await Leave.find({ user: userId, status: "approved", type: parsed.data.type }).lean();
      const used = (existing as Array<Record<string, unknown>>).reduce((s, r) => s + (typeof r.days === "number" ? (r.days as number) : 0), 0);
      const user = (await User.findById(userId).lean()) as Record<string, unknown> | null;
      const qa = user?.["leaveQuotaAnnual"] as number | undefined;
      const qs = user?.["leaveQuotaSick"] as number | undefined;
      const quota = parsed.data.type === "annual" ? (typeof qa === "number" ? qa : 20) : (typeof qs === "number" ? qs : 10);
      const remaining = Math.max(0, quota - used);
      if (days > remaining) {
        return NextResponse.json({ error: "Insufficient leave balance" }, { status: 400 });
      }
    }

    const doc = await Leave.create({
      user: userId,
      type: parsed.data.type,
      from,
      to,
      days,
      reason: parsed.data.reason,
      status: "pending",
    });
    return NextResponse.json({ ok: true, id: doc._id.toString() });
  } catch {
    return NextResponse.json({ error: "Failed to submit" }, { status: 500 });
  }
}
