-- Load schema files
\i /docker-entrypoint-initdb.d/schema/setup.sql
\i /docker-entrypoint-initdb.d/schema/listings.sql
\i /docker-entrypoint-initdb.d/schema/jobs.sql
\i /docker-entrypoint-initdb.d/schema/triggers.sql
