"use client";
import { useEffect, useState } from "react";
import { useForm, Controller, useFieldArray } from "react-hook-form";
import { Dialog, DialogTrigger } from "@/registry/new-york/ui/dialog";
import { PlusCircle, Trash } from "@phosphor-icons/react";
import { Button } from "@/registry/new-york/ui/button";
import { zodResolver } from "@hookform/resolvers/zod";
import ModalPost from "./ModalPost";
import {
  useContentStore,
  useCurrentTextAreaValue,
} from "@/store/contentCycleStore";
import SwitchOfForm from "./switchOfForm";
import ConditionWordForm from "./conditionWordForm";
import CheckBoxOptionForm from "./checkBoxOptionForm";
import { useFormSchema } from "../formSchema/useFormSchema";
import dynamic from "next/dynamic";

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
import { v4 as uuid } from "uuid";
import InstagramPostsDialog from "./instagramPosts.dialog";
import EE from "@/lib/ee";

export default function ContentCycle() {
  const [selectedPostId, setSelectedPostId] = useState<string>();
  const { adminContentCycle, setAdminContentCycle } = useContentStore();
  const { currentTextAreaValue, setCurrentTextAreaValue } =
    useCurrentTextAreaValue();
  // const [postAndMessage, setPostAndMessage] = useState<any[]>([
  //   { id: 1, buttons: [], message: [""], time: "" },
  // ]);
  // const [newButton, setNewButton] = useState([{ id: 1 }]);
  const [test, setTest] = useState("");
  // Validation schema using Zod
  const formSchema = useFormSchema();

  // Initialize form with react-hook-form and zod validation
  const {
    control,
    handleSubmit,
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

  const { fields: postAndMessageFields, remove } = useFieldArray({
    control,
    name: "postAndMessage", // The name should match the field in your defaultValues
  });
  const { fields: conditions, remove: removeConditions } = useFieldArray({
    control,
    name: "conditions", // The name should match the field in your defaultValues
  });
  // console.log("ERROR", errors);

  // Submit handler
  const onSubmit = (data: any) => {
    console.log("Form submitted:", data);
    setAdminContentCycle([...adminContentCycle, test]);
    setCurrentTextAreaValue("");
  };

  // Add a new postAndMessage section
  // const addPostAndMessage = () => {
  //   setPostAndMessage([...postAndMessage, { id: Date.now() }]);
  // };
  // const addNewButton = (postMessageIndex: number) => {
  //   setPostAndMessage((prev) =>
  //     prev.map((postMessage, index) =>
  //       index === postMessageIndex
  //         ? {
  //             ...postMessage,
  //             buttons: postMessage.buttons
  //               ? [...postMessage.buttons, { id: Date.now() }]
  //               : [{ id: Date.now() }], // Initialize buttons if undefined
  //           }
  //         : postMessage
  //     )
  //   );
  // };

  // const deletePostAndMessage = (id: number, index: number) => {
  //   setPostAndMessage(postAndMessage.filter((pm) => pm.id !== id));
  //   remove(index);
  //   setAdminContentCycle(adminContentCycle.filter((_, i) => i !== index));
  //   setCurrentTextAreaValue("");
  //   setTest("");
  // };
  const [postAndMessage, setPostAndMessage] = useState([
    { id: uuid(), message: "" },
  ]);

  const handleDragEnd = (result: any) => {
    if (!result.destination) return;

    const items = Array.from(postAndMessage);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);

    setPostAndMessage(items);
  };

  const addPostAndMessage = () => {
    setPostAndMessage([...postAndMessage, { id: uuid(), message: "" }]);
  };

  const deletePostAndMessage = (id: any) => {
    setPostAndMessage(postAndMessage.filter((item) => item.id !== id));
  };

  const fetchPosts = async ({ pageParam = "" }) => {
    const res = await fetch(
      `http://localhost:3001/v1/medias/posts?after=${pageParam}`
    );
    return res.json();
  };

  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    EE.addListener(
      CONTENTCYCLE_EVENTS.SelectPost as string,
      (data: SelectPostEventPayload) => {
        setSelectedPostId(data.postId);
      }
    );
    return () => {
      EE.removeListener(CONTENTCYCLE_EVENTS.SelectPost);
    };
  }, []);

  useEffect(() => console.log(selectedPostId));

  return (
    <div className="min-h-screen w-full">
      <div className="w-full min-h-[91.5vh]  bg-white rounded-2xl  mb-[10rem]">
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

          <ConditionWordForm control={control} remove={removeConditions} />

          {/* Message input & post select */}
          <p>را ارسال کند پیام زیر برایش ارسال شود</p>
          <Button
            variant="ghost"
            onClick={addPostAndMessage}
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
                  {postAndMessage.map((postMessage, index) => (
                    <Draggable
                      key={postMessage.id}
                      draggableId={postMessage.id}
                      index={index}
                    >
                      {(provided) => (
                        <div
                          className="space-y-4"
                          {...provided.draggableProps}
                          {...provided.dragHandleProps}
                          ref={provided.innerRef}
                        >
                          <div className="flex">
                            <InstagramPostsDialog />
                            {postAndMessage.length > 1 && (
                              <Trash
                                size={24}
                                className="text-red-600 cursor-pointer"
                                onClick={() =>
                                  deletePostAndMessage(postMessage.id)
                                }
                              />
                            )}
                          </div>
                          <div className="flex flex-col gap-2">
                            <textarea
                              className="w-4/5 border px-3 py-2 rounded-xl"
                              placeholder="پیام خود را وارد کنید"
                              value={postMessage.message}
                              onChange={(e) => {
                                const newMessage = e.target.value;
                                setPostAndMessage((prev) =>
                                  prev.map((item, i) =>
                                    i === index
                                      ? { ...item, message: newMessage }
                                      : item
                                  )
                                );
                              }}
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

          <CheckBoxOptionForm control={control} />

          {/* Submit button */}
          <Button className="bg-blue-600" type="submit">
            ایجاد
          </Button>
        </form>
      </div>
    </div>
  );
}
