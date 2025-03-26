import React from 'react'
import { Input } from '@/app/components/ui/input'
import { Textarea } from '@/app/components/ui/textarea'
import { Label } from '@/app/components/ui/label'
import { type FormFields } from '@/lib/types/toolconfig'
import CheckboxGroup from '../ui/checkbox-group'
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../ui/select'

interface RenderFieldsProps {
  fields: FormFields[]
  formData: { [key: string]: string }
  handleChange: (
    event: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >,
    fieldName: string
  ) => void
}

export const RenderFields: React.FC<RenderFieldsProps> = ({
  fields,
  formData,
  handleChange,
}) => {
  //   const validationSchema = generateValidationSchema(formFields);

  // const MyForm = () => {
  //   const {
  //     register,
  //     handleSubmit,
  //     formState: { errors },
  //     setValue,
  //     watch
  //   } = useForm({
  //     resolver: yupResolver(validationSchema),
  //     mode: 'onChange' // バリデーションを変更時に実行
  //   });

  //   const onSubmit = (data) => {
  //     console.log('Form data:', data);
  //     // データ送信処理
  //   };

  //   // ファイル入力の特別な処理
  //   const handleFileChange = (e, name) => {
  //     setValue(name, e.target.files);
  //   };

  return (
    <>
      {fields.map((field) => {
        if (field.custom) return null

        return (
          <div key={field.name} className="mb-5 w-full">
            <Label
              htmlFor={field.name}
              className="block text-xs font-semibold mb-2"
            >
              {field.label}
            </Label>
            {field.type === 'input' && (
              <Input
                value={formData[field.name!]}
                onChange={(e) => handleChange(e, field.name!)}
                type={field.inputType || 'text'}
                required={field.required}
                placeholder={field.placeholder || 'Enter text'}
                id={field.name}
                name={field.name}
                className="w-full"
                max={field.max}
              />
            )}

            {field.type === 'file' && (
              <Input
                type="file"
                accept=".csv"
                onChange={(e) => handleChange(e, field.name!)}
                required={field.required}
                id={field.name}
                name={field.name}
                className="w-full"
              />
            )}

            {field.type === 'textarea' && (
              <Textarea
                value={formData[field.name!]}
                onChange={(e) => handleChange(e, field.name!)}
                required={field.required}
                placeholder={field.placeholder || 'Enter text'}
                id={field.name}
                name={field.name}
                className="p-2 text-xs w-full"
              />
            )}
            {field.type === 'checkbox' && (
              <CheckboxGroup
                field={field}
                formData={formData}
                handleChange={handleChange}
              />
            )}
            {field.type === 'select' && (
              <Select
                value={formData[field.name!]}
                onValueChange={(value) =>
                  handleChange(
                    {
                      target: { value } as any,
                    } as React.ChangeEvent<HTMLSelectElement>,
                    field.name!
                  )
                }
              >
                <SelectTrigger
                  className="w-full bg-gray-50/50 border border-gray-100 rounded-lg px-4 py-3 
                  text-gray-900 focus:ring-2 focus:ring-primary/10 focus:border-primary/30 
                  transition-all duration-200"
                >
                  <SelectValue placeholder="Select an option" />
                </SelectTrigger>
                <SelectContent className="border-gray-100 rounded-xl overflow-hidden">
                  <SelectGroup>
                    {field.options?.map((option) => (
                      <SelectItem
                        key={option.value}
                        value={option.value}
                        className="hover:bg-gray-50 focus:bg-gray-50 hover:text-gray-900 focus:text-gray-900 px-4 py-2.5 cursor-pointer"
                      >
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectGroup>
                </SelectContent>
              </Select>
            )}

            {/* エラーメッセージの表示 */}
            {/* {field.name && errors[field.name] && (
              <p className="text-red-500 text-sm mt-1">
                {errors[field.name].message}
              </p>
            )} */}
          </div>
        )
      })}
    </>
  )
}
