'use client'

import Image from 'next/image'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import React, { useState, useCallback } from 'react'
import { User } from '@supabase/supabase-js'
import { twMerge } from 'tailwind-merge'
import {
  IconLayoutSidebarRightCollapse,
  IconChevronRight,
} from '@tabler/icons-react'
import { isMobile } from '@/lib/utils'
import { SidebarHistory } from '@/app/components/chat/sidebar/sidebar-history'
import { Heading } from './Heading'
import { IconLogout, IconLogin } from '@tabler/icons-react'
import { navlinks, otherLinks } from './links'
import { providersAtom, providerAtom, loadingAtom } from '@/lib/atom'
import { useAtom } from 'jotai'
import { createClient } from '@/lib/utils/supabase/client'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../ui/select'
import { Button } from '../ui/button'

// Import navlinks from config

interface UnifiedSidebarProps {
  user: User | null
  showChatHistory?: boolean
}

const NewBadge = () => (
  <span className="ml-2 inline-flex items-center rounded-lg bg-sky-500/10 px-1.5 py-0.5 text-[10px] font-medium text-sky-500 ring-1 ring-inset ring-sky-500/20">
    New
  </span>
)

const UpdatedBadge = () => (
  <span className="ml-2 inline-flex items-center rounded-lg bg-green-500/10 px-1.5 py-0.5 text-[10px] font-medium text-green-500 ring-1 ring-inset ring-emerald-500/20">
    Updated
  </span>
)

const SidebarHeader = React.memo(() => (
  <div className="flex space-x-2 pt-8">
    <Link className="px-2 mb-4" href="/">
      {/* <Image
      src="/logo-text.png"
      alt="Logo"
      width={400}
      height={100}
      quality={100}
      className="w-full"
      /> */}
      <p className="text-3xl font-bold">Linked</p>
    </Link>
  </div>
))

SidebarHeader.displayName = 'SidebarHeader'

