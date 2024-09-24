"use client";
import { ChangeEvent, FormEventHandler, useEffect, useState } from "react";
import { useForm, useFieldArray, Controller } from "react-hook-form";
import { PlusCircle, Trash } from "@phosphor-icons/react";
import { Button } from "@/registry/new-york/ui/button";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  useContentStore,
  useCurrentTextAreaValue,
} from "@/store/contentCycleStore";
import SwitchOfForm from "./switchOfForm";
import ConditionWordForm from "./conditionWordForm";
import CheckBoxOptionForm from "./checkBoxOptionForm";
import { useFormSchema } from "../formSchema/useFormSchema";
import dynamic from "next/dynamic";
import { v4 as uuid } from "uuid";
import InstagramPostsDialog from "./instagramPosts.dialog";
import { z } from "zod";
import { Form, FormField, FormLabel } from "@/components/ui/form";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

export type ContentType = {
  id: string;
  message?: string;
  postId?: string;
  consent?: string;
};

export type ConditionType = {
  id?: string;
  type: string;
  value: string;
};

export const CONTENTCYCLE_EVENTS = {
  SelectPost: "selectPost",
};

export type SelectPostEventPayload = {
  postId: string;
};

const DragDropContext = dynamic(
  () =>
    import("react-beautiful-dnd").then((mod) => {
      return mod.DragDropContext;
    }),
  { ssr: false }
);
const Droppable = dynamic(
  () =>
    import("react-beautiful-dnd").then((mod) => {
      return mod.Droppable;
    }),
  { ssr: false }
);
const Draggable = dynamic(
  () =>
    import("react-beautiful-dnd").then((mod) => {
      return mod.Draggable;
    }),
  { ssr: false }
);
``;

