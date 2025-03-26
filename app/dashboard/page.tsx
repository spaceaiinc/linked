'use client'
import { tools } from '@/lib/apps'
import { providerAtom, userAtom, workflowsAtom } from '@/lib/atom'
import { WorkflowType } from '@/lib/types/master'
import { useAtom } from 'jotai'
import { useCallback, useEffect, useState } from 'react'
import { createClient } from '@/lib/utils/supabase/client'
import Login from '../components/input/login'
import LoadingPage from '../components/Loading'
import { Button } from '../components/ui/button'

export default function Apps() {
  // 縦並びのレイアウトを返す関数
  const getGridClass = () => {
    return 'flex flex-col gap-6 w-full max-w-4xl mx-auto'
  }

  const [user, _] = useAtom(userAtom)
  const [provider, __] = useAtom(providerAtom)
  const [workflows, ___] = useAtom(workflowsAtom)
  const [isLoading, setIsLoading] = useState(true)

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

  const createWorkflow = useCallback(
    async (type: WorkflowType) => {
      console.log('createWorkflow', type)
      const response = await fetch(`/api/workflow`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          type: type,
          account_id: provider?.account_id,
        }),
      })

      if (!response.ok) {
        alert(await response.text())
        throw new Error('Network response was not ok')
      }

      const createWorkflowResponse = await response.json()
      createWorkflowResponse.workflow_id
        ? window.location.replace(
            `/workflow/${createWorkflowResponse.workflow_id}`
          )
        : alert('Failed to create workflow')
    },
    [provider]
  )

  const deleteWorkflow = useCallback(
    async (workflowId: string) => {
      const supabase = createClient()
      const { error: deleteError } = await supabase
        .from('workflows')
        .update([{ deleted_at: new Date().toISOString() }])
        .eq('company_id', provider?.company_id)
        .eq('id', workflowId)

      if (deleteError) {
        alert('削除に失敗しました')
        console.error('Failed to delete workflow:', deleteError)
        return
      }

      // Refresh the page to update the workflow list
      window.location.reload()
    },
    [provider]
  )

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

  return (
    <>
      {!user?.email ? (
        <div className="flex flex-col items-center justify-center min-h-[75vh]">
          <Login />
        </div>
      ) : provider ? (
        <>
          {' '}
          <section id="suggested_workflows">
            <div className="p-2 sm:p-6 xl:max-w-7xl xl:mx-auto relative isolate overflow-hidden pb-0 flex flex-col justify-center items-center">
              <h2 className="text-2xl font-bold text-neutral-900 dark:text-neutral-100">
                ワークフローを作成
              </h2>
              <div className="py-10 w-full flex justify-center">
                <div className={getGridClass()}>
                  {tools.map((workflow, index) => (
                    <a
                      key={index}
                      onClick={() => {
                        createWorkflow(workflow.type)
                      }}
                      className="w-full cursor-pointer"
                    >
                      <div className="w-full transition-all duration-500 ease-in-out bg-white border border-base-200 rounded-xl hover:-translate-y-1 p-4 flex flex-row items-center">
                        {/* 左側：画像 */}
                        <div className="w-1/3 pr-4">
                          {workflow.image && (
                            <img
                              src={workflow.image}
                              alt={workflow.title}
                              className="w-full h-auto border border-base-200 rounded-md"
                            />
                          )}
                        </div>
                        {/* 右側：テキスト情報 */}
                        <div className="w-2/3 flex flex-col">
                          <h3 className="text-lg font-semibold text-neutral-700 dark:text-neutral-300">
                            {workflow.title}
                          </h3>
                          <p className="text-sm text-neutral-400 mt-2">
                            {workflow.description}
                          </p>
                          <div className="mt-4 flex gap-2 flex-wrap">
                            {workflow.tags.map((tag, index) => (
                              <span
                                key={tag}
                                className="border bg-base-100 text-base-content py-1 px-3 text-sm rounded-xl"
                              >
                                {tag}
                              </span>
                            ))}
                          </div>
                        </div>
                      </div>
                    </a>
                  ))}
                </div>
              </div>
            </div>
          </section>
        </>
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
    </>
  )
}
