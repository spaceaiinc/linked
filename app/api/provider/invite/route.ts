import { env } from '@/lib/env'
import { unipileClient } from '@/lib/unipile'
import { createClient } from '@/lib/utils/supabase/server'
import { NextResponse } from 'next/server'

export async function POST(req: Request) {
  try {
    const {
      account_id,
      keywords,
      message,
      industry,
      location,
      profile_language,
      network_distance,
      company,
      past_company,
      school,
      service,
      connections_of,
      followers_of,
      open_to,
      advanced_keywords,
    }: {
      account_id: string
      keywords: string
      message: string
      industry?: string[]
      location?: string[]
      profile_language?: string[]
      network_distance?: number[]
      company?: string[]
      past_company?: string[]
      school?: string[]
      service?: string[]
      connections_of?: string[]
      followers_of?: string[]
      open_to?: string[]
      advanced_keywords?: {
        first_name?: string
        last_name?: string
        title?: string
        company?: string
        school?: string
      }
    } = await req.json()

    if (!account_id || !keywords) {
      return NextResponse.json(
        { error: 'Keyword and message are required' },
        { status: 400 }
      )
    }

    // authenticate
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

    const { data: provider } = await supabase
      .from('providers')
      .select('id')
      .eq('user_id', user.id)
      .eq('account_id', account_id)
      .single()

    if (!provider || !provider?.id) {
      return NextResponse.json(
        { error: 'Invalid LinkedIn account' },
        { status: 400 }
      )
    }

    const url = `https://${env.UNIPILE_DNS}/api/v1/linkedin/search?account_id=${account_id}&limit=10`
    const options = {
      method: 'POST',
      headers: {
        accept: 'application/json',
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        api: 'classic',
        category: 'people',
        keywords,
        industry,
        location,
        profile_language,
        network_distance,
        company,
        past_company,
        school,
        service,
        connections_of,
        followers_of,
        open_to,
        advanced_keywords,
      }),
    }

    fetch(url, options)
      .then(async (responseOfSearch) => {
        if (!responseOfSearch.ok) {
          return NextResponse.json(
            { error: 'An error occurred while searching' },
            { status: 500 }
          )
        }
        const dataOfSearch = await responseOfSearch.json()
        dataOfSearch.items.map(async (item: { id: any }) => {
          // send invitation
          const responseOfSendInvitation =
            await unipileClient.users.sendInvitation({
              account_id: item.id,
              provider_id: 'LINKEDIN',
              message,
            })
          console.log('response', responseOfSendInvitation)
          //           {
          //   "object": "UserInvitationSent",
          //   "invitation_id": "string",
          //   "usage": 0
          // }
        })
      })
      .then((json) => console.log(json))
      .catch((err) => {
        console.error(err)
        return NextResponse.json(
          { error: 'An error occurred while searching' },
          { status: 500 }
        )
      })

    return NextResponse.json({
      success: true,
    })
  } catch (error) {
    console.error('LinkedIn API Error:', error)
    return NextResponse.json(
      { error: 'An error occurred while sending messages' },
      { status: 500 }
    )
  }
}
