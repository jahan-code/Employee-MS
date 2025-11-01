import { NextResponse } from "next/server";
import { z } from "zod";
import { connectToDatabase } from "@/lib/db";
import { User } from "@/models/user";
import { signActionToken } from "@/lib/tokens";
import { sendMail } from "@/lib/mailer";
import { getClientKey, rateLimit } from "@/lib/rate-limit";

const schema = z.object({ email: z.string().email() });

export async function POST(req: Request) {
  try {
    const json = await req.json();
    const parsed = schema.safeParse(json);
    if (!parsed.success) return NextResponse.json({ ok: true });

    await connectToDatabase();
    const email = parsed.data.email.toLowerCase();
    // Rate limit: 5 requests per 10 minutes per IP+email
    const key = getClientKey(req, `pwd:${email}`);
    const rl = rateLimit(key, 5, 10 * 60 * 1000);
    if (!rl.ok) return NextResponse.json({ ok: true });
    const user = await User.findOne({ email });
    if (user) {
      const token = signActionToken({
        uid: user._id.toString(),
        action: "password-reset",
        exp: Math.floor(Date.now() / 1000) + 60 * 30, // 30 minutes
      });
      const base = process.env.NEXT_PUBLIC_APP_URL ?? new URL(req.url).origin;
      const link = `${base}/reset-password?token=${encodeURIComponent(token)}`;
      try {
        await sendMail({
          to: user.email,
          subject: "Reset your password",
          html: `<p>Hello ${user.name},</p><p>Click the link below to reset your password (valid for 30 minutes):</p><p><a href="${link}">Reset Password</a></p>`
        });
      } catch {}
    }
    // Always OK to prevent enumeration
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ ok: true });
  }
}
