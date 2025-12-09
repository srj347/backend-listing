-- Load schema files in dependency order
\i /docker-entrypoint-initdb.d/schema/setup.sql
\i /docker-entrypoint-initdb.d/schema/listings.sql
\i /docker-entrypoint-initdb.d/schema/jobs.sql
\i /docker-entrypoint-initdb.d/schema/triggers.sql

DO $$
DECLARE
    table_count INTEGER;
    index_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO table_count 
    FROM information_schema.tables 
    WHERE table_schema = 'public' AND table_type = 'BASE TABLE';
    
    SELECT COUNT(*) INTO index_count 
    FROM pg_indexes 
    WHERE schemaname = 'public';
    
    RAISE NOTICE '';
    RAISE NOTICE '✅ Database initialization completed successfully';
    RAISE NOTICE '   Tables created: %', table_count;
    RAISE NOTICE '   Indexes created: %', index_count;
    RAISE NOTICE '';
END $$;
