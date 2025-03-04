import { useState } from 'react'
import { type ToolConfig } from '@/lib/types/toolconfig'
import { useAtom } from 'jotai'
import { workflowsAtom } from '../atom'
import { Workflow } from '../types/supabase'

export const searchProfileResponse = (toolConfig: ToolConfig) => {
  const [loading, setLoading] = useState(false)
  const [workflows, setWorkflows] = useAtom(workflowsAtom)

  const generateResponse = async (
    formData: { [key: string]: string },
    event: React.FormEvent<HTMLFormElement>
  ) => {
    event.preventDefault()
    setLoading(true)

    try {
      const response = await fetch(`/api/workflow/search-profile`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
        }),
      })

      if (!response.ok) {
        alert(await response.text())
        throw new Error('Network response was not ok')
      }
      const responseData = await response.json()
      if (responseData.workflow) {
        setWorkflows([...workflows, responseData.workflow as Workflow])
      }
    } catch (error) {
      console.error('Failed to responses:', error)
    } finally {
      setLoading(false)
    }
  }

  return [generateResponse, loading] as const
}
