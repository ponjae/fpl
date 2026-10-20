/**
 * Live-payload typeguard tests
 *
 * These tests validate every guard in `api.ts` against a checked-in snapshot
 * of real FPL API responses (see __fixtures__/README.md for how they were
 * generated and how to regenerate them).
 *
 * WHY: The existing test suite uses hand-written fixtures that never caught
 * production bugs where guards were stricter than the live API (e.g. fields
 * that are `null` pre-season).  A single failing guard rejects `isAllData`,
 * which 422s every endpoint.
 */
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import {
  isAllData,
  isEvent,
  isRawPlayer,
  isRawTeam,
  isElementType,
  isFixture,
  isChipPlay,
  isTopElementInfo,
} from './api';
import type { Event } from '../types';

// ---------------------------------------------------------------------------
// Fixture loading
// ---------------------------------------------------------------------------

const FIXTURES_DIR = join(__dirname, '__fixtures__');

const bootstrapRaw = JSON.parse(
  readFileSync(join(FIXTURES_DIR, 'bootstrap-static.json'), 'utf-8')
);

const fixturesRaw = JSON.parse(
  readFileSync(join(FIXTURES_DIR, 'fixtures.json'), 'utf-8')
);

// ---------------------------------------------------------------------------
// Diff helper
//
// When a guard rejects an entry, produce a human-readable report of which
// fields diverge from what the guard expects.  This avoids the cryptic
// "expected true to be false" failure message.
// ---------------------------------------------------------------------------

type FieldReport = { field: string; actual: unknown; expected: string };

/**
 * Describe, in plain English, which top-level fields on `obj` look suspicious
 * given the expected types in `schema`.
 *
 * `schema` is a map of field name → expected type string (or 'nullable<T>').
 * We only report the fields that fail their expectation.
 */
function diffFields(
  obj: Record<string, unknown>,
  schema: Record<string, (v: unknown) => boolean>,
  labels: Record<string, string>
): FieldReport[] {
  const failures: FieldReport[] = [];
  for (const [field, check] of Object.entries(schema)) {
    if (!check(obj[field])) {
      failures.push({
        field,
        actual: obj[field],
        expected: labels[field] ?? '?',
      });
    }
  }
  return failures;
}

function formatDiff(failures: FieldReport[]): string {
  if (failures.length === 0) return '(no individual field issues detected)';
  return failures
    .map((f) => `  • ${f.field}: expected ${f.expected}, got ${JSON.stringify(f.actual)}`)
    .join('\n');
}

// Shared primitive checks (mirrors what @fpl/utils exports, without importing them)
const isNum  = (v: unknown): boolean => typeof v === 'number';
const isStr  = (v: unknown): boolean => typeof v === 'string';
const isBool = (v: unknown): boolean => typeof v === 'boolean';
const isArr  = (v: unknown): boolean => Array.isArray(v);
const nullOr =
  (check: (v: unknown) => boolean) =>
  (v: unknown): boolean =>
    v === null || check(v);

// ---------------------------------------------------------------------------
// Per-guard field schemas for diff output
// ---------------------------------------------------------------------------

const eventSchema: Record<string, (v: unknown) => boolean> = {
  average_entry_score: isNum,
  chip_plays:          isArr,
  finished:            isBool,
  highest_score:       nullOr(isNum),
  id:                  isNum,
  most_captained:      nullOr(isNum),
  name:                isStr,
  top_element:         nullOr(isNum),
  top_element_info:    nullOr((v) => v !== undefined),
  transfers_made:      nullOr(isNum),
};
const eventLabels = Object.fromEntries(
  Object.keys(eventSchema).map((k) => [k, eventSchema[k].toString()])
);

