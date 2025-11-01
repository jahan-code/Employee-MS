import crypto from "crypto";

const SECRET = (process.env.AUTH_SECRET as string | undefined) ?? "";

function b64url(input: Buffer | string) {
  const buf = Buffer.isBuffer(input) ? input : Buffer.from(input);
  return buf.toString("base64").replace(/=/g, "").replace(/\+/g, "-").replace(/\//g, "_");
}

function b64urlDecode(input: string) {
  const pad = 4 - (input.length % 4 || 4);
  const normalized = input.replace(/-/g, "+").replace(/_/g, "/") + "=".repeat(pad === 4 ? 0 : pad);
  return Buffer.from(normalized, "base64");
}

function b64urlJson(obj: unknown) {
  return b64url(Buffer.from(JSON.stringify(obj)));
}

function hmac(data: string) {
  return b64url(crypto.createHmac("sha256", SECRET).update(data).digest());
}

export type ActionTokenPayload = {
  uid: string;
  exp: number;
  action: "set-passkey" | "verify-email" | "password-reset";
};

export function signActionToken(payload: ActionTokenPayload) {
  if (!SECRET) throw new Error("AUTH_SECRET is not configured");
  const header = { alg: "HS256", typ: "JWT" };
  const p1 = b64urlJson(header);
  const p2 = b64urlJson(payload);
  const sig = hmac(`${p1}.${p2}`);
  return `${p1}.${p2}.${sig}`;
}

export function verifyActionToken(token: string): ActionTokenPayload | null {
  try {
    if (!SECRET) return null;
    const [p1, p2, sig] = token.split(".");
    if (!p1 || !p2 || !sig) return null;
    const expected = hmac(`${p1}.${p2}`);
    if (!crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(expected))) return null;
    const json = JSON.parse(b64urlDecode(p2).toString());
    const now = Math.floor(Date.now() / 1000);
    if (typeof json.exp !== "number" || now > json.exp) return null;
    if (json.action !== "set-passkey" && json.action !== "verify-email" && json.action !== "password-reset") return null;
    if (typeof json.uid !== "string") return null;
    return json as ActionTokenPayload;
  } catch {
    return null;
  }
}
