CREATE TABLE IF NOT EXISTS listings (
    id BIGSERIAL PRIMARY KEY,
    "externalId" VARCHAR(255) UNIQUE NOT NULL,
    title VARCHAR(255) NOT NULL,
    price NUMERIC(12, 2) NOT NULL,
    currency VARCHAR(10) DEFAULT 'PHP',
    year SMALLINT,
    mileage INTEGER,
    location VARCHAR(100) NOT NULL,
    "vehicleType" VARCHAR(50) NOT NULL DEFAULT 'car',
    status VARCHAR(20) DEFAULT 'active',
    "sourceUrl" TEXT,
    "sourceType" VARCHAR(50) DEFAULT 'facebook',
    attributes JSONB NOT NULL DEFAULT '{}',
    "createdAt" TIMESTAMPTZ DEFAULT (NOW() AT TIME ZONE 'UTC'),
    "updatedAt" TIMESTAMPTZ DEFAULT (NOW() AT TIME ZONE 'UTC')
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_listings_external_id ON listings("externalId");
CREATE INDEX IF NOT EXISTS idx_listings_price ON listings(price);
CREATE INDEX IF NOT EXISTS idx_listings_year ON listings(year);
CREATE INDEX IF NOT EXISTS idx_listings_price_year ON listings(price, year);
CREATE INDEX IF NOT EXISTS idx_listings_location ON listings(location);
CREATE INDEX IF NOT EXISTS idx_listings_status ON listings(status);
CREATE INDEX IF NOT EXISTS idx_listings_vehicle_type ON listings("vehicleType");
CREATE INDEX IF NOT EXISTS idx_listings_source_type ON listings("sourceType");
CREATE INDEX IF NOT EXISTS idx_listings_created_at ON listings("createdAt" DESC);
CREATE INDEX IF NOT EXISTS idx_listings_attributes ON listings USING GIN (attributes);

-- Table comments
COMMENT ON TABLE listings IS 'Vehicle listings data - timestamps stored in UTC';
COMMENT ON COLUMN listings."externalId" IS 'External source ID for deduplication';
COMMENT ON COLUMN listings.attributes IS 'Flexible JSONB for additional fields';

DO $$
BEGIN
    RAISE NOTICE 'Schema: listings table created';
END $$;

