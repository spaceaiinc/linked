import { unipileClient } from '@/lib/unipile'
import { createClient } from '@/lib/utils/supabase/server'
import { NextResponse } from 'next/server'

export async function POST(req: Request) {
  try {
    const {
      account_id,
      target_private_identifiers,
      message,
    }: {
      account_id: string
      target_private_identifiers: string[]
      message: string
    } = await req.json()

    if (!account_id || !target_private_identifiers || !message) {
      return NextResponse.json(
        { error: 'Keyword and message are required' },
        { status: 400 }
      )
    }

    // authenticate
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
      target_private_identifiers.forEach(async (target_account_id) => {
        // get all chats
        const getAllChatsResponse = await unipileClient.messaging.getAllChats({
          account_id: target_account_id,
        })
        if (!getAllChatsResponse || getAllChatsResponse.items.length === 0) {
          // create new chat if not exists
          const startNewChatResponse =
            await unipileClient.messaging.startNewChat({
              account_id: target_account_id,
              text: message,
              attendees_ids: [],
            })
          console.log('startNewChatResponse', startNewChatResponse)
        }

        // send message
        // developer.unipile.com/reference/chatscontroller_sendmessageinchat
        const sendMessageResponse = await unipileClient.messaging.sendMessage({
          chat_id: getAllChatsResponse.items[0].id,
          text: message,
        })
        console.log('sendMessageResponse', sendMessageResponse)
      })
    } catch (error) {
      console.log(error)
      return NextResponse.json(
        { error: 'An error occurred while sending messages' },
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
