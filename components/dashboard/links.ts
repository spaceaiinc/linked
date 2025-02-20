import {
  IconMicrophone,
  IconFileText,
  IconMessage,
  IconPhoto,
  IconEye,
  IconBolt,
  IconMessage2,
  IconRobot,
  IconCurrencyDollar,
  IconPencil,
  IconHome,
  IconLayoutDashboard,
} from '@tabler/icons-react'

type NavLink = {
  href: string
  label: string
  icon: any
  isExternal?: boolean
  isNew?: boolean
  isUpdated?: boolean
}

export const freeTools = [
  {
    href: 'https://anotherwrapper.com/tools/llm-pricing',
    label: 'LLM Pricing Comparison',
    icon: IconCurrencyDollar,
  },
  {
    href: 'https://anotherwrapper.com/tools/ai-app-generator',
    label: 'AI App Generator',
    icon: IconRobot,
  },
]

export const overviewLinks: NavLink[] = [
  { href: '/apps', label: 'Overview', icon: IconLayoutDashboard },
  {
    href: 'https://anotherwrapper.lemonsqueezy.com/affiliates',
    isExternal: true,
    label: 'Affiliates (50%)',
    icon: IconCurrencyDollar,
  },
]

export const navlinks: NavLink[] = [
  { href: '/dashboard', label: 'Dashboard', icon: IconHome },
  { href: '/search/profile', label: 'プロフィール検索', icon: IconMessage },
  { href: '/search/job', label: '求人検索', icon: IconMessage },
  { href: '/target', label: 'キーマン投稿', icon: IconMessage },
  { href: '/reaction', label: 'コメント反応', icon: IconMessage },
  // { href: '/chat', label: 'Chat', icon: IconMessage },
]

export const otherLinks = [{ href: '/', label: 'Landing', icon: IconFileText }]
