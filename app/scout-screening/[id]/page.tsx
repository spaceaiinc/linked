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
import { Switch } from '@/app/components/ui/switch'
import { Badge } from '@/app/components/ui/badge'
import { Plus, Trash2 } from 'lucide-react'
import { useParams } from 'next/navigation'
import { PublicSchemaTables, ScoutScreeningPattern } from '@/lib/types/supabase'

const PREFECTURES = [
  '北海道',
  '青森県',
  '岩手県',
  '宮城県',
  '秋田県',
  '山形県',
  '福島県',
  '茨城県',
  '栃木県',
  '群馬県',
  '埼玉県',
  '千葉県',
  '東京都',
  '神奈川県',
  '新潟県',
  '富山県',
  '石川県',
  '福井県',
  '山梨県',
  '長野県',
  '岐阜県',
  '静岡県',
  '愛知県',
  '三重県',
  '滋賀県',
  '京都府',
  '大阪府',
  '兵庫県',
  '奈良県',
  '和歌山県',
  '鳥取県',
  '島根県',
  '岡山県',
  '広島県',
  '山口県',
  '徳島県',
  '香川県',
  '愛媛県',
  '高知県',
  '福岡県',
  '佐賀県',
  '長崎県',
  '熊本県',
  '大分県',
  '宮崎県',
  '鹿児島県',
  '沖縄県',
]

const VARIABLE_CHIPS = [
  { label: '候補者名/ID', value: '{{candidate_name_id}}' },
  { label: '現職', value: '{{current_position}}' },
]

// Helper function to create a default pass pattern
const createDefaultScoutScreeningPattern = (
  companyId?: string,
  scoutScreeningId?: string
): ScoutScreeningPattern => ({
  id: Date.now().toString(),
  name: `合格パターン${Math.floor(Math.random() * 100) + 1}`,
  company_id: companyId || '',
  scout_screening_id: scoutScreeningId || '',
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
  deleted_at: '',
  age_min: 0,
  age_max: 0,
  exclude_job_changes: 0,
  has_management_experience: false,
  work_location_prefectures: [],
  other_conditions: '',
  subject: '',
  body: '',
  resend_subject: '',
  resend_body: '',
  re_resend_subject: '',
  re_resend_body: '',
})

