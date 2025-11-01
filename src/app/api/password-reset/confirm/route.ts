import { NextResponse } from "next/server";
import { z } from "zod";
import { connectToDatabase } from "@/lib/db";
import { User } from "@/models/user";
import { verifyActionToken } from "@/lib/tokens";
import { hashPassword } from "@/lib/password";

const schema = z.object({ token: z.string().min(1), password: z.string().min(6).max(128) });

export async function POST(req: Request) {
  try {
    const json = await req.json();
    const parsed = schema.safeParse(json);
    if (!parsed.success) return NextResponse.json({ error: "Invalid input" }, { status: 400 });

    const payload = verifyActionToken(parsed.data.token);
    if (!payload || payload.action !== "password-reset") {
      return NextResponse.json({ error: "Invalid or expired token" }, { status: 400 });
    }

    await connectToDatabase();
    const user = await User.findById(payload.uid);
    if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

    user.passwordHash = await hashPassword(parsed.data.password);
    await user.save();

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Failed to reset" }, { status: 500 });
  }
}
