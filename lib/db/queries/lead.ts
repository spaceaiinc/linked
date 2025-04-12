import { UserProfileApiResponse } from 'unipile-node-sdk/dist/types/users/user-profile.types'
import { LeadStatus, NetworkDistance } from '../../types/master'
import { Lead, LeadInsert, PublicSchemaTables } from '../../types/supabase'
import { SupabaseClient } from '@supabase/supabase-js'
import { decodeJapaneseOnly } from '@/lib/utils/decode'

// 子テーブルのプロパティを除外するヘルパー関数
function getLeadBaseProps(
  lead: LeadInsert
): PublicSchemaTables['leads']['Insert'] {
  const {
    lead_workflows,
    lead_statuses,
    lead_work_experiences,
    lead_volunteering_experiences,
    lead_educations,
    lead_skills,
    lead_languages,
    lead_certifications,
    lead_projects,
    lead_reactions,
    ...leadBase
  } = lead

  return leadBase
}

/**
 * DBから取得したデータに対して、最新のステータスが特定の値であるレコードをフィルタリングする関数
 * @param supabase SupabaseClientのインスタンス
 * @param workflowId 対象のワークフローID
 * @param targetStatus 対象のステータス（単一または配列）
 * @param limitCount 結果の最大数
 * @returns フィルタリングされたリードデータ
 */
export async function fetchLeadsWithLatestStatusAndWorkflow(
  supabase: SupabaseClient,
  workflowId: string,
  targetStatus: LeadStatus | LeadStatus[],
  limitCount: number
): Promise<any[]> {
  if (!limitCount) {
    return []
  }
  try {
    // 一つのクエリでワークフローIDに関連するリードを取得
    const { data: leadsData, error } = await supabase
      .from('leads')
      .select('*, lead_statuses(*), lead_workflows!inner(*)')
      .eq('lead_workflows.workflow_id', workflowId)

    if (error) {
      console.error('リードデータの取得エラー:', error)
      return []
    }

    if (!leadsData || leadsData.length === 0) {
      return []
    }

    // ステータス配列を準備（単一の値が渡された場合は配列に変換）
    const statusArray = Array.isArray(targetStatus)
      ? targetStatus
      : [targetStatus]

    // 各リードに対して最新のステータスを特定し、対象のステータスでフィルタリング
    const filteredLeads = leadsData
      .map((lead) => {
        // lead_statusesがない場合はスキップ
        if (!lead.lead_statuses) return null

        // ステータス配列を日付で並べ替えて最新のものを取得
        const statuses = Array.isArray(lead.lead_statuses)
          ? [...lead.lead_statuses]
          : [lead.lead_statuses]

        if (statuses.length === 0) return null

        // 作成日時で降順ソート（最新が先頭に）
        const sortedStatuses = statuses.sort((a, b) => {
          return (
            new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
          )
        })

        console.log('sortedStatuses:', sortedStatuses)

        // 最新のステータスだけを保持
        const processedLead = {
          ...lead,
          lead_statuses: sortedStatuses[0],
          _isTargetStatus: statusArray.includes(sortedStatuses[0].status),
        }

        return processedLead
      })
      .filter((lead) => lead && lead._isTargetStatus) // nullと対象外のステータスを除外
      .map((lead) => {
        // 内部フラグを削除
        const { _isTargetStatus, ...cleanLead } = lead
        return cleanLead
      })

    console.log('filteredLeads:', filteredLeads, 'limitCount:', limitCount)
    // limitCountを適用
    return filteredLeads.slice(0, limitCount)
  } catch (error) {
    console.error('処理中にエラーが発生しました:', error)
    return []
  }
}

export async function fetchLeadsWithLatestStatusFilter(
  supabase: SupabaseClient,
  providerId: string,
  publicIdentifiers: string[]
): Promise<any[]> {
  const batchSize = 20
  const allLeadsResults: any[] = []

  // デコードする
  const decodedPublicIdentifiers = publicIdentifiers.map((publicIdentifier) =>
    decodeJapaneseOnly(publicIdentifier)
  )

  // 公開IDをバッチに分割
  const publicBatches: string[][] = []
  for (let i = 0; i < decodedPublicIdentifiers.length; i += batchSize) {
    publicBatches.push(decodedPublicIdentifiers.slice(i, i + batchSize))
  }

  // 各バッチを処理
  for (let i = 0; i < publicBatches.length; i++) {
    const currentBatch = publicBatches[i]

    try {
      // リードデータとそれに関連するすべてのステータスを取得
      const { data: batchLeads, error } = await supabase
        .from('leads')
        .select('*, lead_statuses(*)')
        .eq('provider_id', providerId)
        .in('public_identifier', currentBatch)

      if (error) {
        console.error(`バッチ ${i + 1} のエラー:`, error)
        continue
      }
      allLeadsResults.push(...batchLeads)
    } catch (error) {
      console.error(`バッチ ${i + 1} の例外:`, error)
    }
  }

  return allLeadsResults
}

