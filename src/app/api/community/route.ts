import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { SUPABASE_URL_DEFAULT } from "@/lib/supabase";


function getAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || SUPABASE_URL_DEFAULT;
  const key =
    process.env.SUPABASE_SERVICE_ROLE_KEY || "";
  if (!key) throw new Error("Falta SUPABASE_SERVICE_ROLE_KEY en las variables de entorno");
  return createClient(url, key, { auth: { persistSession: false } });
}

function getSocialShardId(chapterId: string): number {
  const cleanHex = (chapterId || "").replace(/-/g, "").slice(0, 6);
  const num = parseInt(cleanHex, 16);
  if (Number.isNaN(num)) return 3000;
  return 3000 + (num % 256);
}

function calculateVerifiedXp(progress?: any): number {
  if (!progress || typeof progress !== "object") return 0;
  const readChapters = Array.isArray(progress.readChapters) ? progress.readChapters.length : 0;
  const comments = typeof progress.comments === "number" ? Math.max(0, progress.comments) : 0;
  const reactions = typeof progress.reactions === "number" ? Math.max(0, progress.reactions) : 0;
  return readChapters * 10 + comments * 25 + reactions * 5;
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const type = searchParams.get("type");
  const supabase = getAdminClient();

  if (type === "manhwa_rating") {
    const manhwaId = searchParams.get("manhwaId") || "";
    const voterId = searchParams.get("voterId") || "";
    if (!manhwaId) return NextResponse.json({ score: 0, totalVotes: 0, userRating: 0 });

    const [{ data: shard }, { data: revs }] = await Promise.all([
      supabase.from("site_config").select("category_images").eq("id", 200).maybeSingle(),
      supabase.from("reviews").select("rating").eq("manhwa_id", manhwaId),
    ]);

    const allRatingsMap = (shard?.category_images as Record<string, Record<string, number>>) || {};
    const votesObj = allRatingsMap[manhwaId] || {};
    const quickVotes = Object.values(votesObj).filter((v) => typeof v === "number" && v >= 1 && v <= 5);
    const reviewVotes = (revs || [])
      .map((r: any) => Number(r.rating))
      .filter((v) => !Number.isNaN(v) && v >= 1 && v <= 5);

    const combined = [...quickVotes, ...reviewVotes];
    const totalVotes = combined.length;
    const score = totalVotes > 0 ? Number((combined.reduce((a, b) => a + b, 0) / totalVotes).toFixed(1)) : 0;
    const userRating = voterId && votesObj[voterId] ? Number(votesObj[voterId]) : 0;

    return NextResponse.json({ score, totalVotes, userRating });
  }

  if (type === "chapter_social") {
    const chapterId = searchParams.get("chapterId") || "";
    const voterId = searchParams.get("voterId") || "";
    if (!chapterId) {
      return NextResponse.json({ counts: {}, userReactions: [], comments: [] });
    }

    const shardId = getSocialShardId(chapterId);
    const { data: row } = await supabase
      .from("site_config")
      .select(`entry:category_images->${chapterId}`)
      .eq("id", shardId)
      .maybeSingle();

    const entry = (row as any)?.entry || {};
    const reactionsByType: Record<string, string[]> = entry.reactions || {};
    const counts: Record<string, number> = {};
    const userReactions: string[] = [];

    for (const [k, voters] of Object.entries(reactionsByType)) {
      const list = Array.isArray(voters) ? voters : [];
      counts[k] = list.length;
      if (voterId && list.includes(voterId)) {
        userReactions.push(k);
      }
    }

    const comments = Array.isArray(entry.comments) ? entry.comments : [];
    return NextResponse.json({ counts, userReactions, comments });
  }

  if (type === "public_lists") {
    const { data: row } = await supabase
      .from("site_config")
      .select("category_images")
      .eq("id", 250)
      .maybeSingle();

    const lists = Array.isArray((row?.category_images as any)?.lists)
      ? (row?.category_images as any).lists
      : [];
    return NextResponse.json(
      { lists },
      { headers: { "Cache-Control": "public, s-maxage=30, stale-while-revalidate=60" } }
    );
  }

  if (type === "global_wall") {
    const { data: row } = await supabase
      .from("site_config")
      .select("category_images")
      .eq("id", 260)
      .maybeSingle();

    const posts = Array.isArray((row?.category_images as any)?.posts)
      ? (row?.category_images as any).posts
      : [];
    return NextResponse.json(
      { posts },
      { headers: { "Cache-Control": "public, s-maxage=30, stale-while-revalidate=60" } }
    );
  }

  return NextResponse.json({ ok: true });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { action } = body;
    const supabase = getAdminClient();

    if (action === "rate_manhwa") {
      const { manhwaId, rating, voterId } = body;
      const numericRating = Math.min(5, Math.max(1, Math.round(Number(rating) || 5)));
      if (!manhwaId || !voterId) {
        return NextResponse.json({ error: "Datos incompletos" }, { status: 400 });
      }

      const [{ data: shard }, { data: revs }] = await Promise.all([
        supabase.from("site_config").select("category_images").eq("id", 200).maybeSingle(),
        supabase.from("reviews").select("rating").eq("manhwa_id", manhwaId),
      ]);

      const allRatingsMap: Record<string, Record<string, number>> =
        shard?.category_images && typeof shard.category_images === "object"
          ? { ...(shard.category_images as any) }
          : {};

      const currentVotes = { ...(allRatingsMap[manhwaId] || {}) };
      currentVotes[voterId] = numericRating;
      allRatingsMap[manhwaId] = currentVotes;

      const quickVotes = Object.values(currentVotes).filter((v) => typeof v === "number" && v >= 1 && v <= 5);
      const reviewVotes = (revs || [])
        .map((r: any) => Number(r.rating))
        .filter((v) => !Number.isNaN(v) && v >= 1 && v <= 5);

      const combined = [...quickVotes, ...reviewVotes];
      const totalVotes = combined.length;
      const avgScore = totalVotes > 0 ? Number((combined.reduce((a, b) => a + b, 0) / totalVotes).toFixed(1)) : numericRating;

      await Promise.all([
        supabase.from("site_config").upsert({ id: 200, category_images: allRatingsMap }),
        supabase.from("manhwas").update({ score: avgScore }).eq("id", manhwaId),
      ]);

      return NextResponse.json({
        score: avgScore,
        totalVotes,
        userRating: numericRating,
      });
    }

    if (action === "react_chapter") {
      const { chapterId, reactionKey, voterId } = body;
      if (!chapterId || !reactionKey || !voterId) {
        return NextResponse.json({ error: "Datos incompletos" }, { status: 400 });
      }

      const shardId = getSocialShardId(chapterId);
      const { data: existing } = await supabase
        .from("site_config")
        .select("category_images")
        .eq("id", shardId)
        .maybeSingle();

      const shardData: Record<string, any> =
        existing?.category_images && typeof existing.category_images === "object"
          ? { ...(existing.category_images as any) }
          : {};

      const chapEntry = shardData[chapterId] || { reactions: {}, comments: [] };
      const reactions: Record<string, string[]> = { ...(chapEntry.reactions || {}) };
      const currentList: string[] = Array.isArray(reactions[reactionKey]) ? [...reactions[reactionKey]] : [];

      const idx = currentList.indexOf(voterId);
      if (idx >= 0) {
        currentList.splice(idx, 1);
      } else {
        currentList.push(voterId);
      }
      reactions[reactionKey] = currentList;
      chapEntry.reactions = reactions;
      shardData[chapterId] = chapEntry;

      await supabase.from("site_config").upsert({ id: shardId, category_images: shardData });

      const counts: Record<string, number> = {};
      const userReactions: string[] = [];
      for (const [k, voters] of Object.entries(reactions)) {
        const list = Array.isArray(voters) ? voters : [];
        counts[k] = list.length;
        if (list.includes(voterId)) userReactions.push(k);
      }

      return NextResponse.json({ counts, userReactions });
    }

    if (action === "change_username") {
      const { userId, newUsername } = body;
      if (!userId || !newUsername?.trim()) {
        return NextResponse.json({ error: "Datos incompletos" }, { status: 400 });
      }

      const cleanName = newUsername.trim();
      if (cleanName.length < 3 || cleanName.length > 20) {
        return NextResponse.json({ error: "El nombre debe tener entre 3 y 20 caracteres." }, { status: 400 });
      }
      if (!/^[a-zA-Z0-9_]+$/.test(cleanName)) {
        return NextResponse.json({ error: "El nombre solo puede contener letras, números y guiones bajos (_)." }, { status: 400 });
      }

      const { data: prof, error: profErr } = await supabase
        .from("profiles")
        .select("id, username, reader_progress")
        .eq("id", userId)
        .maybeSingle();

      if (profErr || !prof) {
        return NextResponse.json({ error: "Usuario no encontrado" }, { status: 404 });
      }

      const rp = (prof.reader_progress && typeof prof.reader_progress === "object" ? prof.reader_progress : {}) as any;
      if (rp.username_changed) {
        return NextResponse.json({ error: "Ya has utilizado tu único cambio de nombre permitido." }, { status: 403 });
      }

      // Comprobar que nadie más tenga ese nombre
      const { data: duplicate } = await supabase
        .from("profiles")
        .select("id")
        .ilike("username", cleanName)
        .neq("id", userId)
        .maybeSingle();

      if (duplicate) {
        return NextResponse.json({ error: "Ese nombre de Cazador ya está ocupado por otro usuario." }, { status: 400 });
      }

      const updatedRp = {
        ...rp,
        username_changed: true,
        username_changed_at: new Date().toISOString(),
        previous_username: prof.username || null,
      };

      const { error: updateErr } = await supabase
        .from("profiles")
        .update({
          username: cleanName,
          reader_progress: updatedRp,
          updated_at: new Date().toISOString(),
        })
        .eq("id", userId);

      if (updateErr) {
        return NextResponse.json({ error: "No se pudo actualizar el nombre: " + updateErr.message }, { status: 500 });
      }

      return NextResponse.json({ success: true, username: cleanName });
    }

    if (action === "comment_chapter") {
      const {
        chapterId,
        userId,
        authorName,
        avatarKey,
        content,
        frameId,
        nameColorId,
        customTitleId,
        isSpoiler,
      } = body;

      if (!userId) {
        return NextResponse.json({ error: "Debes iniciar sesión para comentar en los capítulos." }, { status: 401 });
      }
      if (!chapterId || !content?.trim()) {
        return NextResponse.json({ error: "Comentario vacío" }, { status: 400 });
      }

      // Validar perfil y XP legítimo desde la base de datos
      const { data: verifiedUser } = await supabase
        .from("profiles")
        .select("username, avatar_url, reader_progress")
        .eq("id", userId)
        .maybeSingle();

      if (!verifiedUser) {
        return NextResponse.json({ error: "Cuenta no encontrada. Inicia sesión nuevamente." }, { status: 401 });
      }

      const verifiedXp = calculateVerifiedXp(verifiedUser.reader_progress);
      const readChaptersCount = Array.isArray(verifiedUser.reader_progress?.readChapters)
        ? verifiedUser.reader_progress.readChapters.length
        : 1;
      const finalAuthorName = verifiedUser.username || (authorName ? String(authorName).slice(0, 28) : "Cazador");
      const finalAvatar = verifiedUser.avatar_url || avatarKey || "hunter";

      const shardId = getSocialShardId(chapterId);
      const { data: existing } = await supabase
        .from("site_config")
        .select("category_images")
        .eq("id", shardId)
        .maybeSingle();

      const shardData: Record<string, any> =
        existing?.category_images && typeof existing.category_images === "object"
          ? { ...(existing.category_images as any) }
          : {};

      const chapEntry = shardData[chapterId] || { reactions: {}, comments: [] };
      const comments = Array.isArray(chapEntry.comments) ? [...chapEntry.comments] : [];

      const newComment = {
        id: `${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
        authorName: finalAuthorName,
        avatarKey: finalAvatar,
        readerXp: verifiedXp,
        chaptersRead: readChaptersCount,
        frameId: frameId || undefined,
        nameColorId: nameColorId || undefined,
        customTitleId: customTitleId || undefined,
        isSpoiler: Boolean(isSpoiler),
        content: content.trim().slice(0, 600),
        createdAt: new Date().toISOString(),
      };

      const updatedComments = [newComment, ...comments].slice(0, 50);
      chapEntry.comments = updatedComments;
      shardData[chapterId] = chapEntry;

      await supabase.from("site_config").upsert({ id: shardId, category_images: shardData });

      return NextResponse.json({ comments: updatedComments });
    }

    if (action === "create_public_list") {
      const { userId, title, description, avatarKey, isAdult, manhwaIds } = body;

      if (!userId) {
        return NextResponse.json({ error: "Debes iniciar sesión para crear una lista pública." }, { status: 401 });
      }
      if (!title?.trim() || !Array.isArray(manhwaIds) || manhwaIds.length === 0) {
        return NextResponse.json({ error: "Selecciona al menos un manhwa y escribe un título" }, { status: 400 });
      }

      // Validar usuario real en DB
      const { data: verifiedUser } = await supabase
        .from("profiles")
        .select("username, avatar_url, reader_progress")
        .eq("id", userId)
        .maybeSingle();

      if (!verifiedUser) {
        return NextResponse.json({ error: "Cuenta no encontrada. Inicia sesión nuevamente." }, { status: 401 });
      }

      const verifiedXp = calculateVerifiedXp(verifiedUser.reader_progress);
      const finalAuthorName = verifiedUser.username || "Cazador";
      const finalAvatar = verifiedUser.avatar_url || avatarKey || "hunter";

      const { data: existing } = await supabase
        .from("site_config")
        .select("category_images")
        .eq("id", 250)
        .maybeSingle();

      const currentLists: any[] = Array.isArray((existing?.category_images as any)?.lists)
        ? [...(existing?.category_images as any).lists]
        : [];

      const newList = {
        id: `list_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
        title: title.trim().slice(0, 75),
        description: (description || "Selección recomendada para la comunidad de Nekutoon.").trim().slice(0, 220),
        authorName: finalAuthorName,
        avatarKey: finalAvatar,
        readerXp: verifiedXp,
        isAdult: Boolean(isAdult),
        manhwaIds: manhwaIds.slice(0, 100).map(String),
        views: 1,
        likes: 1,
        createdAt: new Date().toISOString(),
      };

      const updatedLists = [newList, ...currentLists].slice(0, 48);
      await supabase.from("site_config").upsert({
        id: 250,
        category_images: { lists: updatedLists },
      });

      return NextResponse.json({ lists: updatedLists, created: newList });
    }

    if (action === "interact_public_list") {
      const { listId, subAction } = body;
      if (!listId) return NextResponse.json({ ok: false });

      const { data: existing } = await supabase
        .from("site_config")
        .select("category_images")
        .eq("id", 250)
        .maybeSingle();

      const currentLists: any[] = Array.isArray((existing?.category_images as any)?.lists)
        ? [...(existing?.category_images as any).lists]
        : [];

      const idx = currentLists.findIndex((l) => l.id === listId);
      if (idx >= 0) {
        if (subAction === "like") {
          currentLists[idx].likes = (Number(currentLists[idx].likes) || 0) + 1;
        } else {
          currentLists[idx].views = (Number(currentLists[idx].views) || 0) + 1;
        }
        await supabase.from("site_config").upsert({
          id: 250,
          category_images: { lists: currentLists },
        });
      }
      return NextResponse.json({ lists: currentLists });
    }

    if (action === "post_global_wall") {
      const {
        userId,
        avatarKey,
        frameId,
        nameColorId,
        customTitleId,
        channel,
        isSpoiler,
        attachedManhwaId,
        attachedManhwaTitle,
        attachedManhwaCover,
        content,
      } = body;

      if (!userId) {
        return NextResponse.json({ error: "Debes iniciar sesión para publicar en el muro." }, { status: 401 });
      }
      if (!content?.trim()) {
        return NextResponse.json({ error: "Escribe un mensaje" }, { status: 400 });
      }

      // Validar usuario real en DB
      const { data: verifiedUser } = await supabase
        .from("profiles")
        .select("username, avatar_url, reader_progress")
        .eq("id", userId)
        .maybeSingle();

      if (!verifiedUser) {
        return NextResponse.json({ error: "Cuenta no encontrada. Inicia sesión nuevamente." }, { status: 401 });
      }

      const verifiedXp = calculateVerifiedXp(verifiedUser.reader_progress);
      const finalAuthorName = verifiedUser.username || "Cazador";
      const finalAvatar = verifiedUser.avatar_url || avatarKey || "hunter";

      const { data: existing } = await supabase
        .from("site_config")
        .select("category_images")
        .eq("id", 260)
        .maybeSingle();

      const currentPosts: any[] = Array.isArray((existing?.category_images as any)?.posts)
        ? [...(existing?.category_images as any).posts]
        : [];

      const newPost = {
        id: `wall_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
        authorName: finalAuthorName,
        avatarKey: finalAvatar,
        readerXp: verifiedXp,
        frameId: frameId || undefined,
        nameColorId: nameColorId || undefined,
        customTitleId: customTitleId || undefined,
        channel: channel || "general",
        isSpoiler: Boolean(isSpoiler),
        attachedManhwaId: attachedManhwaId || undefined,
        attachedManhwaTitle: attachedManhwaTitle || undefined,
        attachedManhwaCover: attachedManhwaCover || undefined,
        content: content.trim().slice(0, 650),
        likes: 1,
        createdAt: new Date().toISOString(),
      };

      const updatedPosts = [newPost, ...currentPosts].slice(0, 60);
      await supabase.from("site_config").upsert({
        id: 260,
        category_images: { posts: updatedPosts },
      });

      return NextResponse.json({ posts: updatedPosts, created: newPost });
    }

    if (action === "like_global_wall") {
      const { postId } = body;
      if (!postId) return NextResponse.json({ ok: false });

      const { data: existing } = await supabase
        .from("site_config")
        .select("category_images")
        .eq("id", 260)
        .maybeSingle();

      const currentPosts: any[] = Array.isArray((existing?.category_images as any)?.posts)
        ? [...(existing?.category_images as any).posts]
        : [];

      const idx = currentPosts.findIndex((p) => p.id === postId);
      if (idx >= 0) {
        currentPosts[idx].likes = (Number(currentPosts[idx].likes) || 0) + 1;
        await supabase.from("site_config").upsert({
          id: 260,
          category_images: { posts: currentPosts },
        });
      }
      return NextResponse.json({ posts: currentPosts });
    }

    return NextResponse.json({ error: "Acción no válida" }, { status: 400 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Error interno" }, { status: 500 });
  }
}
