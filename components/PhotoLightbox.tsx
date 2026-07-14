"use client";

import { useEffect } from "react";

export default function PhotoLightbox({ src, onClose }: { src: string; onClose: () => void }) {
  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [onClose]);

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ backgroundColor: "rgba(0,0,0,0.8)" }}
      onClick={onClose}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={src}
        alt=""
        className="max-w-full max-h-full rounded shadow-lg"
        onClick={(e) => e.stopPropagation()}
      />
      <button
        type="button"
        aria-label="Luk"
        onClick={onClose}
        className="absolute top-4 right-4 text-white text-3xl leading-none w-10 h-10 flex items-center justify-center rounded-full hover:bg-white/10"
      >
        &times;
      </button>
    </div>
  );
}
