import { Database } from '@/lib/types/supabase'
import { createClient } from '@/lib/utils/supabase/server'
import { createScoutScreeningSchema } from '@/lib/validation'
import { NextResponse } from 'next/server'

export async function POST(req: Request) {
  /**
   * validate param
   */
  const param = await createScoutScreeningSchema.validate(await req.json(), {
    abortEarly: false, // すべてのエラーを一度に収集
    stripUnknown: true, // 未知のフィールドを削除
  })
  try {
    /**
     * authenticate
     */
    const supabase = createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user || !user.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // account_idからprofile情報を取得する
    const { data: profile } = await supabase
      .from('profiles')
      .select('id, company_id')
      .eq('id', user.id) // use user.id to get profile
      .single()

    if (!profile || !profile?.company_id) {
      return NextResponse.json(
        { error: 'Invalid user profile or company association' },
        { status: 400 }
      )
    }

    /**
     * create scout_screening
     */
    const scoutScreening: Database['public']['Tables']['scout_screenings']['Insert'] =
      {
        company_id: profile.company_id,
        user_id: user.id,
        // company_name and job_title will use default empty string values from DB schema
      }

    const { data: scoutScreeningData, error } = await supabase
      .from('scout_screenings')
      .insert(scoutScreening)
      .select('*')
      .single()
    if (error) {
      console.error('Error in inserting scout_screening:', error)
      return NextResponse.json(
        { error: 'Internal server error' },
        { status: 500 }
      )
    }
    if (!scoutScreeningData.id) {
      return NextResponse.json(
        { error: 'Internal server error: scout_screening id is not found' },
        { status: 500 }
      )
    }

    return NextResponse.json(
      {
        scout_screening_id: scoutScreeningData.id,
      },
      { status: 200 }
    )
  } catch (error) {
    console.error('Error in POST /api/scout-screening:', error)
    // Check if error is a yup validation error
    if (error instanceof Error && 'errors' in error) {
      return NextResponse.json(
        { error: 'Validation failed', details: (error as any).errors },
        { status: 400 }
      )
    }
    return NextResponse.json(
      { error: 'Internal server error: ' + (error as Error).message }, // More specific error message
      { status: 500 }
    )
  }
}
