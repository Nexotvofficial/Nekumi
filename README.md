# Nekutton

Aplicación Next.js para descubrir y leer manhwas/webtoons, con catálogo, lector de capítulos, cuentas de usuario y panel administrativo conectado a Supabase.

## Requisitos

- Node.js 20 o superior.
- Un proyecto Supabase con el esquema de tablas y las políticas RLS necesarias.
- Variables de entorno configuradas antes de ejecutar o compilar.

## Configuración local

1. Instala dependencias:

   ```bash
   npm ci
   ```

2. Crea `.env.local` y configura:

   ```env
   NEXT_PUBLIC_SUPABASE_URL=https://TU-PROYECTO.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=TU_CLAVE_ANON_PUBLICA
   ```

   Usa la clave pública anon/publishable. **Nunca** pongas una clave `service_role` en una variable `NEXT_PUBLIC_*` ni la subas al repositorio.

3. Inicia el servidor de desarrollo:

   ```bash
   npm run dev
   ```

4. Antes de publicar, ejecuta:

   ```bash
   npm run lint
   npm run build
   ```

## Base de datos y seguridad

- Revisa `supabase-security-hotfix.sql` antes de ejecutarlo en el SQL Editor de Supabase. Corrige la política conocida que permitía a cualquier usuario autenticado editar manhwas y restringe el acceso a correos de reseñas.
- Haz una copia de seguridad de la base de datos antes de aplicar migraciones.
- Confirma las políticas RLS de `manhwas`, `chapters`, `pages`, `profiles`, `reviews`, `favorites`, `visits` y Storage. La seguridad de las operaciones administrativas no debe depender solo de la interfaz.
- La cuenta administrativa está configurada actualmente con `diazmowi07@gmail.com` en el código y el SQL de migración; actualiza todas las referencias si cambias la cuenta.

## Comandos disponibles

- `npm run dev`: desarrollo.
- `npm run lint`: análisis estático con ESLint.
- `npm run build`: compilación de producción.
- `npm run start`: sirve la compilación de producción.

Consulta `AUDITORIA-NEKUTTON.md` para ver el alcance de las correcciones y las comprobaciones que faltan por ejecutar con credenciales reales.
