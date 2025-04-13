import { NextResponse } from 'next/server'
import { Provider } from '@/lib/types/supabase'
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
    if (param.schedule_id !== '09chdwbiowrivdjwksncdkqod89cy0hqdco') {
      return NextResponse.json(
        { error: 'schedule_id is invalid' },
        { status: 400 }
      )
    }

    // adminクライアントを作成（RLSをバイパス）
    const { data: providersData, error } = await supabase
      .from('providers')
      .select('*')
      .eq('deleted_at', '-infinity')
    if (error) {
      return new Response(error.message, { status: 500 })
    }
    if (!providersData || providersData.length === 0) {
      return new Response('providers not found', { status: 200 })
    }
    const providers = providersData as Provider[]

    //　providersのscheduled_hoursとdaysとweeksが現在時刻と一致するものを返す
    console.log('schedule matched providers: ', providers)
    providers.forEach(async (provider: Provider) => {
      const { data: profileData, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('deleted_at', '-infinity')
        .eq('id', provider.user_id)
      if (error) {
        return new Response(error.message, { status: 500 })
      }
      if (!profileData || profileData.length === 0 || !profileData[0]) {
        return
      }
      const profile = profileData[0] as Provider
      // TODO: add check reconect or create
    })

    return NextResponse.json({ message: 'success' })
  } catch (error) {
    console.error('Error in POST /api/provider/auth/notify-reconnect:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
