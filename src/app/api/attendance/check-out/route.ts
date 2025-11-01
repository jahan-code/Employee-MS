import { NextResponse } from "next/server";
import { getServerAuthSession } from "@/lib/auth";
import { connectToDatabase } from "@/lib/db";
import { Attendance } from "@/models/attendance";

export async function POST() {
  const session = await getServerAuthSession();
  const user = session?.user;
  if (!session || !user || user.role !== "employee") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const userId = user.id;
  await connectToDatabase();
  const open = await Attendance.findOne({ user: userId, checkOut: null }).sort({ createdAt: 1 });
  if (!open) {
    return NextResponse.json({ error: "Not checked in" }, { status: 400 });
  }
  const segmentStart = open.activeSince ?? open.checkIn;
  if (!segmentStart) {
    return NextResponse.json({ error: "Not checked in" }, { status: 400 });
  }
  const now = new Date();
  const segmentMinutes = Math.max(0, Math.round((now.getTime() - new Date(segmentStart).getTime()) / 60000));
  open.durationMinutes = (open.durationMinutes ?? 0) + segmentMinutes;
  open.set("activeSince", null);
  open.checkOut = now;
  await open.save();
  return NextResponse.json({
    ok: true,
    recordId: open._id.toString(),
    checkOut: open.checkOut,
    durationMinutes: open.durationMinutes,
    segmentMinutes,
  });
}
