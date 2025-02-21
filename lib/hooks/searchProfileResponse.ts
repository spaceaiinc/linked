import { useState } from 'react'
import { type ToolConfig } from '@/lib/types/toolconfig'
import { convertProfileJsonToCsv } from '../csv'

export const searchProfileResponse = (toolConfig: ToolConfig) => {
  const [loading, setLoading] = useState(false)

  const generateResponse = async (
    formData: { [key: string]: string },
    event: React.FormEvent<HTMLFormElement>
  ) => {
    event.preventDefault()
    setLoading(true)

    try {
      // const body: ProviderSearchProfilePostParam = {
      //   account_id: formData.account_id,
      //   ...formData,
      // }

      const response = await fetch(`/api/provider/search/profile`, {
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
      console.log('responseData', responseData)

      // For navigation, use slug for Grok and id for others
      // const baseUrl = toolConfig.company.homeUrl.startsWith('/')
      //   ? toolConfig.company.homeUrl.slice(1)
      //   : toolConfig.company.homeUrl

      // const navigationPath = `/${baseUrl}/${responseData.slug}`
      // router.push(navigationPath)
      if (
        responseData.profile_list &&
        (formData.type == '1' || formData.type == '2')
      ) {
        const date = new Date()
        const year = date.getFullYear()
        const month = date.getMonth() + 1
        const day = date.getDate()
        const hours = date.getHours()
        const minutes = date.getMinutes()
        const outputFilePath = `linkedin_profile_${year}${month}${day}${hours}${minutes}.csv`
        convertProfileJsonToCsv(responseData.profile_list, outputFilePath)
      }
    } catch (error) {
      console.error('Failed to generate responses:', error)
    } finally {
      setLoading(false)
    }
  }

  return [generateResponse, loading] as const
}
