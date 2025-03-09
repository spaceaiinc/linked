import React, { useState, useEffect } from 'react'
import { Checkbox } from '@/app/components/ui/checkbox'
import { FormFields } from '@/lib/types/toolconfig'

const CheckboxGroup = ({
  field,
  formData,
  handleChange,
}: {
  field: FormFields
  formData: { [key: string]: string }
  handleChange: (
    event: React.ChangeEvent<HTMLInputElement>,
    fieldName: string
  ) => void
}) => {
  const [error, setError] = useState(false)
  const fieldName = field?.name || ''

  useEffect(() => {
    if (field.required) {
      // 現在の選択値をチェック
      const currentValue = formData[fieldName] || ''
      const selectedValues = currentValue.split(',').filter((v: any) => v)
      setError(selectedValues.length === 0)
    }
  }, [formData, fieldName])

  const handleCheckboxChange = (checked: boolean, optionValue: string) => {
    const currentValue = formData[fieldName] || ''
    const currentValues = currentValue.split(',').filter((v: any) => v)

    let newValues
    if (checked) {
      newValues = [...currentValues, optionValue]
    } else {
      if (field.required) {
        // 最後の1つが外されようとしている場合は、変更を防ぐ
        if (currentValues.length === 1 && currentValues[0] === optionValue) {
          return
        }
      }
      newValues = currentValues.filter((v: string) => v !== optionValue)
    }

    const newValue = newValues.join(',')
    handleChange(
      {
        target: { value: newValue },
      } as React.ChangeEvent<HTMLInputElement>,
      fieldName
    )
  }

  if (!field?.options) {
    return null
  }

  return (
    <div className="space-y-2">
      <div
        className={`grid gap-2 ${
          field.options.length > 3 ? 'grid-cols-8' : 'grid-cols-3'
        }`}
      >
        {field.options.map(
          (option: {
            value: string
            label:
              | string
              | number
              | boolean
              | React.ReactElement<
                  any,
                  string | React.JSXElementConstructor<any>
                >
              | Iterable<React.ReactNode>
              | React.ReactPortal
              | React.PromiseLikeOfReactNode
              | null
              | undefined
          }) => (
            <label
              key={`${option.value}-${fieldName}`}
              className="flex items-center space-x-2"
            >
              <Checkbox
                checked={(formData[fieldName] || '')
                  .split(',')
                  .includes(option.value)}
                onCheckedChange={(checked) =>
                  handleCheckboxChange(checked as boolean, option.value)
                }
                className="peer h-4 w-4 shrink-0 rounded-sm border border-primary 
                ring-offset-background focus-visible:outline-none 
                focus-visible:ring-2 focus-visible:ring-ring 
                focus-visible:ring-offset-2 disabled:cursor-not-allowed 
                disabled:opacity-50 data-[state=checked]:bg-transparent 
                data-[state=checked]:text-primary-foreground"
              />
              <span>{option.label}</span>
            </label>
          )
        )}
      </div>
      {error && (
        <p className="text-sm text-red-500">
          少なくとも1つのオプションを選択してください
        </p>
      )}
    </div>
  )
}

export default CheckboxGroup
