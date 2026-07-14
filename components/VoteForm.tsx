"use client";

import { useState } from "react";

export default function VoteForm({
  nominationId,
  onCancel,
  onSent,
}: {
  nominationId: string;
  onCancel: () => void;
  onSent: () => void;
}) {
  const [voterName, setVoterName] = useState("");
  const [voterEmail, setVoterEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit() {
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch("/api/vote", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nominationId, voter_name: voterName, voter_email: voterEmail }),
      });
      const body = await res.json();
      if (!res.ok) {
        setError(body.error ?? "Der skete en fejl. Prøv igen.");
        return;
      }
      onSent();
    } catch {
      setError("Der skete en fejl. Prøv igen.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="mt-2 border-t border-gray-100 pt-2 space-y-2">
      <input
        className="border border-gray-300 rounded px-3 py-1.5 text-sm w-full"
        placeholder="Dit navn"
        value={voterName}
        onChange={(e) => setVoterName(e.target.value)}
      />
      <input
        type="email"
        className="border border-gray-300 rounded px-3 py-1.5 text-sm w-full"
        placeholder="Din e-mail (skal bekræftes)"
        value={voterEmail}
        onChange={(e) => setVoterEmail(e.target.value)}
      />
      {error && <p className="text-xs text-red-700">{error}</p>}
      <div className="flex gap-3">
        <button className="btn-red text-xs px-3 py-1.5 rounded" disabled={submitting} onClick={submit}>
          Bekræft stemme
        </button>
        <button className="text-xs text-gray-500 hover:underline" onClick={onCancel}>
          Annuller
        </button>
      </div>
    </div>
  );
}
