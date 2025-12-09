import { Knex } from 'knex';
import { getDb } from './db.service.js';
import { NotFoundError } from '../middleware/error-handler.js';
import type { ListingQuery, UpdateListingInput } from '../validators/listings.validator.js';
import type { Listing, ListingResponse, PaginatedResponse } from '../models/listings.js';
import { TABLE_NAMES } from '../constants/index.js';

interface CountResult {
  count: string | number;
}

export class ListingsService {
  private db: Knex;

  constructor() {
    this.db = getDb();
  }

  /**
   * Find all listings with pagination and filters
   */
  async findAll(query: ListingQuery): Promise<PaginatedResponse> {
    const {
      page,
      limit,
      minPrice,
      maxPrice,
      location,
      yearMin,
      yearMax,
      status,
      vehicleType,
      sortBy,
      sortOrder,
    } = query;

    const offset = (page - 1) * limit;

    let baseQuery = this.db<Listing>(TABLE_NAMES.LISTINGS);

    if (minPrice !== undefined) {
      baseQuery = baseQuery.where('price', '>=', minPrice);
    }
    if (maxPrice !== undefined) {
      baseQuery = baseQuery.where('price', '<=', maxPrice);
    }
    if (location) {
      baseQuery = baseQuery.whereILike('location', `%${location}%`);
    }
    if (yearMin !== undefined) {
      baseQuery = baseQuery.where('year', '>=', yearMin);
    }
    if (yearMax !== undefined) {
      baseQuery = baseQuery.where('year', '<=', yearMax);
    }
    if (status) {
      baseQuery = baseQuery.where('status', status);
    }
    if (vehicleType) {
      baseQuery = baseQuery.where('vehicleType', vehicleType);
    }

    const countResult = await baseQuery.clone().count('* as count').first() as CountResult | undefined;
    const total = countResult ? parseInt(String(countResult.count), 10) : 0;

    const listings = await baseQuery
      .clone()
      .orderBy(sortBy, sortOrder)
      .offset(offset)
      .limit(limit);

    return {
      data: listings.map(this.formatListing),
      meta: {
        total,
        page,
        limit,
        lastPage: Math.ceil(total / limit) || 1,
      },
    };
  }

  /**
   * Find a listing by ID
   */
  async findById(id: number): Promise<ListingResponse> {
    const listing = await this.db<Listing>(TABLE_NAMES.LISTINGS)
      .where({ id })
      .first();

    if (!listing) {
      throw new NotFoundError('Listing', id);
    }

    return this.formatListing(listing);
  }

  /**
   * Update a listing
   */
  async update(id: number, data: UpdateListingInput): Promise<ListingResponse> {
    const existing = await this.db<Listing>(TABLE_NAMES.LISTINGS)
      .where({ id })
      .first();

    if (!existing) {
      throw new NotFoundError('Listing', id);
    }

    const updatePayload: Record<string, unknown> = {};
    
    if (data.title !== undefined) updatePayload.title = data.title;
    if (data.price !== undefined) updatePayload.price = data.price;
    if (data.status !== undefined) updatePayload.status = data.status;
    if (data.year !== undefined) updatePayload.year = data.year;
    if (data.mileage !== undefined) updatePayload.mileage = data.mileage;
    
    if (data.attributes) {
      updatePayload.attributes = this.db.raw(
        `attributes || ?::jsonb`,
        [JSON.stringify(data.attributes)]
      );
    }

    if (Object.keys(updatePayload).length > 0) {
    await this.db<Listing>(TABLE_NAMES.LISTINGS)
      .where({ id })
      .update(updatePayload);
    }

    return this.findById(id);
  }

  /**
   * Format listing for API response
   */
  private formatListing(listing: Listing): ListingResponse {
    return {
      id: listing.id.toString(),
      externalId: listing.externalId,
      title: listing.title,
      price: parseFloat(listing.price.toString()),
      currency: listing.currency,
      year: listing.year,
      mileage: listing.mileage,
      location: listing.location,
      vehicleType: listing.vehicleType,
      status: listing.status,
      sourceUrl: listing.sourceUrl,
      sourceType: listing.sourceType,
      attributes: listing.attributes,
      createdAt: listing.createdAt.toISOString(),
      updatedAt: listing.updatedAt.toISOString(),
    };
  }
}
