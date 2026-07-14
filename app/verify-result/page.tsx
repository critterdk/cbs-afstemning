"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";

export default function VerifyResultPage() {
  return (
    <Suspense fallback={null}>
      <VerifyResultContent />
    </Suspense>
  );
}

function VerifyResultContent() {
  const searchParams = useSearchParams();
  const ok = searchParams.get("ok") === "1";

  return (
    <main className="max-w-xl mx-auto px-4 py-20 text-center">
      {ok ? (
        <>
          <div className="text-5xl mb-4">✓</div>
          <h1 className="text-2xl mb-2" style={{ color: "var(--color-red)" }}>
            Bekræftet!
          </h1>
          <p className="text-sm text-gray-600">
            Tak for din nominering. Den vises nu på siden og kan modtage stemmer.
          </p>
        </>
      ) : (
        <>
          <div className="text-5xl mb-4">✗</div>
          <h1 className="text-2xl mb-2" style={{ color: "var(--color-red)" }}>
            Linket virker ikke
          </h1>
          <p className="text-sm text-gray-600">
            Linket er ugyldigt eller allerede brugt. Prøv at nominere igen, hvis du ikke allerede har bekræftet.
          </p>
        </>
      )}
      <a href="/" className="inline-block mt-6 text-sm hover:underline" style={{ color: "var(--color-red)" }}>
        ← Tilbage til forsiden
      </a>
    </main>
  );
}
