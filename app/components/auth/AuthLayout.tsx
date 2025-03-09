'use client'

import GoogleSignInButton from '@/app/components/auth/GoogleSignInButton'
import AuthForm from '@/app/components/auth/AuthForm'
import MessageDisplay from '@/app/components/auth/MessageDisplay'
import React, { useState } from 'react'
import Logo from '@/app/components/Logo'
import { tosUrl, privacyPolicyUrl } from '@/config'

export default function AuthComponent() {
  const [isLoading, setIsLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [messageType, setMessageType] = useState('')

  const handleLogin = (email: string) => {
    setIsLoading(true)
    fetch('/api/auth', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email }),
    })
      .then((response) => response.json())
      .then((data) => {
        setMessage(data.message)
        setMessageType(data.status === 'Success' ? 'success' : 'error')
        setIsLoading(false)
      })
      .catch((error) => {
        setMessage('An error occurred.')
        setMessageType('error')
        setIsLoading(false)
      })
  }

  return (
    <section className="py-12 bg-base-100 sm:py-16 lg:py-20 w-full h-screen">
      <div className="px-4 mx-auto sm:px-6 lg:px-8 max-w-7xl h-full">
        <div className="text-base-content flex flex-col md:flex-row items-center content-center justify-between max-w-7xl h-full space-y-8 md:space-y-0 md:space-x-4">
          {/* AUTH PART */}
          <div className="w-full md:w-1/2 flex justify-center order-1 md:order-2">
            <div className="max-w-[400px]">
              <div className="flex flex-row mt-4">
                <Logo />
              </div>
              {/* MESSAGES */}
              {message && (
                <MessageDisplay message={message} messageType={messageType} />
              )}
              <div>
                <h1 className="text-xl font-medium mt-8 text-base-content">
                  Please signin to continue.
                </h1>
                {/* <p className="mt-4 text-sm text-base-content">
                  Please login or sign up to continue.
                </p> */}
                <div className="py-6">
                  <AuthForm
                    next={'/dashboard'}
                    onSuccess={(msg) => {
                      setMessage(msg)
                      setMessageType('success')
                    }}
                    onError={(msg) => {
                      setMessage(msg)
                      setMessageType('error')
                    }}
                  />
                </div>
                <div className="flex items-center justify-center">
                  <span className="text-xs text-gray-400">or</span>
                </div>
                <div className="py-6">
                  <div className="relative group">
                    <div className="absolute transitiona-all duration-1000 opacity-70 -inset-px bg-gradient-to-r from-[#44BCFF] via-[#FF44EC] to-[#FF675E] rounded-xl blur-lg filter group-hover:opacity-100 group-hover:-inset-1 group-hover:duration-200 "></div>
                    <GoogleSignInButton />
                  </div>

                  <div className="flex flex-col w-full border-opacity-50">
                    {/* <div className="divider">
                      <p className="text-xs">OR</p>
                    </div>

                    <AuthForm
                      onEmailSubmit={handleLogin}
                      isLoading={isLoading}
                    /> */}

                    <p className="mt-10 text-xs text-gray-400">
                      When creating a new account, you agree to the
                      <a href={tosUrl} target="_blank" className="underline">
                        {' '}
                        terms &amp; conditions
                      </a>{' '}
                      and
                      <a
                        href={privacyPolicyUrl}
                        target="_blank"
                        className="underline"
                      >
                        {' '}
                        privacy policy
                      </a>
                      .{' '}
                    </p>
                  </div>
                </div>
              </div>
              {/* <div className="mt-4 flex items-center justify-center">
                <SocialProof />
              </div> */}
            </div>
          </div>

          {/* IMAGES PART */}
          {/* <div className="w-full md:w-92 lg:w-1/2 overflow-hidden text-center bg-primary rounded-2xl order-2 md:order-1">
            <div className="group relative overflow-hidden transition duration-300 hover:opacity-100">
              <div className="p-12 relative overflow-hidden rounded-lg">
                <img
                  src="/hero.webp"
                  className="w-full group-hover:scale-105  duration-300 transition rounded-md v-lazy-image v-lazy-image-loaded"
                  alt="Auth Image"
                />
              </div>
            </div>
          </div> */}
        </div>
      </div>
    </section>
  )
}
