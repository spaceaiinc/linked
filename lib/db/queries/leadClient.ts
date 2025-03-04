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
  if (leadWorkflowsError) {
    console.error('Error fetching lead workflows:', leadWorkflowsError)
  }
  if (!leadWorkflows) {
    return []
  }
  const { data: leads, error: leadsError } = await supabase
    .from('leads')
    .select('*')
    .in(
      'id',
      leadWorkflows.map((lw: { lead_id: any }) => lw.lead_id)
    )
  if (leadsError) {
    console.error('Error fetching leads:', leadsError)
    return []
  }

  if (!leads || !Array.isArray(leads) || !leads.length) {
    return []
  }

  const leadsFetchingChildPromises = leads.map(async (lead) => {
    // find lead statuses
    const { data: leadStatusData, error: errorOfFindLeadStatus } =
      await supabase.from('lead_statuses').select('*').eq('lead_id', lead.id)

    if (errorOfFindLeadStatus) {
      console.error('Error in find lead status:', errorOfFindLeadStatus)
      return lead
    }

    lead.statuses = leadStatusData

    // work experiences
    const { data: workExperienceData, error: errorOfWorkExperience } =
      await supabase
        .from('lead_work_experiences')
        .select('*')
        .eq('lead_id', lead.id)

    if (errorOfWorkExperience) {
      console.error('Error in find work experience:', errorOfWorkExperience)
    }
    if (workExperienceData) lead.work_experiences = workExperienceData

    // volunteering experiences
    const {
      data: volunteeringExperienceData,
      error: errorOfVolunteeringExperience,
    } = await supabase
      .from('lead_volunteering_experiences')
      .select('*')
      .eq('lead_id', lead.id)

    if (errorOfVolunteeringExperience) {
      console.error(
        'Error in find volunteering experience:',
        errorOfVolunteeringExperience
      )
    }
    if (volunteeringExperienceData)
      lead.volunteering_experiences = volunteeringExperienceData

    // educations
    const { data: educationData, error: errorOfEducation } = await supabase
      .from('lead_educations')
      .select('*')
      .eq('lead_id', lead.id)

    if (errorOfEducation) {
      console.error('Error in find education:', errorOfEducation)
    }
    if (educationData) lead.educations = educationData

    // skills
    const { data: skillData, error: errorOfSkill } = await supabase
      .from('lead_skills')
      .select('*')
      .eq('lead_id', lead.id)

    if (errorOfSkill) {
      console.error('Error in find skill:', errorOfSkill)
    }

    if (skillData) lead.skills = skillData

    // languages
    const { data: languageData, error: errorOfLanguage } = await supabase
      .from('lead_languages')
      .select('*')
      .eq('lead_id', lead.id)

    if (errorOfLanguage) {
      console.error('Error in find language:', errorOfLanguage)
    }

    if (languageData) lead.languages = languageData

    // certifications
    const { data: certificationData, error: errorOfCertification } =
      await supabase
        .from('lead_certifications')
        .select('*')
        .eq('lead_id', lead.id)

    if (errorOfCertification) {
      console.error('Error in find certification:', errorOfCertification)
    }

    if (certificationData) lead.certifications = certificationData

    // projects
    const { data: projectData, error: errorOfProject } = await supabase
      .from('lead_projects')
      .select('*')
      .eq('lead_id', lead.id)

    if (errorOfProject) {
      console.error('Error in find project:', errorOfProject)
    }

    if (projectData) lead.projects = projectData
    return lead
  })

  const leadsWithChild = await Promise.all(leadsFetchingChildPromises)
  leadsWithChild.filter((lead) => lead !== null && lead !== undefined)
  if (
    !leadsWithChild ||
    !Array.isArray(leadsWithChild) ||
    !leadsWithChild.length
  ) {
    return []
  }

  return leadsWithChild
}

