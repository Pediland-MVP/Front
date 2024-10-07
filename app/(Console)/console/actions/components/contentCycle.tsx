"use client";
import { useEffect, useState } from "react";
import { useForm, useFieldArray, Controller } from "react-hook-form";
import { PlusCircle, Trash } from "@phosphor-icons/react";
import { Button } from "@/registry/new-york/ui/button";
import { zodResolver } from "@hookform/resolvers/zod";
import InstagramPostsDialog from "./instagramPosts.dialog";
import { z } from "zod";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import ErrorMessage from "@/components/ui/errorMessage";
import { useToast } from "@/components/ui/use-toast";
import { useRouter } from "next/navigation";
import LoadingButton from "@/components/ui/loading-button";
import * as _ from "lodash";
import { DragDropContext, Droppable, Draggable } from "@/components/client/dnd";
import LoadingSpinner from "@/components/ui/loadingSpinner";

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

type ContentCycleProps = {
  id?: string;
};

export default function ContentCycle({ id }: ContentCycleProps) {
  const [isLoading, setIsLoading] = useState<boolean>(id ? true : false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const { toast } = useToast();
  const router = useRouter();

  const contentCycleFormSchema = z.object({
    conditions: z
      .array(
        z.object({
          type: z.string().min(1, "نوع شرط الزامی است"),
          value: z.string().min(1, "مقدار شرط الزامی است"),
          id: z.string(),
          conditionId: z.string().optional().nullable()
        })
      )
      .min(1, "حداقل یک شرط الزامی است"),
    contents: z
      .array(
        z.object({
          text: z.string().min(1, "پیام الزامی است"),
          instagramMedia: z.object({
            mediaUrl: z.string().optional().nullable(),
            mediaId: z.string().min(1, 'انتخاب پست الزامی است')
          }),
          id: z.string().optional().nullable(),
          consentText: z.string().min(1, "پیام کسب اجازه الزامی است"),
        })
      )
      .min(2, "حداقل دو محتوا الزامی است"),
    isDirect: z.boolean(),
    isComment: z.boolean(),
    justFollowers: z.boolean(),
    likeDirect: z.boolean(),
    followMessage: z.string().optional().nullable(),
    followCheckMessage: z.string().optional().nullable(),
    cta: z.string().min(1, "متن مرحله پایانی اجباری است"),
    commentStartText: z.string().optional().nullable(),
  });

  const form = useForm<z.infer<typeof contentCycleFormSchema>>({
    resolver: zodResolver(contentCycleFormSchema),
    defaultValues: {
      conditions: [{ type: "EQUAL", value: "", id: "" }],
      contents: [
        {
          text: "",
          instagramMedia: {
            mediaId: ""
          },
          consentText: "",
        },
        {
          text: "",
          instagramMedia: {
            mediaId: ""
          },
          consentText: "",
        },
      ],
      isDirect: true,
      isComment: false,
      justFollowers: false,
      followCheckMessage: "",
      followMessage: "",
      likeDirect: false,
      cta: "",
      commentStartText: "",
    },
  });

  useEffect(() => {
    console.log('id', id);
    
    if (!id) return;
    setIsLoading(true);
    const fetchData = async () => {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_BACK_API_URL}/contentCycle/${id}`,
        {
          credentials: "include",
          method: "GET",
        }
      );

      if (!response.ok) {
        console.error("Error in fetching contentCycle data", response.json());

        toast({
          title: "خطا",
          description: "مشکلی پیش آمده است",
          variant: "destructive",
        });
        router.push("/console/actions/content-cycle");
        return;
      }

      form.reset(await response.json());
    };

    fetchData().finally(() => setIsLoading(false));
  }, [id]);


  const {
    fields: contentsField,
    remove: removeContents,
    append: appendContents,
    update: updateContents,
    swap: swapContents,
    move: moveContents,
  } = useFieldArray({
    control: form.control,
    name: "contents",
    keyName: '_xid'
  });
  const {
    fields: conditionsField,
    remove: removeConditions,
    append: appendConditions,
    update: updateConditions,
    swap: swapConditions,
  } = useFieldArray({
    control: form.control,
    name: "conditions",
    keyName: "_xid"
  });

  const handleDragEnd = (result: any) => {
    if (!result.destination) return;
    moveContents(result.source.index, result.destination.index);
  };

  const onSubmit = async (values: z.infer<typeof contentCycleFormSchema>) => {
    console.log('Submiting');
    
    // Validate Optionals
    let haveError: boolean = false;
    if (!values.isComment && !values.isDirect) {
      form.setError("isDirect", {
        message: "باید حداقل یکی از حالت‌های کامنت و دایرکت روشن باشد",
      });
      form.setFocus("isDirect");
      haveError = true;
    }

    if (values.isComment && !values.commentStartText) {
      form.setError("commentStartText", {
        message: "در حالت کامنت، پیام درخواست شروع ضروری است",
      });
      form.setFocus("commentStartText");
      haveError = true;
    }

    if (values.justFollowers) {
      if (!values.followMessage) {
        form.setError("followMessage", {
          message: "متن درخواست فالو در این حالت اجباری است",
        });
        form.setFocus("followMessage");
        haveError = true;
      }
      if (!values.followCheckMessage) {
        form.setError("followCheckMessage", {
          message: "متن دکمه بررسی مجدد در این حالت اجباری است",
        });
        form.setFocus("followCheckMessage");
        haveError = true;
      }
    }

    if (haveError) {
      setIsSubmitting(false);
      return;
    }
    setIsSubmitting(true);

    const result = await fetch(
      `${process.env.NEXT_PUBLIC_BACK_API_URL}/contentCycle${id ? `/${id}` : ''}`,
      {
        method: id ? "PATCH" : "POST",
        headers: {
          "Content-Type": "application/json",
        },
        // Delete Empty values
        body: JSON.stringify(
          _.omitBy(values, (value: any) =>
            typeof value === "boolean" ? false : _.isEmpty(value)
          )
        ),
        credentials: "include",
      }
    );

    if (!result.ok) {
      toast({
        title: "خطایی رخ داد",
        description: "لطفا مجددا امتحان کنید",
        variant: "destructive",
      });
      setIsSubmitting(false);
      return;
    }

    toast({ title: "با موفقیت ساخته شد" });
    router.push("/console/actions/content-cycle");
    console.log(await result.json());
    setIsSubmitting(false);
  };

  useEffect(() => {
    console.log(form.getValues());
    console.log(form.formState.errors);
    
  }, [form.watch('contents')])

  // useEffect(() => {
  //   setInterval(() => {
  //     console.log('form', form.getValues());
  //   }, 500)
  // }, [])


  return (
    <div className="min-h-screen w-full">
      {isLoading ? (
        <div className="min-h-screen w-full flex justify-center items-center">
          <LoadingSpinner className="h-20 w-20 text-gray-500" />
        </div>
      ) : (
        <div className="w-full min-h-[91.5vh]  bg-white rounded-2xl  mb-[10rem]">
          <h1 className="text-2xl font-bold px-6 py-8 border-b">
            محتوای انتخابی
          </h1>

          {/* Form wrapper */}
          <Form {...form}>
            <form
              onSubmit={form.handleSubmit(onSubmit)}
              className="px-8 py-6 text-lg h-full space-y-8"
            >
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
                          <FormMessage />
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
                          <FormLabel htmlFor="direct">کامنت</FormLabel>
                        </div>
                      )}
                    ></FormField>
                  </div>
                </div>
              </div>

              {form.getValues().isComment && (
                <FormField
                  control={form.control}
                  name="commentStartText"
                  render={({ field, fieldState: { error } }) => (
                    <div>
                      <FormLabel> پیام درخواست شروع </FormLabel>
                      <Textarea
                        {...field}
                        value={field.value ?? ""}
                        placeholder="لطفا برای شروع فرایند روی دکمه شروع بزنید..."
                      ></Textarea>
                      {error && <FormMessage> {error.message} </FormMessage>}
                    </div>
                  )}
                ></FormField>
              )}

              {/* condition word COMPONENT*/}

              <div>
                <p>کلمه یا جمله ای</p>
                <div className=" space-y-4">
                  {conditionsField.map((condition, index) => (
                    <div key={condition.id} className="flex gap-4 items-center">
                      <Controller
                        name={`conditions.${index}.type`}
                        control={form.control}
                        defaultValue="EQUAL"
                        render={({ field, fieldState: { error } }) => (
                          <FormItem>
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
                                  <SelectItem value="EQUAL">برابر</SelectItem>
                                  <SelectItem value="INCLUDE">شامل</SelectItem>
                                </SelectGroup>
                              </SelectContent>
                            </Select>
                            {error && (
                              <FormMessage>{error.message}</FormMessage>
                            )}
                          </FormItem>
                        )}
                      />
                      <span className="text-sm">با</span>
                      <Controller
                        name={`conditions.${index}.value`}
                        control={form.control}
                        render={({ field, fieldState: { error } }) => (
                          <FormItem>
                            <Input
                              {...field}
                              className="max-w-[15rem]"
                              type="text"
                              placeholder="مقدار"
                            />
                            {/* {error && (
                            <FormMessage> {error.message} </FormMessage>
                          )} */}
                          </FormItem>
                        )}
                      />

                      {/* Delete Icon */}
                      {form.getValues().conditions?.length > 1 && (
                        <Trash
                          size={24}
                          className="text-red-600 cursor-pointer"
                          onClick={() => removeConditions(index)}
                        />
                      )}
                      <Button
                        onClick={() =>
                          appendConditions({ type: "EQUAL", value: "", id: '' })
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

              {form?.formState?.errors?.conditions?.map &&
                form.formState.errors.conditions.map((state, index) => {
                  return (
                    <ErrorMessage key={index}>
                      {state?.value?.message}
                    </ErrorMessage>
                  );
                })}

              {/* Message input & post select */}
              <p>را ارسال کند پیام زیر برایش ارسال شود</p>
              <Button
                variant="ghost"
                onClick={() =>
                  appendContents({ text: "", instagramMedia: {mediaId: ""}, consentText: "" })
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
                          draggableId={content._xid}
                          index={index}
                        >
                          {(provided) => (
                            <div
                              className="space-y-4 border-[1.2px] p-2 rounded-2xl flex gap-x-4"
                              {...provided.draggableProps}
                              {...provided.dragHandleProps}
                              ref={provided.innerRef}
                            >
                              <div className="relative flex justify-center items-center w-48">
                                <InstagramPostsDialog
                                  index={index}
                                  updateContents={updateContents}
                                  form={form}
                                  contents={contentsField}
                                />
                                {contentsField.length > 2 && (
                                  <Trash
                                    size={24}
                                    className="text-red-600 cursor-pointer absolute z-50 top-0 -right-10"
                                    onClick={() => removeContents(index)}
                                  />
                                )}
                              </div>
                              <div className="flex flex-col gap-2 w-full">
                                <Controller
                                  name={`contents.${index}.text`}
                                  control={form.control}
                                  render={({
                                    field,
                                    fieldState: { error },
                                  }) => (
                                    <FormItem>
                                      <Textarea
                                        className="w-full border px-3 py-2 rounded-xl"
                                        placeholder="پیام خود را وارد کنید"
                                        {...field}
                                      />
                                      {error && (
                                        <FormMessage>
                                          {" "}
                                          {error.message}{" "}
                                        </FormMessage>
                                      )}
                                    </FormItem>
                                  )}
                                />

                                <Controller
                                  name={`contents.${index}.consentText`}
                                  control={form.control}
                                  render={({
                                    field,
                                    fieldState: { error },
                                  }) => (
                                    <FormItem>
                                      <Textarea
                                        className="w-full border px-3 py-2 rounded-xl"
                                        placeholder="پیام کسب اجازه: آیا مایل به ادامه هستید؟..."
                                        {...field}
                                      />
                                      {error && (
                                        <FormMessage>
                                          {" "}
                                          {error.message}{" "}
                                        </FormMessage>
                                      )}
                                    </FormItem>
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

              <FormField
                name="cta"
                control={form.control}
                render={({ field, fieldState: { error } }) => {
                  return (
                    <div>
                      <FormLabel>متن مرحله پایانی</FormLabel>
                      <Textarea
                        {...field}
                        placeholder="خیلی ممنون که چرخه رو کامل کردید..."
                      />
                      {error && <FormMessage> {error.message} </FormMessage>}
                    </div>
                  );
                }}
              ></FormField>

              {/* Checkbox options COMPONENT */}

              <FormField
                control={form.control}
                name="justFollowers"
                render={({ field }) => (
                  <FormItem className="flex flex-col justify-start gap-y-2">
                    <div className="flex items-center gap-x-2">
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                      <FormLabel className="">
                        ارسال به شرط فالو داشتن صفحه
                      </FormLabel>
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {form.getValues().justFollowers && (
                <>
                  <FormField
                    control={form.control}
                    name="followMessage"
                    render={({ field, fieldState: { error } }) => (
                      <FormItem>
                        <FormLabel className="">متن پیام</FormLabel>
                        <p className="text-sm mb-1">
                          با فعال کردن این گزینه، پیام مشخص شده در صورتی ارسال
                          می‌شود که کاربر، صفحه شما را دنبال (فالو) کرده باشد در
                          غیر این صورت پیام زیر نمایش داده می‌شود.
                        </p>
                        <FormControl>
                          <Input
                            placeholder="لطفا برای ادامه صفحه ما را فالو کنید ..."
                            {...field}
                            value={field.value ?? ""}
                          />
                        </FormControl>
                        {error && <FormMessage> {error.message} </FormMessage>}
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="followCheckMessage"
                    render={({ field, fieldState: { error } }) => (
                      <FormItem>
                        <FormLabel className="">متن دکمه بررسی مجدد</FormLabel>
                        <FormControl>
                          <Input placeholder="فالو کردم" {...field} value={field.value ?? ""} />
                        </FormControl>
                        {error && <FormMessage> {error.message} </FormMessage>}
                      </FormItem>
                    )}
                  />
                </>
              )}

              <FormField
                control={form.control}
                name="likeDirect"
                render={({ field }) => (
                  <FormItem className="flex flex-col justify-start gap-y-2">
                    <div className="flex items-center gap-x-2">
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                      <FormLabel className="">
                        لایک کردن پیام‌های دایرکت
                      </FormLabel>
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Submit button */}
              <LoadingButton isLoading={isSubmitting}>ایجاد</LoadingButton>
            </form>
          </Form>
        </div>
      )}
    </div>
  );
}
