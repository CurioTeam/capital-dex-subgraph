import { AggregateState } from '../types/schema';

export function ensureAggregateState(): AggregateState {
  let id = '0x';
  let state = AggregateState.load(id) as AggregateState;
  if (state) {
    return state;
  }

  state = new AggregateState(id);
  state.latestHourlyAggregate = '';
  state.latestDailyAggregate = '';
  state.latestWeeklyAggregate = '';
  state.save();

  return state;
}
