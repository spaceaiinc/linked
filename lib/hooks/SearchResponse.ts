import { useState } from 'react'
import { type ToolConfig } from '@/lib/types/toolconfig'
import { ProviderInvitePostParam } from '@/app/api/provider/search/route'
import { convertJsonToCsv } from '../csv'

export const searchResponse = (toolConfig: ToolConfig) => {
  const [loading, setLoading] = useState(false)

  const generateResponse = async (
    formData: { [key: string]: string },
    event: React.FormEvent<HTMLFormElement>
  ) => {
    event.preventDefault()
    setLoading(true)

    try {
      const body: ProviderInvitePostParam = {
        account_id: formData.account_id,
        ...formData,
      }

      const response = await fetch(`/api/provider/search`, {
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
      const outputLink = `output_${formData.account_id}_${new Date().getTime()}.csv`
      if (responseData.profile_list)
        convertJsonToCsv(responseData.profile_list, outputLink)
    } catch (error) {
      console.error('Failed to generate responses:', error)
    } finally {
      setLoading(false)
    }
  }

  return [generateResponse, loading] as const
}
