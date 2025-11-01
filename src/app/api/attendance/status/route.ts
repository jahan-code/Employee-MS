import { NextResponse } from "next/server";
import { getServerAuthSession } from "@/lib/auth";
import { connectToDatabase } from "@/lib/db";
import { Attendance } from "@/models/attendance";

export async function GET() {
  try {
    const session = await getServerAuthSession();
    const role = session?.user?.role;
    const userId = session?.user?.id;
    if (!session || role !== "employee" || !userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    await connectToDatabase();
    const open = await Attendance.findOne({ user: userId, checkOut: null }).sort({ createdAt: -1 });
    if (open) {
      const elapsedMinutes = Math.max(
        0,
        Math.round((Date.now() - new Date(open.checkIn).getTime()) / 60000)
      );
      if (shouldForceCheckout(open.checkIn)) {
        const now = new Date();
        open.checkOut = now;
        open.durationMinutes = elapsedMinutes;
        await open.save();
        return NextResponse.json({ status: "checked_out", forced: true, checkOut: now });
      }
      return NextResponse.json({
        status: "checked_in",
        recordId: open._id.toString(),
        checkIn: open.checkIn,
        elapsedMinutes,
      });
    }
    return NextResponse.json({ status: "checked_out" });
  } catch {
    return NextResponse.json({ error: "Failed to load status" }, { status: 500 });
  }
}

function shouldForceCheckout(checkIn: Date) {
  const now = new Date();
  if (now.toDateString() === checkIn.toDateString()) {
    return false;
  }
  const cutoff = new Date(checkIn);
  cutoff.setHours(23, 59, 59, 999);
  return now.getTime() > cutoff.getTime();
}
