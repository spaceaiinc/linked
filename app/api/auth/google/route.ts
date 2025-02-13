import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/utils/supabase/server'
import { redirectTo } from '@/config'

export async function POST(request: NextRequest) {
  const supabase = createClient()
  console.log('Supabase client created.')
  // get next from send request url
  const { next } = await request.json()

  try {
    console.log('Attempting to sign in with Google')
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: redirectTo(next),
      },
    })

    if (error) throw error

    if (data.url) {
      console.log('Google sign-in URL generated successfully.')
      return NextResponse.json({
        status: 'Success',
        url: data.url,
      })
    } else {
      throw new Error('No URL returned from Supabase')
    }
  } catch (error) {
    console.error('Caught error:', error)
    if (error instanceof Error) {
      return NextResponse.json(
        { status: 'Error', message: error.message },
        { status: 500 }
      )
    } else {
      return NextResponse.json(
        { status: 'Error', message: 'An unknown error occurred' },
        { status: 500 }
      )
    }
  }
}
