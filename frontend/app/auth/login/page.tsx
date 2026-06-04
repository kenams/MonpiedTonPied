"use client";
import { useState } from "react";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function LoginPage() {
  const { login } = useAuth();
  const router = useRouter();
  const [form, setForm] = useState({ email: "", password: "" });
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement>) => setForm(f => ({ ...f, [k]: e.target.value }));

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(""); setLoading(true);
    try {
      await login(form.email, form.password);
      router.push("/");
    } catch (err: any) {
      setError(err.message || "Email ou mot de passe incorrect");
    } finally { setLoading(false); }
  }

  return (
    <div className="min-h-dvh flex items-center justify-center px-4 pt-20">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <p className="text-2xl font-bold" style={{ fontFamily: "var(--font-serif)", color: "var(--rose)" }}>
            Arcane Feet
          </p>
          <p className="text-sm text-white/40 mt-2">Connectez-vous à votre compte</p>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <input className="input" type="email" placeholder="Email" value={form.email} onChange={set("email")} required />
          <div className="relative">
            <input className="input pr-10" type={showPw ? "text" : "password"} placeholder="Mot de passe" value={form.password} onChange={set("password")} required />
            <button type="button" onClick={() => setShowPw(p => !p)} className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30">
              {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
          {error && <p className="text-red-400 text-sm">{error}</p>}
          <button type="submit" className="btn-primary" disabled={loading}>
            {loading ? <Loader2 size={16} className="animate-spin" /> : "Se connecter"}
          </button>
        </form>

        <div className="text-center mt-6 space-y-2">
          <p className="text-sm text-white/40">
            Pas de compte ?{" "}
            <Link href="/auth/register" className="text-[var(--rose)] hover:underline">S&apos;inscrire</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
