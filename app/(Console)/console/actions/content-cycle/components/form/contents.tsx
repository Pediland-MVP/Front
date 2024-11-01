import { FormItem, FormMessage } from "@/components/ui/form";
import { PlusCircle, Trash } from "@phosphor-icons/react";
import { DragDropContext, Droppable, Draggable } from "react-beautiful-dnd";
import {
  Control,
  Controller,
  useFieldArray,
  UseFormGetValues,
  UseFormStateReturn,
} from "react-hook-form";
import InstagramPostsDialog from "../../../components/instagramPosts.dialog";
import { z } from "zod";
import { contentCycleFormSchema } from "../contentCycle";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

type TriggerProps = {
  control: Control<z.infer<typeof contentCycleFormSchema>>;
  getValues: UseFormGetValues<z.infer<typeof contentCycleFormSchema>>;
  formState: UseFormStateReturn<z.infer<typeof contentCycleFormSchema>>;
};

export default function Contents({
  control,
  getValues,
  formState,
}: TriggerProps) {
  const {
    fields: contentsField,
    remove: removeContents,
    append: appendContents,
    update: updateContents,
    swap: swapContents,
    move: moveContents,
  } = useFieldArray({
    control: control,
    name: "contents",
    keyName: "_xid",
  });

  const handleContentsDragEnd = (result: any) => {
    if (!result.destination) return;
    moveContents(result.source.index, result.destination.index);
  };

  return (
    <>
      <Button
        variant="ghost"
        onClick={() =>
          appendContents({
            text: "",
            instagramPost: { mediaId: "" },
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
                              formState={formState}
                              getValues={getValues}
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
                              control={control}
                              render={({ field, fieldState: { error } }) => (
                                <FormItem>
                                  <Textarea
                                    className="w-full border px-3 py-2 rounded-xl"
                                    placeholder="پیام خود را وارد کنید"
                                    {...field}
                                  />
                                  {error && (
                                    <FormMessage> {error.message} </FormMessage>
                                  )}
                                </FormItem>
                              )}
                            />

                            <Controller
                              name={`contents.${index}.consentText`}
                              control={control}
                              render={({ field, fieldState: { error } }) => (
                                <FormItem>
                                  <Textarea
                                    className="w-full border px-3 py-2 rounded-xl"
                                    placeholder="پیام کسب اجازه: آیا مایل به ادامه هستید؟..."
                                    {...field}
                                  />
                                  {error && (
                                    <FormMessage> {error.message} </FormMessage>
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
    </>
  );
}
