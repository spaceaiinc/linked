'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/utils/supabase/client'
import { Button } from '@/app/components/ui/button'
import { Input } from '@/app/components/ui/input'
import { Label } from '@/app/components/ui/label'
import { Textarea } from '@/app/components/ui/textarea'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/app/components/ui/card'
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/app/components/ui/tabs'
import { Badge } from '@/app/components/ui/badge'
import { Plus, Trash2 } from 'lucide-react'
import { useParams, useRouter } from 'next/navigation'
import { ScoutScreeningPattern } from '@/lib/types/supabase'
import { PREFECTURES } from '@/lib/utils/prefectures'

const VARIABLE_CHIPS = [
  { label: '候補者名/ID', value: '{{candidate_name_id}}' },
  { label: '現職', value: '{{current_position}}' },
  { label: '年齢', value: '{{age}}' },
  { label: '実績', value: '{{achievement}}' },
]

// 条件入力でワンクリック挿入できるキーワードチップ
const CONDITION_KEYWORDS = [
  { label: '年齢', value: '年齢: ~ 歳の間である。 ' },
  { label: '転職回数', value: '転職回数: 回以上の記載がある場合は除く。 ' },
  { label: '業職種経験', value: ' として 年以上の経験記載がない場合は除く。 ' },
  {
    label: 'マネジメント経験',
    value: 'マネジメント経験の記載がない場合は除く。 ',
  },
]

// Define extended pattern type that includes optional priority
interface PatternWithPriority extends ScoutScreeningPattern {
  priority?: number
}

// Helper function to create a default pass pattern
const createDefaultScoutScreeningPattern = (
  companyId?: string,
  scoutScreeningId?: string,
  priority: number = 0
): PatternWithPriority => ({
  id: `${Date.now().toString()}-${Math.random().toString(36).substring(2, 9)}`,
  name: `合格パターン${Math.floor(Math.random() * 100) + 1}`,
  company_id: companyId || '',
  scout_screening_id: scoutScreeningId || '',
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
  deleted_at: '-infinity',
  original_conditions: '',
  subject: '',
  body: '',
  resend_subject: '',
  resend_body: '',
  re_resend_subject: '',
  re_resend_body: '',
  priority,
})

