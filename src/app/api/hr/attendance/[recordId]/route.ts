import { NextResponse } from "next/server";
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

export async function PUT(req: Request, { params }: { params: { recordId: string } }) {
  try {
    const session = await getServerAuthSession();
    if (!session || session.user.role !== "hr") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectToDatabase();

    const payload = await req.json();
    const parsed = schema.safeParse(payload);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid input" }, { status: 400 });
    }

    const rec = await Attendance.findById(params.recordId);
    if (!rec) {
      return NextResponse.json({ error: "Record not found" }, { status: 404 });
    }

    const before = {
      checkIn: rec.checkIn,
      checkOut: rec.checkOut,
      durationMinutes: rec.durationMinutes,
    };

    if (parsed.data.checkIn !== undefined) {
      rec.checkIn = new Date(parsed.data.checkIn as any);
    }
    if (parsed.data.checkOut !== undefined) {
      rec.checkOut = parsed.data.checkOut === null ? null : new Date(parsed.data.checkOut as any);
    }

    // Recalculate duration if both ends present
    if (rec.checkOut && rec.checkIn) {
      rec.durationMinutes = Math.max(0, Math.round((rec.checkOut.getTime() - rec.checkIn.getTime()) / 60000));
    } else if (!rec.checkOut) {
      rec.durationMinutes = null;
    }

    await rec.save();

    const after = {
      checkIn: rec.checkIn,
      checkOut: rec.checkOut,
      durationMinutes: rec.durationMinutes,
    };

    await AuditLog.create({
      actor: session.user.id,
      action: "attendance.update",
      entityType: "Attendance",
      entityId: rec._id.toString(),
      changes: { before, after },
      reason: parsed.data.reason ?? undefined,
    });

    return NextResponse.json({ ok: true, record: after });
  } catch (e) {
    return NextResponse.json({ error: "Failed to update" }, { status: 500 });
  }
}
