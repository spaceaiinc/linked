'use client'
import { providerAtom, userAtom, scoutScreeningsAtom } from '@/lib/atom'
import { WorkflowType } from '@/lib/types/master'
import { useAtom } from 'jotai'
import { useCallback, useEffect, useState } from 'react'
import { Button } from '@/app/components/ui/button'
import LoadingPage from '@/app/components/Loading'
import Login from '@/app/components/input/login'
import { createClient } from '@/lib/utils/supabase/client'
import { ScoutScreening } from '@/lib/atom'

export default function ScoutScreeningsPage() {
  // 縦並びのレイアウトを返す関数
  const getGridClass = () => {
    return 'flex flex-col gap-6 w-full max-w-4xl mx-auto'
  }

  const tools = [
    {
      type: 0,
      title: 'スカウトスクリーニング',
      tags: [],
      image: '/apps/linkedin-logo.jpg',
      description: 'スカウトスクリーニングを作成します。',
    },
  ]

  const [user, _] = useAtom(userAtom)
  const [provider, __] = useAtom(providerAtom)
  const [scoutScreenings, ___] = useAtom(scoutScreeningsAtom)
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

  const createScoutScreening = useCallback(
    async (type: WorkflowType) => {
      console.log('createScoutScreening', type)
      const response = await fetch(`/api/scout-screening`, {
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

      const createScoutScreeningResponse = await response.json()
      createScoutScreeningResponse.scout_screening_id
        ? window.location.replace(
            `/scout-screening/${createScoutScreeningResponse.scout_screening_id}`
          )
        : alert('Failed to create scout screening')
    },
    [provider]
  )

  const deleteScoutScreening = useCallback(
    async (scoutScreeningId: string) => {
      const supabase = createClient()
      const { error: deleteError } = await supabase
        .from('scout_screenings')
        .update([{ deleted_at: new Date().toISOString() }])
        .eq('company_id', provider?.company_id)
        .eq('id', scoutScreeningId)

      if (deleteError) {
        alert('削除に失敗しました')
        console.error('Failed to delete scout screening:', deleteError)
        return
      }

      // Refresh the page to update the scout screening list
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
          {scoutScreenings.length > 0 && (
            <section id="scout-screenings">
              <div className="p-2 sm:p-6 xl:max-w-7xl xl:mx-auto relative isolate overflow-hidden pb-0 flex flex-col justify-center items-center">
                <h2 className="text-2xl font-bold text-neutral-900 dark:text-neutral-100">
                  マイスカウトスクリーニング
                </h2>
                <div className="py-10 w-full flex justify-center">
                  <div className={getGridClass()}>
                    {scoutScreenings.map((screening: ScoutScreening, index) => {
                      // if (screening.type === WorkflowType.LEAD_LIST) {
                      //   return null
                      // }
                      return (
                        <a
                          key={index}
                          href={`/scout-screening/${screening.id}`}
                          className="w-full"
                        >
                          <div className="w-full transition-all duration-500 ease-in-out bg-white border border-base-200 rounded-xl hover:-translate-y-1 p-4 flex flex-row items-center">
                            {/* 左側：画像 */}
                            <div className="w-1/3 pr-4">
                              <img
                                src={'/apps/linkedin-logo.jpg'}
                                alt={screening.name}
                                className="w-full h-auto border border-base-200 rounded-md"
                              />
                            </div>
                            {/* 右側：テキスト情報 */}
                            <div className="w-2/3 flex flex-col">
                              <div className="flex justify-between items-start">
                                <h3 className="text-lg font-semibold text-neutral-700 dark:text-neutral-300">
                                  {screening.name}
                                </h3>
                                <button
                                  onClick={(e) => {
                                    e.preventDefault()
                                    e.stopPropagation()
                                    if (
                                      confirm(
                                        `スカウトスクリーニング「${screening.name}」を削除しますか？`
                                      )
                                    ) {
                                      deleteScoutScreening(screening.id)
                                    }
                                  }}
                                  className="text-gray-500 hover:text-gray-700 px-2 py-1 rounded-md"
                                  aria-label="Delete scout screening"
                                >
                                  <svg
                                    xmlns="http://www.w3.org/2000/svg"
                                    width="16"
                                    height="16"
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth="2"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                  >
                                    <path d="M3 6h18" />
                                    <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" />
                                    <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
                                    <line x1="10" y1="11" x2="10" y2="17" />
                                    <line x1="14" y1="11" x2="14" y2="17" />
                                  </svg>
                                </button>
                              </div>
                              <p className="text-sm text-neutral-500 mt-1">
                                {screening.company_name}
                              </p>
                              <p className="text-sm text-neutral-500 mt-1">
                                {screening.job_title}
                              </p>
                              <div className="mt-4 flex gap-y-1 flex-wrap">
                                <span
                                  key={screening.type}
                                  className="border bg-base-100 text-base-content py-1 px-4 text-sm rounded-xl"
                                >
                                  {
                                    WorkflowType[
                                      screening.type as keyof typeof WorkflowType
                                    ]
                                  }
                                </span>
                              </div>
                            </div>
                          </div>
                        </a>
                      )
                    })}
                  </div>
                </div>
              </div>
            </section>
          )}{' '}
          <section id="suggested_scout_screenings">
            <div className="p-2 sm:p-6 xl:max-w-7xl xl:mx-auto relative isolate overflow-hidden pb-0 flex flex-col justify-center items-center">
              <h2 className="text-2xl font-bold text-neutral-900 dark:text-neutral-100">
                スカウトスクリーニングを作成
              </h2>
              <div className="py-10 w-full flex justify-center">
                <div className={getGridClass()}>
                  {tools.map((toolItem, index) => (
                    <a
                      key={index}
                      onClick={() => {
                        createScoutScreening(toolItem.type)
                      }}
                      className="w-full cursor-pointer"
                    >
                      <div className="w-full transition-all duration-500 ease-in-out bg-white border border-base-200 rounded-xl hover:-translate-y-1 p-4 flex flex-row items-center">
                        {/* 左側：画像 */}
                        <div className="w-1/3 pr-4">
                          {toolItem.image && (
                            <img
                              src={toolItem.image}
                              alt={toolItem.title}
                              className="w-full h-auto border border-base-200 rounded-md"
                            />
                          )}
                        </div>
                        {/* 右側：テキスト情報 */}
                        <div className="w-2/3 flex flex-col">
                          <h3 className="text-lg font-semibold text-neutral-700 dark:text-neutral-300">
                            {toolItem.title}
                          </h3>
                          <p className="text-sm text-neutral-400 mt-2">
                            {toolItem.description}
                          </p>
                          <div className="mt-4 flex gap-2 flex-wrap">
                            {toolItem.tags.map((tag, index) => (
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
