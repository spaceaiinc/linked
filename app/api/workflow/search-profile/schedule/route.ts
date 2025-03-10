import { NextResponse } from 'next/server'
import { POST as searchProfileHandler } from '@/app/api/workflow/search-profile/route' // 呼び出したいAPIのハンドラーをインポート
import { Provider, Workflow } from '@/lib/types/supabase'
import { SearchProfileParam } from '@/lib/validation'
import { ActiveTab, WorkflowRunStatus } from '@/lib/types/master'
import { env } from '@/lib/env'
import { supabase } from '@/lib/utils/supabase/service'

// request param
export type ProviderSearchProfilePostScheduleParam = {
  schedule_id?: string
}

export async function POST(req: Request) {
  try {
    // if (env.NEXT_PUBLIC_APP_ENV === 'production') {
    //   // Google-Cloud-Schedulerからのリクエストかどうかを確認
    //   const headers = req.headers
    //   if (!headers.has('X-Appengine-Cron')) {
    //   return NextResponse.json(
    //     { error: 'Unauthorized request' },
    //     { status: 401 }
    //   )
    // }
    // Google-Cloud-Schedulerからのリクエストかどうかを確認
    // const headers = req.headers
    // if (!headers.has('X-Appengine-Cron')) {
    //   return NextResponse.json(
    //     { error: 'Unauthorized request' },
    //     { status: 401 }
    //   )
    // }
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

    // UTCtimeを取得して、日本時間に変換
    const now = new Date(
      new Date().toLocaleString('ja-JP', { timeZone: 'Asia/Tokyo' })
    )
    // adminクライアントを作成（RLSをバイパス）
    console.log('env.NEXT_PUBLIC_SUPABASE_URL', env.NEXT_PUBLIC_SUPABASE_URL)
    console.log('env.SUPABASE_SERVICE_KEY', env.SUPABASE_SERVICE_KEY)
    console.log('day', now.getDay(), 'hours', now.getHours())
    const { data: workflowsData, error } = await supabase
      .from('workflows')
      .select('*')
      .eq('deleted_at', '-infinity')
      .eq('status', WorkflowRunStatus.ON)
    console.log('workflowsData', workflowsData, 'error', error)
    if (error) {
      return new Response(error.message, { status: 500 })
    }
    if (!workflowsData || workflowsData.length === 0) {
      return new Response('Workflows not found', { status: 200 })
    }
    const scheduledWorkflows = workflowsData.filter((workflow: Workflow) => {
      if (
        workflow.scheduled_hours.includes(now.getHours()) &&
        workflow.scheduled_weekdays.includes(now.getDay())
      ) {
        return true
      }
      return false
    })
    console.log('scheduledWorkflows', scheduledWorkflows)
    const workflows = scheduledWorkflows as Workflow[]
    console.log('workflows', workflows)

    //　workflowsのscheduled_hoursとdaysとweeksが現在時刻と一致するものを返す
    const workflowPromises = workflows.map(async (workflow: Workflow) => {
      console.log('workflow', workflow)
      const { data: providerData, error } = await supabase
        .from('providers')
        .select('*')
        .eq('deleted_at', '-infinity')
        .eq('id', workflow.provider_id)
      if (error) {
        return new Response(error.message, { status: 500 })
      }
      if (!providerData || providerData.length === 0 || !providerData[0]) {
        return
      }
      const provider = providerData[0] as Provider
      let activeTab = ActiveTab.SEARCH
      if (workflow.search_url) {
        activeTab = ActiveTab.SEARCH
      } else if (
        workflow.company_private_identifiers.length > 0 ||
        workflow.keywords
      ) {
        activeTab = ActiveTab.KEYWORDS
      } else if (workflow.target_workflow_id) {
        activeTab = ActiveTab.LEAD_LIST
      } else {
        return new Response('Invalid workflow', { status: 400 })
      }

      // 新しいRequestオブジェクトを作成して直接ハンドラーを呼び出す
      const searchProfileParam: SearchProfileParam = {
        name: workflow.name,
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
        first_message_days: 0,
        second_message_days: 0,
        third_message_days: 0,
        scheduled_months: [],
        target_public_identifiers: [],
      }
      const url = `${env.NEXT_PUBLIC_PRODUCTION_URL}/api/workflow/search-profile`
      const searchProfileRequest = new Request(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(searchProfileParam),
      })

      try {
        const response = await searchProfileHandler(searchProfileRequest)
        console.log('response', response)
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
    console.error('Error in POST /api/workflow/search-profile/schedule:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
