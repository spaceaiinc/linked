import { WorkflowType } from './types/master'

export const tools = [
  {
    type: WorkflowType.SEARCH,
    title: 'プロフィール検索',
    tags: [WorkflowType[WorkflowType.SEARCH]],
    image: '/apps/linkedin-logo.jpg',
    description: 'キーワード、検索URLからプロフィール検索を行います。',
  },
  {
    title: 'つながり申請',
    type: WorkflowType.INVITE,
    tags: [WorkflowType[WorkflowType.INVITE]],
    image: '/apps/linkedin-logo.jpg',
    description:
      'キーワードまたは、ユーザーIDのCSVからつながり申請を行います。',
  },
  // {
  //   title: '類似候補者検索',
  //   type: WorkflowType.SIMILAR_SEARCH,
  //   tags: [WorkflowType[WorkflowType.SIMILAR_SEARCH]],
  //   image: '/apps/linkedin-logo.jpg',
  //   description:
  //     '選択したユーザーに経歴、スキル、希望情報が類似した候補者を検索します。',
  // },
  // {
  //   href: '/search/job',
  //   title: '求人検索',
  //   tags: [],
  //   image: '/apps/linkedin-logo.jpg',
  //   description: 'キーワードまたはCSVからCSVエクスポートを行います。',
  // },
  // {
  //   href: '/target',
  //   title: 'キーマン投稿へのいいね',
  //   tags: [],
  //   image: '/apps/linkedin-logo.jpg',
  //   description: '指定ユーザー（キーマン）の投稿のURL収集＆最新投稿へのいいね',
  // },
  // {
  //   href: '/reaction',
  //   title: 'コメントへの反応',
  //   tags: [],
  //   image: '/apps/linkedin-logo.jpg',
  //   description: '自身の投稿へ「いいね」をくれた人へのコメントと投稿へのいいね',
  // },
]
