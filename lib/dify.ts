export type generateMesssageOnDifyParam = {
  apiKey: string
  candidateInfo: string
  jobPosition: string
}

export const generateMessageOnDify = async (
  param: generateMesssageOnDifyParam
) => {
  const response = await fetch('https://api.dify.ai/v1/workflows/run', {
    cache: 'force-cache',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${param.apiKey}`,
    },
    body: JSON.stringify({
      inputs: {
        job_position: param.jobPosition,
        candidate_info: param.candidateInfo,
      },
      response_mode: 'blocking',
      conversation_id: '',
      user: 'abc-123',
    }),
    next: { revalidate: 60 },
  })
  const data = await response.json()
  if ('outputs' in data && 'text' in data.outputs) return data.outputs.text
  else return ''
}

// todo: toolconfig job_position
