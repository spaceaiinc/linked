'use client'

import React, { useState } from 'react'
import { Mail } from 'lucide-react'

interface AuthFormProps {
  next?: string
  onSuccess?: (message: string) => void
  onError?: (message: string) => void
}

export default function AuthForm({ next, onSuccess, onError }: AuthFormProps) {
  const [email, setEmail] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setIsLoading(true)

    try {
      const response = await fetch('/api/auth', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, next }),
      })

      const data = await response.json()

      if (data.status === 'Success') {
        onSuccess?.(data.message)
      } else {
        throw new Error(data.message || 'Failed to send magic link')
      }
    } catch (error) {
      console.error('Error sending magic link:', error)
      onError?.(
        error instanceof Error ? error.message : 'Failed to send magic link'
      )
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      <div className="mb-5 w-full">
        <input
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          type="email"
          placeholder="Your Business Email"
          required
          className="input w-full p-3 rounded-xl shadow-sm focus:outline-none border-base-300 bg-white text-base-content-content"
        />
      </div>

      <div className="relative group">
        <div className="absolute transitiona-all duration-1000 opacity-70 -inset-px bg-gradient-to-r from-[#44BCFF] via-[#FF44EC] to-[#FF675E] rounded-xl blur-lg filter group-hover:opacity-100 group-hover:-inset-1 group-hover:duration-200 "></div>
        <button
          disabled={isLoading}
          title="Send magic link"
          type="submit"
          className="relative rounded-xl w-full h-30 flex flex-shrink-0 content-center items-center justify-center border border-base-200 bg-white px-6 py-3 text-center font-medium text-black shadow-sm hover:bg-gray-50 hover:border-gray-300 focus:outline-none focus:ring-1 focus:ring-offset-2"
          role="button"
        >
          {!isLoading && <Mail className="h-5 w-5 mr-2" />}
          {isLoading ? 'Loading...' : 'Send Magic Link'}
        </button>
      </div>
    </form>
  )
}
