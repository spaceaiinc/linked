import { NextResponse } from 'next/server'
import { createClient } from '@/lib/utils/supabase/server'
import { env } from '@/lib/env'
import { Database } from '@/lib/types/supabase'

// {
//   "status":"CREATION_SUCCESS", // or "RECONNECTED" for reconnect type
//   "account_id":"e54m8LR22bA7G5qsAc8w",
//   "name":"{user_id: "test", company_id: "b2f62c00-a76c-4dd3-bc44-b1ce238cb512"}"
// }

export async function POST(req: Request) {
  try {
    const { status, account_id, name } = await req.json()
    console.log('status:', status)
    console.log('account_id:', account_id)
    console.log('name:', name)
    const { user_id, company_id } = JSON.parse(name)
    console.log('user_id:', user_id)
    console.log('company_id:', company_id)
    if (!status || !account_id || !name) {
      return NextResponse.json(
        { error: 'params are required' },
        { status: 400 }
      )
    }

    if (!status || !account_id || !name) {
      return NextResponse.json(
        { error: 'params are required' },
        { status: 400 }
      )
    }
    const supabase = createClient()
    // const {
    //   data: { profile },
    //   error,
    // } = await supabase.from('profiles').select('*').eq('id', name).single()
    // if (error) {
    //   console.log('error:', error)
    //   return NextResponse.json({ error: 'Profile not found' }, { status: 404 })
    // }

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
      console.log('dataOfGetOwnProfile:', dataOfGetOwnProfile)

      const account: Database['public']['Tables']['providers']['Insert'] = {
        user_id: user_id,
        type: 0,
        status: status_code,
        account_id,
        private_identifier: dataOfGetOwnProfile.provider_id,
        public_identifier: dataOfGetOwnProfile.public_identifier,
        first_name: dataOfGetOwnProfile.first_name,
        last_name: dataOfGetOwnProfile.last_name,
        email: dataOfGetOwnProfile.email,
        company_id: company_id,
        like_target_private_identifiers: [],
        like_target_hours: [],
        check_reaction_hours: [],
      }

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
