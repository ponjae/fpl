import { AllData, Fixture, isAllData, isFixture } from '@fpl/contracts/fpl';
import { isArrayOfType } from '@fpl/utils';
import { ApplicationService } from '../../app';
import { GetFixtures } from './endpoints/GetFixtures';
import { GetRawData } from './endpoints/GetRawData';

export class DataFetcher extends ApplicationService {
  /**
   * Fetches all raw data from the FPL API.
   *
   * @returns the data.
   */
  public async fetchRawData(): Promise<AllData> {
    const context = this.getContext();

    const data = await new GetRawData(context)
      .withOutputValidation(isAllData)
      .call();
    return data;
  }

  /**
   * Fetches fixture data from the FPL API.
   *
   * @returns the fixtures.
   */
  public async fetchFixtures(): Promise<Fixture[]> {
    const context = this.getContext();

    const data = await new GetFixtures(context)
      .withOutputValidation((data) => isArrayOfType(data, isFixture))
      .call();
    return data;
  }
}
