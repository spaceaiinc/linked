import {
  unipileProfileWithStatus,
  leadWithStatus,
  fetchLeadsWithLatestStatusAndWorkflow,
  updateLeadStatusByTargetWorkflowId,
  upsertLead,
  upsertLeadByUnipilePerformSearchProfile,
  upsertLeadByUnipileUserProfileApiResponse,
} from '@/lib/db/queries/leadServer'
import {
  LeadStatus,
  MessageTriggerType,
  WorkflowStatus,
} from '@/lib/types/master'
import { Database, Lead, Provider } from '@/lib/types/supabase'
import { unipileClient } from '@/lib/unipile'
import { createClient as createClientInServer } from '@/lib/utils/supabase/server'
import { sendMessageSchema } from '@/lib/validation'
import { NextResponse } from 'next/server'
import { supabase as serviceSupabase } from '@/lib/utils/supabase/service'
import { SupabaseClient } from '@supabase/supabase-js'
import { generatePersonalizedMessage } from '@/lib/dify'

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
  let loginUserId = ''

  /**
   * authenticate
   */
  let supabase: SupabaseClient = createClientInServer()
  if (fromSchedule) {
    supabase = serviceSupabase
  } else {
    const { data: userData, error: getUserError } =
      await supabase.auth.getUser()
    if (getUserError) {
      console.error('Error in getting user:', getUserError)
      return NextResponse.json({ error: 'Invalid user' }, { status: 400 })
    }
    if (userData === null || !userData.user.id) {
      return NextResponse.json({ error: 'Invalid user' }, { status: 400 })
    }

    loginUserId = userData.user.id
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

        // chats
        const getAllChatsResponse = await unipileClient.messaging.getAllChats({
          account_id: param.account_id,
        })

        // get private identifier if not exists
        const profilePromises = targetLeads?.map(async (lead: Lead) => {
          if (!lead || lead === undefined) {
            return lead
          }
          if (!lead.private_identifier) {
            const getProfileResponse = await unipileClient.users.getProfile({
              account_id: param.account_id,
              identifier: lead.public_identifier as string,
              linkedin_sections: '*',
            })

            await new Promise((resolve) => setTimeout(resolve, 5000))
            unipileProfilesWithStatus.push({
              leadId: lead.id,
              leadStatus: LeadStatus.IN_QUEUE,
              unipileProfile: getProfileResponse,
            })
            return lead
          }

          // send message
          if (!lead || lead === undefined) {
            return
          }
          const sendMessageParam = {
            account_id: param.account_id,
            message: param.first_message,
          }

          // TODO
          const candidateInfo = ''

          if (param.first_message)
            sendMessageParam.message = param.first_message
          if (param.first_message_dify_api_key) {
            sendMessageParam.message = await generatePersonalizedMessage(
              param.first_message_dify_api_key,
              candidateInfo,
              param.job_position as string
            )
          }

          if (!getAllChatsResponse || getAllChatsResponse.items.length === 0) {
            // create new chat if not exists
            const startNewChatResponse =
              await unipileClient.messaging.startNewChat({
                account_id: param.account_id,
                text: sendMessageParam.message || '',
                attendees_ids: [],
              })
            console.log('startNewChatResponse', startNewChatResponse)
          }

          // send message
          // developer.unipile.com/reference/chatscontroller_sendmessageinchat
          try {
            const sendMessageResponse =
              await unipileClient.messaging.sendMessage({
                chat_id: getAllChatsResponse.items[0].id,
                text: sendMessageParam.message || '',
              })
            console.log('sendMessageResponse', sendMessageResponse)
          } catch (error) {
            console.error('Error in sendMessage:', error)
            lead
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
          first_message: param.first_message || '',
          first_message_days: param.first_message_days || 0,
          first_message_dify_api_key: param.first_message_dify_api_key || '',
          first_message_sent_at: new Date().toISOString(),
          first_message_trigger_type:
            param.first_message_trigger_type || MessageTriggerType.ALWAYS_SEND,
          run_limit_count: param.run_limit_count || 1000,
          last_updated_user_id: loginUserId
            ? loginUserId
            : param.last_updated_user_id,
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

    status = WorkflowStatus.SUCCESS
    return NextResponse.json(
      {
        workflow: insertWorkflowResponse,
      },
      { status: 200 }
    )
  } catch (error: any) {
    console.error('Error in POST /api/workflow/send-message:', error)
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
