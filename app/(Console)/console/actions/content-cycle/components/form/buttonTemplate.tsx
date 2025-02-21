import { ContentCycleContentModeEnum } from "@/app/constants/contentCycleContent.enum";
import { useFieldArray, useFormContext } from "react-hook-form";
import { z } from "zod";
import { contentCycleFormSchema } from "../contentCycle";
import { useTranslations } from "next-intl";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core";
import {
  sortableKeyboardCoordinates,
  rectSortingStrategy,
  SortableContext,
  useSortable,
} from "@dnd-kit/sortable";
import ButtonTemplateItem from "./buttonTemplate/buttonTemplateItem";

type ButtonTemplateProps = {
  mode: ContentCycleContentModeEnum;
  index: number;
};
export default function ButtonTemplate({ index, mode }: ButtonTemplateProps) {
  const t = useTranslations("Automations.Catalogue");
  const t_errors = useTranslations("Automations.Errors");

  const { control, trigger } =
    useFormContext<z.infer<typeof contentCycleFormSchema>>();

    // NOTE: I dindt changed default name of fields becuase it was not working :)
  const {fields, move, remove} = useFieldArray({
    control: control,
    name: `${mode === ContentCycleContentModeEnum.CONTENT_CYCLE ? "contents" : "reminders"}.${index}.products`,
    keyName: "_xid",
  });
  
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (active.id !== over?.id) {
      const oldIndex = fields.findIndex(
        (item) => item._xid === active.id
      );
      const newIndex = fields.findIndex(
        (item) => item._xid === over?.id
      );
      move(oldIndex, newIndex);
    }
  };

  return( <div className="w-full">

    {
      fields.map((field, index) => (
        <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <SortableContext
          items={fields.map((item) => item._xid)}
          strategy={rectSortingStrategy}
        >
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {fields.map((product, index) => (
              <ButtonTemplateItem
                key={product._xid}
                id={product._xid}
                index={index}
                remove={remove}
              />
            ))}
          </div>
        </SortableContext>
      </DndContext>
      ))
    }

  </div>)
}
