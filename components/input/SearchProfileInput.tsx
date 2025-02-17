'use client'

import { useState, ReactElement, useEffect } from 'react'
import Upload from '@/components//input/ImageUpload'
import { useFormData } from '@/lib/hooks/useFormData'
import { RenderFields } from '@/components/input/FormFields'
import { type ToolConfig } from '@/lib/types/toolconfig'
import { LoaderCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { searchResponse } from '@/lib/hooks/SearchResponse'
import Login from '@/components/input/login'
import { motion } from 'framer-motion'
import { FileIcon, UploadCloudIcon, LinkIcon, TextIcon } from 'lucide-react'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import Check from '@/components/alerts/Check'
import { useDropzone } from 'react-dropzone'
import Papa from 'papaparse'
import { Input } from '../ui/input'
import { IconBrandLinkedin } from '@tabler/icons-react'
import { Checkbox } from '../ui/checkbox'
import { createClient } from '@/lib/utils/supabase/client'
import { providerAtom, userAtom } from '@/lib/atom'
import { useAtom } from 'jotai'

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

interface SearchProfileInputCaptureProps {
  emptyStateComponent: ReactElement
  toolConfig: ToolConfig
  userEmail?: string
  credits?: number
}

export default function SearchProfileInputCapture({
  toolConfig,
  emptyStateComponent,
  userEmail,
  credits: initialCredits,
}: SearchProfileInputCaptureProps) {
  const [imageUrl, setImageUrl] = useState<string | null>(null)
  // const [generatedImage, setGeneratedImage] = useState<string | null>(null)

  const [generateResponse, loading] = searchResponse(toolConfig)

  const [formData, handleChange, customHandleChange] = useFormData(
    toolConfig.fields!
  )

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    await generateResponse(formData, event)
  }

  const [activeTab, setActiveTab] = useState<string>('search_url')
  const [uploading, setUploading] = useState<boolean>(false)
  const [success, setSuccess] = useState<boolean>(false)
  const [error, setError] = useState<string | null>(null)

  const handleFileUpload = async (files: File[]) => {
    const file = files[0]
    if (!file) return

    try {
      // ファイルからlinkedin.com/inを含むURLを抽出　全行該当
      const reader = new FileReader()
      reader.onload = (e) => {
        const csv = e.target?.result
        if (typeof csv === 'string') {
          Papa.parse(csv, {
            complete: (result: { data: any[] }) => {
              const urls = result.data
                .map((row) => row[0])
                .filter((url) => url.includes('linkedin.com/in'))
              console.log(urls)
              // [a, b, c]-> a,b,c
              customHandleChange(urls.join(','), 'target_account_urls')
            },
          })
        }
      }
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

  const [user, setUser] = useAtom(userAtom)
  const [provider, setProvider] = useAtom(providerAtom)
  useEffect(() => {
    const f = async () => {
      console.log('user', user)
      console.log('provider', provider)
      customHandleChange('true', 'export_profile')
      customHandleChange('true', 'manual')
      if (provider) customHandleChange(provider.account_id, 'account_id')
    }
    f()
  }, [user, provider])

  return (
    <section className="pb-20 w-full mx-auto">
      <div className="flex flex-col md:flex-row items-stretch gap-8 relative">
        <div className="w-full md:w-1/2 flex">
          {!userEmail ? (
            <div className="w-full flex items-center justify-center">
              <Login />
            </div>
          ) : (
            <div className="flex items-center w-full justify-center">
              <form onSubmit={handleSubmit} className="w-full">
                <div className="flex flex-col items-center">
                  <div className="w-full mb-5">
                    <div key="file_or_keywords" className="mb-5 w-full">
                      <div className="w-full max-w-4xl mx-auto">
                        <Tabs
                          value={activeTab}
                          onValueChange={setActiveTab}
                          className="w-full space-y-8"
                        >
                          <div className="flex justify-center">
                            <TabsList className="flex w-[600px] h-12 items-center bg-neutral-100/50 dark:bg-neutral-900/50 backdrop-blur-sm rounded-full p-1">
                              <TabsTrigger
                                value="search_url"
                                className="flex-1 rounded-full px-6 py-2 data-[state=active]:bg-white dark:data-[state=active]:bg-neutral-800 data-[state=active]:text-primary data-[state=active]:shadow-sm transition-all duration-300"
                              >
                                <div className="flex items-center gap-2">
                                  <IconBrandLinkedin className="h-4 w-4" />
                                  <span className="font-medium">検索URL</span>
                                </div>
                              </TabsTrigger>
                              <TabsTrigger
                                value="keywords"
                                className="flex-1 rounded-full px-6 py-2 data-[state=active]:bg-white dark:data-[state=active]:bg-neutral-800 data-[state=active]:text-primary data-[state=active]:shadow-sm transition-all duration-300"
                              >
                                <div className="flex items-center gap-2">
                                  <TextIcon className="h-4 w-4" />
                                  <span className="font-medium">
                                    キーワード
                                  </span>
                                </div>
                              </TabsTrigger>
                              <TabsTrigger
                                value="url"
                                className="flex-1 rounded-full px-6 py-2 data-[state=active]:bg-white dark:data-[state=active]:bg-neutral-800 data-[state=active]:text-primary data-[state=active]:shadow-sm transition-all duration-300"
                              >
                                <div className="flex items-center gap-2">
                                  <LinkIcon className="h-4 w-4" />
                                  <span className="font-medium">CSV URL</span>
                                </div>
                              </TabsTrigger>
                              <TabsTrigger
                                value="upload"
                                className="flex-1 rounded-full px-6 py-2 data-[state=active]:bg-white dark:data-[state=active]:bg-neutral-800 data-[state=active]:text-primary data-[state=active]:shadow-sm transition-all duration-300"
                              >
                                <div className="flex items-center gap-2">
                                  <UploadCloudIcon className="h-4 w-4" />
                                  <span className="font-medium">
                                    アップロード
                                  </span>
                                </div>
                              </TabsTrigger>
                            </TabsList>
                          </div>
                          <TabsContent value="search_url">
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
                                      検索URL
                                    </label>
                                    <div className="relative mt-1">
                                      <Input
                                        placeholder="https://www.linkedin.com/search/results/profile/..."
                                        value={formData['search_url']}
                                        onChange={(e) =>
                                          handleChange(e, 'search_url')
                                        }
                                        className="h-10 pl-3 pr-9 bg-neutral-50 dark:bg-neutral-800/50 border-neutral-200 dark:border-neutral-700 rounded-lg focus:ring-1 focus:ring-primary/20 focus:border-primary transition-all duration-300"
                                      />
                                      <LinkIcon className="absolute right-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-400" />
                                    </div>
                                  </div>
                                </div>
                              </motion.div>
                            </div>
                          </TabsContent>
                          <TabsContent value="keywords">
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
                                      {'keywords'}
                                    </label>
                                    <div className="relative mt-1">
                                      <Input
                                        value={formData['keywords']}
                                        onChange={(e) =>
                                          handleChange(e, 'keywords')
                                        }
                                        required={false}
                                        placeholder={'人材紹介 CEO'}
                                        id={'keywords'}
                                        name={'keywords'}
                                        className="p-2 text-xs w-full"
                                      />
                                    </div>
                                  </div>
                                  <div>
                                    <label className="text-sm font-medium text-neutral-600 dark:text-neutral-400">
                                      {'つながり'}
                                    </label>
                                    <div className="relative mt-1 grid grid-cols-4 gap-2">
                                      {['1次', '2次', '3次'].map(
                                        (searchType) => (
                                          <label
                                            key={searchType}
                                            className="flex items-center space-x-2"
                                          >
                                            <Checkbox
                                              checked={
                                                formData['network_distance'] ==
                                                searchType
                                              }
                                              onCheckedChange={(e) => {
                                                if (e) {
                                                  handleChange(
                                                    {
                                                      target: {
                                                        value: { searchType },
                                                      },
                                                    } as any,
                                                    'network_distance'
                                                  )
                                                } else {
                                                  handleChange(
                                                    {
                                                      target: {
                                                        value: { searchType },
                                                      },
                                                    } as any,
                                                    'network_distance'
                                                  )
                                                }
                                              }}
                                              className="peer h-4 w-4 shrink-0 rounded-sm border border-primary ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground"
                                            />
                                            <span>{searchType}</span>
                                          </label>
                                        )
                                      )}
                                    </div>
                                  </div>
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
                                      CSV URL
                                    </label>
                                    <div className="relative mt-1">
                                      <Input
                                        placeholder="https://example.com/data.csv"
                                        value={formData['file_url']}
                                        onChange={(e) =>
                                          handleChange(e, 'file_url')
                                        }
                                        className="h-10 pl-3 pr-9 bg-neutral-50 dark:bg-neutral-800/50 border-neutral-200 dark:border-neutral-700 rounded-lg focus:ring-1 focus:ring-primary/20 focus:border-primary transition-all duration-300"
                                      />
                                      <LinkIcon className="absolute right-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-400" />
                                    </div>
                                  </div>
                                </div>
                              </motion.div>
                            </div>
                          </TabsContent>

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
                                    ファイルをアップロード
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
                                      transition={{
                                        type: 'spring',
                                        stiffness: 300,
                                        damping: 20,
                                      }}
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
                      </div>
                    </div>
                    {toolConfig.type === 'vision' && (
                      <Upload
                        uploadConfig={toolConfig.upload}
                        setImageUrl={setImageUrl}
                      />
                    )}
                    <RenderFields
                      fields={toolConfig.fields!}
                      formData={formData}
                      handleChange={handleChange}
                    />
                  </div>
                </div>
                <div className="mb-5 flex justify-center">
                  <Button
                    disabled={
                      (!imageUrl && toolConfig.type === 'vision') || loading
                    }
                    type="submit"
                    className="bg-accent hover:bg-accent/80 text-white w-full"
                  >
                    {!loading ? (
                      toolConfig.submitText
                    ) : (
                      <span className="flex items-center justify-center">
                        <LoaderCircle className="w-4 h-4 mr-2 text-green-500 animate-spin" />
                        {toolConfig.submitTextGenerating}
                      </span>
                    )}
                  </Button>
                </div>
              </form>
            </div>
          )}
        </div>
        <div className="w-full md:w-1/2 mt-16">{emptyStateComponent}</div>{' '}
      </div>
    </section>
  )
}
