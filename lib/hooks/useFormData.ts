// useFormData.ts
import { useState } from 'react'
import { FormFields } from '@/lib/types/toolconfig'

export const useFormData = (initialFields: FormFields[]) => {
  const initialState = initialFields.reduce(
    (acc: { [key: string]: string }, field: FormFields) => {
      acc[field.name!] = ''
      return acc
    },
    {}
  )

  const [formData, setFormData] = useState<{ [key: string]: string }>(
    initialState
  )

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >,
    fieldName: string
  ) => {
    setFormData((prevState) => ({ ...prevState, [fieldName]: e.target.value }))
  }

  const customHandleChange = (value: string, key: string) => {
    setFormData((prevState) => ({ ...prevState, [key]: value }))
  }

  const reset = (value: { value: string; key: string }[]) => {
    const resetState = value.reduce(
      (
        acc: { [key: string]: string },
        field: { value: string; key: string }
      ) => {
        acc[field.key] = field.value
        return acc
      },
      {}
    )
    setFormData(resetState)
  }

  return [formData, handleChange, customHandleChange, reset] as const
}
