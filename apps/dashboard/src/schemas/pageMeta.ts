import z from "zod";

export const PageMetaSchema = z.object({
  currentPage: z.number(),
  itemCount: z.number(),
  itemsPerPage: z.number(),
  totalItems: z.number(),
  totalPages: z.number(),
});

export type PageMeta = z.infer<typeof PageMetaSchema>;
