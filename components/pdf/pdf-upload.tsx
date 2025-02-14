'use client'

import React, { useState } from 'react'
import { motion } from 'framer-motion'
import { FileIcon, UploadCloudIcon, LinkIcon, TextIcon } from 'lucide-react'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { Input } from '@/components/ui/input'
import Check from '@/components/alerts/Check'
import { useDropzone } from 'react-dropzone'

interface UploadDialogProps {
  fileUrl: string | null
  fileName: string | null
  setFileUrl: (url: string | null) => void
  setFileName: (name: string | null) => void
  handleUpload: (url: string | null, id: string | null) => Promise<void>
}

const mainVariant = {
  initial: { x: 0, y: 0 },
  animate: { x: 20, y: -20, opacity: 0.9 },
}

function GridPattern() {
  const columns = 41
  const rows = 11
  return (
    <div className="flex bg-gray-100 dark:bg-neutral-900 flex-shrink-0 flex-wrap justify-center items-center gap-x-px gap-y-px scale-105">
      {Array.from({ length: rows }).map((_, row) =>
        Array.from({ length: columns }).map((_, col) => {
          const index = row * columns + col
          return (
            <div
              key={`${col}-${row}`}
              className={`w-10 h-10 flex flex-shrink-0 rounded-[2px] ${
                index % 2 === 0
                  ? 'bg-gray-50 dark:bg-neutral-950'
                  : 'bg-gray-50 dark:bg-neutral-950 shadow-[0px_0px_1px_3px_rgba(255,255,255,1)_inset] dark:shadow-[0px_0px_1px_3px_rgba(0,0,0,1)_inset]'
              }`}
            />
          )
        })
      )}
    </div>
  )
}

interface UploadDialogProps {
  fileUrl: string | null
  fileName: string | null
  setFileUrl: (url: string | null) => void
  setFileName: (name: string | null) => void
  handleUpload: (url: string | null, id: string | null) => Promise<void>
  handleUrlSubmit: () => Promise<void>
  status: string
  response: any
}

