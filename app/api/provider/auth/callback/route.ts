import { NextResponse } from 'next/server'
import { createClient } from '@/lib/utils/supabase/server'
import { env } from '@/lib/env'
import { Database } from '@/lib/types/supabase'

// {
//   "status":"CREATION_SUCCESS", // or "RECONNECTED" for reconnect type
//   "account_id":"e54m8LR22bA7G5qsAc8w",
//   "name":"myuser1234"
// }

export async function POST(req: Request) {
  try {
    const { status, account_id, name } = await req.json()
    console.log('status:', status)
    console.log('account_id:', account_id)
    console.log('name:', name)

    if (!status || !account_id || !name) {
      return NextResponse.json(
        { error: 'params are required' },
        { status: 400 }
      )
    }
    const supabase = createClient()
    const {
      data: { profile },
      error,
    } = await supabase.from('profiles').select('*').eq('id', name).single()
    if (!profile || error) {
      console.log('error:', error)
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 })
    }

    if (status !== 'CREATION_SUCCESS' && status !== 'RECONNECTED') {
      return NextResponse.json({ error: 'Invalid status' }, { status: 400 })
    }

    let status_code = 0
    if (status === 'RECONNECTED') {
      status_code = 1
    }

    const url = `https://${
      env.UNIPILE_DNS
    }/api/v1/users/me?account_id=${account_id}`

    const options = {
      method: 'GET',
      headers: {
        'X-API-KEY': env.UNIPILE_ACCESS_TOKEN,
        accept: 'application/json',
        'content-type': 'application/json',
      },
    }

    try {
      const responseOfGetOwnProfile = await fetch(url, options)

      if (responseOfGetOwnProfile.status !== 200) {
        return NextResponse.json(
          { error: 'An error occurred while searching' },
          { status: 500 }
        )
      }

      const dataOfGetOwnProfile = await responseOfGetOwnProfile.json()

      const account: Database['public']['Tables']['providers']['Insert'] = {
        user_id: name,
        type: 0,
        status: status_code,
        account_id,
        public_identifier: dataOfGetOwnProfile.public_identifier,
        first_name: dataOfGetOwnProfile.first_name,
        last_name: dataOfGetOwnProfile.last_name,
        email: dataOfGetOwnProfile.email,
        company_id: profile.company_id,
        like_target_account_ids: [],
        like_target_account_hours: [],
        check_reaction_hours: [],
      }

      const supabase = createClient()
      const responseOfUpsertProviders = await supabase
        .from('providers')
        .upsert(account)
      console.log('responseOfUpsertProviders:', responseOfUpsertProviders)

      return NextResponse.json({ success: true })
    } catch (error) {
      console.log(error)
    }
  } catch (error) {
    console.error('LinkedIn API Error:', error)
    return NextResponse.json(
      { error: 'An error occurred while callback' },
      { status: 500 }
    )
  }
}
