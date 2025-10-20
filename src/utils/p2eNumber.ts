export default function p2eNumbers(value: string) {
  return value
    .replace(/[۰-۹]/g, (d) => "۰۱۲۳۴۵۶۷۸۹".indexOf(d).toString())
    .replace(/[^0-9]/g, "");
}

export function p2eLocaleString(value: number | string): string {
  const p2e = p2eNumbers((+value).toString());
  return (+p2e).toLocaleString();
}

export function onInputP2EHandler(e: React.FormEvent<HTMLInputElement>) {
  e.currentTarget.value = p2eNumbers(e.currentTarget.value);
}

export function enNumberToFAString(value?: number) {
  {
    return value ? value?.toLocaleString("fa-IR") : null;
  }
}
