export const mutateIncludeStringKey = (value: string) => (key: any) =>
  typeof key === 'string' && key.includes(value);
