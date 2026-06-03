"use client";
import { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { CheckCircle, Loader2 } from "lucide-react";
import { Suspense } from "react";

function SuccessContent() {
  const params = useSearchParams();
  const router = useRouter();
  const [status, setStatus] = useState<"loading" | "ok" | "error">("loading");

  useEffect(() => {
    const sessionId = params.get("session_id");
    if (!sessionId) { setStatus("error"); return; }

    fetch("/api/verify", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ session_id: sessionId }),
    })
      .then(r => r.json())
      .then(data => {
        if (data.valid && data.token) {
          // Store token in localStorage + cookie
          localStorage.setItem("access_token", data.token);
          document.cookie = `access_token=${data.token}; path=/; max-age=${data.plan === "lifetime" ? 3153600000 : 2592000}; SameSite=Lax`;
          setStatus("ok");
          setTimeout(() => router.push("/"), 2000);
        } else {
          setStatus("error");
        }
      })
      .catch(() => setStatus("error"));
  }, [params, router]);

  return (
    <div className="min-h-screen flex items-center justify-center px-4 bg-[#080808]">
      <div className="text-center max-w-xs">
        {status === "loading" && (
          <>
            <Loader2 size={40} className="animate-spin text-[#c8907a] mx-auto mb-4" />
            <p className="text-white/60">Activation de votre accès...</p>
          </>
        )}
        {status === "ok" && (
          <>
            <CheckCircle size={48} className="text-emerald-400 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-white mb-2" style={{ fontFamily: "var(--font-serif)" }}>
              Accès activé !
            </h2>
            <p className="text-white/50 text-sm">Bienvenue dans Arcane Feet. Redirection...</p>
          </>
        )}
        {status === "error" && (
          <>
            <p className="text-red-400 mb-4">Une erreur est survenue.</p>
            <button onClick={() => router.push("/")} className="text-[#c8907a] underline text-sm">
              Retour à l'accueil
            </button>
          </>
        )}
      </div>
    </div>
  );
}

export default function SuccessPage() {
  return <Suspense><SuccessContent /></Suspense>;
}
