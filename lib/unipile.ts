import { UnipileClient } from 'unipile-node-sdk'
import { env } from './env'

export const unipileClient = new UnipileClient(
  `https://${env.UNIPILE_DNS}`,
  env.UNIPILE_ACCESS_TOKEN
)

import * as fs from 'fs'
import { parse } from 'json2csv'

interface WorkExperience {
  company?: string
  position?: string
  location?: string
  description?: string
  skills?: string[]
  start?: string
  end?: string
}

export const convertJsonToCsv = (
  inputData: any[],
  outputFilePath: string
): void => {
  const rows = inputData.map((profile) => {
    const baseInfo = {
      provider: profile.provider || '',
      provider_id: profile.provider_id || '',
      public_identifier: profile?.public_identifier || '',
      first_name: profile.first_name || '',
      last_name: profile.last_name || '',
      headline: profile.headline || '',
      location: profile.location || '',
      follower_count: profile.follower_count || 0,
      connections_count: profile.connections_count || 0,
      work_experience: '',
    }

    if (profile.work_experience) {
      const workExperiencesText = profile.work_experience
        .map(
          (exp: {
            company: any
            position: any
            location: any
            description: any
            skills: any
            start: any
            end: any
          }) => {
            return `会社: ${exp.company || ''}\n役職: ${
              exp.position || ''
            }\n場所: ${exp.location || ''}\n説明: ${
              exp.description || ''
            }\nスキル: ${(exp.skills || []).join(', ')}\n開始: ${
              exp.start || ''
            }\n終了: ${exp.end || ''}`
          }
        )
        .join('\n\n')

      baseInfo.work_experience = workExperiencesText
    }

    return baseInfo
  })

  const csv = parse(rows, { eol: '\n' })
  fs.writeFileSync(outputFilePath, csv, 'utf8')

  console.log(`CSV file has been saved to ${outputFilePath}`)
  return
}
