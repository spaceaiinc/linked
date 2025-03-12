import { getSession } from '@/lib/db/cached-queries'
import { createClient } from '@/lib/utils/supabase/server'
import { NextResponse } from 'next/server'

export async function GET() {
  const supabase = createClient()
  const { data: userData, error: getUserError } = await supabase.auth.getUser()

  if (getUserError) {
    console.error('Error fetching user:', getUserError)
    return NextResponse.json('Unauthorized!', { status: 401 })
  }
  if (!userData) {
    return NextResponse.json('Unauthorized!', { status: 401 })
  }
  const user = userData.user

  const { data: chats, error } = await supabase
    .from('chats')
    .select()
    .eq('user_id', user.id!)
    .order('created_at', { ascending: false })

  if (error) throw error

  return NextResponse.json(chats)
}
