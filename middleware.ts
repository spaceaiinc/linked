import type { NextRequest } from 'next/server'
import { updateSession } from '@/lib/utils/supabase/middleware'

export async function middleware(request: NextRequest) {
  await updateSession(request)
  return
  // // 認証が必要なパスの判定
  // if (request.nextUrl.pathname.startsWith('/api/linkedin')) {
  //   const authToken = request.cookies.get('auth_token')

  //   if (!authToken?.value) {
  //     return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  //   }

  //   try {
  //     await decrypt(authToken.value)
  //     return NextResponse.next()
  //   } catch (error) {
  //     return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
  //   }
  // }

  // return NextResponse.next()
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * Feel free to modify this pattern to include more paths.
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
