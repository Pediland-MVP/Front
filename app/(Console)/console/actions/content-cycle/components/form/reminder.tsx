import { useFormContext } from "react-hook-form";
import { contentCycleFormSchema } from '../contentCycle';
import { z } from "zod";
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Switch } from "@/components/ui/switch";
import { useTranslations } from "next-intl";
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from "@/components/theme/ui/select";
import { Textarea } from "@/components/theme/ui/textarea";
import ErrorMessage from "@/components/ui/errorMessage";

export default function Reminder() {

    const { control } = useFormContext<z.infer<typeof contentCycleFormSchema>>()
    const t = useTranslations('Automations.Reminder')

    
    return (
        <FormField
            control={control}
            name="reminder.isEnabled"
            render={({ field }) => (
                <FormItem className="flex flex-col justify-start gap-y-2">
                    <div className="flex items-center gap-x-2">
                        <FormControl>
                            <Switch
                                dir="ltr"
                                id="reminder"
                                checked={field.value}
                                onCheckedChange={field.onChange}
                            />
                        </FormControl>
                        <FormLabel className="">{t('isEnabled.label')}</FormLabel>
                    </div>
                    {
                        field.value && (
                            <>
                                <FormField
                                    control={control}
                                    name="reminder.time"
                                    render={({ field: selectField, fieldState: { error }}) => (
                                        <FormItem>
                                            <FormLabel className="">{t('time.label')}</FormLabel>
                                            <FormControl>
                                                <Select
                                                    {...selectField}
                                                    onValueChange={selectField.onChange}
                                                >
                                                    <SelectTrigger>
                                                        <SelectValue placeholder={t('time.placeholder')} />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        <SelectGroup>
                                                            {
                                                                Array.from({ length: 23 }, (_, i) => i + 1).map((hour) => (
                                                                    <SelectItem key={hour} value={`${hour}`}>
                                                                        {hour} ساعت
                                                                    </SelectItem>
                                                                ))
                                                            }
                                                        </SelectGroup>
                                                    </SelectContent>
                                                </Select>
                                            </FormControl>
                                            {error && <ErrorMessage> {t(`time.Errors.${error.message}`)} </ErrorMessage>}
                                        </FormItem>
                                    )}
                                ></FormField>
                                <FormField
                                    control={control}
                                    name="reminder.text"
                                    render={({ field, fieldState: { error }}) => (
                                        <FormItem>
                                            <FormLabel className="">{t('text.label')}</FormLabel>
                                            <FormControl>
                                                <Textarea {...field} placeholder={t('text.placeholder')} />
                                            </FormControl>
                                            {error && <ErrorMessage> {t(`text.Errors.${error.message}`)} </ErrorMessage>}
                                        </FormItem>
                                    )}
                                />
                            </>
                        )
                    }
                    <FormMessage />
                </FormItem>
            )}

        />
    )


}