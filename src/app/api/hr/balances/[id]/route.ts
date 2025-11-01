import { NextResponse } from "next/server";
import { z } from "zod";
import { getServerAuthSession } from "@/lib/auth";
import { connectToDatabase } from "@/lib/db";
import { User } from "@/models/user";

const schema = z.object({ quotaAnnual: z.number().min(0).max(365), quotaSick: z.number().min(0).max(365) });

export async function PUT(req: Request, { params }: { params: { id: string } }) {
  try {
    const session = await getServerAuthSession();
    if (!session || session.user?.role !== "hr") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    await connectToDatabase();
    const json = await req.json();
    const parsed = schema.safeParse(json);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid input" }, { status: 400 });
    }
    const user = await User.findById(params.id);
    if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });
    user.leaveQuotaAnnual = parsed.data.quotaAnnual;
    user.leaveQuotaSick = parsed.data.quotaSick;
    await user.save();
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Failed to update" }, { status: 500 });
  }
}
