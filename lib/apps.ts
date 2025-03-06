import { WorkflowType } from './types/master'

export const tools = [
  {
    // href: '/search/profile',
    type: WorkflowType.SEARCH,
    title: 'プロフィール出力',
    tags: [],
    image: '/apps/linkedin-logo.jpg',
    description:
      'キーワードまたは、ユーザーIDのCSVからプロフィール検索を行います。',
  },
  {
    // href: '/invite',
    title: 'つながり申請',
    type: WorkflowType.INVITE,
    tags: [],
    image: '/apps/linkedin-logo.jpg',
    description:
      'キーワードまたは、ユーザーIDのCSVからつながり申請を行います。',
  },
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