const playerSchema: Record<string, (v: unknown) => boolean> = {
  assists:                          isNum,
  birth_date:                       nullOr(isStr),
  bonus:                            isNum,
  bps:                              isNum,
  can_select:                       isBool,
  clean_sheets:                     isNum,
  code:                             isNum,
  creativity:                       isStr,
  creativity_rank:                  isNum,
  creativity_rank_type:             isNum,
  defensive_contribution:           isNum,
  defensive_contribution_per_90:    isNum,
  dreamteam_count:                  isNum,
  element_type:                     isNum,
  ep_next:                          nullOr(isStr),
  ep_this:                          nullOr(isStr),
  event_points:                     isNum,
  expected_assists:                 isStr,
  expected_assists_per_90:          isNum,
  expected_goal_involvements:       isStr,
  expected_goal_involvements_per_90:isNum,
  expected_goals:                   isStr,
  expected_goals_conceded:          isStr,
  expected_goals_conceded_per_90:   isNum,
  expected_goals_per_90:            isNum,
  first_name:                       isStr,
  form:                             isStr,
  goals_conceded:                   isNum,
  goals_conceded_per_90:            isNum,
  goals_scored:                     isNum,
  ict_index:                        isStr,
  ict_index_rank:                   isNum,
  ict_index_rank_type:              isNum,
  id:                               isNum,
  in_dreamteam:                     isBool,
  influence:                        isStr,
  influence_rank:                   isNum,
  influence_rank_type:              isNum,
  minutes:                          isNum,
  now_cost:                         isNum,
  now_cost_rank:                    isNum,
  own_goals:                        isNum,
  penalties_missed:                 isNum,
  penalties_saved:                  isNum,
  points_per_game:                  isStr,
  points_per_game_rank:             isNum,
  points_per_game_rank_type:        isNum,
  recoveries:                       isNum,
  red_cards:                        isNum,
  saves:                            isNum,
  saves_per_90:                     isNum,
  second_name:                      isStr,
  selected_by_percent:              isStr,
  starts:                           isNum,
  status:                           isStr,
  tackles:                          isNum,
  team:                             isNum,
  team_code:                        isNum,
  threat:                           isStr,
  threat_rank:                      isNum,
  total_points:                     isNum,
  transfers_in:                     isNum,
  transfers_in_event:               isNum,
  transfers_out:                    isNum,
  transfers_out_event:              isNum,
  value_form:                       isStr,
  value_season:                     isStr,
  web_name:                         isStr,
  yellow_cards:                     isNum,
};

const teamSchema: Record<string, (v: unknown) => boolean> = {
  code:                  isNum,
  id:                    isNum,
  name:                  isStr,
  short_name:            isStr,
  strength:              nullOr(isNum),
  strength_attack_away:  isNum,
  strength_attack_home:  isNum,
  strength_defence_away: isNum,
  strength_defence_home: isNum,
  strength_overall_away: isNum,
  strength_overall_home: isNum,
};

const elementTypeSchema: Record<string, (v: unknown) => boolean> = {
  id:                  isNum,
  plural_name:         isStr,
  plural_name_short:   isStr,
  singular_name:       isStr,
  singular_name_short: isStr,
};

const fixtureSchema: Record<string, (v: unknown) => boolean> = {
  event:               isNum,
  finished:            isBool,
  finished_provisional:isBool,
  id:                  isNum,
  kickoff_time:        nullOr(isStr),
  team_a:              isNum,
  team_a_score:        nullOr(isNum),
  team_h:              isNum,
  team_h_score:        nullOr(isNum),
  team_h_difficulty:   isNum,
  team_a_difficulty:   isNum,
};

// ---------------------------------------------------------------------------
// Helpers for test assertions with useful output
// ---------------------------------------------------------------------------

