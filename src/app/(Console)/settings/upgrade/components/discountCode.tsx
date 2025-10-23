import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import api from "@/hooks/swr/api-client";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslations } from "next-intl";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { useUpgradeContext } from "../context/upgrade.context";
import { AxiosError } from "axios";
import { ExceptionMessage } from "@/types/exceptionMessage";

export function DiscountCode() {
  const schema = z.object({
    code: z.string().min(1),
  });
  const form = useForm<z.infer<typeof schema>>({
    resolver: zodResolver(schema),
    defaultValues: {},
  });

  const t = useTranslations("UpdateReferralCode");
  const t_ec = useTranslations("ERROR_CODES");

  const { setDiscountCode, setActive } = useUpgradeContext();

  const deleteCode = () => {
    setDiscountCode("");
    form.setValue("code", "");
    setActive({
      planSelection: true,
      subscriptionInfo: false,
    });
  };

  const onSubmit = (values: z.infer<typeof schema>) => {
    api
      .get(`/plans?discountCode=${values.code}`)
      .then((res) => {
        setDiscountCode(values.code);
      })
      .catch((e: AxiosError<ExceptionMessage>) => {
        toast.error(t_ec(e?.response?.data.code));
      });
    setActive({
      planSelection: true,
      subscriptionInfo: false,
    });
  };

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className="mx-auto my-6 flex flex-col gap-y-2 lg:w-2/6"
      >
        <FormField
          control={form.control}
          name="code"
          render={({ field }) => {
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
        <div className="flex gap-x-2">
          <Button
            type="button"
            onClick={form.handleSubmit(onSubmit)}
            className="w-full bg-green-600"
          >
            {t("update")}
          </Button>
          <Button
            type="button"
            variant={"ghost"}
            onClick={deleteCode}
            className="w-full"
          >
            {t("delete")}
          </Button>
        </div>
      </form>
    </Form>
  );
}