export default function ScoutScreeningPage() {
  const params = useParams()
  const id = params?.id as string | undefined

  const [companyName, setCompanyName] = useState('')
  const [jobTitle, setJobTitle] = useState('')
  const [patterns, setScoutScreeningPatterns] = useState<
    ScoutScreeningPattern[]
  >([])
  const [isLoading, setIsLoading] = useState(true)

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

            if (patternError) {
              console.error(
                'Error fetching scout_screening_patterns:',
                patternError
              )
              setScoutScreeningPatterns([
                createDefaultScoutScreeningPattern(companyId),
              ])
            } else if (companyPatternsData && companyPatternsData.length > 0) {
              const mappedPatterns: ScoutScreeningPattern[] =
                companyPatternsData.map((p: any) => ({
                  id: `${Date.now().toString()}-${Math.random().toString(36).substring(2, 9)}`,
                  name: p.name || '無名パターン',
                  company_id: p.company_id || companyId,
                  scout_screening_id: '',
                  created_at: p.created_at || new Date().toISOString(),
                  updated_at: p.updated_at || new Date().toISOString(),
                  deleted_at: p.deleted_at || '',
                  age_min: p.age_min || 0,
                  age_max: p.age_max || 0,
                  exclude_job_changes: p.exclude_job_changes || 0,
                  has_management_experience:
                    p.has_management_experience || false,
                  work_location_prefectures: (
                    p.work_location_prefectures || []
                  ).map((item: string | number) => {
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
                  }),
                  other_conditions: p.other_conditions || '',
                  subject: p.subject || '',
                  body: p.body || '',
                  resend_subject: p.resend_subject || '',
                  resend_body: p.resend_body || '',
                  re_resend_subject: p.re_resend_subject || '',
                  re_resend_body: p.re_resend_body || '',
                }))
              setScoutScreeningPatterns(
                mappedPatterns.length > 0
                  ? mappedPatterns
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
            mappedPatternsForLoad as ScoutScreeningPattern[]
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

  const addScoutScreeningPattern = () => {
    const companyId = patterns[0]?.company_id || ''
    const currentScreeningId = id
    const newPattern: ScoutScreeningPattern =
      createDefaultScoutScreeningPattern(companyId, currentScreeningId)
    newPattern.name = `合格${patterns.length + 1}`
    setScoutScreeningPatterns([...patterns, newPattern])
  }

  const removeScoutScreeningPattern = (patternId: string) => {
    setScoutScreeningPatterns(
      patterns.filter((pattern) => pattern.id !== patternId)
    )
  }

  const updateScoutScreeningPattern = (
    id: string,
    updates: Partial<ScoutScreeningPattern>
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

  const handleSave = async () => {
    const supabase = createClient()
    try {
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser()

      if (userError || !user) {
        console.error('Error fetching user:', userError)
        alert('ユーザー情報の取得に失敗しました。')
        return
      }

      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('company_id')
        .eq('id', user.id)
        .single()

      if (profileError || !profile || !profile.company_id) {
        console.error('Error fetching profile or company_id:', profileError)
        alert('企業情報の取得に失敗しました。')
        return
      }

      const companyId = profile.company_id

      // Ensure all patterns have company_id and currentScreeningId (if new screening)
      const screeningIdForPatterns = id || 'temp-id' // Placeholder if new

      const screeningPayloadBase: PublicSchemaTables['scout_screenings']['Insert'] =
        {
          id: id,
          company_id: companyId,
          user_id: user.id,
          company_name: companyName,
          job_title: jobTitle,
        }

      console.log('id', id)
      if (!id) {
        return
      }
      // Update existing record
      const { data: screeningData, error: screeningError } = await supabase
        .from('scout_screenings')
        .update(screeningPayloadBase)
        .eq('id', id)
      // .select()
      // .single()

      if (screeningError) {
        console.error('Error updating screening:', screeningError)
        alert('スクリーニングの更新に失敗しました。')
        return
      }
      alert('スクリーニングを更新しました！')
      console.log('Screening updated:', screeningData)
      // } else {
      //   // Insert new record
      //   const { data: screeningData, error: screeningError } = await supabase
      //     .from('scout_screenings')
      //     .insert({ ...screeningPayloadBase, user_id: user.id })
      //     .select()
      //     .single()

      //   if (screeningError) {
      //     console.error('Error inserting screening:', screeningError)
      //     alert('スクリーニングの保存に失敗しました。')
      //     return
      //   }
      //   alert('スクリーニングを保存しました！')
      //   console.log('Screening saved:', screeningData)
      // }

      let dbPatterns: ScoutScreeningPattern[] = []
      if (id) {
        const { data: existingPatternsData, error: fetchExistingError } =
          await supabase
            .from('scout_screening_patterns')
            .select('*')
            .eq('scout_screening_id', id)
        if (fetchExistingError) {
          console.error(
            'Error fetching existing patterns for update:',
            fetchExistingError
          )
        } else {
          dbPatterns = existingPatternsData || []
        }
      }

      const patternsToSave = patterns.map((p) => {
        // If p.id is a client-generated ID (e.g., starts with timestamp), it means it's a new pattern.
        // For new patterns, id should be undefined for upsert to generate a new UUID.
        const isNewPattern =
          p.id.toString().startsWith(Date.now().toString().substring(0, 5)) ||
          !p.scout_screening_id // Heuristic
        return {
          ...p,
          id: isNewPattern ? undefined : p.id, // Let DB generate ID for new patterns
          scout_screening_id: screeningIdForPatterns, // Crucial: associate with the screening
          company_id: companyId, // Ensure company_id is set
        }
      })

      const { data: upsertedPatterns, error: upsertError } = await supabase
        .from('scout_screening_patterns')
        .upsert(patternsToSave)
        .select()

      if (upsertError) throw upsertError

      // Delete patterns that are in dbPatterns but not in patternsToSave (UI state)
      if (id && upsertedPatterns) {
        const uiPatternIds = new Set(patterns.map((p) => p.id))
        const patternsToDelete = dbPatterns.filter(
          (dbP) => !uiPatternIds.has(dbP.id)
        )

        if (patternsToDelete.length > 0) {
          const deleteIds = patternsToDelete.map((p) => p.id)
          const { error: deleteError } = await supabase
            .from('scout_screening_patterns')
            .delete()
            .eq('id', { _in: deleteIds })

          if (deleteError) {
            console.error('Error deleting patterns from database:', deleteError)
          }
        }
      }

      // Update local state with patterns from DB (they now have proper DB IDs)
      if (upsertedPatterns) {
        setScoutScreeningPatterns(
          upsertedPatterns.map((p) => ({ ...p }) as ScoutScreeningPattern)
        )
      }

      if (id) {
        alert('スクリーニングを更新しました！')
      } else {
        alert('スクリーニングを保存しました！')
      }
    } catch (error: any) {
      console.error('Error saving screening:', error)
      alert('予期せぬエラーが発生しました。')
    }
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
                スカウトスクリーニングの基本情報を入力します
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
            defaultValue={patterns[0]?.id || 'new_pattern_placeholder'}
            className="space-y-4"
          >
            <div className="flex items-center justify-between mb-4">
              <TabsList className="flex flex-wrap gap-2 h-auto w-auto">
                {patterns.map((pattern) => (
                  <TabsTrigger key={pattern.id} value={pattern.id}>
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
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>年齢（最小）</Label>
                        <Input
                          type="number"
                          placeholder="例: 25"
                          value={
                            pattern.age_min === 0 &&
                            !pattern.id.startsWith('Dat')
                              ? ''
                              : pattern.age_min || ''
                          }
                          onChange={(e) =>
                            updateScoutScreeningPattern(pattern.id, {
                              age_min: e.target.value
                                ? parseInt(e.target.value)
                                : 0,
                            })
                          }
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>年齢（最大）</Label>
                        <Input
                          type="number"
                          placeholder="例: 35"
                          value={
                            pattern.age_max === 0 &&
                            !pattern.id.startsWith('Dat')
                              ? ''
                              : pattern.age_max || ''
                          }
                          onChange={(e) =>
                            updateScoutScreeningPattern(pattern.id, {
                              age_max: e.target.value
                                ? parseInt(e.target.value)
                                : 0,
                            })
                          }
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label>転職経験（この回数以上を除外）</Label>
                      <Input
                        type="number"
                        placeholder="例: 3"
                        value={
                          pattern.exclude_job_changes === 0 &&
                          !pattern.id.startsWith('Dat')
                            ? ''
                            : pattern.exclude_job_changes || ''
                        }
                        onChange={(e) =>
                          updateScoutScreeningPattern(pattern.id, {
                            exclude_job_changes: e.target.value
                              ? parseInt(e.target.value)
                              : 0,
                          })
                        }
                      />
                    </div>

                    <div className="flex items-center space-x-2">
                      <Switch
                        checked={pattern.has_management_experience || false}
                        onCheckedChange={(checked) =>
                          updateScoutScreeningPattern(pattern.id, {
                            has_management_experience: checked,
                          })
                        }
                      />
                      <Label>マネジメント経験あり</Label>
                    </div>

                    <div className="space-y-2">
                      <Label>勤務地（都道府県）- 複数選択可</Label>
                      <div className="border rounded-md p-3 max-h-48 overflow-y-auto bg-white">
                        {PREFECTURES.map((prefecture) => (
                          <div
                            key={prefecture}
                            className="flex items-center space-x-2 mb-2"
                          >
                            <input
                              type="checkbox"
                              id={`${pattern.id}-${prefecture}`}
                              checked={
                                pattern.work_location_prefectures?.includes(
                                  prefecture
                                ) || false
                              }
                              onChange={(e) => {
                                const currentPrefectures =
                                  pattern.work_location_prefectures || []
                                const newPrefectures = e.target.checked
                                  ? [...currentPrefectures, prefecture]
                                  : currentPrefectures.filter(
                                      (p) => p !== prefecture
                                    )
                                updateScoutScreeningPattern(pattern.id, {
                                  work_location_prefectures:
                                    newPrefectures.length > 0
                                      ? newPrefectures
                                      : [],
                                })
                              }}
                              className="w-4 h-4 border-gray-300 rounded text-gray-600 focus:ring-gray-500 bg-white"
                            />
                            <label
                              htmlFor={`${pattern.id}-${prefecture}`}
                              className="text-sm cursor-pointer"
                            >
                              {prefecture}
                            </label>
                          </div>
                        ))}
                      </div>
                      {pattern.work_location_prefectures &&
                        pattern.work_location_prefectures.length > 0 && (
                          <div className="text-sm text-gray-600 mt-2">
                            選択中:{' '}
                            {pattern.work_location_prefectures
                              .map((item) => {
                                const num = Number(item) // Try to convert item to a number
                                // Check if it's a valid number and a valid index for PREFECTURES
                                // and if the original item string consists purely of digits.
                                if (
                                  !isNaN(num) &&
                                  num >= 0 &&
                                  num < PREFECTURES.length &&
                                  String(item).match(/^\d+$/)
                                ) {
                                  return PREFECTURES[num]
                                }
                                // If it's not a numeric index, assume it's already a prefecture name
                                return String(item)
                              })
                              .join(', ')}
                          </div>
                        )}
                    </div>

                    <div className="space-y-2">
                      <Label>その他の条件（自由記述）</Label>
                      <Textarea
                        placeholder="例: 英語力TOEIC800点以上、プログラミング経験3年以上"
                        value={pattern.other_conditions || ''}
                        onChange={(e) =>
                          updateScoutScreeningPattern(pattern.id, {
                            other_conditions: e.target.value,
                          })
                        }
                        rows={3}
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
              設定を保存
            </Button>
          </div>
        </>
      )}
    </div>
  )
}
