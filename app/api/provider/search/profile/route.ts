import { extractNumbers, extractStrings } from '@/lib/convert'
import { env } from '@/lib/env'
import { Database } from '@/lib/types/supabase'
import { unipileClient } from '@/lib/unipile'
import { createClient } from '@/lib/utils/supabase/server'
import { NextResponse } from 'next/server'
import { UserProfileApiResponse } from 'unipile-node-sdk/dist/types/users/user-profile.types'

// request param
export type ProviderSearchProfilePostParam = {
  account_id: string
  type?: number // 0: invite, 1: export 2: invite and export

  search_url?: string
  keywords?: string
  target_public_identifiers?: string[]
  mylist_id?: string
  active_tab?: number // 0: search, 1: keywords, 2: mylist, 3: target_public_identifiers

  limit_count?: number
  message?: string
  network_distance?: number[]

  scheduled_hours?: number[]
  scheduled_days?: number[]
  scheduled_weekdays?: number[]
  workflow_id?: string
}

export async function POST(req: Request) {
  try {
    const rawParam = await req.json()
    if (!rawParam.account_id || !rawParam.type || !rawParam.active_tab) {
      return NextResponse.json(
        { error: 'Account ID and Type is required' },
        { status: 400 }
      )
    }
    const param: ProviderSearchProfilePostParam = {
      // account
      account_id: rawParam.account_id,
      type: Number(rawParam.type),

      // search
      search_url: rawParam.search_url,
      keywords: rawParam.keywords,
      target_public_identifiers: extractStrings(
        rawParam.target_public_identifiers
      ),
      active_tab: Number(rawParam.active_tab),
      // TODO:
      // mylist_id: rawParam.mylist_id,

      // form
      limit_count: rawParam.limit_count ? Number(rawParam.limit_count) : 10,
      message: rawParam.message,
      network_distance: extractNumbers(rawParam.network_distance),

      // schedule
      scheduled_hours: extractNumbers(rawParam.scheduled_hours),
      scheduled_days: extractNumbers(rawParam.scheduled_days),
      scheduled_weekdays: extractNumbers(rawParam.scheduled_weekdays),
      workflow_id: rawParam.workflow_id,
    } as ProviderSearchProfilePostParam

    console.log('ProviderSearchProfilePostParam', param)
    if (
      !param.account_id &&
      ((!param.search_url && param.active_tab == 0) ||
        (!param.keywords && param.active_tab == 1) ||
        (!param.mylist_id && param.active_tab == 2) ||
        (!param.target_public_identifiers && param.active_tab == 3))
    ) {
      return NextResponse.json(
        {
          error:
            'Search URL or Keywords or Mylist ID or Target Public Identifiers is required',
        },
        { status: 400 }
      )
    }

    if (param.active_tab == 0) {
      param.keywords = undefined
      param.network_distance = undefined
      param.mylist_id = undefined
      param.target_public_identifiers = undefined
    } else if (param.active_tab == 1) {
      param.search_url = undefined
      param.mylist_id = undefined
      param.target_public_identifiers = undefined
    } else if (param.active_tab == 2) {
      param.search_url = undefined
      param.keywords = undefined
      param.network_distance = undefined
      param.target_public_identifiers = undefined
    } else if (param.active_tab == 3) {
      param.search_url = undefined
      param.keywords = undefined
      param.network_distance = undefined
      param.mylist_id = undefined
    }

    // authenticate
    const supabase = createClient()
    const { data: provider } = await supabase
      .from('providers')
      .select('id, company_id')
      .eq('account_id', param.account_id)
      .single()

    if (!provider || !provider?.id) {
      return NextResponse.json(
        { error: 'Invalid LinkedIn account' },
        { status: 400 }
      )
    }

    // 招待含むかつscheduleなしに実行する
    if (
      // (param.type === 0 || param.type === 2) &&
      // param.scheduled_days?.length ||
      param.scheduled_hours?.length &&
      param.scheduled_weekdays?.length &&
      !param.workflow_id
    ) {
      const workflow: Database['public']['Tables']['workflows']['Insert'] = {
        company_id: provider.company_id,
        provider_id: provider.id,
        type: param.type || 1,
        scheduled_hours: param.scheduled_hours,
        scheduled_days: param.scheduled_days,
        scheduled_weekdays: param.scheduled_weekdays,
        search_url: param.search_url,
        target_public_identifiers: param.target_public_identifiers,
        keywords: param.keywords,
        network_distance: param.network_distance,
        limit_count: Number(param.limit_count),
      }

      const responseOfInsertWorkflow = await supabase
        .from('workflows')
        .insert(workflow)
      console.log('responseOfInsertWorkflow:', responseOfInsertWorkflow)

      return NextResponse.json(
        { message: 'Created workflow without scheduling' },
        { status: 200 }
      )

      // target_public_identifiers あり
    } else if (param.target_public_identifiers) {
      const publicIdentifiers = param.target_public_identifiers
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
          const url = `https://${env.UNIPILE_DNS}/api/v1/users/${publicIdentifier}?account_id=${param.account_id}&linkedin_sections=experience`

          const responseOfGetProfile = await fetch(url, options)
          console.log('responseOfGetProfile', responseOfGetProfile)
          if (responseOfGetProfile.status !== 200) {
            return null
          }
          const dataOfGetProfile = await responseOfGetProfile.json()
          console.log('dataOfGetProfile', dataOfGetProfile)
          // 2 sec wait for each profile fetch
          await new Promise((resolve) => setTimeout(resolve, 1000))
          return dataOfGetProfile
        }
      )

      // Wait for all profile fetches to complete
      const profileResults = await Promise.all(profilePromises)
      const invitePromises = profileResults.map(async (profile) => {
        console.log('profile', profile)
        if (param.type === 0 || param.type === 2) {
          const responseOfSendInvitation =
            await unipileClient.users.sendInvitation({
              account_id: param.account_id,
              provider_id: profile.id,
              message: param.message,
            })
          console.log('responseOfSendInvitation', responseOfSendInvitation)
        }
      })

      const inviteResults = await Promise.all(invitePromises)
      console.log('inviteResults', inviteResults)

      if (!param.workflow_id) {
        const workflow: Database['public']['Tables']['workflows']['Insert'] = {
          company_id: provider.company_id,
          provider_id: provider.id,
          type: Number(param.type),
          scheduled_hours: param.scheduled_hours || undefined,
          scheduled_days: param.scheduled_days || undefined,
          scheduled_weekdays: param.scheduled_weekdays || undefined,
          target_public_identifiers:
            param.target_public_identifiers || undefined,
          limit_count: Number(param.limit_count),
        }

        const responseOfInsertWorkflow = await supabase
          .from('workflows')
          .insert(workflow)
          .select('id')
          .single()
        console.log('responseOfInsertWorkflow:', responseOfInsertWorkflow)
        param.workflow_id = responseOfInsertWorkflow.data?.id
      }
      if (param.workflow_id) {
        const workflowHistories: Database['public']['Tables']['workflow_histories']['Insert'] =
          {
            company_id: provider.company_id,
            workflow_id: param.workflow_id,
            target_private_identifiers: [],
            cursor: '',
            status: 1,
          }

        const responseOfInsertWorkflowHistory = await supabase
          .from('workflow_histories')
          .insert(workflowHistories)
        console.log(
          'responseOfInsertWorkflowHistory:',
          responseOfInsertWorkflowHistory
        )
      }

      return NextResponse.json(
        { profile_list: profileResults },
        { status: 200 }
      )

      // target_public_identifiers なし
    } else {
      if (param.search_url) {
        param.search_url.replace(
          'linkedin.com/search/results/?',
          'linkedin.com/search/results/people/?'
        )
      }

      // 50超える場合は、５0ずつに分けて実行　cursorを取得して、次のリクエストを送る
      // let excuteSearchCount = 1
      // let nextCursor = ''
      // if (param.limit_count && param.limit_count > 50) {
      //   excuteSearchCount = Math.ceil(param.limit_count / 50)
      // }
      // console.log('excuteSearchCount', excuteSearchCount)

      // for (let i = 0; i < excuteSearchCount; i++) {
      //   const nowLimitCount = param.limit_count
      //     ? param.limit_count - i * 50
      //     : 50
      //   const url = `https://${
      //     env.UNIPILE_DNS
      //   }/api/v1/linkedin/search?account_id=${param.account_id}&limit=${
      //     nowLimitCount > 50 ? 50 : nowLimitCount
      //   }&${nextCursor ? `cursor=${nextCursor}` : ''}`

      //   const options = {
      //     method: 'POST',
      //     headers: {
      //       'X-API-KEY': env.UN

      const url = `https://${
        env.UNIPILE_DNS
      }/api/v1/linkedin/search?account_id=${param.account_id}&limit=${
        param.limit_count ? param.limit_count : 10
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
          url: param.search_url,
          keywords: param.keywords,
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

          if (param.type === 0 || param.type === 2) {
            const responseOfSendInvitation =
              await unipileClient.users.sendInvitation({
                account_id: param.account_id,
                provider_id: item.id,
                message: param.message,
              })
            console.log('responseOfSendInvitation', responseOfSendInvitation)
          }

          if (param.type === 1 || param.type === 2) {
            const responseOfGetProfile = await unipileClient.users.getProfile({
              account_id: param.account_id,
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
            // 2 sec wait for each profile fetch
            await new Promise((resolve) => setTimeout(resolve, 1000))
            return responseOfGetProfile
          }
        }
      )

      // Wait for all profile fetches to complete
      const profileResults = await Promise.all(profilePromises)
      const validProfiles = profileResults.filter(
        (profile): profile is UserProfileApiResponse => profile !== null
      )
      if (!param.workflow_id) {
        const workflow: Database['public']['Tables']['workflows']['Insert'] = {
          company_id: provider.company_id,
          provider_id: provider.id,
          type: Number(param.type),
          scheduled_hours: param.scheduled_hours,
          scheduled_days: param.scheduled_days,
          scheduled_weekdays: param.scheduled_weekdays,
          search_url: param.search_url,
          keywords: param.keywords,
          limit_count: Number(param.limit_count),
        }

        const responseOfInsertWorkflow = await supabase
          .from('workflows')
          .insert(workflow)
          .select('id')
          .single()
        console.log('responseOfInsertWorkflow:', responseOfInsertWorkflow)
        param.workflow_id = responseOfInsertWorkflow.data?.id
      }
      if (param.workflow_id) {
        const workflowHistories: Database['public']['Tables']['workflow_histories']['Insert'] =
          {
            company_id: provider.company_id,
            workflow_id: param.workflow_id,
            target_private_identifiers: [],
            cursor: '',
            status: 1,
          }

        const responseOfInsertWorkflowHistory = await supabase
          .from('workflow_histories')
          .insert(workflowHistories)
        console.log(
          'responseOfInsertWorkflowHistory:',
          responseOfInsertWorkflowHistory
        )
      }

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
