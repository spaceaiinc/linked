import { extractColumnData } from '@/lib/csv'
import { env } from '@/lib/env'
import { Database, Workflow } from '@/lib/types/supabase'
import { unipileClient } from '@/lib/unipile'
import { createClient } from '@/lib/utils/supabase/server'
import { NextResponse } from 'next/server'
import { UserProfileApiResponse } from 'unipile-node-sdk/dist/types/users/user-profile.types'

// request param
export type ProviderInvitePostParam = {
  account_id: string

  search_url?: string
  keywords?: string
  target_public_identifiers?: string
  mylist_id?: string
  active_tab?: number // 0: search, 1: keywords, 2: file

  scheduled_hours?: number[]
  scheduled_days?: number[]
  scheduled_weekdays?: number[]
  extract_column?: string

  type?: string // 0: invite, 1: export

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
    let {
      account_id,
      type,

      search_url,
      keywords,
      target_public_identifiers,
      active_tab,
      mylist_id,
      extract_column,

      scheduled_hours,
      scheduled_days,
      scheduled_weekdays,

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
    active_tab = Number(active_tab)
    console.log('ProviderInvitePostParam', {
      account_id,
      type,

      active_tab,
      search_url,
      keywords,
      target_public_identifiers,
      mylist_id,
      extract_column,

      scheduled_hours,
      scheduled_days,
      scheduled_weekdays,

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
      ((!search_url && active_tab == 0) ||
        (!keywords && active_tab == 1) ||
        (!mylist_id && active_tab == 2) ||
        (!target_public_identifiers && active_tab == 3))
    ) {
      return NextResponse.json(
        {
          error:
            'Search URL or Keywords or Mylist ID or Target Public Identifiers is required',
        },
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

    if (target_public_identifiers) {
      const publicIdentifiers = target_public_identifiers.trim().split(',')
      const options = {
        method: 'GET',
        headers: {
          'X-API-KEY': env.UNIPILE_ACCESS_TOKEN,
          accept: 'application/json',
          'content-type': 'application/json',
        },
      }
      const profilePromises = publicIdentifiers.map(
        async (publicIdentifier: string) => {
          console.log('item(', publicIdentifier, ')')
          const url = `https://${env.UNIPILE_DNS}/api/v1/users/${publicIdentifier}?account_id=${account_id}&linkedin_sections=experience`

          const responseOfGetProfile = await fetch(url, options)
          console.log('responseOfGetProfile', responseOfGetProfile)
          if (responseOfGetProfile.status !== 200) {
            return null
          }
          const dataOfGetProfile = await responseOfGetProfile.json()
          console.log('dataOfGetProfile', dataOfGetProfile)
          return dataOfGetProfile
        }
      )

      // Wait for all profile fetches to complete
      const profileResults = await Promise.all(profilePromises)
      const invitePromises = profileResults.map(async (profile) => {
        console.log('profile', profile)
        if (type?.includes('0')) {
          const responseOfSendInvitation =
            await unipileClient.users.sendInvitation({
              account_id,
              provider_id: profile.id,
              message,
            })
          console.log('responseOfSendInvitation', responseOfSendInvitation)
        }
      })

      const inviteResults = await Promise.all(invitePromises)
      console.log('inviteResults', inviteResults)

      return NextResponse.json(
        { profile_list: profileResults },
        { status: 200 }
      )

      // target_public_identifiers なし
    } else {
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

          if (type?.includes('0')) {
            const responseOfSendInvitation =
              await unipileClient.users.sendInvitation({
                account_id,
                provider_id: item.id,
                message,
              })
            console.log('responseOfSendInvitation', responseOfSendInvitation)
          }

          if (type?.includes('1')) {
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
          }
        }
      )

      // Wait for all profile fetches to complete
      const profileResults = await Promise.all(profilePromises)
      const validProfiles = profileResults.filter(
        (profile): profile is UserProfileApiResponse => profile !== null
      )

      const supabase = createClient()
      const workflow: Database['public']['Tables']['workflows']['Insert'] = {
        provider_id: provider.id,
        type: 0,
        scheduled_hours: scheduled_hours ? scheduled_hours : [],
        scheduled_days: scheduled_days ? scheduled_days : [],
        scheduled_weekdays: scheduled_weekdays ? scheduled_weekdays : [],
        search_url: search_url ? search_url : null,
        target_public_identifiers: [],
        keywords: '',
        network_distance: [],
        message: '',
        limit: 0,
      }

      const responseOfInsertWorkflow = await supabase
        .from('workflows')
        .insert(workflow)
      console.log('responseOfInsertWorkflow:', responseOfInsertWorkflow)

      return NextResponse.json({ profile_list: validProfiles }, { status: 200 })
    }
  } catch (error) {
    console.error('Error in POST /api/provider/invite:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
