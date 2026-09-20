"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import { Loader2, User, Star, Settings, ArrowLeft } from "lucide-react";
import Link from "next/link";
import AvatarPicker from "@/components/AvatarPicker";
import { getAvatarSvg } from "@/lib/avatars";

export default function ProfilePage() {
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [reviews, setReviews] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAvatarPicker, setShowAvatarPicker] = useState(false);
  const [saving, setSaving] = useState(false);
  
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    async function loadProfile() {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) {
        router.push("/");
        return;
      }
      setUser(session.user);
      
      const { data: prof } = await supabase.from("profiles").select("*").eq("id", session.user.id).single();
      if (prof) setProfile(prof);

      const { data: revs } = await supabase
        .from("reviews")
        .select("*, manhwas(title, cover_url)")
        .eq("user_id", session.user.id)
        .order("created_at", { ascending: false });
      
      if (revs) setReviews(revs);
      setLoading(false);
    }
    loadProfile();
  }, [router, supabase]);

  const saveAvatar = async (key: string) => {
    setSaving(true);
    const { data, error } = await supabase.from("profiles").upsert({
      id: user.id,
      avatar_url: key,
      updated_at: new Date().toISOString()
    }).select().single();
    
    if (!error && data) {
      setProfile(data);
      setShowAvatarPicker(false);
    }
    setSaving(false);
  };

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center"><Loader2 className="w-8 h-8 text-[#a855f7] animate-spin" /></div>;
  }

  return (
    <div className="min-h-screen py-24 px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto">
      <Link href="/" className="inline-flex items-center gap-2 text-white/50 hover:text-white transition-colors mb-8">
        <ArrowLeft className="w-4 h-4" /> Volver al Inicio
      </Link>
      
      <div className="glass rounded-[32px] p-8 sm:p-12 mb-8 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-[#a855f7]/20 blur-[100px] rounded-full pointer-events-none" />
        
        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-8 relative z-10">
          <div className="relative group">
            <div 
              className="w-32 h-32 rounded-[24px] overflow-hidden border-2 border-[#a855f7]/50 bg-black/40 p-2"
              dangerouslySetInnerHTML={{ __html: getAvatarSvg(profile?.avatar_url || "hunter") }}
            />
            <button 
              onClick={() => setShowAvatarPicker(!showAvatarPicker)}
              className="absolute -bottom-3 -right-3 w-10 h-10 bg-[#a855f7] hover:bg-[#9333ea] rounded-xl flex items-center justify-center text-white shadow-lg transition-transform hover:scale-105"
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Settings className="w-4 h-4" />}
            </button>
          </div>
          
          <div className="text-center sm:text-left">
            <h1 className="text-3xl font-black text-white mb-2">{profile?.username || user?.email?.split('@')[0]}</h1>
            <p className="text-white/50 mb-4">{user?.email}</p>
            <div className="flex gap-4 justify-center sm:justify-start">
              <div className="bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-center">
                <span className="block text-xl font-bold text-[#a855f7]">{reviews.length}</span>
                <span className="text-xs text-white/50">Reseñas</span>
              </div>
            </div>
          </div>
        </div>

        {showAvatarPicker && (
          <div className="mt-8 p-6 bg-black/20 border border-[#a855f7]/30 rounded-2xl animate-in fade-in slide-in-from-top-4">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-bold">Elige tu Avatar</h3>
              <button onClick={() => setShowAvatarPicker(false)} className="text-white/50 hover:text-white text-sm">Cerrar</button>
            </div>
            <AvatarPicker selected={profile?.avatar_url || "hunter"} onChange={saveAvatar} />
          </div>
        )}
      </div>

      <div className="space-y-6">
        <h2 className="text-2xl font-bold mb-6 flex items-center gap-2"><Star className="w-6 h-6 text-[#fbbf24]" /> Mis Reseñas</h2>
        
        {reviews.length === 0 ? (
          <div className="glass rounded-[24px] p-12 text-center text-white/50">
            Aún no has escrito ninguna reseña. ¡Ve al catálogo y comparte tu opinión!
          </div>
        ) : (
          <div className="grid gap-4">
            {reviews.map(rev => (
              <div key={rev.id} className="glass rounded-2xl p-5 sm:p-6 flex flex-col sm:flex-row gap-6 hover:bg-white/[0.02] transition-colors border border-white/5">
                {rev.manhwas?.cover_url && (
                  <img src={rev.manhwas.cover_url} alt="Cover" className="w-20 h-28 object-cover rounded-xl shadow-lg flex-shrink-0 mx-auto sm:mx-0" />
                )}
                <div className="flex-1">
                  <div className="flex flex-col sm:flex-row justify-between items-start mb-3 gap-2">
                    <div>
                      <Link href={`/manga/${rev.manhwa_id}`} className="font-bold text-lg hover:text-[#c084fc] transition-colors">
                        {rev.manhwas?.title || "Manhwa Eliminado"}
                      </Link>
                      <p className="text-xs text-white/40">{new Date(rev.created_at).toLocaleDateString()}</p>
                    </div>
                    <div className="flex text-[#fbbf24] gap-0.5 bg-[#fbbf24]/10 px-2 py-1 rounded-lg">
                      {[...Array(5)].map((_, i) => (
                        <Star key={i} className={`w-3 h-3 ${i < rev.rating ? 'fill-current' : 'opacity-20'}`} />
                      ))}
                    </div>
                  </div>
                  <p className="text-white/70 text-sm leading-relaxed">{rev.content}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
