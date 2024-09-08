"use client";
import { useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { Input } from "@/registry/new-york/ui/input";
import { Label } from "@/registry/new-york/ui/label";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectLabel,
  SelectValue,
} from "@/registry/new-york/ui/select";
import { Switch } from "@/registry/new-york/ui/switch";
import { Plus, PlusCircle, Trash } from "@phosphor-icons/react";
import { Button } from "@/registry/new-york/ui/button";
import { Checkbox } from "@/registry/new-york/ui/checkbox";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

export default function ContentCycle() {
  const [conditions, setConditions] = useState([{ id: 1 }]);
  const [postAndMessage, setPostAndMessage] = useState([{ id: 1 }]);

  // Validation schema using Zod
  const formSchema = z.object({
    conditions: z.array(
      z.object({
        type: z.string(),
        value: z.string(),
      })
    ),
    postAndMessage: z.array(
      z.object({
        message: z.string(),
        time: z.string(), // Ensure time is selected
      })
    ),
    checkboxes: z.array(z.string()).optional(),
    direct: z.boolean(),
    post: z.boolean(),
  });

  // Initialize form with react-hook-form and zod validation
  const {
    control,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(formSchema),
    defaultValues: {
      conditions: [{ type: "", value: "" }],
      postAndMessage: [{ message: "", time: "" }],
      checkboxes: [],
      direct: false,
      post: false,
    },
  });

  console.log(errors);

  // Submit handler
  const onSubmit = (data: any) => {
    console.log("Form submitted:", data);
  };

  // Add a new condition
  const addCondition = () => {
    setConditions([...conditions, { id: Date.now() }]);
  };

  // Delete a condition
  const deleteCondition = (id: number) => {
    setConditions(conditions.filter((condition) => condition.id !== id));
  };

  // Add a new postAndMessage section
  const addPostAndMessage = () => {
    setPostAndMessage([...postAndMessage, { id: Date.now() }]);
  };

  const deletePostAndMessage = (id: number) => {
    setPostAndMessage(postAndMessage.filter((pm) => pm.id !== id));
  };

  const items = [
    { id: "if-follow", label: "ارسال پاسخ به شرط فالو داشتن صفحه" },
    { id: "like-direct", label: "پیام‌های دایرکت لایک شوند" },
  ];

  return (
    <div className="px-[21rem] h-full ">
      <div className="w-full h-full bg-white rounded-2xl shadow-md pb-8">
        <h1 className="text-2xl font-bold px-6 py-8 border-b">
          محتوای انتخابی
        </h1>

        {/* Form wrapper */}
        <form
          onSubmit={handleSubmit(onSubmit)}
          className="px-8 py-6 text-lg h-full  space-y-8"
        >
          {/* Adjust the height of the form */}
          <p>اگر کاربر شما در</p>
          <div className="flex gap-4">
            <div className="flex gap-2 items-center">
              <Controller
                name="direct"
                control={control}
                render={({ field }) => (
                  <div className="flex gap-2 items-center">
                    <Switch
                      dir="ltr"
                      id="direct"
                      checked={field.value}
                      onCheckedChange={(checked) => field.onChange(checked)}
                    />
                    <Label htmlFor="direct">دایرکت</Label>
                  </div>
                )}
              />
            </div>
            <div className="flex gap-2 items-center">
              <Controller
                name="post"
                control={control}
                render={({ field }) => (
                  <div className="flex gap-2 items-center">
                    <Switch
                      dir="ltr"
                      id="post"
                      checked={field.value}
                      onCheckedChange={(checked) => field.onChange(checked)}
                    />
                    <Label htmlFor="post">کامنت (پست یا لایو)</Label>
                  </div>
                )}
              />
            </div>
          </div>
          <p>کلمه یا جمله ای</p>

          {/* Scrollable container for conditions */}
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
                          <SelectItem value="contains">شامل</SelectItem>
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
                    onClick={() => deleteCondition(condition.id)}
                  />
                )}
              </div>
            ))}
          </div>

          {/* Add button to add more conditions */}
          <div
            className="flex items-center gap-4 cursor-pointer"
            onClick={addCondition}
          >
            <Plus size={24} />
            <span className="text-sm font-semibold text-blue-600">
              افزودن شرط جدید
            </span>
          </div>

          {/* Message input & post select */}
          <div className="space-y-4">
            {postAndMessage.map((postMessage, index) => (
              <div key={postMessage.id} className="space-y-4">
                <div className="flex gap-2 items-center">
                  <Button
                    className="flex gap-2"
                    variant={"outline"}
                    type="button" // This is a button to select a post, not for form submission
                  >
                    <span>
                      <PlusCircle size={15} />
                    </span>
                    انتخاب پست
                  </Button>

                  {postAndMessage.length > 1 && (
                    <Trash
                      size={24}
                      className="text-red-600 cursor-pointer"
                      onClick={() => deletePostAndMessage(postMessage.id)}
                    />
                  )}
                </div>

                {/* Message Input */}
                <Controller
                  name={`postAndMessage.${index}.message`}
                  control={control}
                  render={({ field }) => (
                    <textarea
                      className="w-2/4 border px-3 py-2 rounded-xl"
                      placeholder="پیام خود را وارد کنید"
                      {...field}
                    />
                  )}
                />

                {/* Select Time (1-24 hours) */}
                <Controller
                  name={`postAndMessage.${index}.time`}
                  control={control}
                  render={({ field }) => (
                    <Select {...field} dir="rtl" onValueChange={field.onChange}>
                      <SelectTrigger className="w-[180px]">
                        <SelectValue placeholder="انتخاب ساعت" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectGroup>
                          <SelectLabel>
                            انتخاب ساعت ارسال بعد از پست اول
                          </SelectLabel>
                          {Array.from({ length: 24 }, (_, i) => (
                            <SelectItem key={i + 1} value={String(i + 1)}>
                              {i + 1}
                            </SelectItem>
                          ))}
                        </SelectGroup>
                      </SelectContent>
                    </Select>
                  )}
                />
              </div>
            ))}
          </div>

          {/* Add button to add more post and message */}
          <div
            className="flex items-center gap-4 cursor-pointer"
            onClick={addPostAndMessage}
          >
            <Plus size={24} />
            <span className="text-sm font-semibold text-blue-600">افزودن</span>
          </div>

          {/* Checkbox options */}
          <div>
            {items.map((item) => (
              <Controller
                key={item.id}
                name="checkboxes"
                control={control}
                render={({ field }) => (
                  <div className="flex items-center py-2 gap-2">
                    <Checkbox
                      onCheckedChange={(checked) => {
                        return checked
                          ? field.onChange([...field.value, item.id])
                          : field.onChange(
                              field.value.filter((value) => value !== item.id)
                            );
                      }}
                    />
                    <label
                      htmlFor="terms"
                      className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                    >
                      {item.label}
                    </label>
                  </div>
                )}
              />
            ))}
          </div>

          {/* Submit button */}
          <Button className="bg-blue-600" type="submit">
            ایجاد
          </Button>
        </form>
      </div>
    </div>
  );
}
