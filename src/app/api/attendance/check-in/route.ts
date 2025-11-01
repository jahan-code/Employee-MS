import { NextResponse } from "next/server";
import { getServerAuthSession } from "@/lib/auth";
import { connectToDatabase } from "@/lib/db";
import { Attendance } from "@/models/attendance";

export async function POST(request: Request) {
  try {
    const session = await getServerAuthSession();
    const role = session?.user?.role;
    const userId = session?.user?.id;
    if (!session || role !== "employee" || !userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const body = await request.json().catch(() => null);
    const officeStart = typeof body?.officeStart === "string" ? body.officeStart.trim() : "";
    const officeEnd = typeof body?.officeEnd === "string" ? body.officeEnd.trim() : "";

    const now = new Date();
    const startOfDay = new Date(now);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(startOfDay);
    endOfDay.setDate(endOfDay.getDate() + 1);

    await connectToDatabase();

    if (officeStart && officeEnd && isValidTime(officeStart) && isValidTime(officeEnd)) {
      if (!isWithinOfficeHours(officeStart, officeEnd, now)) {
        return NextResponse.json({ error: "Check-in is only allowed during office hours" }, { status: 400 });
      }
    }

    const todayRecord = await Attendance.findOne({
      user: userId,
      checkIn: { $gte: startOfDay, $lt: endOfDay },
    }).sort({ checkIn: 1 });

    if (todayRecord) {
      if (todayRecord.activeSince) {
        return NextResponse.json({ error: "Already checked in" }, { status: 400 });
      }
      todayRecord.activeSince = now;
      todayRecord.set("checkOut", null);
      await todayRecord.save();
      return NextResponse.json({
        ok: true,
        recordId: todayRecord._id.toString(),
        segmentStart: todayRecord.activeSince,
        firstCheckIn: todayRecord.checkIn,
        resumed: true,
      });
    }

    const doc = await Attendance.create({
      user: userId,
      checkIn: now,
      activeSince: now,
      durationMinutes: 0,
      checkOut: null,
    });
    return NextResponse.json({
      ok: true,
      recordId: doc._id.toString(),
      segmentStart: doc.activeSince,
      firstCheckIn: doc.checkIn,
    });
  } catch {
    return NextResponse.json({ error: "Check-in failed" }, { status: 500 });
  }
}

function isValidTime(value: string) {
  return /^([01]\d|2[0-3]):[0-5]\d$/.test(value);
}

function timeStringToMinutes(value: string) {
  const [hh, mm] = value.split(":").map(Number);
  return hh * 60 + mm;
}

function isWithinOfficeHours(start: string, end: string, current: Date) {
  if (!isValidTime(start) || !isValidTime(end) || start >= end) return true;
  const minutes = current.getHours() * 60 + current.getMinutes();
  return minutes >= timeStringToMinutes(start) && minutes <= timeStringToMinutes(end);
}
