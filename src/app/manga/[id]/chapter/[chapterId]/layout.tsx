import { cache } from "react";
import type { Metadata } from "next";
import { createClient } from "@supabase/supabase-js";
import { SUPABASE_URL_DEFAULT, SUPABASE_ANON_KEY_DEFAULT } from "@/lib/supabase";

export const revalidate = 3600;

const getChapterSeoInfo = cache(async (id: string, chapterId: string) => {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || SUPABASE_URL_DEFAULT;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || SUPABASE_ANON_KEY_DEFAULT;
  const supabase = createClient(supabaseUrl, supabaseAnonKey);

  const [{ data: manhwa }, { data: chapter }] = await Promise.all([
    supabase.from("manhwas").select("title, cover_url, banner_url, genre").eq("id", id).maybeSingle(),
    supabase.from("chapters").select("chapter_number, title").eq("id", chapterId).maybeSingle(),
  ]);

  return { manhwa, chapter };
});

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string; chapterId: string }>;
}): Promise<Metadata> {
  const { id, chapterId } = await params;

  try {
    const { manhwa, chapter } = await getChapterSeoInfo(id, chapterId);

    if (!manhwa || !chapter) {
      return {
        title: "Leer Capítulo en Español | Nekutoon",
      };
    }

    const chapNum = chapter.chapter_number;
    const fullTitle = `${manhwa.title} Capítulo ${chapNum} Español — Leer Online | Nekutoon`;
    const desc = `Lee ${manhwa.title} Capítulo ${chapNum} en español gratis, completo y en alta definición HD en Nekutoon.`;
    const ogImage = manhwa.cover_url || manhwa.banner_url;
    const canonicalUrl = `https://www.nekutoon.com/manga/${id}/chapter/${chapterId}`;

    return {
      title: fullTitle,
      description: desc,
      alternates: {
        canonical: canonicalUrl,
      },
      openGraph: {
        title: `${manhwa.title} — Capítulo ${chapNum} en Español | Nekutoon`,
        description: desc,
        url: canonicalUrl,
        siteName: "Nekutoon",
        type: "article",
        images: ogImage ? [{ url: ogImage, alt: `${manhwa.title} Capítulo ${chapNum}` }] : [],
      },
      twitter: {
        card: "summary_large_image",
        title: `${manhwa.title} Cap. ${chapNum} | Nekutoon`,
        description: desc,
        images: ogImage ? [ogImage] : [],
      },
    };
  } catch {
    return {
      title: "Leer Capítulo Online en Español | Nekutoon",
    };
  }
}

export default async function ChapterLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ id: string; chapterId: string }>;
}) {
  const { id, chapterId } = await params;

  let breadcrumbJsonLd: Record<string, any> | null = null;
  try {
    const { manhwa, chapter } = await getChapterSeoInfo(id, chapterId);
    if (manhwa && chapter) {
      breadcrumbJsonLd = {
        "@context": "https://schema.org",
        "@type": "BreadcrumbList",
        itemListElement: [
          {
            "@type": "ListItem",
            position: 1,
            name: "Nekutoon",
            item: "https://www.nekutoon.com",
          },
          {
            "@type": "ListItem",
            position: 2,
            name: manhwa.title,
            item: `https://www.nekutoon.com/manga/${id}`,
          },
          {
            "@type": "ListItem",
            position: 3,
            name: `Capítulo ${chapter.chapter_number}`,
            item: `https://www.nekutoon.com/manga/${id}/chapter/${chapterId}`,
          },
        ],
      };
    }
  } catch {}

  return (
    <>
      {breadcrumbJsonLd && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
        />
      )}
      {children}
    </>
  );
}
