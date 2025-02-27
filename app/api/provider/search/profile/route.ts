import { env } from '@/lib/env'
import {
  convertProfileToSupabaseLeadsInsert,
  searchProfileBodyType,
  convertSearchProfileToSupabaseLeadsInsert,
} from '@/lib/searchProfileRequest'
import { WorkflowStatus } from '@/lib/types/master'
import { Database, LeadInsert } from '@/lib/types/supabase'
import { unipileClient } from '@/lib/unipile'
import { createClient } from '@/lib/utils/supabase/server'
import { searchProfileSchema } from '@/lib/validation'
import { NextResponse } from 'next/server'

export async function POST(req: Request) {
  /**
   * validate param
   */
  const param = await searchProfileSchema.validate(await req.json(), {
    abortEarly: false, // すべてのエラーを一度に収集
    stripUnknown: true, // 未知のフィールドを削除
  })
  console.log('Validated params:', param)

  let nextCursor = ''
  let status = WorkflowStatus.FAILED
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

  try {
    /**
     * clear param by active_tab
     */
    if (param.active_tab == 0 && param.search_url) {
      param.keywords = undefined
      param.company_urls = []
      param.network_distance = []
      param.mylist_id = undefined
      param.target_public_identifiers = []
    } else if (
      (param.active_tab == 1 && param.keywords) ||
      (param.active_tab == 1 && param.company_urls?.length)
    ) {
      param.search_url = undefined
      param.mylist_id = undefined
      param.target_public_identifiers = []
    } else if (param.active_tab == 2 && param.mylist_id) {
      param.search_url = undefined
      param.keywords = undefined
      param.network_distance = []
      param.company_urls = []
      param.target_public_identifiers = []
    } else if (
      (param.target_public_identifiers && param.active_tab == 3) ||
      (param.target_public_identifiers && param.active_tab == 4)
    ) {
      param.search_url = undefined
      param.keywords = undefined
      param.company_urls = []
      param.network_distance = []
      param.mylist_id = undefined
    } else {
      return NextResponse.json(
        {
          error:
            'Search URL or Keywords or Mylist ID or Target Public Identifiers is required',
        },
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
        scheduled_hours: param.scheduled_hours || [],
        scheduled_days: param.scheduled_days || [],
        scheduled_weekdays: param.scheduled_weekdays || [],
        search_url: param.search_url || '',
        company_private_identifiers: param.company_private_identifiers || [],
        network_distance: param.network_distance || [],
        target_public_identifiers: param.target_public_identifiers || [],
        // mylist_id: param.mylist_id,
        keywords: param.keywords || '',
        limit_count: Number(param.limit_count),
        message: param.message || '',
      }

      const responseOfInsertWorkflow = await supabase
        .from('workflows')
        .insert(workflow)
        .select('id')
        .single()
      console.log('responseOfInsertWorkflow:', responseOfInsertWorkflow)
      param.workflow_id = responseOfInsertWorkflow.data?.id
    }
    if (!param.workflow_id) {
      return NextResponse.json(
        {
          error:
            'Search URL or Keywords or Mylist ID or Target Public Identifiers is required',
        },
        { status: 400 }
      )
    }

    /**
     * if scheduled_hours or scheduled_weekdays is empty or workflow_id exists
     */
    let profileList: LeadInsert[] = []
    // let profileList: UserProfileApiResponse[] = []
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
      if (param.target_public_identifiers.length) {
        console.log('continue with target_public_identifiers')
        const profilePromises = param.target_public_identifiers?.map(
          async (publicIdentifier: string) => {
            const responseOfGetProfile = await unipileClient.users.getProfile({
              account_id: param.account_id,
              identifier: publicIdentifier,
              linkedin_sections: '*',
            })
            console.log('responseOfGetProfile', responseOfGetProfile)
            // 2 sec wait for each profile fetch
            await new Promise((resolve) => setTimeout(resolve, 5000))
            return responseOfGetProfile
          }
        )

        // Wait for all profile fetches to complete
        const unipileProfileList = await Promise.all(profilePromises)
        console.log('unipileProfileList', unipileProfileList)
        // Wait for all profile fetches to complete
        const leadPromises = unipileProfileList.map(async (profile) => {
          if (!profile || profile !== undefined) return
          const convertedLead = await convertProfileToSupabaseLeadsInsert(
            profile,
            provider.company_id,
            param.workflow_id as string,
            param.type
          )
          console.log('convertedLead', convertedLead)
          return convertedLead
        })
        const leads = await Promise.all(leadPromises)
        profileList = leads.filter(
          (lead) => lead !== null && lead !== undefined
        ) as LeadInsert[]

        /**
         * if search_url exists, search profiles
         */
      } else {
        console.log('continue with keywords')
        if (param.search_url) {
          param.search_url.replace(
            'linkedin.com/search/results/all',
            'linkedin.com/search/results/people'
          )
        }

        if (
          !param.company_private_identifiers?.length &&
          param.company_urls?.length
        ) {
          const companyUrlsPrimises = param.company_urls.map(
            async (company_url) => {
              company_url = company_url
                .replace('https://www.linkedin.com/company/', '')
                .replace('/people/', '')
                .replace('/asia-pacific-europe-america/', '')
                .replace('/jobs/', '')
                .replace('/posts/?feedView=all', '')
                .replace('/about/', '')
                .replace('/?originalSubdomain=jp', '')
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
          param.company_private_identifiers = companyUrls.map((company) => {
            return company.id
          })
        }

        // 50超える場合は、５0ずつに分けて実行　cursorを取得して、次のリクエストを送る
        let excuteSearchCount = 1
        let dataOfSearchList: any[] = []
        if (param.limit_count && param.limit_count > 50) {
          excuteSearchCount = Math.ceil(param.limit_count / 50)
        }

        for (let i = 0; i < excuteSearchCount; i++) {
          let nowLimitCount = 0
          if (param.limit_count < 51) nowLimitCount = param.limit_count
          else
            nowLimitCount =
              param.limit_count - 50 * i > 50 ? 50 : param.limit_count - 50 * i
          if (nowLimitCount === undefined || nowLimitCount <= 0) break
          console.log(
            'excuteSearchCount',
            excuteSearchCount,
            'nowLimitCount',
            nowLimitCount,
            'i',
            i
          )

          const searchProfileBody: searchProfileBodyType = {
            api: 'classic',
            category: 'people',
          }

          if (param.search_url) searchProfileBody.url = param.search_url
          if (param.keywords) searchProfileBody.keywords = param.keywords
          if (param?.company_private_identifiers?.length)
            searchProfileBody.company = param.company_private_identifiers
          if (param.network_distance?.length)
            searchProfileBody.network_distance = param.network_distance

          const url = `https://${
            env.UNIPILE_DNS
          }/api/v1/linkedin/search?${nextCursor && 'cursor=' + nextCursor + '&'}account_id=${param.account_id}&limit=${nowLimitCount}`
          console.log('url', url, 'body', searchProfileBody)

          const responseOfSearch = await fetch(url, {
            method: 'POST',
            headers: {
              'X-API-KEY': env.UNIPILE_ACCESS_TOKEN,
              accept: 'application/json',
              'content-type': 'application/json',
            },
            body: JSON.stringify(searchProfileBody),
          })

          if (responseOfSearch.status !== 200) {
            console.log('responseOfSearch', responseOfSearch)
            return NextResponse.json(
              { error: 'An error occurred while searching' },
              { status: 500 }
            )
          }
          const dataOfSearch = await responseOfSearch.json()
          nextCursor = dataOfSearch.cursor || ''
          console.log('nextCursor', nextCursor)
          if (
            dataOfSearch !== undefined &&
            dataOfSearch.items &&
            dataOfSearch.items.length
          )
            dataOfSearchList.push(...dataOfSearch.items)
          await new Promise((resolve) => setTimeout(resolve, 5000))
        }

        if (
          (param.type === 1 || param.type === 2) &&
          dataOfSearchList.length < 51
        ) {
          const profilePromises = dataOfSearchList.map(
            async (item: { id: string; public_identifier: string }) => {
              console.log('item:', item.public_identifier)
              if (
                !item.public_identifier ||
                item.public_identifier === '' ||
                item.public_identifier === 'null' ||
                item.public_identifier === null
              ) {
                return
              }
              const responseOfGetProfile = await unipileClient.users.getProfile(
                {
                  account_id: param.account_id,
                  identifier: item.public_identifier,
                  linkedin_sections: '*',
                }
              )
              // 2 sec wait for each profile fetch
              await new Promise((resolve) => setTimeout(resolve, 5000))
              return responseOfGetProfile
            }
          )
          const unipileProfileList = await Promise.all(profilePromises)
          // Wait for all profile fetches to complete
          const leadPromises = unipileProfileList
            .filter((profile) => profile !== undefined && profile !== null)
            .map(async (profile) => {
              if (!profile || profile === undefined) return null
              const convertedLead = await convertProfileToSupabaseLeadsInsert(
                profile,
                provider.company_id,
                param.workflow_id as string,
                param.type
              )
              return convertedLead
            })

          const leads = await Promise.all(leadPromises)
          profileList.push(
            ...(leads.filter(
              (lead) => lead !== null && lead !== undefined
            ) as LeadInsert[])
          )
        } else {
          const dataOfSearchListPromises = dataOfSearchList.map(
            async (profile) => {
              if (!profile || profile === undefined) return null
              const list = await convertSearchProfileToSupabaseLeadsInsert(
                profile,
                provider.company_id,
                param.workflow_id as string
              )
              return list
            }
          )

          const leads = await Promise.all(dataOfSearchListPromises)
          profileList.push(
            ...(leads.filter(
              (lead) => lead !== null && lead !== undefined
            ) as LeadInsert[])
          )
        }

        if (param.type === 0 || param.type === 2) {
          const invitePromises = profileList.map(async (profile) => {
            if ('provider_id' in profile) {
              unipileClient.users
                .sendInvitation({
                  account_id: param.account_id,
                  provider_id: profile.private_identifier,
                  message: param.message || undefined,
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
        }
      }
    }

    status = WorkflowStatus.SUCCESS
    return NextResponse.json({ profile_list: profileList }, { status: 200 })
  } catch (error) {
    console.error('Error in POST /api/provider/invite:', error)
    return NextResponse.json(
      { error: 'Internal server error: ' + error },
      { status: 500 }
    )
  } finally {
    if (param.workflow_id) {
      const workflowHistories: Database['public']['Tables']['workflow_histories']['Insert'] =
        {
          company_id: provider.company_id,
          workflow_id: param.workflow_id,
          target_private_identifiers: [],
          cursor: nextCursor || '',
          status: status,
        }

      const responseOfInsertWorkflowHistory = await supabase
        .from('workflow_histories')
        .insert(workflowHistories)
      console.log(
        'responseOfInsertWorkflowHistory:',
        responseOfInsertWorkflowHistory
      )
    }
  }
}

// "CEO" OR "役員" OR "取締役" OR "部長" OR "Manager" OR "Director"
