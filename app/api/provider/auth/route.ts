import { env } from '@/lib/env'
import { unipileClient } from '@/lib/unipile'
import { createClient } from '@/lib/utils/supabase/server'
import { NextResponse } from 'next/server'

export async function POST(req: Request) {
  try {
    const supabase = createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json(
        { error: 'User not authenticated' },
        { status: 401 }
      )
    }

    const res = await unipileClient.account.createHostedAuthLink({
      // or reconnect
      type: 'create',
      expiresOn: '2025-12-22T12:00:00.701Z',
      api_url: `https://${env.UNIPILE_DNS}`,
      providers: ['LINKEDIN'],
      // TODO:
      success_redirect_url: `${env.NEXT_PUBLIC_PRODUCTION_URL}/linkedin`,
      failure_redirect_url: `${env.NEXT_PUBLIC_PRODUCTION_URL}/linkedin`,
      notify_url: `${env.NEXT_PUBLIC_PRODUCTION_URL}/api/provider/auth/callback?user_id=${user.id}`,
    })

    return NextResponse.json(res)
  } catch (error) {
    console.error('LinkedIn API Error:', error)
    return NextResponse.json(
      { error: 'An error occurred while sending messages' },
      { status: 500 }
    )
  }
}
