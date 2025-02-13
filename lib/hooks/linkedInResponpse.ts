import { useState } from 'react'
import { type ToolConfig } from '@/lib/types/toolconfig'
import { ProviderInvitePostParam } from '@/app/api/provider/invite/route'

export const linkedInResponse = (toolConfig: ToolConfig) => {
  const [loading, setLoading] = useState(false)
  // const router = useRouter()

  const generateResponse = async (
    formData: { [key: string]: string },
    event: React.FormEvent<HTMLFormElement>
  ) => {
    event.preventDefault()
    setLoading(true)

    try {
      const body: ProviderInvitePostParam = {
        account_id: '0WvgW8VVQJeE42TefWMNPw',
        limit: Number(formData.limit) || 10,
        keywords: formData.keywords,
        message: formData.message,
        ...formData,
      }

      const response = await fetch(`/api/provider/invite`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...body,
        }),
      })

      if (!response.ok) {
        throw new Error('Network response was not ok')
      }

      const responseData = await response.json()
      console.log('responseData', responseData)

      // For navigation, use slug for Grok and id for others
      // const baseUrl = toolConfig.company.homeUrl.startsWith('/')
      //   ? toolConfig.company.homeUrl.slice(1)
      //   : toolConfig.company.homeUrl

      // const navigationPath = `/${baseUrl}/${responseData.slug}`
      // router.push(navigationPath)
    } catch (error) {
      console.error('Failed to generate responses:', error)
    } finally {
      setLoading(false)
    }
  }

  return [generateResponse, loading] as const
}
