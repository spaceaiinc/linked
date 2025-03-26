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
import { LinkIcon, TextIcon } from 'lucide-react'
import {
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
} from '@/app/components/ui/tabs'
import { Input } from '@/app/components/ui/input'
import { IconBrandLinkedin, IconHeart } from '@tabler/icons-react'
import { providerAtom } from '@/lib/atom'
import { useAtom } from 'jotai'
import { extractLinkedInId } from '@/lib/csv'
import CheckboxGroup from '@/app/components/ui/checkbox-group'
import { createClient } from '@/lib/utils/supabase/client'
import { Workflow } from '@/lib/types/supabase'
import { ActiveTab, WorkflowType } from '@/lib/types/master'

interface SearchProfileInputCaptureProps {
  workflowId: string
  emptyStateComponent: ReactElement
  toolConfig: ToolConfig
  userEmail?: string
  credits?: number
}

export default function SearchProfileInputCapture({
  workflowId,
  toolConfig,
  emptyStateComponent,
  userEmail,
  credits: initialCredits,
}: SearchProfileInputCaptureProps) {
  const [generateResponse, loading] = searchProfileResponse(toolConfig)

  const [formData, handleChange, customHandleChange] = useFormData(
    toolConfig.fields!
  )

  const [activeTab, setActiveTab] = useState<string>('0')
  const [provider, __] = useAtom(providerAtom)
  const [defaultActiveTab, setDefaultActiveTab] = useState<string>('')
  const [workflowInDb, setWorkflowInDb] = useState<Workflow | null>(null)

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
          // TODO: get company urls
          // customHandleChange(workflow.company_urls, 'company_urls')
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
        } else if (workflow.search_reaction_profile_public_identifier) {
          customHandleChange(
            'https://www.linkedin.com/in/' +
              workflow.search_reaction_profile_public_identifier,
            'search_reaction_profile_public_identifier'
          )
          setActiveTab('5')
          setDefaultActiveTab('5')
        }
        customHandleChange(workflow.limit_count.toString(), 'limit_count')
        // customHandleChange(workflow.scheduled_days.join(','), 'scheduled_days')
        // customHandleChange(
        //   workflow.scheduled_months.join(','),
        //   'scheduled_months'
        // )
        customHandleChange(
          workflow.scheduled_hours.join(','),
          'scheduled_hours'
        )
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
    formData['account_id'] = provider?.account_id
    formData['active_tab'] = activeTab
    formData['workflow_id'] = workflowId
    formData['type'] = WorkflowType.SEARCH_PROFILE.toString()
    if (formData['search_reaction_profile_public_identifier']) {
      const linkedInId = extractLinkedInId(
        formData['search_reaction_profile_public_identifier']
      )
      if (!linkedInId) {
        return alert('Invalid LinkedIn URL')
      }
      formData['search_reaction_profile_public_identifier'] = linkedInId
    }
    await generateResponse(formData, event)
  }

  let searchUrlField: FormFields | undefined
  let keywordsField: FormFields | undefined
  let companyUrlsField: FormFields | undefined
  let networkDistanceField: FormFields | undefined
  let searchReactionProfilePublicIdentifierField: FormFields | undefined
  toolConfig.fields?.forEach((field) => {
    if (field.name === 'search_reaction_profile_public_identifier') {
      searchReactionProfilePublicIdentifierField = field
    } else if (field.name === 'search_url') {
      searchUrlField = field
    } else if (field.name === 'keywords') {
      keywordsField = field
    } else if (field.name === 'company_urls') {
      companyUrlsField = field
    } else if (field.name === 'network_distance') {
      networkDistanceField = field
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
                              {(defaultActiveTab ===
                                ActiveTab.SEARCH.toString() ||
                                !defaultActiveTab) && (
                                <TabsTrigger
                                  value={ActiveTab.SEARCH.toString()}
                                  className="flex-1 rounded-full px-6 py-2 data-[state=active]:bg-white dark:data-[state=active]:bg-neutral-800 data-[state=active]:text-primary data-[state=active]:shadow-sm transition-all duration-300"
                                >
                                  <div className="flex items-center gap-2">
                                    <IconBrandLinkedin className="h-4 w-4" />
                                    <span className="font-medium">検索URL</span>
                                  </div>
                                </TabsTrigger>
                              )}
                              {(defaultActiveTab ===
                                ActiveTab.KEYWORDS.toString() ||
                                !defaultActiveTab) && (
                                <TabsTrigger
                                  value={ActiveTab.KEYWORDS.toString()}
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
                              {(defaultActiveTab ===
                                ActiveTab.SEARCH_REACTION.toString() ||
                                !defaultActiveTab) && (
                                <TabsTrigger
                                  value={ActiveTab.SEARCH_REACTION.toString()}
                                  className="flex-1 rounded-full px-6 py-2 data-[state=active]:bg-white dark:data-[state=active]:bg-neutral-800 data-[state=active]:text-primary data-[state=active]:shadow-sm transition-all duration-300"
                                >
                                  <div className="flex items-center gap-2">
                                    <IconHeart className="h-4 w-4" />
                                    <span className="font-medium">
                                      いいね・コメント
                                    </span>
                                  </div>
                                </TabsTrigger>
                              )}
                            </TabsList>
                          </div>
                          <TabsContent value={ActiveTab.SEARCH.toString()}>
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
                                        required={
                                          activeTab ===
                                          ActiveTab.SEARCH.toString()
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
                          <TabsContent value={ActiveTab.KEYWORDS.toString()}>
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
                                      {companyUrlsField?.label}
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
                                            ? `既に設定されてるため変更できません。企業ID:${workflowInDb?.company_private_identifiers}`
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
                          <TabsContent
                            value={ActiveTab.SEARCH_REACTION.toString()}
                          >
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
                                      {
                                        searchReactionProfilePublicIdentifierField?.label
                                      }
                                      <span className="text-xs text-neutral-400 dark:text-neutral-500">
                                        ※「1回毎の対象数」分の直近の投稿を検索します
                                      </span>
                                    </label>
                                    <div className="relative mt-1">
                                      <Input
                                        placeholder="https://www.linkedin.com/in/..."
                                        value={
                                          formData[
                                            searchReactionProfilePublicIdentifierField
                                              ?.name!
                                          ]
                                        }
                                        onChange={(e) =>
                                          handleChange(
                                            e,
                                            'search_reaction_profile_public_identifier'
                                          )
                                        }
                                        required={
                                          activeTab ===
                                          ActiveTab.SEARCH_REACTION.toString()
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
