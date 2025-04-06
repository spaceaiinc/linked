import {
  upsertLeadByUnipileUserProfileApiResponse,
  upsertLeadByUnipilePerformSearchProfile,
  upsertLead,
  unipileProfileWithStatus,
  leadWithStatus,
  unipilePeformSearchProfileWithStatus,
  fetchLeadsWithLatestStatusAndWorkflow,
  updateLeadStatusByTargetWorkflowId,
} from '@/lib/db/queries/lead'
import { LeadStatus, WorkflowStatus, WorkflowType } from '@/lib/types/master'
import { Database, Lead, Provider } from '@/lib/types/supabase'
import { unipileClient } from '@/lib/unipile'
import { createClient as createClientInServer } from '@/lib/utils/supabase/server'
import { sendMessageSchema } from '@/lib/validation'
import { NextResponse } from 'next/server'
import { supabase as serviceSupabase } from '@/lib/utils/supabase/service'
import { SupabaseClient } from '@supabase/supabase-js'
import { generateMessageOnDify } from '@/lib/dify'

export async function POST(req: Request) {
  /**
   * validate param
   */
  const param = await sendMessageSchema.validate(await req.json(), {
    // すべてのエラーを一度に収集
    abortEarly: false,
    // 未知のフィールドを削除
    stripUnknown: true,
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
    if (param.target_workflow_id) {
      if (fromSchedule || !scheduled) {
        console.log('continue with target_workflow_id')
        const targetLeadData = await fetchLeadsWithLatestStatusAndWorkflow(
          supabase,
          param.target_workflow_id,
          [
            LeadStatus.SEARCHED,
            LeadStatus.IN_QUEUE,
            LeadStatus.INVITED,
            LeadStatus.ALREADY_INVITED,
            LeadStatus.INVITED_FAILED,
          ],
          param.limit_count
        )
        const targetLeads = targetLeadData as Lead[]

        // get all chats
        // const getAllChatsResponse = await unipileClient.messaging.getAllChats({
        //   account_id: param.account_id,
        // })
        // if (!getAllChatsResponse || getAllChatsResponse.items.length === 0) {
        //   // create new chat if not exists
        //   const startNewChatResponse =
        //     await unipileClient.messaging.startNewChat({
        //       account_id: param.account_id,
        //       text: message,
        //       attendees_ids: [],
        //     })
        //   console.log('startNewChatResponse', startNewChatResponse)
        // }

        const profilePromises = targetLeads?.map(async (lead: Lead) => {
          if (!lead || lead === undefined) return
          let fromGetProfile = false
          let getProfileResponse: any
          if (!lead.private_identifier) {
            const getProfileResponse = await unipileClient.users.getProfile({
              account_id: param.account_id,
              identifier: lead.public_identifier as string,
              linkedin_sections: '*',
            })
            await new Promise((resolve) => setTimeout(resolve, 5000))
            if ('id' in getProfileResponse) {
              lead.private_identifier = getProfileResponse.id
            }
            fromGetProfile = true
          }
          if (!lead.private_identifier) return

          // developer.unipile.com/reference/chatscontroller_sendmessageinchat
          const startNewChatResponse =
            await unipileClient.messaging.startNewChat({
              account_id: param.account_id,
              text: '',
              attendees_ids: [],
            })
          if (!startNewChatResponse.chat_id) {
            console.error(
              'Error in startNewChatResponse:',
              startNewChatResponse
            )
            return
          }

          await new Promise((resolve) => setTimeout(resolve, 5000))
          // developer.unipile.com/reference/chatscontroller_sendmessageinchat
          // const sendMessageResponse =
          //   await unipileClient.messaging.sendMessage({
          //     chat_id: startNewChatResponse.chat_id,
          //     text: '',
          //   })
          // console.log('sendMessageResponse', sendMessageResponse)

          if (!param.first_message_dify_api_key) {
            return
          }

          const candidateInfo = `Name: ${lead.full_name}, Headline: ${lead.headline}, Location: ${lead.location}`

          generateMessageOnDify({
            apiKey: param.first_message_dify_api_key,
            candidateInfo: candidateInfo,
            jobPosition: param.job_position || '',
          })

          if (fromGetProfile) {
            unipileProfilesWithStatus.push({
              leadId: lead.id,
              leadStatus: LeadStatus.FOLLOW_UP_SENT,
              unipileProfile: getProfileResponse,
            })
            return
          } else {
            leadsWithStatus.push({
              lead: lead,
              leadId: lead.id,
              leadStatus: LeadStatus.FOLLOW_UP_SENT,
            })
            return
          }
        })

        await Promise.all(profilePromises)
      } else {
        await updateLeadStatusByTargetWorkflowId({
          supabase,
          targetWorkflowId: param.target_workflow_id,
          targetStatus: LeadStatus.FOLLOW_UP_SENT_IN_QUEUE,
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
          // TODO: MSG COlumn
          first_message: param.first_message || '',
          first_message_dify_api_key: param.first_message_dify_api_key || '',
          first_message_trigger_type: param.first_message_trigger_type || 0,
          agent_type: param.agent_type || 0,
          run_limit_count: param.run_limit_count || 0,
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
