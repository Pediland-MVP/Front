"use client";

import { useEffect, useState } from "react";
import api from "@/hooks/swr/api-client";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

interface DocType {
  id: string;
  content: string;
  createdAt: string;
  updatedAt: string;
}

export default function DocsPage() {
  const [content, setContent] = useState("");
  const [activeDoc, setActiveDoc] = useState<DocType | null>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const fetchDocs = async () => {
      setLoading(true);
      try {
        const { data } = await api.get("/telegram-automation/docs");
        const list: DocType[] = data?.data || data || [];
        if (list.length > 0) {
          setActiveDoc(list[0]);
          setContent(list[0].content);
        }
      } catch {
        toast.error("خطا در دریافت مستندات");
      } finally {
        setLoading(false);
      }
    };
    fetchDocs();
  }, []);

  const handleSave = async () => {
    if (!content.trim()) {
      toast.error("محتوای مستندات نمی‌تواند خالی باشد");
      return;
    }
    setSaving(true);
    try {
      if (activeDoc) {
        const { data } = await api.put(`/telegram-automation/docs/${activeDoc.id}`, { content });
        const updated = data?.data || data;
        if (updated) setActiveDoc(updated);
        toast.success("مستندات با موفقیت به‌روزرسانی شد");
      } else {
        const { data } = await api.post("/telegram-automation/docs", { content });
        const created = data?.data || data;
        if (created) setActiveDoc(created);
        toast.success("مستندات با موفقیت ذخیره شد");
      }
    } catch {
      toast.error("خطا در ذخیره مستندات");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="p-4 lg:p-6">
      <div className="mx-auto max-w-4xl space-y-6">
        <div>
          <h1 className="text-xl font-bold text-slate-800">مدیریت مستندات (Docs)</h1>
          <p className="mt-1 text-xs text-slate-400">
            این مستندات به عنوان دانش پایه (Knowledge Base) در اختیار هوش مصنوعی قرار می‌گیرند.
          </p>
        </div>

        <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-xs">
          {loading ? (
            <div className="flex h-64 items-center justify-center">
              <span className="text-sm text-slate-400">در حال بارگذاری...</span>
            </div>
          ) : (
            <div className="flex flex-col gap-4">
              <Textarea
                className="min-h-[450px] font-mono text-sm leading-relaxed resize-y"
                placeholder={"# عنوان مستندات\n\nتوضیحات و قوانین خدمات..."}
                value={content}
                onChange={(e) => setContent(e.target.value)}
                dir="rtl"
              />
              <div className="flex justify-end">
                <Button onClick={handleSave} disabled={saving} type="button">
                  {saving ? "در حال ذخیره..." : "ذخیره مستندات"}
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
