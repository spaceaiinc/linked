export const generatePersonalizedMessage = async (
  apiKey: string,
  candidateInfo: string,
  position: string
): Promise<string> => {
  // DifyのAPIを実行
  const response = await fetch('https://api.dify.ai/v1/chat-messages', {
    cache: 'force-cache',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      inputs: {
        candidate_info: candidateInfo,
        position: position,
      },
      response_mode: 'blocking',
    }),
    // next: { revalidate: 60 },
  })

  //   {
  //     "workflow_run_id": "djflajgkldjgd",
  //     "task_id": "9da23599-e713-473b-982c-4328d4f5c78a",
  //     "data": {
  //         "id": "fdlsjfjejkghjda",
  //         "workflow_id": "fldjaslkfjlsda",
  //         "status": "succeeded",
  //         "outputs": {
  //           "text": "Nice to meet you."
  //         },
  //         "error": null,
  //         "elapsed_time": 0.875,
  //         "total_tokens": 3562,
  //         "total_steps": 8,
  //         "created_at": 1705407629,
  //         "finished_at": 1727807631
  //     }
  // }
  const data = await response.json()

  const message = data.outputs.output

  console.log('message:', message)
  return message
}
