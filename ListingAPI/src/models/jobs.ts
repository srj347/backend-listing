/**
 * Discovery Job Payload for RabbitMQ
 */
export interface DiscoveryJobPayload {
  jobId: string;
  url: string;
  triggeredBy: 'scheduler' | 'manual';
  createdAt: string;
}

/**
 * Job Result interface
 */
export interface JobResult {
  listingsFound: number;
  listingsPublished: number;
  duration?: number;
  errors?: string[];
}

/**
 * Database Job interface
 */
export interface Job {
  id: string;
  jobType: string;
  status: string;
  payload: Record<string, unknown>;
  result: Record<string, unknown> | null;
  errorMessage: string | null;
  startedAt: Date | null;
  completedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * API Response Job interface
 */
export interface JobResponse {
  id: string;
  jobType: string;
  status: string;
  payload: Record<string, unknown>;
  result: Record<string, unknown> | null;
  errorMessage: string | null;
  startedAt: string | null;
  completedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

