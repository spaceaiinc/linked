'use client'

import { useState, ReactElement, useEffect } from 'react'
import { useFormData } from '@/lib/hooks/useFormData'
import { RenderFields } from '@/app/components/input/FormFields'
import { FormFields, type ToolConfig } from '@/lib/types/toolconfig'
import { LoaderCircle } from 'lucide-react'
import { Button } from '@/app/components/ui/button'
import { searchProfileResponse } from '@/lib/hooks/searchProfileResponse'
import Login from '@/app/components/input/login'
import { motion } from 'framer-motion'
import { FileIcon, UploadCloudIcon, LinkIcon, TextIcon } from 'lucide-react'
import {
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
} from '@/app/components/ui/tabs'
import { useDropzone } from 'react-dropzone'
import { Input } from '@/app/components/ui/input'
import { IconBrandLinkedin, IconFile } from '@tabler/icons-react'
import { providerAtom, workflowsAtom } from '@/lib/atom'
import { useAtom } from 'jotai'
import { extractColumnData } from '@/lib/csv'
import CheckboxGroup from '@/app/components/ui/checkbox-group'
import { createClient } from '@/lib/utils/supabase/client'
import { Workflow } from '@/lib/types/supabase'
import { WorkflowType } from '@/lib/types/master'
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../../ui/select'

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

interface InviteInputCaptureProps {
  workflowId: string
  emptyStateComponent: ReactElement
  toolConfig: ToolConfig
  userEmail?: string
  credits?: number
}

