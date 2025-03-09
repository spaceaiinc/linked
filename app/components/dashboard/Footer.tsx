'use client'
import React from 'react'

export const ContentFooter = () => {
  return (
    <div className="p-4 text-center justify-center text-xs text-neutral-500 border-t border-neutral-100">
      ©<span className="font-semibold">{new Date().getFullYear()} </span>
      <a href="https://spaceai.jp" target="_blank" className="font-bold">
        Space AI
      </a>
    </div>
  )
}