function assertAll<T extends Record<string, unknown>>(
  label: string,
  items: T[],
  guard: (x: unknown) => boolean,
  schema: Record<string, (v: unknown) => boolean>
): void {
  const failures: Array<{ index: number; id: unknown; diff: string }> = [];
  items.forEach((item, index) => {
    if (!guard(item)) {
      const diff = diffFields(item, schema, {});
      failures.push({
        index,
        id: item['id'] ?? item['code'] ?? index,
        diff: formatDiff(diff),
      });
    }
  });

  if (failures.length > 0) {
    const report = failures
      .map(
        (f) =>
          `[${label} index=${f.index} id=${f.id}]:\n${f.diff}`
      )
      .join('\n\n');
    // Use expect to produce a proper test failure with the diff embedded
    expect.fail(
      `${failures.length} of ${items.length} ${label} entries failed the guard:\n\n${report}`
    );
  }
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('Live-payload typeguard tests (bootstrap-static + fixtures snapshot)', () => {
  // ── bootstrap-static ──────────────────────────────────────────────────────

  describe('isAllData — top-level bootstrap-static shape', () => {
    it('accepts the full live bootstrap-static payload', () => {
      const failures = diffFields(
        bootstrapRaw as Record<string, unknown>,
        {
          events:        (v) => Array.isArray(v),
          teams:         (v) => Array.isArray(v),
          elements:      (v) => Array.isArray(v),
          element_types: (v) => Array.isArray(v),
        },
        {}
      );
      if (failures.length > 0) {
        expect.fail(
          `bootstrap-static top-level shape mismatch:\n${formatDiff(failures)}`
        );
      }
      // Now run the actual isAllData guard
      const result = isAllData(bootstrapRaw);
      if (!result) {
        // Drill down to which sub-array failed
        const subFailures: string[] = [];
        (bootstrapRaw.events as unknown[]).forEach((e, i) => {
          if (!isEvent(e)) {
            const d = diffFields(e as Record<string, unknown>, eventSchema, {});
            subFailures.push(`events[${i}]:\n${formatDiff(d)}`);
          }
        });
        (bootstrapRaw.teams as unknown[]).forEach((t, i) => {
          if (!isRawTeam(t)) {
            const d = diffFields(t as Record<string, unknown>, teamSchema, {});
            subFailures.push(`teams[${i}]:\n${formatDiff(d)}`);
          }
        });
        (bootstrapRaw.elements as unknown[]).forEach((p, i) => {
          if (!isRawPlayer(p)) {
            const d = diffFields(p as Record<string, unknown>, playerSchema, {});
            subFailures.push(`elements[${i}]:\n${formatDiff(d)}`);
          }
        });
        (bootstrapRaw.element_types as unknown[]).forEach((et, i) => {
          if (!isElementType(et)) {
            const d = diffFields(et as Record<string, unknown>, elementTypeSchema, {});
            subFailures.push(`element_types[${i}]:\n${formatDiff(d)}`);
          }
        });
        expect.fail(
          `isAllData returned false for live payload.\n\n${subFailures.join('\n\n') || '(no individual field issues detected — the object nesting may be wrong)'}`
        );
      }
      expect(result).toBe(true);
    });
  });

  describe('isEvent — all 38 gameweeks', () => {
    it('accepts every event including pre-season nulls', () => {
      assertAll('Event', bootstrapRaw.events as Record<string, unknown>[], isEvent, eventSchema);
    });

    it('pre-season events have null top_element / highest_score / most_captained', () => {
      const events: Event[] = bootstrapRaw.events as Event[];
      const preseason = events.filter((e) => !e.finished);
      expect(preseason.length).toBeGreaterThan(0); // snapshot must include unfinished events
      preseason.forEach((e) => {
        // These are ALL null pre-season — guard must accept them
        expect(e.top_element).toBe(null);
        expect(e.highest_score).toBe(null);
        expect(e.most_captained).toBe(null);
      });
    });
  });

  describe('isRawTeam — all 20 teams', () => {
    it('accepts every team', () => {
      assertAll('RawTeam', bootstrapRaw.teams as Record<string, unknown>[], isRawTeam, teamSchema);
    });
  });

  describe('isRawPlayer — sampled 30 elements with null variance', () => {
    it('accepts every sampled player', () => {
      assertAll(
        'RawPlayer',
        bootstrapRaw.elements as Record<string, unknown>[],
        isRawPlayer,
        playerSchema
      );
    });

    it('live snapshot includes players with null ep_this (pre-season)', () => {
      const nullEpThis = (bootstrapRaw.elements as Record<string, unknown>[]).filter(
        (e) => e['ep_this'] === null
      );
      expect(nullEpThis.length).toBeGreaterThan(0);
      nullEpThis.forEach((p) => {
        expect(isRawPlayer(p)).toBe(true);
      });
    });

    it('live snapshot includes players with null birth_date', () => {
      const nullBirth = (bootstrapRaw.elements as Record<string, unknown>[]).filter(
        (e) => e['birth_date'] === null
      );
      expect(nullBirth.length).toBeGreaterThan(0);
      nullBirth.forEach((p) => {
        expect(isRawPlayer(p)).toBe(true);
      });
    });
  });

  describe('isElementType — all 4 element types', () => {
    it('accepts every element_type', () => {
      assertAll(
        'ElementType',
        bootstrapRaw.element_types as Record<string, unknown>[],
        isElementType,
        elementTypeSchema
      );
    });
  });

  // ── fixtures ──────────────────────────────────────────────────────────────

  describe('isFixture — all 380 fixtures', () => {
    it('accepts every fixture including null scores and null kickoff_time', () => {
      assertAll(
        'Fixture',
        fixturesRaw as Record<string, unknown>[],
        isFixture,
        fixtureSchema
      );
    });

    it('live snapshot includes fixtures with null scores (unplayed)', () => {
      const nullScores = (fixturesRaw as Record<string, unknown>[]).filter(
        (f) => f['team_h_score'] === null || f['team_a_score'] === null
      );
      expect(nullScores.length).toBeGreaterThan(0);
      nullScores.forEach((f) => {
        expect(isFixture(f)).toBe(true);
      });
    });
  });

  // ── chip_plays / top_element_info embedded sanity ─────────────────────────

  describe('isChipPlay — chip_plays embedded in events', () => {
    it('accepts all chip_play entries across all events', () => {
      const events = bootstrapRaw.events as Array<{ chip_plays: unknown[] }>;
      const allChipPlays = events.flatMap((e) => e.chip_plays ?? []);
      // Pre-season chip_plays arrays may all be empty — that's fine; just
      // verify isChipPlay doesn't blow up on the ones that exist.
      allChipPlays.forEach((cp, i) => {
        expect(isChipPlay(cp)).toBe(true); // if any exist they must pass
        void i;
      });
    });
  });

  describe('isTopElementInfo — top_element_info embedded in events', () => {
    it('accepts all non-null top_element_info entries', () => {
      const events = bootstrapRaw.events as Array<{ top_element_info: unknown }>;
      const nonNull = events.filter((e) => e.top_element_info !== null);
      nonNull.forEach((e) => {
        expect(isTopElementInfo(e.top_element_info)).toBe(true);
      });
    });
  });
});

// ---------------------------------------------------------------------------
// Regression assertions (latent bugs)
// ---------------------------------------------------------------------------

describe('Regression: isEvent type annotation', () => {
  /**
   * BUG 1: `isEvent` return type must be `e is Event` where `Event` is
   * imported from the local types module, NOT the DOM global `Event`.
   *
   * We verify this by calling isEvent with a plain object and confirming the
   * TypeScript compiler accepted the import without DOM-Event confusion, and
   * that the narrowed value is assignable to our local Event type.
   */
  it('isEvent narrows to local Event type (not DOM Event)', () => {
    const raw: unknown = {
      average_entry_score: 0,
      chip_plays: [],
      finished: false,
      highest_score: null,
      id: 1,
      most_captained: null,
      name: 'Gameweek 1',
      top_element: null,
      top_element_info: null,
      transfers_made: 0,
    };

    if (isEvent(raw)) {
      // If `Event` were the DOM Event, `raw.id` would not exist on it and
      // TypeScript would error here.  This test passing at the type-check
      // level proves the import is the local type.
      const _id: number = raw.id;
      const _name: string = raw.name;
      // top_element must be number | null (not a literal type)
      const _top: number | null = raw.top_element;
      void _id; void _name; void _top;
    }
    expect(isEvent(raw)).toBe(true);
  });

  /**
   * BUG 2: `Event.top_element` must be typed `number | null`, not a literal.
   * We verify the type allows assignment of any number.
   */
  it('top_element accepts any number (not a literal)', () => {
    const withTopElement: unknown = {
      average_entry_score: 54,
      chip_plays: [],
      finished: true,
      highest_score: 127,
      id: 38,
      most_captained: 100,
      name: 'Gameweek 38',
      top_element: 999,
      top_element_info: { id: 999, points: 20 },
      transfers_made: 5000000,
    };
    expect(isEvent(withTopElement)).toBe(true);

    const withNullTopElement: unknown = { ...withTopElement as object, top_element: null };
    expect(isEvent(withNullTopElement)).toBe(true);
  });
});
