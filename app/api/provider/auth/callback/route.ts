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

    if (!status || !account_id || !name) {
      return NextResponse.json(
        { error: 'params are required' },
        { status: 400 }
      )
    }

    if (status !== 'CREATION_SUCCESS' && status !== 'RECONNECTED') {
      return NextResponse.json({ error: 'Invalid status' }, { status: 400 })
    }

    let status_code = 0
    if (status === 'RECONNECTED') {
      status_code = 1
    }

    const account = {
      user_id: name,
      type: 0,
      status: status_code,
      account_id,
      // id: '',
      // created_at: '',
      // updated_at: '',
      // deleted_at: '',
      // public_identifier: '',
      // first_name: '',
      // last_name: '',
      // like_target_account_ids: '',
      // like_target_account_hours: 0,
      // check_reaction_duration: 0
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
