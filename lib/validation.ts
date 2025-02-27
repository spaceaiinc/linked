import * as yup from 'yup'
import { FormFields } from './types/toolconfig'
import { WorkflowType, NetworkDistance, ActiveTab } from './types/master'

// Yupスキーマの動的生成
const generateValidationSchema = (fields: FormFields[]) => {
  const schemaFields: Record<string, yup.AnySchema> = {}

  fields.forEach((field) => {
    if (field.name && field.validation) {
      schemaFields[field.name] = field.validation
    } else if (field.name) {
      // デフォルトのバリデーション
      if (field.required) {
        schemaFields[field.name] = yup
          .string()
          .required(`${field.label || field.name} is required`)
      } else {
        schemaFields[field.name] = yup.string()
      }
    }
  })

  return yup.object().shape(schemaFields)
}

// 既存の抽出関数
export function extractNumbers(str: string | null): number[] {
  if (!str) return []
  return str.match(/\d+/g)?.map(Number) || []
}

export function extractStrings(str: string | null): string[] {
  if (!str) return []
  return str
    .replace(/[\[\]]/g, '')
    .split(',')
    .filter(Boolean)
}

// yupのトランスフォーマーとして既存関数を利用
const stringArrayTransformer = {
  transform: function (value: any) {
    // nullまたはundefinedの場合は空配列を返す
    if (value === null || value === undefined) {
      return []
    }

    // すでに配列の場合はそのまま返す
    if (Array.isArray(value)) {
      return value
    }

    // 文字列の場合は既存の関数を使用
    if (typeof value === 'string') {
      return extractStrings(value)
    }

    // その他の型の場合は文字列に変換して処理
    return extractStrings(String(value))
  },
}

const numberArrayTransformer = {
  transform: function (value: any) {
    // nullまたはundefinedの場合は空配列を返す
    if (value === null || value === undefined) {
      return []
    }

    // すでに数値配列の場合はそのまま返す
    if (
      Array.isArray(value) &&
      value.every((item) => typeof item === 'number')
    ) {
      return value
    }

    // 文字列配列の場合は結合して処理
    if (Array.isArray(value)) {
      return extractNumbers(value.join(','))
    }

    // 文字列の場合は既存の関数を使用
    if (typeof value === 'string') {
      return extractNumbers(value)
    }

    // 数値の場合は配列に変換
    if (typeof value === 'number') {
      return [value]
    }

    // その他の型の場合は文字列に変換して処理
    return extractNumbers(String(value))
  },
}

// yupのスキーマ定義
export const searchProfileSchema = yup.object({
  // 必須フィールド
  account_id: yup.string().required('Account ID is required'),
  type: yup
    .number()
    .transform((value) =>
      value === '' || isNaN(Number(value)) ? undefined : Number(value)
    )
    .required('Type is required'),
  active_tab: yup
    .number()
    .transform((value) =>
      value === '' || isNaN(Number(value)) ? undefined : Number(value)
    )
    .required('Active tab is required'),

  // 検索関連フィールド
  search_url: yup.string().nullable(),
  target_public_identifiers: yup
    .array()
    .transform(stringArrayTransformer.transform)
    .default([]),
  mylist_id: yup.string().nullable(),
  keywords: yup.string().nullable(),
  company_urls: yup
    .array()
    .transform(stringArrayTransformer.transform)
    .default([]),
  company_private_identifiers: yup
    .array()
    .transform(stringArrayTransformer.transform)
    .default([]),
  network_distance: yup
    .array()
    .transform(numberArrayTransformer.transform)
    .default([]),

  // フォーム関連フィールド
  limit_count: yup
    .number()
    .transform((value) =>
      value === '' || isNaN(Number(value)) ? 10 : Number(value)
    )
    .default(10),
  message: yup.string().nullable(),

  // スケジュール関連フィールド
  scheduled_hours: yup
    .array()
    .transform(numberArrayTransformer.transform)
    .default([]),
  scheduled_days: yup
    .array()
    .transform(numberArrayTransformer.transform)
    .default([]),
  scheduled_weekdays: yup
    .array()
    .transform(numberArrayTransformer.transform)
    .default([]),
  workflow_id: yup.string().nullable(),
})

// 型定義の生成
export type SearchProfileParam = yup.InferType<typeof searchProfileSchema>
