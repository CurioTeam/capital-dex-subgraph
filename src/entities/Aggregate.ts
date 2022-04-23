import { BigInt, ethereum } from '@graphprotocol/graph-ts';
import { Price } from '../types/schema';
import {
  day,
  getDailyOpenTime,
  getHourlyOpenTime,
  getPreviousStartTime,
  getWeeklyOpenTime,
  hour,
  weekAdjustment,
} from '../utils/time';
import { logCritical } from '../utils/logCritical';
import { candleId, createCandle } from './Candle';
import { Aggregate, Candle } from './Entity';
import { usePriceFeed } from './PriceFeed';
import { ensureAggregateState } from './AggregateState';
import { PriceFeedId } from '../constants/priceFeedId'

export function aggregateId(type: String, open: BigInt): string {
  return type + '/' + open.toString();
}

export function updateAggregates(event: ethereum.Event): void {
  let state = ensureAggregateState();

  let hourlyAggregate = ensureHourlyAggregate(event);
  let dailyAggregate = ensureDailyAggregate(event);
  let weeklyAggregate = ensureWeeklyAggregate(event);

  state.latestDailyAggregate = dailyAggregate.id;
  state.latestHourlyAggregate = hourlyAggregate.id;
  state.latestWeeklyAggregate = weeklyAggregate.id;
  state.save();
}

export function ensureHourlyAggregate(event: ethereum.Event): Aggregate {
  let state = ensureAggregateState();

  let type = 'Hourly';
  let open = getHourlyOpenTime(event.block.timestamp);
  let close = open.plus(hour);
  let aggregate = ensureAggregate(type, open, close, state.latestHourlyAggregate);

  state.latestHourlyAggregate = aggregate.id;
  state.save();

  return aggregate;
}

export function ensureDailyAggregate(event: ethereum.Event): Aggregate {
  let state = ensureAggregateState();

  let type = 'Daily';
  let open = getDailyOpenTime(event.block.timestamp);
  let close = open.plus(day);
  let aggregate = ensureAggregate(type, open, close, state.latestDailyAggregate);

  state.latestWeeklyAggregate = aggregate.id;
  state.save();

  return aggregate;
}

export function ensureWeeklyAggregate(event: ethereum.Event): Aggregate {
  let state = ensureAggregateState();

  let type = 'Weekly';
  let open = getWeeklyOpenTime(event.block.timestamp);
  let close = open.plus(weekAdjustment);
  let aggregate = ensureAggregate(type, open, close, state.latestWeeklyAggregate);

  state.latestDailyAggregate = aggregate.id;
  state.save();

  return aggregate;
}

export function ensureAggregate(type: string, open: BigInt, close: BigInt, previous: string): Aggregate {
  let id = aggregateId(type, open);
  let aggregate = Aggregate.load(type, id) as Aggregate;

  if (aggregate) {
    return aggregate;
  }

  aggregate = new Aggregate(id);
  aggregate.openTimestamp = open;
  aggregate.closeTimestamp = close;
  aggregate.candles = new Array<string>();
  aggregate.save(type);

  createMissingAggregates(type, open, close, previous);

  aggregate.candles = prePopulateCandles(type, open, close).map<string>((candle) => candle.id);
  aggregate.save(type);

  return aggregate;
}

export function createMissingAggregates(type: string, currentOpen: BigInt, currentClose: BigInt, prevId: string): void {
  let previous = Aggregate.load(type, prevId);
  if (!previous) {
    return;
  }

  let open = previous.openTimestamp;
  let interval = currentClose.minus(currentOpen);

  while (open.plus(interval).lt(currentOpen)) {
    open = open.plus(interval);
    ensureAggregate(type, open, open.plus(interval), prevId);
  }
}

export function useAggregate(type: string, id: string): Aggregate {
  let aggregate = Aggregate.load(type, id) as Aggregate;
  if (aggregate == null) {
    logCritical('{} Aggregate {} does not exist', [type, id]);
  }
  return aggregate;
}

export function prePopulateCandles(type: string, open: BigInt, close: BigInt): Candle[] {
  let previousAggregateId = aggregateId(type, getPreviousStartTime(open, type));
  let previousAggregate = Aggregate.load(type, previousAggregateId);

  if (previousAggregate == null) {
    return new Array<Candle>();
  }

  let newCandles: Candle[] = new Array<Candle>();
  let candles = previousAggregate.candles;
  for (let i: i32 = 0; i < candles.length; i++) {
    let previousCandle = Candle.load(type, candles[i]);
    if (previousCandle == null) {
      continue;
    }

    let prices = previousCandle.includedPrices;
    let last = prices[prices.length - 1];
    let price = Price.load(last) as Price;

    if (price == null) {
      continue;
    }

    let newCandleId = candleId(usePriceFeed().id, type, open);
    let newCandle = createCandle(newCandleId, type, price, open, close);
    newCandles = newCandles.concat([newCandle]);
  }

  return newCandles;
}
