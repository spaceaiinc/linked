import { extractNumbers, extractStrings } from '@/lib/convert'
import { env } from '@/lib/env'
import { Database } from '@/lib/types/supabase'
import { unipileClient } from '@/lib/unipile'
import { createClient } from '@/lib/utils/supabase/server'
import { NextResponse } from 'next/server'
import { UserProfileApiResponse } from 'unipile-node-sdk/dist/types/users/user-profile.types'

type searchProfileBodyType = {
  api: string
  category: string
  url?: string
  keywords?: string
  company?: string[]
  network_distance?: number[]
}

// request param
export type ProviderSearchProfilePostParam = {
  account_id: string
  type?: number // 0: invite, 1: export 2: invite and export

  search_url?: string
  target_public_identifiers?: string[]
  mylist_id?: string
  keywords?: string
  company_urls?: string[]
  network_distance?: number[]
  active_tab?: number // 0: search, 1: keywords, 2: mylist, 3: target_public_identifiers

  limit_count?: number
  message?: string

  scheduled_hours?: number[]
  scheduled_days?: number[]
  scheduled_weekdays?: number[]
  workflow_id?: string
  batch_id?: string
}

export async function POST(req: Request) {
  try {
    /**
     * validate param
     */
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
      company_urls: extractStrings(rawParam.company_urls),
      network_distance: extractNumbers(rawParam.network_distance),
      target_public_identifiers: extractStrings(
        rawParam.target_public_identifiers
      ),
      active_tab: Number(rawParam.active_tab),
      // TODO:
      // mylist_id: rawParam.mylist_id,

      // form
      limit_count: rawParam.limit_count ? Number(rawParam.limit_count) : 10,
      message: rawParam.message,

      // schedule
      scheduled_hours: extractNumbers(rawParam.scheduled_hours),
      scheduled_days: extractNumbers(rawParam.scheduled_days),
      scheduled_weekdays: extractNumbers(rawParam.scheduled_weekdays),
      workflow_id: rawParam.workflow_id,
      batch_id: rawParam.batch_id,
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

    /**
     * clear param by active_tab
     */
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

    /**
     * authenticate
     */
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

    /**
     * create workflow
     */
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

    /**
     * if scheduled_hours or scheduled_weekdays is empty or workflow_id exists
     */
    let profileList: UserProfileApiResponse[] = []
    if (
      (!param.scheduled_hours?.length && !param.scheduled_weekdays?.length) ||
      (param.workflow_id !== undefined &&
        param.workflow_id !== '' &&
        !param.workflow_id &&
        param.workflow_id !== null)
    ) {
      /**
       * if target_public_identifiers exist, get profiles detail
       */
      if (param.target_public_identifiers) {
        const profilePromises = param.target_public_identifiers.map(
          async (publicIdentifier: string) => {
            const responseOfGetProfile = await unipileClient.users.getProfile({
              account_id: param.account_id,
              identifier: publicIdentifier,
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
        )

        // Wait for all profile fetches to complete
        profileList = await Promise.all(profilePromises)

        /**
         * if search_url exists, search profiles
         */
      } else {
        if (param.search_url) {
          param.search_url.replace(
            'linkedin.com/search/results/all',
            'linkedin.com/search/results/people'
          )
        }

        let companyPrivateIdentifiers: string[] = []
        if (param.company_urls?.length) {
          const companyUrlsPrimises = param.company_urls.map(
            async (company_url) => {
              company_url = company_url
                .replace('https://www.linkedin.com/company/', '')
                .replace('/people/', '')
                .replace('/asia-pacific-europe-america/', '')
                .replace('/jobs/', '')
                .replace('/posts/?feedView=all', '')
                .replace('/about/', '')
              console.log('company_url', company_url)
              const responseOfGetCompany = await fetch(
                `https://${
                  env.UNIPILE_DNS
                }/api/v1/linkedin/company/${company_url}?account_id=${param.account_id}`,
                {
                  method: 'GET',
                  headers: {
                    accept: 'application/json',
                    'X-API-KEY': env.UNIPILE_ACCESS_TOKEN,
                  },
                }
              )
              console.log('responseOfGetCompany', responseOfGetCompany)

              if (responseOfGetCompany.status !== 200) {
                return NextResponse.json(
                  { error: 'An error occurred while getting company' },
                  { status: 500 }
                )
              }
              const dataOfGetCompany = await responseOfGetCompany.json()
              return dataOfGetCompany
            }
          )

          const companyUrls = await Promise.all(companyUrlsPrimises)
          companyPrivateIdentifiers = companyUrls.map((company) => {
            return company.id
          })
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
        //       'X-API-KEY': env.UNIPILE_ACCESS_TOKEN,
        const searchProfileBody: searchProfileBodyType = {
          api: 'classic',
          category: 'people',
        }

        if (param.search_url) searchProfileBody.url = param.search_url
        if (param.keywords) searchProfileBody.keywords = param.keywords
        if (companyPrivateIdentifiers.length)
          searchProfileBody.company = companyPrivateIdentifiers
        if (param.network_distance?.length)
          searchProfileBody.network_distance = param.network_distance

        console.log('searchProfileBody', searchProfileBody)

        const responseOfSearch = await fetch(
          `https://${
            env.UNIPILE_DNS
          }/api/v1/linkedin/search?account_id=${param.account_id}&limit=${
            param.limit_count ? param.limit_count : 10
          }`,
          {
            method: 'POST',
            headers: {
              'X-API-KEY': env.UNIPILE_ACCESS_TOKEN,
              accept: 'application/json',
              'content-type': 'application/json',
            },
            body: JSON.stringify(searchProfileBody),
          }
        )

        console.log('responseOfSearch', responseOfSearch)

        if (responseOfSearch.status !== 200) {
          return NextResponse.json(
            { error: 'An error occurred while searching' },
            { status: 500 }
          )
        }
        const dataOfSearch = await responseOfSearch.json()
        if (param.type === 1 || param.type === 2) {
          const profilePromises = dataOfSearch.items.map(
            async (item: { id: string; public_identifier: string }) => {
              console.log('item', item)
              const responseOfGetProfile = await unipileClient.users.getProfile(
                {
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
                }
              )
              console.log('responseOfGetProfile', responseOfGetProfile)
              // 2 sec wait for each profile fetch
              await new Promise((resolve) => setTimeout(resolve, 1000))
              return responseOfGetProfile
            }
          )
          // Wait for all profile fetches to complete
          profileList = await Promise.all(profilePromises)
        } else {
          profileList = dataOfSearch.items.map((item: { id: string }) => {
            return {
              provider_id: item.id,
            }
          })
        }
      }

      if (param.type === 0 || param.type === 2) {
        const invitePromises = profileList.map(async (profile) => {
          console.log('profile', profile)
          if ('provider_id' in profile) {
            unipileClient.users
              .sendInvitation({
                account_id: param.account_id,
                provider_id: profile.provider_id,
                message: param.message,
              })
              .then((responseOfSendInvitation) => {
                console.log(
                  'responseOfSendInvitation',
                  responseOfSendInvitation
                )
              })
              .catch((error) => {
                if (error?.body?.type === 'errors/already_invited_recently') {
                  console.log(
                    'Skipping lead - invitation was already sent recently'
                  )
                } else {
                  console.error('Error in send invitation:', error)
                  // return NextResponse.json(
                  //   { error: 'Internal server error' },
                  //   { status: 500 }
                  // )
                }
              })
          }
        })

        const inviteResults = await Promise.all(invitePromises)
        console.log('inviteResults', inviteResults)
      }
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

    return NextResponse.json({ profile_list: profileList }, { status: 200 })
  } catch (error) {
    console.error('Error in POST /api/provider/invite:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