/**
 * Fetches leads in batches to avoid URI too long errors
 * @param publicIdentifiers Array of public identifiers to query
 * @param privateIdentifiers Array of private identifiers to query
 * @param companyId Company ID to filter leads
 * @param providerId Provider ID to filter leads
 * @param supabase Supabase client instance
 * @returns Array of Lead objects
 */
async function fetchLeadsInBatches(
  supabase: SupabaseClient,
  publicIdentifiers: string[],
  privateIdentifiers: string[],
  companyId: string,
  providerId: string
): Promise<Lead[]> {
  const batchSize: number = 20 // Adjust based on your needs and URL length limits
  const allLeads: Lead[] = []

  // Create batches of identifiers
  const publicBatches: string[][] = []
  const privateBatches: string[][] = []

  // デコードする
  const decodedPublicIdentifiers = publicIdentifiers.map((publicIdentifier) =>
    decodeJapaneseOnly(publicIdentifier)
  )
  for (let i = 0; i < decodedPublicIdentifiers.length; i += batchSize) {
    publicBatches.push(decodedPublicIdentifiers.slice(i, i + batchSize))
  }

  for (let i = 0; i < privateIdentifiers.length; i += batchSize) {
    privateBatches.push(privateIdentifiers.slice(i, i + batchSize))
  }

  // Maximum number of batches from either array
  const maxBatches: number = Math.max(
    publicBatches.length,
    privateBatches.length
  )

  // Process each batch
  for (let i = 0; i < maxBatches; i++) {
    const currentPublicBatch: string[] =
      i < publicBatches.length ? publicBatches[i] : []
    const currentPrivateBatch: string[] =
      i < privateBatches.length ? privateBatches[i] : []

    // Skip if both batches are empty
    if (currentPublicBatch.length === 0 && currentPrivateBatch.length === 0) {
      continue
    }

    try {
      let query = supabase
        .from('leads')
        .select('*')
        .eq('company_id', companyId)
        .eq('provider_id', providerId)

      // Build filter conditions based on available identifiers
      const filters: string[] = []

      if (currentPublicBatch.length > 0) {
        filters.push(`public_identifier.in.(${currentPublicBatch.join(',')})`)
      }

      if (currentPrivateBatch.length > 0) {
        filters.push(`private_identifier.in.(${currentPrivateBatch.join(',')})`)
      }

      // Apply filter using OR
      if (filters.length > 0) {
        query = query.or(filters.join(','))
      }

      const { data: batchLeads, error } = await query

      if (error) {
        console.error(`Error in batch ${i + 1}:`, error)
        continue
      }

      if (batchLeads && batchLeads.length > 0) {
        allLeads.push(...batchLeads)
      }
    } catch (error) {
      console.error(`Exception in batch ${i + 1}:`, error)
    }
  }

  return allLeads
}

export type leadWithStatus = {
  leadId: string
  leadStatus: LeadStatus
  lead: LeadInsert
}

