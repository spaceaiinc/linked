'use client'

import { useState } from 'react'
import { Button } from '@/app/components/ui/button'
import { Input } from '@/app/components/ui/input'
import { Label } from '@/app/components/ui/label'
import { Textarea } from '@/app/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/app/components/ui/select'
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
import { Plus, Trash2 } from 'lucide-react'

interface EmailTemplate {
  subject: string
  body: string
  resendSubject: string
  resendBody: string
  reResendSubject: string
  reResendBody: string
}

interface Condition {
  ageMin?: number
  ageMax?: number
  excludeJobChanges?: number
  hasManagementExperience?: boolean
  workLocationPrefectures?: string[]
  customConditions?: string
}

interface PassPattern {
  id: string
  name: string
  emailTemplate: EmailTemplate
  condition: Condition
}

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

export default function ScoutScreeningPage() {
  const [passPatterns, setPassPatterns] = useState<PassPattern[]>([
    {
      id: '1',
      name: '合格1',
      emailTemplate: {
        subject: '',
        body: '',
        resendSubject: '',
        resendBody: '',
        reResendSubject: '',
        reResendBody: '',
      },
      condition: {
        hasManagementExperience: false,
      },
    },
  ])

  const addPassPattern = () => {
    const newPattern: PassPattern = {
      id: Date.now().toString(),
      name: `合格${passPatterns.length + 1}`,
      emailTemplate: {
        subject: '',
        body: '',
        resendSubject: '',
        resendBody: '',
        reResendSubject: '',
        reResendBody: '',
      },
      condition: {
        hasManagementExperience: false,
      },
    }
    setPassPatterns([...passPatterns, newPattern])
  }

  const removePassPattern = (id: string) => {
    setPassPatterns(passPatterns.filter((pattern) => pattern.id !== id))
  }

  const updatePassPattern = (id: string, updates: Partial<PassPattern>) => {
    setPassPatterns(
      passPatterns.map((pattern) =>
        pattern.id === id ? { ...pattern, ...updates } : pattern
      )
    )
  }

  const updateEmailTemplate = (
    id: string,
    field: keyof EmailTemplate,
    value: string
  ) => {
    setPassPatterns(
      passPatterns.map((pattern) =>
        pattern.id === id
          ? {
              ...pattern,
              emailTemplate: { ...pattern.emailTemplate, [field]: value },
            }
          : pattern
      )
    )
  }

  const updateCondition = (id: string, field: keyof Condition, value: any) => {
    setPassPatterns(
      passPatterns.map((pattern) =>
        pattern.id === id
          ? { ...pattern, condition: { ...pattern.condition, [field]: value } }
          : pattern
      )
    )
  }

  const handleSave = () => {
    // TODO: Save to database
    console.log('Saving pass patterns:', passPatterns)
    alert('設定を保存しました')
  }

  return (
    <div className="container mx-auto py-8 px-4 max-w-6xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">スカウトスクリーニング設定</h1>
        <p className="text-gray-600">
          候補者の自動スクリーニング条件と通過時の送信文を設定します
        </p>
      </div>

      <Tabs defaultValue={passPatterns[0]?.id} className="space-y-4">
        <div className="flex items-center justify-between mb-4">
          <TabsList className="grid grid-cols-auto gap-2 w-auto">
            {passPatterns.map((pattern, index) => (
              <TabsTrigger key={pattern.id} value={pattern.id}>
                パターン{index + 1}
              </TabsTrigger>
            ))}
          </TabsList>
          <Button onClick={addPassPattern} size="sm" variant="outline">
            <Plus className="w-4 h-4 mr-2" />
            パターンを追加
          </Button>
        </div>

        {passPatterns.map((pattern) => (
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
                  {passPatterns.length > 1 && (
                    <Button
                      onClick={() => removePassPattern(pattern.id)}
                      size="sm"
                      variant="destructive"
                    >
                      <Trash2 className="w-4 h-4 mr-2" />
                      削除
                    </Button>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                <Input
                  value={pattern.name}
                  onChange={(e) =>
                    updatePassPattern(pattern.id, { name: e.target.value })
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
                      value={pattern.condition.ageMin || ''}
                      onChange={(e) =>
                        updateCondition(
                          pattern.id,
                          'ageMin',
                          e.target.value ? parseInt(e.target.value) : undefined
                        )
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>年齢（最大）</Label>
                    <Input
                      type="number"
                      placeholder="例: 35"
                      value={pattern.condition.ageMax || ''}
                      onChange={(e) =>
                        updateCondition(
                          pattern.id,
                          'ageMax',
                          e.target.value ? parseInt(e.target.value) : undefined
                        )
                      }
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>転職経験（この回数以上を除外）</Label>
                  <Input
                    type="number"
                    placeholder="例: 3"
                    value={pattern.condition.excludeJobChanges || ''}
                    onChange={(e) =>
                      updateCondition(
                        pattern.id,
                        'excludeJobChanges',
                        e.target.value ? parseInt(e.target.value) : undefined
                      )
                    }
                  />
                </div>

                <div className="flex items-center space-x-2">
                  <Switch
                    checked={pattern.condition.hasManagementExperience || false}
                    onCheckedChange={(checked) =>
                      updateCondition(
                        pattern.id,
                        'hasManagementExperience',
                        checked
                      )
                    }
                  />
                  <Label>マネジメント経験あり</Label>
                </div>

                <div className="space-y-2">
                  <Label>勤務地（都道府県）- 複数選択可</Label>
                  <div className="border rounded-md p-3 max-h-48 overflow-y-auto">
                    {PREFECTURES.map((prefecture) => (
                      <div
                        key={prefecture}
                        className="flex items-center space-x-2 mb-2"
                      >
                        <input
                          type="checkbox"
                          id={`${pattern.id}-${prefecture}`}
                          checked={
                            pattern.condition.workLocationPrefectures?.includes(
                              prefecture
                            ) || false
                          }
                          onChange={(e) => {
                            const currentPrefectures =
                              pattern.condition.workLocationPrefectures || []
                            const newPrefectures = e.target.checked
                              ? [...currentPrefectures, prefecture]
                              : currentPrefectures.filter(
                                  (p) => p !== prefecture
                                )
                            updateCondition(
                              pattern.id,
                              'workLocationPrefectures',
                              newPrefectures.length > 0
                                ? newPrefectures
                                : undefined
                            )
                          }}
                          className="w-4 h-4 border-gray-300 rounded text-blue-600 focus:ring-blue-500"
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
                  {pattern.condition.workLocationPrefectures &&
                    pattern.condition.workLocationPrefectures.length > 0 && (
                      <div className="text-sm text-gray-600 mt-2">
                        選択中:{' '}
                        {pattern.condition.workLocationPrefectures.join(', ')}
                      </div>
                    )}
                </div>

                <div className="space-y-2">
                  <Label>その他の条件（自由記述）</Label>
                  <Textarea
                    placeholder="例: 英語力TOEIC800点以上、プログラミング経験3年以上"
                    value={pattern.condition.customConditions || ''}
                    onChange={(e) =>
                      updateCondition(
                        pattern.id,
                        'customConditions',
                        e.target.value
                      )
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
                    <Label>件名</Label>
                    <Input
                      placeholder="例: 【重要】選考通過のお知らせ"
                      value={pattern.emailTemplate.subject}
                      onChange={(e) =>
                        updateEmailTemplate(
                          pattern.id,
                          'subject',
                          e.target.value
                        )
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>本文</Label>
                    <Textarea
                      placeholder="例: お世話になっております。この度は..."
                      value={pattern.emailTemplate.body}
                      onChange={(e) =>
                        updateEmailTemplate(pattern.id, 'body', e.target.value)
                      }
                      rows={5}
                    />
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">再送信</h3>
                  <div className="space-y-2">
                    <Label>件名</Label>
                    <Input
                      placeholder="例: 【再送】選考通過のお知らせ"
                      value={pattern.emailTemplate.resendSubject}
                      onChange={(e) =>
                        updateEmailTemplate(
                          pattern.id,
                          'resendSubject',
                          e.target.value
                        )
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>本文</Label>
                    <Textarea
                      placeholder="例: 先日お送りしたメールについて..."
                      value={pattern.emailTemplate.resendBody}
                      onChange={(e) =>
                        updateEmailTemplate(
                          pattern.id,
                          'resendBody',
                          e.target.value
                        )
                      }
                      rows={5}
                    />
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">再々送信</h3>
                  <div className="space-y-2">
                    <Label>件名</Label>
                    <Input
                      placeholder="例: 【最終確認】選考通過のお知らせ"
                      value={pattern.emailTemplate.reResendSubject}
                      onChange={(e) =>
                        updateEmailTemplate(
                          pattern.id,
                          'reResendSubject',
                          e.target.value
                        )
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>本文</Label>
                    <Textarea
                      placeholder="例: 度々のご連絡となり恐れ入りますが..."
                      value={pattern.emailTemplate.reResendBody}
                      onChange={(e) =>
                        updateEmailTemplate(
                          pattern.id,
                          'reResendBody',
                          e.target.value
                        )
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
        <Button onClick={handleSave} size="lg" className="text-white">
          設定を保存
        </Button>
      </div>
    </div>
  )
}
