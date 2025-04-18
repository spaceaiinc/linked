import {
  IconFileText,
  IconRobot,
  IconCurrencyDollar,
  IconHome,
  IconLayoutDashboard,
  IconSubtask,
  IconIcons,
  IconTable,
} from '@tabler/icons-react'
import { IconMessage } from '../ui/icons'

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
    href: 'https://spaceai.jp/tools/llm-pricing',
    label: 'LLM Pricing Comparison',
    icon: IconCurrencyDollar,
  },
  {
    href: 'https://spaceai.jp/tools/ai-app-generator',
    label: 'AI App Generator',
    icon: IconRobot,
  },
]

export const overviewLinks: NavLink[] = [
  { href: '/apps', label: 'Overview', icon: IconLayoutDashboard },
  {
    href: 'https://spaceai.lemonsqueezy.com/affiliates',
    isExternal: true,
    label: 'Affiliates (50%)',
    icon: IconCurrencyDollar,
  },
]

export const navlinks: NavLink[] = [
  { href: '/dashboard', label: 'ダッシュボード', icon: IconHome },
  { href: '/workflow/create', label: 'フロー作成', icon: IconSubtask },
  { href: '/leads', label: 'リード', icon: IconTable },
  // { href: '/similar-leads', label: '類似候補者リスト', icon: IconFileText },
  // { href: '/chat', label: 'チャット', icon: IconMessage },
]

export const otherLinks = [
  { href: '/', label: '使い方ガイド', icon: IconFileText },
]
