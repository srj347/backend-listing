import { Router } from 'express';
import { getJobStatus } from '../controllers/jobs.controller.js';
import { validate } from '../middleware/validate.js';
import { JobIdParamSchema } from '../validators/listings.validator.js';

const jobsRouter: Router = Router();

/**
 * GET /api/v1/jobs/:jobId
 * Get status of a scrape job
 */
jobsRouter.get(
  '/:jobId',
  validate({ params: JobIdParamSchema }),
  getJobStatus
);

export { jobsRouter };


