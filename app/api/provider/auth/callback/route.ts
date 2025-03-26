import { NextResponse } from 'next/server'
import { createClient } from '@/lib/utils/supabase/server'
import { env } from '@/lib/env'
import { Database } from '@/lib/types/supabase'
import { ProviderStatus, ProviderType } from '@/lib/types/master'
import { supabase } from '@/lib/utils/supabase/service'
import { decodeJapaneseOnly } from '@/lib/utils/decode'

// {
//   "status":"CREATION_SUCCESS", // or "RECONNECTED" for reconnect type
//   "account_id":"e54m8LR22bA7G5qsAc8w",
//   "name":"{user_id: "test", company_id: "b2f62c00-a76c-4dd3-bc44-b1ce238cb512"}"
// }

export async function POST(req: Request) {
  try {
    const { status, account_id, name } = await req.json()
    console.log('status:', status, 'account_id:', account_id, 'name:', name)
    if (!status || !account_id || !name) {
      return NextResponse.json(
        { error: 'params are required' },
        { status: 400 }
      )
    }
    if (status !== 'CREATION_SUCCESS' && status !== 'RECONNECTED') {
      return NextResponse.json({ error: 'Invalid status' }, { status: 400 })
    }

    const { user_id, company_id } = JSON.parse(name)
    if (!user_id || !company_id) {
      return NextResponse.json(
        { error: 'user_id and company_id are required' },
        { status: 400 }
      )
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

    const getOwnProfileResponse = await fetch(url, options)

    if (getOwnProfileResponse.status !== 200) {
      return NextResponse.json(
        { error: 'An error occurred while searching' },
        { status: 500 }
      )
    }

    const getOwnProfileData = await getOwnProfileResponse.json()
    console.log('getOwnProfileData:', getOwnProfileData)

    const account: Database['public']['Tables']['providers']['Insert'] = {
      user_id: user_id,
      type: ProviderType.LINKEDIN,
      status: ProviderStatus[status as keyof typeof ProviderStatus],
      account_id: account_id,
      private_identifier: getOwnProfileData.provider_id,
      public_identifier: decodeJapaneseOnly(
        getOwnProfileData.public_identifier
      ),
      first_name: getOwnProfileData.first_name,
      last_name: getOwnProfileData.last_name,
      email: getOwnProfileData.email,
      company_id: company_id,
    }

    const { error: upsertProviderError } = await supabase
      .from('providers')
      .upsert(account, { onConflict: 'account_id' })
    if (upsertProviderError) {
      return NextResponse.json(
        { error: 'An error occurred while upserting' },
        { status: 500 }
      )
    }
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error at /api/provider/auth/callback: ', error)
    return NextResponse.json(
      { error: 'An error occurred while callback' },
      { status: 500 }
    )
  }
}
