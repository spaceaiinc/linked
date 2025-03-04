import { env } from '@/lib/env'
import { Profile } from '@/lib/types/supabase'
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

    const { data: profileData, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single()

    if (error) {
      console.error('Profile not found:', error)
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 })
    }
    const profile = profileData as Profile

    // TODO: add check reconect or create
    const nameJson = JSON.stringify({
      user_id: user.id,
      company_id: profile.company_id,
    })

    const res = await unipileClient.account.createHostedAuthLink({
      // or reconnect
      type: 'create',
      // after 1 year fmt:'2026-02-01T12:00:00.701Z'
      expiresOn: new Date(Date.now() + 1000 * 60 * 60 * 24 * 365).toISOString(),
      api_url: `https://${env.UNIPILE_DNS}`,
      providers: ['LINKEDIN'],
      success_redirect_url: `${env.NEXT_PUBLIC_PRODUCTION_URL}/dashboard`,
      failure_redirect_url: `${env.NEXT_PUBLIC_PRODUCTION_URL}/dashboard`,
      name: nameJson,
      notify_url:
        env.NEXT_PUBLIC_APP_ENV === 'production'
          ? `${env.NEXT_PUBLIC_PRODUCTION_URL}/api/provider/auth/callback`
          : `https://bf55d429bb5a.ngrok.app/api/provider/auth/callback`,
    })

    res.url = res.url.replace('account.unipile.com', 'provider.spaceai.jp')

    return NextResponse.json(res)
  } catch (error) {
    console.error('LinkedIn API Error:', error)
    return NextResponse.json(
      { error: 'An error occurred while sending messages' },
      { status: 500 }
    )
  }
}
