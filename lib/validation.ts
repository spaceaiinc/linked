import * as yup from 'yup'
import { FormFields } from './types/toolconfig'
import { ActiveTab } from './types/master'

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
export const createWorkflowSchema = yup.object({
  type: yup
    .number()
    .transform((value) =>
      value === '' || isNaN(Number(value)) ? undefined : Number(value)
    )
    .required('Type is required'),
  account_id: yup.string().required('Account ID is required'),
})

export type CreateWorkflowParam = yup.InferType<typeof createWorkflowSchema>

// yupのスキーマ定義
export const createScoutScreeningSchema = yup.object({
  account_id: yup.string().required('Account ID is required'),
})

export type CreateScoutScreeningParam = yup.InferType<
  typeof createScoutScreeningSchema
>

// yupのスキーマ定義
export const searchProfileSchema = yup
  .object({
    // 必須フィールド
    account_id: yup.string().required('Account ID is required'),
    workflow_id: yup.string().required('Workflow ID is required'),
    schedule_id: yup.string().nullable(),
    name: yup.string().required('Name is required'),
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

    // 検索関連フィールド - 条件付きバリデーション
    search_url: yup
      .string()
      .nullable()
      .when('active_tab', {
        is: ActiveTab.SEARCH,
        then: (schema) =>
          schema.required('Search URL is required when active tab is 0'),
        otherwise: (schema) => schema,
      }),

    keywords: yup
      .string()
      .nullable()
      .when('active_tab', {
        is: ActiveTab.KEYWORDS,
        then: (schema) =>
          schema.test({
            name: 'keywords-or-company-urls',
            test: function (value) {
              const { company_urls, company_private_identifiers } = this.parent
              return value ||
                (company_urls && company_urls.length > 0) ||
                (company_private_identifiers &&
                  company_private_identifiers.length > 0)
                ? true
                : this.createError({
                    message:
                      'Keywords or Company URLs are required when active tab is 1',
                  })
            },
          }),
        otherwise: (schema) => schema,
      }),

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

    target_workflow_id: yup
      .string()
      .nullable()
      .when('active_tab', {
        is: ActiveTab.LEAD_LIST,
        then: (schema) =>
          schema.required('Lead List ID is required when active tab is 2'),
        otherwise: (schema) => schema,
      }),

    target_public_identifiers: yup
      .array()
      .transform(stringArrayTransformer.transform)
      .default([])
      .when('active_tab', {
        is: (value: number) =>
          value === ActiveTab.FILE_URL || value === ActiveTab.UPLOAD,
        then: (schema) =>
          schema.test({
            name: 'target-public-identifiers-required',
            test: function (value) {
              return value && value.length > 0
                ? true
                : this.createError({
                    message:
                      'Target Public Identifiers are required when active tab is 3 or 4',
                  })
            },
          }),
        otherwise: (schema) => schema,
      }),

    search_reaction_profile_public_identifier: yup
      .string()
      .nullable()
      .when('active_tab', {
        is: ActiveTab.SEARCH_REACTION,
        then: (schema) =>
          schema.required(
            'Profile Public Identifier is required when active tab is 5'
          ),
        otherwise: (schema) => schema,
      }),

    // フォーム関連フィールド
    limit_count: yup
      .number()
      .transform((value) =>
        value === '' || isNaN(Number(value)) ? 10 : Number(value)
      )
      .default(10),
    invitation_message: yup.string().nullable(),
    first_message: yup.string().nullable(),
    first_message_days: yup
      .number()
      .transform((value) =>
        value === '' || isNaN(Number(value)) ? 0 : Number(value)
      )
      .default(0),
    first_message_sent_at: yup.string().nullable(),
    second_message: yup.string().nullable(),
    second_message_days: yup
      .number()
      .transform((value) =>
        value === '' || isNaN(Number(value)) ? 0 : Number(value)
      )
      .default(0),
    second_message_sent_at: yup.string().nullable(),
    third_message: yup.string().nullable(),
    third_message_days: yup
      .number()
      .transform((value) =>
        value === '' || isNaN(Number(value)) ? 0 : Number(value)
      )
      .default(0),
    third_message_sent_at: yup.string().nullable(),

    // スケジュール関連フィールド
    scheduled_hours: yup
      .array()
      .transform(numberArrayTransformer.transform)
      .default([]),
    scheduled_days: yup
      .array()
      .transform(numberArrayTransformer.transform)
      .default([]),
    scheduled_months: yup
      .array()
      .transform(numberArrayTransformer.transform)
      .default([]),
    scheduled_weekdays: yup
      .array()
      .transform(numberArrayTransformer.transform)
      .default([]),

    last_updated_user_id: yup
      .string()
      .required('Last Updated User ID is required'),
    run_limit_count: yup
      .number()
      .transform((value) =>
        value === '' || isNaN(Number(value)) ? 20 : Number(value)
      )
      .default(1000),
    agent_type: yup
      .number()
      .transform((value) =>
        value === '' || isNaN(Number(value)) ? 0 : Number(value)
      )
      .default(0),
    invitation_message_dify_api_key: yup.string().nullable(),
    job_position: yup.string().nullable(),
  })
  .test({
    name: 'required-fields-by-active-tab',
    test: function (values) {
      const {
        active_tab,
        search_url,
        keywords,
        company_urls,
        target_workflow_id,
        target_public_identifiers,
        company_private_identifiers,
        scheduled_hours,
        scheduled_weekdays,
      } = values

      if (scheduled_hours || scheduled_weekdays) {
        if (!scheduled_hours && !scheduled_weekdays) {
          return this.createError({
            message:
              '実行日時を指定する場合は、時間と曜日の両方を指定してください',
          })
        }
      }

      // active_tab が 0 の場合、search_url が必要
      if (active_tab === ActiveTab.SEARCH) {
        if (!search_url) {
          return this.createError({
            path: 'search_url',
            message: 'Search URL is required when active tab is 0',
          })
        }
      }
      // active_tab が 1 の場合、keywords または company_urls が必要
      else if (active_tab === ActiveTab.KEYWORDS) {
        if (
          !keywords &&
          (!company_urls || company_urls.length === 0) &&
          (!company_private_identifiers ||
            company_private_identifiers.length === 0)
        ) {
          return this.createError({
            path: 'keywords',
            message:
              'Keywords or Company URLs are required when active tab is 1',
          })
        }
      }
      // active_tab が 2 の場合、target_workflow_id が必要
      else if (active_tab === ActiveTab.LEAD_LIST) {
        if (!target_workflow_id) {
          return this.createError({
            path: 'target_workflow_id',
            message: 'Lead List ID is required when active tab is 2',
          })
        }
      }
      // active_tab が 3 または 4 の場合、target_public_identifiers が必要
      else if (
        active_tab === ActiveTab.FILE_URL ||
        active_tab === ActiveTab.UPLOAD
      ) {
        if (
          !target_public_identifiers ||
          target_public_identifiers.length === 0
        ) {
          return this.createError({
            path: 'target_public_identifiers',
            message:
              'Target Public Identifiers are required when active tab is 3 or 4',
          })
        }
      } else if (active_tab === ActiveTab.SEARCH_REACTION) {
        if (!values.search_reaction_profile_public_identifier) {
          return this.createError({
            path: 'search_reaction_profile_public_identifier',
            message:
              'Profile Public Identifier is required when active tab is 5',
          })
        }
      }

      // それ以外の場合、エラー
      else {
        return this.createError({
          message:
            'Search URL or Keywords or Mylist ID or Target Public Identifiers is required',
        })
      }

      return true
    },
  })

