"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Shield, BookOpen, FileText, Image as ImageIcon, Zap, LogOut,
  Users, MessageSquare, AlertCircle, BarChart3, Settings,
  Search, Bell, Plus, Edit2, Trash2, CheckCircle, Loader2,
  Menu, X, Upload, Calendar, ArrowUpRight, Clock
} from "lucide-react";

export default function AdminProDashboard() {
  const router = useRouter();
  const supabase = createClient();

  // Autenticación
  const [user, setUser] = useState<any>(null);
  const [loadingUser, setLoadingUser] = useState(true);

  // Vistas
  const [activeView, setActiveView] = useState<"dashboard" | "manhwas" | "chapters" | "pages" | "automator" | "users" | "reviews">("dashboard");
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  // Estados Globales (Dashboard)
  const [usersList, setUsersList] = useState<any[]>([]);
  const [reviewsList, setReviewsList] = useState<any[]>([]);
  const [stats, setStats] = useState({ manhwas: 0, chapters: 0, users: 0, views: 245672 });
  const [recentChapters, setRecentChapters] = useState<any[]>([]);

  // Estados de Manhwas
  const [manhwas, setManhwas] = useState<any[]>([]);
  const [isAddManhwaOpen, setIsAddManhwaOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [author, setAuthor] = useState("");
  const [artist, setArtist] = useState("");
  const [coverUrl, setCoverUrl] = useState("");
  const [bannerUrl, setBannerUrl] = useState("");
  const [genre, setGenre] = useState("Acción");
  const [status, setStatus] = useState("Publicado");
  const [type, setType] = useState("Manhwa");
  const [isHero, setIsHero] = useState(false);

  // Estados de Capítulos
  const [chapters, setChapters] = useState<any[]>([]);
  const [selectedManhwaId, setSelectedManhwaId] = useState("");
  const [chapterNum, setChapterNum] = useState<number | "">("");
  const [chapterTitle, setChapterTitle] = useState("");

  // Estados de Páginas
  const [selectedChapterId, setSelectedChapterId] = useState("");
  const [uploadMode, setUploadMode] = useState<"github" | "manual">("github");
  const [ghRepo, setGhRepo] = useState("");
  const [ghFolder, setGhFolder] = useState("");
  const [manualUrls, setManualUrls] = useState("");

  // Automatizador
  const [bulkManhwaId, setBulkManhwaId] = useState("");
  const [bulkRepo, setBulkRepo] = useState("Nekumi-Catalog-04");
  const [bulkPath, setBulkPath] = useState("");
  const [bulkLoading, setBulkLoading] = useState(false);
  const [bulkProgress, setBulkProgress] = useState("");

  // UI States
  const [loading, setLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session?.user || session.user.email !== 'diazmowi07@gmail.com') {
        router.push("/");
      } else {
        setUser(session.user);
        loadDashboardData();
      }
      setLoadingUser(false);
    });
  }, [router, supabase]);

  const loadDashboardData = async () => {
    // 1. Stats
    const { count: mCount } = await supabase.from("manhwas").select("*", { count: "exact", head: true });
    const { count: cCount } = await supabase.from("chapters").select("*", { count: "exact", head: true });
    const { count: uCount } = await supabase.from("profiles").select("*", { count: "exact", head: true });
    setStats({ manhwas: mCount || 0, chapters: cCount || 0, users: uCount || 0, views: 245672 });

    // 2. Recent chapters
    const { data: recent } = await supabase
      .from("chapters")
      .select("*, manhwa:manhwas(title)")
      .order("created_at", { ascending: false })
      .limit(5);
    if (recent) setRecentChapters(recent);

    // 3. Manhwas list (needed for selects and table)
    const { data: mData } = await supabase.from("manhwas").select("*").order("created_at", { ascending: false });
    if (mData) setManhwas(mData);

    const { data: uData } = await supabase.from('profiles').select('*').order('created_at', { ascending: false });
    if (uData) setUsersList(uData);

    const { data: rData } = await supabase.from('reviews').select('*, manhwa:manhwas(title)').order('created_at', { ascending: false });
    if (rData) setReviewsList(rData);
  };

  const handleDeleteReview = async (id: string) => { if (!confirm('¿Borrar este comentario?')) return; await supabase.from('reviews').delete().eq('id', id); setReviewsList(prev => prev.filter(r => r.id !== id)); setSuccessMsg('Comentario eliminado'); setTimeout(() => setSuccessMsg(''), 3000); };

  const fetchChapters = async (mId: string) => {
    const { data } = await supabase.from("chapters").select("*").eq("manhwa_id", mId).order("chapter_number", { ascending: false });
    if (data) setChapters(data);
  };

  const handleCreateManhwa = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.from("manhwas").insert({
      title, description, author, artist, status, type,
      genre: [genre], cover_url: coverUrl, banner_url: bannerUrl, is_hero: isHero
    });
    setLoading(false);
    if (error) { alert("Error: " + error.message); } 
    else {
      setSuccessMsg("Manhwa creado con éxito");
      setIsAddManhwaOpen(false);
      loadDashboardData();
      setTimeout(() => setSuccessMsg(""), 3000);
    }
  };

  const handleCreateChapter = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedManhwaId) return alert("Selecciona un manhwa");
    setLoading(true);
    const { error } = await supabase.from("chapters").insert({
      manhwa_id: selectedManhwaId, chapter_number: Number(chapterNum), title: chapterTitle
    });
    setLoading(false);
    if (error) alert("Error: " + error.message);
    else {
      setSuccessMsg("Capítulo creado");
      setChapterNum(""); setChapterTitle("");
      fetchChapters(selectedManhwaId);
      setTimeout(() => setSuccessMsg(""), 3000);
    }
  };

  const handleAddPages = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedChapterId) return alert("Selecciona un capítulo");
    setLoading(true);

    try {
      if (uploadMode === "github") {
        const res = await fetch(`https://api.github.com/repos/Nexotvofficial/${ghRepo}/contents/${ghFolder}`);
        if (!res.ok) throw new Error("Ruta no encontrada en GitHub.");
        const files = await res.json();
        const imageFiles = files.filter((f: any) => f.name.match(/\.(jpg|jpeg|png|webp|gif)$/i))
                                .sort((a: any, b: any) => a.name.localeCompare(b.name, undefined, { numeric: true, sensitivity: 'base' }));
        if (imageFiles.length === 0) throw new Error("No hay imágenes.");

        const pagesToInsert = imageFiles.map((f: any, idx: number) => ({
          chapter_id: selectedChapterId, page_number: idx + 1,
          image_url: `https://cdn.jsdelivr.net/gh/Nexotvofficial/${ghRepo}@main/${f.path}`
        }));
        const { error } = await supabase.from("pages").insert(pagesToInsert);
        if (error) throw error;
      } else {
        const urls = manualUrls.split('\n').map(u => u.trim()).filter(u => u);
        const pagesToInsert = urls.map((url, idx) => ({
          chapter_id: selectedChapterId, page_number: idx + 1, image_url: url
        }));
        const { error } = await supabase.from("pages").insert(pagesToInsert);
        if (error) throw error;
      }
      setSuccessMsg(`Páginas agregadas con éxito`);
      setGhFolder(""); setManualUrls("");
    } catch (err: any) { alert("Error: " + err.message); }
    setLoading(false);
    setTimeout(() => setSuccessMsg(""), 3000);
  };

  const handleBulkImport = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!bulkManhwaId || !bulkPath || !bulkRepo) return alert("Faltan datos");
    
    setBulkLoading(true);
    setBulkProgress(`Obteniendo árbol desde ${bulkRepo}...`);

    try {
      const res = await fetch(`https://api.github.com/repos/Nexotvofficial/${bulkRepo}/git/trees/main?recursive=1`);
      const data = await res.json();
      if (!data.tree) throw new Error("No se pudo obtener el repo.");

      const basePath = bulkPath.replace(/^\/|\/$/g, '');
      const files = data.tree.filter((f: any) => f.path.startsWith(basePath + '/') && f.type === 'blob' && /\.(jpg|jpeg|png|webp|gif)$/i.test(f.path));
      setBulkProgress(`Agrupando capítulos...`);

      const chaptersMap: Record<string, string[]> = {};
      files.forEach((file: any) => {
        const relPath = file.path.substring(basePath.length + 1);
        const parts = relPath.split('/');
        if (parts.length >= 2) {
          const folderName = parts[0];
          if (!chaptersMap[folderName]) chaptersMap[folderName] = [];
          chaptersMap[folderName].push(file.path);
        }
      });

      const folderNames = Object.keys(chaptersMap);
      if (folderNames.length === 0) throw new Error("No hay carpetas.");

      let current = 0;
      for (const folder of folderNames) {
        current++;
        setBulkProgress(`Procesando ${folder} (${current}/${folderNames.length})...`);
        const match = folder.match(/\d+(\.\d+)?/);
        const chapNum = match ? parseFloat(match[0]) : current;

        const { data: chapData, error: chapErr } = await supabase.from("chapters").insert({
          manhwa_id: bulkManhwaId, chapter_number: chapNum, title: folder
        }).select().single();

        if (chapErr || !chapData) continue;

        const chapFiles = chaptersMap[folder].sort((a, b) => a.localeCompare(b, undefined, { numeric: true, sensitivity: 'base' }));
        const pagesToInsert = chapFiles.map((path, idx) => ({
          chapter_id: chapData.id, page_number: idx + 1,
          image_url: `https://cdn.jsdelivr.net/gh/Nexotvofficial/${bulkRepo}@main/${path}`
        }));
        await supabase.from("pages").insert(pagesToInsert);
      }
      setSuccessMsg(`¡Magia completa! ${folderNames.length} capítulos importados.`);
      setTimeout(() => setSuccessMsg(""), 5000);
      setBulkPath("");
      loadDashboardData();
    } catch (err: any) { alert("Error masivo: " + err.message); } 
    finally { setBulkLoading(false); setBulkProgress(""); }
  };

  if (loadingUser) return <div className="min-h-screen bg-[#050505] flex items-center justify-center"><Loader2 className="w-10 h-10 animate-spin text-[#a855f7]" /></div>;

  const SidebarItem = ({ id, icon: Icon, label }: any) => (
    <button 
      onClick={() => setActiveView(id)}
      className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${activeView === id ? 'bg-[#a855f7]/20 text-[#c084fc] font-semibold' : 'text-[#a7a7b1] hover:bg-white/5 hover:text-white'}`}
    >
      <Icon className="w-5 h-5" /> {label}
    </button>
  );

  return (
    <div className="min-h-screen bg-[#050505] flex text-white font-sans overflow-hidden">
      
      {/* Sidebar */}
      <aside className={`fixed lg:static inset-y-0 left-0 z-40 w-64 bg-[#0a0a0c] border-r border-white/5 transform transition-transform duration-300 ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}>
        <div className="p-6 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#a855f7] to-[#7c3aed] flex items-center justify-center shadow-lg shadow-[#a855f7]/20">
            <svg viewBox="0 0 44 44" className="w-6 h-6 fill-white"><path d="M8 32.5V11.7c0-2.2 2.7-3.2 4.2-1.6L28 27.2V10.9c0-1.6 1.3-2.9 2.9-2.9h2.2c1.6 0 2.9 1.3 2.9 2.9v21c0 2.1-2.6 3.2-4.1 1.7L16 16.4v16.1c0 1.9-1.5 3.5-3.5 3.5h-1C9.6 36 8 34.4 8 32.5Z" /></svg>
          </div>
          <div>
            <h1 className="font-bold text-xl leading-none">Nekumi</h1>
            <p className="text-[10px] text-[#a7a7b1] tracking-widest uppercase">Admin Pro</p>
          </div>
        </div>

        <nav className="px-4 space-y-2 mt-4 overflow-y-auto h-[calc(100vh-100px)] custom-scrollbar">
          <SidebarItem id="dashboard" icon={BarChart3} label="Dashboard" />
          <SidebarItem id="manhwas" icon={BookOpen} label="Manhwas" />
          <SidebarItem id="chapters" icon={FileText} label="Capítulos" />
          <SidebarItem id="pages" icon={ImageIcon} label="Páginas" />
          
          <div className="pt-4 pb-2">
            <p className="text-xs font-semibold text-white/30 uppercase tracking-wider px-4">Herramientas</p>
          </div>
          <SidebarItem id="automator" icon={Zap} label="Automatizador" />
          
          <div className="pt-4 pb-2">
            <p className="text-xs font-semibold text-white/30 uppercase tracking-wider px-4">Comunidad</p>
          </div>
          <SidebarItem id="users" icon={Users} label="Usuarios" />
          <SidebarItem id="reviews" icon={MessageSquare} label="Comentarios" />
          <button className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-white/30 cursor-not-allowed"><AlertCircle className="w-5 h-5" /> Reportes</button>
        </nav>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden">
        
        {/* Top Header */}
        <header className="h-20 bg-[#0a0a0c]/80 backdrop-blur-md border-b border-white/5 flex items-center justify-between px-6 z-30">
          <div className="flex items-center gap-4">
            <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="lg:hidden text-white/70 hover:text-white">
              <Menu className="w-6 h-6" />
            </button>
            <div className="relative hidden md:block w-96">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
              <input type="text" placeholder="Buscar en toda la plataforma..." className="w-full h-10 bg-[#121216] border border-white/10 rounded-full pl-10 pr-4 text-sm focus:border-[#a855f7] outline-none transition-all" />
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            <button className="w-10 h-10 rounded-full flex items-center justify-center bg-[#121216] border border-white/10 text-white/70 hover:text-white relative">
              <Bell className="w-5 h-5" />
              <span className="absolute top-2 right-2.5 w-2 h-2 bg-[#ec4899] rounded-full"></span>
            </button>
            <div className="h-8 w-px bg-white/10 mx-1"></div>
            <div className="flex items-center gap-3">
              <div className="text-right hidden sm:block">
                <p className="text-sm font-bold text-white leading-tight">Admin</p>
                <p className="text-xs text-[#a7a7b1]">Administrator</p>
              </div>
              <div className="w-10 h-10 rounded-full bg-[#a855f7]/20 border border-[#a855f7]/50 flex items-center justify-center text-[#c084fc] font-bold">
                A
              </div>
            </div>
          </div>
        </header>

        {/* Scrollable Workspace */}
        <main className="flex-1 overflow-y-auto p-6 md:p-8 custom-scrollbar relative">
          
          {/* Toast Notification */}
          {successMsg && (
            <div className="fixed top-24 right-8 bg-[#10b981]/10 border border-[#10b981]/30 text-[#34d399] px-4 py-3 rounded-xl flex items-center gap-3 shadow-lg shadow-black/50 animate-in slide-in-from-right-4 z-50">
              <CheckCircle className="w-5 h-5" /> {successMsg}
            </div>
          )}

          <div className="max-w-7xl mx-auto space-y-8 animate-in fade-in zoom-in-95 duration-300">
            
            {/* VISTA 1: DASHBOARD */}
            {activeView === "dashboard" && (
              <>
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                  <div>
                    <h2 className="text-3xl font-bold text-white tracking-tight">Panel de administración</h2>
                    <p className="text-[#a7a7b1] mt-1">Gestiona el contenido, usuarios y toda la plataforma de Nekumi.</p>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-[#a7a7b1]">
                    <Calendar className="w-4 h-4" /> {new Date().toLocaleDateString('es-ES', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                  </div>
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  {[
                    { label: "Manhwas", value: stats.manhwas, icon: BookOpen, color: "text-[#c084fc]", bg: "bg-[#a855f7]/10" },
                    { label: "Capítulos", value: stats.chapters, icon: FileText, color: "text-[#60a5fa]", bg: "bg-[#3b82f6]/10" },
                    { label: "Usuarios", value: stats.users, icon: Users, color: "text-[#34d399]", bg: "bg-[#10b981]/10" },
                    { label: "Visitas", value: stats.views.toLocaleString(), icon: BarChart3, color: "text-[#fbbf24]", bg: "bg-[#f59e0b]/10" },
                  ].map((stat, i) => (
                    <div key={i} className="bg-[#121216] border border-white/5 rounded-2xl p-5 flex items-center gap-4">
                      <div className={`w-14 h-14 rounded-xl flex items-center justify-center ${stat.bg} ${stat.color}`}>
                        <stat.icon className="w-7 h-7" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-[#a7a7b1]">{stat.label}</p>
                        <h3 className="text-2xl font-bold text-white">{stat.value}</h3>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  {/* Recent Chapters */}
                  <div className="lg:col-span-2 bg-[#121216] border border-white/5 rounded-2xl p-6">
                    <div className="flex items-center justify-between mb-6">
                      <h3 className="text-lg font-bold text-white flex items-center gap-2"><Clock className="w-5 h-5 text-[#a855f7]" /> Último contenido publicado</h3>
                      <button onClick={() => setActiveView("chapters")} className="text-sm text-[#c084fc] hover:text-white transition-colors">Ver todo &rarr;</button>
                    </div>
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm text-left">
                        <thead className="text-[#a7a7b1] border-b border-white/5">
                          <tr>
                            <th className="pb-3 font-medium">Manhwa</th>
                            <th className="pb-3 font-medium">Capítulo</th>
                            <th className="pb-3 font-medium">Fecha</th>
                            <th className="pb-3 font-medium text-right">Estado</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                          {recentChapters.map((chap) => (
                            <tr key={chap.id} className="hover:bg-white/5 transition-colors">
                              <td className="py-4 font-semibold text-white">{chap.manhwa?.title}</td>
                              <td className="py-4 text-[#a7a7b1]">Capítulo {chap.chapter_number}</td>
                              <td className="py-4 text-[#a7a7b1]">{new Date(chap.created_at).toLocaleString()}</td>
                              <td className="py-4 text-right"><span className="inline-block px-2.5 py-1 rounded-full text-xs font-semibold bg-[#10b981]/20 text-[#34d399]">Publicado</span></td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* Quick Actions */}
                  <div className="bg-[#121216] border border-white/5 rounded-2xl p-6">
                    <h3 className="text-lg font-bold text-white flex items-center gap-2 mb-6"><Zap className="w-5 h-5 text-[#f59e0b]" /> Acciones rápidas</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-3">
                      <button onClick={() => { setActiveView("manhwas"); setIsAddManhwaOpen(true); }} className="flex items-center gap-4 p-4 rounded-xl bg-white/5 border border-white/5 hover:bg-white/10 hover:border-[#a855f7]/30 transition-all text-left">
                        <div className="w-10 h-10 rounded-full bg-[#a855f7]/20 flex items-center justify-center text-[#c084fc]"><Plus className="w-5 h-5" /></div>
                        <div><p className="font-bold text-white text-sm">Nuevo manhwa</p><p className="text-xs text-[#a7a7b1]">Agregar serie</p></div>
                      </button>
                      <button onClick={() => setActiveView("chapters")} className="flex items-center gap-4 p-4 rounded-xl bg-white/5 border border-white/5 hover:bg-white/10 hover:border-[#3b82f6]/30 transition-all text-left">
                        <div className="w-10 h-10 rounded-full bg-[#3b82f6]/20 flex items-center justify-center text-[#60a5fa]"><FileText className="w-5 h-5" /></div>
                        <div><p className="font-bold text-white text-sm">Nuevo capítulo</p><p className="text-xs text-[#a7a7b1]">Subir capítulo</p></div>
                      </button>
                      <button onClick={() => setActiveView("automator")} className="flex items-center gap-4 p-4 rounded-xl bg-gradient-to-r from-[#a855f7]/10 to-[#ec4899]/10 border border-[#a855f7]/30 hover:border-[#a855f7] transition-all text-left shadow-[0_0_15px_rgba(168,85,247,0.15)]">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-r from-[#a855f7] to-[#ec4899] flex items-center justify-center text-white"><Zap className="w-5 h-5" /></div>
                        <div><p className="font-bold text-white text-sm">Automatizador</p><p className="text-xs text-white/70">Subida masiva</p></div>
                      </button>
                    </div>
                  </div>
                </div>
              </>
            )}

            {/* VISTA 2: MANHWAS */}
            {activeView === "manhwas" && (
              <div className="flex gap-6 relative">
                <div className={`flex-1 bg-[#121216] border border-white/5 rounded-2xl p-6 transition-all duration-300 ${isAddManhwaOpen ? 'lg:w-2/3' : 'w-full'}`}>
                  <div className="flex flex-col sm:flex-row justify-between gap-4 mb-6">
                    <div>
                      <h3 className="text-lg font-bold text-white flex items-center gap-2"><BookOpen className="w-5 h-5 text-[#a855f7]" /> Gestión de manhwas</h3>
                      <p className="text-sm text-[#a7a7b1]">Administra el catálogo de la plataforma.</p>
                    </div>
                    <button onClick={() => setIsAddManhwaOpen(!isAddManhwaOpen)} className="btn bg-[#a855f7] hover:bg-[#9333ea] text-white flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold shadow-lg shadow-[#a855f7]/20">
                      {isAddManhwaOpen ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4" />} {isAddManhwaOpen ? 'Cerrar panel' : 'Nuevo manhwa'}
                    </button>
                  </div>
                  
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                      <thead className="text-[#a7a7b1] border-b border-white/5">
                        <tr>
                          <th className="pb-3 font-medium">Portada</th>
                          <th className="pb-3 font-medium">Título</th>
                          <th className="pb-3 font-medium">Género</th>
                          <th className="pb-3 font-medium">Estado</th>
                          <th className="pb-3 font-medium text-right">Acciones</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-white/5">
                        {manhwas.map((m) => (
                          <tr key={m.id} className="hover:bg-white/5 transition-colors">
                            <td className="py-3">
                              <img src={m.cover_url} alt={m.title} className="w-10 h-14 object-cover rounded-md border border-white/10" />
                            </td>
                            <td className="py-3 font-semibold text-white max-w-[200px] truncate">{m.title}</td>
                            <td className="py-3 text-[#a7a7b1]">{m.genre?.[0] || '-'}</td>
                            <td className="py-3"><span className="inline-block px-2.5 py-1 rounded-full text-xs font-semibold bg-[#10b981]/20 text-[#34d399]">{m.status || 'Publicado'}</span></td>
                            <td className="py-3 text-right">
                              <div className="flex justify-end gap-2">
                                <button className="p-2 bg-white/5 hover:bg-white/10 rounded-lg text-white transition-colors" title="Editar"><Edit2 className="w-4 h-4" /></button>
                                <button className="p-2 bg-[#ef4444]/10 hover:bg-[#ef4444]/20 rounded-lg text-[#ef4444] transition-colors" title="Borrar"><Trash2 className="w-4 h-4" /></button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Formulario lateral */}
                {isAddManhwaOpen && (
                  <div className="w-full lg:w-1/3 bg-[#121216] border border-white/5 rounded-2xl p-6 h-fit shrink-0 animate-in slide-in-from-right-8 fade-in">
                    <h3 className="text-lg font-bold text-white flex items-center gap-2 mb-6 border-b border-white/5 pb-4"><Plus className="w-5 h-5 text-[#a855f7]" /> Agregar nuevo manhwa</h3>
                    <form onSubmit={handleCreateManhwa} className="space-y-4">
                      <div className="space-y-1">
                        <label className="text-xs font-semibold text-[#a7a7b1] uppercase tracking-wider">Título</label>
                        <input type="text" required value={title} onChange={e => setTitle(e.target.value)} className="w-full h-10 bg-black/30 border border-white/10 rounded-xl px-3 text-sm text-white focus:border-[#a855f7] outline-none transition-colors" placeholder="Ej. Solo Leveling" />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1">
                          <label className="text-xs font-semibold text-[#a7a7b1] uppercase tracking-wider">Género</label>
                          <select value={genre} onChange={e => setGenre(e.target.value)} className="w-full h-10 bg-black/30 border border-white/10 rounded-xl px-3 text-sm text-white focus:border-[#a855f7] outline-none transition-colors">
                            <option value="Acción" className="bg-[#121216]">Acción</option>
                            <option value="Romance" className="bg-[#121216]">Romance</option>
                            <option value="Fantasía" className="bg-[#121216]">Fantasía</option>
                            <option value="+18" className="bg-[#121216]">+18</option>
                          </select>
                        </div>
                        <div className="space-y-1">
                          <label className="text-xs font-semibold text-[#a7a7b1] uppercase tracking-wider">Estado</label>
                          <select value={status} onChange={e => setStatus(e.target.value)} className="w-full h-10 bg-black/30 border border-white/10 rounded-xl px-3 text-sm text-white focus:border-[#a855f7] outline-none transition-colors">
                            <option value="Publicado" className="bg-[#121216]">Publicado</option>
                            <option value="En pausa" className="bg-[#121216]">En pausa</option>
                          </select>
                        </div>
                      </div>
                      <div className="space-y-1">
                        <label className="text-xs font-semibold text-[#a7a7b1] uppercase tracking-wider">Descripción</label>
                        <textarea required value={description} onChange={e => setDescription(e.target.value)} className="w-full h-24 bg-black/30 border border-white/10 rounded-xl p-3 text-sm text-white focus:border-[#a855f7] outline-none transition-colors resize-none" placeholder="Sinopsis..." />
                      </div>
                      <div className="space-y-1">
                        <label className="text-xs font-semibold text-[#a7a7b1] uppercase tracking-wider">Portada (URL)</label>
                        <input type="text" required value={coverUrl} onChange={e => setCoverUrl(e.target.value)} className="w-full h-10 bg-black/30 border border-white/10 rounded-xl px-3 text-sm text-white focus:border-[#a855f7] outline-none transition-colors" placeholder="https://..." />
                      </div>
                      <div className="space-y-1">
                        <label className="text-xs font-semibold text-[#a7a7b1] uppercase tracking-wider">Banner (URL)</label>
                        <input type="text" value={bannerUrl} onChange={e => setBannerUrl(e.target.value)} className="w-full h-10 bg-black/30 border border-white/10 rounded-xl px-3 text-sm text-white focus:border-[#a855f7] outline-none transition-colors" placeholder="Opcional..." />
                      </div>
                      
                      <div className="pt-4 flex gap-3">
                        <button type="button" onClick={() => setIsAddManhwaOpen(false)} className="flex-1 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-white font-semibold transition-colors">Cancelar</button>
                        <button type="submit" disabled={loading} className="flex-1 py-2.5 rounded-xl bg-[#a855f7] hover:bg-[#9333ea] text-white font-bold transition-colors flex items-center justify-center gap-2">
                          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Guardar manhwa"}
                        </button>
                      </div>
                    </form>
                  </div>
                )}
              </div>
            )}

            {/* VISTA 3: CAPÍTULOS */}
            {activeView === "chapters" && (
              <div className="bg-[#121216] border border-white/5 rounded-2xl p-6 max-w-3xl">
                <h3 className="text-lg font-bold text-white flex items-center gap-2 mb-6 border-b border-white/5 pb-4"><FileText className="w-5 h-5 text-[#3b82f6]" /> Nuevo Capítulo</h3>
                <form onSubmit={handleCreateChapter} className="space-y-6">
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-white/80 block">Selecciona el Manhwa</label>
                    <select required value={selectedManhwaId} onChange={(e) => setSelectedManhwaId(e.target.value)} className="w-full h-11 rounded-xl border border-white/10 bg-black/30 text-white px-4 text-sm focus:border-[#a855f7] outline-none">
                      <option value="" className="bg-[#121216]">-- Elige un manhwa --</option>
                      {manhwas.map(m => <option key={m.id} value={m.id} className="bg-[#121216]">{m.title}</option>)}
                    </select>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-sm font-semibold text-white/80 block">Número de Capítulo</label>
                      <input type="number" required value={chapterNum} onChange={e => setChapterNum(Number(e.target.value))} className="w-full h-11 rounded-xl border border-white/10 bg-black/30 text-white px-4 text-sm focus:border-[#a855f7] outline-none" />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-semibold text-white/80 block">Título (Opcional)</label>
                      <input type="text" value={chapterTitle} onChange={e => setChapterTitle(e.target.value)} placeholder="Ej: El inicio" className="w-full h-11 rounded-xl border border-white/10 bg-black/30 text-white px-4 text-sm focus:border-[#a855f7] outline-none" />
                    </div>
                  </div>
                  <button type="submit" disabled={loading} className="w-full h-11 rounded-xl bg-[#3b82f6] hover:bg-[#2563eb] text-white font-bold transition-all flex items-center justify-center gap-2 shadow-lg shadow-[#3b82f6]/20">
                    {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Plus className="w-5 h-5" />} Crear Capítulo
                  </button>
                </form>
              </div>
            )}

            {/* VISTA 4: PÁGINAS */}
            {activeView === "pages" && (
              <div className="bg-[#121216] border border-white/5 rounded-2xl p-6 max-w-3xl">
                <h3 className="text-lg font-bold text-white flex items-center gap-2 mb-6 border-b border-white/5 pb-4"><ImageIcon className="w-5 h-5 text-[#10b981]" /> Subir Páginas (Por Capítulo)</h3>
                <form onSubmit={handleAddPages} className="space-y-6">
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-white/80 block">1. Selecciona el Manhwa</label>
                    <select required value={selectedManhwaId} onChange={(e) => { setSelectedManhwaId(e.target.value); fetchChapters(e.target.value); }} className="w-full h-11 rounded-xl border border-white/10 bg-black/30 text-white px-4 text-sm focus:border-[#a855f7] outline-none">
                      <option value="" className="bg-[#121216]">-- Elige un manhwa --</option>
                      {manhwas.map(m => <option key={m.id} value={m.id} className="bg-[#121216]">{m.title}</option>)}
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-white/80 block">2. Selecciona el Capítulo</label>
                    <select required value={selectedChapterId} onChange={(e) => setSelectedChapterId(e.target.value)} className="w-full h-11 rounded-xl border border-white/10 bg-black/30 text-white px-4 text-sm focus:border-[#a855f7] outline-none disabled:opacity-50" disabled={chapters.length === 0}>
                      <option value="" className="bg-[#121216]">-- Elige un capítulo --</option>
                      {chapters.map(c => <option key={c.id} value={c.id} className="bg-[#121216]">Capítulo {c.chapter_number}</option>)}
                    </select>
                  </div>

                  <div className="p-1 bg-black/30 rounded-xl flex gap-1 border border-white/5">
                    <button type="button" onClick={() => setUploadMode("github")} className={`flex-1 py-2 text-sm font-semibold rounded-lg transition-all ${uploadMode === "github" ? "bg-white/10 text-white shadow" : "text-[#a7a7b1] hover:text-white"}`}>GitHub Repo (CDN)</button>
                    <button type="button" onClick={() => setUploadMode("manual")} className={`flex-1 py-2 text-sm font-semibold rounded-lg transition-all ${uploadMode === "manual" ? "bg-white/10 text-white shadow" : "text-[#a7a7b1] hover:text-white"}`}>URLs Directas</button>
                  </div>

                  {uploadMode === "github" ? (
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label className="text-sm font-semibold text-white/80 block">Repositorio</label>
                        <input type="text" required value={ghRepo} onChange={e => setGhRepo(e.target.value)} placeholder="Nekumi-Catalog-02" className="w-full h-11 rounded-xl border border-white/10 bg-black/30 text-white px-4 text-sm focus:border-[#a855f7] outline-none" />
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-semibold text-white/80 block">Ruta exacta</label>
                        <input type="text" required value={ghFolder} onChange={e => setGhFolder(e.target.value)} placeholder="img/manga/cap-1" className="w-full h-11 rounded-xl border border-white/10 bg-black/30 text-white px-4 text-sm focus:border-[#a855f7] outline-none" />
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <label className="text-sm font-semibold text-white/80 block">URLs de las imágenes (una por línea)</label>
                      <textarea required value={manualUrls} onChange={e => setManualUrls(e.target.value)} className="w-full h-32 bg-black/30 border border-white/10 rounded-xl p-3 text-sm text-white focus:border-[#a855f7] outline-none transition-colors resize-y font-mono" placeholder="https://..." />
                    </div>
                  )}

                  <button type="submit" disabled={loading} className="w-full h-11 rounded-xl bg-[#10b981] hover:bg-[#059669] text-white font-bold transition-all flex items-center justify-center gap-2 shadow-lg shadow-[#10b981]/20">
                    {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Upload className="w-5 h-5" />} Agregar Páginas
                  </button>
                </form>
              </div>
            )}

            {/* VISTA 5: AUTOMATIZADOR VIP */}
            {activeView === "automator" && (
              <div className="bg-[#121216] border border-[#a855f7]/30 rounded-2xl p-8 max-w-3xl relative overflow-hidden shadow-[0_0_50px_rgba(168,85,247,0.1)]">
                <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none"><Zap className="w-48 h-48 text-[#a855f7]" /></div>
                
                <h3 className="text-2xl font-bold text-white flex items-center gap-3 mb-2 relative z-10"><Zap className="w-6 h-6 text-[#a855f7]" /> Automatizador de Capítulos</h3>
                <p className="text-[#a7a7b1] mb-8 relative z-10">Escanea tu repositorio de GitHub completo y crea automáticamente decenas de capítulos y páginas en segundos. Sube la carpeta entera y yo me encargo del resto.</p>
                
                <form onSubmit={handleBulkImport} className="space-y-6 relative z-10">
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-white/80 block">1. Selecciona el Manhwa destino</label>
                    <select required value={bulkManhwaId} onChange={e => setBulkManhwaId(e.target.value)} className="w-full h-12 rounded-xl border border-white/10 bg-black/50 text-white px-4 focus:border-[#a855f7] outline-none transition-colors">
                      <option value="" className="bg-[#121216]">-- Elige un manhwa --</option>
                      {manhwas.map(m => <option key={m.id} value={m.id} className="bg-[#121216]">{m.title}</option>)}
                    </select>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-sm font-semibold text-white/80 block">2. Repositorio (CDN)</label>
                      <input required type="text" value={bulkRepo} onChange={e => setBulkRepo(e.target.value)} className="w-full h-12 rounded-xl border border-white/10 bg-black/50 text-white px-4 font-mono text-sm focus:border-[#a855f7] outline-none transition-colors" placeholder="Nekumi-Catalog-05" />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-semibold text-white/80 block">3. Ruta raíz del Manhwa</label>
                      <input required type="text" value={bulkPath} onChange={e => setBulkPath(e.target.value)} className="w-full h-12 rounded-xl border border-white/10 bg-black/50 text-white px-4 font-mono text-sm focus:border-[#a855f7] outline-none transition-colors" placeholder="img/solo-leveling" />
                    </div>
                  </div>

                  {bulkProgress && (
                    <div className="p-4 bg-[#a855f7]/10 border border-[#a855f7]/30 rounded-xl flex items-center gap-3 text-[#c084fc] font-mono text-sm">
                      <Loader2 className="w-5 h-5 animate-spin shrink-0" /> {bulkProgress}
                    </div>
                  )}

                  <button type="submit" disabled={bulkLoading} className="w-full h-14 mt-4 rounded-xl bg-gradient-to-r from-[#a855f7] to-[#ec4899] hover:from-[#9333ea] hover:to-[#db2777] text-white font-bold text-lg transition-all flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(168,85,247,0.4)]">
                    {bulkLoading ? <Loader2 className="w-6 h-6 animate-spin" /> : <Zap className="w-6 h-6" />} ¡Importar Masivamente!
                  </button>
                </form>
              </div>
            )}

          </div>
                    {/* VISTA 6: USUARIOS */}
            {activeView === 'users' && (
              <div className="bg-[#121216] border border-white/5 rounded-2xl p-6">
                <div className="flex flex-col sm:flex-row justify-between gap-4 mb-6">
                  <div>
                    <h3 className="text-lg font-bold text-white flex items-center gap-2"><Users className="w-5 h-5 text-[#34d399]" /> Gestión de Usuarios</h3>
                    <p className="text-sm text-[#a7a7b1]">Lectores registrados en Nekutoon.</p>
                  </div>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm text-left">
                    <thead className="text-[#a7a7b1] border-b border-white/5">
                      <tr>
                        <th className="pb-3 font-medium">Avatar</th>
                        <th className="pb-3 font-medium">Usuario / Email</th>
                        <th className="pb-3 font-medium">Fecha de Registro</th>
                        <th className="pb-3 font-medium text-right">Rol</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                      {usersList.map((u) => (
                        <tr key={u.id} className="hover:bg-white/5 transition-colors">
                          <td className="py-3">
                            <div className="w-10 h-10 rounded-full bg-[#10b981]/20 flex items-center justify-center text-[#34d399] font-bold border border-[#10b981]/30">
                              {u.avatar_url ? <img src={u.avatar_url} className="w-full h-full rounded-full object-cover" /> : (u.email ? u.email[0].toUpperCase() : 'U')}
                            </div>
                          </td>
                          <td className="py-3 font-semibold text-white">{u.email}</td>
                          <td className="py-3 text-[#a7a7b1]">{new Date(u.created_at).toLocaleDateString()}</td>
                          <td className="py-3 text-right">
                            <span className={inline-block px-2.5 py-1 rounded-full text-xs font-semibold }>
                              {u.email === 'diazmowi07@gmail.com' ? 'Admin' : 'Lector'}
                            </span>
                          </td>
                        </tr>
                      ))}
                      {usersList.length === 0 && <tr><td colSpan={4} className="py-8 text-center text-[#a7a7b1]">No hay usuarios registrados aún.</td></tr>}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* VISTA 7: COMENTARIOS */}
            {activeView === 'reviews' && (
              <div className="bg-[#121216] border border-white/5 rounded-2xl p-6">
                <div className="flex flex-col sm:flex-row justify-between gap-4 mb-6">
                  <div>
                    <h3 className="text-lg font-bold text-white flex items-center gap-2"><MessageSquare className="w-5 h-5 text-[#f59e0b]" /> Moderación de Comentarios</h3>
                    <p className="text-sm text-[#a7a7b1]">Administra las reseñas y comentarios de la comunidad.</p>
                  </div>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm text-left">
                    <thead className="text-[#a7a7b1] border-b border-white/5">
                      <tr>
                        <th className="pb-3 font-medium">Usuario</th>
                        <th className="pb-3 font-medium">Manhwa</th>
                        <th className="pb-3 font-medium">Comentario</th>
                        <th className="pb-3 font-medium text-right">Acciones</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                      {reviewsList.map((r) => (
                        <tr key={r.id} className="hover:bg-white/5 transition-colors">
                          <td className="py-3 text-[#a7a7b1] text-xs max-w-[120px] truncate">{r.user_email || 'Anónimo'}</td>
                          <td className="py-3 font-semibold text-white max-w-[150px] truncate">{r.manhwa?.title}</td>
                          <td className="py-3 text-white/80 max-w-[300px] truncate">{r.content}</td>
                          <td className="py-3 text-right">
                            <button onClick={() => handleDeleteReview(r.id)} className="p-2 bg-[#ef4444]/10 hover:bg-[#ef4444]/20 rounded-lg text-[#ef4444] transition-colors" title="Borrar comentario">
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </td>
                        </tr>
                      ))}
                      {reviewsList.length === 0 && <tr><td colSpan={4} className="py-8 text-center text-[#a7a7b1]">No hay comentarios publicados aún.</td></tr>}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
        </main>
      </div>
    </div>
  );
}


