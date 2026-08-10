import React, { useState } from 'react';
import { Controller } from 'react-hook-form';
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectLabel,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { PlusCircle } from '@phosphor-icons/react/dist/ssr/PlusCircle';
import { Trash } from '@phosphor-icons/react/dist/ssr/Trash';
import { Button } from '@/components/ui/button';
import { useTranslations } from 'next-intl';
export default function ConditionWordForm({ control, remove }: any) {
  const [conditions, setConditions] = useState([{ id: 1 }]);

  const t = useTranslations('Automations.Conditions');

  const addCondition = () => {
    setConditions([...conditions, { id: Date.now() }]);
  };

  // Delete a condition
  const deleteCondition = (id: number, index: number) => {
    setConditions(conditions.filter((condition) => condition.id !== id));
    remove(index);
  };

  return (
    <div>
      <p>{t('wordOrPhrase')} wdifrewr9q4q23oekwasikaeaeo</p>
      <div className="space-y-4">
        {conditions.map((condition, index) => (
          <div key={condition.id} className="flex items-center gap-4">
            <Controller
              name={`conditions.${index}.value`}
              control={control}
              render={({ field }) => (
                <Input {...field} className="max-w-[15rem]" type="text" placeholder="مقدار" />
              )}
            />

            {/* Delete Icon */}
            {conditions.length > 1 && (
              <Trash
                size={24}
                className="cursor-pointer text-red-600"
                onClick={() => deleteCondition(condition.id, index)}
              />
            )}
            <Button
              onClick={addCondition}
              variant="ghost"
              className="flex cursor-pointer items-center gap-2"
            >
              <PlusCircle size={24} />
              <span className="text-sm font-semibold text-blue-600">افزودن شرط جدید</span>
            </Button>
          </div>
        ))}
        {/* Add button to add more conditions */}
      </div>
    </div>
  );
}