// 型定義の生成
export type SearchProfileParam = yup.InferType<typeof searchProfileSchema>

// yupのスキーマ定義
export const sendMessageSchema = yup
  .object({
    // 必須フィールド
    account_id: yup.string().required('Account ID is required'),
    workflow_id: yup.string().required('Workflow ID is required'),
    schedule_id: yup.string().nullable(),
    name: yup.string().required('Name is required'),
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

    // 検索関連フィールド - 条件付きバリデーション
    search_url: yup
      .string()
      .nullable()
      .when('active_tab', {
        is: ActiveTab.SEARCH,
        then: (schema) =>
          schema.required('Search URL is required when active tab is 0'),
        otherwise: (schema) => schema,
      }),

    keywords: yup
      .string()
      .nullable()
      .when('active_tab', {
        is: ActiveTab.KEYWORDS,
        then: (schema) =>
          schema.test({
            name: 'keywords-or-company-urls',
            test: function (value) {
              const { company_urls, company_private_identifiers } = this.parent
              return value ||
                (company_urls && company_urls.length > 0) ||
                (company_private_identifiers &&
                  company_private_identifiers.length > 0)
                ? true
                : this.createError({
                    message:
                      'Keywords or Company URLs are required when active tab is 1',
                  })
            },
          }),
        otherwise: (schema) => schema,
      }),

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

    target_workflow_id: yup
      .string()
      .nullable()
      .when('active_tab', {
        is: ActiveTab.LEAD_LIST,
        then: (schema) =>
          schema.required('Lead List ID is required when active tab is 2'),
        otherwise: (schema) => schema,
      }),

    target_public_identifiers: yup
      .array()
      .transform(stringArrayTransformer.transform)
      .default([])
      .when('active_tab', {
        is: (value: number) =>
          value === ActiveTab.FILE_URL || value === ActiveTab.UPLOAD,
        then: (schema) =>
          schema.test({
            name: 'target-public-identifiers-required',
            test: function (value) {
              return value && value.length > 0
                ? true
                : this.createError({
                    message:
                      'Target Public Identifiers are required when active tab is 3 or 4',
                  })
            },
          }),
        otherwise: (schema) => schema,
      }),

    search_reaction_profile_public_identifier: yup
      .string()
      .nullable()
      .when('active_tab', {
        is: ActiveTab.SEARCH_REACTION,
        then: (schema) =>
          schema.required(
            'Profile Public Identifier is required when active tab is 5'
          ),
        otherwise: (schema) => schema,
      }),

    // フォーム関連フィールド
    limit_count: yup
      .number()
      .transform((value) =>
        value === '' || isNaN(Number(value)) ? 10 : Number(value)
      )
      .default(10),
    invitation_message: yup.string().nullable(),
    first_message: yup.string().nullable(),
    first_message_days: yup
      .number()
      .transform((value) =>
        value === '' || isNaN(Number(value)) ? 0 : Number(value)
      )
      .default(0),
    first_message_sent_at: yup.string().nullable(),
    second_message: yup.string().nullable(),
    second_message_days: yup
      .number()
      .transform((value) =>
        value === '' || isNaN(Number(value)) ? 0 : Number(value)
      )
      .default(0),
    second_message_sent_at: yup.string().nullable(),
    third_message: yup.string().nullable(),
    third_message_days: yup
      .number()
      .transform((value) =>
        value === '' || isNaN(Number(value)) ? 0 : Number(value)
      )
      .default(0),
    third_message_sent_at: yup.string().nullable(),

    // スケジュール関連フィールド
    scheduled_hours: yup
      .array()
      .transform(numberArrayTransformer.transform)
      .default([]),
    scheduled_days: yup
      .array()
      .transform(numberArrayTransformer.transform)
      .default([]),
    scheduled_months: yup
      .array()
      .transform(numberArrayTransformer.transform)
      .default([]),
    scheduled_weekdays: yup
      .array()
      .transform(numberArrayTransformer.transform)
      .default([]),

    last_updated_user_id: yup
      .string()
      .required('Last Updated User ID is required'),
    run_limit_count: yup
      .number()
      .transform((value) =>
        value === '' || isNaN(Number(value)) ? 20 : Number(value)
      )
      .default(1000),
    agent_type: yup
      .number()
      .transform((value) =>
        value === '' || isNaN(Number(value)) ? 0 : Number(value)
      )
      .default(0),
    invitation_message_dify_api_key: yup.string().nullable(),
    first_message_dify_api_key: yup.string().nullable(),
    first_message_trigger_type: yup
      .number()
      .transform((value) =>
        value === '' || isNaN(Number(value)) ? 0 : Number(value)
      )
      .default(0),
    job_position: yup.string().nullable(),
  })
  .test({
    name: 'required-fields-by-active-tab',
    test: function (values) {
      const {
        active_tab,
        search_url,
        keywords,
        company_urls,
        target_workflow_id,
        target_public_identifiers,
        company_private_identifiers,
        scheduled_hours,
        scheduled_weekdays,
      } = values

      if (scheduled_hours || scheduled_weekdays) {
        if (!scheduled_hours && !scheduled_weekdays) {
          return this.createError({
            message:
              '実行日時を指定する場合は、時間と曜日の両方を指定してください',
          })
        }
      }

      // active_tab が 0 の場合、search_url が必要
      if (active_tab === ActiveTab.SEARCH) {
        if (!search_url) {
          return this.createError({
            path: 'search_url',
            message: 'Search URL is required when active tab is 0',
          })
        }
      }
      // active_tab が 1 の場合、keywords または company_urls が必要
      else if (active_tab === ActiveTab.KEYWORDS) {
        if (
          !keywords &&
          (!company_urls || company_urls.length === 0) &&
          (!company_private_identifiers ||
            company_private_identifiers.length === 0)
        ) {
          return this.createError({
            path: 'keywords',
            message:
              'Keywords or Company URLs are required when active tab is 1',
          })
        }
      }
      // active_tab が 2 の場合、target_workflow_id が必要
      else if (active_tab === ActiveTab.LEAD_LIST) {
        if (!target_workflow_id) {
          return this.createError({
            path: 'target_workflow_id',
            message: 'Lead List ID is required when active tab is 2',
          })
        }
      }
      // active_tab が 3 または 4 の場合、target_public_identifiers が必要
      else if (
        active_tab === ActiveTab.FILE_URL ||
        active_tab === ActiveTab.UPLOAD
      ) {
        if (
          !target_public_identifiers ||
          target_public_identifiers.length === 0
        ) {
          return this.createError({
            path: 'target_public_identifiers',
            message:
              'Target Public Identifiers are required when active tab is 3 or 4',
          })
        }
      } else if (active_tab === ActiveTab.SEARCH_REACTION) {
        if (!values.search_reaction_profile_public_identifier) {
          return this.createError({
            path: 'search_reaction_profile_public_identifier',
            message:
              'Profile Public Identifier is required when active tab is 5',
          })
        }
      }

      // それ以外の場合、エラー
      else {
        return this.createError({
          message:
            'Search URL or Keywords or Mylist ID or Target Public Identifiers is required',
        })
      }

      return true
    },
  })

// 型定義の生成
export type SendMessageParam = yup.InferType<typeof sendMessageSchema>
