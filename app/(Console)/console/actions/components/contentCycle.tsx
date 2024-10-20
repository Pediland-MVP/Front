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
import ErrorMessage from "@/components/ui/errorMessage";
import { useToast } from "@/components/ui/use-toast";
import { useRouter } from "next/navigation";
import LoadingButton from "@/components/ui/loading-button";
import * as _ from "lodash";

import LoadingSpinner from "@/components/ui/loadingSpinner";

import dynamic from "next/dynamic";
import ProductsDialog from "../content-cycle/components/products.dialog";
import { v4 } from "uuid";

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
1;
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

/**
 *
 * @param {id} Object This param is optional and specify the component is for Update or Create`
 * @returns
 */
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
          conditionId: z.string().optional().nullable(),
        })
      )
      .min(1, "حداقل یک شرط الزامی است"),
    contents: z
      .array(
        z.object({
          text: z.string().min(1, "پیام الزامی است"),
          instagramMedia: z.object({
            image: z.object({
              url: z.string().optional().nullable(),
              id: z.number().optional().nullable(),
            }).nullable().optional(),
            mediaId: z.string().min(1, "انتخاب پست الزامی است"),
          }),
          id: z.string().optional().nullable(),
          consentText: z.string().min(1, "پیام کسب اجازه الزامی است"),
          _xid: z.string().optional().nullable(),
        })
      )
      .min(2, "حداقل دو محتوا الزامی است"),
    products: z.array(
      z.object({
        id: z.string().optional().nullable(),
        images: z.array(z.object({url: z.string().optional().nullable(), id: z.number().optional().nullable()})).optional().nullable(),
        _xid: z.string().optional().nullable(),
      })
    ),
    isProductsEnabled: z.boolean(),
    isDirect: z.boolean(),
    isComment: z.boolean(),
    justFollowers: z.boolean(),
    likeDirect: z.boolean(),
    followMessage: z.string().optional().nullable(),
    followCheckMessage: z.string().optional().nullable(),
    cta: z.string().min(1, "متن مرحله پایانی اجباری است"),
    commentStartText: z.string().optional().nullable(),
    getUserData: z
      .object({
        type: z.enum(["email", "mobile"]),
        text: z.string(),
        enabled: z.boolean(),
      })
      .optional(),
  });

  const form = useForm<z.infer<typeof contentCycleFormSchema>>({
    resolver: zodResolver(contentCycleFormSchema),
    defaultValues: {
      conditions: [{ type: "EQUAL", value: "", id: "" }],
      contents: [
        {
          text: "",
          instagramMedia: {
            mediaId: "",
          },
          consentText: "",
          // _xid: uuid()
        },
        {
          text: "",
          instagramMedia: {
            mediaId: "",
          },
          consentText: "",
          // _xid: uuid()
        },
      ],
      products: [],
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

      const contentCycle = await response.json()
      form.reset({...contentCycle, ...contentCycle.products?.length > 0 && { isProductsEnabled: true }});
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
    keyName: "_xid",
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
    keyName: "_xid",
  });

  const {
    fields: productsField,
    remove: removeProducts,
    append: appendProducts,
    update: updateProducts,
    swap: swapProducts,
    move: moveProducts,
  } = useFieldArray({
    control: form.control,
    name: "products",
    keyName: "_xid",
  });

  const handleContentsDragEnd = (result: any) => {
    if (!result.destination) return;
    moveContents(result.source.index, result.destination.index);
  };

  const handleProductsDragEnd = (result: any) => {
    if (!result.destination) return;
    moveProducts(result.source.index, result.destination.index);
  };

  const onSubmit = async (values: z.infer<typeof contentCycleFormSchema>) => {
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

    const productsIds = values.products.map((p) => p.id);

    if (haveError) {
      setIsSubmitting(false);
      return;
    }
    setIsSubmitting(true);

    const result = await fetch(
      `${process.env.NEXT_PUBLIC_BACK_API_URL}/contentCycle${
        id ? `/${id}` : ""
      }`,
      {
        method: id ? "PATCH" : "POST",
        headers: {
          "Content-Type": "application/json",
        },
        // Delete Empty values
        body: JSON.stringify({
          ..._.omitBy(values, (value: any) =>
            typeof value === "boolean" ? false : _.isEmpty(value)
          ),
          productsIds
        }),
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
    setIsSubmitting(false);
  };

  useEffect(() => {
    console.log(form.getValues());
    console.log(form.formState.errors);
  }, [form.watch()]);

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
                          appendConditions({ type: "EQUAL", value: "", id: "" })
                        }
                        variant="ghost"
                        type="button"
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
                  appendContents({
                    text: "",
                    instagramMedia: { mediaId: "" },
                    consentText: "",
                  })
                }
                type="button"
                className="flex items-center gap-2 cursor-pointer"
              >
                <PlusCircle size={24} />
                <span className="text-sm font-semibold text-blue-600">
                  افزودن محتوا
                </span>
              </Button>
              <DragDropContext onDragEnd={handleContentsDragEnd}>
                <Droppable droppableId="contents">
                  {(dprovided) => (
                    <div
                      {...dprovided.droppableProps}
                      className="space-y-4"
                      ref={dprovided.innerRef}
                    >
                      {contentsField.map((content, index) => {
                        return (
                          <Draggable
                            key={content.id}
                            draggableId={content._xid}
                            index={index}
                          >
                            {(provided) => {
                              return (
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
                              );
                            }}
                          </Draggable>
                        );
                      })}
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
                        <Switch
                          dir="ltr"
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
                          <Input
                            placeholder="فالو کردم"
                            {...field}
                            value={field.value ?? ""}
                          />
                        </FormControl>
                        {error && <FormMessage> {error.message} </FormMessage>}
                      </FormItem>
                    )}
                  />
                </>
              )}

              <FormField
                control={form.control}
                name="isProductsEnabled"
                render={({ field }) => {
                  return (
                    <FormItem className="flex flex-col justify-start gap-y-4">
                      <div className="flex items-center gap-x-2 mb-2">
                        <FormControl>
                          <Switch
                            dir="ltr"
                            checked={field.value}
                            onCheckedChange={(e) => {
                              if (e) {
                                if (form.getValues().products?.length === 0) {
                                  appendProducts({});
                                }
                              }
                              return field.onChange(e);
                            }}
                          />
                        </FormControl>
                        <FormLabel className="">
                          ارسال کاتالوگ محصولات
                        </FormLabel>
                      </div>
                      {field.value && (
                        <div>
                          <Button
                            variant="ghost"
                            type="button"
                            onClick={() => appendProducts({})}
                            className="flex items-center gap-2 cursor-pointer"
                          >
                            <PlusCircle size={24} />
                            <span className="text-sm font-semibold text-blue-600">
                              افزودن محصول
                            </span>
                          </Button>
                          <DragDropContext onDragEnd={handleProductsDragEnd}>
                            <Droppable droppableId="products">
                              {(dprovided) => (
                                <div
                                  className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
                                  style={{
                                    gridTemplateRows:
                                      "repeat(auto-fill, minmax(200px, 1fr))",
                                  }}
                                  {...dprovided.droppableProps}
                                  ref={dprovided.innerRef}
                                >
                                  {productsField.map((product, index) => (
                                    <Draggable
                                      key={product._xid}
                                      draggableId={product._xid}
                                      index={index}
                                    >
                                      {(provided) => (
                                        <div
                                          className="flex flex-col justify-center items-center gap-x-4 p-2 rounded-2xl border-[1.2px]"
                                          style={{ aspectRatio: "1/1" }}
                                          {...provided.draggableProps}
                                          {...provided.dragHandleProps}
                                          ref={provided.innerRef}
                                        >
                                          <div className="relative flex justify-center items-center">
                                            <ProductsDialog
                                              index={index}
                                              productsField={productsField}
                                              updateProducts={updateProducts}
                                              form={form}
                                            />
                                            {productsField.length > 2 && (
                                              <Trash
                                                size={24}
                                                className="text-red-600 cursor-pointer absolute z-50 top-0 -right-10"
                                                onClick={() =>
                                                  removeProducts(index)
                                                }
                                              />
                                            )}
                                          </div>
                                          <div className="flex flex-col gap-2 w-full"></div>
                                        </div>
                                      )}
                                    </Draggable>
                                  ))}
                                  {dprovided.placeholder}
                                </div>
                              )}
                            </Droppable>
                          </DragDropContext>
                        </div>
                      )}
                    </FormItem>
                  );
                }}
              ></FormField>

              <FormField
                control={form.control}
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
                      <FormLabel className="">دریافت اطلاعات کاربر</FormLabel>
                    </div>
                    {field.value && (
                      <div className="mt-2">
                        <FormField
                          control={form.control}
                          name="getUserData.type"
                          render={({ field: selectField }) => (
                            <FormItem>
                              <FormLabel className="">
                                انتخاب نوع اطلاعات
                              </FormLabel>
                              <FormControl>
                                <Select
                                  {...selectField}
                                  dir="rtl"
                                  onValueChange={selectField.onChange}
                                >
                                  <SelectTrigger className="w-[180px]">
                                    <SelectValue placeholder="انتخاب کنید" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectGroup>
                                      <SelectItem value="email" defaultChecked>
                                        ایمیل
                                      </SelectItem>
                                      <SelectItem value="mobile">
                                        شماره موبایل
                                      </SelectItem>
                                    </SelectGroup>
                                  </SelectContent>
                                </Select>
                              </FormControl>
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="getUserData.text"
                          render={({ field: textField }) => (
                            <FormItem>
                              <FormLabel className="">متن سوال</FormLabel>
                              <FormControl>
                                <Input
                                  placeholder={`لطفا شماره موبایل خود را وارد کنید`}
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

              <FormField
                control={form.control}
                name="likeDirect"
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
