import Papa from 'papaparse'

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

  const csv = Papa.unparse(rows, { newline: '\n' })
  // ダウンロード
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
  const link = document.createElement('a')
  const url = URL.createObjectURL(blob)
  link.setAttribute('href', url)
  const date = new Date()
  const year = date.getFullYear()
  const month = date.getMonth() + 1
  const day = date.getDate()
  const hours = date.getHours()
  const minutes = date.getMinutes()
  link.setAttribute(
    'download',
    `linkedin_profile_${year}${month}${day}${hours}${minutes}.csv`
  )
  link.style.visibility = 'hidden'
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)

  console.log(`CSV file has been saved to ${outputFilePath}`)
  return
}
