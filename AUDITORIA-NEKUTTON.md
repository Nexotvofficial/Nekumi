# Nekutton — correcciones aplicadas

Esta entrega contiene una revisión y una serie de correcciones del código fuente. No se debe considerar una garantía de ausencia total de errores: la aplicación depende de Supabase, de sus políticas RLS, de variables de entorno y de servicios externos que no están incluidos en el ZIP.

## Cambios principales

- Se eliminó del layout el bloqueo de zoom, el bloqueo del clic derecho y la pantalla anti-adblock que podía bloquear usuarios por falsos positivos.
- Se retiró el script que desregistraba todos los service workers y borraba todas las Cache Storage del navegador en cada visita.
- Se reemplazó `public/sw.js` por un worker de compatibilidad que no borra cachés ni se desregistra a sí mismo.
- Se estabilizó el cliente de Supabase en el navegador para evitar que `useEffect` se repita por recibir una instancia nueva en cada render. En renderizado del servidor no se comparte la instancia entre solicitudes.
- Se añadió la ruta `/reset-password`, que faltaba aunque el enlace de recuperación la usaba.
- Se mejoró el manejo de caché opcional y reintentos en el lector para tolerar `sessionStorage` deshabilitado o datos corruptos y limpiar el temporizador al desmontar.
- Se corrigieron metadatos para descripciones o portadas nulas y se unificó la marca visible a **Nekutton** donde se identificó en la interfaz.
- Los favoritos ahora se consultan y guardan en Supabase desde la portada y el detalle, para que ambas pantallas compartan el mismo estado. El botón de favoritos de la cabecera ahora abre el filtro de favoritos, el contador de notificaciones refleja las notificaciones cargadas y el CTA del boletín ya no finge guardar una suscripción que no tiene backend.
- Se implementó el auto-scroll del lector (antes el botón solo cambiaba el estado), con limpieza del temporizador y parada automática al cambiar a modo paginado.
- Se corrigió el marcado de las tarjetas para que el botón de favoritos no esté anidado dentro de un enlace.
- Se eliminó la escritura del correo del usuario desde las consultas públicas de reseñas y se dejó de permitir que el navegador cambie directamente la puntuación global del catálogo; el SQL hotfix recalcula la media en la base de datos con un trigger.
- Se añadió `supabase-security-hotfix.sql`: en el SQL original se encontró una política que permitía a cualquier usuario autenticado editar manhwas; el hotfix reconstruye las políticas RLS de las tablas principales para que el catálogo sea público en lectura, las escrituras sean administrativas y los favoritos queden privados por usuario. El SQL modifica políticas existentes, así que haz copia de seguridad y revisa el archivo antes de ejecutarlo.
- Se mejoraron legibilidad, áreas táctiles, foco de teclado y respeto a `prefers-reduced-motion`.
- Se retiró el widget Turnstile comentado y sin verificación real en servidor. Un CAPTCHA solo en cliente no debe presentarse como protección de seguridad.

## Antes de publicar

1. Configura `NEXT_PUBLIC_SUPABASE_URL` y `NEXT_PUBLIC_SUPABASE_ANON_KEY` en tu entorno de despliegue.
2. Revisa `supabase-security-hotfix.sql` y aplícalo en el SQL Editor de Supabase tras confirmar que el correo de administración coincide con tu cuenta. Haz copia de seguridad primero.
3. Después del hotfix, comprueba las políticas RLS de `profiles`, `favorites`, `reviews`, `chapters`, `pages`, `visits` y cualquier tabla administrativa. La autorización de administración no debe depender únicamente de esconder un enlace o redirigir en middleware.
4. Revisa el dominio `https://www.nekutoon.com`: se conserva como URL técnica existente porque cambiar el nombre de marca no cambia automáticamente el dominio ni sus DNS.
5. Ejecuta localmente `npm ci`, `npm run lint` y `npm run build`. No se pudieron ejecutar estas pruebas en este entorno porque la instalación de dependencias agotó el tiempo disponible.
6. Prueba inicio/cierre de sesión, recuperación de contraseña, creación/edición de contenido en administración, favoritos, reseñas, paginación de capítulos, lectura móvil y anuncios con tus credenciales reales.

## Importante

El ZIP no incluye credenciales ni puede validar políticas de base de datos remotas. El código fuente se ha corregido donde fue posible verificar el problema; los resultados de build y pruebas de integración deben confirmarse en tu entorno.
