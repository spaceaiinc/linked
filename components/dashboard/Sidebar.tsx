'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import React, { useState, useCallback, useEffect } from 'react'
import { twMerge } from 'tailwind-merge'
import { Heading } from './Heading'
import { IconLayoutSidebarRightCollapse } from '@tabler/icons-react'
import { isMobile } from '@/lib/utils'
import { IconFileText, IconLogout, IconLogin } from '@tabler/icons-react'
import { User } from '@supabase/supabase-js'
import { navlinks } from './links'
import { Button } from '../ui/button'
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from '@/components/ui/select'
import { providerAtom, providersAtom } from '@/lib/atom'
import { useAtom } from 'jotai'

type Navlink = {
  href: string
  label: string
  icon?: React.ReactNode | any
  isExternal?: boolean
}

// 【具体のやりたいこと】
// 確認済み：
// つながり申請の自動化
// 指定ユーザー（キーマン）の投稿のURL収集＆最新投稿へのいいね
// 自身の投稿へいいねをくれた人へのコメントと投稿へのいいね
// プロフィール内の職歴（Experience）の一括ダウンロード
// 指定の検索条件（「人材紹介　CEO」など）に合致するユーザーのリストをCSVでエクスポートする
// 特定のユーザーがいいね・コメントした対象投稿のリストアップ
// 自身の投稿関連（自分の投稿へのコメントへのいいね、コメントは除ける）
// 自分の投稿にいいねをくれたユーザーのリストアップ
// 求人データのダウンロード（詳細の大きなテキスト含む）

// 確認中：
// 外からプロフィールURLをCSVでアップロードしてそのユーザーにつながり申請をまとめて送る（＆100通を5日に分けて20通送る）
// （他ユーザーのプロフィール閲覧自動化）

// 今後やりたいこと
// 中小以下向けセールスエージェント
// つながり申請後に承認されたタイミングで通知する機能
// 申請許可ユーザーのリストアップと営業ターゲットかどうかの判定&適切なタイミングのレコメンド(投稿直後、よく活動する時間など)
// Googleアラートと連携して登録した関心分野のニュースを自動てレコメンド&投稿の素案をAIが作ってくれる機能(テイストを微調整)
// LinkedInLiveとの連携機能
// 潜在顧客のスコアリング機能
// 自分からつながり申請・相手からつながり申請の可視化
// 申請承認タイミングの明示
// 直近投稿・およびいいね・コメント対象ポストから関心分野の特定
// 直近投稿を分析して生成AIをかませて、「彼は今○○の分野に関心があります」的なポップアップをくれるイメージ。これはできそう
// いいね・コメント対象投稿のリストが取れるといろいろ分析に使えそう
// 適切なDMタイミングのレコメンド
// 求人データのダウンロード
// 大企業向け別サービス
// 自社社員アカウントの登録・モニタリング機能
// 社員のフォロワーリストの作成、マッピング
// DM内容のモニタリング、コンプラ違反投稿のアラート

const Navigation = React.memo(
  ({
    setOpen,
    user,
  }: {
    setOpen: React.Dispatch<React.SetStateAction<boolean>>
    user: User | null
  }) => {
    const pathname = usePathname()

    const isActive = useCallback(
      (href: string) => pathname === href,
      [pathname]
    )

    const handleSignOut = async () => {
      await fetch('/api/auth/signout', {
        method: 'POST',
      })
      window.location.href = '/auth'
    }

    const otherLinks = [
      { href: '/', label: 'Landing', icon: IconFileText },
      // user
      //   ? {
      //       onClick: handleSignOut,
      //       href: '',
      //       label: `Login: (${user?.email?.split('@')[0]})`,
      //       icon: IconLogout,
      //     }
      //   : {
      //       href: '/auth',
      //       label: `Login`,
      //       icon: IconLogin,
      //     },
    ]

    const renderLinks = useCallback(
      (links: Navlink[], heading: string, defaultExternal: boolean = false) => (
        <>
          <Heading as="p" className="text-sm md:text-sm lg:text-sm px-2 pt-4">
            {heading}
          </Heading>
          {links.map((link: Navlink) => {
            const isExternal = link.isExternal ?? defaultExternal
            return (
              <Link
                key={link.href}
                href={link.href}
                prefetch={!isExternal}
                target={isExternal ? '_blank' : undefined}
                rel={isExternal ? 'noopener noreferrer' : undefined}
                onClick={(e) => {
                  if (link.label === 'Logout') {
                    e.preventDefault()
                    fetch(link.href, { method: 'POST' }).then(() => {
                      window.location.href = '/auth'
                    })
                  } else if (isMobile()) {
                    setOpen(false)
                  }
                }}
                className={twMerge(
                  'text-primary hover:text-primary/50 transition duration-200 flex items-center space-x-2 py-2 px-2 rounded-md text-sm',
                  isActive(link.href) && 'bg-white shadow-lg text-primary'
                )}
              >
                <link.icon
                  className={twMerge(
                    'h-4 w-4 flex-shrink-0',
                    isActive(link.href) && 'text-sky-500'
                  )}
                />
                <span>{link.label}</span>
              </Link>
            )
          })}
        </>
      ),
      [isActive, setOpen, user]
    )

    return (
      <div className="flex flex-col space-y-1 my-10 relative z-40">
        {renderLinks(navlinks, 'Apps')}
        {/* {renderLinks(landingPages, "Landing pages", true)} */}
        {renderLinks(otherLinks, 'Other', true)}
        {user ? (
          <a
            onClick={handleSignOut}
            key={'/auth'}
            className={twMerge(
              'text-primary hover:text-primary/50 transition duration-200 flex items-center space-x-2 py-2 px-2 rounded-md text-sm',
              isActive('/auth') && 'bg-white shadow-lg text-primary'
            )}
          >
            <IconLogout
              className={twMerge(
                'h-4 w-4 flex-shrink-0',
                isActive('/auth') && 'text-sky-500'
              )}
            />
            <span>Logout ({user?.email?.split('@')[0]})</span>
          </a>
        ) : (
          <Link
            href="/auth"
            prefetch={false}
            className={twMerge(
              'text-primary hover:text-primary/50 transition duration-200 flex items-center space-x-2 py-2 px-2 rounded-md text-sm',
              isActive('/auth') && 'bg-white shadow-lg text-primary'
            )}
          >
            <IconLogin
              className={twMerge('h-4 w-4 flex-shrink-0', 'text-sky-500')}
            />
            <span>Login</span>
          </Link>
        )}
      </div>
    )
  }
)

