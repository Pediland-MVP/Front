"use client";

import { Automation } from "@/schemas/automation";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { memo } from "react";

import { Badge, Button, Card, CardContent, CardFooter } from "@/components/ui";
import { CrosshairIcon } from "@phosphor-icons/react/dist/ssr";
import { CircleXIcon, MessageSquareMoreIcon, PencilIcon } from "lucide-react";
import { CardImage } from "../Global/CardImage";

interface AutomationCardProps {
  item: Automation;
  handleDelete: (id: string) => void;
}

const AutomationCardComponent = ({
  item,
  handleDelete,
}: AutomationCardProps) => {
  const router = useRouter();
  const t = useTranslations("Automations.Card");
  const specifiedPost = item.instagramPost?.picture?.url;

  return (
    <Card className="gap-0 border-violet-200 p-0 shadow-violet-200">
      <CardContent className="p-2">
        <div className="flex">
          <div className="flex-1 space-y-3 p-2 text-sm">
            <div className="flex flex-col gap-1.5">
              <div className="text-secondary flex items-center gap-1 font-medium">
                <CrosshairIcon size={18} weight="duotone" />
                {t("conditions")}
              </div>
              <div className="line-clamp-1 space-x-1.5">
                {item.conditions.map((condition) => (
                  <Badge
                    variant="outline"
                    className="h-6 rounded-full border-indigo-200/60 bg-indigo-50 px-2 py-0 text-[13px] font-medium text-indigo-600"
                    key={condition.id}
                  >
                    {condition.value}
                  </Badge>
                ))}
              </div>
            </div>
            <div className="text-secondary flex items-center gap-2 font-medium">
              <div className="flex items-center gap-1.5 text-[13px]">
                <div className="md:hidden">{t("active_in")}</div>
                <div className="flex items-center gap-2">
                  <div className="border-l border-gray-200 pl-2">
                    {item.isDirect ? (
                      <div className="text-primary">{t("direct")}</div>
                    ) : (
                      <div className="font-light text-gray-300">
                        {t("direct")}
                      </div>
                    )}
                  </div>
                  <div className="border-l border-gray-200 pl-2">
                    {item.isComment ? (
                      <div className="text-primary">{t("comment")}</div>
                    ) : (
                      <div className="font-light text-gray-300">
                        {t("comment")}
                      </div>
                    )}
                  </div>
                  <div>
                    {item.instagramPost ? (
                      <div className="text-primary">{t("specified_post")}</div>
                    ) : (
                      <div className="font-light text-gray-300">
                        {t("specified_post")}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {item.instagramPost && (
            <div className="relative h-auto w-20">
              <CardImage src={item.instagramPost?.picture?.url} />
            </div>
          )}
        </div>
      </CardContent>
      <CardFooter className="flex rounded-b-xl bg-gray-100 p-0">
        <Button
          className="text-muted-foreground hover:text-secondary h-9 w-full flex-1 rounded-none rounded-br-xl hover:bg-blue-100"
          variant="ghost"
          type="button"
          size="sm"
          onClick={() => router.push(`/automations/sessions`)}
        >
          <MessageSquareMoreIcon className="text-secondary" />
          {t("answers")} ({item.sessionsCount?.toLocaleString() || 0})
        </Button>

        <Button
          className="text-muted-foreground h-9 w-full flex-1 rounded-none hover:bg-green-100 hover:text-green-800"
          variant="ghost"
          type="button"
          size="sm"
          onClick={() => router.push(`/automations/${item.id}`)}
        >
          <PencilIcon className="text-green-600" />
          {t("edit")}
        </Button>

        <Button
          className="hover:text-destructive text-muted-foreground h-9 w-full flex-1 rounded-none rounded-bl-xl hover:bg-red-100"
          variant="ghost"
          type="button"
          size="sm"
          onClick={() => handleDelete(item.id)}
        >
          <CircleXIcon className="text-destructive" />
          {t("delete")}
        </Button>
      </CardFooter>
    </Card>
  );
};

export const AutomationCard = memo(AutomationCardComponent);
