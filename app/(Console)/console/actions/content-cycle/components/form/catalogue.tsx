import {
  FormField,
  FormItem,
  FormControl,
  FormLabel,
} from "@/components/ui/form";
import { PlusCircle, Trash } from "@phosphor-icons/react";
import { DragDropContext, Droppable, Draggable } from "react-beautiful-dnd";
import ProductsDialog from "../products.dialog";
import {
  Control,
  useFieldArray,
  UseFormGetValues,
  UseFormStateReturn,
} from "react-hook-form";
import { z } from "zod";
import { contentCycleFormSchema } from "../contentCycle";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";

type CatalogueProps = {
  control: Control<z.infer<typeof contentCycleFormSchema>>;
  getValues: UseFormGetValues<z.infer<typeof contentCycleFormSchema>>;
  formState: UseFormStateReturn<z.infer<typeof contentCycleFormSchema>>;
};

export default function Catalogue({
  control,
  getValues,
  formState,
}: CatalogueProps) {
  const {
    fields: productsField,
    remove: removeProducts,
    append: appendProducts,
    update: updateProducts,
    swap: swapProducts,
    move: moveProducts,
  } = useFieldArray({
    control: control,
    name: "products",
    keyName: "_xid",
  });

  const handleProductsDragEnd = (result: any) => {
    if (!result.destination) return;
    moveProducts(result.source.index, result.destination.index);
  };

  return (
    <>
      <FormField
        control={control}
        name="isProductsEnabled"
        render={({ field }) => {
          return (
            <FormItem className="flex flex-col justify-start gap-y-4">
              <div className="flex items-center gap-x-2 mb-2">
                <FormControl>
                  <Switch
                    dir="ltr"
                    checked={!!field.value}
                    onCheckedChange={(e) => {
                      if (e) {
                        if (getValues().products?.length === 0) {
                          appendProducts({});
                        }
                      }
                      return field.onChange(e);
                    }}
                  />
                </FormControl>
                <FormLabel className="">ارسال کاتالوگ محصولات</FormLabel>
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
                                      formState={formState}
                                    />
                                    {productsField.length > 2 && (
                                      <Trash
                                        size={24}
                                        className="text-red-600 cursor-pointer absolute z-50 top-0 -right-10"
                                        onClick={() => removeProducts(index)}
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
    </>
  );
}
