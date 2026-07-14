"use client";

import { useState } from "react";

type AdminNomination = {
  id: string;
  nominee_name: string;
  reasoning: string;
  submitter_name: string;
  submitter_email: string;
  raffle_opt_in: boolean;
  status: "unverified" | "approved" | "rejected";
  vote_count: number;
  created_at: string;
};

const STATUS_LABEL: Record<AdminNomination["status"], string> = {
  unverified: "Afventer bekræftelse",
  approved: "Godkendt",
  rejected: "Afvist",
};

export default function AdminPage() {
  const [password, setPassword] = useState("");
  const [authed, setAuthed] = useState(false);
  const [nominations, setNominations] = useState<AdminNomination[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [raffleOnly, setRaffleOnly] = useState(false);

  async function login() {
    setError(null);
    const res = await fetch("/api/admin/nominations", {
      headers: { "x-admin-password": password },
    });
    if (!res.ok) {
      setError("Forkert adgangskode.");
      return;
    }
    setNominations(await res.json());
    setAuthed(true);
  }

  async function refresh() {
    const res = await fetch("/api/admin/nominations", {
      headers: { "x-admin-password": password },
    });
    if (res.ok) setNominations(await res.json());
  }

  async function setStatus(id: string, status: AdminNomination["status"]) {
    await fetch("/api/admin/nominations", {
      method: "PATCH",
      headers: { "Content-Type": "application/json", "x-admin-password": password },
      body: JSON.stringify({ id, status }),
    });
    refresh();
  }

  async function removeNomination(id: string) {
    if (!confirm("Slet denne nominering og alle tilhørende stemmer?")) return;
    await fetch("/api/admin/nominations", {
      method: "DELETE",
      headers: { "Content-Type": "application/json", "x-admin-password": password },
      body: JSON.stringify({ id }),
    });
    refresh();
  }

  if (!authed) {
    return (
      <main className="max-w-sm mx-auto px-4 py-16">
        <h1 className="text-2xl mb-4">Admin</h1>
        <input
          type="password"
          className="border border-gray-300 rounded px-3 py-2 w-full mb-3"
          placeholder="Adgangskode"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && login()}
        />
        {error && <p className="text-sm text-red-700 mb-3">{error}</p>}
        <button className="btn-red text-sm px-4 py-2 rounded" onClick={login}>
          Log ind
        </button>
      </main>
    );
  }

  const visible = raffleOnly ? nominations.filter((n) => n.raffle_opt_in) : nominations;
  const raffleCount = nominations.filter((n) => n.raffle_opt_in && n.status === "approved").length;

  return (
    <main className="max-w-3xl mx-auto px-4 py-8">
      <h1 className="text-2xl mb-2">Admin — Årets Cykelhelt</h1>
      <p className="text-sm text-gray-500 mb-6">
        {nominations.length} nomineringer i alt · {raffleCount} tilmeldt lodtrækning (godkendte)
      </p>

      <label className="flex items-center gap-2 text-sm text-gray-600 mb-4">
        <input type="checkbox" checked={raffleOnly} onChange={(e) => setRaffleOnly(e.target.checked)} />
        Vis kun lodtrækningsdeltagere
      </label>

      <ul className="space-y-3">
        {visible.map((n) => (
          <li key={n.id} className="border border-gray-200 rounded p-3">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="font-semibold text-black">
                  {n.nominee_name}{" "}
                  <span className="text-xs font-normal text-gray-400">({n.vote_count} stemmer)</span>
                </p>
                <p className="text-sm text-gray-500">{n.reasoning}</p>
                <p className="text-xs text-gray-400 mt-1">
                  Indsendt af {n.submitter_name} ({n.submitter_email})
                  {n.raffle_opt_in && " · deltager i lodtrækning"}
                </p>
                <p className="text-xs mt-1">
                  Status: <span className="font-medium">{STATUS_LABEL[n.status]}</span>
                </p>
              </div>
              <div className="flex flex-col gap-1 items-end shrink-0 text-sm">
                {n.status !== "approved" && (
                  <button className="hover:underline" style={{ color: "var(--color-green)" }} onClick={() => setStatus(n.id, "approved")}>
                    Godkend
                  </button>
                )}
                {n.status !== "rejected" && (
                  <button className="text-gray-500 hover:underline" onClick={() => setStatus(n.id, "rejected")}>
                    Afvis
                  </button>
                )}
                <button className="text-red-700 hover:underline" onClick={() => removeNomination(n.id)}>
                  Slet
                </button>
              </div>
            </div>
          </li>
        ))}
      </ul>
    </main>
  );
}
