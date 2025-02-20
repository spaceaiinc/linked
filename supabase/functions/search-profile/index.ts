// Follow this setup guide to integrate the Deno language server with your editor:
// https://deno.land/manual/getting_started/setup_your_environment
// This enables autocomplete, go to definition, etc.

// Setup type definitions for built-in Supabase Runtime APIs
import 'jsr:@supabase/functions-js/edge-runtime.d.ts'
/* @ts-ignore */
import { createClient } from 'npm:@supabase/supabase-js@latest'

console.log('Deploying search-profile function')

const supabase = () =>
  createClient(
    // Supabase API URL - env var exported by default.
    /* @ts-ignore */
    Deno.env.get('SUPABASE_URL') ?? '',
    // Supabase API ANON KEY - env var exported by default.
    /* @ts-ignore */
    Deno.env.get('SUPABASE_ANON_KEY') ?? ''
  )

/* @ts-ignore */
Deno.serve(async (req: any) => {
  console.log('Request received at search-profile function:', req)
  // UTCtimeを取得して、日本時間に変換
  const now = new Date(
    new Date().toLocaleString('ja-JP', { timeZone: 'Asia/Tokyo' })
  )
  console.log('day', now.getDay(), 'hours', now.getHours())
  const { data: workflows, error } = await supabase()
    .from('workflows')
    .select('*')
    .eq('scheduled_hours', now.getHours())
    .eq('scheduled_weekdays', now.getDay())

  if (error) {
    return new Response(error.message, { status: 500 })
  }

  //　workflowsのscheduled_hoursとdaysとweeksが現在時刻と一致するものを返す
  const workflowPromises = workflows.map(async (workflow: any) => {
    const response = await fetch(`/api/provider/search/profile`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        workflow_id: workflow.id,
        account_id: workflow.account_id,
        type: workflow.type,
        search_url: workflow.search_url,
        keywords: workflow.keywords,
        target_public_identifiers: workflow.target_public_identifiers,
        mylist_id: workflow.mylist_id,
        limit_count: workflow.limit_count,
        message: workflow.message,
        network_distance: workflow.network_distance,
        scheduled_hours: workflow.scheduled_hours,
        scheduled_days: workflow.scheduled_days,
        scheduled_weekdays: workflow.scheduled_weekdays,
      }),
    })
    console.log('response', response)
    if (response.ok) {
      const responseData = await response.json()
      console.log('responseData', responseData)
      return responseData
    } else {
      console.error('Failed to generate responses:', response)
      return response
    }
  })

  const workflowResults = await Promise.all(workflowPromises)
  console.log('workflowResults', workflowResults)

  return new Response(
    JSON.stringify({
      success: true,
    }),
    {
      headers: { 'Content-Type': 'application/json' },
    }
  )
})

/* To invoke locally:

  1. Run `supabase start` (see: https://supabase.com/docs/reference/cli/supabase-start)
  2. Make an HTTP request:

  curl -i --location --request POST 'http://127.0.0.1:54321/functions/v1/search-profile' \
    --header 'Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0' \
    --header 'Content-Type: application/json' \
    --data '{"name":"Functions"}'

*/
