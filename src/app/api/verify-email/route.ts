import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";
import { User } from "@/models/user";
import { verifyActionToken, signActionToken } from "@/lib/tokens";
import { getServerAuthSession } from "@/lib/auth";
import { sendMail } from "@/lib/mailer";

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const token = url.searchParams.get("token");
    if (!token) return NextResponse.json({ error: "Missing token" }, { status: 400 });
    const payload = verifyActionToken(token);
    if (!payload || payload.action !== "verify-email") {
      return NextResponse.json({ error: "Invalid or expired token" }, { status: 400 });
    }
    await connectToDatabase();
    const user = await User.findById(payload.uid);
    if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });
    if (!user.emailVerified) {
      user.emailVerified = true;
      await user.save();
    }
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Failed to verify" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await getServerAuthSession();
    const userId = session?.user?.id;
    const role = session?.user?.role;
    if (!session || !userId || role !== "employee") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    await connectToDatabase();
    const user = await User.findById(userId);
    if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });
    if (user.emailVerified) return NextResponse.json({ ok: true, already: true });

    const token = signActionToken({ uid: user._id.toString(), action: "verify-email", exp: Math.floor(Date.now() / 1000) + 60 * 60 * 24 });
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? new URL(req.url).origin;
    const link = `${baseUrl}/verify-email?token=${encodeURIComponent(token)}`;
    try {
      await sendMail({
        to: user.email,
        subject: "Verify your email",
        html: `<p>Hello ${user.name},</p><p>Please verify your email by clicking the link below:</p><p><a href="${link}">Verify Email</a></p>`,
      });
    } catch {}
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Failed to send" }, { status: 500 });
  }
}
