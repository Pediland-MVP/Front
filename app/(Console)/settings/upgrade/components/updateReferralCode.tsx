import { mutateIncludeStringKey } from "@/app/utils/mutateIncludeStringKey";
import { Button } from "@/components/theme/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
} from "@/components/theme/ui/form";
import { Input } from "@/components/theme/ui/input";
import { toast } from "@/components/ui/use-toast";
import api from "@/hooks/swr/api-client";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslations } from "next-intl";
import { useForm } from "react-hook-form";
import { mutate } from "swr";
import { z } from "zod";
import { useUpgradeContext } from "../context/upgrade.context";

export function UpdateReferralCode() {
  const schema = z.object({
    code: z.string().min(1),
  });
  const form = useForm<z.infer<typeof schema>>({
    resolver: zodResolver(schema),
    defaultValues: {},
  });

  console.log(form.formState.errors);

  const t = useTranslations("UpdateReferralCode");
  const t_ec = useTranslations("ERROR_CODES");

  const { setActive } = useUpgradeContext()

  const onSubmit = (values: z.infer<typeof schema>) => {
    api
      .post("/subscriptions/updateReferralCode", values)
      .then(async (res) => {
        toast({
          title: t("success"),
        });
        await mutate(mutateIncludeStringKey("plans"));
        setActive({ planSelection: true, subscriptionInfo: false })
      })
      .catch((e) => {
        toast({
          title: t_ec(e.response?.data?.code),
          variant: "destructive",
        });
      });
  };

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className="lg:w-2/6 mx-auto my-6 gap-y-2 flex flex-col"
      >
        <FormField
          control={form.control}
          name="code"
          render={({field}) => {
            return (
              <FormItem>
                <FormControl>
                  <Input
                    type="text"
                    placeholder={t("Code.placeholder")}
                    className="w-full"
                    {...field}
                  />
                </FormControl>
              </FormItem>
            );
          }}
        ></FormField>
        <Button type="submit" className="w-full bg-green-600">
          {t("update")}
        </Button>
      </form>
    </Form>
  );
}
