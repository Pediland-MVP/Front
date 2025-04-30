import React, { useState } from "react";
import { Controller } from "react-hook-form";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectLabel,
  SelectValue,
} from "@/components/theme/ui/select";
import { Input } from "@/components/theme/ui/input";
import { PlusCircle, Trash } from "@phosphor-icons/react/dist/ssr";
import { Button } from "@/components/theme/ui/button";
export default function ConditionWordForm({ control, remove }: any) {
  const [conditions, setConditions] = useState([{ id: 1 }]);

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
      <p>کلمه یا جمله ای</p>
      <div className=" space-y-4">
        {conditions.map((condition, index) => (
          <div key={condition.id} className="flex gap-4 items-center">
            <Controller
              name={`conditions.${index}.type`}
              control={control}
              render={({ field }) => (
                <Select {...field} dir="rtl" onValueChange={field.onChange}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="برابر" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectGroup>
                      <SelectItem value="equal">برابر</SelectItem>
                    </SelectGroup>
                  </SelectContent>
                </Select>
              )}
            />
            <span className="text-sm">با</span>
            <Controller
              name={`conditions.${index}.value`}
              control={control}
              render={({ field }) => (
                <Input
                  {...field}
                  className="max-w-[15rem]"
                  type="text"
                  placeholder="مقدار"
                />
              )}
            />

            {/* Delete Icon */}
            {conditions.length > 1 && (
              <Trash
                size={24}
                className="text-red-600 cursor-pointer"
                onClick={() => deleteCondition(condition.id, index)}
              />
            )}
            <Button
              onClick={addCondition}
              variant="ghost"
              className="flex items-center gap-2 cursor-pointer"
            >
              <PlusCircle size={24} />
              <span className="text-sm font-semibold text-blue-600">
                افزودن شرط جدید
              </span>
            </Button>
          </div>
        ))}
        {/* Add button to add more conditions */}
      </div>
    </div>
  );
}
