import {
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui";
import { DresserIcon } from "@phosphor-icons/react/dist/ssr";
import { CirclePlusIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { useFieldArray, useFormContext } from "react-hook-form";
import { SortableButtonItem } from "./SortableButtonItem";
import {
  closestCenter,
  DndContext,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";

export const FormVitrinButtons = () => {
  const t = useTranslations("Products.Form.Vitrin");
  const form = useFormContext();

  const { fields, append, remove, move } = useFieldArray({
    control: form.control,
    name: "buttons",
    keyName: "_xid",
  });

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = fields.findIndex((field) => field._xid === active.id);
      const newIndex = fields.findIndex((field) => field._xid === over.id);

      if (oldIndex !== -1 && newIndex !== -1) {
        move(oldIndex, newIndex);
      }
    }
  };

  const addButton = () => {
    if (fields.length < 3) {
      append({
        type: "",
        text: "",
      });
    }
  };

  const removeButton = (_xid: string) => {
    const index = fields.findIndex((field) => field._xid === _xid);
    if (index !== -1) {
      remove(index);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>
          <DresserIcon weight="duotone" /> دکمه ها
        </CardTitle>
        <CardDescription>{t("buttons_description")}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <Button
          type="button"
          size="sm"
          variant="outline"
          onClick={addButton}
          disabled={fields.length >= 3}
        >
          <CirclePlusIcon />
          {t("add_button")}
        </Button>

        {fields.length > 0 && (
          <div className="_buttons space-y-2">
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={handleDragEnd}
            >
              <SortableContext
                items={fields.map((field) => field._xid)}
                strategy={verticalListSortingStrategy}
              >
                {fields.map((field, index) => (
                  <SortableButtonItem
                    key={field._xid}
                    field={field}
                    index={index}
                    removeButton={removeButton}
                  />
                ))}
              </SortableContext>
            </DndContext>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
