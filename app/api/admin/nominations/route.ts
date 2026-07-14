import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase";

function checkAuth(req: NextRequest) {
  const provided = req.headers.get("x-admin-password")?.trim();
  const expected = process.env.ADMIN_PASSWORD?.trim();
  // Fail closed if ADMIN_PASSWORD isn't configured — no hardcoded fallback,
  // since this panel exposes nominator names/emails and raffle entries.
  return !!expected && !!provided && provided === expected;
}

export async function GET(req: NextRequest) {
  if (!checkAuth(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const supabase = createServiceClient();
  const { data } = await supabase
    .from("nomination_admin_view")
    .select("*")
    .order("created_at", { ascending: false });
  return NextResponse.json(data ?? []);
}

const EDITABLE_FIELDS = ["nominee_name", "reasoning", "status"] as const;

export async function PATCH(req: NextRequest) {
  if (!checkAuth(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = await req.json();
  const supabase = createServiceClient();

  const update: Record<string, string> = {};
  for (const field of EDITABLE_FIELDS) {
    if (body[field] !== undefined) update[field] = body[field];
  }

  const { error } = await supabase.from("nominations").update(update).eq("id", body.id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}

export async function DELETE(req: NextRequest) {
  if (!checkAuth(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await req.json();
  const supabase = createServiceClient();
  const { error } = await supabase.from("nominations").delete().eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
