import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { createServiceClient } from "@/lib/supabase";
import { sendEmail } from "@/lib/email";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://cbs-afstemning.vercel.app";
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(req: NextRequest) {
  const body = await req.json();
  const nominationId = String(body.nominationId ?? "").trim();
  const voter_name = String(body.voter_name ?? "").trim();
  const voter_email = String(body.voter_email ?? "").trim().toLowerCase();

  if (!nominationId || !voter_name || !voter_email) {
    return NextResponse.json({ error: "Udfyld venligst alle felter." }, { status: 400 });
  }
  if (!EMAIL_RE.test(voter_email)) {
    return NextResponse.json({ error: "Ugyldig e-mailadresse." }, { status: 400 });
  }

  const supabase = createServiceClient();

  const { data: nomination } = await supabase
    .from("nominations")
    .select("id, nominee_name")
    .eq("id", nominationId)
    .eq("status", "approved")
    .maybeSingle();

  if (!nomination) {
    return NextResponse.json({ error: "Denne nominering findes ikke længere." }, { status: 404 });
  }

  const { data: existing } = await supabase
    .from("votes")
    .select("id")
    .eq("nomination_id", nominationId)
    .eq("voter_email", voter_email)
    .maybeSingle();

  if (existing) {
    return NextResponse.json({ error: "Du har allerede stemt på denne nominering." }, { status: 409 });
  }

  const token = randomUUID();
  const { error } = await supabase.from("votes").insert({
    nomination_id: nominationId,
    voter_name,
    voter_email,
    status: "unverified",
    verification_token: token,
  });

  if (error) {
    // Unique constraint race: two requests for the same (nomination, email) at once.
    if (error.code === "23505") {
      return NextResponse.json({ error: "Du har allerede stemt på denne nominering." }, { status: 409 });
    }
    return NextResponse.json({ error: "Der skete en fejl. Prøv igen." }, { status: 500 });
  }

  const verifyUrl = `${SITE_URL}/api/verify?type=vote&token=${token}`;
  await sendEmail(
    voter_email,
    "Bekræft din stemme til Årets Cykelhelt",
    `
      <p>Hej ${voter_name},</p>
      <p>Vi har modtaget din stemme på <strong>${nomination.nominee_name}</strong> til Årets Cykelhelt.</p>
      <p>Bekræft venligst at det er dig der har stemt, ved at klikke her:</p>
      <p><a href="${verifyUrl}">Bekræft stemme</a></p>
      <p>Stemmen tælles først med, når du har bekræftet.</p>
      <p>Mvh<br/>Copenhagen Bike Show</p>
    `
  );

  return NextResponse.json({ ok: true });
}
