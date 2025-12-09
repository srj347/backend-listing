import { z } from 'zod';

export const ListingQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  minPrice: z.coerce.number().positive().optional(),
  maxPrice: z.coerce.number().positive().optional(),
  location: z.string().optional(),
  yearMin: z.coerce.number().int().min(1900).max(2100).optional(),
  yearMax: z.coerce.number().int().min(1900).max(2100).optional(),
  status: z.enum(['active', 'sold', 'hidden']).optional(),
  vehicleType: z.enum(['car', 'bike', 'truck', 'suv']).optional(),
  sortBy: z.enum(['price', 'year', 'createdAt', 'updatedAt', 'mileage']).default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

export const UpdateListingSchema = z.object({
  title: z.string().min(1).max(255).optional(),
  price: z.number().positive().optional(),
  status: z.enum(['active', 'sold', 'hidden']).optional(),
  year: z.number().int().min(1900).max(2100).optional(),
  mileage: z.number().int().min(0).optional(),
  attributes: z.record(z.unknown()).optional(),
});

export const RefreshJobSchema = z.object({
  url: z.string().url(),
});

export const IdParamSchema = z.object({
  id: z.coerce.number().int().positive(),
});

export const JobIdParamSchema = z.object({
  jobId: z.string().uuid(),
});

export type ListingQuery = z.infer<typeof ListingQuerySchema>;
export type UpdateListingInput = z.infer<typeof UpdateListingSchema>;
export type RefreshJobInput = z.infer<typeof RefreshJobSchema>;
