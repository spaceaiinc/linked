import {
  Database,
  PublicSchemaTables,
  ScoutScreeningPattern,
} from '@/lib/types/supabase'
import { createClient } from '@/lib/utils/supabase/server'
import { createScoutScreeningSchema } from '@/lib/validation'
import { NextResponse } from 'next/server'
import { PREFECTURES } from '@/lib/utils/prefectures'

export async function POST(req: Request) {
  const requestBody = await req.json()

  // If scout_screening_id exists -> update flow, otherwise create flow (legacy)

  if (requestBody.scout_screening_id) {
    // ---------------------------
    // UPDATE FLOW
    // ---------------------------
    try {
      const supabase = createClient()
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user || !user.id) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
      }

      // Get profile and company_id
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('company_id')
        .eq('id', user.id)
        .single()

      if (profileError || !profile?.company_id) {
        return NextResponse.json(
          { error: 'Invalid user profile or company association' },
          { status: 400 }
        )
      }

      const companyId = profile.company_id

      // Extract payload
      const {
        scout_screening_id,
        company_name,
        job_title,
        patterns = [],
      } = requestBody as {
        scout_screening_id: string
        company_name?: string
        job_title?: string
        patterns: any[]
      }

      // // ---------------------------
      // // GENERATE SCREENINGS AGENT
      // // ---------------------------
      // // call chatgpt api
      // type AgentWorkflow = {
      //   name: string
      //   system_prompt: string
      //   steps: string[]
      //   output_schema: string
      // }
      // const agentWorkflows: AgentWorkflow[] = []

      // ---------------------------
      // UPDATE FLOW
      // ---------------------------

      const updateScoutScreeningPayload: PublicSchemaTables['scout_screenings']['Update'] =
        {
          company_id: companyId,
          user_id: user.id,
          company_name: company_name ?? '',
          job_title: job_title ?? '',
        }

      // Update the scout_screenings row
      const { error: updateError } = await supabase
        .from('scout_screenings')
        .update(updateScoutScreeningPayload)
        .eq('id', scout_screening_id)
        .select('*')

      if (updateError) {
        console.error('Error updating scout_screening:', updateError)
        return NextResponse.json(
          { error: 'Failed to update screening' },
          { status: 500 }
        )
      }

      // Fetch current patterns from DB for deletion comparison
      const { data: existingPatterns, error: fetchPatternErr } = await supabase
        .from('scout_screening_patterns')
        .select('id')
        .eq('deleted_at', '-infinity')
        .eq('scout_screening_id', scout_screening_id)

      if (fetchPatternErr) {
        console.error('Error fetching existing patterns:', fetchPatternErr)
      }

      // Map incoming patterns to DB schema, converting prefectures to indices
      const patternsPayload = (patterns as any[]).map((p) => {
        const prefectureIndices = (p.work_location_prefectures || [])
          .map((name: string | number) => {
            const idx = PREFECTURES.indexOf(String(name))
            return idx !== -1 ? idx : null
          })
          .filter((idx: number | null) => idx !== null)

        const isNew = !p.scout_screening_id || p.scout_screening_id === ''

        const payload: ScoutScreeningPattern = {
          id: isNew ? undefined : p.id,
          company_id: companyId,
          scout_screening_id: scout_screening_id,
          name: p.name ?? '',
          age_min: p.age_min ?? 0,
          age_max: p.age_max ?? 0,
          exclude_job_changes: p.exclude_job_changes ?? 0,
          has_management_experience: p.has_management_experience ?? false,
          work_location_prefectures: prefectureIndices as number[],
          conditions: p.conditions ?? '',
          subject: p.subject ?? '',
          body: p.body ?? '',
          resend_subject: p.resend_subject ?? '',
          resend_body: p.resend_body ?? '',
          re_resend_subject: p.re_resend_subject ?? '',
          re_resend_body: p.re_resend_body ?? '',
          updated_at: new Date().toISOString(),
          created_at: '',
          deleted_at: '',
        }

        // Include deleted_at only if defined and non-empty
        if (p.deleted_at && p.deleted_at !== '') {
          payload.deleted_at = p.deleted_at
        }

        return payload
      })

      // Build id lists for comparison
      const existingIds = (existingPatterns || []).map((p) => p.id)

      // Decide rows to update / insert based on id existence in DB
      const rowsToUpdate = patternsPayload.filter(
        (p) => p.id && existingIds.includes(p.id as string)
      )
      const rowsToInsert = patternsPayload.filter(
        (p) => !p.id || !existingIds.includes(p.id as string)
      )

      // Insert new rows
      let inserted: any[] = []
      if (rowsToInsert.length > 0) {
        const insertPayload = rowsToInsert.map(({ id: _omit, ...rest }) => rest)

        const { data: insertedRows, error: insertErr } = await supabase
          .from('scout_screening_patterns')
          .insert(insertPayload)
          .select('*')

        if (insertErr) {
          console.error('Error inserting patterns:', insertErr)
          return NextResponse.json(
            { error: 'Failed to insert patterns' },
            { status: 500 }
          )
        }
        inserted = insertedRows || []
      }

      // Update existing rows (batch)
      let updated: any[] = []
      if (rowsToUpdate.length > 0) {
        // Perform updates one by one to respect RLS policies
        for (const row of rowsToUpdate) {
          if (!row.id) {
            console.error('No id found for row', row)
            continue
          }
          console.log('row', row)
          // Exclude immutable/PK columns from update payload
          const {
            id: _omitId,
            created_at: _omitCreated,
            deleted_at: _omitDeleted,
            ...updatePayload
          } = row

          const { data: updatedRows, error: updErr } = await supabase
            .from('scout_screening_patterns')
            .update(updatePayload)
            .eq('id', row.id as string)
            .select('*')

          if (updErr) {
            console.error('Error updating pattern id', row.id, updErr)
            return NextResponse.json(
              { error: 'Failed to update patterns' },
              { status: 500 }
            )
          }
          if (updatedRows && updatedRows.length > 0) {
            updated.push(updatedRows[0])
          } else {
            console.warn('No rows returned when updating pattern id', row.id)
          }
        }
      }

      // Soft delete rows that exist in DB but not in input patterns
      const inputIds = patternsPayload
        .filter((p) => p.id)
        .map((p) => p.id as string)

      const idsToDelete = existingIds.filter((id) => !inputIds.includes(id))

      if (idsToDelete.length > 0) {
        const { error: delErr } = await supabase
          .from('scout_screening_patterns')
          .update({ deleted_at: new Date().toISOString() })
          .in('id', idsToDelete)

        if (delErr) {
          console.error('Error soft deleting patterns:', delErr)
          // Continue without failing the whole operation
        }
      }

      const savedPatterns = [...inserted, ...updated]

      return NextResponse.json(
        {
          scout_screening_id,
          updated_patterns: savedPatterns,
        },
        { status: 200 }
      )
    } catch (error) {
      console.error('Error updating scout screening via API:', error)
      return NextResponse.json(
        { error: 'Internal server error: ' + (error as Error).message },
        { status: 500 }
      )
    }
  }

  // ---------------------------
  // CREATE FLOW (legacy – if no scout_screening_id in body)
  // ---------------------------
  /**
   * validate param (legacy path)
   */
  const _validated = await createScoutScreeningSchema.validate(requestBody, {
    abortEarly: false,
    stripUnknown: true,
  })

  try {
    const supabase = createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user || !user.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('id, company_id')
      .eq('id', user.id)
      .single()

    if (!profile || !profile?.company_id) {
      return NextResponse.json(
        { error: 'Invalid user profile or company association' },
        { status: 400 }
      )
    }

    const scoutScreening: Database['public']['Tables']['scout_screenings']['Insert'] =
      {
        company_id: profile.company_id,
        user_id: user.id,
      }

    const { data: scoutScreeningData, error } = await supabase
      .from('scout_screenings')
      .insert(scoutScreening)
      .select('*')
      .single()

    if (error) {
      console.error('Error in inserting scout_screening:', error)
      return NextResponse.json(
        { error: 'Internal server error' },
        { status: 500 }
      )
    }

    return NextResponse.json(
      { scout_screening_id: scoutScreeningData.id },
      { status: 200 }
    )
  } catch (error) {
    console.error('Error in POST /api/scout-screening (create):', error)
    if (error instanceof Error && 'errors' in error) {
      return NextResponse.json(
        { error: 'Validation failed', details: (error as any).errors },
        { status: 400 }
      )
    }
    return NextResponse.json(
      { error: 'Internal server error: ' + (error as Error).message },
      { status: 500 }
    )
  }
}
