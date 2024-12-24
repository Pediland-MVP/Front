"use client";

import { useRef } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { CardFooter } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/use-toast";
import { motion, AnimatePresence } from "framer-motion";
import { EmojiPicker } from "../../../inbox/components/emojiPicker";
import { PaperPlaneRight } from "@phosphor-icons/react";
import { FormField, Form } from "@/components/ui/form";
import { KeyedMutator, mutate } from "swr";
import { useTranslations } from "next-intl";
import logger from "@/app/utils/logger";




interface RedesignedCommentFooterProps {
  commentId: string;
  addReply: (replyData: any) => void;
}

export default function RedesignedCommentFooter({
  commentId,
  addReply
}: RedesignedCommentFooterProps) {

  const t = useTranslations('Comments.Footer')

  const formSchema = z.object({
    text: z.string().min(1, `${t("errors.text")}`),
  });

  type FormData = z.infer<typeof formSchema>;

  const inputRef = useRef<HTMLTextAreaElement>(null);
  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      text: "",
    },
  });

  const onSubmit = async (data: FormData) => {
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_BACK_API_URL}/comments/reply/${commentId}`,
        {
          method: "POST",
          body: JSON.stringify(data),
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include",
        }
      );

      if (!response.ok) {
        const json = await response.json();
        json.message.forEach((m: string) => {
          toast({
            title: m,
            variant: "destructive",
          });
        });
        return;
      }


      addReply(await response.json())
      await mutate((key) => typeof key === "string" && key.includes(`comments/${commentId}`));
      toast({ title: t('success') });
      form.reset();
    } catch (error) {
      console.error("Error submitting comment:", error);
      toast({
        title: t('error'),
        variant: "destructive",
      });
    }
  };

  const handleKeyPress = (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      form.handleSubmit(onSubmit)();
    }
    if (event.key === "Enter" && event.shiftKey) {
      event.preventDefault();
      const currentText = form.getValues("text");
      form.setValue("text", currentText + "\n");
    }
  };

  return (
    <CardFooter className="border-t p-3">
      <Form {...form}>
        <form
          onSubmit={form.handleSubmit(onSubmit)}
          className="w-full flex items-center"
        >
          <EmojiPicker
            onChange={(value) => {
              const currentText = form.getValues("text");
              form.setValue("text", currentText + value);
              inputRef.current?.focus();
            }}
          />
          <Button
            type="submit"
            variant="ghost"
            size="icon"
            className="h-9 w-9 shrink-0"
            disabled={form.formState.isSubmitting}
          >
            <PaperPlaneRight size={20} className="text-muted-foreground" />
          </Button>
          <AnimatePresence initial={false}>
            <motion.div
              key="input"
              className="w-full relative mx-2"
              layout
              initial={{ opacity: 0, scale: 1 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 1 }}
              transition={{
                opacity: { duration: 0.05 },
                layout: {
                  type: "spring",
                  bounce: 0.15,
                },
              }}
            >
              <FormField
                control={form.control}
                name="text"
                render={({ field }) => (
                  <Textarea
                    {...field}
                    ref={inputRef}
                    placeholder={t('placeholder')}
                    className="w-full resize-none min-h-[60px]"
                    onKeyDown={handleKeyPress}
                    autoComplete="off"
                  />
                )}
              />
            </motion.div>
          </AnimatePresence>
        </form>
      </Form>
    </CardFooter>
  );
}
