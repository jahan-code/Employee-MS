import { NextResponse } from "next/server";
import { getServerAuthSession } from "@/lib/auth";
import { connectToDatabase } from "@/lib/db";
import { User } from "@/models/user";
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

export async function GET(req: Request) {
  try {
    const session = await getServerAuthSession();
    const role = session?.user?.role;
    if (!session || role !== "hr") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectToDatabase();

    const employeesRaw = (await User.find({ role: "employee" })
      .select("name email")
      .lean()) as Array<Record<string, unknown>>;
    const url = new URL(req.url);
    const fromStr = url.searchParams.get("from");
    const toStr = url.searchParams.get("to");
    const format = url.searchParams.get("format");

    const now = new Date();
    const from = fromStr ? startOfDay(new Date(fromStr)) : startOfDay(now);
    const to = toStr ? endOfDay(new Date(toStr)) : endOfDay(now);

    const results = await Promise.all(
      employeesRaw.map(async (emp) => {
        const empId = String(emp._id as string | number | bigint | undefined ?? "");
        const name = String((emp.name as string | undefined) ?? "");
        const email = String((emp.email as string | undefined) ?? "");
        const openRaw = (await Attendance.findOne({ user: empId, checkOut: null })
          .sort({ createdAt: -1 })
          .lean()) as Record<string, unknown> | null;
        const rangeRecords = (await Attendance.find({ user: empId, createdAt: { $gte: from, $lte: to } })
          .select("checkIn checkOut durationMinutes")
          .lean()) as Array<Record<string, unknown>>;

        const closedMinutes = rangeRecords
          .map((r) => (typeof r.durationMinutes === "number" ? r.durationMinutes : 0))
          .reduce((sum, m) => sum + m, 0);

        let ongoingMinutes = 0;
        const toIsToday = startOfDay(to).getTime() === startOfDay(now).getTime();
        if (openRaw && toIsToday) {
          const ci = openRaw.checkIn as unknown;
          const checkInMs = typeof ci === "string" || ci instanceof Date ? new Date(ci).getTime() : NaN;
          if (!Number.isNaN(checkInMs)) {
            ongoingMinutes = Math.max(0, Math.round((Date.now() - checkInMs) / 60000));
          }
        }

        return {
          id: empId,
          name,
          email,
          status: openRaw ? "checked_in" : "checked_out",
          checkIn: openRaw ? (openRaw.checkIn as unknown as Date | string | null) : null,
          minutes: closedMinutes + ongoingMinutes,
        } as const;
      })
    );

    if (format === "csv") {
      const header = ["Name", "Email", "Status", "CheckIn", "Minutes"].join(",");
      const lines = results.map((r) =>
        [
          escapeCsv(r.name),
          escapeCsv(r.email),
          r.status,
          r.checkIn ? new Date(r.checkIn as Date | string).toISOString() : "",
          String(r.minutes),
        ].join(",")
      );
      const body = [header, ...lines].join("\n");
      return new NextResponse(body, {
        status: 200,
        headers: {
          "Content-Type": "text/csv; charset=utf-8",
          "Content-Disposition": `attachment; filename=overview-${from.toISOString().slice(0,10)}_to_${to.toISOString().slice(0,10)}.csv`,
        },
      });
    }

    return NextResponse.json({ employees: results, from, to });
  } catch {
    return NextResponse.json({ error: "Failed to load overview" }, { status: 500 });
  }
}

function escapeCsv(s: string) {
  if (/[",\n]/.test(s)) {
    return '"' + s.replace(/"/g, '""') + '"';
  }
  return s;
}
