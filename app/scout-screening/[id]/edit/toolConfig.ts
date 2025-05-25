// Please read the @/lib/types/toolconfig file for more details on each field.
import { ToolConfig } from '@/lib/types/toolconfig'

export const toolConfig: ToolConfig = {
  ////// Base config
  company: {
    name: 'Scout Screening',
    theme: '',
    homeUrl: '/',
    appUrl: '/scout-screening',
    description: 'Scout Screening Automation',
    logo: 'https://cdn2.iconfinder.com/data/icons/privacy-policy/512/privacy-data-policy-security-05-512.png',
    navbarLinks: [
      { label: 'Dashboard', href: '/dashboard' },
      { label: 'Scout Screening', href: '/scout-screening' },
      { label: 'Home', href: '/' },
    ],
  },
  ////// SEO stuff
  metadata: {
    title: 'Scout Screening | Linked',
    description: '候補者の自動スクリーニング設定',
    og_image: 'https://linked.spaceai.jp/og.png',
    canonical: 'https://linked.spaceai.jp/scout-screening',
  },

  ////// Paywall
  paywall: true,
  credits: 5,

  ////// Location
  toolPath: 'scout-screening',

  ////// AI config
  aiModel: '',
  systemMessage: '',

  ////// Form input
  type: 'groq',
  fields: [],
  submitText: '保存',
  submitTextGenerating: '保存中',
  responseTitle: '設定を保存しました',
  responseSubTitle: '',

  ////// UI config
  navbarLanding: {
    bgColor: 'primary',
    textColor: 'text-neutral',
    buttonColor: 'accent',
  },

  navbarApp: {
    bgColor: 'base-100',
    textColor: 'text-base-content',
    buttonColor: 'accent',
  },

  footerLanding: {
    bgColor: 'accent',
    textColor: 'white',
  },

  footerApp: {
    bgColor: 'accent',
    textColor: 'white',
  },
}
