import { UserProfileApiResponse } from 'unipile-node-sdk/dist/types/users/user-profile.types'
import { LeadStatus, NetworkDistance, WorkflowType } from '../../types/master'
import { LeadInsert, PublicSchemaTables } from '../../types/supabase'
import { createClient } from '../../utils/supabase/server'

export type searchProfileBodyType = {
  api: string
  category: string
  url?: string
  keywords?: string
  company?: string[]
  network_distance?: number[]
}

export async function upsertLead({
  leadId,
  leadStatus,
  lead,
  companyId,
  providerId,
  workflowId,
  type,
  scheduled_hours,
  scheduled_days,
  scheduled_months,
  scheduled_weekdays,
}: {
  leadId: string
  leadStatus: LeadStatus
  lead: LeadInsert
  companyId: string
  providerId: string
  workflowId: string
  type: WorkflowType
  scheduled_hours: number[]
  scheduled_days: number[]
  scheduled_months: number[]
  scheduled_weekdays: number[]
}): Promise<LeadInsert | null> {
  const supabase = createClient()
  lead.id = leadId
  const { data: responseOfInsertLead, error: errorOfInsertLead } =
    await supabase
      .from('leads')
      .upsert(lead, { onConflict: 'id' })
      .select(
        '*, lead_workflows(*), lead_statuses(*), lead_workexperiences(*), lead_volunteering_experiences(*), lead_educations(*), lead_skills(*), lead_languages(*), lead_certifications(*), lead_projects(*)'
      )
      .single()
  if (errorOfInsertLead) {
    console.error('Error in insert lead:', errorOfInsertLead)
    return lead
  }

  // update lead workflows
  lead.workflows = [
    {
      workflow_id: workflowId,
      lead_id: responseOfInsertLead?.id,
      company_id: companyId,
    },
  ]

  const { error: errorOfInsertLeadWorkflow } = await supabase
    .from('lead_workflows')
    .upsert(lead.workflows, { onConflict: 'workflow_id, lead_id' })
  if (errorOfInsertLeadWorkflow) {
    console.error('Error in insert lead workflow:', errorOfInsertLeadWorkflow)
    return lead
  }

  // update lead status
  const { data: responseOfFindLeadStatus, error: errorOfFindLeadStatus } =
    await supabase
      .from('lead_statuses')
      .select('*')
      .eq('lead_id', responseOfInsertLead.id)
      .order('created_at', { ascending: false })
      .limit(1)
      .single()
  if (errorOfFindLeadStatus) {
    console.error('Error in find lead status:', errorOfFindLeadStatus)
    return lead
  }
  if (
    responseOfFindLeadStatus.status < leadStatus &&
    responseOfFindLeadStatus.status == LeadStatus.IN_QUEUE
  ) {
    lead.statuses = [
      {
        status: leadStatus,
        lead_id: responseOfInsertLead?.id,
        company_id: companyId,
      },
    ]
    const { error: errorOfInsertLeadStatus } = await supabase
      .from('lead_statuses')
      .insert(lead.statuses)
    if (errorOfInsertLeadStatus) {
      console.error('Error in insert lead status:', errorOfInsertLeadStatus)
      return lead
    }
  }

  // update work experience
  // Initialize with empty array if work_experience is undefined
  if (!responseOfInsertLead.work_experiences.length) {
    const workExperiencePromises = lead?.work_experiences?.map(
      async (workExperience) => {
        if (!workExperience || !responseOfInsertLead?.id) {
          return
        }
        try {
          const { error: errorOfInsertWorkExperience } = await supabase
            .from('lead_work_experiences')
            .insert(workExperience)

          if (errorOfInsertWorkExperience) {
            console.error(
              'Error in insert work experience:',
              errorOfInsertWorkExperience
            )
            return
          }
          return workExperience
        } catch (error) {
          console.error('Error processing work experience:', error)
          return
        }
      }
    )
    try {
      // Only await if there are promises to wait for
      if (
        workExperiencePromises !== undefined &&
        workExperiencePromises.length > 0
      ) {
        await Promise.all(workExperiencePromises)
      }
    } catch (error) {
      console.error('Error in work experience promises:', error)
    }
  }

  // update volunteer experience
  if (!responseOfInsertLead.volunteering_experiences.length) {
    const volunteerExperiencePromises = lead?.volunteering_experiences?.map(
      async (volunteerExperience) => {
        console.log('volunteerExperience:', volunteerExperience)
        if (!volunteerExperience || !responseOfInsertLead?.id) {
          return
        }

        try {
          const { error: errorOfInsertVolunteerExperience } = await supabase
            .from('lead_volunteering_experiences')
            .insert(volunteerExperience)

          if (errorOfInsertVolunteerExperience) {
            console.error(
              'Error in insert volunteer experience:',
              errorOfInsertVolunteerExperience
            )
            return
          }

          return volunteerExperience
        } catch (error) {
          console.error('Error processing volunteer experience:', error)
          return
        }
      }
    )

    try {
      // Only await if there are promises to wait for
      if (
        volunteerExperiencePromises !== undefined &&
        volunteerExperiencePromises.length > 0
      ) {
        await Promise.all(volunteerExperiencePromises)
      }
    } catch (error) {
      console.error('Error in volunteer experience promises:', error)
    }
  }

  // update educations
  if (!responseOfInsertLead.educations.length) {
    const educationPromises = lead?.educations?.map(async (education) => {
      if (!education || !responseOfInsertLead?.id) {
        return
      }

      try {
        const { error: errorOfInsertEducation } = await supabase
          .from('lead_educations')
          .insert(education)

        if (errorOfInsertEducation) {
          console.error('Error in insert education:', errorOfInsertEducation)
          return
        }

        return education
      } catch (error) {
        console.error('Error processing education:', error)
        return
      }
    })

    try {
      // Only await if there are promises to wait for
      if (educationPromises !== undefined && educationPromises.length > 0) {
        await Promise.all(educationPromises)
      }
    } catch (error) {
      console.error('Error in education promises:', error)
    }
  }

  // update skills
  if (!responseOfInsertLead.skills.length) {
    const skillsPromises = lead?.skills?.map(async (skill) => {
      if (!skill.name || !responseOfInsertLead?.id) {
        return
      }

      try {
        const { error: errorOfInsertSkill } = await supabase
          .from('lead_skills')
          .insert(skill)

        if (errorOfInsertSkill) {
          console.error('Error in insert skill:', errorOfInsertSkill)
          return
        }

        return skill
      } catch (error) {
        console.error('Error processing skill:', error)
        return
      }
    })

    try {
      // Only await if there are promises to wait for
      if (skillsPromises !== undefined && skillsPromises.length > 0) {
        await Promise.all(skillsPromises)
      }
    } catch (error) {
      console.error('Error in skills promises:', error)
    }
  }

  // update languages
  if (!responseOfInsertLead.languages.length) {
    const languagesPromises = lead?.languages?.map(async (language) => {
      if (!language || !responseOfInsertLead?.id) {
        return
      }

      try {
        const { error: errorOfInsertLanguage } = await supabase
          .from('lead_languages')
          .insert(language)

        if (errorOfInsertLanguage) {
          console.error('Error in insert language:', errorOfInsertLanguage)
          return
        }

        return language
      } catch (error) {
        console.error('Error processing language:', error)
        return
      }
    })

    try {
      // Only await if there are promises to wait for
      if (languagesPromises !== undefined && languagesPromises.length > 0) {
        await Promise.all(languagesPromises)
      }
    } catch (error) {
      console.error('Error in languages promises:', error)
    }
  }

  // update certifications
  if (!responseOfInsertLead.certifications.length) {
    const certificationsPromises = lead?.certifications?.map(
      async (certification) => {
        if (!certification || !responseOfInsertLead?.id) {
          return
        }

        try {
          const { error: errorOfInsertCertification } = await supabase
            .from('lead_certifications')
            .insert(certification)

          if (errorOfInsertCertification) {
            console.error(
              'Error in insert certification:',
              errorOfInsertCertification
            )
            return
          }

          return certification
        } catch (error) {
          console.error('Error processing certification:', error)
          return
        }
      }
    )

    try {
      // Only await if there are promises to wait for
      if (
        certificationsPromises !== undefined &&
        certificationsPromises.length > 0
      ) {
        await Promise.all(certificationsPromises)
      }
    } catch (error) {
      console.error('Error in certifications promises:', error)
    }
  }

  // update projects
  if (!responseOfInsertLead.projects.length) {
    const projectsPromises = lead?.projects?.map(async (project) => {
      if (!project || !responseOfInsertLead?.id) {
        return
      }

      try {
        const { error: errorOfInsertProject } = await supabase
          .from('lead_projects')
          .insert(project)

        if (errorOfInsertProject) {
          console.error('Error in insert project:', errorOfInsertProject)
          return
        }

        return project
      } catch (error) {
        console.error('Error processing project:', error)
        return
      }
    })

    try {
      // Only await if there are promises to wait for
      if (projectsPromises !== undefined && projectsPromises.length > 0) {
        await Promise.all(projectsPromises)
      }
    } catch (error) {
      console.error('Error in projects promises:', error)
    }
  }

  return lead
}

