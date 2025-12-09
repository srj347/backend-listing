import { Request, Response, NextFunction } from 'express';
import { JobsService } from '../services/jobs.service.js';

const jobsService = new JobsService();

/**
 * GET /api/v1/jobs/:jobId
 * Get status of a scrape job
 */
export const getJobStatus = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { jobId } = req.params;
    const job = await jobsService.getJobStatus(jobId);
    res.json({ data: job });
  } catch (error) {
    next(error);
  }
};

