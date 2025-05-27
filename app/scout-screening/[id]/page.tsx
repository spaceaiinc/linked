'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import { IconSend } from '@tabler/icons-react'

import { Textarea } from '@/app/components/ui/textarea'
import { Button } from '@/app/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/app/components/ui/card'
import { Label } from '@/app/components/ui/label'
import { IconCopy, IconCheck } from '@/app/components/ui/icons'
import { useCopyToClipboard } from '@/lib/hooks/copyToClipboard'
import { createClient } from '@/lib/utils/supabase/client'

interface ScreeningResult {
  passed: 'ok' | 'ng'
  reason?: string
  // Pattern fields (present only when passed === 'ok')
  pattern_id?: string
  subject?: string
  body?: string
  resend_subject?: string
  resend_body?: string
  re_resend_subject?: string
  re_resend_body?: string
  original_conditions?: string | null
  failedPatterns?: {
    original_conditions: string | null
    reason: string
  }[]
}

type ScreeningInfo = {
  job_title: string
  company_name: string
}

function CopyButton({ text }: { text?: string }) {
  const { isCopied, copyToClipboard } = useCopyToClipboard({ timeout: 2000 })

  if (!text) return null

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={() => copyToClipboard(text)}
      className="h-6 w-6 p-0 hover:bg-transparent"
    >
      {isCopied ? (
        <IconCheck className="h-4 w-4" />
      ) : (
        <IconCopy className="h-4 w-4" />
      )}
    </Button>
  )
}

