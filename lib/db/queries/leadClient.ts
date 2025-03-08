import { Lead } from '@/lib/types/supabase'
import { createClient } from '@/lib/utils/supabase/client'

export async function getLeadsByWorkflowId({
  workflowId,
}: {
  workflowId: string
}): Promise<Lead[]> {
  const supabase = createClient()
  const { data: leadWorkflows, error: leadWorkflowsError } = await supabase
    .from('lead_workflows')
    .select('lead_id')
    .eq('workflow_id', workflowId)
    .order('updated_at', { ascending: false })
  if (leadWorkflowsError) {
    console.error('Error fetching lead workflows:', leadWorkflowsError)
  }
  if (!leadWorkflows) {
    return []
  }
  const { data: leadsData, error: leadsError } = await supabase
    .from('leads')
    .select(
      '*, lead_workflows(*), lead_statuses(*), lead_work_experiences(*), lead_volunteering_experiences(*), lead_educations(*), lead_skills(*), lead_languages(*), lead_certifications(*), lead_projects(*)'
    )
    .in(
      'id',
      leadWorkflows.map((lw: { lead_id: any }) => lw.lead_id)
    )
  if (leadsError) {
    console.error('Error fetching leads:', leadsError)
    return []
  }

  if (!leadsData || !Array.isArray(leadsData) || !leadsData.length) {
    return []
  }

  const leads = leadsData as Lead[]

  // const leadsFetchingChildPromises = leads.map(async (leadData) => {
  //   const lead = leadData as Lead
  //   // find lead statuses
  //   const { data: leadStatusData, error: errorOfFindLeadStatus } =
  //     await supabase.from('lead_statuses').select('*').eq('lead_id', lead.id)

  //   if (errorOfFindLeadStatus) {
  //     console.error('Error in find lead status:', errorOfFindLeadStatus)
  //     return lead
  //   }

  //   lead.lead_statuses = leadStatusData

  //   // work experiences
  //   const { data: workExperienceData, error: errorOfWorkExperience } =
  //     await supabase
  //       .from('lead_work_experiences')
  //       .select('*')
  //       .eq('lead_id', lead.id)

  //   if (errorOfWorkExperience) {
  //     console.error('Error in find work experience:', errorOfWorkExperience)
  //   }
  //   if (workExperienceData) lead.lead_work_experiences = workExperienceData

  //   // volunteering experiences
  //   const {
  //     data: volunteeringExperienceData,
  //     error: errorOfVolunteeringExperience,
  //   } = await supabase
  //     .from('lead_volunteering_experiences')
  //     .select('*')
  //     .eq('lead_id', lead.id)

  //   if (errorOfVolunteeringExperience) {
  //     console.error(
  //       'Error in find volunteering experience:',
  //       errorOfVolunteeringExperience
  //     )
  //   }
  //   if (volunteeringExperienceData)
  //     lead.lead_volunteering_experiences = volunteeringExperienceData

  //   // educations
  //   const { data: educationData, error: errorOfEducation } = await supabase
  //     .from('lead_educations')
  //     .select('*')
  //     .eq('lead_id', lead.id)

  //   if (errorOfEducation) {
  //     console.error('Error in find education:', errorOfEducation)
  //   }
  //   if (educationData) lead.lead_educations = educationData

  //   // skills
  //   const { data: skillData, error: errorOfSkill } = await supabase
  //     .from('lead_skills')
  //     .select('*')
  //     .eq('lead_id', lead.id)

  //   if (errorOfSkill) {
  //     console.error('Error in find skill:', errorOfSkill)
  //   }

  //   if (skillData) lead.lead_skills = skillData

  //   // languages
  //   const { data: languageData, error: errorOfLanguage } = await supabase
  //     .from('lead_languages')
  //     .select('*')
  //     .eq('lead_id', lead.id)

  //   if (errorOfLanguage) {
  //     console.error('Error in find language:', errorOfLanguage)
  //   }

  //   if (languageData) lead.lead_languages = languageData

  //   // certifications
  //   const { data: certificationData, error: errorOfCertification } =
  //     await supabase
  //       .from('lead_certifications')
  //       .select('*')
  //       .eq('lead_id', lead.id)

  //   if (errorOfCertification) {
  //     console.error('Error in find certification:', errorOfCertification)
  //   }

  //   if (certificationData) lead.lead_certifications = certificationData

  //   // projects
  //   const { data: projectData, error: errorOfProject } = await supabase
  //     .from('lead_projects')
  //     .select('*')
  //     .eq('lead_id', lead.id)

  //   if (errorOfProject) {
  //     console.error('Error in find project:', errorOfProject)
  //   }

  //   if (projectData) lead.lead_projects = projectData
  //   return lead
  // })

  // const leadsWithChild = await Promise.all(leadsFetchingChildPromises)
  // leadsWithChild.filter((lead) => lead !== null && lead !== undefined)
  // if (
  //   !leadsWithChild ||
  //   !Array.isArray(leadsWithChild) ||
  //   !leadsWithChild.length
  // ) {
  //   return []
  // }

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
      '*, lead_workflows(*), lead_statuses(*), lead_work_experiences(*), lead_volunteering_experiences(*), lead_educations(*), lead_skills(*), lead_languages(*), lead_certifications(*), lead_projects(*)'
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

  // const leadsFetchingChildPromises = leads.map(async (lead) => {
  //   // find lead statuses
  //   const { data: leadStatusData, error: errorOfFindLeadStatus } =
  //     await supabase.from('lead_statuses').select('*').eq('lead_id', lead.id)

  //   if (errorOfFindLeadStatus) {
  //     console.error('Error in find lead status:', errorOfFindLeadStatus)
  //     return lead
  //   }
  //   console.log('Lead status data:', leadStatusData)

  //   lead.status =
  //     leadStatusData && leadStatusData.length ? leadStatusData[0] : null
  //   lead.lead_statuses = leadStatusData

  //   // work experiences
  //   const { data: workExperienceData, error: errorOfWorkExperience } =
  //     await supabase
  //       .from('lead_work_experiences')
  //       .select('*')
  //       .eq('lead_id', lead.id)

  //   if (errorOfWorkExperience) {
  //     console.error('Error in find work experience:', errorOfWorkExperience)
  //   }
  //   console.log('Work experience data:', workExperienceData)
  //   if (workExperienceData?.length)
  //     lead.lead_work_experiences = workExperienceData

  //   // volunteering experiences
  //   const {
  //     data: volunteeringExperienceData,
  //     error: errorOfVolunteeringExperience,
  //   } = await supabase
  //     .from('lead_volunteering_experiences')
  //     .select('*')
  //     .eq('lead_id', lead.id)

  //   if (errorOfVolunteeringExperience) {
  //     console.error(
  //       'Error in find volunteering experience:',
  //       errorOfVolunteeringExperience
  //     )
  //   }
  //   if (volunteeringExperienceData)
  //     lead.lead_volunteering_experiences = volunteeringExperienceData

  //   // educations
  //   const { data: educationData, error: errorOfEducation } = await supabase
  //     .from('lead_educations')
  //     .select('*')
  //     .eq('lead_id', lead.id)

  //   if (errorOfEducation) {
  //     console.error('Error in find education:', errorOfEducation)
  //   }
  //   if (educationData) lead.lead_educations = educationData

  //   // skills
  //   const { data: skillData, error: errorOfSkill } = await supabase
  //     .from('lead_skills')
  //     .select('*')
  //     .eq('lead_id', lead.id)

  //   if (errorOfSkill) {
  //     console.error('Error in find skill:', errorOfSkill)
  //   }

  //   if (skillData) lead.lead_skills = skillData

  //   // languages
  //   const { data: languageData, error: errorOfLanguage } = await supabase
  //     .from('lead_languages')
  //     .select('*')
  //     .eq('lead_id', lead.id)

  //   if (errorOfLanguage) {
  //     console.error('Error in find language:', errorOfLanguage)
  //   }

  //   if (languageData) lead.lead_languages = languageData

  //   // certifications
  //   const { data: certificationData, error: errorOfCertification } =
  //     await supabase
  //       .from('lead_certifications')
  //       .select('*')
  //       .eq('lead_id', lead.id)

  //   if (errorOfCertification) {
  //     console.error('Error in find certification:', errorOfCertification)
  //   }

  //   if (certificationData) lead.lead_certifications = certificationData

  //   // projects
  //   const { data: projectData, error: errorOfProject } = await supabase
  //     .from('lead_projects')
  //     .select('*')
  //     .eq('lead_id', lead.id)

  //   if (errorOfProject) {
  //     console.error('Error in find project:', errorOfProject)
  //   }

  //   if (projectData) lead.lead_projects = projectData
  //   return lead
  // })

  // const leadsWithChild = await Promise.all(leadsFetchingChildPromises)
  // console.log('Leads with child:', leadsWithChild)
  // leadsWithChild.filter((lead) => lead !== null && lead !== undefined)
  // if (
  //   !leadsWithChild ||
  //   !Array.isArray(leadsWithChild) ||
  //   !leadsWithChild.length
  // ) {
  //   return []
  // }

  return leads
}
