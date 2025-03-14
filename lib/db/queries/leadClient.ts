import { Lead } from '@/lib/types/supabase'
import { createClient } from '@/lib/utils/supabase/client'

export async function getLeadsByWorkflowId({
  workflowId,
}: {
  workflowId: string
}): Promise<Lead[]> {
  const supabase = createClient()
  const { data: leadsData, error: leadsError } = await supabase
    .from('leads')
    .select(
      '*, lead_workflows!inner(*), lead_statuses(*), lead_work_experiences(*), lead_volunteering_experiences(*), lead_educations(*), lead_skills(*), lead_languages(*), lead_certifications(*), lead_projects(*), lead_reactions(*)'
    )
    .eq('lead_workflows.workflow_id', workflowId) // 特定のworkflow_idに合致するものだけを取得
    .order('updated_at', { ascending: false })

  if (leadsError) {
    console.error('Error fetching leads:', leadsError)
    return []
  }

  if (!leadsData || !Array.isArray(leadsData) || !leadsData.length) {
    return []
  }

  const leads = leadsData as Lead[]

  return leads
}

export async function getLeadsByProviderId({
  providerId,
}: {
  providerId: string
}): Promise<Lead[]> {
  const supabase = createClient()
  const { data: leadsData, error: leadsError } = await supabase
    .from('leads')
    .select(
      '*, lead_workflows(*), lead_statuses(*), lead_work_experiences(*), lead_volunteering_experiences(*), lead_educations(*), lead_skills(*), lead_languages(*), lead_certifications(*), lead_projects(*), lead_reactions(*)'
    )
    .eq('provider_id', providerId)
    .order('updated_at', { ascending: false })
  if (leadsError) {
    console.error('Error fetching leads:', leadsError)
    return []
  }

  const leads = leadsData as Lead[]

  if (!leads || !Array.isArray(leads) || !leads.length) {
    return []
  }

  return leads
}