export function UnifiedSidebar({
  user,
  showChatHistory = false,
}: UnifiedSidebarProps) {
  const [open, setOpen] = useState(!isMobile())
  const [isChatExpanded, setIsChatExpanded] = useState(true)
  const [showAllHistory, setShowAllHistory] = useState(false)
  const pathname = usePathname()

  const isActive = useCallback((href: string) => pathname === href, [pathname])

  // Separate chat link from other navlinks
  const chatLink = navlinks.find((link) => link.label === 'チャット')
  const handleSignOut = async () => {
    await fetch('/api/auth/signout', {
      method: 'POST',
    })
    window.location.href = '/auth'
  }

  const renderLinks = useCallback(
    (links: any[], heading: string, defaultExternal: boolean = false) => {
      // Add logout/login link to otherLinks when rendering that section
      const linksToRender = heading === 'Other' ? [...links] : links

      return (
        <>
          <Heading
            as="p"
            className="text-sm md:text-sm lg:text-sm px-2 pt-2 mb-2"
          >
            {heading}
          </Heading>

          {/* Render other links */}
          {linksToRender.map((link) => {
            if (heading === 'Apps' && link.label === 'チャット') return null
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
                  'text-primary hover:text-primary/50 transition duration-200 flex items-center space-x-2 py-2 px-4 rounded-md text-sm',
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
                {link.isNew && <NewBadge />}
                {link.isUpdated && <UpdatedBadge />}
              </Link>
            )
          })}
          {/* Always render Chat AI first in Demo Apps section */}
          {heading === 'Apps' && chatLink && (
            <>
              {showChatHistory ? (
                <div className="mb-1">
                  <button
                    onClick={() => setIsChatExpanded(!isChatExpanded)}
                    className={twMerge(
                      'w-full text-primary hover:text-primary/50 transition duration-200 flex items-center justify-between py-2 px-4 rounded-md text-sm',
                      pathname.includes('/chat') &&
                        'bg-white shadow-lg text-primary'
                    )}
                  >
                    <div className="flex items-center space-x-2">
                      <chatLink.icon
                        className={twMerge(
                          'h-4 w-4 flex-shrink-0',
                          pathname.includes('/chat') && 'text-sky-500'
                        )}
                      />
                      <span>{chatLink.label}</span>
                      {chatLink.isNew && <NewBadge />}
                    </div>
                    <IconChevronRight
                      className={`h-4 w-4 transition-transform duration-200 ${
                        isChatExpanded ? 'rotate-90' : ''
                      }`}
                    />
                  </button>

                  {isChatExpanded && (
                    <div className="ml-4">
                      <SidebarHistory
                        user={user ?? undefined}
                        limit={3}
                        showAllHistory={showAllHistory}
                        setShowAllHistory={setShowAllHistory}
                      />
                    </div>
                  )}
                </div>
              ) : (
                <Link
                  href={chatLink.href}
                  prefetch={!chatLink.isExternal}
                  target={chatLink.isExternal ? '_blank' : undefined}
                  rel={chatLink.isExternal ? 'noopener noreferrer' : undefined}
                  onClick={() => isMobile() && setOpen(false)}
                  className={twMerge(
                    'text-primary hover:text-primary/50 transition duration-200 flex items-center space-x-2 py-2 px-4 rounded-md text-sm',
                    isActive(chatLink.href) && 'bg-white shadow-lg text-primary'
                  )}
                >
                  <chatLink.icon
                    className={twMerge(
                      'h-4 w-4 flex-shrink-0',
                      isActive(chatLink.href) && 'text-sky-500'
                    )}
                  />
                  <span>{chatLink.label}</span>
                  {chatLink.isNew && <NewBadge />}
                </Link>
              )}
            </>
          )}
        </>
      )
    },
    [
      isActive,
      isChatExpanded,
      pathname,
      user,
      showChatHistory,
      showAllHistory,
      setShowAllHistory,
    ]
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
  const [, setLoading] = useAtom(loadingAtom)
  const handleSelectProvider = async (value: string) => {
    setLoading(true)
    if (value === 'none' || !user) return
    const findedProvider = providers.find((p) => p.account_id === value)
    if (findedProvider === undefined || !findedProvider) return
    setProvider(findedProvider)
    const supabase = createClient()
    const { error } = await supabase
      .from('profiles')
      .update({ selected_provider_id: findedProvider.id })
      .eq('id', user.id)
    if (error) {
      console.error('Error updating profile', error)
    }
    window.location.reload()
    setLoading(false)
  }

  return (
    <>
      <div className={`lg:block ${open ? 'block' : 'hidden'} h-screen`}>
        <div className="px-3 z-40 bg-neutral-100 w-[220px] h-full overflow-hidden flex flex-col">
          <SidebarHeader />
          <div className="flex-1 overflow-y-auto no-scrollbar">
            <div className="flex flex-col space-y-1 relative z-40">
              <div className="flex flex-col">
                {/* {renderLinks(overviewLinks, "Overview")} */}
                {renderLinks(navlinks, 'Apps')}
                {/* {renderLinks(landingPages, "Landing Pages", true)}
                {renderLinks(freeTools, "Free Tools", true)} */}
                {renderLinks(otherLinks, 'Other', true)}
                {user ? (
                  <a
                    onClick={handleSignOut}
                    key={'/auth'}
                    className={twMerge(
                      'text-primary hover:text-primary/50 transition duration-200 flex items-center space-x-2 py-2 px-4 rounded-md text-sm',
                      isActive('/auth') && 'bg-white shadow-lg text-primary'
                    )}
                  >
                    <IconLogout
                      className={twMerge(
                        'h-4 w-4 flex-shrink-0',
                        isActive('/auth') && 'text-sky-500'
                      )}
                    />
                    <span>ログアウト ({user?.email?.split('@')[0]})</span>
                  </a>
                ) : (
                  <Link
                    href="/auth"
                    prefetch={false}
                    className={twMerge(
                      'text-primary hover:text-primary/50 transition duration-200 flex items-center space-x-2 py-2 px-4 rounded-md text-sm',
                      isActive('/auth') && 'bg-white shadow-lg text-primary'
                    )}
                  >
                    <IconLogin
                      className={twMerge(
                        'h-4 w-4 flex-shrink-0',
                        'text-sky-500'
                      )}
                    />
                    <span>ログイン</span>
                  </Link>
                )}
              </div>
            </div>
          </div>
          {user ? (
            <>
              <div className="flex justify-center mb-4">
                {providers.length ? (
                  <Select
                    value={provider?.account_id}
                    onValueChange={(value) => handleSelectProvider(value)}
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
                          className="data-[state=checked]:bg-accent data-[state=checked]:text-accent-foreground"
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
            version@0.1.6
          </span>
          <button
            className="fixed lg:hidden bottom-4 right-4 h-8 w-8 border border-neutral-200 rounded-full backdrop-blur-sm flex items-center justify-center z-40"
            onClick={() => setOpen(!open)}
          >
            <IconLayoutSidebarRightCollapse className="h-4 w-4 text-primary" />
          </button>
        </div>
      </div>
    </>
  )
}
