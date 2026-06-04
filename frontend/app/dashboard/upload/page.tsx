"use client";
import { useState, useRef, useCallback } from "react";
import { useAuth } from "@/lib/auth-context";
import { api, uploadMedia } from "@/lib/api";
import { useRouter } from "next/navigation";
import { Upload, X, Plus, Image, Video, Loader2, Check, ChevronLeft, Tag } from "lucide-react";
import { CATEGORIES, ALL_TAGS } from "@/lib/categories";
import Link from "next/link";

type FilePreview = { file: File; url: string; type: "image" | "video" };

export default function UploadPage() {
  const { user, token, isCreator } = useAuth();
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);

  const [files, setFiles] = useState<FilePreview[]>([]);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("all");
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState("");
  const [price, setPrice] = useState("0");
  const [uploading, setUploading] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState("");
  const [step, setStep] = useState<1 | 2>(1);

  if (!isCreator) {
    return (
      <div className="min-h-dvh flex items-center justify-center px-4">
        <div className="text-center">
          <p className="text-4xl mb-4">🔒</p>
          <p className="text-white/60">Réservé aux créateurs</p>
          <Link href="/" className="btn-secondary mt-4">Retour</Link>
        </div>
      </div>
    );
  }

  function pickFiles(e: React.ChangeEvent<HTMLInputElement>) {
    const picked = Array.from(e.target.files || []);
    const previews = picked.map(f => ({
      file: f,
      url: URL.createObjectURL(f),
      type: f.type.startsWith("video") ? "video" as const : "image" as const,
    }));
    setFiles(prev => [...prev, ...previews].slice(0, 10));
  }

  function removeFile(i: number) {
    setFiles(prev => prev.filter((_, j) => j !== i));
  }

  function addTag(t: string) {
    const clean = t.replace(/^#/, "").trim().toLowerCase();
    if (clean && !tags.includes(clean) && tags.length < 20) setTags(prev => [...prev, clean]);
  }

  function removeTag(t: string) { setTags(prev => prev.filter(x => x !== t)); }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!files.length) { setError("Ajoutez au moins un fichier"); return; }
    setError(""); setUploading(true);

    try {
      const uploadedFiles: { url: string; type: string; thumbnail?: string }[] = [];
      for (const f of files) {
        const fd = new FormData();
        fd.append("file", f.file);
        fd.append("type", f.type);
        const result = await uploadMedia(fd, token!);
        uploadedFiles.push(result);
      }

      await api.post("/api/content", {
        title: title || `Publication de @${user?.username}`,
        description,
        files: uploadedFiles,
        tags,
        category,
        price: Math.round(parseFloat(price || "0") * 100),
      }, token!);

      setDone(true);
      setTimeout(() => router.push("/dashboard"), 2000);
    } catch (err: any) {
      setError(err.message || "Erreur lors de la publication");
    } finally { setUploading(false); }
  }

  if (done) {
    return (
      <div className="min-h-dvh flex items-center justify-center px-4">
        <div className="text-center fade-up">
          <div className="w-16 h-16 rounded-full bg-[var(--green)]/20 flex items-center justify-center mx-auto mb-4">
            <Check size={28} className="text-[var(--green)]" />
          </div>
          <p className="text-xl font-bold text-white">Publié !</p>
          <p className="text-sm text-white/40 mt-2">Redirection vers le dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="page-with-nav px-4 max-w-lg mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3 py-4 mb-2">
        <Link href="/dashboard" className="w-9 h-9 flex items-center justify-center rounded-full border border-white/10 text-white/50 hover:text-white transition">
          <ChevronLeft size={18} />
        </Link>
        <h1 className="text-lg font-bold text-white">Nouvelle publication</h1>
      </div>

      {/* Step indicator */}
      <div className="flex gap-2 mb-6">
        {[1, 2].map(s => (
          <button key={s} onClick={() => s < step ? setStep(s as 1|2) : null}
            className={`flex-1 h-1 rounded-full transition ${step >= s ? "bg-[var(--rose)]" : "bg-white/10"}`} />
        ))}
      </div>

      <form onSubmit={handleSubmit}>
        {step === 1 ? (
          <div className="space-y-5">
            {/* Drop zone */}
            <div
              onClick={() => fileRef.current?.click()}
              className="border-2 border-dashed border-white/15 rounded-2xl p-8 text-center cursor-pointer hover:border-[var(--rose)]/50 transition"
            >
              <input ref={fileRef} type="file" accept="image/*,video/*" multiple onChange={pickFiles} className="hidden" />
              {files.length === 0 ? (
                <>
                  <Upload size={32} className="text-white/20 mx-auto mb-3" />
                  <p className="text-sm font-medium text-white/60">Cliquez ou glissez vos fichiers</p>
                  <p className="text-xs text-white/30 mt-1">Photos & vidéos · max 10 fichiers</p>
                </>
              ) : (
                <div className="grid grid-cols-3 gap-2">
                  {files.map((f, i) => (
                    <div key={i} className="relative aspect-square rounded-xl overflow-hidden group">
                      {f.type === "video" ? (
                        <video src={f.url} className="w-full h-full object-cover" muted />
                      ) : (
                        <img src={f.url} className="w-full h-full object-cover" alt="" />
                      )}
                      <div className="absolute top-1 left-1">
                        {f.type === "video" ? <Video size={12} className="text-white" /> : <Image size={12} className="text-white" />}
                      </div>
                      <button type="button" onClick={e => { e.stopPropagation(); removeFile(i); }}
                        className="absolute top-1 right-1 w-5 h-5 bg-black/70 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition">
                        <X size={10} className="text-white" />
                      </button>
                    </div>
                  ))}
                  {files.length < 10 && (
                    <div className="aspect-square rounded-xl border-2 border-dashed border-white/15 flex items-center justify-center">
                      <Plus size={20} className="text-white/30" />
                    </div>
                  )}
                </div>
              )}
            </div>

            {files.length > 0 && (
              <button type="button" onClick={() => setStep(2)} className="btn-primary w-full">
                Suivant — Détails
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-5">
            {/* Title */}
            <div>
              <label className="text-xs text-white/40 block mb-1.5">Titre (optionnel)</label>
              <input className="input" type="text" placeholder="Ex: Vernis rouge du week-end ✨" value={title} onChange={e => setTitle(e.target.value)} />
            </div>

            {/* Description */}
            <div>
              <label className="text-xs text-white/40 block mb-1.5">Description</label>
              <textarea
                className="input resize-none h-20"
                placeholder="Décrivez votre contenu..."
                value={description}
                onChange={e => setDescription(e.target.value)}
              />
            </div>

            {/* Category */}
            <div>
              <label className="text-xs text-white/40 block mb-2">Catégorie</label>
              <div className="flex flex-wrap gap-2">
                {Object.entries(CATEGORIES).map(([key, c]) => (
                  <button key={key} type="button" onClick={() => setCategory(key)}
                    className={`pill text-xs py-1.5 px-3 ${category === key ? "active" : ""}`}>
                    {c.emoji} {c.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Tags */}
            <div>
              <label className="text-xs text-white/40 block mb-2">Tags</label>
              <div className="flex gap-2 mb-2">
                <input
                  className="input text-sm"
                  type="text"
                  placeholder="#tag..."
                  value={tagInput}
                  onChange={e => setTagInput(e.target.value)}
                  onKeyDown={e => { if (e.key === "Enter" || e.key === ",") { e.preventDefault(); addTag(tagInput); setTagInput(""); } }}
                />
                <button type="button" onClick={() => { addTag(tagInput); setTagInput(""); }} className="btn-secondary px-3 flex-shrink-0">
                  <Tag size={14} />
                </button>
              </div>
              {/* Suggested tags */}
              <div className="flex flex-wrap gap-1.5 mb-2">
                {ALL_TAGS.slice(0, 12).map(t => (
                  <button key={t} type="button" onClick={() => addTag(t)}
                    className={`tag-chip text-[11px] ${tags.includes(t.replace("#","")) ? "selected" : ""}`}>
                    {t}
                  </button>
                ))}
              </div>
              {/* Active tags */}
              {tags.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {tags.map(t => (
                    <span key={t} onClick={() => removeTag(t)} className="tag-chip text-[11px] selected cursor-pointer">
                      #{t} <X size={9} className="ml-1" />
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* Price */}
            <div>
              <label className="text-xs text-white/40 block mb-1.5">Prix unitaire (0 = inclus dans l&apos;abonnement)</label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-white/40 text-sm">€</span>
                <input className="input pl-8" type="number" min="0" max="999" step="0.50" value={price} onChange={e => setPrice(e.target.value)} />
              </div>
            </div>

            {error && <p className="text-red-400 text-sm">{error}</p>}

            <div className="flex gap-3">
              <button type="button" onClick={() => setStep(1)} className="btn-secondary flex-1">
                Retour
              </button>
              <button type="submit" className="btn-primary flex-1" disabled={uploading}>
                {uploading ? <Loader2 size={16} className="animate-spin" /> : "Publier"}
              </button>
            </div>
          </div>
        )}
      </form>
    </div>
  );
}