export async function upsertLeadByUnipileProfileDetail({
  leadId,
  leadStatus,
  unipileProfile,
  companyId,
  providerId,
  workflowId,
  type,
  scheduled_hours,
  scheduled_days,
  scheduled_months,
  scheduled_weekdays,
}: {
  leadId: string
  leadStatus: LeadStatus
  unipileProfile: UserProfileApiResponse
  companyId: string
  providerId: string
  workflowId: string
  type: WorkflowType
  scheduled_hours: number[]
  scheduled_days: number[]
  scheduled_months: number[]
  scheduled_weekdays: number[]
}): Promise<LeadInsert | null> {
  const supabase = createClient()

  if (
    unipileProfile &&
    typeof unipileProfile === 'object' &&
    'provider_id' in unipileProfile &&
    'public_identifier' in unipileProfile &&
    'first_name' in unipileProfile &&
    'last_name' in unipileProfile &&
    'headline' in unipileProfile &&
    'location' in unipileProfile &&
    'network_distance' in unipileProfile &&
    unipileProfile.provider_id
  ) {
    const lead: LeadInsert = {
      id: leadId,
      company_id: companyId,
      provider_id: providerId,
      private_identifier: unipileProfile.provider_id,
      public_identifier: unipileProfile.public_identifier || '',
      full_name: unipileProfile.first_name + ' ' + unipileProfile.last_name,
      first_name: unipileProfile.first_name || '',
      last_name: unipileProfile.last_name || '',
      profile_picture_url: '',
      headline: unipileProfile.headline || '',
      location: unipileProfile.location || '',
      network_distance: unipileProfile.network_distance
        ? NetworkDistance[unipileProfile.network_distance]
        : NetworkDistance.OUT_OF_NETWORK,
    }

    if ('profile_picture_url' in unipileProfile)
      lead.profile_picture_url = unipileProfile.profile_picture_url
    if ('summary' in unipileProfile) lead.summary = unipileProfile.summary
    if ('follower_count' in unipileProfile)
      lead.follower_count = unipileProfile.follower_count
    if ('contact_info' in unipileProfile)
      lead.emails = unipileProfile.contact_info?.emails
    lead.phones = unipileProfile.contact_info?.phones
    lead.addresses = unipileProfile.contact_info?.adresses
    if ('can_send_inmail' in unipileProfile)
      lead.can_send_inmail = unipileProfile.can_send_inmail
    if ('is_hiring' in unipileProfile) lead.is_hiring = unipileProfile.is_hiring
    if ('is_open_to_work' in unipileProfile)
      lead.is_open_to_work = unipileProfile.is_open_to_work
    if ('connections_count' in unipileProfile)
      lead.connections_count = unipileProfile.connections_count
    if ('shared_connections_count' in unipileProfile)
      lead.shared_connections_count = unipileProfile.shared_connections_count

    const { data: responseOfInsertLead, error: errorOfInsertLead } =
      await supabase
        .from('leads')
        .upsert(lead, { onConflict: 'id' })
        .select('id')
        .single()
    if (errorOfInsertLead) {
      console.error('Error in insert lead:', errorOfInsertLead)
      return lead
    }

    // update lead workflows
    lead.workflows = [
      {
        workflow_id: workflowId,
        lead_id: responseOfInsertLead?.id,
        company_id: companyId,
      },
    ]

    const { error: errorOfInsertLeadWorkflow } = await supabase
      .from('lead_workflows')
      .upsert(lead.workflows, { onConflict: 'workflow_id, lead_id' })
    if (errorOfInsertLeadWorkflow) {
      console.error('Error in insert lead workflow:', errorOfInsertLeadWorkflow)
      return lead
    }

    const { data: responseOfFindLeadStatus, error: errorOfFindLeadStatus } =
      await supabase
        .from('lead_statuses')
        .select('*')
        .eq('lead_id', responseOfInsertLead.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .single()
    if (errorOfFindLeadStatus) {
      console.error('Error in find lead status:', errorOfFindLeadStatus)
      return lead
    }
    if (
      responseOfFindLeadStatus.status < leadStatus &&
      responseOfFindLeadStatus.status == LeadStatus.IN_QUEUE
    ) {
      lead.statuses = [
        {
          status: leadStatus,
          lead_id: responseOfInsertLead?.id,
          company_id: companyId,
        },
      ]
      const { error: errorOfInsertLeadStatus } = await supabase
        .from('lead_statuses')
        .insert(lead.statuses)
      if (errorOfInsertLeadStatus) {
        console.error('Error in insert lead status:', errorOfInsertLeadStatus)
        return lead
      }
    }

    // TODO: delete or non update
    // update work experience
    if (
      'work_experience' in unipileProfile &&
      unipileProfile.work_experience &&
      unipileProfile.work_experience.length > 0 &&
      unipileProfile.work_experience !== undefined
    ) {
      // Initialize with empty array if work_experience is undefined
      const workExperiencePromises = unipileProfile.work_experience.map(
        async (workExperience) => {
          if (!workExperience || !responseOfInsertLead?.id) {
            return
          }

          // 11/1/2024
          const startDate: Date | undefined = workExperience.start
            ? new Date(workExperience.start)
            : undefined
          const endDate: Date | undefined = workExperience.end
            ? new Date(workExperience.end)
            : undefined
          let skills: string[] = []
          if ('skills' in workExperience) {
            skills = workExperience.skills as string[]
          }
          const workExperienceData: PublicSchemaTables['lead_work_experiences']['Insert'] =
            {
              lead_id: responseOfInsertLead.id,
              company_id: companyId,
              status: workExperience.status,
              position: workExperience.position,
              company: workExperience.company,
              location: workExperience.location || '',
              skills: skills,
              current: workExperience.current,
              start_date: startDate,
              end_date: endDate,
              description: workExperience.description,
            }
          lead.work_experiences = [
            ...(lead.work_experiences || []),
            workExperienceData,
          ]

          try {
            const { error: errorOfInsertWorkExperience } = await supabase
              .from('lead_work_experiences')
              .insert(workExperienceData)

            if (errorOfInsertWorkExperience) {
              console.error(
                'Error in insert work experience:',
                errorOfInsertWorkExperience
              )
              return
            }

            return workExperienceData
          } catch (error) {
            console.error('Error processing work experience:', error)
            return
          }
        }
      )

      try {
        // Only await if there are promises to wait for
        if (
          workExperiencePromises !== undefined &&
          workExperiencePromises.length > 0
        ) {
          await Promise.all(workExperiencePromises)
        }
      } catch (error) {
        console.error('Error in work experience promises:', error)
      }
    }

    // update volunteer experience
    if (
      'volunteering_experience' in unipileProfile &&
      unipileProfile.volunteering_experience &&
      unipileProfile.volunteering_experience.length > 0 &&
      unipileProfile.volunteering_experience !== undefined
    ) {
      // Initialize with empty array if volunteering_experience is undefined
      const volunteerExperiencePromises =
        unipileProfile.volunteering_experience.map(
          async (volunteerExperience) => {
            console.log('volunteerExperience:', volunteerExperience)
            if (!volunteerExperience || !responseOfInsertLead?.id) {
              return
            }

            // 11/1/2024
            const startDate: Date | undefined = volunteerExperience.start
              ? new Date(volunteerExperience.start)
              : undefined
            const endDate: Date | undefined = volunteerExperience.end
              ? new Date(volunteerExperience.end)
              : undefined

            const volunteerExperienceData: PublicSchemaTables['lead_volunteering_experiences']['Insert'] =
              {
                lead_id: responseOfInsertLead.id,
                company_id: companyId,
                company: volunteerExperience.company,
                role: volunteerExperience.role,
                cause: volunteerExperience.cause,
                start_date: startDate,
                end_date: endDate,
                description: volunteerExperience.description,
              }
            lead.volunteering_experiences = [
              ...(lead.volunteering_experiences || []),
              volunteerExperienceData,
            ]

            try {
              const { error: errorOfInsertVolunteerExperience } = await supabase
                .from('lead_volunteering_experiences')
                .insert(volunteerExperienceData)

              if (errorOfInsertVolunteerExperience) {
                console.error(
                  'Error in insert volunteer experience:',
                  errorOfInsertVolunteerExperience
                )
                return
              }

              return volunteerExperienceData
            } catch (error) {
              console.error('Error processing volunteer experience:', error)
              return
            }
          }
        )

      try {
        // Only await if there are promises to wait for
        if (
          volunteerExperiencePromises !== undefined &&
          volunteerExperiencePromises.length > 0
        ) {
          await Promise.all(volunteerExperiencePromises)
        }
      } catch (error) {
        console.error('Error in volunteer experience promises:', error)
      }
    }

    // update educations
    if (
      'education' in unipileProfile &&
      unipileProfile.education &&
      unipileProfile.education.length > 0 &&
      unipileProfile.education !== undefined
    ) {
      // Initialize with empty array if education is undefined
      const educationPromises = unipileProfile.education.map(
        async (education) => {
          if (!education || !responseOfInsertLead?.id) {
            return
          }

          // 11/1/2024
          const startDate: Date | undefined = education.start
            ? new Date(education.start)
            : undefined
          const endDate: Date | undefined = education.end
            ? new Date(education.end)
            : undefined

          const educationData: PublicSchemaTables['lead_educations']['Insert'] =
            {
              lead_id: responseOfInsertLead.id,
              company_id: companyId,
              school: education.school,
              degree: education.degree || '',
              field_of_study: education.field_of_study || '',
              start_date: startDate,
              end_date: endDate,
            }
          lead.educations = [...(lead.educations || []), educationData]

          try {
            const { error: errorOfInsertEducation } = await supabase
              .from('lead_educations')
              .insert(educationData)

            if (errorOfInsertEducation) {
              console.error(
                'Error in insert education:',
                errorOfInsertEducation
              )
              return
            }

            return educationData
          } catch (error) {
            console.error('Error processing education:', error)
            return
          }
        }
      )

      try {
        // Only await if there are promises to wait for
        if (educationPromises !== undefined && educationPromises.length > 0) {
          await Promise.all(educationPromises)
        }
      } catch (error) {
        console.error('Error in education promises:', error)
      }
    }

    // update skills
    if (
      'skills' in unipileProfile &&
      unipileProfile.skills &&
      unipileProfile.skills.length > 0 &&
      unipileProfile.skills !== undefined
    ) {
      // Initialize with empty array if skills is undefined
      const skillsPromises = unipileProfile.skills.map(async (skill) => {
        if (!skill.name || !responseOfInsertLead?.id) {
          return
        }

        const skillData: PublicSchemaTables['lead_skills']['Insert'] = {
          lead_id: responseOfInsertLead.id,
          company_id: companyId,
          name: skill.name || '',
          endorsement_count: skill.endorsement_count || 0,
        }
        lead.skills = [...(lead.skills || []), skillData]

        try {
          const { error: errorOfInsertSkill } = await supabase
            .from('lead_skills')
            .insert(skillData)

          if (errorOfInsertSkill) {
            console.error('Error in insert skill:', errorOfInsertSkill)
            return
          }

          return skillData
        } catch (error) {
          console.error('Error processing skill:', error)
          return
        }
      })

      try {
        // Only await if there are promises to wait for
        if (skillsPromises !== undefined && skillsPromises.length > 0) {
          await Promise.all(skillsPromises)
        }
      } catch (error) {
        console.error('Error in skills promises:', error)
      }
    }

    // update languages
    if (
      'languages' in unipileProfile &&
      unipileProfile.languages &&
      unipileProfile.languages.length > 0 &&
      unipileProfile.languages !== undefined
    ) {
      // Initialize with empty array if languages is undefined
      const languagesPromises = unipileProfile.languages.map(
        async (language) => {
          if (!language || !responseOfInsertLead?.id) {
            return
          }

          const languageData: PublicSchemaTables['lead_languages']['Insert'] = {
            lead_id: responseOfInsertLead.id,
            company_id: companyId,
            name: language.name,
            proficiency: language.proficiency || '',
          }
          lead.languages = [...(lead.languages || []), languageData]

          try {
            const { error: errorOfInsertLanguage } = await supabase
              .from('lead_languages')
              .insert(languageData)

            if (errorOfInsertLanguage) {
              console.error('Error in insert language:', errorOfInsertLanguage)
              return
            }

            return languageData
          } catch (error) {
            console.error('Error processing language:', error)
            return
          }
        }
      )

      try {
        // Only await if there are promises to wait for
        if (languagesPromises !== undefined && languagesPromises.length > 0) {
          await Promise.all(languagesPromises)
        }
      } catch (error) {
        console.error('Error in languages promises:', error)
      }
    }

    // update certifications
    if (
      'certifications' in unipileProfile &&
      unipileProfile.certifications &&
      unipileProfile.certifications.length > 0 &&
      unipileProfile.certifications !== undefined
    ) {
      // Initialize with empty array if certifications is undefined
      const certificationsPromises = unipileProfile.certifications.map(
        async (certification) => {
          if (!certification || !responseOfInsertLead?.id) {
            return
          }

          const certificationData: PublicSchemaTables['lead_certifications']['Insert'] =
            {
              lead_id: responseOfInsertLead.id,
              company_id: companyId,
              name: certification.name,
              organization: certification.organization,
              url: certification.url || '',
            }

          lead.certifications = [
            ...(lead.certifications || []),
            certificationData,
          ]

          try {
            const { error: errorOfInsertCertification } = await supabase
              .from('lead_certifications')
              .insert(certificationData)

            if (errorOfInsertCertification) {
              console.error(
                'Error in insert certification:',
                errorOfInsertCertification
              )
              return
            }

            return certificationData
          } catch (error) {
            console.error('Error processing certification:', error)
            return
          }
        }
      )

      try {
        // Only await if there are promises to wait for
        if (
          certificationsPromises !== undefined &&
          certificationsPromises.length > 0
        ) {
          await Promise.all(certificationsPromises)
        }
      } catch (error) {
        console.error('Error in certifications promises:', error)
      }
    }

    // insert projects
    if (
      'projects' in unipileProfile &&
      unipileProfile.projects &&
      Array.isArray(unipileProfile.projects) &&
      unipileProfile.projects.length > 0
    ) {
      const projects = unipileProfile.projects as {
        name: string
        description: string
        skills: string[]
        start: string
        end: string
      }[]

      try {
        const projectsPromises = projects.map(async (project) => {
          if (!project || !responseOfInsertLead?.id) {
            return
          }

          // 11/1/2024
          const startDate: Date | undefined = project.start
            ? new Date(project.start)
            : undefined
          const endDate: Date | undefined = project.end
            ? new Date(project.end)
            : undefined

          const projectData: PublicSchemaTables['lead_projects']['Insert'] = {
            lead_id: responseOfInsertLead.id,
            company_id: companyId,
            name: project.name,
            description: project.description || '',
            skills: project.skills || [],
            start_date: startDate,
            end_date: endDate,
          }

          lead.projects = [...(lead.projects || []), projectData]

          try {
            const { error: errorOfInsertProject } = await supabase
              .from('lead_projects')
              .insert(projectData)

            if (errorOfInsertProject) {
              console.error('Error in insert project:', errorOfInsertProject)
              return
            }

            return projectData
          } catch (error) {
            console.error('Error processing project:', error)
            return
          }
        })

        try {
          // Only await if there are promises to wait for
          if (projectsPromises !== undefined && projectsPromises.length > 0) {
            await Promise.all(projectsPromises)
          }
        } catch (error) {
          console.error('Error in projects promises:', error)
        }
      } catch (error) {
        console.error('Error in projects:', error)
      }
    }

    return lead
  } else {
    return null
  }
}

// PerformSearchの場合
export type SearchProfile = {
  id: string
  type: string
  industry: string
  name: string
  member_urn: string
  public_identifier: string
  profile_picture_url: string
  profile_picture_url_large: string
  network_distance:
    | 'FIRST_DEGREE'
    | 'SECOND_DEGREE'
    | 'THIRD_DEGREE'
    | 'OUT_OF_NETWORK'
  location: string
  headline: string
  shared_connections_count: number
}

export async function upsertLeadByUnipileProfile({
  unipileProfile,
  leadStatus,
  companyId,
  workflowId,
  providerId,
  type,
  scheduled_hours,
  scheduled_days,
  scheduled_months,
  scheduled_weekdays,
}: {
  unipileProfile: SearchProfile
  leadStatus: LeadStatus
  companyId: string
  workflowId: string
  providerId: string
  type: WorkflowType
  scheduled_hours: number[]
  scheduled_days: number[]
  scheduled_months: number[]
  scheduled_weekdays: number[]
}): Promise<LeadInsert> {
  const lead: LeadInsert = {
    company_id: companyId,
    provider_id: providerId,
    private_identifier: unipileProfile.id,
    public_identifier: unipileProfile.public_identifier || '',
    profile_picture_url: unipileProfile.profile_picture_url || '',
    full_name: unipileProfile.name || '',
    headline: unipileProfile.headline || '',
    location: unipileProfile.location || '',
    network_distance: NetworkDistance[unipileProfile.network_distance],
    first_name: '',
    last_name: '',
  }

  const supabase = createClient()
  const { data: responseOfInsertLead, error: errorOfInsertLead } =
    await supabase.from('leads').insert(lead).select('id').single()
  if (errorOfInsertLead) {
    console.error('Error in insert lead:', errorOfInsertLead)
    return lead
  }
  console.log('responseOfInsertLead.id:', responseOfInsertLead.id)

  // update lead workflows
  lead.workflows = [
    {
      workflow_id: workflowId,
      lead_id: responseOfInsertLead?.id,
      company_id: companyId,
    },
  ]

  const { error: errorOfInsertLeadWorkflow } = await supabase
    .from('lead_workflows')
    .upsert(lead.workflows, { onConflict: 'workflow_id, lead_id' })
  if (errorOfInsertLeadWorkflow) {
    console.error('Error in insert lead workflow:', errorOfInsertLeadWorkflow)
    return lead
  }

  // update lead status
  const { data: responseOfFindLeadStatus, error: errorOfFindLeadStatus } =
    await supabase
      .from('lead_statuses')
      .select('*')
      .eq('lead_id', responseOfInsertLead.id)
      .order('created_at', { ascending: false })
      .limit(1)
      .single()
  if (errorOfFindLeadStatus) {
    console.error('Error in find lead status:', errorOfFindLeadStatus)
    return lead
  }
  if (
    responseOfFindLeadStatus.status < leadStatus &&
    responseOfFindLeadStatus.status == LeadStatus.IN_QUEUE
  ) {
    lead.statuses = [
      {
        status: leadStatus,
        lead_id: responseOfInsertLead?.id,
        company_id: companyId,
      },
    ]
    const { error: errorOfInsertLeadStatus } = await supabase
      .from('lead_statuses')
      .insert(lead.statuses)
    if (errorOfInsertLeadStatus) {
      console.error('Error in insert lead status:', errorOfInsertLeadStatus)
      return lead
    }
  }
  return lead
}

export async function findSupabaseLeadByProviderIdAndPrivateIdentifier({
  providerId,
  privateIdentifier,
}: {
  providerId: string
  privateIdentifier: string
}): Promise<LeadInsert | null> {
  const supabase = createClient()
  const { data: leadData, error } = await supabase
    .from('leads')
    .select('*')
    .eq('provider_id', providerId)
    .eq('private_identifier', privateIdentifier)

  if (error) {
    console.error('Error in find lead:', error)
    return null
  }

  if (!leadData || !Array.isArray(leadData) || !leadData.length) {
    return null
  }
  const lead = leadData[0] as LeadInsert

  // find lead statuses
  const { data: leadStatusData, error: errorOfFindLeadStatus } = await supabase
    .from('lead_statuses')
    .select('*')
    .eq('lead_id', lead.id)

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
}
