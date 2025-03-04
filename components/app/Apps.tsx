'use client'
import { tools } from '@/lib/apps'
import { providerAtom, workflowsAtom } from '@/lib/atom'
import { WorkflowType } from '@/lib/types/master'
import { useAtom } from 'jotai'
import { useCallback } from 'react'

export default function Apps() {
  const getGridClass = () => {
    const itemCount = workflows.length
    if (itemCount >= 3) {
      return 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2 justify-center items-stretch content-center'
    } else if (itemCount === 2) {
      return 'grid grid-cols-1 sm:grid-cols-2 gap-8 justify-center items-stretch content-center'
    } else {
      return 'grid grid-cols-1 gap-8 justify-center items-stretch content-center'
    }
  }

  const [workflows, _] = useAtom(workflowsAtom)
  const [provider, __] = useAtom(providerAtom)

  const createWorkflow = useCallback(
    async (type: WorkflowType) => {
      console.log('createWorkflow', type)
      const response = await fetch(`/api/workflow`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          type: type,
          account_id: provider?.account_id,
        }),
      })

      if (!response.ok) {
        alert(await response.text())
        throw new Error('Network response was not ok')
      }

      const responseOfCreateWorkflow = await response.json()
      responseOfCreateWorkflow.workflow_id
        ? window.location.replace(
            `/workflow/${responseOfCreateWorkflow.workflow_id}`
          )
        : alert('Failed to create workflow')
    },
    [provider]
  )

  return (
    <>
      {workflows.length > 0 && (
        <section id="workflows">
          <div className="p-2 sm:p-6 xl:max-w-7xl xl:mx-auto relative isolate overflow-hidden pb-0 flex flex-col justify-center items-center">
            <h2 className="text-2xl font-bold text-neutral-900 dark:text-neutral-100">
              保存されたワークフロー
            </h2>
            <div className="py-10 w-full flex justify-center">
              <div className={getGridClass()}>
                {workflows.map((workflow, index) => (
                  <a
                    key={index}
                    href={'/workflow/' + workflow.id}
                    className="w-full flex justify-center"
                  >
                    <div
                      className="
                  w-full h-full transition-all duration-500 ease-in-out bg-white border border-base-200 rounded-xl hover:-translate-y-1 p-4 flex flex-col items-center justify-center text-center"
                    >
                      <h3 className="text-lg font-semibold text-neutral-700 dark:text-neutral-300">
                        {workflow.name}
                      </h3>
                      {/* // TODO: workflow.image */}
                      <img
                        src={'/apps/claude.webp'}
                        alt={workflow.name}
                        className="w-full h-auto border border-base-200 rounded-md mt-4 mb-4"
                      />
                      <div className="mt-4 flex gap-y-1 flex-wrap justify-center space-x-2 overflow-auto scrollbar-hide ">
                        <span
                          key={workflow.type}
                          className={`border bg-base-100 text-base-content py-1 px-4 text-sm rounded-xl ${'w-full text-center'}`}
                        >
                          {WorkflowType[workflow.type]}
                        </span>
                      </div>
                    </div>
                  </a>
                ))}
              </div>
            </div>
            {/* </div> */}
          </div>
        </section>
      )}
      <section id="suggested_workflows">
        {/* <div className="bg-base-100"> */}
        <div className="p-2 sm:p-6 xl:max-w-7xl xl:mx-auto relative isolate overflow-hidden pb-0 flex flex-col justify-center items-center">
          <h2 className="text-2xl font-bold text-neutral-900 dark:text-neutral-100">
            おすすめのワークフロー
          </h2>
          <div className="py-10 w-full flex justify-center">
            <div className={getGridClass()}>
              {tools.map((workflow, index) => (
                <a
                  key={index}
                  onClick={() => {
                    createWorkflow(workflow.type)
                  }}
                  className="w-full flex justify-center"
                >
                  <div
                    className="
                  w-full h-full transition-all duration-500 ease-in-out bg-white border border-base-200 rounded-xl hover:-translate-y-1 p-4 flex flex-col items-center justify-center text-center"
                  >
                    <h3 className="text-lg font-semibold text-neutral-700 dark:text-neutral-300">
                      {workflow.title}
                    </h3>
                    {workflow.image && (
                      <img
                        src={workflow.image}
                        alt={workflow.title}
                        className="w-full h-auto border border-base-200 rounded-md mt-4 mb-4"
                      />
                    )}
                    <p className="max-w-lg text-sm text-neutral-400">
                      {workflow.description}
                    </p>
                    <div className="mt-4 flex gap-y-1 flex-wrap justify-center space-x-2 overflow-auto scrollbar-hide ">
                      {workflow.tags.map((tag, index) => (
                        <span
                          key={tag}
                          className={`border bg-base-100 text-base-content py-1 px-4 text-sm rounded-xl ${
                            workflow.tags.length === 1
                              ? 'w-full text-center'
                              : ' md:w-auto'
                          }`}
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                </a>
              ))}
            </div>
          </div>
        </div>
      </section>
    </>
  )
}
