import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase";
import { sendEmail, ADMIN_NOTIFICATION_EMAIL } from "@/lib/email";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://cbs-afstemning.vercel.app";

export async function GET(req: NextRequest) {
  const token = req.nextUrl.searchParams.get("token");
  const type = req.nextUrl.searchParams.get("type");

  if (!token || (type !== "nomination" && type !== "vote")) {
    return NextResponse.redirect(`${SITE_URL}/verify-result?ok=0`);
  }

  const supabase = createServiceClient();

  if (type === "nomination") {
    const { data: row } = await supabase
      .from("nominations")
      .select("*")
      .eq("verification_token", token)
      .eq("status", "unverified")
      .single();

    if (!row) return NextResponse.redirect(`${SITE_URL}/verify-result?ok=0`);

    await supabase
      .from("nominations")
      .update({ status: "approved", verified_at: new Date().toISOString(), verification_token: null })
      .eq("id", row.id);

    await sendEmail(
      ADMIN_NOTIFICATION_EMAIL,
      `Ny nominering bekræftet: ${row.nominee_name}`,
      `
        <p>En ny nominering til Årets Cykelhelt er bekræftet og vises nu på siden.</p>
        <p><strong>${row.nominee_name}</strong></p>
        <p>${row.reasoning}</p>
        <p>Indsendt af: ${row.submitter_name} (${row.submitter_email})</p>
        <p>Ønsker lodtrækning: ${row.raffle_opt_in ? "Ja" : "Nej"}</p>
        <p><a href="${SITE_URL}/admin">Gå til admin-panelet</a></p>
      `
    );

    return NextResponse.redirect(`${SITE_URL}/verify-result?ok=1&type=nomination`);
  }

  // type === "vote"
  const { data: vote } = await supabase
    .from("votes")
    .select("*, nominations(nominee_name)")
    .eq("verification_token", token)
    .eq("status", "unverified")
    .single();

  if (!vote) return NextResponse.redirect(`${SITE_URL}/verify-result?ok=0`);

  const { error } = await supabase
    .from("votes")
    .update({ status: "confirmed", verified_at: new Date().toISOString(), verification_token: null })
    .eq("id", vote.id);

  // Someone else confirmed a vote for the same (nomination, email) between
  // this row being created and this click — the unique index rejects it.
  if (error) return NextResponse.redirect(`${SITE_URL}/verify-result?ok=0`);

  return NextResponse.redirect(`${SITE_URL}/verify-result?ok=1&type=vote`);
}
