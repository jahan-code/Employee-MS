import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getServerAuthSession } from "@/lib/auth";
import { connectToDatabase } from "@/lib/db";
import { Attendance } from "@/models/attendance";
import { AuditLog } from "@/models/audit-log";

const schema = z.object({
  checkIn: z.string().datetime().or(z.date()).optional(),
  checkOut: z.string().datetime().or(z.date()).nullable().optional(),
  reason: z.string().max(500).optional(),
});

export async function PUT(req: NextRequest, context: { params: Promise<{ recordId: string }> }) {
  try {
    const session = await getServerAuthSession();
    const user = session?.user;
    if (!session || !user || user.role !== "hr") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectToDatabase();

    const payload = await req.json();
    const parsed = schema.safeParse(payload);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid input" }, { status: 400 });
    }

    const { recordId } = await context.params;

    const rec = await Attendance.findById(recordId);
    if (!rec) {
      return NextResponse.json({ error: "Record not found" }, { status: 404 });
    }

    const before = {
      checkIn: rec.checkIn,
      checkOut: rec.checkOut,
      durationMinutes: rec.durationMinutes,
    };

    const { checkIn, checkOut, reason } = parsed.data;

    if (checkIn !== undefined) {
      rec.checkIn = checkIn instanceof Date ? checkIn : new Date(checkIn);
    }
    if (checkOut !== undefined) {
      if (checkOut === null) {
        rec.set("checkOut", null);
      } else {
        rec.checkOut = checkOut instanceof Date ? checkOut : new Date(checkOut);
      }
    }

    // Recalculate duration if both ends present
    if (rec.checkOut && rec.checkIn) {
      rec.durationMinutes = Math.max(0, Math.round((rec.checkOut.getTime() - rec.checkIn.getTime()) / 60000));
    } else if (!rec.checkOut) {
      rec.set("durationMinutes", null);
    }

    await rec.save();

    const after = {
      checkIn: rec.checkIn,
      checkOut: rec.checkOut,
      durationMinutes: rec.durationMinutes,
    };

    await AuditLog.create({
      actor: user.id,
      action: "attendance.update",
      entityType: "Attendance",
      entityId: rec._id.toString(),
      changes: { before, after },
      reason: reason ?? undefined,
    });

    return NextResponse.json({ ok: true, record: after });
  } catch {
    return NextResponse.json({ error: "Failed to update" }, { status: 500 });
  }
}
