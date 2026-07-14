import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { createServiceClient } from "@/lib/supabase";
import { sendEmail } from "@/lib/email";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://cbs-afstemning.vercel.app";
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(req: NextRequest) {
  const body = await req.json();
  const nominee_name = String(body.nominee_name ?? "").trim();
  const reasoning = String(body.reasoning ?? "").trim();
  const submitter_name = String(body.submitter_name ?? "").trim();
  const submitter_email = String(body.submitter_email ?? "").trim();
  const raffle_opt_in = body.raffle_opt_in === true;

  if (!nominee_name || !reasoning || !submitter_name || !submitter_email) {
    return NextResponse.json({ error: "Udfyld venligst alle felter." }, { status: 400 });
  }
  if (!EMAIL_RE.test(submitter_email)) {
    return NextResponse.json({ error: "Ugyldig e-mailadresse." }, { status: 400 });
  }

  const token = randomUUID();
  const supabase = createServiceClient();
  const { error } = await supabase.from("nominations").insert({
    nominee_name,
    reasoning,
    submitter_name,
    submitter_email,
    raffle_opt_in,
    status: "unverified",
    verification_token: token,
  });

  if (error) return NextResponse.json({ error: "Der skete en fejl. Prøv igen." }, { status: 500 });

  const verifyUrl = `${SITE_URL}/api/verify?token=${token}`;
  await sendEmail(
    submitter_email,
    "Bekræft din nominering til Årets Cykelhelt",
    `
      <p>Hej ${submitter_name},</p>
      <p>Vi har modtaget din nominering af <strong>${nominee_name}</strong> til Årets Cykelhelt.</p>
      <p>Bekræft venligst at det er dig der har indsendt den, ved at klikke her:</p>
      <p><a href="${verifyUrl}">Bekræft nominering</a></p>
      <p>Nomineringen vises først på siden, og kan først modtage stemmer, når du har bekræftet.</p>
      <p>Mvh<br/>Copenhagen Bike Show</p>
    `
  );

  return NextResponse.json({ ok: true });
}
