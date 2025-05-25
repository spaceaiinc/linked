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

// Utility to robustly parse AI-generated JSON that may be wrapped in markdown
// fences (``` or ```json) or have stray leading/trailing characters such as '+'.
// It extracts the first JSON object substring and parses it.
const safeJsonParse = <T = any>(raw: string): T => {
  const trimmed = raw
    .trim()
    // remove leading markdown code fences
    .replace(/^```[a-z]*\s*\n?/i, '')
    // remove trailing markdown code fences
    .replace(/```\s*$/i, '')
    .replace(/^\+/g, '') // strip leading '+' symbols that models sometimes add

  // Attempt direct parse first
  try {
    return JSON.parse(trimmed)
  } catch (_) {
    // Fallback: extract substring between first '{' and last '}'
    const first = trimmed.indexOf('{')
    const last = trimmed.lastIndexOf('}')
    if (first !== -1 && last !== -1 && last > first) {
      return JSON.parse(trimmed.slice(first, last + 1))
    }
    throw _
  }
}

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
      .order('priority', { ascending: true })

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
    const failedPatterns: Array<{
      original_conditions: string | null
      reason: string
    }> = []

    for (const pattern of patterns || []) {
      // Use AI to judge if candidate_info satisfies pattern.conditions
      // Assume the candidate passes until a condition fails
      let isPassed = true
      let reason = ''
      try {
        // condition内の条件ごとにAIで評価する
        // 1. 年齢ごと行職種経験などをAIによって分ける
        const { text: conditions } = await generateText({
          model: customModel('gpt-4o'),
          temperature: 0,
          topP: 0.5,
          frequencyPenalty: 0,
          presencePenalty: 0,
          system: `
          You are a strict JSON evaluator.
          Return JSON "+{ \"conditions\": [\"condition\": string ] }+"
          条件をキリのいい箇所でsplitしてください。5 conditionsくらいにしてください。
          Do not provide any additional keys.`,
          prompt: `conditions:\n${pattern.original_conditions}`,
        })
        // 2. それぞれの条件をAIによって評価する
        // Some AI models may wrap JSON in markdown code fences like ```json. Remove these if present before parsing.
        const cleanSplitted = conditions
          .trim()
          .replace(/^```[a-z]*\s*\n?/i, '') // remove leading ``` or ```json
          .replace(/```\s*$/i, '') // remove trailing ```

        const parsed_conditions = safeJsonParse(cleanSplitted)
        console.log('parsed_conditions', parsed_conditions)
        for (const condition of parsed_conditions.conditions) {
          console.log('condition', condition)
          const prompt = `condition: ${condition}\n\ncandidate_info:\n${JSON.stringify(infoObj, null, 2)}`
          const { text: passed } = await generateText({
            model: customModel('gpt-4o'),
            temperature: 0,
            topP: 0.5,
            frequencyPenalty: 0,
            presencePenalty: 0,
            system: `
            You are a strict JSON evaluator. Return JSON "+{ \"passed\": true|false, \"reason\": string }+" 
            Do not provide any additional keys.
            candidate_infoの内容がconditionの中の値を満たしているかどうかを判断してください。
            reason must be in Japanese. reason includes quotation marks in condition and candidate_info.
            `,
            prompt: prompt,
          })
          // Some AI models may wrap JSON in markdown code fences like ```json. Remove these if present before parsing.
          const cleanPassed = passed
            .trim()
            .replace(/^```[a-z]*\s*\n?/i, '')
            .replace(/```\s*$/i, '')
          const parsed_passed = safeJsonParse(cleanPassed)
          console.log('parsed_passed', parsed_passed)
          reason +=
            parsed_passed.reason
              .replace('candidate_info', '候補者情報')
              .replace('condition', '指定条件') + '\n'
          if (parsed_passed.passed === false) {
            isPassed = false
            break
          }
        }
      } catch (evalErr) {
        console.error('AI evaluation error', evalErr)
      }

      if (isPassed) {
        passedPattern = {
          passed: 'ok',
          reason: reason,
          original_conditions: pattern.original_conditions,
          pattern_id: pattern.id,
          subject: replaceVars(pattern.subject),
          body: replaceVars(pattern.body),
          resend_subject: replaceVars(pattern.resend_subject),
          resend_body: replaceVars(pattern.resend_body),
          re_resend_subject: replaceVars(pattern.re_resend_subject),
          re_resend_body: replaceVars(pattern.re_resend_body),
        }
        break
      } else {
        failedPatterns.push({
          original_conditions: pattern.original_conditions,
          reason: reason,
        })
      }
    }

    console.log('passedPattern', passedPattern)

    if (passedPattern) {
      return NextResponse.json(
        {
          ...passedPattern,
          failedPatterns,
        },
        { status: 200 }
      )
    }

    return NextResponse.json(
      {
        passed: 'ng',
        failedPatterns,
      },
      { status: 200 }
    )
  } catch (err) {
    console.error('Unexpected error in POST /api/scout-screening/run', err)
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    )
  }
}
