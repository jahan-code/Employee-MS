import { NextResponse } from "next/server";
import { z } from "zod";
import { connectToDatabase } from "@/lib/db";
import { User } from "@/models/user";
import { hashPassword } from "@/lib/password";
import { signActionToken } from "@/lib/tokens";
import { sendMail } from "@/lib/mailer";

const signupSchema = z.object({
  name: z.string().min(1, { message: "Name is required" }).max(120),
  email: z.string().email({ message: "Please enter a valid email address" }),
  password: z
    .string()
    .min(6, { message: "Password must be at least 6 characters" })
    .max(128, { message: "Password is too long" }),
});

export async function POST(req: Request) {
  try {
    const json = await req.json();
    const parsed = signupSchema.safeParse(json);

    if (!parsed.success) {
      const message = parsed.error.issues[0]?.message ?? "Invalid input";
      return NextResponse.json({ error: message }, { status: 400 });
    }

    const { name, email, password } = parsed.data;

    await connectToDatabase();

    const existing = await User.findOne({ email: email.toLowerCase() });
    if (existing) {
      return NextResponse.json({ error: "Email is already registered" }, { status: 409 });
    }

    const passwordHash = await hashPassword(password);

    const user = await User.create({
      name: name.trim(),
      email: email.toLowerCase().trim(),
      passwordHash,
      role: "employee",
    });

    const token = signActionToken({
      uid: user._id.toString(),
      action: "set-passkey",
      exp: Math.floor(Date.now() / 1000) + 60 * 60 * 24,
    });
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? new URL(req.url).origin;
    const link = `${baseUrl}/set-passkey?token=${encodeURIComponent(token)}`;

    try {
      await sendMail({
        to: user.email,
        subject: "Set your passkey",
        html: `<p>Welcome, ${user.name}.</p><p>To complete setup, open this link and enter the passkey provided by HR.</p><p><a href="${link}">Set passkey</a></p>`,
      });
    } catch {}

    // Send verify email link
    try {
      const vtoken = signActionToken({
        uid: user._id.toString(),
        action: "verify-email",
        exp: Math.floor(Date.now() / 1000) + 60 * 60 * 24,
      });
      const vlink = `${baseUrl}/verify-email?token=${encodeURIComponent(vtoken)}`;
      await sendMail({
        to: user.email,
        subject: "Verify your email",
        html: `<p>Hello ${user.name},</p><p>Please verify your email by clicking the link below:</p><p><a href="${vlink}">Verify Email</a></p>`,
      });
    } catch {}

    return NextResponse.json(
      { id: user._id.toString(), email: user.email, name: user.name },
      { status: 201 }
    );
  } catch (err) {
    console.error("Signup error", err);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}
