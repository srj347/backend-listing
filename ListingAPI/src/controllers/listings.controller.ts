import { Request, Response, NextFunction } from 'express';
import { ListingsService } from '../services/listings.service.js';
import { JobsService } from '../services/jobs.service.js';
import {
  ListingQuery,
  UpdateListingInput,
  RefreshJobInput,
} from '../validators/listings.validator.js';

const listingsService = new ListingsService();
const jobsService = new JobsService();

/**
 * GET /api/v1/listings
 * Retrieve paginated listings with filters
 */
export const getListings = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const query = req.query as unknown as ListingQuery;
    const result = await listingsService.findAll(query);
    res.json(result);
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/v1/listings/:id
 * Retrieve a single listing by ID
 */
export const getListingById = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;
    const listing = await listingsService.findById(parseInt(id, 10));
    res.json({ data: listing });
  } catch (error) {
    next(error);
  }
};

/**
 * PUT /api/v1/listings/:id
 * Update a listing
 */
export const updateListing = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;
    const updateData = req.body as UpdateListingInput;
    const listing = await listingsService.update(parseInt(id, 10), updateData);
    res.json({ data: listing });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/v1/listings/refresh
 * Trigger a manual scrape job
 */
export const triggerRefresh = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const jobData = req.body as RefreshJobInput;
    const job = await jobsService.createDiscoveryJob(jobData);
    
    res.status(202).json({
      message: 'Refresh job queued successfully',
      job_id: job.id,
      status: job.status,
    });
  } catch (error) {
    next(error);
  }
};

