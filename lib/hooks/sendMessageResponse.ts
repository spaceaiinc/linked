import { useState } from 'react'
import { useAtom } from 'jotai'
import { workflowsAtom } from '../atom'
import { Workflow } from '../types/supabase'
import { useToast } from '@/app/components/ui/use-toast'

export const sendMessageResponse = () => {
  const [loading, setLoading] = useState(false)
  const [workflows, setWorkflows] = useAtom(workflowsAtom)
  const { toast } = useToast()

  const generateResponse = async (
    formData: { [key: string]: string },
    event: React.FormEvent<HTMLFormElement>
  ) => {
    event.preventDefault()
    setLoading(true)

    try {
      const response = await fetch(`/api/workflow/send-message`, {
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
        toast({
          variant: 'destructive',
          description: '処理に失敗しました',
          duration: 4000,
          className: 'bg-white border-red-200 rounded-xl',
        })
        return
      }
      toast({
        description: '処理に成功しました',
        duration: 4000,
        className: 'bg-white border-teal-200 rounded-xl',
      })
      const responseData = await response.json()
      if (responseData.workflow) {
        setWorkflows([...workflows, responseData.workflow as Workflow])
        // window.location.reload()
      }
    } catch (error) {
      console.error('Failed to responses:', error)
    } finally {
      setLoading(false)
    }
  }

  return [generateResponse, loading] as const
}
