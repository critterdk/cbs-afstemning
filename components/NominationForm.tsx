"use client";

import { useState } from "react";

const MAX_PHOTO_BYTES = 5 * 1024 * 1024;

export default function NominationForm({ onDone }: { onDone: () => void }) {
  const [form, setForm] = useState({
    nominee_name: "",
    reasoning: "",
    submitter_name: "",
    submitter_email: "",
    raffle_opt_in: false,
  });
  const [photo, setPhoto] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);

  function onPhotoChange(file: File | null) {
    setError(null);
    if (!file) {
      setPhoto(null);
      setPhotoPreview(null);
      return;
    }
    if (!file.type.startsWith("image/")) {
      setError("Filen skal være et billede.");
      return;
    }
    if (file.size > MAX_PHOTO_BYTES) {
      setError("Billedet må maks fylde 5 MB.");
      return;
    }
    setPhoto(file);
    setPhotoPreview(URL.createObjectURL(file));
  }

  async function submit() {
    setSubmitting(true);
    setError(null);
    try {
      const fd = new FormData();
      fd.append("nominee_name", form.nominee_name);
      fd.append("reasoning", form.reasoning);
      fd.append("submitter_name", form.submitter_name);
      fd.append("submitter_email", form.submitter_email);
      fd.append("raffle_opt_in", String(form.raffle_opt_in));
      if (photo) fd.append("photo", photo);

      const res = await fetch("/api/nominate", { method: "POST", body: fd });
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

        <div>
          <p className="text-sm font-semibold text-black mb-1">Tilføj et foto</p>
          {!photoPreview ? (
            <label className="flex flex-col items-center justify-center gap-1.5 border-2 border-dashed border-gray-300 rounded-lg py-5 cursor-pointer hover:border-gray-400 hover:bg-gray-50 transition-colors">
              <svg
                width="28"
                height="28"
                viewBox="0 0 24 24"
                fill="none"
                stroke="var(--color-red)"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M4 8h3l1.5-2h7L17 8h3a1 1 0 0 1 1 1v9a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V9a1 1 0 0 1 1-1z" />
                <circle cx="12" cy="13" r="3.5" />
              </svg>
              <span className="text-sm font-medium" style={{ color: "var(--color-red)" }}>
                Klik for at vælge et billede
              </span>
              <span className="text-xs text-gray-400">Valgfrit, men gør nomineringen mere personlig · maks 5 MB</span>
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => onPhotoChange(e.target.files?.[0] ?? null)}
              />
            </label>
          ) : (
            <div className="flex items-center gap-3 border border-gray-200 rounded-lg p-2">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={photoPreview} alt="" className="w-14 h-14 rounded object-cover border border-gray-200 shrink-0" />
              <p className="flex-1 text-sm text-gray-600 truncate">{photo?.name}</p>
              <button
                type="button"
                className="text-xs text-gray-500 hover:underline shrink-0"
                onClick={() => onPhotoChange(null)}
              >
                Fjern
              </button>
            </div>
          )}
        </div>

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
