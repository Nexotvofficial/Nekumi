import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // 🛡️ TRAMPA PARA HACKERS: Bloquear rutas de escaneo malicioso (0ms, sin llamadas de red)
  const maliciousPaths = ['.env', '.git', 'wp-admin', 'phpmyadmin', 'config.php', '.aws']
  if (maliciousPaths.some((p) => pathname.includes(p))) {
    return new NextResponse('ACCESO DENEGADO - IP REGISTRADA', { status: 403 })
  }

  // 🛡️ Regla de Seguridad: Consultar sesión de Supabase ÚNICAMENTE en /admin
  if (pathname.startsWith('/admin')) {
    let supabaseResponse = NextResponse.next({ request })

    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://nfuvrtlhkvprjpzeepim.supabase.co',
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'sb_publishable_beZGsE6z0k_E-9SRi2jDmw_gExM4Oh_',
      {
        cookies: {
          getAll() {
            return request.cookies.getAll()
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
            supabaseResponse = NextResponse.next({ request })
            cookiesToSet.forEach(({ name, value, options }) =>
              supabaseResponse.cookies.set(name, value, options)
            )
          },
        },
      }
    )

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user || user.email !== 'diazmowi07@gmail.com') {
      const url = request.nextUrl.clone()
      url.pathname = '/'
      return NextResponse.redirect(url)
    }

    return supabaseResponse
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    '/admin/:path*',
    '/.env/:path*',
    '/.env',
    '/.git/:path*',
    '/wp-admin/:path*',
    '/phpmyadmin/:path*',
    '/config.php',
    '/.aws/:path*',
  ],
}
