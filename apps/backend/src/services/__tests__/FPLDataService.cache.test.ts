/**
 * Unit tests for FPLDataService module-level caching behaviour.
 *
 * Key invariant: all pooled FPLDataService instances share ONE module-level
 * ProcessedData cache. A call to invalidateCache() + getData() always triggers
 * exactly one re-fetch. A POST /refresh from any instance invalidates the
 * cache that every subsequent request reads.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ApplicationContext } from '../../app';
import { DataService, RawFPLData } from '../data/DataService';
import { FPLDataService } from '../data/FPLDataService';

// ---------- helpers ----------------------------------------------------------

/** Minimal raw data stub — no real API call needed */
const makeRawData = (): RawFPLData => ({
  allData: {
    events: [],
    teams: [],
    elements: [],
    element_types: [],
  },
  fixtures: [],
  lastFetched: new Date(),
});

/** Stub ApplicationContext so getContext() in refresh() works */
const makeContext = (): ApplicationContext => new ApplicationContext();

// ---------- tests ------------------------------------------------------------

describe('FPLDataService — module-level cache', () => {
  beforeEach(() => {
    FPLDataService.invalidateCache();
    DataService.invalidateCache();
    vi.restoreAllMocks();
  });

  it('cache is shared: a second instance reads data fetched by the first', async () => {
    vi.spyOn(DataService, 'getSharedData').mockResolvedValue(makeRawData());

    const ctx = makeContext();

    const svc1 = new FPLDataService();
    svc1._init(ctx);
    const data1 = await svc1.getData();

    // svc2 should NOT trigger another fetch
    const fetchSpy = vi.spyOn(DataService, 'getSharedData');
    const svc2 = new FPLDataService();
    svc2._init(ctx);
    const data2 = await svc2.getData();

    expect(fetchSpy).not.toHaveBeenCalled();
    // Both instances return the identical cached reference
    expect(data1).toBe(data2);
  });

  it('getData() calls getSharedData exactly once on cold cache, then reuses', async () => {
    const getSharedSpy = vi
      .spyOn(DataService, 'getSharedData')
      .mockResolvedValue(makeRawData());

    const ctx = makeContext();
    const svc = new FPLDataService();
    svc._init(ctx);

    await svc.getData();
    await svc.getData();
    await svc.getData();

    expect(getSharedSpy).toHaveBeenCalledTimes(1);
  });

  it('invalidateCache() causes the next getData() to re-fetch', async () => {
    const getSharedSpy = vi
      .spyOn(DataService, 'getSharedData')
      .mockResolvedValue(makeRawData());

    const ctx = makeContext();
    const svc = new FPLDataService();
    svc._init(ctx);

    await svc.getData(); // cold fetch → 1 call
    FPLDataService.invalidateCache();
    await svc.getData(); // cache gone → 2nd fetch
    await svc.getData(); // warm → no extra call

    expect(getSharedSpy).toHaveBeenCalledTimes(2);
  });

  it('refresh() (as called by POST /data/refresh) invalidates and re-fetches once, visible to all instances', async () => {
    const getSharedSpy = vi
      .spyOn(DataService, 'getSharedData')
      .mockResolvedValue(makeRawData());

    const ctx = makeContext();

    const svc1 = new FPLDataService();
    svc1._init(ctx);
    const before = await svc1.getData(); // initial fetch

    // Simulate POST /data/refresh on a different pooled instance
    FPLDataService.invalidateCache();
    const svc2 = new FPLDataService();
    svc2._init(ctx);
    await svc2.refresh();

    // svc1 now reads from the updated module cache (no extra fetch)
    const fetchSpyAfter = vi.spyOn(DataService, 'getSharedData');
    const after = await svc1.getData();
    expect(fetchSpyAfter).not.toHaveBeenCalled();
    // cache was refreshed so `after` is the data written by svc2.refresh()
    expect(after).not.toBe(before);

    expect(getSharedSpy).toHaveBeenCalledTimes(2); // initial + refresh
  });
});
