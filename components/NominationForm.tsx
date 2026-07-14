"use client";

import { useState } from "react";

export default function NominationForm({ onDone }: { onDone: () => void }) {
  const [form, setForm] = useState({
    nominee_name: "",
    reasoning: "",
    submitter_name: "",
    submitter_email: "",
    raffle_opt_in: false,
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);

  async function submit() {
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch("/api/nominate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const body = await res.json();
      if (!res.ok) {
        setError(body.error ?? "Der skete en fejl. Prøv igen.");
        return;
      }
      setSent(true);
    } catch {
      setError("Der skete en fejl. Prøv igen.");
    } finally {
      setSubmitting(false);
    }
  }

  if (sent) {
    return (
      <div className="border border-gray-200 rounded p-4 mb-6 text-sm">
        <p className="font-semibold text-black mb-1">Tak for din nominering!</p>
        <p className="text-gray-500">
          Tjek din indbakke ({form.submitter_email}) og bekræft via linket for at gøre nomineringen synlig.
        </p>
        <button className="text-sm mt-3 hover:underline" style={{ color: "var(--color-red)" }} onClick={onDone}>
          Luk
        </button>
      </div>
    );
  }

  return (
    <div className="border border-gray-200 rounded p-4 mb-6">
      <h2 className="text-lg mb-3">Nominér en cykelhelt</h2>
      <div className="space-y-2">
        <input
          className="border border-gray-300 rounded px-3 py-2 w-full"
          placeholder="Hvem nominerer du?"
          value={form.nominee_name}
          onChange={(e) => setForm({ ...form, nominee_name: e.target.value })}
        />
        <textarea
          className="border border-gray-300 rounded px-3 py-2 w-full"
          placeholder="Hvorfor fortjener personen at vinde?"
          rows={3}
          value={form.reasoning}
          onChange={(e) => setForm({ ...form, reasoning: e.target.value })}
        />
        <input
          className="border border-gray-300 rounded px-3 py-2 w-full"
          placeholder="Dit navn"
          value={form.submitter_name}
          onChange={(e) => setForm({ ...form, submitter_name: e.target.value })}
        />
        <input
          type="email"
          className="border border-gray-300 rounded px-3 py-2 w-full"
          placeholder="Din e-mail (skal bekræftes)"
          value={form.submitter_email}
          onChange={(e) => setForm({ ...form, submitter_email: e.target.value })}
        />
        <label className="flex items-start gap-2 text-sm text-gray-600">
          <input
            type="checkbox"
            className="mt-1"
            checked={form.raffle_opt_in}
            onChange={(e) => setForm({ ...form, raffle_opt_in: e.target.checked })}
          />
          Jeg vil gerne deltage i lodtrækningen om præmier for over kr. 1.000,-
        </label>
        {error && <p className="text-sm text-red-700">{error}</p>}
        <div className="flex gap-3">
          <button className="btn-red text-sm px-4 py-2 rounded" disabled={submitting} onClick={submit}>
            Send nominering
          </button>
          <button className="text-sm text-gray-500 hover:underline" onClick={onDone}>
            Annuller
          </button>
        </div>
      </div>
    </div>
  );
}
