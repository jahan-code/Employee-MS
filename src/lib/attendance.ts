import { connectToDatabase } from "@/lib/db";
import { Attendance } from "@/models/attendance";
import { User } from "@/models/user";

function toISOString(value: Date | null | undefined) {
  return value ? value.toISOString() : null;
}

export async function getEmployeeAttendance(userId: string) {
  await connectToDatabase();

  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);

  const [activeDoc, historyDocs, todayDocs] = await Promise.all([
    Attendance.findOne({ user: userId, checkOut: null }).sort({ checkIn: -1 }),
    Attendance.find({ user: userId }).sort({ checkIn: -1 }).limit(10),
    Attendance.find({ user: userId, checkIn: { $gte: startOfToday } }),
  ]);

  const history = historyDocs.map((doc) => ({
    id: doc._id.toString(),
    checkIn: doc.checkIn.toISOString(),
    checkOut: toISOString(doc.checkOut ?? null),
    durationMinutes: doc.durationMinutes ?? null,
  }));

  const activeRecord = activeDoc
    ? {
        id: activeDoc._id.toString(),
        checkIn: activeDoc.checkIn.toISOString(),
      }
    : null;

  let todayMinutes = todayDocs.reduce(
    (total, doc) => total + (doc.durationMinutes ?? 0),
    0
  );

  if (activeDoc && activeDoc.checkIn >= startOfToday) {
    const diffMs = Date.now() - activeDoc.checkIn.getTime();
    const diffMinutes = Math.max(0, Math.floor(diffMs / 60000));
    todayMinutes += diffMinutes;
  }

  return {
    activeRecord,
    history,
    todayMinutes,
  } as const;
}

type SummaryAccumulator = {
  totalMinutes: number;
  lastCheckIn: Date | null;
  lastCheckOut: Date | null;
  activeCheckIn: Date | null;
};

function ensureAccumulator(map: Map<string, SummaryAccumulator>, userId: string) {
  if (!map.has(userId)) {
    map.set(userId, {
      totalMinutes: 0,
      lastCheckIn: null,
      lastCheckOut: null,
      activeCheckIn: null,
    });
  }

  return map.get(userId)!;
}

export async function getHRDashboardData() {
  await connectToDatabase();

  const [employees, attendanceDocs] = await Promise.all([
    User.find({ role: "employee" }),
    Attendance.find({}),
  ]);

  const summaryMap = new Map<string, SummaryAccumulator>();

  attendanceDocs.forEach((doc) => {
    const userId = doc.user.toString();
    const accumulator = ensureAccumulator(summaryMap, userId);

    if (!accumulator.lastCheckIn || doc.checkIn > accumulator.lastCheckIn) {
      accumulator.lastCheckIn = doc.checkIn;
    }

    if (doc.checkOut) {
      if (!accumulator.lastCheckOut || doc.checkOut > accumulator.lastCheckOut) {
        accumulator.lastCheckOut = doc.checkOut;
      }
      accumulator.totalMinutes += doc.durationMinutes ?? 0;
    } else {
      accumulator.activeCheckIn = doc.checkIn;
    }
  });

  return employees.map((employee) => {
    const userId = employee._id.toString();
    const summary = summaryMap.get(userId) ?? {
      totalMinutes: 0,
      lastCheckIn: null,
      lastCheckOut: null,
      activeCheckIn: null,
    };

    return {
      id: userId,
      name: employee.name,
      email: employee.email,
      totalMinutes: summary.totalMinutes,
      lastCheckIn: toISOString(summary.lastCheckIn),
      lastCheckOut: toISOString(summary.lastCheckOut),
      isActive: Boolean(summary.activeCheckIn),
      activeSince: toISOString(summary.activeCheckIn),
    };
  });
}
