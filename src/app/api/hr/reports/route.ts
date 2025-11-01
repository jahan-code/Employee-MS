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
    if (!session || session.user?.role !== "hr") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectToDatabase();

    const url = new URL(req.url);
    const fromStr = url.searchParams.get("from");
    const toStr = url.searchParams.get("to");
    const format = url.searchParams.get("format");

    const now = new Date();
    const from = fromStr ? startOfDay(new Date(fromStr)) : startOfDay(now);
    const to = toStr ? endOfDay(new Date(toStr)) : endOfDay(now);

    const employees = (await User.find({ role: "employee" })
      .select("name email")
      .lean()) as Array<Record<string, unknown>>;

    const rows = await Promise.all(
      employees.map(async (emp) => {
        const empId = String(emp._id as string | number | bigint | undefined ?? "");
        const name = String((emp.name as string | undefined) ?? "");
        const email = String((emp.email as string | undefined) ?? "");
        const list = (await Attendance.find({ user: empId, createdAt: { $gte: from, $lte: to } })
          .select("durationMinutes")
          .lean()) as Array<Record<string, unknown>>;
        const minutes = list.reduce((s, r) => s + (typeof r.durationMinutes === "number" ? (r.durationMinutes as number) : 0), 0);
        const sessions = list.length;
        return { id: empId, name, email, minutes, sessions } as const;
      })
    );

    // Sort by minutes desc
    rows.sort((a, b) => b.minutes - a.minutes);

    if (format === "csv") {
      const header = ["Name", "Email", "Sessions", "Minutes"].join(",");
      const lines = rows.map((r) => [escapeCsv(r.name), escapeCsv(r.email), String(r.sessions), String(r.minutes)].join(","));
      const body = [header, ...lines].join("\n");
      return new NextResponse(body, {
        status: 200,
        headers: {
          "Content-Type": "text/csv; charset=utf-8",
          "Content-Disposition": `attachment; filename=hr-report-${from.toISOString().slice(0,10)}_to_${to.toISOString().slice(0,10)}.csv`,
        },
      });
    }

    const totalMinutes = rows.reduce((s, r) => s + r.minutes, 0);
    const totalSessions = rows.reduce((s, r) => s + r.sessions, 0);
    return NextResponse.json({ rows, from, to, totals: { minutes: totalMinutes, sessions: totalSessions } });
  } catch {
    return NextResponse.json({ error: "Failed to build report" }, { status: 500 });
  }
}

function escapeCsv(s: string) {
  if (/[",\n]/.test(s)) return '"' + s.replace(/"/g, '""') + '"';
  return s;
}
