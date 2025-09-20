import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import React from "react";
import { Controller, useForm } from "react-hook-form";

export default function SwitchOfForm({control: control}: any) {

  return (
    <div className="space-y-8">
      {" "}
      <p>اگر کاربر شما در</p>
      <div className="flex gap-4">
        <div className="flex gap-2 items-center">
          <Controller
            name="direct"
            control={control}
            render={({ field }) => (
              <div className="flex gap-2 items-center">
                <Switch
                  dir="ltr"
                  id="direct"
                  checked={field.value}
                  onCheckedChange={(checked) => field.onChange(checked)}
                />
                <Label htmlFor="direct">دایرکت</Label>
              </div>
            )}
          />
        </div>
        <div className="flex gap-2 items-center">
          <Controller
            name="post"
            control={control}
            render={({ field }) => (
              <div className="flex gap-2 items-center">
                <Switch
                  dir="ltr"
                  id="post"
                  checked={field.value}
                  onCheckedChange={(checked) => field.onChange(checked)}
                />
                <Label htmlFor="post">کامنت (پست یا لایو)</Label>
              </div>
            )}
          />
        </div>
      </div>
    </div>
  );
}
