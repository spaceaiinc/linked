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
  // { href: '/chat', label: 'チャット', icon: IconMessage },
  { href: '/dashboard', label: 'ダッシュボード', icon: IconHome },
  { href: '/leads', label: 'リード', icon: IconFileText },
]

export const otherLinks = [
  { href: '/', label: '使い方ガイド', icon: IconFileText },
]
