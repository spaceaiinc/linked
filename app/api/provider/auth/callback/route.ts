import { NextResponse } from 'next/server'
import { createClient } from '@/lib/utils/supabase/server'

// {
//   "status":"CREATION_SUCCESS", // or "RECONNECTED" for reconnect type
//   "account_id":"e54m8LR22bA7G5qsAc8w",
//   "name":"myuser1234"
// }

export async function POST(req: Request) {
  try {
    const { status, account_id, name } = await req.json()

    if (!status || account_id || name) {
      return NextResponse.json(
        { error: 'params are required' },
        { status: 400 }
      )
    }

    // Get user_id from query param
    const { searchParams } = new URL(req.url)
    const user_id = searchParams.get('user_id')

    if (!user_id) {
      return NextResponse.json(
        { error: 'user_id is required' },
        { status: 400 }
      )
    }

    const account = {
      user_id,
      type: 0,
      name,
      status,
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
