import Papa from 'papaparse'
import { LeadInsert } from './types/supabase'
import { LeadStatus } from './types/master'

export const convertProfileJsonToCsv = (
  inputData: any[],
  outputFilePath: string
): void => {
  if (!inputData || inputData.length === 0) {
    console.log('No data to convert')
    return
  }
  const rows = inputData.map((profile: LeadInsert) => {
    const baseInfo = {
      public_profile_url: `https://www.linkedin.com/in/${profile.public_identifier}`,
      ...profile,
      statuses: '',
      work_experiences: '',
      volunteering_experiences: '',
      educations: '',
      skills: '',
      languages: '',
      certifications: '',
      projects: '',
    }
    if (profile.statuses?.length)
      baseInfo.statuses = LeadStatus[profile.statuses[0].status]

    if (profile.work_experiences?.length) {
      const workExperiencesText = profile.work_experiences
        .map((exp) => {
          return `会社: ${exp.company || ''}\n役職: ${
            exp.position || ''
          }\n場所: ${exp.location || ''}\n説明: ${
            exp.description || ''
          }\nスキル: ${(exp.skills || []).join(', ')}\n開始: ${
            exp.start_date?.toLocaleDateString() || ''
          }\n終了: ${exp.end_date?.toLocaleDateString() || ''}`
        })
        .join('\n\n')

      baseInfo.work_experiences = workExperiencesText
    }
    if (profile.volunteering_experiences?.length) {
      const volunteerExperiencesText = profile.volunteering_experiences
        .map((exp) => {
          return `会社: ${exp.company || ''}\n詳細: ${
            exp.description || ''
          }\n役職: ${exp.role || ''}\nCause: ${exp.cause || ''}\n開始: ${
            exp.start_date?.toLocaleDateString() || ''
          }\n終了: ${exp.end_date?.toLocaleDateString() || ''}`
        })
        .join('\n\n')

      baseInfo.volunteering_experiences = volunteerExperiencesText
    }
    if (profile.educations?.length) {
      const educationsText = profile.educations
        .map((edu) => {
          return `学校: ${edu.school || ''}\n学位: ${
            edu.degree || ''
          }\n専攻: ${edu.field_of_study || ''}\n開始: ${
            edu.start_date?.toLocaleDateString() || ''
          }\n終了: ${edu.end_date?.toLocaleDateString() || ''}`
        })
        .join('\n\n')
      baseInfo.educations = educationsText
    }
    if (profile.skills) {
      const skillsText = profile.skills
        .map((skill) => {
          return `${skill.name || ''}`
        })
        .join(', ')
      baseInfo.skills = skillsText
    }
    if (profile.languages) {
      const languagesText = profile.languages
        .map((lang) => {
          return `言語: ${lang.name || ''}\nレベル: ${lang.proficiency || ''}`
        })
        .join('\n\n')
      baseInfo.languages = languagesText
    }
    if (profile.certifications) {
      const certificationsText = profile.certifications
        .map((cert) => {
          return `認定: ${cert.name || ''}\n機関: ${cert.organization || ''}\nURL: ${cert.url || ''}`
        })
        .join('\n\n')
      baseInfo.certifications = certificationsText
    }
    if (profile.projects) {
      const projectsText = profile.projects
        .map((proj) => {
          return `プロジェクト名: ${proj.name || ''}\n説明: ${proj.description || ''}\nスキル: ${proj.skills || ''}\n開始: ${proj.start_date?.toLocaleDateString() || ''}\n終了: ${proj.end_date?.toLocaleDateString() || ''}`
        })
        .join('\n\n')
      baseInfo.projects = projectsText
    }

    return baseInfo
  })

  const csv = Papa.unparse(rows, { newline: '\n' })
  // ダウンロード
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
  const link = document.createElement('a')
  const url = URL.createObjectURL(blob)
  link.setAttribute('href', url)
  link.setAttribute('download', outputFilePath)
  link.style.visibility = 'hidden'
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)

  console.log(`CSV file has been saved to ${outputFilePath}`)
  return
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

        console.log(`Extracted data: ${extractedData}`)

        resolve(extractedData)
      },
      error: function (error) {
        reject(error)
      },
    })
  })
}

// LinkedInのURLからIDを抽出する関数
function extractLinkedInId(url: string) {
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
    console.error('LinkedIn ID抽出エラー:', error)
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
