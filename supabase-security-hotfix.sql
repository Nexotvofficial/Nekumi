-- Nekutton security hardening migration.
-- BACK UP the database and confirm the admin email before applying.
-- This resets RLS policies for the app's core tables, then recreates the
-- intended public-read / admin-write / owner-only rules. It intentionally
-- prevents anon clients from writing catalogue, chapter, page, or favorite data.

ALTER TABLE public.manhwas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chapters ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.favorites ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.visits ENABLE ROW LEVEL SECURITY;

-- Ensure the review table works if it was created by an older setup script.
ALTER TABLE public.reviews ADD COLUMN IF NOT EXISTS avatar_key TEXT DEFAULT 'hunter';
ALTER TABLE public.reviews ADD COLUMN IF NOT EXISTS user_email TEXT;
ALTER TABLE public.reviews ALTER COLUMN user_email DROP NOT NULL;

-- Remove existing policies on these known app tables. This prevents an older
-- permissive policy from silently overriding the stricter policies below.
DO $$
DECLARE existing_policy record;
BEGIN
  FOR existing_policy IN
    SELECT schemaname, tablename, policyname
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = ANY (ARRAY['manhwas', 'chapters', 'pages', 'profiles', 'reviews', 'favorites', 'visits'])
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON %I.%I', existing_policy.policyname, existing_policy.schemaname, existing_policy.tablename);
  END LOOP;
END;
$$;

-- Public catalog/reader access; writes are restricted to the administrator.
GRANT SELECT ON TABLE public.manhwas, public.chapters, public.pages TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON TABLE public.manhwas, public.chapters, public.pages TO authenticated;

CREATE POLICY nekutton_manhwas_public_read ON public.manhwas
FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY nekutton_manhwas_admin_insert ON public.manhwas
FOR INSERT TO authenticated
WITH CHECK ((auth.jwt() ->> 'email') = 'diazmowi07@gmail.com');
CREATE POLICY nekutton_manhwas_admin_update ON public.manhwas
FOR UPDATE TO authenticated
USING ((auth.jwt() ->> 'email') = 'diazmowi07@gmail.com')
WITH CHECK ((auth.jwt() ->> 'email') = 'diazmowi07@gmail.com');
CREATE POLICY nekutton_manhwas_admin_delete ON public.manhwas
FOR DELETE TO authenticated
USING ((auth.jwt() ->> 'email') = 'diazmowi07@gmail.com');

CREATE POLICY nekutton_chapters_public_read ON public.chapters
FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY nekutton_chapters_admin_insert ON public.chapters
FOR INSERT TO authenticated
WITH CHECK ((auth.jwt() ->> 'email') = 'diazmowi07@gmail.com');
CREATE POLICY nekutton_chapters_admin_update ON public.chapters
FOR UPDATE TO authenticated
USING ((auth.jwt() ->> 'email') = 'diazmowi07@gmail.com')
WITH CHECK ((auth.jwt() ->> 'email') = 'diazmowi07@gmail.com');
CREATE POLICY nekutton_chapters_admin_delete ON public.chapters
FOR DELETE TO authenticated
USING ((auth.jwt() ->> 'email') = 'diazmowi07@gmail.com');

CREATE POLICY nekutton_pages_public_read ON public.pages
FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY nekutton_pages_admin_insert ON public.pages
FOR INSERT TO authenticated
WITH CHECK ((auth.jwt() ->> 'email') = 'diazmowi07@gmail.com');
CREATE POLICY nekutton_pages_admin_update ON public.pages
FOR UPDATE TO authenticated
USING ((auth.jwt() ->> 'email') = 'diazmowi07@gmail.com')
WITH CHECK ((auth.jwt() ->> 'email') = 'diazmowi07@gmail.com');
CREATE POLICY nekutton_pages_admin_delete ON public.pages
FOR DELETE TO authenticated
USING ((auth.jwt() ->> 'email') = 'diazmowi07@gmail.com');

-- Profiles are readable for public usernames/avatars, but editable only by owner.
GRANT SELECT ON TABLE public.profiles TO anon, authenticated;
GRANT INSERT, UPDATE ON TABLE public.profiles TO authenticated;
CREATE POLICY nekutton_profiles_public_read ON public.profiles
FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY nekutton_profiles_owner_insert ON public.profiles
FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);
CREATE POLICY nekutton_profiles_owner_update ON public.profiles
FOR UPDATE TO authenticated USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

-- Reviews are public, but account email addresses are not exposed to client roles.
REVOKE SELECT ON TABLE public.reviews FROM PUBLIC, anon, authenticated;
REVOKE SELECT (user_email) ON TABLE public.reviews FROM PUBLIC, anon, authenticated;
GRANT SELECT (id, manhwa_id, user_id, avatar_key, rating, content, created_at)
ON TABLE public.reviews TO anon, authenticated;
REVOKE INSERT ON TABLE public.reviews FROM PUBLIC, anon, authenticated;
GRANT INSERT (manhwa_id, user_id, avatar_key, rating, content)
ON TABLE public.reviews TO authenticated;
REVOKE UPDATE ON TABLE public.reviews FROM PUBLIC, anon, authenticated;
GRANT DELETE ON TABLE public.reviews TO authenticated;
CREATE POLICY nekutton_reviews_public_read ON public.reviews
FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY nekutton_reviews_owner_insert ON public.reviews
FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY nekutton_reviews_owner_or_admin_delete ON public.reviews
FOR DELETE TO authenticated
USING (auth.uid() = user_id OR (auth.jwt() ->> 'email') = 'diazmowi07@gmail.com');

-- Favorites are private to their owner.
GRANT SELECT, INSERT, DELETE ON TABLE public.favorites TO authenticated;
CREATE POLICY nekutton_favorites_select_owner ON public.favorites
FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY nekutton_favorites_insert_owner ON public.favorites
FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY nekutton_favorites_delete_owner ON public.favorites
FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- Anonymous page-view inserts are allowed; only the admin can read the counter.
GRANT INSERT ON TABLE public.visits TO anon, authenticated;
GRANT SELECT ON TABLE public.visits TO authenticated;
CREATE POLICY nekutton_visits_insert ON public.visits
FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY nekutton_visits_admin_read ON public.visits
FOR SELECT TO authenticated
USING ((auth.jwt() ->> 'email') = 'diazmowi07@gmail.com');

-- Recalculate catalogue ratings in the database, not from browser-side updates.
CREATE OR REPLACE FUNCTION public.refresh_manhwa_score_from_reviews()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  target_manhwa_id uuid;
BEGIN
  IF TG_OP = 'DELETE' THEN
    target_manhwa_id := OLD.manhwa_id;
  ELSE
    target_manhwa_id := NEW.manhwa_id;
  END IF;

  UPDATE public.manhwas
  SET score = COALESCE(
    (SELECT ROUND(AVG(rating)::numeric, 1)
     FROM public.reviews
     WHERE manhwa_id = target_manhwa_id),
    0
  )
  WHERE id = target_manhwa_id;

  RETURN NULL;
END;
$$;

DROP TRIGGER IF EXISTS nekutton_refresh_manhwa_score ON public.reviews;
CREATE TRIGGER nekutton_refresh_manhwa_score
AFTER INSERT OR UPDATE OF rating OR DELETE ON public.reviews
FOR EACH ROW EXECUTE FUNCTION public.refresh_manhwa_score_from_reviews();