Navigation.displayName = 'Navigation'

const SidebarHeader = React.memo(() => (
  <div className="flex space-x-2">
    <Link className="text-md text-black flex items-center" href="/dashboard">
      {/* <Image
        src="/logo-text.png"
        alt="Linked"
        width={400}
        height={100}
        quality={100}
        className="w-48"
      />
      */}
      <p className="text-5xl font-bold">Linked</p>
    </Link>
  </div>
))

SidebarHeader.displayName = 'SidebarHeader'

export const Sidebar = ({ user }: { user: User | null }) => {
  const [open, setOpen] = useState(false) // 初期状態はサーバーと一致させるため false に設定

  useEffect(() => {
    setOpen(!isMobile()) // クライアントサイドでのみ評価
  }, [])

  const handleSetOpen = useCallback(
    (value: boolean | ((prevState: boolean) => boolean)) => {
      setOpen(value)
    },
    []
  )
  const handleConnect = async () => {
    try {
      // Try to get LinkedIn cookies
      const response = await fetch('/api/provider/auth', {
        method: 'POST',
      })
      // const res: {
      //   object: 'HostedAuthUrl'
      //   url: string
      // }
      // push to url
      if (response.ok) {
        const { url } = await response.json()
        if (url) window.open(url, '_blank')
      }
    } catch (error) {
      console.error('Error checking login status:', error)
    }
  }

  // const [user, _] = useAtom(userAtom)
  const [providers, _] = useAtom(providersAtom)
  const [provider, setProvider] = useAtom(providerAtom)

  return (
    <>
      <div
        className={`lg:block ${
          open ? 'block' : 'hidden'
        } transition-all duration-300 ease-in-out`}
      >
        <div className="px-6 z-40 py-10 bg-neutral-100 max-w-[14rem] lg:w-fit fixed h-screen left-0 flex flex-col justify-between overflow-y-auto">
          <div className="flex-1 overflow-auto no-scrollbar pb-4">
            <SidebarHeader />
            <Navigation setOpen={handleSetOpen} user={user} />
          </div>
          {user ? (
            <>
              <div className="flex justify-center mb-4">
                {providers.length ? (
                  <Select
                    value={provider?.account_id}
                    onValueChange={(value) => {
                      if (value === 'none') return
                      const findedProvider = providers.find(
                        (p) => p.account_id === value
                      )
                      if (findedProvider === undefined || !findedProvider)
                        return
                      setProvider(findedProvider)
                    }}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue className="capitalize">
                        {provider?.public_identifier || 'Select Provider'}
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      {providers.map((key) => (
                        <SelectItem
                          key={key.account_id}
                          value={key.account_id}
                          className="capitalize data-[state=checked]:bg-accent data-[state=checked]:text-accent-foreground"
                        >
                          {key.public_identifier}
                        </SelectItem>
                      ))}
                      <Button
                        onClick={() => handleConnect()}
                        className="bg-white hover:bg-white/10 text-black w-full"
                      >
                        {'LinkedInアカウント追加'}
                      </Button>
                    </SelectContent>
                  </Select>
                ) : (
                  <Button
                    onClick={() => handleConnect()}
                    className="bg-white hover:bg-white/10 text-black w-full"
                  >
                    {'LinkedInアカウント追加'}
                  </Button>
                )}
              </div>
            </>
          ) : null}
          <span className="text-xs text-neutral-400 text-center">
            version@0.1.0
          </span>
        </div>
      </div>
      <button
        className="fixed lg:hidden bottom-4 right-4 h-8 w-8 border border-neutral-200 rounded-full backdrop-blur-sm flex items-center justify-center z-40"
        onClick={() => setOpen(!open)}
      >
        <IconLayoutSidebarRightCollapse className="h-4 w-4 text-primary" />
      </button>
    </>
  )
}
