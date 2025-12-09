/**
 * Scraped listing data structure
 */
export interface ScrapedListing {
  external_id: string;
  title: string;
  price: number;
  currency: string;
  year: number | null;
  mileage: number | null;
  location: string;
  vehicle_type: string;
  source_url: string;
  attributes: Record<string, unknown>;
}

/**
 * Partial scraped data (intermediate extraction result)
 */
export interface PartialScrapedData {
  title?: string;
  price?: number;
  currency?: string;
  year?: number | null;
  mileage?: number | null;
  attributes?: Record<string, unknown>;
}

/**
 * Existing listing from database
 */
export interface ExistingListing {
  id: number;
  externalId: string;
  price: number;
}

