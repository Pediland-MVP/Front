"use client";
import { useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { Input } from "@/registry/new-york/ui/input";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectLabel,
  SelectValue,
} from "@/registry/new-york/ui/select";
import { Dialog, DialogTrigger } from "@/registry/new-york/ui/dialog";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/registry/new-york/ui/tabs";
import { PlusCircle, Trash } from "@phosphor-icons/react";
import { Button } from "@/registry/new-york/ui/button";
import { zodResolver } from "@hookform/resolvers/zod";
import ModalPost from "./ModalPost";
import ContentCycleLeads from "./contentCycleLeads";
import {
  useContentStore,
  useCurrentTextAreaValue,
} from "@/store/contentCycleStore";
import SwitchOfForm from "./switchOfForm";
import ConditionWordForm from "./conditionWordForm";
import CheckBoxOptionForm from "./checkBoxOptionForm";
import { useFormSchema } from "../formSchema/useFormSchema";
import { Textarea } from "@/registry/new-york/ui/textarea";

export default function ContentCycle() {
  const { adminContentCycle, setAdminContentCycle } = useContentStore();
  const { currentTextAreaValue, setCurrentTextAreaValue } =
    useCurrentTextAreaValue();
  const [postAndMessage, setPostAndMessage] = useState([{ id: 1 }]);
  const [newButton, setNewButton] = useState([{ id: 1 }]);
  const [test, setTest] = useState("");
  const [titleBtn, setTitleBtn] = useState("");
  const [textBtn, setTextBtn] = useState("");

  // Validation schema using Zod
  const formSchema = useFormSchema();

  // Initialize form with react-hook-form and zod validation
  const {
    control,
    handleSubmit,
    watch,
    unregister,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(formSchema),
    defaultValues: {
      conditions: [{ type: "", value: "" }],
      postAndMessage: [
        {
          message: [""],
          time: "",
          button: [{ btnTitle: [""], btnText: [""] }],
        },
      ],
      checkboxes: [],
      direct: false,
      post: false,
    },
  });

  console.log("ERROR", errors);

  // Submit handler
  const onSubmit = (data: any) => {
    console.log("Form submitted:", data);
    setAdminContentCycle([...adminContentCycle, test]);
    setCurrentTextAreaValue("");
  };

  // Add a new postAndMessage section
  const addPostAndMessage = () => {
    setPostAndMessage([...postAndMessage, { id: Date.now() }]);
  };
  const addNewButton = () => {
    setNewButton([...newButton, { id: Date.now() }]);
  };
  const deletePostAndMessage = (id: number, index: number) => {
    setPostAndMessage(postAndMessage.filter((pm) => pm.id !== id));
    unregister(`postAndMessage.${index}.message`);
    unregister(`postAndMessage.${index}.button`);
    unregister(`postAndMessage.${index}.time`);

    setAdminContentCycle([""]);
    setCurrentTextAreaValue("");
    setTest("");
  };

  return (
    <div className="pr-[21rem] min-h-screen mb-[40rem] w-full">
      <Tabs defaultValue="account" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="account">Account</TabsTrigger>
          <TabsTrigger value="password">Password</TabsTrigger>
        </TabsList>
        <TabsContent dir="rtl" value="account">
          <div className="w-full min-h-[91.5vh]  bg-white rounded-2xl shadow-md mb-[10rem]">
            <h1 className="text-2xl font-bold px-6 py-8 border-b">
              محتوای انتخابی
            </h1>

            {/* Form wrapper */}
            <form
              onSubmit={handleSubmit(onSubmit)}
              className="px-8 py-6 text-lg h-full space-y-8"
            >
              {/* switch of form  COMPONENT*/}

              <SwitchOfForm control={control} />

              {/* condition word COMPONENT*/}

              <ConditionWordForm control={control} />

              {/* Message input & post select */}

              <div className="space-y-4">
                {postAndMessage.map((postMessage, index) => (
                  <div key={postMessage.id} className="space-y-4">
                    <div className="flex">
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button
                            className="flex gap-2 "
                            variant={"outline"}
                            type="button" // This is a button to select a post, not for form submission
                          >
                            انتخاب پست
                            <span>
                              <PlusCircle size={19} />
                            </span>
                          </Button>
                        </DialogTrigger>
                        <ModalPost />
                      </Dialog>
                      {/* Add button to add more post and message */}
                      <Button
                        variant="ghost"
                        onClick={() => {
                          addPostAndMessage();
                          setTest("");
                          setAdminContentCycle([...adminContentCycle, test]);
                          setCurrentTextAreaValue(null);
                        }}
                        className="flex items-center gap-2 cursor-pointer"
                      >
                        <PlusCircle size={24} />
                        <span className="text-sm font-semibold text-blue-600">
                          افزودن پیام(پست یا دکمه) جدید با تایمر
                        </span>
                      </Button>
                      {postAndMessage.length > 1 && (
                        <Trash
                          size={24}
                          className="text-red-600 cursor-pointer"
                          onClick={() =>
                            deletePostAndMessage(postMessage.id, index)
                          }
                        />
                      )}
                    </div>
                    {/* Message Input */}
                    <div className="flex flex-col gap-2">
                      <div className="flex gap-2 items-center">
                        <Controller
                          key={index}
                          name={`postAndMessage.${index}.message`}
                          control={control}
                          render={({ field }) => (
                            <Textarea
                              key={index}
                              className="w-4/5 border px-3 py-2 rounded-xl"
                              placeholder="پیام خود را وارد کنید"
                              {...field}
                              value={field.value}
                              // value={test}
                              onChange={(e) => {
                                const newValue = e.target.value;
                                setTest(newValue);
                                setCurrentTextAreaValue(newValue);
                                field.onChange([newValue]);
                              }}
                            />
                          )}
                        />
                        {/* <Button
                          onClick={() => {
                            setAdminContentCycle([...adminContentCycle, test]);
                            setTest("");
                          }}
                        >
                          ایجاد
                        </Button> */}
                      </div>

                      {/* add new button */}
                      <div className="flex flex-col gap-2">
                        {newButton.map((button, btnIndex) => (
                          <div key={button.id} className="flex gap-2">
                            <Controller
                              name={`postAndMessage.${index}.button.${btnIndex}.btnTitle`} // Correct index
                              control={control}
                              render={({ field }) => (
                                <Input
                                  {...field}
                                  placeholder="نام دکمه"
                                  className="w-1/4"
                                  value={field.value}
                                  onChange={(e) => {
                                    const newValue = e.target.value;
                                    setTitleBtn(newValue);
                                    field.onChange([newValue]);
                                  }}
                                />
                              )}
                            />

                            <Controller
                              name={`postAndMessage.${index}.button.${btnIndex}.btnText`}
                              control={control}
                              render={({ field }) => (
                                <Input
                                  {...field}
                                  placeholder="متن دکمه"
                                  className="w-1/4"
                                  value={field.value}
                                  onChange={(e) => {
                                    const newValue = e.target.value;
                                    setTextBtn(newValue);
                                    field.onChange([newValue]);
                                  }}
                                />
                              )}
                            />
                          </div>
                        ))}

                        <div>
                          <Button
                            variant={"outline"}
                            className="flex items-center gap-2 cursor-pointer"
                            onClick={() => addNewButton()}
                          >
                            <PlusCircle size={19} />
                            <span className="text-sm font-semibold ">
                              افزودن دکمه
                            </span>
                          </Button>
                        </div>
                      </div>
                    </div>

                    {/* Select Time (1-24 hours) */}
                    {postAndMessage.length > 1 &&
                      postAndMessage[index].id > 1 && (
                        <Controller
                          name={`postAndMessage.${index}.time`}
                          control={control}
                          render={({ field }) => (
                            <Select
                              {...field}
                              dir="rtl"
                              onValueChange={field.onChange}
                            >
                              <SelectTrigger className="w-[180px]">
                                <SelectValue placeholder="انتخاب ساعت" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectGroup>
                                  <SelectLabel>
                                    انتخاب ساعت ارسال بعد از پست اول
                                  </SelectLabel>
                                  {Array.from({ length: 24 }, (_, i) => (
                                    <SelectItem
                                      key={i + 1}
                                      value={String(i + 1)}
                                    >
                                      {i + 1}
                                    </SelectItem>
                                  ))}
                                </SelectGroup>
                              </SelectContent>
                            </Select>
                          )}
                        />
                      )}
                  </div>
                ))}
              </div>

              {/* Checkbox options COMPONENT */}

              <CheckBoxOptionForm control={control} />

              {/* Submit button */}
              <Button className="bg-blue-600" type="submit">
                ایجاد
              </Button>
            </form>
          </div>
        </TabsContent>
        <TabsContent dir="rtl" value="password">
          <ContentCycleLeads />
        </TabsContent>
      </Tabs>
    </div>
  );
}
