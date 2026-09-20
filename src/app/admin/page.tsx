"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase";
import { Upload, ArrowLeft, Loader2, Book, FileText, Image as ImageIcon, CheckCircle } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function AdminPage() {
  const router = useRouter();
  const supabase = createClient();
  
  const [user, setUser] = useState<any>(null);
  const [loadingUser, setLoadingUser] = useState(true);
  
  // Tabs: 1 = Manhwa, 2 = Capítulo, 3 = Páginas
  const [activeTab, setActiveTab] = useState(1);
  const [loading, setLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");

  // Manhwas list (for selection)
  const [manhwas, setManhwas] = useState<any[]>([]);
  // Chapters list (for selection)
  const [chapters, setChapters] = useState<any[]>([]);

  // Form 1: Manhwa
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [coverUrl, setCoverUrl] = useState("");
  const [genre, setGenre] = useState("Fantasía");
  const [score, setScore] = useState(5.0);

  // Form 2: Chapter
  const [selectedManhwaId, setSelectedManhwaId] = useState("");
  const [chapterNum, setChapterNum] = useState(1);
  const [chapterTitle, setChapterTitle] = useState("");

  // Form 3: Pages
  const [selectedChapterId, setSelectedChapterId] = useState("");
  const [uploadMode, setUploadMode] = useState<"manual" | "github">("github");
  const [pageUrls, setPageUrls] = useState("");
  
  // GitHub CDN specific state
  const [ghRepo, setGhRepo] = useState("Nekumi-Archivos");
  const [ghFolder, setGhFolder] = useState("");
  const [ghPagesCount, setGhPagesCount] = useState(10);
  const [ghExtension, setGhExtension] = useState(".jpg");

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session?.user || session.user.email !== 'diazmowi07@gmail.com') {
        router.push("/");
      } else {
        setUser(session.user);
        fetchManhwas();
      }
      setLoadingUser(false);
    });
  }, [router, supabase]);

  const fetchManhwas = async () => {
    const { data } = await supabase.from("manhwas").select("id, title").order("created_at", { ascending: false });
    if (data) setManhwas(data);
  };

  const fetchChapters = async (mId: string) => {
    const { data } = await supabase.from("chapters").select("id, chapter_number, title").eq("manhwa_id", mId).order("chapter_number", { ascending: false });
    if (data) setChapters(data);
  };

  const handleManhwaSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.from("manhwas").insert([{ title, description, cover_url: coverUrl, genre, score }]);
    setLoading(false);
    if (error) alert("Error: " + error.message);
    else {
      setSuccessMsg("¡Manhwa creado con éxito!");
      setTitle(""); setDescription(""); setCoverUrl("");
      fetchManhwas();
      setTimeout(() => setSuccessMsg(""), 3000);
    }
  };

  const handleChapterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedManhwaId) return alert("Selecciona un manhwa");
    setLoading(true);
    const { error } = await supabase.from("chapters").insert([{ manhwa_id: selectedManhwaId, chapter_number: chapterNum, title: chapterTitle }]);
    setLoading(false);
    if (error) alert("Error: " + error.message);
    else {
      setSuccessMsg("¡Capítulo creado con éxito!");
      setChapterTitle("");
      setChapterNum(chapterNum + 1);
      setTimeout(() => setSuccessMsg(""), 3000);
    }
  };

  const handlePagesSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedChapterId) return alert("Selecciona un capítulo");
    
    let urls: string[] = [];

    if (uploadMode === "manual") {
      urls = pageUrls.split("\n").map(url => url.trim()).filter(url => url.length > 0);
      if (urls.length === 0) return alert("No hay URLs para subir");
      
      setLoading(true);
      const insertData = urls.map((url, index) => ({
        chapter_id: selectedChapterId,
        page_number: index + 1,
        image_url: url
      }));
  
      const { error } = await supabase.from("pages").insert(insertData);
      setLoading(false);
      
      if (error) alert("Error: " + error.message);
      else {
        setSuccessMsg(`¡Se subieron ${urls.length} páginas con éxito!`);
        setPageUrls("");
        setTimeout(() => setSuccessMsg(""), 3000);
      }
    } else {
      // Auto-detect using GitHub API
      setLoading(true);
      const cleanFolder = ghFolder.replace(/^\/+|\/+$/g, '');
      const apiUrl = `https://api.github.com/repos/Nexotvofficial/${ghRepo}/contents/${cleanFolder}`;
      
      try {
        const res = await fetch(apiUrl);
        if (!res.ok) throw new Error("No se pudo leer la carpeta en GitHub. Verifica el nombre del repositorio, la ruta, o si el repositorio es privado.");
        
        const files = await res.json();
        
        // Filter only images
        const imageFiles = files.filter((f: any) => 
          f.type === "file" && 
          (f.name.endsWith(".jpg") || f.name.endsWith(".png") || f.name.endsWith(".webp") || f.name.endsWith(".jpeg"))
        );
        
        if (imageFiles.length === 0) throw new Error("No se encontraron imágenes en esa carpeta.");

        // Natural sort (so 2.jpg comes before 10.jpg)
        imageFiles.sort((a: any, b: any) => {
          return a.name.localeCompare(b.name, undefined, { numeric: true, sensitivity: 'base' });
        });

        // Convert to jsDelivr URLs
        const insertData = imageFiles.map((file: any, index: number) => {
          const jsdelivrUrl = `https://cdn.jsdelivr.net/gh/Nexotvofficial/${ghRepo}@main/${cleanFolder}/${file.name}`;
          return {
            chapter_id: selectedChapterId,
            page_number: index + 1,
            image_url: jsdelivrUrl
          };
        });

        const { error } = await supabase.from("pages").insert(insertData);
        if (error) throw error;

        setSuccessMsg(`¡Magia! Se detectaron y subieron ${insertData.length} páginas automáticamente.`);
        setTimeout(() => setSuccessMsg(""), 4000);
      } catch (err: any) {
        alert("Error de Detección: " + err.message);
      } finally {
        setLoading(false);
      }
    }
  };

  if (loadingUser) return <div className="min-h-screen flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin" /></div>;
  if (!user) return null; // router will redirect

  return (
    <div className="min-h-screen py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <Link href="/" className="inline-flex items-center text-[#a7a7b1] hover:text-white transition-colors mb-4">
              <ArrowLeft className="w-4 h-4 mr-2" /> Volver al inicio
            </Link>
            <h1 className="text-3xl font-black flex items-center gap-2"><span className="text-yellow-400">👑</span> Súper Admin</h1>
            <p className="text-[#a7a7b1] mt-1">Control total de la plataforma.</p>
          </div>
          <div className="text-right">
            <p className="text-sm font-semibold">{user.email}</p>
            <p className="text-xs text-[#a855f7]">Acceso Concedido</p>
          </div>
        </div>

        <div className="flex gap-2 mb-6 bg-white/5 p-1 rounded-2xl w-full flex-wrap sm:flex-nowrap">
          <button onClick={() => setActiveTab(1)} className={`flex-1 py-3 px-2 sm:px-4 rounded-xl font-semibold text-xs sm:text-sm transition-all flex items-center justify-center gap-2 ${activeTab === 1 ? "bg-[#a855f7] text-white shadow-lg" : "text-white/60 hover:text-white hover:bg-white/5"}`}>
            <Book className="w-4 h-4 hidden sm:block" /> 1. Crear
          </button>
          <button onClick={() => setActiveTab(2)} className={`flex-1 py-3 px-2 sm:px-4 rounded-xl font-semibold text-xs sm:text-sm transition-all flex items-center justify-center gap-2 ${activeTab === 2 ? "bg-[#a855f7] text-white shadow-lg" : "text-white/60 hover:text-white hover:bg-white/5"}`}>
            <FileText className="w-4 h-4 hidden sm:block" /> 2. Capítulos
          </button>
          <button onClick={() => setActiveTab(3)} className={`flex-1 py-3 px-2 sm:px-4 rounded-xl font-semibold text-xs sm:text-sm transition-all flex items-center justify-center gap-2 ${activeTab === 3 ? "bg-[#a855f7] text-white shadow-lg" : "text-white/60 hover:text-white hover:bg-white/5"}`}>
            <ImageIcon className="w-4 h-4 hidden sm:block" /> 3. Páginas
          </button>
          <button onClick={() => setActiveTab(4)} className={`flex-1 py-3 px-2 sm:px-4 rounded-xl font-semibold text-xs sm:text-sm transition-all flex items-center justify-center gap-2 ${activeTab === 4 ? "bg-[#eab308] text-white shadow-lg" : "text-white/60 hover:text-white hover:bg-white/5"}`}>
            <Book className="w-4 h-4 hidden sm:block" /> 4. Editar
          </button>
          <button onClick={() => setActiveTab(5)} className={`flex-1 py-3 px-2 sm:px-4 rounded-xl font-semibold text-xs sm:text-sm transition-all flex items-center justify-center gap-2 ${activeTab === 5 ? "bg-[#ef4444] text-white shadow-lg" : "text-white/60 hover:text-white hover:bg-white/5"}`}>
            <Book className="w-4 h-4 hidden sm:block" /> 5. Borrar
          </button>
        </div>

        <div className="glass rounded-[22px] p-6 sm:p-10 shadow-2xl">
          {activeTab === 1 && (
            <form onSubmit={handleManhwaSubmit} className="space-y-6 animate-in fade-in zoom-in-95">
              <h2 className="text-xl font-bold border-b border-white/10 pb-4">Crear un Nuevo Manhwa</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div className="space-y-2 sm:col-span-2">
                  <label className="text-sm font-semibold text-white/80 block">Título</label>
                  <input type="text" required value={title} onChange={(e) => setTitle(e.target.value)} className="w-full h-11 rounded-xl border border-white/10 bg-white/5 text-white px-4 text-sm" />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-white/80 block">Género</label>
                  <select value={genre} onChange={(e) => setGenre(e.target.value)} className="w-full h-11 rounded-xl border border-white/10 bg-white/5 text-white px-4 text-sm">
                    <option value="Fantasía" className="bg-[#121216]">Fantasía</option>
                    <option value="Acción" className="bg-[#121216]">Acción</option>
                    <option value="Romance" className="bg-[#121216]">Romance</option>
                    <option value="Drama" className="bg-[#121216]">Drama</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-white/80 block">Puntuación</label>
                  <input type="number" step="0.1" required value={score} onChange={(e) => setScore(parseFloat(e.target.value))} className="w-full h-11 rounded-xl border border-white/10 bg-white/5 text-white px-4 text-sm" />
                </div>
                <div className="space-y-2 sm:col-span-2">
                  <label className="text-sm font-semibold text-white/80 block">URL Portada</label>
                  <input type="url" required value={coverUrl} onChange={(e) => setCoverUrl(e.target.value)} className="w-full h-11 rounded-xl border border-white/10 bg-white/5 text-white px-4 text-sm" />
                </div>
                <div className="space-y-2 sm:col-span-2">
                  <label className="text-sm font-semibold text-white/80 block">Sinopsis</label>
                  <textarea required rows={4} value={description} onChange={(e) => setDescription(e.target.value)} className="w-full rounded-xl border border-white/10 bg-white/5 text-white p-4 text-sm resize-none" />
                </div>
              </div>
              <button type="submit" disabled={loading} className="w-full h-12 rounded-xl bg-gradient-to-r from-[#7c3aed] to-[#d946ef] text-white font-bold transition-all flex items-center justify-center gap-2">
                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Upload className="w-5 h-5" />}
                Crear Manhwa
              </button>
            </form>
          )}

          {activeTab === 4 && (
            <form onSubmit={async (e) => {
              e.preventDefault();
              if (!selectedManhwaId) return alert("Selecciona un manhwa");
              setLoading(true);
              const { error } = await supabase.from("manhwas").update({ title, description, cover_url: coverUrl, genre, score }).eq("id", selectedManhwaId);
              setLoading(false);
              if (error) alert("Error: " + error.message);
              else {
                setSuccessMsg("¡Manhwa actualizado con éxito!");
                fetchManhwas();
                setTimeout(() => setSuccessMsg(""), 3000);
              }
            }} className="space-y-6 animate-in fade-in zoom-in-95">
              <h2 className="text-xl font-bold border-b border-white/10 pb-4 text-yellow-400">Editar Manhwa Existente</h2>
              
              <div className="space-y-2 mb-6">
                <label className="text-sm font-semibold text-white/80 block">Selecciona el Manhwa a editar</label>
                <select required value={selectedManhwaId} onChange={async (e) => {
                  setSelectedManhwaId(e.target.value);
                  if(e.target.value) {
                    const { data } = await supabase.from("manhwas").select("*").eq("id", e.target.value).single();
                    if(data) {
                      setTitle(data.title); setDescription(data.description);
                      setCoverUrl(data.cover_url); setGenre(data.genre); setScore(data.score);
                    }
                  }
                }} className="w-full h-11 rounded-xl border border-yellow-500/30 bg-white/5 text-white px-4 text-sm">
                  <option value="" className="bg-[#121216]">-- Elige un manhwa --</option>
                  {manhwas.map(m => (
                    <option key={m.id} value={m.id} className="bg-[#121216]">{m.title}</option>
                  ))}
                </select>
              </div>

              {selectedManhwaId && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 animate-in fade-in">
                  <div className="space-y-2 sm:col-span-2">
                    <label className="text-sm font-semibold text-white/80 block">Título</label>
                    <input type="text" required value={title} onChange={(e) => setTitle(e.target.value)} className="w-full h-11 rounded-xl border border-white/10 bg-white/5 text-white px-4 text-sm" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-white/80 block">Género</label>
                    <select value={genre} onChange={(e) => setGenre(e.target.value)} className="w-full h-11 rounded-xl border border-white/10 bg-white/5 text-white px-4 text-sm">
                      <option value="Fantasía" className="bg-[#121216]">Fantasía</option>
                      <option value="Acción" className="bg-[#121216]">Acción</option>
                      <option value="Romance" className="bg-[#121216]">Romance</option>
                      <option value="Drama" className="bg-[#121216]">Drama</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-white/80 block">Puntuación</label>
                    <input type="number" step="0.1" required value={score} onChange={(e) => setScore(parseFloat(e.target.value))} className="w-full h-11 rounded-xl border border-white/10 bg-white/5 text-white px-4 text-sm" />
                  </div>
                  <div className="space-y-2 sm:col-span-2">
                    <label className="text-sm font-semibold text-white/80 block">URL Portada</label>
                    <input type="url" required value={coverUrl} onChange={(e) => setCoverUrl(e.target.value)} className="w-full h-11 rounded-xl border border-white/10 bg-white/5 text-white px-4 text-sm" />
                  </div>
                  <div className="space-y-2 sm:col-span-2">
                    <label className="text-sm font-semibold text-white/80 block">Sinopsis</label>
                    <textarea required rows={4} value={description} onChange={(e) => setDescription(e.target.value)} className="w-full rounded-xl border border-white/10 bg-white/5 text-white p-4 text-sm resize-none" />
                  </div>
                  <button type="submit" disabled={loading} className="w-full sm:col-span-2 h-12 rounded-xl bg-yellow-500 hover:bg-yellow-600 text-black font-bold transition-all flex items-center justify-center gap-2">
                    {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Upload className="w-5 h-5" />}
                    Guardar Cambios
                  </button>
                </div>
              )}
            </form>
          )}

          {activeTab === 2 && (
            <form onSubmit={handleChapterSubmit} className="space-y-6 animate-in fade-in zoom-in-95">
              <h2 className="text-xl font-bold border-b border-white/10 pb-4">Crear un Capítulo</h2>
              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-white/80 block">Selecciona el Manhwa</label>
                  <select required value={selectedManhwaId} onChange={(e) => setSelectedManhwaId(e.target.value)} className="w-full h-11 rounded-xl border border-white/10 bg-white/5 text-white px-4 text-sm">
                    <option value="" className="bg-[#121216]">-- Elige un manhwa --</option>
                    {manhwas.map(m => (
                      <option key={m.id} value={m.id} className="bg-[#121216]">{m.title}</option>
                    ))}
                  </select>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-white/80 block">Número del Capítulo</label>
                    <input type="number" required value={chapterNum} onChange={(e) => setChapterNum(parseInt(e.target.value))} className="w-full h-11 rounded-xl border border-white/10 bg-white/5 text-white px-4 text-sm" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-white/80 block">Título (Opcional)</label>
                    <input type="text" value={chapterTitle} onChange={(e) => setChapterTitle(e.target.value)} placeholder="Ej: El inicio" className="w-full h-11 rounded-xl border border-white/10 bg-white/5 text-white px-4 text-sm" />
                  </div>
                </div>
              </div>
              <button type="submit" disabled={loading} className="w-full h-12 rounded-xl bg-[#10b981] hover:bg-[#059669] text-white font-bold transition-all flex items-center justify-center gap-2">
                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Upload className="w-5 h-5" />}
                Crear Capítulo
              </button>
            </form>
          )}

          {activeTab === 3 && (
            <form onSubmit={handlePagesSubmit} className="space-y-6 animate-in fade-in zoom-in-95">
              <h2 className="text-xl font-bold border-b border-white/10 pb-4">Subir Imágenes al Capítulo</h2>
              
              <div className="flex bg-black/40 rounded-xl p-1 mb-6">
                <button type="button" onClick={() => setUploadMode("github")} className={`flex-1 py-2 text-sm font-bold rounded-lg transition-colors ${uploadMode === "github" ? "bg-[#ec4899] text-white" : "text-white/50 hover:text-white"}`}>
                  Archivos desde GitHub (Automático)
                </button>
                <button type="button" onClick={() => setUploadMode("manual")} className={`flex-1 py-2 text-sm font-bold rounded-lg transition-colors ${uploadMode === "manual" ? "bg-[#ec4899] text-white" : "text-white/50 hover:text-white"}`}>
                  Pegar Enlaces Manualmente
                </button>
              </div>

              <div className="space-y-4 border-b border-white/10 pb-6">
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-white/80 block">1. Selecciona el Manhwa</label>
                  <select required value={selectedManhwaId} onChange={(e) => { setSelectedManhwaId(e.target.value); fetchChapters(e.target.value); }} className="w-full h-11 rounded-xl border border-white/10 bg-white/5 text-white px-4 text-sm">
                    <option value="" className="bg-[#121216]">-- Elige un manhwa --</option>
                    {manhwas.map(m => (
                      <option key={m.id} value={m.id} className="bg-[#121216]">{m.title}</option>
                    ))}
                  </select>
                </div>
                {selectedManhwaId && (
                  <div className="space-y-2 animate-in fade-in">
                    <label className="text-sm font-semibold text-white/80 block">2. Selecciona el Capítulo</label>
                    <select required value={selectedChapterId} onChange={(e) => setSelectedChapterId(e.target.value)} className="w-full h-11 rounded-xl border border-white/10 bg-white/5 text-white px-4 text-sm">
                      <option value="" className="bg-[#121216]">-- Elige un capítulo --</option>
                      {chapters.map(c => (
                        <option key={c.id} value={c.id} className="bg-[#121216]">Capítulo {c.chapter_number} {c.title && `- ${c.title}`}</option>
                      ))}
                    </select>
                  </div>
                )}
              </div>

              {uploadMode === "manual" ? (
                <div className="space-y-2 animate-in fade-in pt-2">
                  <label className="text-sm font-semibold text-white/80 block flex justify-between">
                    <span>3. Enlaces de las Imágenes (Una por línea)</span>
                    <span className="text-xs font-normal text-[#a7a7b1]">El orden será la página 1, 2, 3...</span>
                  </label>
                  <textarea required={uploadMode === "manual"} rows={8} value={pageUrls} onChange={(e) => setPageUrls(e.target.value)} placeholder="https://ejemplo.com/pagina1.jpg&#10;https://ejemplo.com/pagina2.jpg" className="w-full rounded-xl border border-white/10 bg-[#0a0a0c] text-white p-4 text-sm font-mono whitespace-pre break-all resize-y" />
                </div>
              ) : (
                <div className="space-y-6 animate-in fade-in pt-2">
                  <div className="p-4 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-200 text-sm">
                    <strong>¡Modo Automágico!</strong> Solo dime en qué repositorio y en qué carpeta están tus imágenes. Yo entraré, leeré todas las imágenes sin importar cómo se llamen, las ordenaré y las publicaré al instante.
                  </div>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-sm font-semibold text-white/80 block">Nombre del Repositorio</label>
                      <input type="text" required={uploadMode === "github"} value={ghRepo} onChange={(e) => setGhRepo(e.target.value)} placeholder="Nekumi-Catalog-02" className="w-full h-11 rounded-xl border border-white/10 bg-white/5 text-white px-4 text-sm" />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-semibold text-white/80 block">Ruta EXACTA de la Carpeta</label>
                      <input type="text" required={uploadMode === "github"} value={ghFolder} onChange={(e) => setGhFolder(e.target.value)} placeholder="catalog/reversal/cap-1" className="w-full h-11 rounded-xl border border-white/10 bg-white/5 text-white px-4 text-sm font-mono" />
                    </div>
                  </div>
                </div>
              )}

              <button type="submit" disabled={loading} className="w-full h-12 mt-6 rounded-xl bg-[#ec4899] hover:bg-[#db2777] text-white font-bold transition-all flex items-center justify-center gap-2">
                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Upload className="w-5 h-5" />}
                {uploadMode === "manual" ? `Subir ${pageUrls.split('\n').filter(l => l.trim()).length} Páginas` : `Detectar y Subir Carpeta`}
              </button>
            </form>
          )}

          {activeTab === 5 && (
            <form onSubmit={async (e) => {
              e.preventDefault();
              if (!selectedManhwaId) return alert("Selecciona un manhwa para borrar");
              const confirmDelete = window.confirm("¿ESTÁS SEGURO? Esto borrará el manhwa, todos sus capítulos, páginas y comentarios. Esta acción no se puede deshacer.");
              if (!confirmDelete) return;

              setLoading(true);
              const { error } = await supabase.from("manhwas").delete().eq("id", selectedManhwaId);
              setLoading(false);

              if (error) {
                alert("Error: " + error.message + "\n\n(Asegúrate de haber ejecutado el SQL de Delete en Supabase)");
              } else {
                setSuccessMsg("¡Manhwa BORRADO con éxito!");
                setSelectedManhwaId("");
                fetchManhwas();
                setTimeout(() => setSuccessMsg(""), 3000);
              }
            }} className="space-y-6 animate-in fade-in zoom-in-95">
              <h2 className="text-xl font-bold border-b border-white/10 pb-4 text-red-500">Borrar Manhwa Peligro ⚠️</h2>
              
              <div className="space-y-2 mb-6">
                <label className="text-sm font-semibold text-white/80 block">Selecciona el Manhwa a ELIMINAR</label>
                <select required value={selectedManhwaId} onChange={(e) => setSelectedManhwaId(e.target.value)} className="w-full h-11 rounded-xl border border-red-500/30 bg-white/5 text-white px-4 text-sm">
                  <option value="" className="bg-[#121216]">-- Elige un manhwa --</option>
                  {manhwas.map(m => (
                    <option key={m.id} value={m.id} className="bg-[#121216]">{m.title}</option>
                  ))}
                </select>
              </div>

              <button type="submit" disabled={loading} className="w-full h-12 mt-6 rounded-xl bg-red-500 hover:bg-red-600 text-white font-bold transition-all flex items-center justify-center gap-2 shadow-lg shadow-red-500/20">
                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Book className="w-5 h-5" />}
                Eliminar Manhwa y todo su contenido
              </button>
            </form>
          )}

          {successMsg && (
            <div className="mt-6 p-4 bg-[#10b981]/10 border border-[#10b981]/30 rounded-xl flex items-center gap-3 text-[#34d399] animate-in fade-in slide-in-from-bottom-2">
              <CheckCircle className="w-5 h-5 flex-shrink-0" />
              <p className="text-sm font-medium">{successMsg}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
