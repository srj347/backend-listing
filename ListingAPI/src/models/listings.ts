/**
 * Database Listing interface
 */
export interface Listing {
  id: number;
  externalId: string;
  title: string;
  price: number;
  currency: string;
  year: number | null;
  mileage: number | null;
  location: string;
  vehicleType: string;
  status: string;
  sourceUrl: string | null;
  sourceType: string;
  attributes: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * API Response Listing interface
 */
export interface ListingResponse {
  id: string;
  externalId: string;
  title: string;
  price: number;
  currency: string;
  year: number | null;
  mileage: number | null;
  location: string;
  vehicleType: string;
  status: string;
  sourceUrl: string | null;
  sourceType: string;
  attributes: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

/**
 * Paginated Response interface
 */
export interface PaginatedResponse {
  data: ListingResponse[];
  meta: {
    total: number;
    page: number;
    limit: number;
    lastPage: number;
  };
}

