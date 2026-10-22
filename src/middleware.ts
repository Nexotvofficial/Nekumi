import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({
            request,
          })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // Obtener el usuario actual
  const {
    data: { user },
  } = await supabase.auth.getUser()

  // 🛡️ TRAMPA PARA HACKERS: Bloquear rutas de escaneo malicioso
  const maliciousPaths = ['.env', '.git', 'wp-admin', 'phpmyadmin', 'config.php', '.aws'];
  if (maliciousPaths.some(path => request.nextUrl.pathname.includes(path))) {
    // Si un bot intenta buscar vulnerabilidades, lo mandamos a un agujero negro
    return new NextResponse("ACCESO DENEGADO - IP REGISTRADA", { status: 403 });
  }

  // 🛡️ Regla de Seguridad: Proteger la ruta /admin
  if (request.nextUrl.pathname.startsWith('/admin')) {
    // Si no hay usuario o el correo NO es el tuyo, patearlo al inicio
    if (!user || user.email !== 'diazmowi07@gmail.com') {
      const url = request.nextUrl.clone()
      url.pathname = '/'
      return NextResponse.redirect(url)
    }
  }

  return supabaseResponse
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico, sitemap.xml, robots.txt (metadata files)
     * - images/svgs
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
