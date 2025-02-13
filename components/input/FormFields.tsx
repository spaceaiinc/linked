import React from "react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectTrigger,
  SelectContent,
  SelectItem,
  SelectValue,
  SelectLabel,
  SelectGroup,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { type FormFields } from "@/lib/types/toolconfig";

interface RenderFieldsProps {
  fields: FormFields[];
  formData: { [key: string]: string };
  handleChange: (
    event: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >,
    fieldName: string
  ) => void;
}

export const RenderFields: React.FC<RenderFieldsProps> = ({
  fields,
  formData,
  handleChange,
}) => {
  return (
    <>
      {fields.map((field) => (
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
          {field.type === 'select' && (
            <Select
              value={formData[field.name!] || ''}
              onValueChange={(value) => {
                if (field.multiple) {
                  const currentValue = formData[field.name!] || '';
                  const currentValues = currentValue ? currentValue.split(',') : [];
                  console.log(currentValue);
                  const newValues = currentValues.includes(value)
                    ? currentValues.filter(v => v !== value)
                    : [...currentValues, value];
                  const newValue = newValues.join(',');
                  handleChange(
                    {
                      target: { value: newValue }
                    } as React.ChangeEvent<HTMLSelectElement>,
                    field.name!
                  );
                } else {
                  handleChange(
                    {
                      target: { value }
                    } as React.ChangeEvent<HTMLSelectElement>,
                    field.name!
                  );
                }
              }}
            >
              <SelectTrigger className="w-full">
                <SelectValue>
                  {field.multiple 
                    ? formData[field.name!] || 'Please make a selection'
                    : undefined
                  }
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  <SelectLabel>{field.label}</SelectLabel>
                  {field.options?.map((option) => {
                    const isSelected = field.multiple 
                      ? (formData[field.name!] || '').split(',').includes(option)
                      : formData[field.name!] === option;
                    return (
                      <SelectItem 
                        key={option} 
                        value={option}
                        className={isSelected ? 'bg-accent/10' : ''}
                      >
                        {option}
                      </SelectItem>
                    );
                  })}
                </SelectGroup>
              </SelectContent>
            </Select>
          )}
        </div>
      ))}
    </>
  );
};