export async function upsertLead({
  supabase,
  leads,
  companyId,
  providerId,
  workflowId,
  scheduled_hours,
  scheduled_days,
  scheduled_months,
  scheduled_weekdays,
}: {
  supabase: SupabaseClient
  leads: leadWithStatus[]
  companyId: string
  providerId: string
  workflowId: string
  scheduled_hours: number[]
  scheduled_days: number[]
  scheduled_months: number[]
  scheduled_weekdays: number[]
}): Promise<Lead[]> {
  let leadPublicIdentifiers: string[] = []
  let leadPrivateIdentifiers: string[] = []

  // private or public が一致するleadが存在するか確認するために、public_identifierとprivate_identifierを取得する
  // 一致する場合は、leadIdを更新して、insertではなくupdateする
  leads.forEach((leadWithStatus) => {
    const { lead } = leadWithStatus
    if (lead.public_identifier) {
      lead.public_identifier = decodeJapaneseOnly(lead.public_identifier)
      leadPublicIdentifiers.push(lead.public_identifier)
    }
    if (lead.private_identifier) {
      leadPrivateIdentifiers.push(lead.private_identifier)
    }
  })

  const leadsInDb = await fetchLeadsInBatches(
    supabase,
    leadPublicIdentifiers,
    leadPrivateIdentifiers,
    companyId,
    providerId
  )

  // private or public が一致するleadが存在する場合、unipileProfilesのleadIdを更新する
  leads.forEach((leadWithStatus) => {
    leadsInDb.forEach((leadInDb) => {
      const { lead } = leadWithStatus
      if (leadInDb.public_identifier === lead.public_identifier) {
        leadWithStatus.leadId = leadInDb.id
      }
      if (leadInDb.private_identifier === lead.private_identifier) {
        leadWithStatus.leadId = leadInDb.id
      }
    })
  })

  const leadPromises = leads.map(async (leadWithStatus) => {
    const { leadId, leadStatus, lead } = leadWithStatus

    const leadInsert: PublicSchemaTables['leads']['Insert'] =
      getLeadBaseProps(lead)
    if (leadId) leadInsert.id = leadId
    if (lead.public_identifier)
      leadInsert.public_identifier = lead.public_identifier
    const { data: upsertLeadData, error: insertLeadsError } = await supabase
      .from('leads')
      .upsert(leadInsert, { onConflict: 'id' })
      .select(
        '*, lead_workflows(*), lead_statuses(*), lead_work_experiences(*), lead_volunteering_experiences(*), lead_educations(*), lead_skills(*), lead_languages(*), lead_certifications(*), lead_projects(*), lead_reactions(*)'
      )
      .single()
    if (insertLeadsError) {
      console.error('Error in insert lead:', insertLeadsError)
      return null
    }
    const upsertLead = upsertLeadData as Lead
    if (!upsertLead || !upsertLead.id) {
      return null
    }

    // update lead workflows
    lead.lead_workflows = [
      {
        workflow_id: workflowId,
        lead_id: upsertLead?.id,
        company_id: companyId,
      },
    ]

    const { error: insertLeadsErrorWorkflow } = await supabase
      .from('lead_workflows')
      .upsert(lead.lead_workflows, { onConflict: 'workflow_id, lead_id' })
    if (insertLeadsErrorWorkflow) {
      console.error('Error in insert lead workflow:', insertLeadsErrorWorkflow)
      return null
    }

    // update lead status
    const { data: latestLeadStatusData, error: selectLatestLeadStatusError } =
      await supabase
        .from('lead_statuses')
        .select('*')
        .eq('lead_id', upsertLead.id)
        .order('created_at', { ascending: false })
        .limit(1)
    if (selectLatestLeadStatusError) {
      console.error('Error in find lead status:', selectLatestLeadStatusError)
      return null
    }
    if (
      !latestLeadStatusData.length ||
      (latestLeadStatusData[0].status < leadStatus &&
        (latestLeadStatusData[0].status == LeadStatus.IN_QUEUE ||
          latestLeadStatusData[0].status == LeadStatus.INVITED_FAILED ||
          latestLeadStatusData[0].status == LeadStatus.SEARCHED))
    ) {
      lead.lead_statuses = [
        {
          status: leadStatus,
          lead_id: upsertLead?.id,
          workflow_id: workflowId,
          company_id: companyId,
        },
      ]
      const { error: insertLeadsErrorStatus } = await supabase
        .from('lead_statuses')
        .insert(lead.lead_statuses)
      if (insertLeadsErrorStatus) {
        console.error('Error in insert lead status:', insertLeadsErrorStatus)
        return null
      }
    }

    // update work experience
    // Initialize with empty array if work_experience is undefined
    if (!upsertLead.lead_work_experiences.length) {
      const workExperiencePromises = lead?.lead_work_experiences?.map(
        async (workExperience) => {
          if (!workExperience || !upsertLead?.id) {
            return
          }
          try {
            const { error: insertWorkExperiencesError } = await supabase
              .from('lead_work_experiences')
              .insert(workExperience)

            if (insertWorkExperiencesError) {
              console.error(
                'Error in insert work experience:',
                insertWorkExperiencesError
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
    if (!upsertLead.lead_volunteering_experiences.length) {
      const volunteerExperiencePromises =
        lead?.lead_volunteering_experiences?.map(
          async (volunteerExperience) => {
            console.log('volunteerExperience:', volunteerExperience)
            if (!volunteerExperience || !upsertLead?.id) {
              return
            }

            try {
              const { error: insertVolunteerExperienceError } = await supabase
                .from('lead_volunteering_experiences')
                .insert(volunteerExperience)

              if (insertVolunteerExperienceError) {
                console.error(
                  'Error in insert volunteer experience:',
                  insertVolunteerExperienceError
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
    if (!upsertLead.lead_educations.length) {
      const educationPromises = lead?.lead_educations?.map(
        async (education) => {
          if (!education || !upsertLead?.id) {
            return
          }

          try {
            const { error: insertEducationError } = await supabase
              .from('lead_educations')
              .insert(education)

            if (insertEducationError) {
              console.error('Error in insert education:', insertEducationError)
              return
            }

            return education
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
    if (!upsertLead.lead_skills.length) {
      const skillsPromises = lead?.lead_skills?.map(async (skill) => {
        if (!skill.name || !upsertLead?.id) {
          return
        }

        try {
          const { error: insertSkillError } = await supabase
            .from('lead_skills')
            .insert(skill)

          if (insertSkillError) {
            console.error('Error in insert skill:', insertSkillError)
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
    if (!upsertLead.lead_languages.length) {
      const languagesPromises = lead?.lead_languages?.map(async (language) => {
        if (!language || !upsertLead?.id) {
          return
        }

        try {
          const { error: insertLanguageError } = await supabase
            .from('lead_languages')
            .insert(language)

          if (insertLanguageError) {
            console.error('Error in insert language:', insertLanguageError)
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
    if (!upsertLead.lead_certifications.length) {
      const certificationsPromises = lead?.lead_certifications?.map(
        async (certification) => {
          if (!certification || !upsertLead?.id) {
            return
          }

          try {
            const { error: insertCertificationError } = await supabase
              .from('lead_certifications')
              .insert(certification)

            if (insertCertificationError) {
              console.error(
                'Error in insert certification:',
                insertCertificationError
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
    if (!upsertLead.lead_projects.length) {
      const projectsPromises = lead?.lead_projects?.map(async (project) => {
        if (!project || !upsertLead?.id) {
          return
        }

        try {
          const { error: insertProjectError } = await supabase
            .from('lead_projects')
            .insert(project)

          if (insertProjectError) {
            console.error('Error in insert project:', insertProjectError)
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

    // update reactions
    const reactionsPromises = lead.lead_reactions?.map(async (reaction) => {
      if (!reaction || !upsertLead?.id) {
        return
      }
      let matchedReaction = false
      upsertLead.lead_reactions.map((reactionInDb) => {
        if (reactionInDb.private_identifier === reaction.private_identifier) {
          matchedReaction = true
          return
        }
      })
      if (matchedReaction) {
        return
      }

      reaction.lead_id = upsertLead.id

      try {
        const { error: insertReactionError } = await supabase
          .from('lead_reactions')
          .insert(reaction)

        if (insertReactionError) {
          console.error('Error in insert reaction:', insertReactionError)
          return
        }

        return reaction
      } catch (error) {
        console.error('Error processing reaction:', error)
        return
      }
    })

    try {
      // Only await if there are promises to wait for
      if (reactionsPromises !== undefined && reactionsPromises.length > 0) {
        await Promise.all(reactionsPromises)
      }
    } catch (error) {
      console.error('Error in reactions promises:', error)
    }

    return upsertLead
  })

  const results = await Promise.all(leadPromises)
  const filteredResults = results.filter(
    (result) => result !== null && result !== undefined
  ) as Lead[]
  return filteredResults
}

export async function updateLeadStatusByTargetWorkflowId({
  supabase,
  targetWorkflowId,
  targetStatus,
  companyId,
  workflowId,
}: {
  supabase: SupabaseClient
  targetWorkflowId: string
  targetStatus: LeadStatus
  companyId: string
  workflowId: string
}): Promise<Lead[]> {
  const { data: leadsData, error: leadsError } = await supabase
    .from('leads')
    .select(
      '*, lead_workflows!inner(*), lead_statuses(*), lead_work_experiences(*), lead_volunteering_experiences(*), lead_educations(*), lead_skills(*), lead_languages(*), lead_certifications(*), lead_projects(*), lead_reactions(*)'
    )
    .eq('lead_workflows.workflow_id', targetWorkflowId)
    .order('updated_at', { ascending: false })

  if (leadsError) {
    console.error('Error fetching leads:', leadsError)
    return []
  }

  if (!leadsData || !Array.isArray(leadsData) || !leadsData.length) {
    return []
  }

  const leads = leadsData as Lead[]

  const leadPromises = leads.map(async (lead) => {
    // update lead workflows
    const leadWorkflows: PublicSchemaTables['lead_workflows']['Insert'] = {
      workflow_id: workflowId,
      lead_id: lead.id,
      company_id: companyId,
    }

    const { error: insertLeadsErrorWorkflow } = await supabase
      .from('lead_workflows')
      .upsert(leadWorkflows, { onConflict: 'workflow_id, lead_id' })
    if (insertLeadsErrorWorkflow) {
      console.error('Error in insert lead workflow:', insertLeadsErrorWorkflow)
      return null
    }

    // update lead status
    const { data: latestLeadStatusData, error: selectLatestLeadStatusError } =
      await supabase
        .from('lead_statuses')
        .select('*')
        .eq('lead_id', lead.id)
        .order('created_at', { ascending: false })
        .limit(1)
    if (selectLatestLeadStatusError) {
      console.error('Error in find lead status:', selectLatestLeadStatusError)
      return null
    }
    if (
      !latestLeadStatusData.length ||
      (latestLeadStatusData[0].status < targetStatus &&
        (latestLeadStatusData[0].status == LeadStatus.IN_QUEUE ||
          latestLeadStatusData[0].status == LeadStatus.INVITED_FAILED ||
          latestLeadStatusData[0].status == LeadStatus.SEARCHED))
    ) {
      const leadStatuses: PublicSchemaTables['lead_statuses']['Insert'] = {
        status: targetStatus,
        lead_id: lead.id,
        workflow_id: workflowId,
        company_id: companyId,
      }

      const { error: insertLeadsErrorStatus } = await supabase
        .from('lead_statuses')
        .insert(leadStatuses)
      if (insertLeadsErrorStatus) {
        console.error('Error in insert lead status:', insertLeadsErrorStatus)
        return null
      }
    }

    return lead
  })

  const results = await Promise.all(leadPromises)
  const filteredResults = results.filter(
    (result) => result !== null && result !== undefined
  ) as Lead[]
  return filteredResults
}

export type unipileProfileWithStatus = {
  leadId: string
  leadStatus: LeadStatus
  unipileProfile: UserProfileApiResponse
}

export async function upsertLeadByUnipileUserProfileApiResponse({
  supabase,
  unipileProfiles,
  companyId,
  providerId,
  workflowId,
  // TODO
  scheduled_hours,
  scheduled_days,
  scheduled_months,
  scheduled_weekdays,
}: {
  supabase: SupabaseClient
  unipileProfiles: unipileProfileWithStatus[]
  companyId: string
  providerId: string
  workflowId: string
  scheduled_hours: number[]
  scheduled_days: number[]
  scheduled_months: number[]
  scheduled_weekdays: number[]
}): Promise<LeadInsert[]> {
  let leadPublicIdentifiers: string[] = []
  let leadPrivateIdentifiers: string[] = []

  // private or public が一致するleadが存在するか確認するために、public_identifierとprivate_identifierを取得する
  // 一致する場合は、leadIdを更新して、insertではなくupdateする
  unipileProfiles.forEach((unipileProfileWithStatus) => {
    const { unipileProfile } = unipileProfileWithStatus
    if (unipileProfile && typeof unipileProfile === 'object') {
      if (
        'public_identifier' in unipileProfile &&
        unipileProfile.public_identifier
      ) {
        unipileProfile.public_identifier = decodeJapaneseOnly(
          unipileProfile.public_identifier
        )
        leadPublicIdentifiers.push(unipileProfile.public_identifier)
      }
      if ('provider_id' in unipileProfile && unipileProfile.provider_id) {
        leadPrivateIdentifiers.push(unipileProfile.provider_id)
      }
    }
  })

  const leadsInDb = await fetchLeadsInBatches(
    supabase,
    leadPublicIdentifiers,
    leadPrivateIdentifiers,
    companyId,
    providerId
  )

  // private or public が一致するleadが存在する場合、unipileProfilesのleadIdを更新する
  unipileProfiles.forEach((unipileProfileWithStatus) => {
    leadsInDb.forEach((leadInDb) => {
      const { unipileProfile } = unipileProfileWithStatus
      if (unipileProfile && typeof unipileProfile === 'object') {
        if (
          'public_identifier' in unipileProfile &&
          unipileProfile.public_identifier &&
          leadInDb.public_identifier === unipileProfile.public_identifier
        ) {
          unipileProfileWithStatus.leadId = leadInDb.id
        }
        if (
          'provider_id' in unipileProfile &&
          unipileProfile.provider_id &&
          leadInDb.private_identifier === unipileProfile.provider_id
        ) {
          unipileProfileWithStatus.leadId = leadInDb.id
        }
      }
    })
  })

  const leadPromises = unipileProfiles.map(async (unipileProfileWithStatus) => {
    const { leadId, leadStatus, unipileProfile } = unipileProfileWithStatus
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
        company_id: companyId,
        provider_id: providerId,
        private_identifier: unipileProfile.provider_id,
      }
      if (leadId) lead.id = leadId
      if ('public_identifier' in unipileProfile)
        lead.public_identifier = unipileProfile.public_identifier
          ? decodeJapaneseOnly(unipileProfile.public_identifier)
          : ''
      if ('first_name' in unipileProfile)
        lead.first_name = unipileProfile.first_name || ''
      if ('last_name' in unipileProfile)
        lead.last_name = unipileProfile.last_name || ''
      if (lead.first_name && lead.last_name) {
        lead.full_name = lead.last_name + ' ' + lead.first_name
      }
      if ('headline' in unipileProfile) lead.headline = unipileProfile.headline
      if ('location' in unipileProfile) lead.location = unipileProfile.location
      if ('network_distance' in unipileProfile)
        lead.network_distance = unipileProfile.network_distance
          ? NetworkDistance[unipileProfile.network_distance]
          : NetworkDistance.OUT_OF_NETWORK
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
      if ('is_hiring' in unipileProfile)
        lead.is_hiring = unipileProfile.is_hiring
      if ('is_open_to_work' in unipileProfile)
        lead.is_open_to_work = unipileProfile.is_open_to_work
      if ('connections_count' in unipileProfile)
        lead.connections_count = unipileProfile.connections_count
      if ('shared_connections_count' in unipileProfile)
        lead.shared_connections_count = unipileProfile.shared_connections_count

      const { data: upsertLeadData, error: insertLeadsError } = await supabase
        .from('leads')
        .upsert(lead, { onConflict: 'id' })
        .select('id')
        .single()
      if (insertLeadsError) {
        console.error('Error in insert lead:', insertLeadsError)
        return lead
      }

      // update lead workflows
      lead.lead_workflows = [
        {
          workflow_id: workflowId,
          lead_id: upsertLeadData?.id,
          company_id: companyId,
        },
      ]

      const { error: insertLeadsErrorWorkflow } = await supabase
        .from('lead_workflows')
        .upsert(lead.lead_workflows, { onConflict: 'workflow_id, lead_id' })
      if (insertLeadsErrorWorkflow) {
        console.error(
          'Error in insert lead workflow:',
          insertLeadsErrorWorkflow
        )
        return lead
      }

      const { data: latestLeadStatusData, error: selectLatestLeadStatusError } =
        await supabase
          .from('lead_statuses')
          .select('*')
          .eq('lead_id', upsertLeadData.id)
          .order('created_at', { ascending: false })
          .limit(1)
      if (selectLatestLeadStatusError) {
        console.error('Error in find lead status:', selectLatestLeadStatusError)
        return lead
      }
      if (
        !latestLeadStatusData.length ||
        (latestLeadStatusData[0].status < leadStatus &&
          (latestLeadStatusData[0].status == LeadStatus.IN_QUEUE ||
            latestLeadStatusData[0].status == LeadStatus.INVITED_FAILED ||
            latestLeadStatusData[0].status == LeadStatus.SEARCHED))
      ) {
        lead.lead_statuses = [
          {
            status: leadStatus,
            lead_id: upsertLeadData?.id,
            workflow_id: workflowId,
            company_id: companyId,
          },
        ]
        const { error: insertLeadsErrorStatus } = await supabase
          .from('lead_statuses')
          .insert(lead.lead_statuses)
        if (insertLeadsErrorStatus) {
          console.error('Error in insert lead status:', insertLeadsErrorStatus)
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
            if (!workExperience || !upsertLeadData?.id) {
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
                lead_id: upsertLeadData.id,
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
            lead.lead_work_experiences = [
              ...(lead.lead_work_experiences || []),
              workExperienceData,
            ]

            try {
              const { error: insertWorkExperiencesError } = await supabase
                .from('lead_work_experiences')
                .upsert(workExperienceData, {
                  onConflict: 'lead_id, company, start_date',
                })

              if (insertWorkExperiencesError) {
                console.error(
                  'Error in insert work experience:',
                  insertWorkExperiencesError
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
              if (!volunteerExperience || !upsertLeadData?.id) {
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
                  lead_id: upsertLeadData.id,
                  company_id: companyId,
                  company: volunteerExperience.company,
                  role: volunteerExperience.role,
                  cause: volunteerExperience.cause,
                  start_date: startDate,
                  end_date: endDate,
                  description: volunteerExperience.description,
                }
              lead.lead_volunteering_experiences = [
                ...(lead.lead_volunteering_experiences || []),
                volunteerExperienceData,
              ]

              try {
                const { error: insertVolunteerExperienceError } = await supabase
                  .from('lead_volunteering_experiences')
                  .upsert(volunteerExperienceData, {
                    onConflict: 'lead_id, company, start_date',
                  })

                if (insertVolunteerExperienceError) {
                  console.error(
                    'Error in insert volunteer experience:',
                    insertVolunteerExperienceError
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
            if (!education || !upsertLeadData?.id) {
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
                lead_id: upsertLeadData.id,
                company_id: companyId,
                school: education.school,
                degree: education.degree || '',
                field_of_study: education.field_of_study || '',
                start_date: startDate,
                end_date: endDate,
              }
            lead.lead_educations = [
              ...(lead.lead_educations || []),
              educationData,
            ]

            try {
              const { error: insertEducationError } = await supabase
                .from('lead_educations')
                .upsert(educationData, {
                  onConflict: 'lead_id, school, start_date',
                })

              if (insertEducationError) {
                console.error(
                  'Error in insert education:',
                  insertEducationError
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
          if (!skill.name || !upsertLeadData?.id) {
            return
          }

          const skillData: PublicSchemaTables['lead_skills']['Insert'] = {
            lead_id: upsertLeadData.id,
            company_id: companyId,
            name: skill.name || '',
            endorsement_count: skill.endorsement_count || 0,
          }
          lead.lead_skills = [...(lead.lead_skills || []), skillData]

          try {
            const { error: insertSkillError } = await supabase
              .from('lead_skills')
              .upsert(skillData, { onConflict: 'lead_id, name' })

            if (insertSkillError) {
              console.error('Error in insert skill:', insertSkillError)
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
            if (!language || !upsertLeadData?.id) {
              return
            }

            const languageData: PublicSchemaTables['lead_languages']['Insert'] =
              {
                lead_id: upsertLeadData.id,
                company_id: companyId,
                name: language.name,
                proficiency: language.proficiency || '',
              }
            lead.lead_languages = [...(lead.lead_languages || []), languageData]

            try {
              const { error: insertLanguageError } = await supabase
                .from('lead_languages')
                .upsert(languageData, { onConflict: 'lead_id, name' })

              if (insertLanguageError) {
                console.error('Error in insert language:', insertLanguageError)
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
            if (!certification || !upsertLeadData?.id) {
              return
            }

            const certificationData: PublicSchemaTables['lead_certifications']['Insert'] =
              {
                lead_id: upsertLeadData.id,
                company_id: companyId,
                name: certification.name,
                organization: certification.organization,
                url: certification.url || '',
              }

            lead.lead_certifications = [
              ...(lead.lead_certifications || []),
              certificationData,
            ]

            try {
              const { error: insertCertificationError } = await supabase
                .from('lead_certifications')
                .upsert(certificationData, { onConflict: 'lead_id, name' })

              if (insertCertificationError) {
                console.error(
                  'Error in insert certification:',
                  insertCertificationError
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
            if (!project || !upsertLeadData?.id) {
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
              lead_id: upsertLeadData.id,
              company_id: companyId,
              name: project.name,
              description: project.description || '',
              skills: project.skills || [],
              start_date: startDate,
              end_date: endDate,
            }

            lead.lead_projects = [...(lead.lead_projects || []), projectData]

            try {
              const { error: insertProjectError } = await supabase
                .from('lead_projects')
                .upsert(projectData, {
                  onConflict: 'lead_id, name, start_date',
                })

              if (insertProjectError) {
                console.error('Error in insert project:', insertProjectError)
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
  })

  try {
    // Only await if there are promises to wait for
    if (leadPromises !== undefined && leadPromises.length > 0) {
      const leads = await Promise.all(leadPromises)
      const leadsFiltered = leads.filter(
        (lead) => lead !== null && lead !== undefined
      ) as LeadInsert[]
      return leadsFiltered
    }
  } catch (error) {
    console.error('Error in lead promises:', error)
    return []
  }

  return []
}

export type searchProfileBodyType = {
  api: string
  category: string
  url?: string
  search_id?: string
  saved_search_id?: string
  recent_search_id?: string
  keywords?: string
  company?: string[]
  network_distance?: number[]
}

export type unipilePeformSearchProfileWithStatus = {
  leadId: string
  leadStatus: LeadStatus
  unipileProfile: unipilePeformSearchProfile
}

// PerformSearchの場合
export type unipilePeformSearchProfile = {
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

export async function upsertLeadByUnipilePerformSearchProfile({
  supabase,
  unipileProfiles,
  companyId,
  workflowId,
  providerId,
  scheduled_hours,
  scheduled_days,
  scheduled_months,
  scheduled_weekdays,
}: {
  supabase: SupabaseClient
  unipileProfiles: unipilePeformSearchProfileWithStatus[]
  companyId: string
  workflowId: string
  providerId: string
  scheduled_hours: number[]
  scheduled_days: number[]
  scheduled_months: number[]
  scheduled_weekdays: number[]
}): Promise<Lead[]> {
  if (
    !supabase ||
    !unipileProfiles ||
    !companyId ||
    !workflowId ||
    !providerId
  ) {
    return []
  }
  let leadPublicIdentifiers: string[] = []
  let leadPrivateIdentifiers: string[] = []

  // private or public が一致するleadが存在するか確認するために、public_identifierとprivate_identifierを取得する
  // 一致する場合は、leadIdを更新して、insertではなくupdateする
  unipileProfiles.forEach((unipileProfilesWithStatus) => {
    const { unipileProfile } = unipileProfilesWithStatus
    if (unipileProfile.public_identifier) {
      unipileProfile.public_identifier = decodeJapaneseOnly(
        unipileProfile.public_identifier
      )
      leadPublicIdentifiers.push(unipileProfile.public_identifier)
    }
    if (unipileProfile.id) {
      leadPrivateIdentifiers.push(unipileProfile.id)
    }
  })

  const leadsInDb = await fetchLeadsInBatches(
    supabase,
    leadPublicIdentifiers,
    leadPrivateIdentifiers,
    companyId,
    providerId
  )

  // private or public が一致するleadが存在する場合、unipileProfilesのleadIdを更新する
  unipileProfiles.forEach((leadWithStatus) => {
    leadsInDb.forEach((leadInDb) => {
      const { unipileProfile } = leadWithStatus
      if (leadInDb.public_identifier === unipileProfile.public_identifier) {
        leadWithStatus.leadId = leadInDb.id
      }
      if (leadInDb.private_identifier === unipileProfile.id) {
        leadWithStatus.leadId = leadInDb.id
      }
    })
  })

  const leadPromises = unipileProfiles.map(async (unipileProfileWithStatus) => {
    const { leadId, leadStatus, unipileProfile } = unipileProfileWithStatus
    const lead: LeadInsert = {
      company_id: companyId,
      provider_id: providerId,
      private_identifier: unipileProfile.id,
      public_identifier: unipileProfile.public_identifier
        ? decodeJapaneseOnly(unipileProfile.public_identifier)
        : '',
      profile_picture_url: unipileProfile.profile_picture_url || '',
      full_name: unipileProfile.name || '',
      headline: unipileProfile.headline || '',
      location: unipileProfile.location || '',
      network_distance: NetworkDistance[unipileProfile.network_distance],
      first_name: '',
      last_name: '',
    }

    if (leadId) lead.id = leadId

    const { data: upsertLeadData, error: insertLeadsError } = await supabase
      .from('leads')
      .upsert(lead, { onConflict: 'id' })
      .select('id')
      .single()
    if (insertLeadsError) {
      console.error('Error in insert lead:', insertLeadsError)
      return null
    }
    console.log('upsertLeadData.id:', upsertLeadData.id)
    const upsertLead: Lead = upsertLeadData as Lead

    // update lead workflows
    lead.lead_workflows = [
      {
        workflow_id: workflowId,
        lead_id: upsertLeadData?.id,
        company_id: companyId,
      },
    ]

    const { error: insertLeadsErrorWorkflow } = await supabase
      .from('lead_workflows')
      .upsert(lead.lead_workflows, { onConflict: 'workflow_id, lead_id' })
    if (insertLeadsErrorWorkflow) {
      console.error('Error in insert lead workflow:', insertLeadsErrorWorkflow)
      return upsertLead
    }

    // update lead status
    const { data: latestLeadStatusData, error: selectLatestLeadStatusError } =
      await supabase
        .from('lead_statuses')
        .select('*')
        .eq('lead_id', upsertLead.id)
        .order('created_at', { ascending: false })
        .limit(1)
    if (selectLatestLeadStatusError) {
      console.error('Error in find lead status:', selectLatestLeadStatusError)
      return upsertLead
    }
    if (
      !latestLeadStatusData.length ||
      (latestLeadStatusData[0].status < leadStatus &&
        (latestLeadStatusData[0].status == LeadStatus.IN_QUEUE ||
          latestLeadStatusData[0].status == LeadStatus.INVITED_FAILED ||
          latestLeadStatusData[0].status == LeadStatus.SEARCHED))
    ) {
      lead.lead_statuses = [
        {
          status: leadStatus,
          lead_id: upsertLead?.id,
          workflow_id: workflowId,
          company_id: companyId,
        },
      ]
      const { error: insertLeadsErrorStatus } = await supabase
        .from('lead_statuses')
        .insert(lead.lead_statuses)
      if (insertLeadsErrorStatus) {
        console.error('Error in insert lead status:', insertLeadsErrorStatus)
        return upsertLead
      }
    }
    return upsertLead
  })

  const results = await Promise.all(leadPromises)
  const filteredResults = results.filter(
    (result) => result !== null && result !== undefined
  ) as Lead[]
  return filteredResults
}
