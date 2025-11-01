import nodemailer from "nodemailer";

const SMTP_HOST = process.env.SMTP_HOST as string | undefined;
const SMTP_PORT = process.env.SMTP_PORT ? Number(process.env.SMTP_PORT) : undefined;
const SMTP_USER = process.env.SMTP_USER as string | undefined;
const SMTP_PASS = process.env.SMTP_PASS as string | undefined;
const SMTP_FROM = (process.env.SMTP_FROM as string | undefined) ?? "no-reply@employee-ms.local";

if (!SMTP_HOST || !SMTP_PORT || !SMTP_USER || !SMTP_PASS) {
  console.warn("SMTP environment variables are not fully configured. Emails may fail to send.");
}

export function getTransporter() {
  return nodemailer.createTransport({
    host: SMTP_HOST,
    port: SMTP_PORT,
    secure: SMTP_PORT === 465,
    auth: { user: SMTP_USER, pass: SMTP_PASS },
  });
}

export async function sendMail(options: { to: string; subject: string; html: string }) {
  const transporter = getTransporter();
  return transporter.sendMail({
    from: SMTP_FROM,
    to: options.to,
    subject: options.subject,
    html: options.html,
  });
}
