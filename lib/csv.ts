import Papa from 'papaparse'
import { Lead, LeadInsert, PublicSchemaTables } from './types/supabase'
import { LeadStatus, NetworkDistance, ReactionType } from './types/master'

export type LeadForDisplay = Omit<
  PublicSchemaTables['leads']['Insert'],
  | 'id'
  | 'network_distance'
  | 'created_at'
  | 'updated_at'
  | 'deleted_at'
  | 'lead_statuses'
  | 'lead_workflows'
  | 'lead_reactions'
  | 'keywords'
  | 'thread'
  | 'generated_invitation_message'
  | 'invitation_sent_at'
  | 'invitation_replied_at'
  | 'first_message'
  | 'first_message_days'
  | 'generated_first_message'
  | 'first_message_sent_at'
  | 'first_message_read_at'
  | 'first_message_replied_at'
  | 'second_message'
  | 'second_message_days'
  | 'generated_second_message'
  | 'second_message_sent_at'
  | 'second_message_read_at'
  | 'second_message_replied_at'
  | 'third_message'
  | 'third_message_days'
  | 'generated_third_message'
  | 'third_message_sent_at'
  | 'third_message_read_at'
> & {
  public_profile_url: string
  network_distance: string
  latest_status: LeadStatus
  lead_work_experiences: string
  lead_volunteering_experiences: string
  lead_educations: string
  lead_skills: string
  lead_languages: string
  lead_certifications: string
  lead_projects: string
  like_count: number
  like_post_urls: string
  comment_count: number
  comment_post_urls: string
  empathy_count: number
  empathy_post_urls: string
  interest_count: number
  interest_post_urls: string
  entertainment_count: number
  entertainment_post_urls: string
  praise_count: number
  praise_post_urls: string
  appreciation_count: number
  appreciation_post_urls: string
  created_at?: string
}

export const convertToDisplay = (
  inputData: Lead[] | LeadInsert[]
): LeadForDisplay[] => {
  if (!inputData || inputData.length === 0 || !Array.isArray(inputData)) {
    // console.log('No data to convert')
    return []
  }
  const rows = inputData.map((profile: Lead | LeadInsert): LeadForDisplay => {
    const baseInfo: LeadForDisplay = {
      public_profile_url: profile?.public_identifier
        ? `https://www.linkedin.com/in/${profile?.public_identifier}`
        : '',
      ...profile,
      network_distance: profile?.network_distance
        ? NetworkDistance[profile?.network_distance] || ''
        : '',
      latest_status: LeadStatus.SEARCHED,
      lead_work_experiences: '',
      lead_volunteering_experiences: '',
      lead_educations: '',
      lead_skills: '',
      lead_languages: '',
      lead_certifications: '',
      lead_projects: '',
      like_count: 0,
      like_post_urls: '',
      comment_count: 0,
      comment_post_urls: '',
      empathy_count: 0,
      empathy_post_urls: '',
      entertainment_count: 0,
      entertainment_post_urls: '',
      praise_count: 0,
      praise_post_urls: '',
      appreciation_count: 0,
      appreciation_post_urls: '',
      interest_count: 0,
      interest_post_urls: '',
    }
    if (profile.lead_statuses?.length)
      baseInfo.latest_status = profile.lead_statuses.sort((a, b) => {
        if (!a.created_at || !b.created_at) {
          return 0
        }
        return (
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        )
      })[0].status

    if (profile.lead_work_experiences?.length) {
      const workExperiencesText = profile.lead_work_experiences
        .map((exp) => {
          return `会社: ${exp.company || ''}\n役職: ${
            exp.position || ''
          }\n場所: ${exp.location || ''}\n説明: ${
            exp.description || ''
          }\nスキル: ${(exp.skills || []).join(', ')}\n開始: ${
            exp.start_date || ''
          }\n終了: ${exp.end_date || ''}`
        })
        .join('\n\n')

      baseInfo.lead_work_experiences = workExperiencesText
    }
    if (profile.lead_volunteering_experiences?.length) {
      const volunteerExperiencesText = profile.lead_volunteering_experiences
        .map((exp) => {
          return `会社: ${exp.company || ''}\n詳細: ${
            exp.description || ''
          }\n役職: ${exp.role || ''}\nCause: ${exp.cause || ''}\n開始: ${
            exp.start_date || ''
          }\n終了: ${exp.end_date || ''}`
        })
        .join('\n\n')

      baseInfo.lead_volunteering_experiences = volunteerExperiencesText
    }
    if (profile.lead_educations?.length) {
      const educationsText = profile.lead_educations
        .map((edu) => {
          return `学校: ${edu.school || ''}\n学位: ${
            edu.degree || ''
          }\n専攻: ${edu.field_of_study || ''}\n開始: ${
            edu.start_date || ''
          }\n終了: ${edu.end_date || ''}`
        })
        .join('\n\n')
      baseInfo.lead_educations = educationsText
    }
    if (profile.lead_skills) {
      const skillsText = profile.lead_skills
        .map((skill) => {
          return `${skill.name || ''}`
        })
        .join(', ')
      baseInfo.lead_skills = skillsText
    }
    if (profile.lead_languages) {
      const languagesText = profile.lead_languages
        .map((lang) => {
          return `言語: ${lang.name || ''}\nレベル: ${lang.proficiency || ''}`
        })
        .join('\n\n')
      baseInfo.lead_languages = languagesText
    }
    if (profile.lead_certifications) {
      const certificationsText = profile.lead_certifications
        .map((cert) => {
          return `認定: ${cert.name || ''}\n機関: ${cert.organization || ''}\nURL: ${cert.url || ''}`
        })
        .join('\n\n')
      baseInfo.lead_certifications = certificationsText
    }
    if (profile.lead_projects) {
      const projectsText = profile.lead_projects
        .map((proj) => {
          return `プロジェクト名: ${proj.name || ''}\n説明: ${proj.description || ''}\nスキル: ${proj.skills || ''}\n開始: ${proj.start_date || ''}\n終了: ${proj.end_date || ''}`
        })
        .join('\n\n')
      baseInfo.lead_projects = projectsText
    }
    if (profile.lead_reactions) {
      profile.lead_reactions.forEach((reaction) => {
        if (reaction.reaction_type === ReactionType.LIKE) {
          baseInfo.like_count++
          baseInfo.like_post_urls += `${reaction.post_url}\n`
        } else if (reaction.reaction_type === ReactionType.COMMENT) {
          baseInfo.comment_count++
          baseInfo.comment_post_urls += `${reaction.post_url}\n`
        } else if (reaction.reaction_type === ReactionType.EMPATHY) {
          baseInfo.empathy_count++
          baseInfo.empathy_post_urls += `${reaction.post_url}\n`
        } else if (reaction.reaction_type === ReactionType.INTEREST) {
          baseInfo.interest_count++
          baseInfo.interest_post_urls += `${reaction.post_url}\n`
        } else if (reaction.reaction_type === ReactionType.ENTERTAINMENT) {
          baseInfo.entertainment_count++
          baseInfo.entertainment_post_urls += `${reaction.post_url}\n`
        } else if (reaction.reaction_type === ReactionType.PRAISE) {
          baseInfo.praise_count++
          baseInfo.praise_post_urls += `${reaction.post_url}\n`
        } else {
          baseInfo.appreciation_count++
          baseInfo.appreciation_post_urls += `${reaction.post_url}\n`
        }
      })
    }

    return baseInfo
  })
  const rowAfterFilter = rows.filter((row) => row !== undefined && row !== null)
  return rowAfterFilter
}

