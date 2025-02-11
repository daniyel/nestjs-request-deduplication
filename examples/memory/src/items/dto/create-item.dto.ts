import { z } from 'zod';

export const CreateItemSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  description: z.string().min(5, 'Description must be at least 5 characters'),
});

export interface CreateItemDto extends z.infer<typeof CreateItemSchema> {}
