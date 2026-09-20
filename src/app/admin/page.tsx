"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase";
import { Upload, Plus, Image as ImageIcon, CheckCircle, ArrowLeft, Loader2 } from "lucide-react";
import Link from "next/link";

export default function AdminPage() {
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [user, setUser] = useState<any>(null);
  
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [coverUrl, setCoverUrl] = useState("");
  const [genre, setGenre] = useState("Fantasía");
  const [score, setScore] = useState(5.0);

  const supabase = createClient();

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
    });
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setSuccess(false);

    try {
      const { error } = await supabase.from("manhwas").insert([
        {
          title,
          description,
          cover_url: coverUrl,
          genre,
          score,
        },
      ]);

      if (error) throw error;
      
      setSuccess(true);
      setTitle("");
      setDescription("");
      setCoverUrl("");
      setGenre("Fantasía");
      setScore(5.0);
      
      setTimeout(() => setSuccess(false), 3000);
    } catch (error: any) {
      alert("Error al subir manhwa: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  if (user === null) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="glass p-8 rounded-2xl text-center max-w-md w-full">
          <h2 className="text-xl font-bold mb-4">Acceso Denegado</h2>
          <p className="text-[#a7a7b1] mb-6">Debes iniciar sesión para acceder al panel de administración.</p>
          <Link href="/" className="btn btn-primary inline-flex">
            Volver al inicio
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl mx-auto">
        <div className="mb-8">
          <Link href="/" className="inline-flex items-center text-[#a7a7b1] hover:text-white transition-colors mb-4">
            <ArrowLeft className="w-4 h-4 mr-2" /> Volver al inicio
          </Link>
          <h1 className="text-3xl font-black">Panel de Administración</h1>
          <p className="text-[#a7a7b1] mt-1">Sube un nuevo manhwa a la base de datos de Nekutoon.</p>
        </div>

        <div className="glass rounded-[22px] p-6 sm:p-10 shadow-2xl">
          <form onSubmit={handleSubmit} className="space-y-6">
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div className="space-y-2 sm:col-span-2">
                <label className="text-sm font-semibold text-white/80 block">Título del Manhwa</label>
                <input 
                  type="text" 
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Ej: Solo Leveling" 
                  className="w-full h-11 rounded-xl border border-white/10 bg-white/5 text-white px-4 text-sm transition-all focus:outline-none focus:border-[#a855f7]/55 focus:ring-4 focus:ring-[#8b5cf6]/10"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-semibold text-white/80 block">Género</label>
                <select 
                  value={genre}
                  onChange={(e) => setGenre(e.target.value)}
                  className="w-full h-11 rounded-xl border border-white/10 bg-white/5 text-white px-4 text-sm transition-all focus:outline-none focus:border-[#a855f7]/55 appearance-none"
                >
                  <option value="Fantasía" className="bg-[#121216]">Fantasía</option>
                  <option value="Acción" className="bg-[#121216]">Acción</option>
                  <option value="Romance" className="bg-[#121216]">Romance</option>
                  <option value="Isekai" className="bg-[#121216]">Isekai</option>
                  <option value="Drama" className="bg-[#121216]">Drama</option>
                  <option value="Aventura" className="bg-[#121216]">Aventura</option>
                  <option value="Comedia" className="bg-[#121216]">Comedia</option>
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-semibold text-white/80 block">Puntuación Inicial</label>
                <input 
                  type="number" 
                  step="0.1" 
                  min="0" 
                  max="5"
                  required
                  value={score}
                  onChange={(e) => setScore(parseFloat(e.target.value))}
                  className="w-full h-11 rounded-xl border border-white/10 bg-white/5 text-white px-4 text-sm transition-all focus:outline-none focus:border-[#a855f7]/55 focus:ring-4 focus:ring-[#8b5cf6]/10"
                />
              </div>

              <div className="space-y-2 sm:col-span-2">
                <label className="text-sm font-semibold text-white/80 block">URL de la Portada</label>
                <div className="relative">
                  <ImageIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#777782]" />
                  <input 
                    type="url" 
                    required
                    value={coverUrl}
                    onChange={(e) => setCoverUrl(e.target.value)}
                    placeholder="https://ejemplo.com/portada.jpg" 
                    className="w-full h-11 rounded-xl border border-white/10 bg-white/5 text-white pl-10 pr-4 text-sm transition-all focus:outline-none focus:border-[#a855f7]/55 focus:ring-4 focus:ring-[#8b5cf6]/10"
                  />
                </div>
                <p className="text-xs text-[#a7a7b1]">Copia y pega el link de una imagen temporalmente. Próximamente añadiremos subida de archivos.</p>
              </div>

              <div className="space-y-2 sm:col-span-2">
                <label className="text-sm font-semibold text-white/80 block">Sinopsis</label>
                <textarea 
                  required
                  rows={4}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="¿De qué trata la historia?" 
                  className="w-full rounded-xl border border-white/10 bg-white/5 text-white p-4 text-sm transition-all focus:outline-none focus:border-[#a855f7]/55 focus:ring-4 focus:ring-[#8b5cf6]/10 resize-none"
                />
              </div>
            </div>

            <button 
              type="submit" 
              disabled={loading}
              className="w-full h-12 rounded-xl bg-gradient-to-r from-[#7c3aed] to-[#d946ef] text-white font-bold shadow-[0_10px_28px_rgba(139,92,246,0.27)] hover:-translate-y-[2px] hover:shadow-[0_14px_35px_rgba(217,70,239,0.35)] transition-all flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Upload className="w-5 h-5" />}
              {loading ? "Subiendo..." : "Publicar Manhwa"}
            </button>
            
            {success && (
              <div className="p-4 bg-[#8b5cf6]/10 border border-[#8b5cf6]/30 rounded-xl flex items-center gap-3 text-[#a78bfa] animate-in fade-in slide-in-from-bottom-2">
                <CheckCircle className="w-5 h-5 flex-shrink-0" />
                <p className="text-sm font-medium">¡Manhwa subido con éxito! Ya puedes verlo en la página principal.</p>
              </div>
            )}
          </form>
        </div>
      </div>
    </div>
  );
}
