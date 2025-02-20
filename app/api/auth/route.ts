import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/utils/supabase/server'
import { redirectToModal } from '@/config'
import { revalidateTag } from 'next/cache'

/**
 * Handles magic link (OTP) authentication requests
 *
 * @param request NextRequest containing email and redirect URL
 * @returns JSON response indicating success/failure of OTP email send
 *
 * Flow:
 * 1. Gets current session (if any) to invalidate its cache
 * 2. Initiates OTP sign in with email
 * 3. Invalidates relevant cache entries
 * 4. Returns success/error response
 */
export async function POST(request: NextRequest) {
  const supabase = createClient()

  const { email, next } = await request.json()

  try {
    // Get current session to handle cache invalidation for user switching
    const {
      data: { session: oldSession },
    } = await supabase.auth.getSession()

    // Initiate OTP sign in process
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        data: { full_name: email, avatar_url: '' },
        emailRedirectTo: redirectToModal(next),
      },
    })

    if (error) {
      throw new Error(error.message)
    }

    // Invalidate generic session tag for backwards compatibility
    revalidateTag('session')

    // If there was a previous session, invalidate its specific cache
    // This prevents stale data when switching between accounts
    if (oldSession?.user?.id) {
      const cacheKey = `session_${oldSession.user.id}_${oldSession.access_token.slice(-10)}`
      revalidateTag(cacheKey)
    }

    return NextResponse.json({
      status: 'Success',
      message: 'Magic link sent successfully. Check your email.',
    })
  } catch (error) {
    // Handle known errors with specific messages
    if (error instanceof Error) {
      return new NextResponse(
        JSON.stringify({ status: 'Error', message: error.message }),
        { status: 500 }
      )
    } else {
      // Handle unknown errors with generic message
      return new NextResponse(
        JSON.stringify({
          status: 'Error',
          message: 'An unknown error occurred',
        }),
        { status: 500 }
      )
    }
  }
}
