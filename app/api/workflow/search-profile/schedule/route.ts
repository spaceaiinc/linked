import { createClient } from '@/lib/utils/supabase/server'
import { NextResponse } from 'next/server'
import { POST as searchProfileHandler } from '@/app/api/workflow/search-profile/route' // 呼び出したいAPIのハンドラーをインポート
import { Provider, Workflow } from '@/lib/types/supabase'
import { SearchProfileParam } from '@/lib/validation'

// request param
export type ProviderSearchProfilePostScheduleParam = {
  schedule_id?: string
}

export async function POST(req: Request) {
  try {
    // param
    const rawParam = await req.json()
    const param: ProviderSearchProfilePostScheduleParam = {
      schedule_id: rawParam.schedule_id,
    } as ProviderSearchProfilePostScheduleParam
    if (!param.schedule_id) {
      return NextResponse.json(
        { error: 'schedule_id is required' },
        { status: 400 }
      )
    }
    console.log('ProviderSearchProfilePostScheduleParam', param)
    if (param.schedule_id !== '09chdwbiowrivdjwksncdkqod89cy0hqdco') {
      return NextResponse.json(
        { error: 'schedule_id is invalid' },
        { status: 400 }
      )
    }

    console.log('Request received at search-profile function:', req)
    // UTCtimeを取得して、日本時間に変換
    const now = new Date(
      new Date().toLocaleString('ja-JP', { timeZone: 'Asia/Tokyo' })
    )
    const supabase = createClient()
    console.log('day', now.getDay(), 'hours', now.getHours())
    const { data: workflowsRaw, error } = await supabase
      .from('workflows')
      .select('*')
      .eq('scheduled_hours', now.getHours())
      .eq('scheduled_weekdays', now.getDay())

    if (error) {
      return new Response(error.message, { status: 500 })
    }
    if (!workflowsRaw) {
      return new Response('No workflows found', { status: 404 })
    }
    const workflows = workflowsRaw as Workflow[]
    console.log('workflows', workflows)

    //　workflowsのscheduled_hoursとdaysとweeksが現在時刻と一致するものを返す
    const workflowPromises = workflows.map(async (workflow: Workflow) => {
      console.log('workflow', workflow)
      const { data: providerRaw, error } = await supabase
        .from('providers')
        .select('*')
        .eq('workflow_id', workflow.id)
        .single()
      if (error) {
        return new Response(error.message, { status: 500 })
      }
      if (!providerRaw) {
        return new Response('Provider not found', { status: 404 })
      }
      let activeTab = 0
      if (workflow.search_url) {
        activeTab = 0
      } else if (
        workflow.company_private_identifiers.length > 0 ||
        workflow.keywords
      ) {
        activeTab = 1
        // } else if (workflow.lead_id) {
        //   activeTab = 2
      } else if (workflow.target_workflow_id) {
        activeTab = 2
      }
      const provider = providerRaw as Provider
      // 新しいRequestオブジェクトを作成して直接ハンドラーを呼び出す
      const searchProfileParam: SearchProfileParam = {
        workflow_id: workflow.id,
        schedule_id: param.schedule_id,
        type: workflow.type,
        account_id: provider.account_id,
        scheduled_days: workflow.scheduled_days,
        scheduled_hours: workflow.scheduled_hours,
        scheduled_weekdays: workflow.scheduled_weekdays,
        search_url: workflow.search_url,
        target_workflow_id: workflow.target_workflow_id,
        keywords: workflow.keywords,
        company_private_identifiers: workflow.company_private_identifiers,
        network_distance: workflow.network_distance,

        limit_count: workflow.limit_count,
        invitation_message: workflow.invitation_message,
        active_tab: activeTab,
        company_urls: [],
        name: workflow.name,
        first_message_days: 0,
        second_message_days: 0,
        third_message_days: 0,
        scheduled_months: [],
        target_public_identifiers: [],
      }
      const searchProfileRequest = new Request('/api/workflow/search-profile', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(searchProfileParam),
      })

      try {
        const response = await searchProfileHandler(searchProfileRequest)
        await new Promise((resolve) => setTimeout(resolve, 5000))
        if (response.ok) {
          const responseData = await response.json()
          console.log('responseData', responseData)
          return responseData
        }
        return response
      } catch (error) {
        console.error('Failed to generate responses:', error)
        return { error: 'Failed to process workflow' }
      }
    })

    const workflowResults = await Promise.all(workflowPromises)
    console.log('workflowResults', workflowResults)
    return NextResponse.json(workflowResults)
  } catch (error) {
    console.error('Error in POST /api/provider/invite:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
