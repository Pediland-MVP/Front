import { FormEventHandler } from "react";

export default function p2eNumbers(value: string) {
  return value
    .replace(/[۰-۹]/g, (d) => "۰۱۲۳۴۵۶۷۸۹".indexOf(d).toString())
    .replace(/[^0-9]/g, "");
}


export function onInputP2EHandler(e: React.FormEvent<HTMLInputElement>) {
  e.currentTarget.value = p2eNumbers(e.currentTarget.value);
}