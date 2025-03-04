import { env } from '@/lib/env'
import {
  searchProfileBodyType,
  findSupabaseLeadByProviderIdAndPrivateIdentifier,
  upsertLeadByUnipileProfileDetail,
  upsertLeadByUnipileProfile,
  upsertLead,
} from '@/lib/db/queries/leadServer'
import { LeadStatus, WorkflowStatus, WorkflowType } from '@/lib/types/master'
import { Database, LeadInsert, Provider } from '@/lib/types/supabase'
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
  let responseOfInsertWorkflow = null

  /**
   * authenticate
   */
  const supabase = createClient()
  const { data: providerData } = await supabase
    .from('providers')
    .select('*')
    .eq('account_id', param.account_id)
    .single()
  if (!providerData || providerData === undefined) {
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
      // スケジュールから出ない場合、insert leads
      if (!fromSchedule) {
        const insertLeadPromises = param.target_public_identifiers?.map(
          async (publicIdentifier: string) => {
            const { data: InsertLeadData, error: errorOfInsertLead } =
              await supabase
                .from('leads')
                .insert({
                  provider_id: provider.id,
                  public_identifier: publicIdentifier,
                })
                .select('id')
                .single()
            if (errorOfInsertLead) {
              console.error('Error in insert lead:', errorOfInsertLead)
              return NextResponse.json(
                { error: 'Internal server error' },
                { status: 500 }
              )
            }
            // update lead workflows
            const leadWorkflows = [
              {
                workflow_id: param.workflow_id,
                lead_id: InsertLeadData.id,
                company_id: provider.company_id,
              },
            ]

            const { error: errorOfInsertLeadWorkflow } = await supabase
              .from('lead_workflows')
              .upsert(leadWorkflows, { onConflict: 'workflow_id, lead_id' })
            if (errorOfInsertLeadWorkflow) {
              console.error(
                'Error in insert lead workflow:',
                errorOfInsertLeadWorkflow
              )
              return NextResponse.json(
                { error: 'Internal server error' },
                { status: 500 }
              )
            }
          }
        )
        await Promise.all(insertLeadPromises)

        const workflow: Database['public']['Tables']['workflows']['Update'] = {
          id: param.workflow_id,
          company_id: provider.company_id,
          provider_id: provider.id,
          name: param.name,
          scheduled_hours: param.scheduled_hours || [],
          scheduled_days: param.scheduled_days || [],
          scheduled_months: param.scheduled_months || [],
          scheduled_weekdays: param.scheduled_weekdays || [],
          target_workflow_id: param.workflow_id,
          limit_count: Number(param.limit_count),
          invitation_message: param.invitation_message || '',
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
        responseOfInsertWorkflow = workflowData
        console.log('responseOfInsertWorkflow:', responseOfInsertWorkflow)
      }

      // スケジュールされていない場合即実行
      if (!scheduled) {
        // TODO: public_identifier prefix
        const leadPromises = param.target_public_identifiers?.map(
          async (publicIdentifier: string) => {
            const responseOfGetProfile = await unipileClient.users.getProfile({
              account_id: param.account_id,
              identifier: publicIdentifier,
              linkedin_sections: '*',
            })
            if (!responseOfGetProfile || responseOfGetProfile === undefined)
              return
            await new Promise((resolve) => setTimeout(resolve, 5000))

            let leadStatus = LeadStatus.SEARCHED
            if (
              param.type === WorkflowType.INVITE &&
              'provider_id' in responseOfGetProfile
            ) {
              unipileClient.users
                .sendInvitation({
                  account_id: param.account_id,
                  provider_id: responseOfGetProfile.provider_id,
                  message: param.invitation_message || undefined,
                })
                .then((responseOfSendInvitation) => {
                  console.log(
                    'responseOfSendInvitation',
                    responseOfSendInvitation
                  )
                  leadStatus = LeadStatus.INVITED
                })
                .catch((error) => {
                  if (error?.body?.type === 'errors/already_invited_recently') {
                    console.log(
                      'Skipping lead - invitation was already sent recently'
                    )
                  } else {
                    console.error('Error in send invitation:', error)
                  }
                  leadStatus = LeadStatus.NOT_SENT
                })
            }

            const convertedLead = await upsertLeadByUnipileProfileDetail({
              leadId: '',
              leadStatus: leadStatus,
              unipileProfile: responseOfGetProfile,
              providerId: provider.id as string,
              workflowId: param.workflow_id as string,
              type: param.type,
              companyId: provider.company_id,
              scheduled_days: param.scheduled_days,
              scheduled_hours: param.scheduled_hours,
              scheduled_months: param.scheduled_months,
              scheduled_weekdays: param.scheduled_weekdays,
            })
            return convertedLead
          }
        )
        await Promise.all(leadPromises)
      }

      /**
       * if search_url exists, search profiles
       */
    } else if (param.target_workflow_id) {
      if (fromSchedule || !scheduled) {
        console.log('continue with target_workflow_id')
        const { data: targetLeadData, error: errorOfTargetLead } =
          await supabase
            .from('leads')
            .select(
              '*, lead_statuses!inner(status), lead_workflows!inner(workflow_id)'
            )
            .eq('lead_workflows.workflow_id', param.target_workflow_id)
            .eq('lead_statuses.status', LeadStatus.IN_QUEUE)
            // 最新のステータスを取得するためにlead_statusesを日付順に並べる
            .order('lead_statuses.created_at', { ascending: false })
            // 各リードごとに1つのステータスレコードのみを取得
            .limit(1, { foreignTable: 'lead_statuses' })
            .order('created_at', { ascending: true })
            .limit(param.limit_count)

        if (errorOfTargetLead) {
          console.error('Error in get target lead:', errorOfTargetLead)
          return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
          )
        }
        console.log('targetLeads', targetLeadData)
        const profilePromises = targetLeadData?.map(
          async (lead: LeadInsert) => {
            if (!lead || lead === undefined) return
            if (!lead.private_identifier) {
              const responseOfGetProfile = await unipileClient.users.getProfile(
                {
                  account_id: param.account_id,
                  identifier: lead.public_identifier as string,
                  linkedin_sections: '*',
                }
              )

              await new Promise((resolve) => setTimeout(resolve, 5000))
              let leadStatus = LeadStatus.SEARCHED
              if (
                param.type === WorkflowType.INVITE &&
                'provider_id' in responseOfGetProfile
              ) {
                unipileClient.users
                  .sendInvitation({
                    account_id: param.account_id,
                    provider_id: responseOfGetProfile.provider_id,
                    message: param.invitation_message || undefined,
                  })
                  .then((responseOfSendInvitation) => {
                    console.log(
                      'responseOfSendInvitation',
                      responseOfSendInvitation
                    )
                    leadStatus = LeadStatus.INVITED
                  })
                  .catch((error) => {
                    if (
                      error?.body?.type === 'errors/already_invited_recently'
                    ) {
                      console.log(
                        'Skipping lead - invitation was already sent recently'
                      )
                    } else {
                      console.error('Error in send invitation:', error)
                    }
                    leadStatus = LeadStatus.NOT_SENT
                  })
              }

              const convertedLead = await upsertLeadByUnipileProfileDetail({
                leadId: '',
                leadStatus: leadStatus,
                unipileProfile: responseOfGetProfile,
                providerId: provider.id as string,
                workflowId: param.workflow_id as string,
                type: param.type,
                companyId: provider.company_id,
                scheduled_days: param.scheduled_days,
                scheduled_hours: param.scheduled_hours,
                scheduled_months: param.scheduled_months,
                scheduled_weekdays: param.scheduled_weekdays,
              })
              console.log('convertedLead', convertedLead)
              return convertedLead
            } else {
              let leadStatus = LeadStatus.SEARCHED
              if (param.type === WorkflowType.INVITE) {
                unipileClient.users
                  .sendInvitation({
                    account_id: param.account_id,
                    provider_id: lead.private_identifier,
                    message: param.invitation_message || undefined,
                  })
                  .then((responseOfSendInvitation) => {
                    console.log(
                      'responseOfSendInvitation',
                      responseOfSendInvitation
                    )
                    leadStatus = LeadStatus.INVITED
                  })
                  .catch((error) => {
                    if (
                      error?.body?.type === 'errors/already_invited_recently'
                    ) {
                      console.log(
                        'Skipping lead - invitation was already sent recently'
                      )
                    } else {
                      console.error('Error in send invitation:', error)
                    }
                    leadStatus = LeadStatus.NOT_SENT
                  })
              }

              const convertedLead = await upsertLead({
                leadId: '',
                leadStatus: leadStatus,
                lead: lead,
                providerId: provider.id as string,
                workflowId: param.workflow_id as string,
                type: param.type,
                companyId: provider.company_id,
                scheduled_days: param.scheduled_days,
                scheduled_hours: param.scheduled_hours,
                scheduled_months: param.scheduled_months,
                scheduled_weekdays: param.scheduled_weekdays,
              })
              console.log('convertedLead', convertedLead)
              return convertedLead
            }
          }
        )
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
          // TODO: MSG COlumn
          invitation_message: param.invitation_message || '',
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
        responseOfInsertWorkflow = workflowData
        console.log('responseOfInsertWorkflow:', responseOfInsertWorkflow)
      }
    } else if (param.search_url || param.keywords || param.company_urls) {
      console.log('continue with keywords')
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
            const responseOfGetCompany = await fetch(
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

        console.log('dataOfSearchList', dataOfSearchList)

        if (
          param.type === WorkflowType.SEARCH &&
          dataOfSearchList.length < 51
        ) {
          const profilePromises = dataOfSearchList.map(async (item) => {
            console.log('item:', item)
            // get supabase profile
            const leadInDb =
              await findSupabaseLeadByProviderIdAndPrivateIdentifier({
                providerId: provider.id as string,
                privateIdentifier: item.id,
              })
            if (leadInDb && leadInDb !== undefined) {
              console.log('Skipping lead - already exists in DB')
              // profileList.push(leadInDb)
              return
            }
            if (
              !item.public_identifier ||
              item.public_identifier === '' ||
              item.public_identifier === 'null' ||
              item.public_identifier === null
            ) {
              const list = await upsertLeadByUnipileProfileDetail({
                leadId: '',
                leadStatus: LeadStatus.SEARCHED,
                unipileProfile: item,
                providerId: provider.id as string,
                workflowId: param.workflow_id as string,
                type: param.type,
                companyId: provider.company_id,
                scheduled_days: param.scheduled_days,
                scheduled_hours: param.scheduled_hours,
                scheduled_months: param.scheduled_months,
                scheduled_weekdays: param.scheduled_weekdays,
              })
              // if (list) profileList.push(list)
              return
            }

            const responseOfGetProfile = await unipileClient.users.getProfile({
              account_id: param.account_id,
              identifier: item.public_identifier,
              linkedin_sections: '*',
            })
            // 2 sec wait for each profile fetch
            await new Promise((resolve) => setTimeout(resolve, 5000))
            return responseOfGetProfile
          })
          const unipileProfileList = await Promise.all(profilePromises)
          // Wait for all profile fetches to complete
          const leadPromises = unipileProfileList
            .filter((profile) => profile !== undefined && profile !== null)
            .map(async (profile) => {
              if (!profile || profile === undefined) return null
              const convertedLead = await upsertLeadByUnipileProfileDetail({
                leadId: '',
                leadStatus: LeadStatus.SEARCHED,
                unipileProfile: profile,
                providerId: provider.id as string,
                workflowId: param.workflow_id as string,
                type: param.type,
                companyId: provider.company_id,
                scheduled_days: param.scheduled_days,
                scheduled_hours: param.scheduled_hours,
                scheduled_months: param.scheduled_months,
                scheduled_weekdays: param.scheduled_weekdays,
              })
              return convertedLead
            })

          await Promise.all(leadPromises)
        } else {
          const dataOfSearchListPromises = dataOfSearchList.map(
            async (profile) => {
              if (!profile || profile === undefined) return null
              let leadStatus = LeadStatus.SEARCHED
              if (
                param.type === WorkflowType.INVITE &&
                'provider_id' in profile
              ) {
                unipileClient.users
                  .sendInvitation({
                    account_id: param.account_id,
                    provider_id: profile.private_identifier,
                    message: param.invitation_message || undefined,
                  })
                  .then((responseOfSendInvitation) => {
                    console.log(
                      'responseOfSendInvitation',
                      responseOfSendInvitation
                    )
                    leadStatus = LeadStatus.INVITED
                  })
                  .catch((error) => {
                    if (
                      error?.body?.type === 'errors/already_invited_recently'
                    ) {
                      console.log(
                        'Skipping lead - invitation was already sent recently'
                      )
                    } else {
                      console.error('Error in send invitation:', error)
                    }
                    leadStatus = LeadStatus.NOT_SENT
                  })
              }

              const list = await upsertLeadByUnipileProfile({
                unipileProfile: profile,
                leadStatus: leadStatus,
                providerId: provider.id as string,
                workflowId: param.workflow_id as string,
                type: param.type,
                companyId: provider.company_id,
                scheduled_days: param.scheduled_days,
                scheduled_hours: param.scheduled_hours,
                scheduled_months: param.scheduled_months,
                scheduled_weekdays: param.scheduled_weekdays,
              })
              return list
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
        responseOfInsertWorkflow = workflowData
        console.log('responseOfInsertWorkflow:', responseOfInsertWorkflow)
      }
    } else {
      return NextResponse.json({ error: 'Invalid request' }, { status: 400 })
    }

    status = WorkflowStatus.SUCCESS
    return NextResponse.json(
      {
        workflow: responseOfInsertWorkflow,
      },
      { status: 200 }
    )
  } catch (error) {
    console.error('Error in POST /api/provider/invite:', error)
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

    const responseOfInsertWorkflowHistory = await supabase
      .from('workflow_histories')
      .insert(workflowHistories)
    console.log(
      'responseOfInsertWorkflowHistory:',
      responseOfInsertWorkflowHistory
    )
  }
}

// "CEO" OR "役員" OR "取締役" OR "部長" OR "Manager" OR "Director"
