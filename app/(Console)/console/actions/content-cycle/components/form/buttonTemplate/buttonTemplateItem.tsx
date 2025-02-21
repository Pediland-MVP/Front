'use client'
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { GripVertical, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { Input } from "@/components/theme/ui/input";


type ButtonTemplateItemProps = {
    id: string;
    index: number;
    remove: (index: number) => void;
  };
  
  export default function ButtonTemplateItem({
    id,
    index,
    remove,
  }: ButtonTemplateItemProps) {
    const {
      attributes,
      listeners,
      setNodeRef,
      transform,
      transition,
      isDragging,
    } = useSortable({ id });
  
    const style = {
      transform: CSS.Transform.toString(transform),
      transition,
    };
  
    return (
      <Card
        ref={setNodeRef}
        style={style}
        className={cn(
          "p-4 transition-all duration-200 group hover:border-primary",
          isDragging && "ring-2 ring-primary ring-offset-2"
        )}
      >
        <div className="flex items-center justify-between w-full mb-2">
          <Button
            variant="ghost"
            size="icon"
            className="cursor-move lg:opacity-0 group-hover:opacity-100 transition-opacity"
            type="button"
            {...attributes}
            {...listeners}
          >
            <GripVertical className="h-4 w-4" />
          </Button>
          {
            index !== 0 && (
            <Button
              variant="ghost"
              size="icon"
              className="text-destructive lg:opacity-0 group-hover:opacity-100 transition-opacity hover:text-destructive/90"
              type="button"
              onClick={() => remove(index)}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
  
            )
          }
        </div>
        <div className="flex justify-center items-center">
          <Input>dasd</Input>
        </div>
      </Card>
    );
  }