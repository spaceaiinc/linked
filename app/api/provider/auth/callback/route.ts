import { NextResponse } from 'next/server'
import { createClient } from '@/lib/utils/supabase/server'

// {
//   "status":"CREATION_SUCCESS", // or "RECONNECTED" for reconnect type
//   "account_id":"e54m8LR22bA7G5qsAc8w",
//   "name":"myuser1234"
// }

export async function POST(req: Request) {
  try {
    console.log('LinkedIn Callback:', req.body)
    const { status, account_id, name } = await req.json()

    if (!status || account_id || name) {
      return NextResponse.json(
        { error: 'params are required' },
        { status: 400 }
      )
    }

    if (status !== 'CREATION_SUCCESS' && status !== 'RECONNECTED') {
      return NextResponse.json(
        { error: 'Invalid status' },
        { status: 400 }
      )
    }

    let status_code = 0
    if (status === 'RECONNECTED') {
      status_code = 1
    }

    const account = {
      user_id: name,
      type: 0,
      daily_limit: 10,
      name,
      status: status_code,
      account_id,
    }

    const supabase = createClient()
    const res = await supabase.from('providers').insert(account)

    return NextResponse.json(res)
  } catch (error) {
    console.error('LinkedIn API Error:', error)
    return NextResponse.json(
      { error: 'An error occurred while callback' },
      { status: 500 }
    )
  }
}
