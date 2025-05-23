import { env } from '@/lib/env'
import {
  searchProfileBodyType,
  upsertLeadByUnipileUserProfileApiResponse,
  upsertLeadByUnipilePerformSearchProfile,
  upsertLead,
  unipileProfileWithStatus,
  leadWithStatus,
  unipilePeformSearchProfileWithStatus,
  fetchLeadsWithLatestStatusFilter,
  fetchLeadsWithLatestStatusAndWorkflow,
  updateLeadStatusByTargetWorkflowId,
  searchProfileSalesNavigatorBodyType,
} from '@/lib/db/queries/lead'
import {
  ActiveTab,
  LeadStatus,
  NetworkDistance,
  ReactionType,
  WorkflowStatus,
  WorkflowType,
} from '@/lib/types/master'
import {
  Database,
  Lead,
  Provider,
  PublicSchemaTables,
} from '@/lib/types/supabase'
import { unipileClient } from '@/lib/unipile'
import { createClient as createClientInServer } from '@/lib/utils/supabase/server'
import { searchProfileSchema } from '@/lib/validation'
import { NextResponse } from 'next/server'
import { supabase as serviceSupabase } from '@/lib/utils/supabase/service'
import { SupabaseClient } from '@supabase/supabase-js'
import { decodeJapaneseOnly } from '@/lib/utils/decode'

