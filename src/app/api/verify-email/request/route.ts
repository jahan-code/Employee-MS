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
    if (!parsed.success) {
      return NextResponse.json({ ok: true });
    }
    const { email } = parsed.data;
    // Rate limit: 5 requests per 10 minutes per IP+email
    const key = getClientKey(req, `verify:${email.toLowerCase()}`);
    const rl = rateLimit(key, 5, 10 * 60 * 1000);
    if (!rl.ok) return NextResponse.json({ ok: true });
    await connectToDatabase();
    const user = await User.findOne({ email: email.toLowerCase() });
    if (user && !user.emailVerified) {
      const token = signActionToken({
        uid: user._id.toString(),
        action: "verify-email",
        exp: Math.floor(Date.now() / 1000) + 60 * 60 * 24,
      });
      const base = process.env.NEXT_PUBLIC_APP_URL ?? new URL(req.url).origin;
      const link = `${base}/verify-email?token=${encodeURIComponent(token)}`;
      try {
        await sendMail({
          to: user.email,
          subject: "Verify your email",
          html: `<p>Hello ${user.name},</p><p>Please verify your email by clicking the link below:</p><p><a href="${link}">Verify Email</a></p>`,
        });
      } catch {}
    }
    // Always return OK to avoid user enumeration
    return NextResponse.json({ ok: true });
  } catch {
    // Also return OK to avoid leaking errors for enumeration
    return NextResponse.json({ ok: true });
  }
}
