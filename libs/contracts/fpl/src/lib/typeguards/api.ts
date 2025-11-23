import {
  isArrayOfType,
  isBoolean,
  isNumber,
  isObject,
  isString,
} from '@fpl/utils';
import {
  AllData,
  ChipPlay,
  ElementType,
  Fixture,
  RawPlayer,
  RawTeam,
  TopElementInfo,
} from '../types';

/**
 * Check if d is an AllData.
 *
 * @param d - the value to check.
 *
 * @returns true if d is an AllData, false otherwise.
 */
export const isAllData = (d: unknown): d is AllData =>
  isObject(d) &&
  isArrayOfType(d.events, isEvent) &&
  isArrayOfType(d.teams, isRawTeam) &&
  isArrayOfType(d.elements, isRawPlayer) &&
  isArrayOfType(d.element_types, isElementType);

/**
 * Check if p is a RawPlayer.
 *
 * @param p - the value to check.
 *
 * @returns true if p is a RawPlayer, false otherwise.
 */
export const isRawPlayer = (p: unknown): p is RawPlayer =>
  isObject(p) &&
  isNumber(p.assists) &&
  isString(p.birth_date) &&
  isNumber(p.bonus) &&
  isNumber(p.bps) &&
  isBoolean(p.can_select) &&
  isNumber(p.clean_sheets) &&
  isNumber(p.code) &&
  isString(p.creativity) &&
  isNumber(p.creativity_rank) &&
  isNumber(p.creativity_rank_type) &&
  isNumber(p.defensive_contribution) &&
  isNumber(p.defensive_contribution_per_90) &&
  isNumber(p.dreamteam_count) &&
  isNumber(p.element_type) &&
  isString(p.ep_next) &&
  isString(p.ep_this) &&
  isNumber(p.event_points) &&
  isString(p.expected_assists) &&
  isNumber(p.expected_assists_per_90) &&
  isString(p.expected_goal_involvements) &&
  isNumber(p.expected_goal_involvements_per_90) &&
  isString(p.expected_goals) &&
  isString(p.expected_goals_conceded) &&
  isNumber(p.expected_goals_conceded_per_90) &&
  isNumber(p.expected_goals_per_90) &&
  isString(p.first_name) &&
  isString(p.form) &&
  isNumber(p.goals_conceded) &&
  isNumber(p.goals_conceded_per_90) &&
  isNumber(p.goals_scored) &&
  isString(p.ict_index) &&
  isNumber(p.ict_index_rank) &&
  isNumber(p.ict_index_rank_type) &&
  isNumber(p.id) &&
  isBoolean(p.in_dreamteam) &&
  isString(p.influence) &&
  isNumber(p.influence_rank) &&
  isNumber(p.influence_rank_type) &&
  isNumber(p.minutes) &&
  isNumber(p.now_cost) &&
  isNumber(p.now_cost_rank) &&
  isNumber(p.own_goals) &&
  isNumber(p.penalties_missed) &&
  isNumber(p.penalties_saved) &&
  isString(p.points_per_game) &&
  isNumber(p.points_per_game_rank) &&
  isNumber(p.points_per_game_rank_type) &&
  isNumber(p.recoveries) &&
  isNumber(p.red_cards) &&
  isNumber(p.saves) &&
  isNumber(p.saves_per_90) &&
  isString(p.second_name) &&
  isString(p.selected_by_percent) &&
  isNumber(p.starts) &&
  isString(p.status) &&
  isNumber(p.tackles) &&
  isNumber(p.team) &&
  isNumber(p.team_code) &&
  isString(p.threat) &&
  isNumber(p.threat_rank) &&
  isNumber(p.total_points) &&
  isNumber(p.transfers_in) &&
  isNumber(p.transfers_in_event) &&
  isNumber(p.transfers_out) &&
  isNumber(p.transfers_out_event) &&
  isString(p.value_form) &&
  isString(p.value_season) &&
  isString(p.web_name) &&
  isNumber(p.yellow_cards);

/**
 * Check if t is a RawTeam.
 *
 * @param t - the value to check.
 *
 * @returns true if t is a RawTeam, false otherwise.
 */
export const isRawTeam = (t: unknown): t is RawTeam =>
  isObject(t) &&
  isNumber(t.code) &&
  isNumber(t.id) &&
  isString(t.name) &&
  isString(t.short_name) &&
  isNumber(t.strength) &&
  isNumber(t.strength_attack_away) &&
  isNumber(t.strength_attack_home) &&
  isNumber(t.strength_defence_away) &&
  isNumber(t.strength_defence_home) &&
  isNumber(t.strength_overall_away) &&
  isNumber(t.strength_overall_home);

/**
 * Check if c is a ChipPlay.
 *
 * @param c - the value to check.
 *
 * @returns true if c is a ChipPlay, false otherwise.
 */
export const isChipPlay = (c: unknown): c is ChipPlay =>
  isObject(c) && isString(c.chip_name) && isNumber(c.num_played);

/**
 * Check if t is a TopElementInfo.
 *
 * @param t - the value to check.
 *
 * @returns true if t is a TopElementInfo, false otherwise.
 */
export const isTopElementInfo = (t: unknown): t is TopElementInfo =>
  isObject(t) && isNumber(t.id) && isNumber(t.points);

/**
 * Check if e is an Event.
 *
 * @param e - the value to check.
 *
 * @returns true if e is an Event, false otherwise.
 */
export const isEvent = (e: unknown): e is Event =>
  isObject(e) &&
  isNumber(e.average_entry_score) &&
  isArrayOfType(e.chip_plays, isChipPlay) &&
  isBoolean(e.finished) &&
  isNumber(e.highest_score) &&
  isNumber(e.id) &&
  isNumber(e.most_captained) &&
  isString(e.name) &&
  isNumber(e.top_element) &&
  isTopElementInfo(e.top_element_info) &&
  isNumber(e.transfers_made);

/**
 * Check if t is an ElementType.
 *
 * @param t - the value to check.
 *
 * @returns true if t is an ElementType, false otherwise.
 */
export const isElementType = (t: unknown): t is ElementType =>
  isObject(t) &&
  isNumber(t.id) &&
  isString(t.plural_name) &&
  isString(t.plural_name_short) &&
  isString(t.singular_name) &&
  isString(t.singular_name_short);

/**
 * Check if f is a Fixture.
 *
 * @param f - the value to check.
 *
 * @returns true if f is a Fixture, false otherwise.
 */
export const isFixture = (f: unknown): f is Fixture =>
  isObject(f) &&
  isNumber(f.event) &&
  isNumber(f.id) &&
  isString(f.kickoff_time) &&
  isNumber(f.team_a) &&
  isNumber(f.team_a_score) &&
  isNumber(f.team_h) &&
  isNumber(f.team_h_score) &&
  isNumber(f.team_h_difficulty) &&
  isNumber(f.team_a_difficulty);
