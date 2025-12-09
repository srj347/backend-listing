import knex, { Knex } from 'knex';
import { logger } from './utils/logger.js';
import type { ScrapedListing, ExistingListing } from './models/index.js';
import { DATABASE_CONFIG, TABLE_NAMES, DEFAULT_VALUES } from './constants/index.js';

export class DatabaseService {
  private db: Knex;

  constructor(databaseUrl: string) {
    this.db = knex({
      client: 'pg',
      connection: databaseUrl,
      pool: {
        min: DATABASE_CONFIG.POOL.MIN,
        max: DATABASE_CONFIG.POOL.MAX,
      },
    });
  }

  async upsertListing(listing: ScrapedListing): Promise<void> {
    await this.db.transaction(async (trx) => {
      const existing = await trx<ExistingListing>(TABLE_NAMES.LISTINGS)
        .where({ externalId: listing.external_id })
        .first();

      if (existing) {
        await trx(TABLE_NAMES.LISTINGS)
          .where({ id: existing.id })
          .update({
            title: listing.title,
            price: listing.price,
            currency: listing.currency,
            year: listing.year,
            mileage: listing.mileage,
            location: listing.location,
            vehicleType: listing.vehicle_type,
            sourceUrl: listing.source_url,
            sourceType: DEFAULT_VALUES.SOURCE_TYPE,
            attributes: listing.attributes,
          });

        logger.debug(`Updated listing: ${listing.external_id}`);
      } else {
        await trx(TABLE_NAMES.LISTINGS).insert({
          externalId: listing.external_id,
          title: listing.title,
          price: listing.price,
          currency: listing.currency,
          year: listing.year,
          mileage: listing.mileage,
          location: listing.location,
          vehicleType: listing.vehicle_type,
          sourceUrl: listing.source_url,
          sourceType: DEFAULT_VALUES.SOURCE_TYPE,
          attributes: listing.attributes,
        });

        logger.debug(`Inserted new listing: ${listing.external_id}`);
      }
    });
  }

  async listingExists(externalId: string): Promise<boolean> {
    const result = await this.db(TABLE_NAMES.LISTINGS)
      .where({ externalId })
      .first();
    return !!result;
  }

  async close(): Promise<void> {
    await this.db.destroy();
  }
}
