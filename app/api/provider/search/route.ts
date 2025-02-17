import { env } from '@/lib/env'
import { unipileClient } from '@/lib/unipile'
import { createClient } from '@/lib/utils/supabase/server'
import { NextResponse } from 'next/server'
import { UserProfileApiResponse } from 'unipile-node-sdk/dist/types/users/user-profile.types'

// request param
export type ProviderInvitePostParam = {
  account_id: string

  search_url?: string
  keywords?: string
  file_url?: string
  target_account_urls?: string[]
  my_list_id?: string

  manual?: boolean
  schedule?: string
  invite?: boolean
  export_profile?: boolean

  limit?: number
  message?: string
  network_distance?: number[]
  industry?: string[]
  location?: string[]
  profile_language?: string[]
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
}

export async function POST(req: Request) {
  try {
    const {
      account_id,
      search_url,
      keywords,
      file_url,
      target_account_urls,
      manual,
      schedule,
      export_profile,
      invite,
      limit,
      message,
      network_distance,
      industry,
      location,
      profile_language,
      company,
      past_company,
      school,
      service,
      connections_of,
      followers_of,
      open_to,
      advanced_keywords,
    }: ProviderInvitePostParam = await req.json()

    console.log('ProviderInvitePostParam', {
      account_id,
      search_url,
      keywords,
      file_url,
      target_account_urls,
      manual,
      schedule,
      export_profile,
      invite,
      limit,
      message,
      network_distance,
      industry,
      location,
      profile_language,
      company,
      past_company,
      school,
      service,
      connections_of,
      followers_of,
      open_to,
      advanced_keywords,
    })

    if (
      !account_id &&
      (!search_url || !keywords || !file_url || !target_account_urls)
    ) {
      return NextResponse.json(
        { error: 'Invalid request parameters' },
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

    if (search_url) {
      search_url.replace(
        'linkedin.com/search/results/?',
        'linkedin.com/search/results/people/?'
      )
    }

    const url = `https://${
      env.UNIPILE_DNS
    }/api/v1/linkedin/search?account_id=${account_id}&limit=${
      limit ? limit : 5
    }`

    const options = {
      method: 'POST',
      headers: {
        'X-API-KEY': env.UNIPILE_ACCESS_TOKEN,
        accept: 'application/json',
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        api: 'classic',
        category: 'people',
        url: search_url,
        keywords,
      }),
    }

    try {
      const responseOfSearch = await fetch(url, options)

      if (responseOfSearch.status !== 200) {
        return NextResponse.json(
          { error: 'An error occurred while searching' },
          { status: 500 }
        )
      }

      const dataOfSearch = await responseOfSearch.json()
      const profilePromises = dataOfSearch.items.map(
        async (item: { id: string; public_identifier: string }) => {
          console.log('item', item)

          try {
            // if (invite) {
            //   const responseOfSendInvitation = await unipileClient.users.sendInvitation({
            //     account_id,
            //     provider_id: item.id,
            //     message,
            //   })
            //   console.log('responseOfSendInvitation', responseOfSendInvitation)
            // }

            // if (export_profile) {
            const responseOfGetProfile = await unipileClient.users.getProfile({
              account_id,
              identifier: item.public_identifier,
              linkedin_sections: [
                'experience',
                // 'education',
                // 'languages',
                // 'skills',
                // 'certifications',
                // 'about',
              ],
            })

            console.log('responseOfGetProfile', responseOfGetProfile)
            return responseOfGetProfile
            // }
          } catch (error) {
            console.log(error)
            return null
          }
        }
      )

      // Wait for all profile fetches to complete
      const profileResults = await Promise.all(profilePromises)
      const validProfiles = profileResults.filter(
        (profile): profile is UserProfileApiResponse => profile !== null
      )

      // if (validProfiles.length > 0) {
      //   convertJsonToCsv(
      //     validProfiles,
      //     `output_${account_id}_${new Date().getTime()}.csv`
      //   )
      // }

      return NextResponse.json({ profile_list: validProfiles }, { status: 200 })
    } catch (error) {
      console.error('Search or Profile Fetch Error:', error)
      return NextResponse.json(
        { error: 'An error occurred while processing the request' },
        { status: 500 }
      )
    }
  } catch (error) {
    console.error('LinkedIn API Error:', error)
    return NextResponse.json(
      { error: 'An error occurred while processing the request' },
      { status: 500 }
    )
  }
}
