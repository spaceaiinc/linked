import { WorkflowType } from '@/lib/types/master'
import { Database } from '@/lib/types/supabase'
import { createClient } from '@/lib/utils/supabase/server'
import { createWorkflowSchema } from '@/lib/validation'
import { NextResponse } from 'next/server'

export async function POST(req: Request) {
  /**
   * validate param
   */
  const param = await createWorkflowSchema.validate(await req.json(), {
    abortEarly: false, // すべてのエラーを一度に収集
    stripUnknown: true, // 未知のフィールドを削除
  })
  try {
    /**
     * authenticate
     */
    const supabase = createClient()
    const { data: provider } = await supabase
      .from('providers')
      .select('id, company_id')
      .eq('account_id', param.account_id)
      .single()

    if (!provider || !provider?.id) {
      return NextResponse.json(
        { error: 'Invalid LinkedIn account' },
        { status: 400 }
      )
    }

    /**
     * create workflow
     */
    let responseOfInsertWorkflow = null
    const workflow: Database['public']['Tables']['workflows']['Insert'] = {
      company_id: provider.company_id,
      provider_id: provider.id,
      type: Number(param.type),
      limit_count: 20,
      name: WorkflowType[param.type] + ' WORKFLOW',
    }

    const { data: workflowData, error } = await supabase
      .from('workflows')
      .insert(workflow)
      .select('*')
      .single()
    if (error) {
      console.error('Error in inserting workflow:', error)
      return NextResponse.json(
        { error: 'Internal server error' },
        { status: 500 }
      )
    }
    console.log('responseOfInsertWorkflow:', responseOfInsertWorkflow)
    if (!workflowData.id) {
      return NextResponse.json(
        { error: 'Internal server error: workflow id is not found' },
        { status: 500 }
      )
    }

    return NextResponse.json(
      {
        workflow_id: workflowData.id,
      },
      { status: 200 }
    )
  } catch (error) {
    console.error('Error in POST /api/workflow:', error)
    return NextResponse.json(
      { error: 'Internal server error: ' + error },
      { status: 500 }
    )
  }
}

// "CEO" OR "役員" OR "取締役" OR "部長" OR "Manager" OR "Director"