// CSVデータを取得して指定したカラムの値を抽出する関数
export async function extractColumnData(
  input: any,
  columnName: string | number
): Promise<any> {
  // 入力データの取得処理
  const csvData = await getCsvData(input)

  return new Promise((resolve, reject) => {
    Papa.parse(csvData as any, {
      header: true,
      complete: function (results) {
        const extractedData = results.data
          .map((row: any) => {
            let value = row[columnName]
            if (typeof value === 'string') {
              value = value.trim()
            } else {
              return undefined
            }

            // LinkedInのURL解析が有効な場合
            if (value.includes('linkedin.com')) {
              const linkedInId = extractLinkedInId(value)
              if (linkedInId) {
                return linkedInId
              }
            }

            return value
          })
          .filter((value) => value !== undefined && value !== '')

        resolve(extractedData)
      },
      error: function (error) {
        reject(error)
      },
    })
  })
}

// LinkedInのURLからIDを抽出する関数
export function extractLinkedInId(url: string) {
  try {
    // URLが文字列でない場合はnullを返す
    if (typeof url !== 'string') return null

    // LinkedInのURLかどうかチェック
    if (!url.includes('linkedin.com/in/')) return null

    // URLを'/'で分割して、最後の有効な部分を取得
    const parts = url.split('/').filter((part) => part)
    const lastPart = parts[parts.length - 1]

    // 最後の部分から余分な文字（クエリパラメータなど）を除去
    return lastPart.split('?')[0].split('#')[0]
  } catch (error) {
    console.error('Error while extracting LinkedIn ID:', error)
    return null
  }
}

// 入力ソースに応じてCSVデータを取得する関数
async function getCsvData(input: string | Blob | URL | Request) {
  // 文字列の場合はそのまま返す
  if (typeof input === 'string') {
    // URLかどうかチェック
    if (
      input.startsWith('http://') ||
      input.startsWith('https://') ||
      input.startsWith('blob:')
    ) {
      try {
        const response = await fetch(input)
        return await response.text()
      } catch (error: any) {
        throw new Error(`URLからのデータ取得に失敗しました: ${error.message}`)
      }
    }
    // 通常のCSV文字列の場合
    return input
  }

  // Fileオブジェクトの場合
  if (input instanceof File) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = (e) => resolve(e.target?.result)
      reader.onerror = (e) =>
        reject(new Error('ファイルの読み込みに失敗しました'))
      reader.readAsText(input)
    })
  }

  // Blobオブジェクトの場合
  if (input instanceof Blob) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = (e) => resolve(e.target?.result)
      reader.onerror = (e) => reject(new Error('Blobの読み込みに失敗しました'))
      reader.readAsText(input)
    })
  }

  throw new Error('サポートされていない入力形式です')
}
