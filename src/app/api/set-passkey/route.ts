import { NextResponse } from "next/server";
import { z } from "zod";
import { verifyActionToken } from "@/lib/tokens";
import { connectToDatabase } from "@/lib/db";
import { User } from "@/models/user";

const schema = z.object({
  token: z.string().min(1),
  passkey: z.string().min(1),
});

export async function POST(req: Request) {
  try {
    const json = await req.json();
    const parsed = schema.safeParse(json);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid request" }, { status: 400 });
    }

    const { token, passkey } = parsed.data;

    if (passkey !== "786786") {
      return NextResponse.json({ error: "Invalid passkey" }, { status: 403 });
    }

    const payload = verifyActionToken(token);
    if (!payload) {
      return NextResponse.json({ error: "Invalid or expired link" }, { status: 400 });
    }

    await connectToDatabase();

    const user = await User.findById(payload.uid);
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    if (user.passkeyVerified) {
      return NextResponse.json({ ok: true });
    }

    user.passkeyVerified = true;
    await user.save();

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}
