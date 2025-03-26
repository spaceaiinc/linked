import { env } from '@/lib/env'
import { unipileClient } from '@/lib/unipile'
import { createClient } from '@/lib/utils/supabase/server'
import { NextResponse } from 'next/server'

export async function POST(req: Request) {
  try {
    const {
      account_id,
      target_private_identifiers,
    }: {
      account_id: string
      target_private_identifiers: string[]
    } = await req.json()

    if (!account_id || !target_private_identifiers) {
      return NextResponse.json(
        { error: 'Keyword and message are required' },
        { status: 400 }
      )
    }

    const supabase = createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json(
        { error: 'User not authenticated' },
        { status: 401 }
      )
    }

    const { data: provider } = await supabase
      .from('providers')
      .select('id')
      .eq('user_id', user.id)
      .eq('account_id', account_id)
      .single()

    if (!provider || !provider?.id) {
      return NextResponse.json(
        { error: 'Invalid LinkedIn account' },
        { status: 400 }
      )
    }

    try {
      // like latest 3 posts on target account ids
      const url = `https://${env.UNIPILE_DNS}/api/v1/linkedin/search?account_id=${account_id}&limit=10`
      const options = {
        method: 'POST',
        headers: {
          'X-API-KEY': env.UNIPILE_ACCESS_TOKEN,
          accept: 'application/json',
          'content-type': 'application/json',
        },
        body: JSON.stringify({
          api: 'classic',
          category: 'posts',
          posted_by: { member: target_private_identifiers },
          sort_by: 'date',
        }),
      }

      fetch(url, options)
        .then(async (searchPostsResponse) => {
          // get ids from search results
          if (!searchPostsResponse.ok) {
            return NextResponse.json(
              { error: 'An error occurred while searching' },
              { status: 500 }
            )
          }
          //   {
          // "object": "LinkedinSearch",
          // "items": [
          //   {
          //     "object": "SearchResult",
          //     "type": "POST",
          //     "id": "string",
          //   }
          // ...
          // ]
          //   }
          const dataOfSearchPost = await searchPostsResponse.json()
          dataOfSearchPost.items.map(async (item: { id: string }) => {
            // add a reaction to the post
            try {
              const response = await unipileClient.users.sendPostReaction({
                account_id,
                post_id: item.id,
                reaction_type: 'like',
              })
              console.log('response', response)
            } catch (error) {
              console.log(error)
            }
            //           {
            //   "object": "UserInvitationSent",
            //   "invitation_id": "string",
            //   "usage": 0
            // }
          })
        })
        .then((json) => console.log(json))
        .catch((err) => console.error(err))
    } catch (error) {
      console.log(error)
      return NextResponse.json(
        { error: 'An error occurred while searching' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
    })
  } catch (error) {
    console.error('LinkedIn API Error:', error)
    return NextResponse.json(
      { error: 'An error occurred while sending messages' },
      { status: 500 }
    )
  }
}
