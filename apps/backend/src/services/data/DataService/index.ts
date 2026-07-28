import { AllData, Fixture, isAllData, isFixture } from '@fpl/contracts/fpl';
import { isArrayOfType } from '@fpl/utils';
import { ApplicationService, ApplicationContext } from '../../../app';
import { GetFixtures } from './endpoints/GetFixtures';
import { GetRawData } from './endpoints/GetRawData';

/**
 * Raw FPL data fetched from the API.
 */
export type RawFPLData = {
  allData: AllData;
  fixtures: Fixture[];
  lastFetched: Date;
};

/**
 * Module-level raw-data cache.
 *
 * DataService instances are pooled (ApplicationContext.MAX_POOLSIZE = 10), so
 * instance-level caches would result in multiple independent raw-data caches
 * that are each cold on first use. A module-level store ensures all instances
 * (and all service consumers) share one cache and one TTL clock.
 */
type RawDataCache = {
  data: RawFPLData;
  lastFetchTime: number;
};

let rawCache: RawDataCache | null = null;
const RAW_CACHE_DURATION_MS = 60 * 60 * 1000; // 1 hour

export class DataService extends ApplicationService {
  /**
   * Get raw FPL data via the shared module-level cache.
   *
   * This static entry point is the preferred way for other services to obtain
   * raw data. It avoids the need to instantiate a DataService through the pool
   * (which would require a Req object) while still correctly reusing the cache
   * across all callers.
   *
   * The context is only needed to reach the FPL API when the cache is cold; it
   * is obtained from a temporary service instance whose sole purpose is to call
   * the endpoints.
   *
   * @param context - the ApplicationContext used to build API endpoint calls.
   *
   * @returns the cached or freshly fetched raw FPL data.
   */
  public static async getSharedData(
    context: ApplicationContext
  ): Promise<RawFPLData> {
    if (DataService.shouldRefreshCache()) {
      await DataService.refreshCache(context);
    }
    return rawCache!.data;
  }

  /**
   * Invalidate the module-level raw-data cache.
   *
   * Exposed for testing. After invalidation the next call to getSharedData()
   * triggers a full re-fetch from the FPL API.
   */
  public static invalidateCache(): void {
    rawCache = null;
  }

  /**
   * Get all FPL data (raw data + fixtures).
   * Returns cached data if available and fresh, otherwise fetches from API.
   *
   * @returns the raw FPL data.
   */
  public async getData(): Promise<RawFPLData> {
    if (DataService.shouldRefreshCache()) {
      await DataService.refreshCache(this.getContext());
    }
    return rawCache!.data;
  }

  /**
   * Force refresh from FPL API.
   */
  public async refresh(): Promise<void> {
    await DataService.refreshCache(this.getContext());
  }

  /**
   * Check if the module-level raw cache needs refreshing.
   */
  private static shouldRefreshCache(): boolean {
    return (
      !rawCache ||
      Date.now() - rawCache.lastFetchTime > RAW_CACHE_DURATION_MS
    );
  }

  /**
   * Fetch fresh data from the FPL API and populate the module-level cache.
   *
   * @param context - the ApplicationContext used for endpoint construction.
   */
  private static async refreshCache(context: ApplicationContext): Promise<void> {
    const [rawData, fixtures] = await Promise.all([
      new GetRawData(context).withOutputValidation(isAllData).call(),
      new GetFixtures(context)
        .withOutputValidation((data) => isArrayOfType(data, isFixture))
        .call(),
    ]);

    rawCache = {
      data: {
        allData: rawData,
        fixtures,
        lastFetched: new Date(),
      },
      lastFetchTime: Date.now(),
    };
  }
}