const UploadDialog: React.FC<UploadDialogProps> = ({
  fileUrl,
  fileName,
  setFileUrl,
  setFileName,
  handleUpload,
  handleUrlSubmit,
  status,
  response,
}) => {
  const [activeTab, setActiveTab] = useState<string>('upload')
  const [uploading, setUploading] = useState<boolean>(false)
  const [success, setSuccess] = useState<boolean>(false)
  const [error, setError] = useState<string | null>(null)

  const handleFileUpload = async (files: File[]) => {
    const file = files[0]
    if (!file) return

    try {
      setUploading(true)
      setError(null)

      const formData = new FormData()
      formData.append('file', file)
      formData.append('uploadPath', 'pdf')

      const response = await fetch('/api/pdf/upload', {
        method: 'POST',
        body: formData,
      })

      if (!response.ok) {
        throw new Error(`Upload failed: ${response.statusText}`)
      }

      const data = await response.json()
      if (data.error) throw new Error(data.error)

      setFileUrl(data.url)
      setFileName(file.name)
      await handleUpload(data.url, data.documentId)
      setSuccess(true)
    } catch (error) {
      console.error('Upload error:', error)
      setError((error as Error).message)
    } finally {
      setUploading(false)
    }
  }

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    multiple: false,
    onDrop: handleFileUpload,
    accept: {
      'application/pdf': ['.pdf'],
    },
    maxSize: 10 * 1024 * 1024, // 10MB
  })

  if (success) {
    return (
      <div className="w-full max-w-4xl mx-auto p-8">
        <Check>Your File has been uploaded successfully.</Check>
      </div>
    )
  }

  return (
    <div className="w-full max-w-4xl mx-auto">
      <Tabs
        value={activeTab}
        onValueChange={setActiveTab}
        className="w-full space-y-8"
      >
        <div className="flex justify-center">
          <TabsList className="grid grid-cols-2 w-[400px] h-12 items-center bg-neutral-100/50 dark:bg-neutral-900/50 backdrop-blur-sm rounded-full p-1">
            <TabsTrigger
              value="upload"
              className="rounded-full px-6 py-2 data-[state=active]:bg-white dark:data-[state=active]:bg-neutral-800 data-[state=active]:text-primary data-[state=active]:shadow-sm transition-all duration-300"
            >
              <div className="flex items-center gap-2">
                <UploadCloudIcon className="h-4 w-4" />
                <span className="font-medium">Upload File</span>
              </div>
            </TabsTrigger>
            <TabsTrigger
              value="url"
              className="rounded-full px-6 py-2 data-[state=active]:bg-white dark:data-[state=active]:bg-neutral-800 data-[state=active]:text-primary data-[state=active]:shadow-sm transition-all duration-300"
            >
              <div className="flex items-center gap-2">
                {/* <LinkIcon className="h-4 w-4" /> */}
                <TextIcon className="h-4 w-4" />
                <span className="font-medium">Add Keyword</span>
              </div>
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="upload">
          <div {...getRootProps()}>
            <motion.div
              whileHover="animate"
              className="p-10 group/file block rounded-lg cursor-pointer w-full relative overflow-hidden"
            >
              <div className="absolute inset-0 [mask-image:radial-gradient(ellipse_at_center,white,transparent)]">
                <GridPattern />
              </div>

              <div className="flex flex-col items-center justify-center">
                <input {...getInputProps()} />

                <p className="relative z-20 font-sans font-bold text-neutral-700 dark:text-neutral-300 text-base">
                  Upload File Document
                </p>
                <p className="relative z-20 font-sans font-normal text-neutral-400 dark:text-neutral-400 text-base mt-2">
                  {uploading
                    ? 'Uploading...'
                    : isDragActive
                      ? 'Drop your File here...'
                      : 'Drag and drop your File here or click to browse'}
                </p>

                <div className="relative w-full mt-10 max-w-xl mx-auto">
                  <motion.div
                    layoutId="file-upload"
                    variants={mainVariant}
                    transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                    className="relative group-hover/file:shadow-2xl z-40 bg-white dark:bg-neutral-900 flex items-center justify-center h-32 mt-4 w-full max-w-[8rem] mx-auto rounded-md shadow-[0px_10px_50px_rgba(0,0,0,0.1)]"
                  >
                    {uploading ? (
                      <span className="loading loading-spinner loading-md" />
                    ) : isDragActive ? (
                      <FileIcon className="h-8 w-8 text-primary animate-pulse" />
                    ) : (
                      <FileIcon className="h-8 w-8 text-neutral-600 dark:text-neutral-300" />
                    )}
                  </motion.div>
                </div>

                <p className="relative z-20 text-xs text-neutral-400 dark:text-neutral-500 mt-6">
                  Supported format: CSV up to 10MB
                </p>
              </div>
            </motion.div>
          </div>
        </TabsContent>

        <TabsContent value="url">
          <div className="pb-10 w-full max-w-md mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
              className="space-y-4 p-6 rounded-xl bg-white dark:bg-neutral-900 shadow-[0_0_1px_1px_rgba(0,0,0,0.05)] dark:shadow-[0_0_1px_1px_rgba(255,255,255,0.05)]"
            >
              <div className="space-y-3">
                <div>
                  <label className="text-sm font-medium text-neutral-600 dark:text-neutral-400">
                    Document Name
                  </label>
                  <div className="relative mt-1">
                    <Input
                      placeholder="my-document.pdf"
                      value={fileName || ''}
                      onChange={(e) => setFileName(e.target.value)}
                      disabled={uploading || status !== 'Idle'}
                      className="h-10 pl-3 pr-9 bg-neutral-50 dark:bg-neutral-800/50 border-neutral-200 dark:border-neutral-700 rounded-lg focus:ring-1 focus:ring-primary/20 focus:border-primary transition-all duration-300"
                    />
                    <FileIcon className="absolute right-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-400" />
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium text-neutral-600 dark:text-neutral-400">
                    File URL
                  </label>
                  <div className="relative mt-1">
                    <Input
                      placeholder="https://example.com/document.pdf"
                      value={fileUrl || ''}
                      onChange={(e) => setFileUrl(e.target.value)}
                      disabled={uploading || status !== 'Idle'}
                      className="h-10 pl-3 pr-9 bg-neutral-50 dark:bg-neutral-800/50 border-neutral-200 dark:border-neutral-700 rounded-lg focus:ring-1 focus:ring-primary/20 focus:border-primary transition-all duration-300"
                    />
                    <LinkIcon className="absolute right-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-400" />
                  </div>
                </div>
              </div>

              <button
                onClick={handleUrlSubmit}
                disabled={
                  uploading || !fileUrl || !fileName || status !== 'Idle'
                }
                className="w-full h-10 mt-2 px-4 bg-neutral-600 hover:bg-neutral-700 text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 font-medium text-sm"
              >
                {status !== 'Idle' ? (
                  <div className="flex items-center justify-center gap-2">
                    <span className="loading loading-spinner loading-sm" />
                    <span>{status}</span>
                  </div>
                ) : (
                  <div className="flex items-center justify-center gap-2">
                    <UploadCloudIcon className="h-4 w-4" />
                    <span>Add File from URL</span>
                  </div>
                )}
              </button>
            </motion.div>
          </div>
        </TabsContent>
      </Tabs>

      {error && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-4 p-4 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-lg"
        >
          {error}
        </motion.div>
      )}

      {response?.error && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-4 p-4 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-lg"
        >
          {response.error}
        </motion.div>
      )}
    </div>
  )
}

export default UploadDialog
