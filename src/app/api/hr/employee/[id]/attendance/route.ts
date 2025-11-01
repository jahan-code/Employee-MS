import { NextRequest, NextResponse } from "next/server";
import { getServerAuthSession } from "@/lib/auth";
import { connectToDatabase } from "@/lib/db";
import { Attendance } from "@/models/attendance";

function startOfDay(d: Date) {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

function endOfDay(d: Date) {
  const x = new Date(d);
  x.setHours(23, 59, 59, 999);
  return x;
}

export async function GET(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerAuthSession();
    if (!session || session.user?.role !== "hr") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    await connectToDatabase();

    const url = new URL(req.url);
    const fromStr = url.searchParams.get("from");
    const toStr = url.searchParams.get("to");
    const from = fromStr ? startOfDay(new Date(fromStr)) : startOfDay(new Date());
    const to = toStr ? endOfDay(new Date(toStr)) : endOfDay(new Date());

    const { id } = await context.params;

    const list = await Attendance.find({
      user: id,
      createdAt: { $gte: from, $lte: to },
    })
      .sort({ createdAt: -1 })
      .lean();

    const rows = (list as Array<Record<string, unknown>>).map((r) => ({
      id: String(r._id as string | number | bigint | undefined ?? ""),
      checkIn: r.checkIn as Date | string,
      checkOut: (r.checkOut as Date | string | null | undefined) ?? null,
      durationMinutes: typeof r.durationMinutes === "number" ? (r.durationMinutes as number) : null,
      createdAt: r.createdAt as Date | string,
    }));

    return NextResponse.json({ attendance: rows });
  } catch {
    return NextResponse.json({ error: "Failed to load attendance" }, { status: 500 });
  }
}
