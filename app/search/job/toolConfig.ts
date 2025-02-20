// Please read the @/lib/types/toolconfig file for more details on each field.
import { ToolConfig } from '@/lib/types/toolconfig'

export const toolConfig: ToolConfig = {
  ////// Base config
  company: {
    name: '求人検索',
    theme: '',
    homeUrl: '/',
    appUrl: '/dashboard',
    description: 'LinkedIn Automation',
    logo: 'https://cdn2.iconfinder.com/data/icons/privacy-policy/512/privacy-data-policy-security-05-512.png',
    navbarLinks: [
      { label: 'App', href: `/dashboard` },
      { label: 'Home', href: '/' },
      // { label: 'Other apps', href: '/apps' },
      // { label: 'Blog', href: '/blog' },
    ],
  },
  ////// SEO stuff
  metadata: {
    title: 'LinkedIn Automation | Space AI',
    description: 'LinkedIn Automation',
    og_image: 'https://linked.spaceai.jp/og.png',
    canonical: 'https://linked.spaceai.jp/dashboard',
  },

  ////// Paywall
  paywall: true,
  credits: 5,

  ////// Location
  toolPath: '(apps)/linkedin',

  ////// AI config
  aiModel: '',
  systemMessage: '',

  ////// Form input
  type: 'groq',
  fields: [
    {
      label: 'キーワード',
      name: 'keywords',
      type: 'textarea',
      placeholder: '',
      required: true,
    },
    {
      label: '送信数',
      name: 'limit',
      type: 'input',
      inputType: 'number',
      placeholder: '10',
      required: true,
    },
    // {
    //   label: "つながり",
    //   name: "connection_distance",
    //   type: "select",
    //   options: [
    //     "1次",
    //     "2次",
    //     "3次",
    //   ],
    //   required: false,
    //   multiple: true
    // },
    {
      label: '申請時メッセージ',
      name: 'message',
      type: 'textarea',
      placeholder: '',
      required: false,
    },
    // {
    //   label: "👥 Target Audience",
    //   name: "targetAudience",
    //   type: "input",
    //   placeholder:
    //     "Who do you want to reach with your personal brand? (e.g., entrepreneurs, marketers)",
    //   required: true,
    // },
    // {
    //   label: "💼 Desired Personal Brand Image",
    //   name: "desiredPersonalBrandImage",
    //   type: "select",
    //   options: [
    //     "Thought leader/expert",
    //     "Creative/innovative thinker",
    //     "Authentic/transparent storyteller",
    //     "Inspirational/motivational figure",
    //   ],
    //   required: true,
    // },
  ],
  submitText: '実行',
  submitTextGenerating: '実行中',
  responseTitle: '処理が完了しました',
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
