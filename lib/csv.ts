import Papa from 'papaparse'

export const convertProfileJsonToCsv = (
  inputData: any[],
  outputFilePath: string
): void => {
  if (!inputData || inputData.length === 0) {
    console.log('No data to convert')
    return
  }
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