export default function ContentCycle() {
  const [selectedPostId, setSelectedPostId] = useState<string>();
  const { adminContentCycle, setAdminContentCycle } = useContentStore();
  const { currentTextAreaValue, setCurrentTextAreaValue } =
    useCurrentTextAreaValue();
  // console.log("ERROR", errors);

  const [contents, setContents] = useState<ContentType[]>([
    { id: uuid(), message: "", postId: "" },
  ]);

  useEffect(() => {
    console.log(contents);
  }, [contents]);

  const addPostAndMessage = () => {
    setContents([...contents, { id: uuid(), message: "" }]);
  };

  const deletePostAndMessage = (id: any) => {
    setContents(contents.filter((item) => item.id !== id));
  };

  const contentCycleFormSchema = z.object({
    conditions: z.array(
      z.object({
        type: z.string(),
        value: z.string(),
        id: z.string().optional().nullable(),
      })
    ),
    contents: z.array(
      z.object({
        message: z.string(),
        postId: z.string(),
        consent: z.string()
      })
    ),
    checkboxes: z.array(z.string()).optional(),
    isDirect: z.boolean(),
    isComment: z.boolean(),
  });

  const form = useForm<z.infer<typeof contentCycleFormSchema>>({
    resolver: zodResolver(contentCycleFormSchema),
    defaultValues: {
      conditions: [{ type: "", value: "", id: uuid() }],
      contents: [
        {
          message: "",
        },
      ],
      checkboxes: [],
      isDirect: false,
      isComment: false,
    },
  });

  const {
    fields: contentsField,
    remove: removeContents,
    append: appendContents,
    update: updateContents,
    swap: swapContents,
    move: moveContents,
  } = useFieldArray({
    control: form.control,
    name: "contents", // The name should match the field in your defaultValues
  });
  const {
    fields: conditionsField,
    remove: removeConditions,
    append: appendConditions,
    update: updateConditions,
    swap: swapConditions,
    mov
  } = useFieldArray({
    control: form.control,
    name: "conditions", // The name should match the field in your defaultValues
  });


  const handleDragEnd = (result: any) => {
    if (!result.destination) return;
    console.log('Swap', result.source);
    
    // swapContents(result.source.index, result.destination.index);
    moveContents(result.source.index, result.destination.index);
    // if (!result.destination) return;
    // console.log("result", result);

    // const items = Array.from(contents);
    // const [reorderedItem] = items.splice(result.source.index, 1);
    // items.splice(result.destination.index, 0, reorderedItem);

    // setContents(items);
  };


  const onSubmit = (values: z.infer<typeof contentCycleFormSchema>) => {
    console.log(form.getValues());
  }

  useEffect(() => {
    console.log(form.getValues());
    
  }, )

  return (
    <div className="min-h-screen w-full">
      <div className="w-full min-h-[91.5vh]  bg-white rounded-2xl  mb-[10rem]">
        <h1 className="text-2xl font-bold px-6 py-8 border-b">
          محتوای انتخابی
        </h1>

        {/* Form wrapper */}
        <Form {...form}>
          <form  onSubmit={form.handleSubmit(onSubmit)} className="px-8 py-6 text-lg h-full space-y-8">
            {/* switch of form  COMPONENT*/}

            <div className="space-y-8">
              {" "}
              <p>اگر کاربر شما در</p>
              <div className="flex gap-4">
                <div className="flex gap-2 items-center">
                  <FormField
                    control={form.control}
                    name="isDirect"
                    render={({ field }) => (
                      <div className="flex gap-2 items-center">
                        <Switch
                          dir="ltr"
                          id="direct"
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                        <FormLabel htmlFor="direct">دایرکت</FormLabel>
                      </div>
                    )}
                  ></FormField>
                </div>
                <div className="flex gap-2 items-center">
                  <FormField
                    control={form.control}
                    name="isComment"
                    render={({ field }) => (
                      <div className="flex gap-2 items-center">
                        <Switch
                          dir="ltr"
                          id="direct"
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                        <FormLabel htmlFor="direct">دایرکت</FormLabel>
                      </div>
                    )}
                  ></FormField>
                </div>
              </div>
            </div>

            {/* condition word COMPONENT*/}

            <div>
              <p>کلمه یا جمله ای</p>
              <div className=" space-y-4">
                {conditionsField.map((condition, index) => (
                  <div key={condition.id} className="flex gap-4 items-center">
                    <Controller
                      name={`conditions.${index}.type`}
                      control={form.control}
                      render={({ field }) => (
                        <Select
                          {...field}
                          dir="rtl"
                          onValueChange={field.onChange}
                        >
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
                      control={form.control}
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
                    {form.getValues().conditions.length > 1 && (
                      <Trash
                        size={24}
                        className="text-red-600 cursor-pointer"
                        onClick={() => removeConditions(index)}
                      />
                    )}
                    <Button
                      onClick={() =>
                        appendConditions({ type: "", value: "", id: uuid() })
                      }
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

            {/* Message input & post select */}
            <p>را ارسال کند پیام زیر برایش ارسال شود</p>
            <Button
              variant="ghost"
              onClick={() =>
                appendContents({ message: "", postId: "", consent: '' })
              }
              className="flex items-center gap-2 cursor-pointer"
            >
              <PlusCircle size={24} />
              <span className="text-sm font-semibold text-blue-600">
                افزودن محتوا
              </span>
            </Button>
            <DragDropContext onDragEnd={handleDragEnd}>
              <Droppable droppableId="ROOT">
                {(dprovided) => (
                  <div
                    className="space-y-4"
                    {...dprovided.droppableProps}
                    ref={dprovided.innerRef}
                  >
                    {contentsField.map((content, index) => (
                      <Draggable
                        key={content.id}
                        draggableId={content.id}
                        index={index}
                      >
                        {(provided) => (
                          <div
                            className="space-y-4 border-[1.2px] p-2 rounded-2xl"
                            {...provided.draggableProps}
                            {...provided.dragHandleProps}
                            ref={provided.innerRef}
                          >
                            <div className="flex">
                              <InstagramPostsDialog
                                index={index}
                                form={form}
                              />
                              {contents.length > 1 && (
                                <Trash
                                  size={24}
                                  className="text-red-600 cursor-pointer"
                                  onClick={() => removeContents(index)}
                                />
                              )}
                            </div>
                            <div className="flex flex-col gap-2">
                              <Controller
                                name={`contents.${index}.message`}
                                control={form.control}
                                render={({ field }) => (
                                  <Textarea
                                    className="w-4/5 border px-3 py-2 rounded-xl"
                                    placeholder="پیام خود را وارد کنید"
                                    {...field}
                                  />
                                )}
                              />

                              <Controller
                                name={`contents.${index}.consent`}
                                control={form.control}
                                render={({ field }) => (
                                  <Textarea
                                    className="w-4/5 border px-3 py-2 rounded-xl"
                                    placeholder="پیام کسب اجازه: آیا مایل به ادامه هستید؟..."
                                    {...field}
                                  />
                                )}
                              />
                            </div>
                          </div>
                        )}
                      </Draggable>
                    ))}
                    {dprovided.placeholder}
                  </div>
                )}
              </Droppable>
            </DragDropContext>

            {/* Checkbox options COMPONENT */}

            <CheckBoxOptionForm control={form.control} />

            {/* Submit button */}
            <Button className="bg-blue-600" type="submit">
              ایجاد
            </Button>
          </form>
        </Form>
      </div>
    </div>
  );
}
