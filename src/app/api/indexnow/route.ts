import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { SUPABASE_URL_DEFAULT, SUPABASE_ANON_KEY_DEFAULT } from "@/lib/supabase";

export const dynamic = "force-dynamic";

const INDEXNOW_KEY = "3b8f1c84918e47458117769cf0c9b0e9";
const HOST = "www.nekutoon.com";
const KEY_LOCATION = `https://${HOST}/${INDEXNOW_KEY}.txt`;

/**
 * Endpoint para notificar automáticamente a los motores de búsqueda (Bing, Yandex, Yahoo, Seznam, Naver)
 * sobre todas las obras y capítulos de Nekutoon usando el protocolo oficial IndexNow.
 */
export async function GET() {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || SUPABASE_URL_DEFAULT;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || SUPABASE_ANON_KEY_DEFAULT;
    const supabase = createClient(supabaseUrl, supabaseAnonKey);

    const [{ data: manhwas }, { data: chapters }] = await Promise.all([
      supabase.from("manhwas").select("id").order("created_at", { ascending: false }).limit(200),
      supabase.from("chapters").select("id, manhwa_id").order("created_at", { ascending: false }).limit(300),
    ]);

    const urlList: string[] = [
      `https://${HOST}/`,
      ...((manhwas || []).map((m) => `https://${HOST}/manga/${m.id}`)),
      ...((chapters || []).map((c) => `https://${HOST}/manga/${c.manhwa_id}/chapter/${c.id}`)),
    ];

    const payload = {
      host: HOST,
      key: INDEXNOW_KEY,
      keyLocation: KEY_LOCATION,
      urlList: urlList.slice(0, 500),
    };

    const res = await fetch("https://api.indexnow.org/indexnow", {
      method: "POST",
      headers: { "Content-Type": "application/json; charset=utf-8" },
      body: JSON.stringify(payload),
    });

    return NextResponse.json({
      success: true,
      submittedUrlsCount: payload.urlList.length,
      indexNowStatus: res.status,
      message: "URLs enviadas a los buscadores con éxito.",
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