export async function POST(req: Request) {
  // TODO: 処理を分割する
  /**
   * validate param
   */
  const param = await searchProfileSchema.validate(await req.json(), {
    // すべてのエラーを一度に収集
    abortEarly: false,
    // 未知のフィールドを削除
    stripUnknown: true,
  })
  console.log('Validated params:', param)
  if (param.active_tab === ActiveTab.SEARCH) {
    param.keywords = undefined
    param.company_urls = []
    param.company_private_identifiers = []
    param.network_distance = []
    param.target_public_identifiers = []
    param.target_workflow_id = undefined
    param.search_reaction_profile_public_identifier = undefined
  } else if (param.active_tab === ActiveTab.KEYWORDS) {
    param.search_url = undefined
    param.target_public_identifiers = []
    param.target_workflow_id = undefined
    param.search_reaction_profile_public_identifier = undefined
  } else if (param.active_tab === ActiveTab.LEAD_LIST) {
    param.search_url = undefined
    param.keywords = undefined
    param.company_urls = []
    param.company_private_identifiers = []
    param.network_distance = []
    param.target_public_identifiers = []
    param.search_reaction_profile_public_identifier = undefined
  } else if (
    param.active_tab === ActiveTab.FILE_URL ||
    param.active_tab === ActiveTab.UPLOAD
  ) {
    param.search_url = undefined
    param.keywords = undefined
    param.company_urls = []
    param.company_private_identifiers = []
    param.network_distance = []
    param.search_reaction_profile_public_identifier = undefined
  } else if (param.active_tab === ActiveTab.SEARCH_REACTION) {
    param.search_url = undefined
    param.keywords = undefined
    param.company_urls = []
    param.company_private_identifiers = []
    param.network_distance = []
    param.target_public_identifiers = []
    param.target_workflow_id = undefined
  }

  const scheduled =
    param.scheduled_hours?.length ||
    param.scheduled_weekdays?.length ||
    param.scheduled_months?.length ||
    param.scheduled_days?.length
      ? true
      : false
  const fromSchedule =
    param.schedule_id !== undefined && param.schedule_id ? true : false

  let nextCursor = ''
  let status = WorkflowStatus.FAILED
  let insertWorkflowResponse = null
  let unipileProfilesWithStatus: unipileProfileWithStatus[] = []
  let leadsWithStatus: leadWithStatus[] = []
  let unipiePerformSearchProfilesWithStatus: unipilePeformSearchProfileWithStatus[] =
    []

  /**
   * authenticate
   */
  let supabase: SupabaseClient = createClientInServer()
  if (fromSchedule) {
    supabase = serviceSupabase
  }

  // adminクライアントを作成（RLSをバイパス）
  const { data: providerData, error: getProviderError } = await supabase
    .from('providers')
    .select('*')
    .eq('account_id', param.account_id)
    .single()
  if (!providerData || providerData === undefined || getProviderError) {
    console.error('Error in get provider:', getProviderError)
    return NextResponse.json(
      { error: 'Invalid LinkedIn Account' },
      { status: 400 }
    )
  }
  const provider = providerData as Provider

  try {
    /**
     * if target_public_identifiers exist, get profiles detail
     */
    if (param.target_public_identifiers.length) {
      console.log('continue with target_public_identifiers')
      // スケジュールではない場合、リードを作成
      if (scheduled) {
        const leadsDataInDb = await fetchLeadsWithLatestStatusFilter(
          supabase,
          provider.id,
          param.target_public_identifiers
        )
        const leadsInDb: Lead[] = leadsDataInDb as Lead[]

        const insertLeadPromises = param.target_public_identifiers.map(
          async (publicIdentifier: string) => {
            if (!publicIdentifier || publicIdentifier === undefined) return
            let leadDataId = ''
            let shouldUpdateStatus = false
            leadsInDb.forEach((lead) => {
              if (
                lead.public_identifier === decodeJapaneseOnly(publicIdentifier)
              ) {
                leadDataId = lead.id as string
                if (lead.lead_statuses.length === 0) {
                  shouldUpdateStatus = true
                } else {
                  // sort by created_at desc
                  lead.lead_statuses.sort((a, b) => {
                    return (
                      new Date(b.created_at).getTime() -
                      new Date(a.created_at).getTime()
                    )
                  })
                  if (
                    lead.lead_statuses[0]?.status === LeadStatus.SEARCHED ||
                    lead.lead_statuses[0]?.status === LeadStatus.INVITED_FAILED
                  ) {
                    shouldUpdateStatus = true
                  }
                }
              }
            })
            if (!leadDataId) {
              const { data: InsertLeadData, error: insertLeadError } =
                await supabase
                  .from('leads')
                  .insert({
                    provider_id: provider.id,
                    company_id: provider.company_id,
                    public_identifier: publicIdentifier,
                  })
                  .select('id')
                  .single()
              if (insertLeadError) {
                console.error('Error in insert lead:', insertLeadError)
                return NextResponse.json(
                  { error: 'Internal server error' },
                  { status: 500 }
                )
              }
              if (!InsertLeadData || InsertLeadData === undefined) return
              leadDataId = InsertLeadData.id as string
            }
            // update lead workflows
            const leadWorkflows: PublicSchemaTables['lead_workflows']['Insert'] =
              {
                workflow_id: param.workflow_id,
                lead_id: leadDataId,
                company_id: provider.company_id,
              }

            const { error: insertLeadWorkflowError } = await supabase
              .from('lead_workflows')
              .upsert(leadWorkflows, { onConflict: 'workflow_id, lead_id' })
            if (insertLeadWorkflowError) {
              console.error(
                'Error in insert lead workflow:',
                insertLeadWorkflowError
              )
              return NextResponse.json(
                { error: 'Internal server error' },
                { status: 500 }
              )
            }

            if (!shouldUpdateStatus) return
            // update lead statuses
            const leadStatus: PublicSchemaTables['lead_statuses']['Insert'] = {
              status: LeadStatus.IN_QUEUE,
              lead_id: leadDataId,
              company_id: provider.company_id,
              workflow_id: param.workflow_id,
            }
            const { error: insertLeadStatusError } = await supabase
              .from('lead_statuses')
              .insert(leadStatus)
            if (insertLeadStatusError) {
              console.error(
                'Error in insert lead status:',
                insertLeadStatusError
              )
              return NextResponse.json(
                { error: 'Internal server error' },
                { status: 500 }
              )
            }

            return
          }
        )
        await Promise.all(insertLeadPromises)
      } else {
        const leadPromises = param.target_public_identifiers?.map(
          async (publicIdentifier: string, index: number) => {
            if (!publicIdentifier || publicIdentifier === undefined) return
            if (index > param.limit_count) {
              console.log('limit over')
              return
            }
            const getProfileResponse = await unipileClient.users.getProfile({
              account_id: param.account_id,
              identifier: publicIdentifier,
              linkedin_sections: '*',
            })
            await new Promise((resolve) => setTimeout(resolve, 700))
            if (!getProfileResponse || getProfileResponse === undefined) return

            let leadStatus = LeadStatus.SEARCHED
            if (
              param.type === WorkflowType.INVITE &&
              'provider_id' in getProfileResponse
            ) {
              leadStatus = LeadStatus.INVITED
              const sendInvitationParam: {
                account_id: string
                provider_id: string
                message?: string
              } = {
                account_id: param.account_id,
                provider_id: getProfileResponse.provider_id,
              }
              await new Promise((resolve) => setTimeout(resolve, 700))
              if (param.invitation_message)
                sendInvitationParam.message = param.invitation_message
              unipileClient.users
                .sendInvitation(sendInvitationParam)
                .then((sendInvitationResponse) => {
                  if (sendInvitationResponse.invitation_id) {
                    // leadStatus = LeadStatus.INVITED
                  } else {
                    leadStatus = LeadStatus.INVITED_FAILED
                  }
                })
                .catch(async (error) => {
                  // error type ref: https://developer.unipile.com/reference/userscontroller_adduserbyidentifier
                  if (
                    error?.body?.type === 'errors/already_invited_recently' ||
                    error?.body?.type === 'errors/cannot_invite_attendee'
                  ) {
                    console.log(
                      'Skipping lead - invitation was already sent recently'
                    )
                    leadStatus = LeadStatus.ALREADY_INVITED
                  } else if (
                    error?.body?.type === 'errors/invalid_recipient' ||
                    error?.body?.type === 'errors/cannot_resend_yet' ||
                    error?.body?.type === 'errors/provider_error'
                  ) {
                    // wait for 5 seconds
                    console.log('provider rate limit error' + error)
                    await new Promise((resolve) => setTimeout(resolve, 5000))
                  } else {
                    console.error('Error in send invitation:', error)
                    leadStatus = LeadStatus.INVITED_FAILED
                  }
                })
              await new Promise((resolve) => setTimeout(resolve, 700))
            }

            const unipileProfile: unipileProfileWithStatus = {
              leadId: '',
              leadStatus: leadStatus,
              unipileProfile: getProfileResponse,
            }

            return unipileProfile
          }
        )
        const searchedLeadList = await Promise.all(leadPromises)
        const filteredSearchedLeadList = searchedLeadList.filter(
          (lead) => lead !== undefined
        ) as unipileProfileWithStatus[]
        // const upsertedLeadList =
        await upsertLeadByUnipileUserProfileApiResponse({
          supabase,
          unipileProfiles: filteredSearchedLeadList,
          providerId: provider.id as string,
          workflowId: param.workflow_id as string,
          companyId: provider.company_id,
          scheduled_days: param.scheduled_days,
          scheduled_hours: param.scheduled_hours,
          scheduled_months: param.scheduled_months,
          scheduled_weekdays: param.scheduled_weekdays,
        })
      }
      const workflow: Database['public']['Tables']['workflows']['Update'] = {
        id: param.workflow_id,
        company_id: provider.company_id,
        provider_id: provider.id,
        name: param.name,
        scheduled_hours: param.scheduled_hours || [],
        scheduled_days: param.scheduled_days || [],
        scheduled_months: param.scheduled_months || [],
        scheduled_weekdays: param.scheduled_weekdays || [],
        target_workflow_id: param.workflow_id || '',
        limit_count: Number(param.limit_count),
        invitation_message: param.invitation_message || '',
        invitation_message_dify_api_key:
          param.invitation_message_dify_api_key || '',
        run_limit_count: param.run_limit_count,
        agent_type: param.agent_type,
        last_updated_user_id: param.last_updated_user_id,
      }

      const { data: workflowData, error: updateWorkflowError } = await supabase
        .from('workflows')
        .update(workflow)
        .eq('id', param.workflow_id)
        .select('*')
        .single()
      if (updateWorkflowError) {
        console.error('Error in inserting workflow:', updateWorkflowError)
        return NextResponse.json(
          { error: 'Internal server error' },
          { status: 500 }
        )
      }
      insertWorkflowResponse = workflowData

      /**
       * if search_url exists, search profiles
       */
    } else if (param.target_workflow_id) {
      if (fromSchedule || !scheduled) {
        console.log('continue with target_workflow_id')
        const targetLeadData = await fetchLeadsWithLatestStatusAndWorkflow(
          supabase,
          param.target_workflow_id,
          LeadStatus.IN_QUEUE,
          param.limit_count
        )
        const targetLeads = targetLeadData as Lead[]
        const profilePromises = targetLeads?.map(async (lead: Lead) => {
          if (!lead || lead === undefined) return
          if (!lead.private_identifier) {
            const getProfileResponse = await unipileClient.users.getProfile({
              account_id: param.account_id,
              identifier: lead.public_identifier as string,
              linkedin_sections: '*',
            })

            await new Promise((resolve) => setTimeout(resolve, 700))
            let leadStatus = LeadStatus.SEARCHED
            if (
              param.type === WorkflowType.INVITE &&
              'provider_id' in getProfileResponse
            ) {
              leadStatus = LeadStatus.INVITED
              const sendInvitationParam: {
                account_id: string
                provider_id: string
                message?: string
              } = {
                account_id: param.account_id,
                provider_id: getProfileResponse.provider_id,
              }

              if (param.invitation_message)
                sendInvitationParam.message = param.invitation_message
              unipileClient.users
                .sendInvitation(sendInvitationParam)

                .then((sendInvitationResponse) => {
                  if (sendInvitationResponse.invitation_id) {
                    // leadStatus = LeadStatus.INVITED
                  } else {
                    leadStatus = LeadStatus.INVITED_FAILED
                  }
                })
                .catch(async (error) => {
                  if (
                    error?.body?.type === 'errors/already_invited_recently' ||
                    error?.body?.type === 'errors/cannot_invite_attendee'
                  ) {
                    console.log(
                      'Skipping lead - invitation was already sent recently'
                    )
                    leadStatus = LeadStatus.ALREADY_INVITED
                  } else if (
                    error?.body?.type === 'errors/invalid_recipient' ||
                    error?.body?.type === 'errors/cannot_resend_yet' ||
                    error?.body?.type === 'errors/provider_error'
                  ) {
                    // wait for 5 seconds
                    console.log('provider rate limit error' + error)
                    await new Promise((resolve) => setTimeout(resolve, 5000))
                  } else {
                    console.error('Error in send invitation:', error)
                    leadStatus = LeadStatus.INVITED_FAILED
                  }
                })
              await new Promise((resolve) => setTimeout(resolve, 700))
            }

            unipileProfilesWithStatus.push({
              leadId: lead.id,
              leadStatus: leadStatus,
              unipileProfile: getProfileResponse,
            })
            return
          } else {
            let leadStatus = LeadStatus.SEARCHED
            if (param.type === WorkflowType.INVITE) {
              leadStatus = LeadStatus.INVITED
              const sendInvitationParam: {
                account_id: string
                provider_id: string
                message?: string
              } = {
                account_id: param.account_id,
                provider_id: lead.private_identifier,
              }
              if (param.invitation_message)
                sendInvitationParam.message = param.invitation_message
              unipileClient.users
                .sendInvitation(sendInvitationParam)
                .then((sendInvitationResponse) => {
                  if (sendInvitationResponse.invitation_id) {
                    // leadStatus = LeadStatus.INVITED
                  } else {
                    leadStatus = LeadStatus.INVITED_FAILED
                  }
                })
                .catch(async (error) => {
                  if (
                    error?.body?.type === 'errors/already_invited_recently' ||
                    error?.body?.type === 'errors/cannot_invite_attendee'
                  ) {
                    console.log(
                      'Skipping lead - invitation was already sent recently'
                    )
                    leadStatus = LeadStatus.ALREADY_INVITED
                  } else if (
                    error?.body?.type === 'errors/invalid_recipient' ||
                    error?.body?.type === 'errors/cannot_resend_yet' ||
                    error?.body?.type === 'errors/provider_error'
                  ) {
                    // wait for 5 seconds
                    console.log('provider rate limit error' + error)
                    await new Promise((resolve) => setTimeout(resolve, 5000))
                  } else {
                    console.error('Error in send invitation:', error)
                    leadStatus = LeadStatus.INVITED_FAILED
                  }
                })
              await new Promise((resolve) => setTimeout(resolve, 700))
            }

            leadsWithStatus.push({
              lead: lead,
              leadId: lead.id,
              leadStatus: leadStatus,
            })
            return
          }
        })

        await Promise.all(profilePromises)
      } else {
        await updateLeadStatusByTargetWorkflowId({
          supabase,
          targetWorkflowId: param.target_workflow_id,
          targetStatus: LeadStatus.IN_QUEUE,
          companyId: provider.company_id,
          workflowId: param.workflow_id,
        })
      }
      if (!fromSchedule) {
        const workflow: Database['public']['Tables']['workflows']['Update'] = {
          id: param.workflow_id,
          company_id: provider.company_id,
          provider_id: provider.id,
          name: param.name,
          scheduled_hours: param.scheduled_hours || [],
          scheduled_days: param.scheduled_days || [],
          scheduled_months: param.scheduled_months || [],
          scheduled_weekdays: param.scheduled_weekdays || [],
          target_workflow_id: param.target_workflow_id,
          limit_count: Number(param.limit_count),
          invitation_message: param.invitation_message || '',
          invitation_message_dify_api_key:
            param.invitation_message_dify_api_key || '',
          run_limit_count: param.run_limit_count,
          agent_type: param.agent_type,
          last_updated_user_id: param.last_updated_user_id,
        }

        const { data: workflowData, error } = await supabase
          .from('workflows')
          .update(workflow)
          .eq('id', param.workflow_id)
          .select('*')
          .single()
        if (error) {
          console.error('Error in inserting workflow:', error)
          return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
          )
        }
        insertWorkflowResponse = workflowData
        console.log('insertWorkflowResponse:', insertWorkflowResponse)
      }
    } else if (
      param.search_url ||
      param.keywords ||
      param.company_urls.length ||
      param.company_private_identifiers.length
    ) {
      console.log('continue with keywords')
      // 保存されている最新のhistoriesからcursorを取得
      const { data: historiesData, error: selectHistoriesError } =
        await supabase
          .from('workflow_histories')
          .select('*')
          .eq('workflow_id', param.workflow_id)
          .order('created_at', { ascending: false })
          .limit(1)
      if (selectHistoriesError) {
        console.error('Error in get histories:', selectHistoriesError)
        return NextResponse.json(
          { error: 'Internal server error' },
          { status: 500 }
        )
      }

      if (historiesData && historiesData.length) {
        nextCursor = historiesData[0].cursor
      }
      console.log('latest nextCursor in db:', nextCursor)

      if (param.search_url)
        // TODO: url prefix
        param.search_url = param.search_url.replace(
          'linkedin.com/search/results/all',
          'linkedin.com/search/results/people'
        )

      if (
        !param.company_private_identifiers?.length &&
        param.company_urls?.length
      ) {
        const companyUrlsPrimises = param.company_urls.map(
          async (companyUrl) => {
            const splitedCompanyUrl = companyUrl.split('linkedin.com/company/')
            if (splitedCompanyUrl.length < 2) {
              return NextResponse.json(
                { error: 'Invalid company url' },
                { status: 400 }
              )
            }
            const companyPublicIdentifier = splitedCompanyUrl[1].split('/')[0]
            const getCompanyResponse = await fetch(
              `https://${
                env.UNIPILE_DNS
              }/api/v1/linkedin/company/${companyPublicIdentifier}?account_id=${param.account_id}`,
              {
                method: 'GET',
                headers: {
                  accept: 'application/json',
                  'X-API-KEY': env.UNIPILE_ACCESS_TOKEN,
                },
              }
            )
            console.log('getCompanyResponse', getCompanyResponse)

            if (getCompanyResponse.status !== 200) {
              return NextResponse.json(
                { error: 'An error occurred while getting company' },
                { status: 500 }
              )
            }
            const dataOfGetCompany = await getCompanyResponse.json()
            return dataOfGetCompany
          }
        )

        const companyUrls = await Promise.all(companyUrlsPrimises)
        param.company_private_identifiers = companyUrls.map((company) => {
          return company.id
        })
      }

      if (fromSchedule || !scheduled) {
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
          // console.log(
          //   'excuteSearchCount',
          //   excuteSearchCount,
          //   'nowLimitCount',
          //   nowLimitCount,
          //   'i',
          //   i
          // )

          //www.linkedin.com/sales/search/people?recentSearchId=4603213788&sessionId=Q%2Bw5Sj3ITBaUC4KlLZqw0g%3D%3D
          // sales/search/peopleを含む場合は　api: 'salesnavigator' で search_urlではなく、search_idを指定する
          let searchProfileBody:
            | searchProfileBodyType
            | searchProfileSalesNavigatorBodyType
            | null = null

          if (param.search_url) {
            if (param.search_url.includes('sales/search/people')) {
              console.log('sales navigator search url', param.search_url)
              if (param.search_url.includes('recentSearchId')) {
                const splitedSearchUrl =
                  param.search_url.split('recentSearchId=')
                if (splitedSearchUrl.length < 2) {
                  return NextResponse.json(
                    { error: 'Invalid search url' },
                    { status: 400 }
                  )
                }
                const searchId = splitedSearchUrl[1].split('&')[0]
                searchProfileBody = {
                  api: 'sales_navigator',
                  category: 'people',
                  recent_search_id: searchId,
                }
              } else if (param.search_url.includes('savedSearchId')) {
                const splitedSearchUrl =
                  param.search_url.split('savedSearchId=')
                if (splitedSearchUrl.length < 2) {
                  return NextResponse.json(
                    { error: 'Invalid search url' },
                    { status: 400 }
                  )
                }
                const searchId = splitedSearchUrl[1].split('&')[0]
                searchProfileBody = {
                  api: 'sales_navigator',
                  category: 'people',
                  saved_search_id: searchId,
                }
              } else {
                // Handle other sales navigator URLs that don't have specific IDs
                searchProfileBody = {
                  api: 'sales_navigator',
                  category: 'people',
                  url: param.search_url,
                }
              }
            } else {
              searchProfileBody = {
                api: 'classic',
                category: 'people',
                url: param.search_url,
              }
            }
          } else {
            searchProfileBody = {
              api: 'classic',
              category: 'people',
            }
          }

          console.log('searchProfileBody', searchProfileBody)
          if (!searchProfileBody) {
            return NextResponse.json(
              { error: 'Invalid search url' },
              { status: 400 }
            )
          }
          if (param.keywords) searchProfileBody.keywords = param.keywords
          if (param?.company_private_identifiers?.length)
            searchProfileBody.company = param.company_private_identifiers
          if (param.network_distance?.length)
            searchProfileBody.network_distance = param.network_distance

          const url = `https://${
            env.UNIPILE_DNS
          }/api/v1/linkedin/search?${nextCursor && 'cursor=' + nextCursor + '&'}account_id=${param.account_id}&limit=${nowLimitCount}`
          console.log('url', url, 'body', searchProfileBody)

          try {
            // レスポンスを一度だけ取得して処理
            const performSearchResponse = await fetch(url, {
              method: 'POST',
              headers: {
                'X-API-KEY': env.UNIPILE_ACCESS_TOKEN,
                accept: 'application/json',
                'content-type': 'application/json',
              },
              body: JSON.stringify(searchProfileBody),
            })

            // ステータスをチェック
            if (performSearchResponse.status !== 200) {
              const errorText = await performSearchResponse.text()
              console.log(
                'An error occurred while searching:\nstatusText:' +
                  performSearchResponse.statusText
              )
              console.log('Error details:', errorText)
              return NextResponse.json(
                {
                  error:
                    'An error occurred while searching: ' +
                    performSearchResponse.statusText,
                  details: errorText,
                },
                { status: 500 }
              )
            }

            // 成功時のみJSONとして処理
            const dataOfSearch = await performSearchResponse.json()
            nextCursor = dataOfSearch.cursor || ''
            if (
              dataOfSearch !== undefined &&
              dataOfSearch.items &&
              dataOfSearch.items.length
            )
              dataOfSearchList.push(...dataOfSearch.items)
          } catch (error) {
            console.error('Search profile fetch error:', error)
            return NextResponse.json(
              { error: 'Failed to process search request: ' + error },
              { status: 500 }
            )
          }

          await new Promise((resolve) => setTimeout(resolve, 700))
          if (nextCursor === '') break
        }

        if (
          param.type === WorkflowType.SEARCH &&
          dataOfSearchList.length < 150
        ) {
          const privateIdentifiers = dataOfSearchList.map(
            (item) => item.private_identifier
          )
          const { data: leadsDataInDb, error: selectLeadsError } =
            await supabase
              .from('leads')
              .select('*')
              .eq('provider_id', provider.id)
              .in('private_identifier', privateIdentifiers)
          if (selectLeadsError) {
            console.error('Error in get lead:', selectLeadsError)
            return NextResponse.json(
              { error: 'Internal server error' },
              { status: 500 }
            )
          }
          const leadsInDb: Lead[] = leadsDataInDb as Lead[]

          // シーケンシャル処理に変更（Promise.allを使わない）
          const unipileProfileList = []

          for (const item of dataOfSearchList) {
            let matched = false

            // 既存のデータとのマッチング確認
            for (const leadInDb of leadsInDb) {
              if (
                leadInDb.public_identifier ===
                decodeJapaneseOnly(item.public_identifier)
              ) {
                leadsWithStatus.push({
                  leadId: leadInDb.id,
                  leadStatus: LeadStatus.SEARCHED,
                  lead: leadInDb,
                })
                matched = true
                break
              }
            }

            if (matched) continue

            // public_identifierの検証
            if (
              !item.public_identifier ||
              item.public_identifier === '' ||
              item.public_identifier === 'null' ||
              item.public_identifier === null
            ) {
              unipileProfilesWithStatus.push({
                leadId: '',
                leadStatus: LeadStatus.SEARCHED,
                unipileProfile: item,
              })
              continue
            }

            // 各リクエスト前に5秒待機
            await new Promise((resolve) => setTimeout(resolve, 700))

            // プロファイル取得
            try {
              const getProfileResponse = await unipileClient.users.getProfile({
                account_id: param.account_id,
                identifier: item.public_identifier,
                linkedin_sections: '*',
              })

              if (getProfileResponse) {
                unipileProfilesWithStatus.push({
                  unipileProfile: getProfileResponse,
                  leadStatus: LeadStatus.SEARCHED,
                  leadId: '',
                })
                unipileProfileList.push(getProfileResponse)
              }
            } catch (getProfileErrorUnknown) {
              const error = getProfileErrorUnknown as any
              console.error('Error fetching profile:', error)
              // エラーが発生しても処理を続行
              if (
                'body' in error &&
                error?.body?.type === 'errors/invalid_recipient'
              ) {
                console.log('skip lead - invalid recipient')
              } else {
                console.error('Error in send invitation:', error)
              }
            }
          }

          // 全てのプロファイル処理が完了
          console.log(`Processed ${unipileProfileList.length} profiles`)
        } else {
          const dataOfSearchListPromises = dataOfSearchList.map(
            async (profile) => {
              if (!profile || profile === undefined) return null
              let leadStatus = LeadStatus.SEARCHED
              if (param.type === WorkflowType.INVITE && 'id' in profile) {
                console.log('profile', profile)
                leadStatus = LeadStatus.INVITED
                const sendInvitationParam: {
                  account_id: string
                  provider_id: string
                  message?: string
                } = {
                  account_id: param.account_id,
                  provider_id: profile.id,
                }
                await new Promise((resolve) => setTimeout(resolve, 700))
                if (param.invitation_message)
                  sendInvitationParam.message = param.invitation_message
                unipileClient.users
                  .sendInvitation(sendInvitationParam)

                  .then((sendInvitationResponse) => {
                    if (sendInvitationResponse.invitation_id) {
                      // leadStatus = LeadStatus.INVITED
                    } else {
                      leadStatus = LeadStatus.INVITED_FAILED
                    }
                  })
                  .catch(async (error) => {
                    if (
                      error?.body?.type === 'errors/already_invited_recently' ||
                      error?.body?.type === 'errors/cannot_invite_attendee'
                    ) {
                      console.log(
                        'Skipping lead - invitation was already sent recently'
                      )
                      leadStatus = LeadStatus.ALREADY_INVITED
                    } else if (
                      error?.body?.type === 'errors/invalid_recipient' ||
                      error?.body?.type === 'errors/cannot_resend_yet' ||
                      error?.body?.type === 'errors/provider_error'
                    ) {
                      // wait for 5 seconds
                      console.log('provider rate limit error' + error)
                      await new Promise((resolve) => setTimeout(resolve, 5000))
                    } else {
                      console.error('Error in send invitation:', error)
                      leadStatus = LeadStatus.INVITED_FAILED
                    }
                  })
                await new Promise((resolve) => setTimeout(resolve, 700))
              }

              console.log('status', leadStatus)
              unipiePerformSearchProfilesWithStatus.push({
                unipileProfile: profile,
                leadStatus: leadStatus,
                leadId: '',
              })
              return
            }
          )
          await Promise.all(dataOfSearchListPromises)
        }
      }
      if (!fromSchedule) {
        const workflow: Database['public']['Tables']['workflows']['Update'] = {
          id: param.workflow_id,
          company_id: provider.company_id,
          provider_id: provider.id,
          name: param.name,
          scheduled_hours: param.scheduled_hours || [],
          scheduled_days: param.scheduled_days || [],
          scheduled_months: param.scheduled_months || [],
          scheduled_weekdays: param.scheduled_weekdays || [],
          search_url: param.search_url || '',
          keywords: param.keywords || '',
          company_private_identifiers: param.company_private_identifiers || [],
          network_distance: param.network_distance || [],
          limit_count: Number(param.limit_count),
          // TODO: MSG COlumn
          invitation_message: param.invitation_message || '',
          invitation_message_dify_api_key:
            param.invitation_message_dify_api_key || '',
          run_limit_count: param.run_limit_count,
          agent_type: param.agent_type,
          last_updated_user_id: param.last_updated_user_id,
        }

        const { data: workflowData, error } = await supabase
          .from('workflows')
          .update(workflow)
          .eq('id', param.workflow_id)
          .select('*')
          .single()
        if (error) {
          console.error('Error in inserting workflow:', error)
          return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
          )
        }
        insertWorkflowResponse = workflowData
      }
    } else if (
      param.active_tab === ActiveTab.SEARCH_REACTION &&
      param.search_reaction_profile_public_identifier
    ) {
      console.log('continue with search_reaction_profile_public_identifier')
      let searchReactionProfilePrivateIdentifier = provider.private_identifier
      if (
        provider.public_identifier !==
        param.search_reaction_profile_public_identifier
      ) {
        const getProfileResponse = await unipileClient.users.getProfile({
          account_id: param.account_id,
          identifier: param.search_reaction_profile_public_identifier,
        })
        await new Promise((resolve) => setTimeout(resolve, 700))
        if (!getProfileResponse || getProfileResponse === undefined) return
        if ('provider_id' in getProfileResponse) {
          searchReactionProfilePrivateIdentifier =
            getProfileResponse.provider_id
        }
      }

      const getAllPostsResponse = await unipileClient.users.getAllPosts({
        account_id: param.account_id,
        identifier: searchReactionProfilePrivateIdentifier,
        limit: param.limit_count * 3,
      })
      if (!getAllPostsResponse || getAllPostsResponse === undefined) return
      await new Promise((resolve) => setTimeout(resolve, 700))

      const getAllPostCommentsPromises = getAllPostsResponse.items.map(
        async (post) => {
          if (!post || post === undefined) return
          if (
            post.author.public_identifier !==
            param.search_reaction_profile_public_identifier
          ) {
            console.log('Skipping post - not authored by the provider')
            return
          }

          const getAllPostCommentsResponse =
            await unipileClient.users.getAllPostComments({
              account_id: param.account_id,
              post_id: post.social_id,
              limit: 10,
            })
          if (
            !getAllPostCommentsResponse ||
            getAllPostCommentsResponse === undefined
          )
            return

          getAllPostCommentsResponse.items.map((comment) => {
            leadsWithStatus.push({
              leadId: '',
              leadStatus: LeadStatus.SEARCHED,
              lead: {
                provider_id: provider.id,
                company_id: provider.company_id,
                private_identifier: comment?.author_details?.id || '',
                headline: comment?.author_details?.headline || '',
                full_name: comment?.author || '',
                network_distance: comment?.author_details?.network_distance
                  ? NetworkDistance[comment?.author_details?.network_distance]
                  : undefined,
                lead_reactions: [
                  {
                    company_id: provider.company_id,
                    reacted_at: new Date().toISOString(),
                    // reacted_at: new Date(comment.date).toISOString(),
                    lead_id: '',
                    reaction_type: ReactionType.COMMENT,
                    post_url: post.share_url,
                    post_private_identifier: post.social_id,
                    private_identifier: comment.id,
                    content: comment.text,
                  },
                ],
              },
            })
          })

          await new Promise((resolve) => setTimeout(resolve, 700))
        }
      )

      await Promise.all(getAllPostCommentsPromises)
      const getAllPostReactionsPromises = getAllPostsResponse.items.map(
        async (post) => {
          if (!post || post === undefined) return
          const postPrivateIdentifier = post.social_id.replace(
            'urn:li:activity:',
            ''
          )

          // get likes
          const getReactionsUrl = `https://${env.UNIPILE_DNS}/api/v1/posts/${post.social_id}/reactions?account_id=${param.account_id}&limit=100`
          const getReactionsOptions = {
            method: 'GET',
            headers: {
              'X-API-KEY': env.UNIPILE_ACCESS_TOKEN,
              accept: 'application/json',
              'content-type': 'application/json',
            },
          }
          const getReactionsResponse = await fetch(
            getReactionsUrl,
            getReactionsOptions
          )
          if (getReactionsResponse.status !== 200) {
            return NextResponse.json(
              { error: 'An error occurred while getting reactions' },
              { status: 500 }
            )
          }
          const dataOfGetReactions = await getReactionsResponse.json()
          dataOfGetReactions.items.map(
            (reaction: {
              value: string
              author: {
                profile_url: string
                id: any
                headline: any
                name: any
                network_distance: string | number
              }
            }) => {
              const networkDistance = reaction?.author
                ?.network_distance as string
              leadsWithStatus.push({
                leadId: '',
                leadStatus: LeadStatus.SEARCHED,
                lead: {
                  provider_id: provider.id,
                  company_id: provider.company_id,
                  private_identifier: reaction?.author?.id || '',
                  headline: reaction?.author?.headline || '',
                  full_name: reaction?.author?.name || '',
                  network_distance: networkDistance
                    ? NetworkDistance[
                        networkDistance as keyof typeof NetworkDistance
                      ]
                    : undefined,
                  lead_reactions: [
                    {
                      company_id: provider.company_id,
                      reacted_at: new Date().toISOString(),
                      lead_id: '',
                      reaction_type:
                        ReactionType[
                          reaction.value as keyof typeof ReactionType
                        ],
                      post_url: post.share_url,
                      post_private_identifier: postPrivateIdentifier,
                      private_identifier: reaction.author.id,
                      content: '',
                    },
                  ],
                },
              })
            }
          )
        }
      )

      await Promise.all(getAllPostReactionsPromises)

      // もしprivate_identifierが同じleadがいる場合は、一つのleadsにして、reactionsを追加
      const leadsWithStatusMap = new Map<string, leadWithStatus>()
      leadsWithStatus.forEach((lead) => {
        if (
          lead.lead.private_identifier === undefined ||
          lead.lead.lead_reactions === undefined
        )
          return
        if (leadsWithStatusMap.has(lead.lead.private_identifier)) {
          const existingLead = leadsWithStatusMap.get(
            lead.lead.private_identifier
          )
          if (existingLead) {
            existingLead.lead.lead_reactions?.push(...lead.lead.lead_reactions)
            leadsWithStatusMap.set(lead.lead.private_identifier, existingLead)
          }
        } else {
          leadsWithStatusMap.set(lead.lead.private_identifier, lead)
        }
      })
      leadsWithStatus = Array.from(leadsWithStatusMap.values())

      const workflow: Database['public']['Tables']['workflows']['Update'] = {
        id: param.workflow_id,
        company_id: provider.company_id,
        provider_id: provider.id,
        name: param.name,
        scheduled_hours: param.scheduled_hours || [],
        scheduled_days: param.scheduled_days || [],
        scheduled_months: param.scheduled_months || [],
        scheduled_weekdays: param.scheduled_weekdays || [],
        search_reaction_profile_public_identifier:
          param.search_reaction_profile_public_identifier,
        limit_count: Number(param.limit_count),
        invitation_message: param.invitation_message || '',
        invitation_message_dify_api_key:
          param.invitation_message_dify_api_key || '',
        run_limit_count: param.run_limit_count,
        agent_type: param.agent_type,
        last_updated_user_id: param.last_updated_user_id,
      }

      const { data: workflowData, error: updateWorkflowError } = await supabase
        .from('workflows')
        .update(workflow)
        .eq('id', param.workflow_id)
        .select('*')
        .single()
      if (updateWorkflowError) {
        console.error('Error in inserting workflow:', updateWorkflowError)
        return NextResponse.json(
          { error: 'Internal server error' },
          { status: 500 }
        )
      }
      insertWorkflowResponse = workflowData
    } else {
      return NextResponse.json({ error: 'Invalid request' }, { status: 400 })
    }

    if (unipileProfilesWithStatus.length) {
      await upsertLeadByUnipileUserProfileApiResponse({
        supabase,
        unipileProfiles: unipileProfilesWithStatus,
        providerId: provider.id as string,
        workflowId: param.workflow_id as string,
        companyId: provider.company_id,
        scheduled_days: param.scheduled_days,
        scheduled_hours: param.scheduled_hours,
        scheduled_months: param.scheduled_months,
        scheduled_weekdays: param.scheduled_weekdays,
      })
    }
    if (leadsWithStatus.length) {
      await upsertLead({
        supabase,
        leads: leadsWithStatus,
        providerId: provider.id as string,
        workflowId: param.workflow_id as string,
        companyId: provider.company_id,
        scheduled_days: param.scheduled_days,
        scheduled_hours: param.scheduled_hours,
        scheduled_months: param.scheduled_months,
        scheduled_weekdays: param.scheduled_weekdays,
      })
    }
    if (unipiePerformSearchProfilesWithStatus.length) {
      await upsertLeadByUnipilePerformSearchProfile({
        supabase,
        unipileProfiles: unipiePerformSearchProfilesWithStatus,
        providerId: provider.id as string,
        workflowId: param.workflow_id as string,
        companyId: provider.company_id,
        scheduled_days: param.scheduled_days,
        scheduled_hours: param.scheduled_hours,
        scheduled_months: param.scheduled_months,
        scheduled_weekdays: param.scheduled_weekdays,
      })
    }

    status = WorkflowStatus.SUCCESS
    return NextResponse.json(
      {
        workflow: insertWorkflowResponse,
      },
      { status: 200 }
    )
  } catch (error) {
    console.error('Error in POST /api/workflow/search-profile:', error)
    return NextResponse.json(
      { error: 'Internal server error: ' + error },
      { status: 500 }
    )
  } finally {
    const workflowHistories: Database['public']['Tables']['workflow_histories']['Insert'] =
      {
        company_id: provider.company_id,
        workflow_id: param.workflow_id,
        cursor: nextCursor || '',
        status: status,
      }

    await supabase.from('workflow_histories').insert(workflowHistories)
  }
}

// "CEO" OR "役員" OR "取締役" OR "部長" OR "Manager" OR "Director"
