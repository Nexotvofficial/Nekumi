-- Tabla para configuración del sitio (imágenes de categorías, etc)
CREATE TABLE IF NOT EXISTS site_config (
  id INT PRIMARY KEY DEFAULT 1,
  category_images JSONB DEFAULT '{"Todos": "", "Fantasía": "", "Acción": "", "Romance": "", "Drama": "", "+18": ""}'::jsonb,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Habilitar RLS
ALTER TABLE site_config ENABLE ROW LEVEL SECURITY;
CREATE POLICY "site_config_select" ON site_config FOR SELECT USING (true);
CREATE POLICY "site_config_update" ON site_config FOR UPDATE USING (auth.uid() IN (SELECT id FROM auth.users WHERE email = 'diazmowi07@gmail.com'));
CREATE POLICY "site_config_insert" ON site_config FOR INSERT WITH CHECK (auth.uid() IN (SELECT id FROM auth.users WHERE email = 'diazmowi07@gmail.com'));

-- Insertar fila por defecto si no existe
INSERT INTO site_config (id) VALUES (1) ON CONFLICT (id) DO NOTHING;
