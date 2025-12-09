
SET timezone = 'UTC';
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TABLE IF NOT EXISTS schema_migrations (
    version VARCHAR(255) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    applied_at TIMESTAMPTZ DEFAULT (NOW() AT TIME ZONE 'UTC'),
    checksum VARCHAR(64)
);

COMMENT ON TABLE schema_migrations IS 'Tracks applied database migrations for version control';

INSERT INTO schema_migrations (version, name, checksum)
VALUES ('1.0.0', 'initial_schema', md5('initial'))
ON CONFLICT (version) DO NOTHING;

DO $$
BEGIN
    RAISE NOTICE 'Setup: Extensions and migration tracking configured';
END $$;
