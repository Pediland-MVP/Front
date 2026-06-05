"use client";

import { useEffect, useState } from "react";
import api from "@/hooks/swr/api-client";
import { toast } from "sonner";
import { Plus, Trash2, Pencil, Check, X, Zap, RefreshCw } from "lucide-react";

interface Provider {
  id: string;
  name: string;
  providerType: "openai" | "openai-compatible";
  baseURL?: string;
  apiKey: string;
  model?: string;
  isActive: boolean;
  createdAt: string;
}

interface ModelOption {
  id: string;
}

type FormMode = "add" | "edit";

interface ProviderForm {
  name: string;
  providerType: "openai" | "openai-compatible";
  baseURL: string;
  apiKey: string;
  model: string;
  useCustomModel: boolean;
  customModel: string;
}

const emptyForm = (): ProviderForm => ({
  name: "",
  providerType: "openai",
  baseURL: "",
  apiKey: "",
  model: "",
  useCustomModel: false,
  customModel: "",
});

export default function AIAgentPage() {
  const [providers, setProviders] = useState<Provider[]>([]);
  const [loadingProviders, setLoadingProviders] = useState(false);

  // Pagination state
  const [page, setPage] = useState(1);
  const limit = 10;
  const [totalPages, setTotalPages] = useState(1);

  // Form state
  const [formMode, setFormMode] = useState<FormMode>("add");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<ProviderForm>(emptyForm());
  const [saving, setSaving] = useState(false);

  // Model picker
  const [models, setModels] = useState<ModelOption[]>([]);
  const [loadingModels, setLoadingModels] = useState(false);

  // Telegram Login state
  const [phoneNumber, setPhoneNumber] = useState("");
  const [phoneCodeHash, setPhoneCodeHash] = useState("");
  const [code, setCode] = useState("");
  const [codeSent, setCodeSent] = useState(false);
  const [sendingCode, setSendingCode] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [password, setPassword] = useState("");
  const [showPasswordInput, setShowPasswordInput] = useState(false);

  // Deleteing
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [activatingId, setActivatingId] = useState<string | null>(null);

  // Load settings (phone number) on mount
  useEffect(() => {
    loadPhone();
  }, []);

  // Reload providers whenever the page changes
  useEffect(() => {
    fetchProviders(page);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page]);

  const loadPhone = async () => {
    try {
      const { data } = await api.get("/telegram-automation/settings");
      const s = data?.data || data;
      if (s?.botPhoneNumber) setPhoneNumber(s.botPhoneNumber);
    } catch {}
  };

  const fetchProviders = async (pageNum: number = page) => {
    setLoadingProviders(true);
    try {
      const { data } = await api.get(`/telegram-automation/providers?page=${pageNum}&limit=${limit}`);
      const payload = data?.data || data || {};
      const items: Provider[] = payload.items || [];
      const meta = payload.meta || {};
      // If a delete emptied the last page, step back one page
      if (items.length === 0 && pageNum > 1) {
        setPage(pageNum - 1);
        return;
      }
      setProviders(items);
      setTotalPages(meta.totalPages || 1);
      setPage(meta.currentPage || pageNum);
    } catch {
      toast.error("خطا در دریافت پروفایل‌های هوش مصنوعی");
    } finally {
      setLoadingProviders(false);
    }
  };

  const fetchModels = async () => {
    if (!form.apiKey.trim()) {
      toast.error("ابتدا کلید API را وارد کنید");
      return;
    }
    setLoadingModels(true);
    try {
      const { data } = await api.post("/telegram-automation/providers/models", {
        apiKey: form.apiKey,
        providerUrl: form.providerType === "openai-compatible" ? form.baseURL : undefined,
      });
      const list: string[] = data?.data || data || [];
      setModels(list.map((id) => ({ id })));
      if (list.length === 0) toast.info("مدلی یافت نشد");
    } catch {
      toast.error("خطا در بارگذاری مدل‌ها");
    } finally {
      setLoadingModels(false);
    }
  };

  const openAddForm = () => {
    setForm(emptyForm());
    setModels([]);
    setFormMode("add");
    setEditingId(null);
    setShowForm(true);
  };

  const openEditForm = (p: Provider) => {
    setForm({
      name: p.name,
      providerType: p.providerType,
      baseURL: p.baseURL || "",
      apiKey: p.apiKey,
      model: p.model || "",
      useCustomModel: false,
      customModel: p.model || "",
    });
    setModels([]);
    setFormMode("edit");
    setEditingId(p.id);
    setShowForm(true);
  };

  const cancelForm = () => {
    setShowForm(false);
    setEditingId(null);
    setForm(emptyForm());
    setModels([]);
  };

  const handleSave = async () => {
    if (!form.name.trim()) { toast.error("نام پروفایل الزامی است"); return; }
    if (!form.apiKey.trim()) { toast.error("کلید API الزامی است"); return; }

    const selectedModel = form.useCustomModel ? form.customModel : form.model;
    const payload = {
      name: form.name,
      providerType: form.providerType,
      baseURL: form.providerType === "openai-compatible" ? form.baseURL : undefined,
      apiKey: form.apiKey,
      model: selectedModel || undefined,
    };

    setSaving(true);
    try {
      if (formMode === "add") {
        await api.post("/telegram-automation/providers", payload);
        // Newest profiles appear first on page 1
        if (page === 1) {
          fetchProviders(1);
        } else {
          setPage(1);
        }
        toast.success("پروفایل با موفقیت اضافه شد");
      } else if (editingId) {
        const { data } = await api.put(`/telegram-automation/providers/${editingId}`, payload);
        const updated = data?.data || data;
        setProviders((prev) => prev.map((p) => (p.id === editingId ? { ...p, ...updated } : p)));
        toast.success("پروفایل با موفقیت ویرایش شد");
      }
      cancelForm();
    } catch {
      toast.error("خطا در ذخیره پروفایل");
    } finally {
      setSaving(false);
    }
  };

  const handleActivate = async (id: string) => {
    setActivatingId(id);
    try {
      await api.patch(`/telegram-automation/providers/${id}/activate`);
      setProviders((prev) => prev.map((p) => ({ ...p, isActive: p.id === id })));
      toast.success("پروفایل فعال شد");
    } catch {
      toast.error("خطا در فعال‌سازی پروفایل");
    } finally {
      setActivatingId(null);
    }
  };

  const handleDelete = async (id: string) => {
    setDeletingId(id);
    try {
      await api.delete(`/telegram-automation/providers/${id}`);
      await fetchProviders(page);
      toast.success("پروفایل حذف شد");
    } catch {
      toast.error("خطا در حذف پروفایل");
    } finally {
      setDeletingId(null);
    }
  };

  // Telegram login
  const handleSendCode = async () => {
    if (!phoneNumber) { toast.error("لطفاً شماره تلفن را وارد کنید"); return; }
    setSendingCode(true);
    try {
      const { data } = await api.post("/telegram-automation/auth/send-code", { phoneNumber });
      const hash = data?.data?.phoneCodeHash || data?.phoneCodeHash;
      if (hash) setPhoneCodeHash(hash);
      setCodeSent(true);
      toast.success("کد ارسال شد");
    } catch {
      toast.error("خطا در ارسال کد");
    } finally {
      setSendingCode(false);
    }
  };

  const handleVerifyCode = async () => {
    if (!code) { toast.error("لطفاً کد تأیید را وارد کنید"); return; }
    setVerifying(true);
    try {
      await api.post("/telegram-automation/auth/verify-code", {
        phoneNumber,
        phoneCodeHash,
        code,
        password: showPasswordInput ? password : undefined,
      });
      toast.success("ورود موفق و ذخیره نشست تلگرام");
      setCodeSent(false);
      setCode("");
      setPassword("");
      setShowPasswordInput(false);
    } catch (err: any) {
      const responseCode = err.response?.data?.code || err.response?.data?.data?.code;
      if (responseCode === "SESSION_PASSWORD_NEEDED") {
        setShowPasswordInput(true);
        toast.info("رمز عبور تایید دو مرحله‌ای (2FA) مورد نیاز است");
      } else {
        toast.error("خطا در تأیید کد و ورود");
      }
    } finally {
      setVerifying(false);
    }
  };

  const inputClasses =
    "w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm shadow-sm transition-colors focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100";
  const labelClasses = "text-sm font-medium text-gray-700 dark:text-gray-300";
  const btnPrimary =
    "inline-flex items-center justify-center gap-1.5 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50";
  const btnSuccess =
    "inline-flex items-center justify-center gap-1.5 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white shadow-sm transition-colors hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-50";
  const btnSecondary =
    "inline-flex items-center justify-center gap-1.5 rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700 shadow-sm transition-colors hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600";

  return (
    <div className="p-6">
      <div className="mx-auto max-w-3xl space-y-8">

        {/* AI Providers Section */}
        <section className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-900">
          <div className="mb-5 flex items-center justify-between">
            <div>
              <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100">پروفایل‌های هوش مصنوعی</h1>
              <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                چند ارائه‌دهنده تعریف کنید و در هر لحظه فقط یکی را فعال نگه دارید.
              </p>
            </div>
            {!showForm && (
              <button onClick={openAddForm} className={btnPrimary} type="button">
                <Plus className="h-4 w-4" />
                افزودن پروفایل
              </button>
            )}
          </div>

          {/* Inline Add/Edit Form */}
          {showForm && (
            <div className="mb-6 rounded-xl border border-blue-200 bg-blue-50 p-5 dark:border-blue-800 dark:bg-blue-950/20">
              <h2 className="mb-4 text-base font-bold text-blue-800 dark:text-blue-300">
                {formMode === "add" ? "افزودن پروفایل جدید" : "ویرایش پروفایل"}
              </h2>
              <div className="space-y-4">
                <div className="flex flex-col gap-1.5">
                  <label className={labelClasses}>نام پروفایل</label>
                  <input
                    className={inputClasses}
                    placeholder="مثال: OpenAI GPT-4o"
                    value={form.name}
                    onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className={labelClasses}>نوع ارائه‌دهنده</label>
                  <select
                    className={inputClasses}
                    value={form.providerType}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, providerType: e.target.value as any }))
                    }
                  >
                    <option value="openai">OpenAI</option>
                    <option value="openai-compatible">سفارشی (OpenAI-compatible)</option>
                  </select>
                </div>

                {form.providerType === "openai-compatible" && (
                  <div className="flex flex-col gap-1.5">
                    <label className={labelClasses}>آدرس سرور</label>
                    <input
                      className={inputClasses}
                      type="url"
                      dir="ltr"
                      placeholder="https://api.example.com/v1"
                      value={form.baseURL}
                      onChange={(e) => setForm((f) => ({ ...f, baseURL: e.target.value }))}
                    />
                  </div>
                )}

                <div className="flex flex-col gap-1.5">
                  <label className={labelClasses}>کلید API</label>
                  <input
                    className={inputClasses}
                    type="password"
                    dir="ltr"
                    placeholder="sk-..."
                    value={form.apiKey}
                    onChange={(e) => setForm((f) => ({ ...f, apiKey: e.target.value }))}
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className={labelClasses}>مدل</label>
                  <div className="flex items-center gap-2">
                    {form.useCustomModel ? (
                      <input
                        className={inputClasses}
                        type="text"
                        dir="ltr"
                        placeholder="نام مدل سفارشی..."
                        value={form.customModel}
                        onChange={(e) => setForm((f) => ({ ...f, customModel: e.target.value }))}
                      />
                    ) : (
                      <select
                        className={inputClasses}
                        value={form.model}
                        onChange={(e) => setForm((f) => ({ ...f, model: e.target.value }))}
                      >
                        {models.length === 0 && <option value="">— انتخاب مدل —</option>}
                        {models.map((m) => (
                          <option key={m.id} value={m.id}>{m.id}</option>
                        ))}
                      </select>
                    )}
                    <button
                      className={btnSecondary}
                      onClick={fetchModels}
                      disabled={loadingModels}
                      type="button"
                    >
                      <RefreshCw className={`h-4 w-4 ${loadingModels ? "animate-spin" : ""}`} />
                      {loadingModels ? "..." : "مدل‌ها"}
                    </button>
                  </div>
                  <label className="mt-1 flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={form.useCustomModel}
                      onChange={(e) => setForm((f) => ({ ...f, useCustomModel: e.target.checked }))}
                      className="rounded"
                    />
                    وارد کردن نام مدل به‌صورت دستی
                  </label>
                </div>

                <div className="flex gap-2 pt-1">
                  <button className={btnPrimary} onClick={handleSave} disabled={saving} type="button">
                    <Check className="h-4 w-4" />
                    {saving ? "در حال ذخیره..." : "ذخیره"}
                  </button>
                  <button className={btnSecondary} onClick={cancelForm} type="button">
                    <X className="h-4 w-4" />
                    انصراف
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Providers List */}
          {loadingProviders ? (
            <div className="flex h-32 items-center justify-center text-sm text-gray-500">
              در حال بارگذاری...
            </div>
          ) : providers.length === 0 ? (
            <div className="flex h-32 flex-col items-center justify-center rounded-xl border border-dashed border-gray-200 text-center dark:border-gray-700">
              <p className="text-sm text-gray-500">هنوز هیچ پروفایلی تعریف نشده</p>
              <p className="mt-1 text-xs text-gray-400">از دکمه «افزودن پروفایل» شروع کنید</p>
            </div>
          ) : (
            <div className="space-y-3">
              {providers.map((p) => (
                <div
                  key={p.id}
                  className={`flex items-start gap-3 rounded-xl border p-4 transition-all ${
                    p.isActive
                      ? "border-emerald-300 bg-emerald-50 dark:border-emerald-700 dark:bg-emerald-950/20"
                      : "border-gray-200 bg-gray-50 dark:border-gray-700 dark:bg-gray-800/40"
                  }`}
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-semibold text-gray-900 dark:text-gray-100 text-sm">
                        {p.name}
                      </span>
                      {p.isActive && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-0.5 text-[11px] font-bold text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300">
                          <Zap className="h-3 w-3" />
                          فعال
                        </span>
                      )}
                      <span className="rounded-full border border-gray-200 bg-white px-2 py-0.5 text-[11px] text-gray-500 dark:border-gray-700 dark:bg-gray-700 dark:text-gray-400">
                        {p.providerType === "openai" ? "OpenAI" : "Custom"}
                      </span>
                    </div>
                    {p.model && (
                      <p className="mt-1 text-xs text-gray-500 dark:text-gray-400 font-mono">{p.model}</p>
                    )}
                    {p.baseURL && (
                      <p className="mt-0.5 text-xs text-gray-400 dark:text-gray-500 font-mono truncate">{p.baseURL}</p>
                    )}
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    {!p.isActive && (
                      <button
                        onClick={() => handleActivate(p.id)}
                        disabled={activatingId === p.id}
                        className="rounded-lg px-2.5 py-1.5 text-xs font-medium text-emerald-700 bg-emerald-50 border border-emerald-200 hover:bg-emerald-100 transition-colors disabled:opacity-50 dark:text-emerald-300 dark:bg-emerald-950/20 dark:border-emerald-800"
                        type="button"
                      >
                        {activatingId === p.id ? "..." : "فعال‌سازی"}
                      </button>
                    )}
                    <button
                      onClick={() => openEditForm(p)}
                      className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-blue-600 transition-colors dark:hover:bg-gray-700 dark:hover:text-blue-400"
                      title="ویرایش"
                      type="button"
                    >
                      <Pencil className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(p.id)}
                      disabled={deletingId === p.id}
                      className="rounded-lg p-1.5 text-gray-400 hover:bg-red-50 hover:text-red-600 transition-colors disabled:opacity-50 dark:hover:bg-red-950/20 dark:hover:text-red-400"
                      title="حذف"
                      type="button"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="mt-4 flex items-center justify-between border-t border-gray-100 pt-4 dark:border-gray-800">
              <button
                onClick={() => setPage((p) => Math.max(p - 1, 1))}
                disabled={page === 1 || loadingProviders}
                className="rounded-lg border border-gray-200 px-3 py-1.5 text-xs text-gray-500 disabled:opacity-50 dark:border-gray-700"
                type="button"
              >
                قبلی
              </button>
              <span className="text-xs text-gray-500">
                صفحه {page} از {totalPages}
              </span>
              <button
                onClick={() => setPage((p) => Math.min(p + 1, totalPages))}
                disabled={page === totalPages || loadingProviders}
                className="rounded-lg border border-gray-200 px-3 py-1.5 text-xs text-gray-500 disabled:opacity-50 dark:border-gray-700"
                type="button"
              >
                بعدی
              </button>
            </div>
          )}
        </section>

        {/* Telegram Login Section */}
        <section className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-900">
          <h2 className="mb-6 text-xl font-bold text-gray-900 dark:text-gray-100">
            ورود به تلگرام (UserBot)
          </h2>

          <div className="space-y-5">
            <div className="flex flex-col gap-1.5">
              <label className={labelClasses}>شماره تلفن</label>
              <input
                className={inputClasses}
                type="tel"
                dir="ltr"
                placeholder="+989..."
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
              />
            </div>

            <button className={btnPrimary + " w-full"} onClick={handleSendCode} disabled={sendingCode} type="button">
              {sendingCode ? "در حال ارسال..." : "درخواست کد تأیید"}
            </button>

            {codeSent && (
              <>
                <div className="flex flex-col gap-1.5">
                  <label className={labelClasses}>کد تأیید</label>
                  <input
                    className={inputClasses}
                    type="text"
                    dir="ltr"
                    placeholder="کد..."
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                  />
                </div>
                {showPasswordInput && (
                  <div className="flex flex-col gap-1.5">
                    <label className={labelClasses}>رمز عبور تایید دو مرحله‌ای (2FA)</label>
                    <input
                      className={inputClasses}
                      type="password"
                      dir="ltr"
                      placeholder="رمز دو مرحله‌ای..."
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                    />
                  </div>
                )}
                <button className={btnSuccess + " w-full"} onClick={handleVerifyCode} disabled={verifying} type="button">
                  {verifying ? "در حال تأیید..." : "تأیید و ذخیره نشست"}
                </button>
              </>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
