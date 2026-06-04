"use client";
import { useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { api } from "@/lib/api";
import { useRouter } from "next/navigation";
import { Shield, Check, Upload, ChevronLeft, Loader2, AlertCircle } from "lucide-react";
import Link from "next/link";

const STEPS = [
  { id: "identity", label: "Identité", desc: "Pièce d'identité en cours de validité (carte, passeport)" },
  { id: "selfie", label: "Selfie ID", desc: "Photo de vous tenant votre pièce d'identité" },
  { id: "age", label: "Vérification âge", desc: "Confirmation que vous avez 18 ans ou plus" },
];

export default function KYCPage() {
  const { user, token, isCreator, refresh } = useAuth();
  const router = useRouter();
  const [files, setFiles] = useState<Record<string, File>>({});
  const [previews, setPreviews] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState("");

  if (!isCreator) { router.push("/"); return null; }
  if (user?.verifiedCreator) {
    return (
      <div className="page-with-nav flex flex-col items-center justify-center px-6 text-center">
        <div className="w-16 h-16 rounded-full bg-[var(--green)]/15 flex items-center justify-center mb-4">
          <Shield size={28} className="text-[var(--green)]" />
        </div>
        <h1 className="text-xl font-bold text-white mb-2">Compte vérifié ✓</h1>
        <p className="text-sm text-white/50 mb-6">Votre identité a déjà été validée.</p>
        <Link href="/dashboard" className="btn-secondary rounded-full px-6">Retour dashboard</Link>
      </div>
    );
  }

  function pickFile(stepId: string) {
    const input = document.createElement("input");
    input.type = "file"; input.accept = "image/*";
    input.onchange = e => {
      const f = (e.target as HTMLInputElement).files?.[0];
      if (!f) return;
      setFiles(prev => ({ ...prev, [stepId]: f }));
      setPreviews(prev => ({ ...prev, [stepId]: URL.createObjectURL(f) }));
    };
    input.click();
  }

  async function submit() {
    if (Object.keys(files).length < STEPS.length) {
      setError("Veuillez fournir tous les documents requis"); return;
    }
    setError(""); setLoading(true);
    try {
      const fd = new FormData();
      for (const [k, f] of Object.entries(files)) fd.append(k, f);
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000"}/api/auth/kyc`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: fd,
      });
      if (!res.ok) { const d = await res.json(); throw new Error(d.message); }
      setDone(true);
      await refresh();
      setTimeout(() => router.push("/dashboard"), 2500);
    } catch (err: any) {
      setError(err.message || "Erreur lors de l'envoi");
    } finally { setLoading(false); }
  }

  if (done) return (
    <div className="min-h-dvh flex items-center justify-center px-4">
      <div className="text-center fade-up">
        <div className="w-16 h-16 rounded-full bg-[var(--green)]/15 flex items-center justify-center mx-auto mb-4">
          <Check size={28} className="text-[var(--green)]" />
        </div>
        <p className="text-xl font-bold text-white">Documents envoyés !</p>
        <p className="text-sm text-white/40 mt-2">Vérification sous 24–48h. Redirection...</p>
      </div>
    </div>
  );

  return (
    <div className="page-with-nav px-4 max-w-lg mx-auto">
      <div className="flex items-center gap-3 py-4 mb-6">
        <Link href="/dashboard" className="w-9 h-9 flex items-center justify-center rounded-full border border-white/10 text-white/50 hover:text-white transition">
          <ChevronLeft size={18} />
        </Link>
        <div>
          <h1 className="text-lg font-bold text-white">Vérification d&apos;identité</h1>
          <p className="text-xs text-white/40">Obligatoire pour les créateurs</p>
        </div>
      </div>

      {/* Why */}
      <div className="p-4 rounded-2xl bg-white/5 border border-white/8 mb-6">
        <div className="flex gap-3">
          <Shield size={18} className="text-[var(--rose)] flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-white mb-1">Pourquoi ce processus ?</p>
            <p className="text-xs text-white/50 leading-relaxed">
              Conformité légale (directive EU 2021), vérification de majorité (+18), protection des créateurs et des acheteurs. Vos documents sont traités de façon sécurisée et supprimés après validation.
            </p>
          </div>
        </div>
      </div>

      {/* Steps */}
      <div className="space-y-4 mb-6">
        {STEPS.map((step, i) => {
          const uploaded = !!files[step.id];
          return (
            <div key={step.id} className={`p-4 rounded-2xl border transition ${uploaded ? "border-[var(--green)]/30 bg-[var(--green)]/5" : "border-white/10 bg-white/4"}`}>
              <div className="flex items-start gap-3">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0 ${uploaded ? "bg-[var(--green)]/20 text-[var(--green)]" : "bg-white/10 text-white/50"}`}>
                  {uploaded ? <Check size={14} /> : i + 1}
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-white">{step.label}</p>
                  <p className="text-xs text-white/40 mt-0.5 mb-3">{step.desc}</p>
                  {previews[step.id] ? (
                    <div className="relative w-24 h-16 rounded-xl overflow-hidden border border-white/10">
                      <img src={previews[step.id]} alt="" className="w-full h-full object-cover" />
                      <button onClick={() => pickFile(step.id)} className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 hover:opacity-100 transition text-xs text-white">
                        Changer
                      </button>
                    </div>
                  ) : (
                    <button onClick={() => pickFile(step.id)} className="btn-secondary py-2 px-4 text-xs rounded-xl">
                      <Upload size={13} />
                      Choisir un fichier
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {error && (
        <div className="flex items-center gap-2 p-3 rounded-xl bg-red-500/10 border border-red-500/20 mb-4">
          <AlertCircle size={14} className="text-red-400 flex-shrink-0" />
          <p className="text-xs text-red-400">{error}</p>
        </div>
      )}

      <button
        onClick={submit}
        disabled={loading || Object.keys(files).length < STEPS.length}
        className="btn-primary w-full rounded-2xl"
      >
        {loading ? <Loader2 size={16} className="animate-spin" /> : "Soumettre pour vérification"}
      </button>
      <p className="text-[11px] text-white/25 text-center mt-4">
        En soumettant, vous confirmez que les documents fournis vous appartiennent et que vous avez 18 ans ou plus.
      </p>
    </div>
  );
}
