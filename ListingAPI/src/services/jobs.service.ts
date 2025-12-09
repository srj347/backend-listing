import { v4 as uuidv4 } from 'uuid';
import { Knex } from 'knex';
import { getDb } from './db.service.js';
import { publishToQueue } from './rabbitmq.service.js';
import { NotFoundError } from '../middleware/error-handler.js';
import type { RefreshJobInput } from '../validators/listings.validator.js';
import type { DiscoveryJobPayload, Job, JobResponse } from '../models/jobs.js';
import { QUEUE_NAMES, TABLE_NAMES } from '../constants/index.js';

export class JobsService {
  private db: Knex;

  constructor() {
    this.db = getDb();
  }

  /**
   * Create a new discovery job and publish to RabbitMQ
   */
  async createDiscoveryJob(input: RefreshJobInput): Promise<JobResponse> {
    const jobId = uuidv4();
    const now = new Date();

    const payload: DiscoveryJobPayload = {
      jobId: jobId,
      url: input.url,
      triggeredBy: 'manual',
      createdAt: now.toISOString(),
    };

    await this.db<Job>(TABLE_NAMES.JOBS).insert({
      id: jobId,
      jobType: 'discovery',
      status: 'pending',
      payload: payload as unknown as Record<string, unknown>,
    });

    await publishToQueue(QUEUE_NAMES.DISCOVERY, payload);

    return this.getJobStatus(jobId);
  }

  /**
   * Get job status by ID
   */
  async getJobStatus(jobId: string): Promise<JobResponse> {
    const job = await this.db<Job>(TABLE_NAMES.JOBS)
      .where({ id: jobId })
      .first();

    if (!job) {
      throw new NotFoundError('Job', jobId);
    }

    return this.formatJob(job);
  }

  /**
   * Update job status
   */
  async updateJobStatus(
    jobId: string,
    status: string,
    result?: Record<string, unknown>,
    errorMessage?: string
  ): Promise<JobResponse> {
    const updateData: Partial<Job> = { status };

    if (status === 'running') {
      updateData.startedAt = new Date();
    }

    if (status === 'completed' || status === 'failed') {
      updateData.completedAt = new Date();
    }

    if (result) {
      updateData.result = result;
    }

    if (errorMessage) {
      updateData.errorMessage = errorMessage;
    }

    await this.db<Job>(TABLE_NAMES.JOBS)
      .where({ id: jobId })
      .update(updateData);

    return this.getJobStatus(jobId);
  }

  /**
   * Format job for API response
   */
  private formatJob(job: Job): JobResponse {
    return {
      id: job.id,
      jobType: job.jobType,
      status: job.status,
      payload: job.payload,
      result: job.result,
      errorMessage: job.errorMessage,
      startedAt: job.startedAt?.toISOString() || null,
      completedAt: job.completedAt?.toISOString() || null,
      createdAt: job.createdAt.toISOString(),
      updatedAt: job.updatedAt.toISOString(),
    };
  }
}
