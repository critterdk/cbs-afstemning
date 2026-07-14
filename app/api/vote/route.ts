import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { createServiceClient } from "@/lib/supabase";

const COOKIE_NAME = "afstemning_voter";
const COOKIE_MAX_AGE = 60 * 60 * 24 * 365; // 1 year

// Reports whether the current browser (identified by its voter cookie) has
// already voted, and for whom — lets the UI show results instead of the
// ballot on repeat visits.
export async function GET(req: NextRequest) {
  const token = req.cookies.get(COOKIE_NAME)?.value;
  if (!token) return NextResponse.json({ votedFor: null });

  const supabase = createServiceClient();
  const { data } = await supabase
    .from("votes")
    .select("nomination_id")
    .eq("voter_token", token)
    .maybeSingle();

  return NextResponse.json({ votedFor: data?.nomination_id ?? null });
}

export async function POST(req: NextRequest) {
  const { nominationId } = await req.json();
  if (!nominationId || typeof nominationId !== "string") {
    return NextResponse.json({ error: "Ugyldig nominering." }, { status: 400 });
  }

  let token = req.cookies.get(COOKIE_NAME)?.value;
  const isNewToken = !token;
  if (!token) token = randomUUID();

  const supabase = createServiceClient();

  const { data: existing } = await supabase
    .from("votes")
    .select("nomination_id")
    .eq("voter_token", token)
    .maybeSingle();

  if (existing) {
    return NextResponse.json({ error: "Du har allerede stemt." }, { status: 409 });
  }

  const { data: nomination } = await supabase
    .from("nominations")
    .select("id")
    .eq("id", nominationId)
    .eq("status", "approved")
    .maybeSingle();

  if (!nomination) {
    return NextResponse.json({ error: "Denne nominering findes ikke længere." }, { status: 404 });
  }

  const { error } = await supabase
    .from("votes")
    .insert({ nomination_id: nominationId, voter_token: token });

  if (error) {
    // Unique constraint race: two requests from the same new cookie at once.
    if (error.code === "23505") {
      return NextResponse.json({ error: "Du har allerede stemt." }, { status: 409 });
    }
    return NextResponse.json({ error: "Der skete en fejl. Prøv igen." }, { status: 500 });
  }

  const res = NextResponse.json({ ok: true });
  if (isNewToken) {
    res.cookies.set(COOKIE_NAME, token, {
      httpOnly: true,
      secure: true,
      sameSite: "lax",
      maxAge: COOKIE_MAX_AGE,
      path: "/",
    });
  }
  return res;
}
