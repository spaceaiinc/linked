'use client'

import { exampleSetup } from 'prosemirror-example-setup'
import { inputRules } from 'prosemirror-inputrules'
import { EditorState } from 'prosemirror-state'
import { EditorView } from 'prosemirror-view'
import React, { memo, useEffect, useRef } from 'react'
import { documentSchema, handleTransaction, headingRule } from './editor/config'
import {
  buildContentFromDocument,
  buildDocumentFromContent,
} from './editor/functions'

type EditorProps = {
  content: string
  saveContent: (updatedContent: string, debounce: boolean) => void
  status: 'streaming' | 'idle'
  isCurrentVersion: boolean
  currentVersionIndex: number
}

function PureEditor({ content, saveContent, status }: EditorProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const editorRef = useRef<EditorView | null>(null)

  useEffect(() => {
    if (containerRef.current && !editorRef.current) {
      const state = EditorState.create({
        doc: buildDocumentFromContent(content),
        plugins: [
          ...exampleSetup({ schema: documentSchema, menuBar: false }),
          inputRules({
            rules: [
              headingRule(1),
              headingRule(2),
              headingRule(3),
              headingRule(4),
              headingRule(5),
              headingRule(6),
            ],
          }),
        ],
      })

      editorRef.current = new EditorView(containerRef.current, {
        state,
      })
    }

    return () => {
      if (editorRef.current) {
        editorRef.current.destroy()
        editorRef.current = null
      }
    }
    // NOTE: we only want to run this effect once
    // eslint-disable-next-line
  }, [])

  useEffect(() => {
    if (editorRef.current) {
      editorRef.current.setProps({
        dispatchTransaction: (transaction) => {
          handleTransaction({ transaction, editorRef, saveContent })
        },
      })
    }
  }, [saveContent])

  useEffect(() => {
    if (editorRef.current && content) {
      const currentContent = buildContentFromDocument(
        editorRef.current.state.doc
      )

      if (status === 'streaming') {
        const newDocument = buildDocumentFromContent(content)

        const transaction = editorRef.current.state.tr.replaceWith(
          0,
          editorRef.current.state.doc.content.size,
          newDocument.content
        )

        transaction.setMeta('no-save', true)
        editorRef.current.dispatch(transaction)
        return
      }

      if (currentContent !== content) {
        const newDocument = buildDocumentFromContent(content)

        const transaction = editorRef.current.state.tr.replaceWith(
          0,
          editorRef.current.state.doc.content.size,
          newDocument.content
        )

        transaction.setMeta('no-save', true)
        editorRef.current.dispatch(transaction)
      }
    }
  }, [content, status])

  return <div className="relative prose dark:prose-invert" ref={containerRef} />
}

function areEqual(prevProps: EditorProps, nextProps: EditorProps) {
  if (prevProps.currentVersionIndex !== nextProps.currentVersionIndex) {
    return false
  } else if (prevProps.isCurrentVersion !== nextProps.isCurrentVersion) {
    return false
  } else if (
    prevProps.status === 'streaming' &&
    nextProps.status === 'streaming'
  ) {
    return false
  } else if (prevProps.content !== nextProps.content) {
    return false
  } else if (prevProps.saveContent !== nextProps.saveContent) {
    return false
  }

  return true
}

export const Editor = memo(PureEditor, areEqual)
