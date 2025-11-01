import VerifyEmailClient from "@/components/verify-email-client";

export default async function VerifyEmailPage(props: { searchParams: Promise<{ token?: string }> }) {
  const sp = await props.searchParams;
  const token = sp?.token ?? "";
  return <VerifyEmailClient token={token} />;
}
