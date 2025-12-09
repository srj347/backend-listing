CREATE TABLE IF NOT EXISTS jobs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    "jobType" VARCHAR(50) NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'pending',
    payload JSONB NOT NULL DEFAULT '{}',
    result JSONB,
    "errorMessage" TEXT,
    "startedAt" TIMESTAMPTZ,
    "completedAt" TIMESTAMPTZ,
    "createdAt" TIMESTAMPTZ DEFAULT (NOW() AT TIME ZONE 'UTC'),
    "updatedAt" TIMESTAMPTZ DEFAULT (NOW() AT TIME ZONE 'UTC')
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_jobs_status ON jobs(status);
CREATE INDEX IF NOT EXISTS idx_jobs_job_type ON jobs("jobType");
CREATE INDEX IF NOT EXISTS idx_jobs_created_at ON jobs("createdAt" DESC);

-- Table comments
COMMENT ON TABLE jobs IS 'Background job tracking - timestamps stored in UTC';
COMMENT ON COLUMN jobs."jobType" IS 'Type: discovery, extraction';
COMMENT ON COLUMN jobs.status IS 'Status: pending, running, completed, failed';

DO $$
BEGIN
    RAISE NOTICE 'Schema: jobs table created';
END $$;

