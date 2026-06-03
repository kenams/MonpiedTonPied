"use client";
import { useEffect, useState } from "react";

export default function AgeGate() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (!localStorage.getItem("age_ok")) setShow(true);
  }, []);

  if (!show) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center px-4 bg-[#080808]">
      <div className="max-w-xs w-full text-center">
        <p className="text-[#c8907a] text-xs uppercase tracking-widest mb-4">
          Arcane Feet
        </p>
        <h1 className="text-3xl font-bold text-white mb-2" style={{ fontFamily: "var(--font-serif)" }}>
          Accès restreint
        </h1>
        <p className="text-white/50 text-sm mb-8">
          Ce site est réservé aux personnes majeures (+18 ans).
          En continuant, vous confirmez avoir 18 ans ou plus.
        </p>
        <div className="flex flex-col gap-3">
          <button
            onClick={() => { localStorage.setItem("age_ok", "1"); setShow(false); }}
            className="bg-gradient-to-r from-[#c8907a] to-[#9d6552] text-white font-bold py-3 rounded-full text-sm"
          >
            J'ai 18 ans ou plus — Entrer
          </button>
          <button
            onClick={() => window.location.href = "https://www.google.com"}
            className="border border-white/10 text-white/50 py-3 rounded-full text-sm"
          >
            Quitter
          </button>
        </div>
      </div>
    </div>
  );
}
