export interface SchedulerPayload {
  url?: string;
}

export interface DiscoveryJobPayload {
  jobId: string;
  url: string;
  triggeredBy: string;
  createdAt: string;
}

