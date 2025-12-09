import { Router, Request, Response } from 'express';
import { listingsRouter } from './listings.routes.js';
import { jobsRouter } from './jobs.routes.js';

const router: Router = Router();

// Listings endpoints
router.use('/listings', listingsRouter);

// Jobs endpoints
router.use('/jobs', jobsRouter);

export { router };