export default function ScoutScreeningRunPage() {
  const params = useParams()
  const id = params?.id as string | undefined

  const [candidateInfo, setCandidateInfo] = useState('')
  const [result, setResult] = useState<ScreeningResult | null>(null)
  const [loading, setLoading] = useState(false)
  const [screening, setScreening] = useState<ScreeningInfo | null>(null)

  // Fetch scout screening details (job_title and company_name)
  useEffect(() => {
    const fetchScreening = async () => {
      if (!id) return
      try {
        const supabase = createClient()
        const { data, error } = await supabase
          .from('scout_screenings')
          .select('job_title, company_name')
          .eq('id', id)
          .eq('deleted_at', '-infinity')
          .single()

        if (error) {
          console.error('Error fetching scout screening', error)
          return
        }

        if (data) {
          setScreening({
            job_title: data.job_title || '',
            company_name: data.company_name || '',
          })
        }
      } catch (err) {
        console.error('Unexpected error fetching scout screening', err)
      }
    }

    fetchScreening()
  }, [id])

  const handleExecute = async () => {
    if (!id) return
    setLoading(true)
    try {
      const res = await fetch('/api/scout-screening/run', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          scout_screening_id: id,
          candidate_info: candidateInfo,
        }),
      })

      const data = await res.json()
      if (!res.ok) {
        alert(data.error || '実行に失敗しました')
        return
      }
      setResult(data as ScreeningResult)
    } catch (e) {
      console.error(e)
      alert('エラーが発生しました')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="container mx-auto py-8 px-4 max-w-6xl">
      <h1 className="text-2xl font-bold mb-4 flex items-center gap-2">
        スカウト判定
        {screening && (
          <span className="text-lg font-normal text-gray-600 whitespace-nowrap">
            {screening.job_title} / {screening.company_name}
          </span>
        )}
      </h1>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Input side */}
        <Card className="h-fit">
          <CardHeader>
            {/* <CardTitle>候補者情報</CardTitle> */}
            <CardDescription>候補者の情報を入力してください。</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Textarea
              value={candidateInfo}
              onChange={(e) => setCandidateInfo(e.target.value)}
              placeholder=""
              className="min-h-[200px]"
              rows={16}
            />
            <div className="">
              <Button
                onClick={handleExecute}
                disabled={loading || !candidateInfo}
                className="flex items-center gap-2 w-full"
              >
                {loading ? (
                  '実行中...'
                ) : (
                  <IconSend className="h-4 w-4 text-white" />
                )}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Result side */}
        <div className="space-y-6">
          {!result && (
            <p className="text-sm text-gray-500">
              実行結果がここに表示されます
            </p>
          )}

          {result && result.passed === 'ok' && (
            <>
              <Card>
                <CardHeader>
                  <CardTitle>スクリーニングを通過しました</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {result.original_conditions && (
                    <div>
                      <Label>条件</Label>
                      <p className="whitespace-pre-wrap text-sm mt-1">
                        {result.original_conditions}
                      </p>
                    </div>
                  )}
                  <div>
                    <Label>理由</Label>
                    <p className="whitespace-pre-wrap text-sm mt-1">
                      {result.reason || '全ての条件を満たしました'}
                    </p>
                  </div>

                  <div>
                    <div className="flex items-center gap-2">
                      <Label>件名</Label>
                      <CopyButton text={result.subject} />
                    </div>
                    <p className="whitespace-pre-wrap text-sm mt-1">
                      {result.subject}
                    </p>
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <Label>本文</Label>
                      <CopyButton text={result.body} />
                    </div>
                    <p className="whitespace-pre-wrap text-sm mt-1">
                      {result.body}
                    </p>
                  </div>
                  {result.resend_subject && (
                    <div>
                      <div className="flex items-center gap-2">
                        <Label>再送件名</Label>
                        <CopyButton text={result.resend_subject} />
                      </div>
                      <p className="whitespace-pre-wrap text-sm mt-1">
                        {result.resend_subject}
                      </p>
                    </div>
                  )}
                  {result.resend_body && (
                    <div>
                      <div className="flex items-center gap-2">
                        <Label>再送本文</Label>
                        <CopyButton text={result.resend_body} />
                      </div>
                      <p className="whitespace-pre-wrap text-sm mt-1">
                        {result.resend_body}
                      </p>
                    </div>
                  )}
                  {result.re_resend_subject && (
                    <div>
                      <div className="flex items-center gap-2">
                        <Label>再々送件名</Label>
                        <CopyButton text={result.re_resend_subject} />
                      </div>
                      <p className="whitespace-pre-wrap text-sm mt-1">
                        {result.re_resend_subject}
                      </p>
                    </div>
                  )}
                  {result.re_resend_body && (
                    <div>
                      <div className="flex items-center gap-2">
                        <Label>再々送本文</Label>
                        <CopyButton text={result.re_resend_body} />
                      </div>
                      <p className="whitespace-pre-wrap text-sm mt-1">
                        {result.re_resend_body}
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>

              {result.failedPatterns && result.failedPatterns.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle>不合格となったパターンと理由</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {result.failedPatterns.map((fp, idx) => (
                      <div key={idx}>
                        <Label>条件</Label>
                        <p className="whitespace-pre-wrap text-sm mt-1">
                          {fp.original_conditions || 'N/A'}
                        </p>
                        <Label className="mt-2">理由</Label>
                        <p className="whitespace-pre-wrap text-sm mt-1">
                          {fp.reason}
                        </p>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              )}
            </>
          )}

          {result && result.passed === 'ng' && (
            <Card>
              <CardHeader>
                <CardTitle>お見送り理由</CardTitle>
              </CardHeader>
              <CardContent>
                {result.failedPatterns && result.failedPatterns.length > 0 ? (
                  <div className="space-y-4 mt-4">
                    {result.failedPatterns.map((fp, idx) => (
                      <div key={idx}>
                        <Label>条件</Label>
                        <p className="whitespace-pre-wrap text-sm mt-1">
                          {fp.original_conditions || 'N/A'}
                        </p>
                        <Label className="mt-2">理由</Label>
                        <p className="whitespace-pre-wrap text-sm mt-1">
                          {fp.reason}
                        </p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="whitespace-pre-wrap text-sm mt-1">
                    条件を満たしていません
                  </p>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}
