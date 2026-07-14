import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { createServiceClient } from "@/lib/supabase";
import { sendEmail } from "@/lib/email";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://cbs-afstemning.vercel.app";
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MAX_PHOTO_BYTES = 5 * 1024 * 1024;
const ALLOWED_PHOTO_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];

export async function POST(req: NextRequest) {
  const form = await req.formData();
  const nominee_name = String(form.get("nominee_name") ?? "").trim();
  const reasoning = String(form.get("reasoning") ?? "").trim();
  const submitter_name = String(form.get("submitter_name") ?? "").trim();
  const submitter_email = String(form.get("submitter_email") ?? "").trim();
  const raffle_opt_in = form.get("raffle_opt_in") === "true";
  const photo = form.get("photo");

  if (!nominee_name || !reasoning || !submitter_name || !submitter_email) {
    return NextResponse.json({ error: "Udfyld venligst alle felter." }, { status: 400 });
  }
  if (!EMAIL_RE.test(submitter_email)) {
    return NextResponse.json({ error: "Ugyldig e-mailadresse." }, { status: 400 });
  }

  const hasPhoto = photo instanceof File && photo.size > 0;
  if (hasPhoto) {
    if (!ALLOWED_PHOTO_TYPES.includes(photo.type)) {
      return NextResponse.json({ error: "Billedet skal være JPEG, PNG, WebP eller GIF." }, { status: 400 });
    }
    if (photo.size > MAX_PHOTO_BYTES) {
      return NextResponse.json({ error: "Billedet må maks fylde 5 MB." }, { status: 400 });
    }
  }

  const supabase = createServiceClient();

  let photo_url: string | null = null;
  if (hasPhoto) {
    const extension = photo.name.split(".").pop() || "jpg";
    const path = `${randomUUID()}.${extension}`;
    const { error: uploadError } = await supabase.storage
      .from("nomination-photos")
      .upload(path, photo, { contentType: photo.type });
    if (uploadError) {
      return NextResponse.json({ error: "Kunne ikke uploade billedet. Prøv igen." }, { status: 500 });
    }
    photo_url = supabase.storage.from("nomination-photos").getPublicUrl(path).data.publicUrl;
  }

  const token = randomUUID();
  const { error } = await supabase.from("nominations").insert({
    nominee_name,
    reasoning,
    photo_url,
    submitter_name,
    submitter_email,
    raffle_opt_in,
    status: "unverified",
    verification_token: token,
  });

  if (error) return NextResponse.json({ error: "Der skete en fejl. Prøv igen." }, { status: 500 });

  const verifyUrl = `${SITE_URL}/api/verify?type=nomination&token=${token}`;
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
