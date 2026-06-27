import { z } from 'zod';

// Define and export the schema separately if needed
const formSchema = z.object({
  conditions: z.array(
    z.object({
      type: z.string(),
      value: z.string(),
    }),
  ),
  postAndMessage: z.array(
    z.object({
      message: z.array(z.string()),
      time: z.string().optional(),
      button: z.array(
        z.object({
          btnTitle: z.array(z.string()).optional(),
          btnText: z.array(z.string()).optional(),
        }),
      ),
    }),
  ),
  checkboxes: z.array(z.string()).optional(),
  direct: z.boolean(),
  post: z.boolean(),
});

// Define a hook to return the schema
function useFormSchema() {
  return formSchema; // Return the schema
}

// Export both the hook and schema for reuse
export { useFormSchema, formSchema };