export default function InviteInputCapture({
  workflowId,
  toolConfig,
  emptyStateComponent,
  userEmail,
  credits: initialCredits,
}: InviteInputCaptureProps) {
  const [generateResponse, loading] = searchProfileResponse(toolConfig)

  const [formData, handleChange, customHandleChange] = useFormData(
    toolConfig.fields!
  )

  const [activeTab, setActiveTab] = useState<string>('0')
  const [fileUrl, setFileUrl] = useState<string>('')
  const [uploading, setUploading] = useState<boolean>(false)
  const [provider] = useAtom(providerAtom)
  const [defaultActiveTab, setDefaultActiveTab] = useState<string>('')
  const [workflowInDb, setWorkflowInDb] = useState<Workflow | null>(null)
  const [workflows] = useAtom(workflowsAtom)

  useEffect(() => {
    // fetch workflow data
    const f = async () => {
      const supabase = createClient()
      const { data: workflowData, error } = await supabase
        .from('workflows')
        .select('*')
        .eq('id', workflowId)
        .eq('deleted_at', '-infinity')
        .single()
      if (error) {
        console.error('Error fetching workflow:', error)
      }
      if (workflowData) {
        const workflow: Workflow = workflowData
        setWorkflowInDb(workflow)
        customHandleChange(workflowId, 'workflow_id')
        customHandleChange(workflow.name, 'name')
        customHandleChange(
          workflow.last_updated_user_id,
          'last_updated_user_id'
        )
        if (workflow.search_url) {
          customHandleChange(workflow.search_url, 'search_url')
          setActiveTab('0')
          setDefaultActiveTab('0')
        } else if (
          workflow.keywords ||
          workflow.company_private_identifiers.length
        ) {
          customHandleChange(workflow.keywords, 'keywords')
          customHandleChange(
            workflow.company_private_identifiers.join(','),
            'company_private_identifiers'
          )
          customHandleChange(
            workflow.network_distance.join(','),
            'network_distance'
          )
          setActiveTab('1')
          setDefaultActiveTab('1')
        } else if (workflow.target_workflow_id) {
          customHandleChange(workflow.target_workflow_id, 'target_workflow_id')
          setActiveTab('2')
          setDefaultActiveTab('2')
        }
        customHandleChange(workflow.limit_count.toString(), 'limit_count')
        customHandleChange(workflow.invitation_message, 'invitation_message')
        // customHandleChange(
        //   workflow.scheduled_months.join(','),
        //   'scheduled_months'
        // )
        customHandleChange(
          workflow.scheduled_hours.join(','),
          'scheduled_hours'
        )
        customHandleChange(workflow.scheduled_days.join(','), 'scheduled_days')
        customHandleChange(
          workflow.scheduled_weekdays.join(','),
          'scheduled_weekdays'
        )
      }
    }
    f()
  }, [workflowId])

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!provider?.account_id) return alert('Provider not connected')
    formData['active_tab'] = activeTab
    formData['account_id'] = provider?.account_id
    formData['workflow_id'] = workflowId
    formData['type'] = WorkflowType.INVITE.toString()
    if (fileUrl) {
      const targetPublicIdentifiers = await extractColumnData(
        fileUrl,
        formData['extract_column'] || 'public_identifier'
      )
      customHandleChange(
        targetPublicIdentifiers.join(','),
        'target_public_identifiers'
      )
      formData['target_public_identifiers'] = targetPublicIdentifiers.join(',')
    }
    await generateResponse(formData, event)
  }

  const handleFileUpload = async (files: File[]) => {
    setUploading(true)
    const file = files[0]
    if (!file) return
    const csvUrl = URL.createObjectURL(file)
    setFileUrl(csvUrl)
    setUploading(false)
  }

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    multiple: false,
    onDrop: handleFileUpload,
    accept: {
      'text/csv': ['.csv'],
    },
    maxSize: 10 * 1024 * 1024, // 10MB
  })

  let searchUrlField: FormFields | undefined
  let keywordsField: FormFields | undefined
  let companyUrlsField: FormFields | undefined
  let networkDistanceField: FormFields | undefined
  let leadListIdField: FormFields | undefined
  toolConfig.fields?.forEach((field) => {
    if (field.name === 'search_url') {
      searchUrlField = field
    } else if (field.name === 'keywords') {
      keywordsField = field
    } else if (field.name === 'company_urls') {
      companyUrlsField = field
    } else if (field.name === 'network_distance') {
      networkDistanceField = field
    } else if (field.name === 'target_workflow_id') {
      leadListIdField = field
    }
  })

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
                            <TabsList className="flex w-[700px] h-12 items-center bg-neutral-100/50 dark:bg-neutral-900/50 backdrop-blur-sm rounded-full p-1">
                              {(defaultActiveTab === '0' ||
                                !defaultActiveTab) && (
                                <TabsTrigger
                                  value="0"
                                  className="flex-1 rounded-full px-6 py-2 data-[state=active]:bg-white dark:data-[state=active]:bg-neutral-800 data-[state=active]:text-primary data-[state=active]:shadow-sm transition-all duration-300"
                                >
                                  <div className="flex items-center gap-2">
                                    <IconBrandLinkedin className="h-4 w-4" />
                                    <span className="font-medium">検索URL</span>
                                  </div>
                                </TabsTrigger>
                              )}
                              {(defaultActiveTab === '1' ||
                                !defaultActiveTab) && (
                                <TabsTrigger
                                  value="1"
                                  className="flex-1 rounded-full px-6 py-2 data-[state=active]:bg-white dark:data-[state=active]:bg-neutral-800 data-[state=active]:text-primary data-[state=active]:shadow-sm transition-all duration-300"
                                >
                                  <div className="flex items-center gap-2">
                                    <TextIcon className="h-4 w-4" />
                                    <span className="font-medium">
                                      キーワード
                                    </span>
                                  </div>
                                </TabsTrigger>
                              )}
                              {(defaultActiveTab === '2' ||
                                !defaultActiveTab) && (
                                <>
                                  <TabsTrigger
                                    value="2"
                                    className="flex-1 rounded-full px-6 py-2 data-[state=active]:bg-white dark:data-[state=active]:bg-neutral-800 data-[state=active]:text-primary data-[state=active]:shadow-sm transition-all duration-300"
                                  >
                                    <div className="flex items-center gap-2">
                                      <IconFile className="h-4 w-4" />
                                      <span className="font-medium">
                                        リード
                                      </span>
                                    </div>
                                  </TabsTrigger>
                                  <TabsTrigger
                                    value="3"
                                    className="flex-1 rounded-full px-6 py-2 data-[state=active]:bg-white dark:data-[state=active]:bg-neutral-800 data-[state=active]:text-primary data-[state=active]:shadow-sm transition-all duration-300"
                                  >
                                    <div className="flex items-center gap-2">
                                      <LinkIcon className="h-4 w-4" />
                                      <span className="font-medium">
                                        CSV URL
                                      </span>
                                    </div>
                                  </TabsTrigger>
                                  <TabsTrigger
                                    value="4"
                                    className="flex-1 rounded-full px-6 py-2 data-[state=active]:bg-white dark:data-[state=active]:bg-neutral-800 data-[state=active]:text-primary data-[state=active]:shadow-sm transition-all duration-300"
                                  >
                                    <div className="flex items-center gap-2">
                                      <UploadCloudIcon className="h-4 w-4" />
                                      <span className="font-medium">
                                        アップロード
                                      </span>
                                    </div>
                                  </TabsTrigger>
                                </>
                              )}
                            </TabsList>
                          </div>
                          <TabsContent value="0">
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
                                      {searchUrlField?.label}
                                    </label>
                                    <div className="relative mt-1">
                                      <Input
                                        placeholder="https://www.linkedin.com/search/results/profile/..."
                                        value={formData[searchUrlField?.name!]}
                                        onChange={(e) =>
                                          handleChange(e, 'search_url')
                                        }
                                        required={activeTab === '0'}
                                        className="h-10 pl-3 pr-9 bg-neutral-50 dark:bg-neutral-800/50 border-neutral-200 dark:border-neutral-700 rounded-lg focus:ring-1 focus:ring-primary/20 focus:border-primary transition-all duration-300"
                                      />
                                      <LinkIcon className="absolute right-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-400" />
                                    </div>
                                  </div>
                                </div>
                              </motion.div>
                            </div>
                          </TabsContent>
                          <TabsContent value="1">
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
                                      {keywordsField?.label}
                                    </label>
                                    <div className="relative mt-1">
                                      <Input
                                        value={formData[keywordsField?.name!]}
                                        onChange={(e) =>
                                          handleChange(e, keywordsField?.name!)
                                        }
                                        placeholder={'人材紹介 CEO'}
                                        id={keywordsField?.name!}
                                        name={keywordsField?.name!}
                                        className="p-2 text-xs w-full"
                                      />
                                    </div>
                                  </div>
                                  <div>
                                    <label className="text-sm font-medium text-neutral-600 dark:text-neutral-400">
                                      {companyUrlsField?.label}{' '}
                                    </label>
                                    <div className="relative mt-1">
                                      <Input
                                        value={
                                          formData[companyUrlsField?.name!]
                                        }
                                        onChange={(e) =>
                                          handleChange(
                                            e,
                                            companyUrlsField?.name!
                                          )
                                        }
                                        placeholder={
                                          workflowInDb
                                            ?.company_private_identifiers.length
                                            ? `既に設定されています。企業ID:${workflowInDb?.company_private_identifiers}`
                                            : 'https://www.linkedin.com/company/...'
                                        }
                                        disabled={
                                          workflowInDb
                                            ?.company_private_identifiers.length
                                            ? true
                                            : false
                                        }
                                        id={companyUrlsField?.name!}
                                        name={companyUrlsField?.name!}
                                        className="p-2 text-xs w-full"
                                      />
                                    </div>
                                  </div>
                                  <div>
                                    <label className="text-sm font-medium text-neutral-600 dark:text-neutral-400">
                                      {networkDistanceField?.label}
                                    </label>
                                    <CheckboxGroup
                                      field={networkDistanceField!}
                                      formData={formData}
                                      handleChange={handleChange}
                                    />
                                  </div>
                                </div>
                              </motion.div>
                            </div>
                          </TabsContent>
                          <TabsContent value="2">
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
                                      リード
                                    </label>
                                    <div className="relative mt-1">
                                      <Select
                                        value={formData[leadListIdField?.name!]}
                                        onValueChange={(value) =>
                                          handleChange(
                                            {
                                              target: { value } as any,
                                            } as React.ChangeEvent<HTMLSelectElement>,
                                            leadListIdField?.name!
                                          )
                                        }
                                      >
                                        <SelectTrigger
                                          className="w-full bg-gray-50/50 border border-gray-100 rounded-lg px-4 py-3 
                  text-gray-900 focus:ring-2 focus:ring-primary/10 focus:border-primary/30 
                  transition-all duration-200"
                                        >
                                          <SelectValue placeholder="ワークフローを選択" />
                                        </SelectTrigger>
                                        <SelectContent className="border-gray-100 rounded-xl overflow-hidden">
                                          <SelectGroup>
                                            {workflows?.map((workflow) => {
                                              if (
                                                workflow.type !==
                                                  WorkflowType.SEARCH_PROFILE &&
                                                workflow.type !==
                                                  WorkflowType.LEAD_LIST
                                              )
                                                return null
                                              return (
                                                <SelectItem
                                                  key={workflow.id}
                                                  value={workflow.id}
                                                  className="hover:bg-gray-50 focus:bg-gray-50 hover:text-gray-900 focus:text-gray-900 px-4 py-2.5 cursor-pointer"
                                                >
                                                  {workflow.name}
                                                </SelectItem>
                                              )
                                            })}
                                          </SelectGroup>
                                        </SelectContent>
                                      </Select>
                                    </div>
                                  </div>
                                </div>
                              </motion.div>
                            </div>
                          </TabsContent>
                          <TabsContent value="3">
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
                                        value={fileUrl}
                                        onChange={(e) =>
                                          setFileUrl(e.target.value)
                                        }
                                        required={activeTab === '3'}
                                        className="h-10 pl-3 pr-9 bg-neutral-50 dark:bg-neutral-800/50 border-neutral-200 dark:border-neutral-700 rounded-lg focus:ring-1 focus:ring-primary/20 focus:border-primary transition-all duration-300"
                                      />
                                      <LinkIcon className="absolute right-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-400" />
                                    </div>
                                  </div>
                                  <div>
                                    <label className="text-sm font-medium text-neutral-600 dark:text-neutral-400">
                                      対象カラム名
                                    </label>
                                    <div className="relative mt-1">
                                      <Input
                                        placeholder="public_identifier"
                                        value={formData['extract_column']}
                                        onChange={(e) =>
                                          handleChange(e, 'extract_column')
                                        }
                                        required={activeTab === '3'}
                                        className="h-10 pl-3 pr-9 bg-neutral-50 dark:bg-neutral-800/50 border-neutral-200 dark:border-neutral-700 rounded-lg focus:ring-1 focus:ring-primary/20 focus:border-primary transition-all duration-300"
                                      />
                                    </div>
                                  </div>
                                </div>
                              </motion.div>
                            </div>
                          </TabsContent>

                          <TabsContent value="4">
                            <div {...getRootProps()}>
                              <motion.div
                                whileHover="animate"
                                className="p-10 group/file block rounded-lg cursor-pointer w-full relative overflow-hidden"
                              >
                                <div className="absolute inset-0 [mask-image:radial-gradient(ellipse_at_center,white,transparent)]">
                                  <GridPattern />
                                </div>
                                <div className="flex flex-col items-center justify-center">
                                  <input
                                    {...getInputProps()}
                                    // required={activeTab === '4'}
                                  />

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
                            <div>
                              <label className="text-sm font-medium text-neutral-600 dark:text-neutral-400">
                                対象カラム名
                              </label>
                              <div className="relative mt-1">
                                <Input
                                  placeholder="public_identifier"
                                  value={formData['extract_column']}
                                  onChange={(e) =>
                                    handleChange(e, 'extract_column')
                                  }
                                  required={activeTab === '4'}
                                  className="h-10 pl-3 pr-9 bg-neutral-50 dark:bg-neutral-800/50 border-neutral-200 dark:border-neutral-700 rounded-lg focus:ring-1 focus:ring-primary/20 focus:border-primary transition-all duration-300"
                                />
                              </div>
                            </div>
                          </TabsContent>
                        </Tabs>
                      </div>
                    </div>
                    <RenderFields
                      fields={toolConfig.fields!}
                      formData={formData}
                      handleChange={handleChange}
                    />
                  </div>
                </div>
                <div className="mb-5 flex justify-center">
                  <Button
                    disabled={loading}
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