export default function ScoutScreeningPage() {
  const router = useRouter()
  const params = useParams()
  const id = params?.id as string | undefined

  const [companyName, setCompanyName] = useState('')
  const [jobTitle, setJobTitle] = useState('')
  const [patterns, setScoutScreeningPatterns] = useState<PatternWithPriority[]>(
    []
  )
  const [isLoading, setIsLoading] = useState(true)
  // ドラッグ＆ドロップ用にドラッグ開始インデックスを保持
  const [dragStartIndex, setDragStartIndex] = useState<number | null>(null)
  // アクティブなタブを管理
  const [activeTab, setActiveTab] = useState<string>('')

  useEffect(() => {
    const fetchScreeningData = async () => {
      if (!id) {
        setIsLoading(true)
        const supabase = createClient()
        let companyId: string | undefined

        try {
          const {
            data: { user },
            error: userError,
          } = await supabase.auth.getUser()
          if (userError || !user) {
            console.warn(
              'User not found, cannot fetch company-specific patterns.',
              userError
            )
          } else {
            const { data: profile, error: profileError } = await supabase
              .from('profiles')
              .select('company_id')
              .eq('id', user.id)
              .single()
            if (profileError || !profile?.company_id) {
              console.warn(
                'Company ID not found for user. Cannot fetch company-specific patterns.',
                profileError
              )
            } else {
              companyId = profile.company_id
            }
          }

          if (companyId) {
            const { data: companyPatternsData, error: patternError } =
              await supabase
                .from('scout_screening_patterns')
                .select('*')
                .eq('company_id', companyId)
                .eq('deleted_at', '-infinity')
                .order('priority', { ascending: true })

            if (patternError) {
              console.error(
                'Error fetching scout_screening_patterns:',
                patternError
              )
              setScoutScreeningPatterns([
                createDefaultScoutScreeningPattern(companyId),
              ])
            } else if (companyPatternsData && companyPatternsData.length > 0) {
              const mappedPatterns: PatternWithPriority[] =
                companyPatternsData.map((p: any) => ({
                  id: `${Date.now().toString()}-${Math.random().toString(36).substring(2, 9)}`,
                  name: p.name || '無名パターン',
                  company_id: p.company_id || companyId,
                  scout_screening_id: '',
                  created_at: p.created_at || new Date().toISOString(),
                  updated_at: p.updated_at || new Date().toISOString(),
                  deleted_at: p.deleted_at || '',
                  original_conditions: p.original_conditions || '',
                  subject: p.subject || '',
                  body: p.body || '',
                  resend_subject: p.resend_subject || '',
                  resend_body: p.resend_body || '',
                  re_resend_subject: p.re_resend_subject || '',
                  re_resend_body: p.re_resend_body || '',
                  priority: p.priority || 0,
                }))

              setScoutScreeningPatterns(
                mappedPatterns.length > 0
                  ? renumberPriorities(
                      mappedPatterns.sort(
                        (a, b) => (a.priority || 0) - (b.priority || 0)
                      )
                    )
                  : [createDefaultScoutScreeningPattern(companyId)]
              )
            } else {
              setScoutScreeningPatterns([
                createDefaultScoutScreeningPattern(companyId),
              ])
            }
          } else {
            console.log(
              'No company ID, using default pass pattern without company association.'
            )
            setScoutScreeningPatterns([createDefaultScoutScreeningPattern()])
          }
        } catch (error) {
          console.error(
            'Error fetching initial pass patterns for new screening:',
            error
          )
          setScoutScreeningPatterns([createDefaultScoutScreeningPattern()])
        } finally {
          setIsLoading(false)
        }
        return
      }

      setIsLoading(true)
      const supabase = createClient()
      try {
        const { data, error } = await supabase
          .from('scout_screenings')
          .select('*')
          .eq('id', id)
          .single()

        if (error) {
          console.error('Error fetching screening data:', error)
          alert('スクリーニングデータの取得に失敗しました。')
          setIsLoading(false)
          return
        }

        const { data: patternsData, error: patternsError } = await supabase
          .from('scout_screening_patterns')
          .select('*')
          .eq('scout_screening_id', id)
          .eq('deleted_at', '-infinity')

        if (patternsError) {
          console.error('Error fetching patterns data:', patternsError)
          alert('パターンデータの取得に失敗しました。')
          setIsLoading(false)
          return
        }

        const mappedPatternsForLoad = (patternsData || []).map((p) => ({
          ...p,
          work_location_prefectures: (p.work_location_prefectures || []).map(
            (item: string | number) => {
              const num = Number(item)
              if (
                !isNaN(num) &&
                num >= 0 &&
                num < PREFECTURES.length &&
                String(item).match(/^\d+$/)
              ) {
                return PREFECTURES[num]
              }
              return String(item)
            }
          ),
        }))

        if (data) {
          setCompanyName(data.company_name || '')
          setJobTitle(data.job_title || '')
          setScoutScreeningPatterns(
            renumberPriorities(
              (mappedPatternsForLoad as PatternWithPriority[]).sort(
                (a, b) => (a.priority || 0) - (b.priority || 0)
              )
            )
          )
        }
      } catch (error) {
        console.error('Error in fetchScreeningData for existing ID:', error)
        alert('既存のスクリーニングデータの読み込み中にエラーが発生しました。')
      } finally {
        setIsLoading(false)
      }
    }

    fetchScreeningData()
  }, [id])

  // patternsが更新されたときにactiveTabを設定
  useEffect(() => {
    if (patterns.length > 0 && !activeTab) {
      setActiveTab(patterns[0].id)
    }
  }, [patterns, activeTab])

  const renumberPriorities = (list: PatternWithPriority[]) =>
    list.map((p, idx) => ({ ...p, priority: idx }))

  const addScoutScreeningPattern = () => {
    const companyId = patterns[0]?.company_id || ''
    const currentScreeningId = id
    const newPattern: PatternWithPriority = createDefaultScoutScreeningPattern(
      companyId,
      currentScreeningId,
      patterns.length
    )
    newPattern.name = `合格${patterns.length + 1}`
    const updatedPatterns = renumberPriorities([...patterns, newPattern])
    setScoutScreeningPatterns(updatedPatterns)
    setActiveTab(newPattern.id)
  }

  const removeScoutScreeningPattern = (patternId: string) => {
    const updatedPatterns = renumberPriorities(
      patterns.filter((pattern) => pattern.id !== patternId)
    )
    setScoutScreeningPatterns(updatedPatterns)

    // 削除されたパターンがアクティブタブだった場合、最初のパターンをアクティブにする
    if (activeTab === patternId && updatedPatterns.length > 0) {
      setActiveTab(updatedPatterns[0].id)
    }
  }

  const updateScoutScreeningPattern = (
    id: string,
    updates: Partial<PatternWithPriority>
  ) => {
    setScoutScreeningPatterns(
      patterns.map((pattern) =>
        pattern.id === id ? { ...pattern, ...updates } : pattern
      )
    )
  }

  // Define EmailTextField before its first use in insertVariable
  type EmailTextField =
    | 'subject'
    | 'body'
    | 'resend_subject'
    | 'resend_body'
    | 're_resend_subject'
    | 're_resend_body'

  const insertVariable = (
    patternId: string,
    field: EmailTextField,
    variable: string
  ) => {
    const pattern = patterns.find((p) => p.id === patternId)
    if (!pattern) return

    // Ensure field is a valid key of pattern and its value is string-assignable
    const currentValue = pattern[field] as string | '' // Assert or check type if necessary
    const textarea = document.getElementById(
      `${patternId}-${field}`
    ) as HTMLTextAreaElement

    if (textarea) {
      const start = textarea.selectionStart
      const end = textarea.selectionEnd
      const newValue =
        currentValue.substring(0, start) +
        variable +
        currentValue.substring(end)

      updateScoutScreeningPattern(patternId, { [field]: newValue })

      setTimeout(() => {
        textarea.focus()
        textarea.setSelectionRange(
          start + variable.length,
          start + variable.length
        )
      }, 0)
    }
  }

  // 条件テキストエリアにキーワードを挿入する共通ヘルパー
  const insertConditionKeyword = (patternId: string, keyword: string) => {
    const pattern = patterns.find((p) => p.id === patternId)
    if (!pattern) return

    const currentValue = pattern.original_conditions || ''
    const textarea = document.getElementById(
      `${patternId}-conditions`
    ) as HTMLTextAreaElement

    if (textarea) {
      const start = textarea.selectionStart
      const end = textarea.selectionEnd
      const newValue =
        currentValue.substring(0, start) + keyword + currentValue.substring(end)

      updateScoutScreeningPattern(patternId, { original_conditions: newValue })

      setTimeout(() => {
        textarea.focus()
        textarea.setSelectionRange(
          start + keyword.length,
          start + keyword.length
        )
      }, 0)
    }
  }

  const handleSave = async () => {
    try {
      const response = await fetch('/api/scout-screening', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          scout_screening_id: id,
          company_name: companyName,
          job_title: jobTitle,
          patterns,
        }),
      })

      const result = await response.json()

      if (!response.ok) {
        console.error('Error from API:', result.error)
        alert(result.error || 'スクリーニングの保存に失敗しました。')
        return
      }

      if (result.updated_patterns) {
        router.push(`/scout-screening/${id}`)
        // setScoutScreeningPatterns(
        //   result.updated_patterns as ScoutScreeningPattern[]
        // )
      }

      alert('スクリーニングを更新しました！')
    } catch (error: any) {
      console.error('Error saving screening:', error)
      alert('予期せぬエラーが発生しました。')
    }
  }

  // ドラッグ開始時にインデックスを保存
  const handleDragStart = (index: number) => {
    setDragStartIndex(index)
  }

  // ドロップ時にパターン配列を並び替え
  const handleDrop = (dropIndex: number) => {
    if (dragStartIndex === null || dragStartIndex === dropIndex) return
    const updated = [...patterns]
    const [removed] = updated.splice(dragStartIndex, 1)
    updated.splice(dropIndex, 0, removed)
    const renumberedPatterns = renumberPriorities(updated)
    setScoutScreeningPatterns(renumberedPatterns)
    setDragStartIndex(null)
    // アクティブタブは変更しない（現在選択されているパターンを維持）
  }

  return (
    <div className="container mx-auto py-8 px-4 max-w-6xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">スカウトスクリーニング設定</h1>
        <p className="text-gray-600">
          候補者の自動スクリーニング条件と通過時の送信文を設定します
        </p>
      </div>

      {isLoading ? (
        <p>Loading...</p>
      ) : (
        <>
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>基本情報</CardTitle>
              <CardDescription>
                スカウト判定条件の基本情報を入力します
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="companyName">会社名</Label>
                <Input
                  id="companyName"
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  placeholder="例: 株式会社〇〇"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="jobTitle">求人名</Label>
                <Input
                  id="jobTitle"
                  value={jobTitle}
                  onChange={(e) => setJobTitle(e.target.value)}
                  placeholder="例: フロントエンドエンジニア"
                />
              </div>
            </CardContent>
          </Card>

          <Tabs
            value={activeTab}
            onValueChange={setActiveTab}
            className="space-y-4"
          >
            {/* 優先順位の説明 */}
            <div className="text-xs text-gray-500 mb-2">
              タブは左から右へ優先度が低くなります（ドラッグ＆ドロップで変更可）
            </div>
            <div className="flex items-center justify-between mb-4">
              <TabsList className="flex flex-wrap gap-2 h-auto w-auto">
                {patterns.map((pattern, idx) => (
                  <TabsTrigger
                    key={pattern.id}
                    value={pattern.id}
                    draggable
                    onDragStart={() => handleDragStart(idx)}
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={() => handleDrop(idx)}
                    className="cursor-move"
                  >
                    {pattern.name}
                  </TabsTrigger>
                ))}
              </TabsList>
              <Button
                variant="outline"
                size="sm"
                onClick={addScoutScreeningPattern}
                className="ml-2"
              >
                <Plus className="mr-1 h-4 w-4" />
                追加
              </Button>
            </div>

            {patterns.map((pattern) => (
              <TabsContent
                key={pattern.id}
                value={pattern.id}
                className="space-y-6"
              >
                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle>パターン名</CardTitle>
                        <CardDescription>
                          このスクリーニングパターンの名前を設定します
                        </CardDescription>
                      </div>
                      {patterns.length > 1 && (
                        <Button
                          onClick={() =>
                            removeScoutScreeningPattern(pattern.id)
                          }
                          size="sm"
                          variant="outline"
                          className="text-gray-600 hover:text-gray-800 hover:bg-gray-100"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent>
                    <Input
                      value={pattern.name}
                      onChange={(e) =>
                        updateScoutScreeningPattern(pattern.id, {
                          name: e.target.value,
                        })
                      }
                      placeholder="例: 合格1"
                    />
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>通過条件</CardTitle>
                    <CardDescription>
                      候補者がこのパターンで通過するための条件を設定します
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <Label>条件</Label>
                        <div className="flex gap-2">
                          {CONDITION_KEYWORDS.map((chip) => (
                            <Badge
                              key={chip.value}
                              variant="outline"
                              className="cursor-pointer bg-white hover:bg-gray-100"
                              onClick={() =>
                                insertConditionKeyword(pattern.id, chip.value)
                              }
                            >
                              {chip.label}
                            </Badge>
                          ))}
                        </div>
                      </div>
                      <Textarea
                        id={`${pattern.id}-conditions`}
                        placeholder="例: 年齢 35 以下 かつ 経験年数 3 以上"
                        value={pattern.original_conditions || ''}
                        onChange={(e) =>
                          updateScoutScreeningPattern(pattern.id, {
                            original_conditions: e.target.value,
                          })
                        }
                        rows={20}
                      />
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>送信文設定</CardTitle>
                    <CardDescription>
                      通過時に送信するメールの内容を設定します
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="space-y-4">
                      <h3 className="text-lg font-semibold">初回送信</h3>
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <Label>件名</Label>
                          <div className="flex gap-2">
                            {VARIABLE_CHIPS.map((chip) => (
                              <Badge
                                key={chip.value}
                                variant="outline"
                                className="cursor-pointer bg-white hover:bg-gray-100"
                                onClick={() =>
                                  insertVariable(
                                    pattern.id,
                                    'subject',
                                    chip.value
                                  )
                                }
                              >
                                {chip.label}
                              </Badge>
                            ))}
                          </div>
                        </div>
                        <Input
                          id={`${pattern.id}-subject`}
                          placeholder="例: 【重要】面談日程調整のお知らせ"
                          value={pattern.subject}
                          onChange={(e) =>
                            updateScoutScreeningPattern(pattern.id, {
                              subject: e.target.value,
                            })
                          }
                        />
                      </div>
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <Label>本文</Label>
                          <div className="flex gap-2">
                            {VARIABLE_CHIPS.map((chip) => (
                              <Badge
                                key={chip.value}
                                variant="outline"
                                className="cursor-pointer bg-white hover:bg-gray-100"
                                onClick={() =>
                                  insertVariable(pattern.id, 'body', chip.value)
                                }
                              >
                                {chip.label}
                              </Badge>
                            ))}
                          </div>
                        </div>
                        <Textarea
                          id={`${pattern.id}-body`}
                          placeholder="例: お世話になっております。この度は..."
                          value={pattern.body}
                          onChange={(e) =>
                            updateScoutScreeningPattern(pattern.id, {
                              body: e.target.value,
                            })
                          }
                          rows={5}
                        />
                      </div>
                    </div>

                    <div className="space-y-4">
                      <h3 className="text-lg font-semibold">再送信</h3>
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <Label>件名</Label>
                          <div className="flex gap-2">
                            {VARIABLE_CHIPS.map((chip) => (
                              <Badge
                                key={chip.value}
                                variant="outline"
                                className="cursor-pointer bg-white hover:bg-gray-100"
                                onClick={() =>
                                  insertVariable(
                                    pattern.id,
                                    'resend_subject',
                                    chip.value
                                  )
                                }
                              >
                                {chip.label}
                              </Badge>
                            ))}
                          </div>
                        </div>
                        <Input
                          id={`${pattern.id}-resend_subject`}
                          placeholder="例: 【再送】面談日程調整のお知らせ"
                          value={pattern.resend_subject}
                          onChange={(e) =>
                            updateScoutScreeningPattern(pattern.id, {
                              resend_subject: e.target.value,
                            })
                          }
                        />
                      </div>
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <Label>本文</Label>
                          <div className="flex gap-2">
                            {VARIABLE_CHIPS.map((chip) => (
                              <Badge
                                key={chip.value}
                                variant="outline"
                                className="cursor-pointer bg-white hover:bg-gray-100"
                                onClick={() =>
                                  insertVariable(
                                    pattern.id,
                                    'resend_body',
                                    chip.value
                                  )
                                }
                              >
                                {chip.label}
                              </Badge>
                            ))}
                          </div>
                        </div>
                        <Textarea
                          id={`${pattern.id}-resend_body`}
                          placeholder="例: 先日お送りしたメールについて..."
                          value={pattern.resend_body}
                          onChange={(e) =>
                            updateScoutScreeningPattern(pattern.id, {
                              resend_body: e.target.value,
                            })
                          }
                          rows={5}
                        />
                      </div>
                    </div>

                    <div className="space-y-4">
                      <h3 className="text-lg font-semibold">再々送信</h3>
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <Label>件名</Label>
                          <div className="flex gap-2">
                            {VARIABLE_CHIPS.map((chip) => (
                              <Badge
                                key={chip.value}
                                variant="outline"
                                className="cursor-pointer bg-white hover:bg-gray-100"
                                onClick={() =>
                                  insertVariable(
                                    pattern.id,
                                    're_resend_subject',
                                    chip.value
                                  )
                                }
                              >
                                {chip.label}
                              </Badge>
                            ))}
                          </div>
                        </div>
                        <Input
                          id={`${pattern.id}-re_resend_subject`}
                          placeholder="例: 【最終確認】面談日程調整のお知らせ"
                          value={pattern.re_resend_subject}
                          onChange={(e) =>
                            updateScoutScreeningPattern(pattern.id, {
                              re_resend_subject: e.target.value,
                            })
                          }
                        />
                      </div>
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <Label>本文</Label>
                          <div className="flex gap-2">
                            {VARIABLE_CHIPS.map((chip) => (
                              <Badge
                                key={chip.value}
                                variant="outline"
                                className="cursor-pointer bg-white hover:bg-gray-100"
                                onClick={() =>
                                  insertVariable(
                                    pattern.id,
                                    're_resend_body',
                                    chip.value
                                  )
                                }
                              >
                                {chip.label}
                              </Badge>
                            ))}
                          </div>
                        </div>
                        <Textarea
                          id={`${pattern.id}-re_resend_body`}
                          placeholder="例: 度々のご連絡となり恐れ入りますが..."
                          value={pattern.re_resend_body}
                          onChange={(e) =>
                            updateScoutScreeningPattern(pattern.id, {
                              re_resend_body: e.target.value,
                            })
                          }
                          rows={5}
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            ))}
          </Tabs>

          <div className="mt-8 flex justify-end">
            <Button
              onClick={handleSave}
              size="lg"
              className="bg-primary text-white hover:bg-primary/90"
            >
              更新する
            </Button>
          </div>
        </>
      )}
    </div>
  )
}
