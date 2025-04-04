'use client'

import { useState, ReactElement, useEffect } from 'react'
import { useFormData } from '@/lib/hooks/useFormData'
import { RenderFields } from '@/app/components/input/FormFields'
import { FormFields, type ToolConfig } from '@/lib/types/toolconfig'
import { LoaderCircle } from 'lucide-react'
import { Button } from '@/app/components/ui/button'
import { sendMessageResponse } from '@/lib/hooks/sendMessageResponse'
import Login from '@/app/components/input/login'
import { motion } from 'framer-motion'
import {
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
} from '@/app/components/ui/tabs'
import { IconFile } from '@tabler/icons-react'
import { providerAtom, userAtom, workflowsAtom } from '@/lib/atom'
import { useAtom } from 'jotai'
import { createClient } from '@/lib/utils/supabase/client'
import { Workflow } from '@/lib/types/supabase'
import { ActiveTab, WorkflowType } from '@/lib/types/master'
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../../ui/select'

interface SendMessageInputCaptureProps {
  workflowId: string
  emptyStateComponent: ReactElement
  toolConfig: ToolConfig
  userEmail?: string
  credits?: number
}

export default function SendMessageInputCapture({
  workflowId,
  toolConfig,
  emptyStateComponent,
  userEmail,
  credits: initialCredits,
}: SendMessageInputCaptureProps) {
  const [generateResponse, loading] = sendMessageResponse()

  const [formData, handleChange, customHandleChange, reset] = useFormData(
    toolConfig.fields!
  )
  const [user] = useAtom(userAtom)

  const [activeTab, setActiveTab] = useState<string>(
    ActiveTab.LEAD_LIST.toString()
  )
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
        // TODO: コード煩雑すぎる　useFormを使う　toolConfigをyupに統一
        customHandleChange(workflowId, 'workflow_id')
        customHandleChange(workflow.name, 'name')
        customHandleChange(
          workflow.run_limit_count.toString(),
          'run_limit_count'
        )
        customHandleChange(workflow.agent_type.toString(), 'agent_type')
        customHandleChange(workflow.first_message, 'first_message')
        customHandleChange(
          workflow.first_message_trigger_type.toString(),
          'first_message_trigger_type'
        )
        customHandleChange(
          workflow.first_message_dify_api_key,
          'first_message_dify_api_key'
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
    formData['last_updated_user_id'] = user?.id || ''
    formData['active_tab'] = ActiveTab.LEAD_LIST.toString()
    formData['account_id'] = provider?.account_id
    formData['workflow_id'] = workflowId
    formData['type'] = WorkflowType.SEND_MESSAGE.toString()
    await generateResponse(formData, event)
  }

  let leadListIdField: FormFields | undefined
  toolConfig.fields?.forEach((field) => {
    if (field.name === 'target_workflow_id') {
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
                                </>
                              )}
                            </TabsList>
                          </div>
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
                                            {workflows?.map(
                                              (workflow, index) => {
                                                return (
                                                  <SelectItem
                                                    key={`${workflow.id}-${index}`}
                                                    value={workflow.id}
                                                    className="hover:bg-gray-50 focus:bg-gray-50 hover:text-gray-900 focus:text-gray-900 px-4 py-2.5 cursor-pointer"
                                                  >
                                                    {workflow.name}
                                                  </SelectItem>
                                                )
                                              }
                                            )}
                                          </SelectGroup>
                                        </SelectContent>
                                      </Select>
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
