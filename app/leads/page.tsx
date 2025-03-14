'use client'
import { toolConfig } from './toolConfig'
import { Button } from '@/app/components/ui/button'
import Login from '@/app/components/input/login'
import { useAtom } from 'jotai'
import { providerAtom, userAtom } from '@/lib/atom'
import { useEffect, useState } from 'react'
import LoadingPage from '@/app/components/Loading'
import { LeadTable } from '@/app/components/dashboard/LeadTable'
import { convertToDisplay, LeadForDisplay } from '@/lib/csv'
import { getLeadsByProviderId } from '@/lib/db/queries/leadClient'

export default function Page() {
  const [user, _] = useAtom(userAtom)
  const [provider, __] = useAtom(providerAtom)
  const [isLoading, setIsLoading] = useState(true)

  const [leads, setLeads] = useState<LeadForDisplay[]>([])
  useEffect(() => {
    const f = async () => {
      if (!provider) return
      const fetchedLeads = await getLeadsByProviderId({
        providerId: provider?.id,
      })
      if (fetchedLeads && fetchedLeads.length) {
        const convertedRow = convertToDisplay(fetchedLeads)
        if (convertedRow && convertedRow.length)
          setLeads(convertedRow as LeadForDisplay[] | [])
      }
    }
    f()
  }, [provider])

  useEffect(() => {
    const checkDataLoaded = () => {
      if (user && user !== undefined && provider && provider !== undefined) {
        setIsLoading(false)
      }
    }
    checkDataLoaded()
    const timeoutId = setTimeout(() => {
      setIsLoading(false)
    }, 5000)
    return () => clearTimeout(timeoutId)
  }, [user, provider])

  const handleConnect = async () => {
    try {
      // Try to get LinkedIn cookies
      const response = await fetch('/api/provider/auth', {
        method: 'POST',
      })
      // push to url
      if (response.ok) {
        const { url } = await response.json()
        if (url) window.open(url, '_blank')
      }
    } catch (error) {
      console.error('Error checking login status:', error)
      alert('Error checking login status')
    }
  }

  // Show loading spinner while data is being fetched
  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[75vh]">
        <LoadingPage />
        <p className="mt-4 text-gray-600">データを読み込み中...</p>
      </div>
    )
  }

  // If the tool is not paywalled or the user has a valid purchase, render the page
  return (
    <div data-theme={toolConfig.company.theme} className="bg-white">
      {!user?.email ? (
        <div className="flex flex-col items-center justify-center min-h-[75vh]">
          <Login />
        </div>
      ) : provider ? (
        <LeadTable leads={leads} />
      ) : (
        <div className="flex flex-col items-center justify-center min-h-[75vh]">
          <h1 className="text-2xl font-bold mb-8">Linkedinアカウントと連携</h1>
          <Button
            onClick={() => handleConnect()}
            disabled={provider ? true : false}
            className="bg-[#0077b5] hover:bg-[#0077b5]/90 text-white"
          >
            {'Connect Linkedin'}
          </Button>
        </div>
      )}
    </div>
  )
}
