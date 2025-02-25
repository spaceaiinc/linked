import { createClient } from '@/lib/utils/supabase/server'
import { NextResponse } from 'next/server'
import { POST as searchProfileHandler } from '@/app/api/provider/search/profile/route' // 呼び出したいAPIのハンドラーをインポート

// request param
export type ProviderSearchProfilePostScheduleParam = {
  batch_id?: string
}

export async function POST(req: Request) {
  try {
    // param
    const rawParam = await req.json()
    const param: ProviderSearchProfilePostScheduleParam = {
      batch_id: rawParam.batch_id,
    } as ProviderSearchProfilePostScheduleParam
    if (!param.batch_id) {
      return NextResponse.json(
        { error: 'batch_id is required' },
        { status: 400 }
      )
    }
    console.log('ProviderSearchProfilePostScheduleParam', param)
    if (param.batch_id !== '09chdwbiowrivdjwksncdkqod89cy0hqdco') {
      return NextResponse.json(
        { error: 'batch_id is invalid' },
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
    const { data: workflows, error } = await supabase
      .from('workflows')
      .select('id')
      .eq('scheduled_hours', now.getHours())
      .eq('scheduled_weekdays', now.getDay())

    if (error) {
      return new Response(error.message, { status: 500 })
    }

    //　workflowsのscheduled_hoursとdaysとweeksが現在時刻と一致するものを返す
    const workflowPromises = workflows.map(async (workflow: { id: string }) => {
      console.log('workflow', workflow)
      // 新しいRequestオブジェクトを作成して直接ハンドラーを呼び出す
      const searchProfileRequest = new Request('/api/provider/search/profile', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          workflow_id: workflow.id,
        }),
      })

      try {
        const response = await searchProfileHandler(searchProfileRequest)
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
