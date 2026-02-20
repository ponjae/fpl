import { AllData, Fixture, isAllData, isFixture } from '@fpl/contracts/fpl';
import { isArrayOfType } from '@fpl/utils';
import { ApplicationService } from '../../../app';
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

export class DataService extends ApplicationService {
  private cachedData: RawFPLData | null = null;
  private cacheDuration = 60 * 60 * 1000; // 1 hour

  /**
   * Get all FPL data (raw data + fixtures).
   * Returns cached data if available and fresh, otherwise fetches from API.
   *
   * @returns the raw FPL data.
   */
  public async getData(): Promise<RawFPLData> {
    if (this.shouldRefresh()) {
      await this.refresh();
    }
    return this.cachedData!;
  }

  /**
   * Force refresh from FPL API.
   */
  public async refresh(): Promise<void> {
    const context = this.getContext();

    const [rawData, fixtures] = await Promise.all([
      new GetRawData(context).withOutputValidation(isAllData).call(),
      new GetFixtures(context)
        .withOutputValidation((data) => isArrayOfType(data, isFixture))
        .call(),
    ]);

    this.cachedData = {
      allData: rawData,
      fixtures,
      lastFetched: new Date(),
    };
  }

  /**
   * Check if cache should be refreshed.
   */
  private shouldRefresh(): boolean {
    if (!this.cachedData) return true;

    const now = Date.now();
    const lastFetched = this.cachedData.lastFetched.getTime();
    return now - lastFetched > this.cacheDuration;
  }
}
