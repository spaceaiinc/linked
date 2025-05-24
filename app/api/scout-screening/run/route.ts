import { NextResponse } from 'next/server'
import { createClient } from '@/lib/utils/supabase/server'
import { generateText } from 'ai'
import { customModel } from '@/lib/ai/ai-utils'

/**
 * POST /api/scout-screening/run
 *
 * Expected JSON body:
 * {
 *   "scout_screening_id": string,
 *   "candidate_info": string | Record<string, string | number>
 * }
 *
 * The endpoint fetches all scout_screening_patterns that belong to the given
 * screening id (and are not soft-deleted), substitutes template variables
 * such as {{candidate_name_id}}, {{current_position}}, {{age}}, {{achievement}}
 * with the provided candidate information and returns the populated patterns.
 */
export async function POST(req: Request) {
  try {
    const { scout_screening_id, candidate_info } = await req.json()

    if (!scout_screening_id) {
      return NextResponse.json(
        { error: 'scout_screening_id is required' },
        { status: 400 }
      )
    }

    const supabase = createClient()

    // Make sure the requester is authenticated – this is necessary to satisfy
    // RLS policies applied to the scout_screening_patterns table.
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser()

    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data: patterns, error } = await supabase
      .from('scout_screening_patterns')
      .select('*')
      .eq('scout_screening_id', scout_screening_id)
      .eq('deleted_at', '-infinity')
      .order('updated_at', { ascending: true })

    if (error) {
      console.error('Error fetching patterns', error)
      return NextResponse.json(
        { error: 'Failed to fetch patterns' },
        { status: 500 }
      )
    }

    // Convert candidate_info into a record no matter the input format
    let infoObj: Record<string, string> = {}

    if (candidate_info && typeof candidate_info === 'object') {
      infoObj = Object.fromEntries(
        Object.entries(candidate_info).map(([k, v]) => [k, String(v)])
      )
    } else if (typeof candidate_info === 'string') {
      // Accept JSON string or free-form key:value pairs separated by newlines
      try {
        const parsed = JSON.parse(candidate_info)
        if (parsed && typeof parsed === 'object') {
          infoObj = Object.fromEntries(
            Object.entries(parsed as Record<string, unknown>).map(([k, v]) => [
              k,
              String(v ?? ''),
            ])
          )
        }
      } catch (e) {
        // Fallback: split by newlines and colon
        candidate_info
          .split('\n')
          .map((line) => line.trim())
          .filter(Boolean)
          .forEach((line) => {
            const [key, ...rest] = line.split(':')
            if (key && rest.length > 0) {
              infoObj[key.trim()] = rest.join(':').trim()
            }
          })
      }
    }

    const replaceVars = (template: string | null) => {
      if (!template) return ''
      let result = template
      for (const [key, value] of Object.entries(infoObj)) {
        result = result.split(`{{${key}}}`).join(value)
      }
      return result
    }

    let passedPattern: any = null

    for (const pattern of patterns || []) {
      // Use AI to judge if candidate_info satisfies pattern.conditions
      let isPassed = false
      let reason = ''
      try {
        console.log('pattern', pattern)
        const { text } = await generateText({
          model: customModel('gpt-4o-mini'),
          system: `You are a strict JSON evaluator. Return JSON "+{ \"passed\": true|false, \"reason\": string }+" where passed is true only when the candidate fully satisfies ALL conditions. Do not provide any additional keys.`,
          prompt: `candidate_info:\n${JSON.stringify(infoObj, null, 2)}\n\nconditions:\n${pattern.conditions}`,
        })

        console.log('text', text)

        const parsed = JSON.parse(text.trim())
        isPassed = parsed.passed === true || parsed.passed === 'ok'
        reason = parsed.reason
      } catch (evalErr) {
        console.error('AI evaluation error', evalErr)
      }

      if (isPassed) {
        passedPattern = {
          passed: 'ok',
          reason: reason,
          pattern_id: pattern.id,
          subject: replaceVars(pattern.subject),
          body: replaceVars(pattern.body),
          resend_subject: replaceVars(pattern.resend_subject),
          resend_body: replaceVars(pattern.resend_body),
          re_resend_subject: replaceVars(pattern.re_resend_subject),
          re_resend_body: replaceVars(pattern.re_resend_body),
        }
        break
      }
    }

    console.log('passedPattern', passedPattern)

    if (passedPattern) {
      return NextResponse.json(passedPattern, { status: 200 })
    }

    return NextResponse.json({ passed: 'ng' }, { status: 200 })
  } catch (err) {
    console.error('Unexpected error in POST /api/scout-screening/run', err)
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    )
  }
}