export async function getLeadsByProviderId({
  providerId,
}: {
  providerId: string
}): Promise<Lead[]> {
  const supabase = createClient()
  // const { data: leadWorkflows, error: leadWorkflowsError } = await supabase
  //   .from('lead_workflows')
  //   .select('lead_id')
  //   .eq('workflow_id', workflowId)
  // if (leadWorkflowsError) {
  //   console.error('Error fetching lead workflows:', leadWorkflowsError)
  // }
  // if (!leadWorkflows) {
  //   return []
  // }
  const { data: leads, error: leadsError } = await supabase
    .from('leads')
    .select('*')
    .eq('provider_id', providerId)
  if (leadsError) {
    console.error('Error fetching leads:', leadsError)
    return []
  }

  if (!leads || !Array.isArray(leads) || !leads.length) {
    return []
  }

  const leadsFetchingChildPromises = leads.map(async (lead) => {
    // find lead statuses
    const { data: leadStatusData, error: errorOfFindLeadStatus } =
      await supabase.from('lead_statuses').select('*').eq('lead_id', lead.id)

    if (errorOfFindLeadStatus) {
      console.error('Error in find lead status:', errorOfFindLeadStatus)
      return lead
    }

    lead.statuses = leadStatusData

    // work experiences
    const { data: workExperienceData, error: errorOfWorkExperience } =
      await supabase
        .from('lead_work_experiences')
        .select('*')
        .eq('lead_id', lead.id)

    if (errorOfWorkExperience) {
      console.error('Error in find work experience:', errorOfWorkExperience)
    }
    if (workExperienceData) lead.work_experiences = workExperienceData

    // volunteering experiences
    const {
      data: volunteeringExperienceData,
      error: errorOfVolunteeringExperience,
    } = await supabase
      .from('lead_volunteering_experiences')
      .select('*')
      .eq('lead_id', lead.id)

    if (errorOfVolunteeringExperience) {
      console.error(
        'Error in find volunteering experience:',
        errorOfVolunteeringExperience
      )
    }
    if (volunteeringExperienceData)
      lead.volunteering_experiences = volunteeringExperienceData

    // educations
    const { data: educationData, error: errorOfEducation } = await supabase
      .from('lead_educations')
      .select('*')
      .eq('lead_id', lead.id)

    if (errorOfEducation) {
      console.error('Error in find education:', errorOfEducation)
    }
    if (educationData) lead.educations = educationData

    // skills
    const { data: skillData, error: errorOfSkill } = await supabase
      .from('lead_skills')
      .select('*')
      .eq('lead_id', lead.id)

    if (errorOfSkill) {
      console.error('Error in find skill:', errorOfSkill)
    }

    if (skillData) lead.skills = skillData

    // languages
    const { data: languageData, error: errorOfLanguage } = await supabase
      .from('lead_languages')
      .select('*')
      .eq('lead_id', lead.id)

    if (errorOfLanguage) {
      console.error('Error in find language:', errorOfLanguage)
    }

    if (languageData) lead.languages = languageData

    // certifications
    const { data: certificationData, error: errorOfCertification } =
      await supabase
        .from('lead_certifications')
        .select('*')
        .eq('lead_id', lead.id)

    if (errorOfCertification) {
      console.error('Error in find certification:', errorOfCertification)
    }

    if (certificationData) lead.certifications = certificationData

    // projects
    const { data: projectData, error: errorOfProject } = await supabase
      .from('lead_projects')
      .select('*')
      .eq('lead_id', lead.id)

    if (errorOfProject) {
      console.error('Error in find project:', errorOfProject)
    }

    if (projectData) lead.projects = projectData
    return lead
  })

  const leadsWithChild = await Promise.all(leadsFetchingChildPromises)
  leadsWithChild.filter((lead) => lead !== null && lead !== undefined)
  if (
    !leadsWithChild ||
    !Array.isArray(leadsWithChild) ||
    !leadsWithChild.length
  ) {
    return []
  }

  return leadsWithChild
}
