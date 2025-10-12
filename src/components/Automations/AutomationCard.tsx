import { CheckCircleIcon } from "@phosphor-icons/react/dist/ssr";
import { Badge, Button, Card, CardContent, CardFooter } from "../ui";
import Link from "next/link";
import { Automation } from "@/schemas/automation";
import { useTranslations } from "next-intl";

interface AutomationCardProps {
  item: Automation;
  handleDelete: (id: string) => void;
}

export const AutomationCard = ({ item, handleDelete }: AutomationCardProps) => {
  const t = useTranslations("Automations.Card");

  return (
    <Card className="gap-0 border-violet-200 p-0 shadow-violet-200">
      <CardContent className="space-y-3 p-4 text-sm">
        <div className="flex items-center gap-1.5">
          <div className="text-secondary font-medium">{t("conditions")}</div>
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
          <div>{t("active_in")}</div>
          <div className="flex items-center gap-2">
            <div className="border-l border-gray-200 pl-2">
              {item.isDirect ? (
                <div className="flex items-center gap-1 text-[13px] text-green-600">
                  <CheckCircleIcon size={16} />
                  {t("direct")}
                </div>
              ) : (
                <div className="flex items-center gap-1 text-[13px] text-gray-300">
                  <CheckCircleIcon size={16} />
                  {t("direct")}
                </div>
              )}
            </div>
            <div>
              {item.isComment ? (
                <div className="flex items-center gap-1 text-[13px] text-green-600">
                  <CheckCircleIcon size={16} />
                  {t("comment")}
                </div>
              ) : (
                <div className="flex items-center gap-1 text-[13px] text-gray-300">
                  <CheckCircleIcon size={16} />
                  {t("comment")}
                </div>
              )}
            </div>
          </div>
        </div>
      </CardContent>
      <CardFooter className="flex rounded-b-xl bg-gray-100 p-0">
        <Button
          className="text-muted-foreground hover:text-secondary w-full flex-1 rounded-none rounded-br-xl hover:bg-blue-100"
          variant="ghost"
          type="button"
          size="sm"
          asChild
        >
          <Link href={`/automations/${item.id}`}>{t("edit")}</Link>
        </Button>
        {/* <Button
                className="text-muted-foreground w-full flex-1 rounded-none hover:bg-green-100 hover:text-green-800"
                variant="ghost"
                type="button"
                size="sm"
              >
                {t("answers")}
              </Button> */}
        <Button
          className="hover:text-destructive text-muted-foreground w-full flex-1 rounded-none rounded-bl-xl hover:bg-red-100"
          variant="ghost"
          type="button"
          size="sm"
          onClick={() => handleDelete(item.id)}
        >
          {t("delete")}
        </Button>
      </CardFooter>
    </Card>
  );
};
