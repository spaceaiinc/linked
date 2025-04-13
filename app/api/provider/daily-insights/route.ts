import { NextResponse } from 'next/server'
import { Provider } from '@/lib/types/supabase'
import { supabase } from '@/lib/utils/supabase/service'
import { unipileClient } from '@/lib/unipile'

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

    providers.forEach(async (provider: Provider) => {
      // provider_daily_insightsの最新のレコードが24時間以内に作成されている場合は、処理をスキップ
      const { data: latestProviderDailyInsightsData, error: latestError } =
        await supabase
          .from('provider_daily_insights')
          .select('*')
          .eq('provider_id', provider.id)
          .eq('deleted_at', '-infinity')
          // utc
          .gt(
            'created_at',
            new Date(new Date().getTime() - 24 * 60 * 60 * 1000).toISOString()
          )
          .order('created_at', { ascending: false })
          .limit(1)
      if (latestError) {
        console.error(
          'Error fetching latest provider_daily_insights:',
          latestError
        )
        return
      }
      console.log(
        'latestProviderDailyInsightsData:',
        latestProviderDailyInsightsData,
        'provider_id:',
        provider.id
      )
      if (
        latestProviderDailyInsightsData &&
        latestProviderDailyInsightsData.length > 0
      ) {
        console.log(
          'Latest provider_daily_insights found, skipping provider:',
          provider.id
        )
        return
      }
      // providersのfollower_countとconnecttion_countを取得してprovider_daily_insightsにinsert
      const getProfileResponse = await unipileClient.users.getProfile({
        account_id: provider.account_id,
        identifier: provider.public_identifier,
      })
      await new Promise((resolve) => setTimeout(resolve, 500))
      if (!getProfileResponse || getProfileResponse === undefined) return
      if (
        'follower_count' in getProfileResponse &&
        'connections_count' in getProfileResponse
      ) {
        console.log('getProfileResponse:', getProfileResponse)
        // provider_idが存在する場合は、provider_daily_insightsにinsert
        const {
          data: insertProviderDailyInsightsData,
          error: insertProviderDailyInsightsError,
        } = await supabase.from('provider_daily_insights').insert([
          {
            company_id: provider.company_id,
            provider_id: provider.id,
            follower_count: getProfileResponse.follower_count,
            connections_count: getProfileResponse.connections_count,
          },
        ])
        if (insertProviderDailyInsightsError) {
          console.error(
            'Error inserting provider_daily_insights:',
            insertProviderDailyInsightsError
          )
          return
        }
        if (!insertProviderDailyInsightsData) {
          console.error('insertProviderDailyInsightsData is null')
          return
        }
      }
    })

    return NextResponse.json({ message: 'success' })
  } catch (error) {
    console.error('Error in POST /api/provider/daily-insights:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
