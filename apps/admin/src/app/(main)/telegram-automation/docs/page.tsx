"use client";

import { useEffect, useState } from "react";
import api from "@/hooks/swr/api-client";
import { toast } from "sonner";

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

  // Fetch documents on mount
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

  // Save or update document
  const handleSave = async () => {
    if (!content.trim()) {
      toast.error("محتوای مستندات نمی‌تواند خالی باشد");
      return;
    }

    setSaving(true);
    try {
      if (activeDoc) {
        // Update existing document
        const { data } = await api.put(`/telegram-automation/docs/${activeDoc.id}`, {
          content,
        });
        const updated = data?.data || data;
        if (updated) {
          setActiveDoc(updated);
        }
        toast.success("مستندات با موفقیت به‌روزرسانی شد");
      } else {
        // Create new document
        const { data } = await api.post("/telegram-automation/docs", {
          content,
        });
        const created = data?.data || data;
        if (created) {
          setActiveDoc(created);
        }
        toast.success("مستندات با موفقیت ذخیره شد");
      }
    } catch {
      toast.error("خطا در ذخیره مستندات");
    } finally {
      setSaving(false);
    }
  };

  const inputClasses =
    "w-full rounded-xl border border-gray-200 bg-white p-4 text-sm shadow-sm transition-all focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100 font-mono leading-relaxed h-[450px]";
  const buttonPrimary =
    "inline-flex items-center justify-center rounded-xl bg-blue-600 px-6 py-2.5 text-sm font-medium text-white shadow-sm transition-all hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 cursor-pointer";

  return (
    <div className="p-6">
      <div className="mx-auto max-w-4xl space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
              مدیریت مستندات (Docs)
            </h1>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              این مستندات به عنوان دانش پایه (Knowledge Base) در اختیار هوش مصنوعی قرار می‌گیرند.
            </p>
          </div>
        </div>

        <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-gray-900">
          {loading ? (
            <div className="flex h-64 items-center justify-center">
              <span className="text-sm text-gray-500">در حال بارگذاری...</span>
            </div>
          ) : (
            <div className="flex flex-col gap-4">
              <textarea
                className={inputClasses}
                placeholder="# عنوان مستندات&#10;&#10;توضیحات و قوانین خدمات..."
                value={content}
                onChange={(e) => setContent(e.target.value)}
                dir="rtl"
              />
              <div className="flex justify-end">
                <button
                  className={buttonPrimary}
                  onClick={handleSave}
                  disabled={saving}
                  type="button"
                >
                  {saving ? "در حال ذخیره..." : "ذخیره مستندات"}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
