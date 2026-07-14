"use client";

import { useEffect, useState } from "react";
import { getSupabaseClient } from "@/lib/supabase";
import { mockNominations, type Nomination } from "@/lib/mockData";
import NominationForm from "@/components/NominationForm";
import PhotoLightbox from "@/components/PhotoLightbox";
import VoteForm from "@/components/VoteForm";

export default function NominationsSection({ showTitle = true }: { showTitle?: boolean }) {
  const [nominations, setNominations] = useState<Nomination[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [enlargedPhoto, setEnlargedPhoto] = useState<string | null>(null);
  const [votingFor, setVotingFor] = useState<string | null>(null);
  const [voteSentFor, setVoteSentFor] = useState<string | null>(null);

  async function loadNominations() {
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
      setNominations(mockNominations);
      return;
    }
    const supabase = getSupabaseClient();
    const { data } = await supabase
      .from("nomination_results")
      .select("*")
      .order("vote_count", { ascending: false });
    setNominations(data ?? []);
  }

  useEffect(() => {
    loadNominations().finally(() => setLoading(false));
  }, []);

  const totalVotes = nominations.reduce((sum, n) => sum + n.vote_count, 0);

  return (
    <section>
      {showTitle && <h2 className="text-2xl mb-4">Årets Cykelhelt</h2>}

      {!showForm && (
        <button className="btn-red text-sm px-4 py-2 rounded mb-4" onClick={() => setShowForm(true)}>
          Nominér en cykelhelt
        </button>
      )}
      {showForm && <NominationForm onDone={() => setShowForm(false)} />}

      {loading && <p className="text-sm text-gray-400">Indlæser...</p>}
      {!loading && nominations.length === 0 && (
        <p className="text-sm text-gray-400">Ingen nomineringer endnu — vær den første!</p>
      )}

      {!loading && nominations.length > 0 && (
        <ul className="space-y-3">
          {nominations.map((nomination) => {
            const pct = totalVotes > 0 ? Math.round((nomination.vote_count / totalVotes) * 100) : 0;
            return (
              <li key={nomination.id} className="border border-gray-200 p-3 rounded">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    {nomination.photo_url && (
                      <button
                        type="button"
                        onClick={() => setEnlargedPhoto(nomination.photo_url)}
                        className="shrink-0"
                        aria-label={`Se billede af ${nomination.nominee_name} i fuld størrelse`}
                      >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={nomination.photo_url}
                          alt=""
                          className="w-12 h-12 rounded object-cover border border-gray-200 cursor-pointer hover:opacity-80"
                        />
                      </button>
                    )}
                    <div>
                      <p className="font-semibold text-black">{nomination.nominee_name}</p>
                      <p className="text-sm text-gray-500">{nomination.reasoning}</p>
                    </div>
                  </div>
                  {votingFor !== nomination.id && voteSentFor !== nomination.id && (
                    <button
                      className="btn-red text-sm px-4 py-2 rounded shrink-0"
                      onClick={() => setVotingFor(nomination.id)}
                    >
                      Stem
                    </button>
                  )}
                </div>

                <div className="mt-2">
                  <div className="h-2 bg-gray-100 rounded overflow-hidden">
                    <div className="bar-fill h-full" style={{ width: `${pct}%` }} />
                  </div>
                  <p className="text-xs text-gray-400 mt-1">
                    {pct}% ({nomination.vote_count} stemmer)
                  </p>
                </div>

                {votingFor === nomination.id && (
                  <VoteForm
                    nominationId={nomination.id}
                    onCancel={() => setVotingFor(null)}
                    onSent={() => {
                      setVotingFor(null);
                      setVoteSentFor(nomination.id);
                    }}
                  />
                )}
                {voteSentFor === nomination.id && (
                  <p className="text-xs text-gray-500 mt-2">
                    Tjek din e-mail og bekræft, så tælles din stemme med.
                  </p>
                )}
              </li>
            );
          })}
        </ul>
      )}
      {enlargedPhoto && <PhotoLightbox src={enlargedPhoto} onClose={() => setEnlargedPhoto(null)} />}
    </section>
  );
}
