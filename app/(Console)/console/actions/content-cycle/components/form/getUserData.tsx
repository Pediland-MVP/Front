"use client"

import { useTranslations } from 'next-intl'
import {
  FormField,
  FormItem,
  FormControl,
  FormLabel,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Control } from "react-hook-form"
import { z } from "zod"
import { contentCycleFormSchema } from "../contentCycle"

type GetUserDataProps = {
  control: Control<z.infer<typeof contentCycleFormSchema>>
}

export default function GetUserData({ control }: GetUserDataProps) {
  const t = useTranslations('Automations.GetUserData')

  return (
    <FormField
      control={control}
      name="getUserData.enabled"
      render={({ field }) => (
        <FormItem className="flex flex-col justify-start gap-y-2">
          <div className="flex items-center gap-x-2">
            <FormControl>
              <Switch
                dir="ltr"
                checked={field.value}
                onCheckedChange={field.onChange}
              />
            </FormControl>
            <FormLabel className="">{t('getUserData')}</FormLabel>
          </div>
          {field.value && (
            <div className="space-y-1">
              <FormField
                control={control}
                name="getUserData.type"
                render={({ field: selectField }) => (
                  <FormItem>
                    <FormLabel className="">{t('selectDataType')}</FormLabel>
                    <FormControl>
                      <Select
                        {...selectField}
                        value={selectField.value ?? "email"}
                        dir="rtl"
                        onValueChange={selectField.onChange}
                      >
                        <SelectTrigger className="w-[180px]">
                          <SelectValue placeholder={t('select')} />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectGroup>
                            <SelectItem value="email" defaultChecked>
                              {t('email')}
                            </SelectItem>
                            <SelectItem value="mobile">{t('mobileNumber')}</SelectItem>
                          </SelectGroup>
                        </SelectContent>
                      </Select>
                    </FormControl>
                  </FormItem>
                )}
              />

              <FormField
                control={control}
                name="getUserData.text"
                render={({ field: textField }) => (
                  <FormItem>
                    <FormLabel className="">{t('questionText')}</FormLabel>
                    <FormControl>
                      <Input
                        placeholder={t('enterMobileNumber')}
                        {...textField}
                        value={textField.value ?? ""}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
            </div>
          )}
        </FormItem>
      )}
    />
  )
}

