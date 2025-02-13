import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'

export async function POST() {
  try {
    // Get all cookies
    const cookieStore = cookies()
    const allCookies = cookieStore.getAll()
    
    // Find LinkedIn specific cookies
    const linkedInCookies = allCookies.filter(cookie => 
      cookie.name.toLowerCase().includes('li_at') || 
      cookie.name.toLowerCase().includes('jsessionid')
    )

    if (linkedInCookies.length === 0) {
      return NextResponse.json(
        { error: 'LinkedIn cookies not found' },
        { status: 404 }
      )
    }

    // Format cookies for Unipile API
    const cookieString = linkedInCookies
      .map(cookie => `${cookie.name}=${cookie.value}`)
      .join('; ')

    // Send cookies to Unipile API
    const unipileResponse = await fetch('https://api.unipile.com/v1/linkedin/auth/cookie', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.UNIPILE_API_KEY}`
      },
      body: JSON.stringify({
        cookie: cookieString
      })
    })

    if (!unipileResponse.ok) {
      throw new Error('Failed to authenticate with Unipile')
    }

    const data = await unipileResponse.json()

    return NextResponse.json(data)
  } catch (error) {
    console.error('LinkedIn cookie auth error:', error)
    return NextResponse.json(
      { error: 'Failed to authenticate with LinkedIn' },
      { status: 500 }
    )
  }
}