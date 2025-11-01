import { NextRequest, NextResponse } from "next/server";
import { Types } from "mongoose";
import { z } from "zod";
import { getServerAuthSession } from "@/lib/auth";
import { connectToDatabase } from "@/lib/db";
import { Leave } from "@/models/leave";

const schema = z.object({
  status: z.enum(["approved", "denied"]),
  decisionNote: z.string().max(500).optional(),
});

export async function PUT(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerAuthSession();
    const userId = session?.user?.id;
    if (!session || session.user?.role !== "hr" || !userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    await connectToDatabase();
    const json = await req.json();
    const parsed = schema.safeParse(json);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid input" }, { status: 400 });
    }
    const { id } = await context.params;
    const leave = await Leave.findById(id);
    if (!leave) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    leave.status = parsed.data.status;
    leave.decidedBy = new Types.ObjectId(userId);
    leave.decidedAt = new Date();
    leave.decisionNote = parsed.data.decisionNote;
    await leave.save();
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Failed to update" }, { status: 500 });
  }
}
