import { Router } from 'express';
import {
  getListings,
  getListingById,
  updateListing,
  triggerRefresh,
} from '../controllers/listings.controller.js';
import { validate } from '../middleware/validate.js';
import {
  ListingQuerySchema,
  UpdateListingSchema,
  RefreshJobSchema,
  IdParamSchema,
} from '../validators/listings.validator.js';

const listingsRouter: Router = Router();

/**
 * GET /api/v1/listings
 * Get paginated listings with optional filters
 */
listingsRouter.get(
  '/',
  validate({ query: ListingQuerySchema }),
  getListings
);

/**
 * GET /api/v1/listings/:id
 * Get a single listing by ID
 */
listingsRouter.get(
  '/:id',
  validate({ params: IdParamSchema }),
  getListingById
);

/**
 * PUT /api/v1/listings/:id
 * Update a listing
 */
listingsRouter.put(
  '/:id',
  validate({ params: IdParamSchema, body: UpdateListingSchema }),
  updateListing
);

/**
 * POST /api/v1/listings/refresh
 * Trigger refresh/scrape job
 */
listingsRouter.post(
  '/refresh',
  validate({ body: RefreshJobSchema }),
  triggerRefresh
);

export { listingsRouter };
