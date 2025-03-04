'use client'
import { toolConfig } from './toolConfig'
import { Button } from '@/components/ui/button'
import Login from '@/components/input/login'
import { useAtom } from 'jotai'
import { providerAtom, userAtom, workflowsAtom } from '@/lib/atom'
import { WorkflowType } from '@/lib/types/master'
import SearchProfileContent from '@/components/workflow/search-profile/Content'
import { useParams } from 'next/navigation'
import { useEffect, useState } from 'react'
import LoadingPage from '@/components/Loading'
import { Workflow } from '@/lib/types/supabase'

export default function Page() {
  const [user, _] = useAtom(userAtom)
  const [provider, __] = useAtom(providerAtom)
  const [workflows, ___] = useAtom(workflowsAtom)
  const [workflow, setWorkflow] = useState<Workflow | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  const params = useParams()
  const id = params.id as string
  const [workflowId, setWorkflowId] = useState<string | null>(null)

  useEffect(() => {
    if (id) {
      setWorkflowId(id)
      console.log('workflowId', id)
      workflows.map((workflow) => {
        if (workflow.id === id) setWorkflow(workflow)
      })
    }
  }, [id, workflows, setWorkflow])

  useEffect(() => {
    const checkDataLoaded = () => {
      if (
        user &&
        user !== undefined &&
        provider &&
        provider !== undefined &&
        workflow &&
        workflow !== undefined
      ) {
        setIsLoading(false)
      }
    }
    checkDataLoaded()
    const timeoutId = setTimeout(() => {
      setIsLoading(false)
    }, 5000)
    return () => clearTimeout(timeoutId)
  }, [user, provider, workflow])

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
        <>
          {workflow?.type == WorkflowType.SEARCH && (
            <SearchProfileContent workflowId={workflowId as string} />
          )}
          {workflow?.type == WorkflowType.INVITE && (
            <SearchProfileContent workflowId={workflowId as string} />
          )}
        </>
      ) : (
        <div className="flex flex-col items-center justify-center min-h-[75vh]">
          <h1 className="text-2xl font-bold mb-8">Linkedinアカウントと連携</h1>
          <Button
            onClick={() => handleConnect()}
            disabled={provider ? true : false}
            className="bg-[#0077b5] hover:bg-[#0077b5]/90 text-white"
          >
            {'Connect'}
          </Button>
        </div>
      )}
    </div>
  )
}
