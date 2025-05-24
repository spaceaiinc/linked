'use client'

import { useState } from 'react'
import { useParams } from 'next/navigation'

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
      <h1 className="text-3xl font-bold mb-4">スカウトスクリーニング実行</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Input side */}
        <Card className="h-fit">
          <CardHeader>
            <CardTitle>候補者情報</CardTitle>
            <CardDescription>
              候補者の情報を入力してください。JSON形式でも自由形式でも構いません。
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Textarea
              value={candidateInfo}
              onChange={(e) => setCandidateInfo(e.target.value)}
              placeholder='{"candidate_name_id":"河村 太郎 123","current_position":"フロントエンドエンジニア","age":"28","achievement":"React歴5年"}'
              className="min-h-[200px]"
            />
            <Button
              onClick={handleExecute}
              disabled={loading || !candidateInfo}
            >
              {loading ? '実行中...' : 'Execute'}
            </Button>
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
            </>
          )}

          {result && result.passed === 'ng' && (
            <Card>
              <CardHeader>
                <CardTitle>スクリーニングに失敗しました</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="whitespace-pre-wrap text-sm mt-1">
                  {result.reason || '条件を満たしていません'}
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}
