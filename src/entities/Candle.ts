import { BigInt, log } from '@graphprotocol/graph-ts';
import { DailyCandle, HourlyCandle, Price, PriceFeed, WeeklyCandle } from '../types/schema';
import { arrayUnique } from '../utils/arrayUnique';
import { day, dayAdjustment, hour, hourAdjustment, week, weekAdjustment } from '../utils/time';
import { calculateAverage, calculateMedian } from '../utils/math';
import { aggregateId, ensureAggregate, useAggregate } from './Aggregate';
import { Candle } from './Entity';
import { usePrice } from './Price';
import { usePriceFeed } from './PriceFeed';

export function candleId(priceFeedId: string, type: string, open: BigInt): string {
  return priceFeedId + '/' + type + '/' + open.toString();
}

export function updateHourlyCandle(price: Price): HourlyCandle {
  let interval = hour;
  let adjustment = hourAdjustment;
  return updateCandle('Hourly', interval, adjustment, price) as HourlyCandle;
}

export function updateDailyCandle(price: Price): DailyCandle {
  let interval = day;
  let adjustment = dayAdjustment;
  return updateCandle('Daily', interval, adjustment, price) as DailyCandle;
}

export function updateWeeklyCandle(price: Price): WeeklyCandle {
  let interval = week;
  let adjustment = weekAdjustment;
  return updateCandle('Weekly', interval, adjustment, price) as WeeklyCandle;
}

// export function createMissingHourlyCandles(feed: PriceFeed, latest: Candle): void {
//   let previous = feed.latestHourlyCandle;
//   let interval = hour;
//   createMissingCandles('Hourly', feed, latest, previous, interval);
// }

// export function createMissingDailyCandles(feed: PriceFeed, latest: Candle): void {
//   let previous = feed.latestDailyCandle;
//   let interval = day;
//   createMissingCandles('Daily', feed, latest, previous, interval);
// }

// export function createMissingWeeklyCandles(feed: PriceFeed, latest: Candle): void {
//   let previous = feed.latestDailyCandle;
//   let interval = week;
//   createMissingCandles('Weekly', feed, latest, previous, interval);
// }

// export function createMissingCandles(
//   type: string,
//   feed: PriceFeed,
//   latest: Candle,
//   previd: string,
//   interval: BigInt,
// ): void {
//   let previous = Candle.load(type, previd);
//   if (!previous) {
//     return;
//   }

//   let open = previous.openTimestamp;
//   let prices = previous.includedPrices;
//   let last = prices[prices.length - 1];
//   let price = Price.load(last) as Price;

//   while (price != null && open.plus(interval).lt(latest.openTimestamp)) {
//     open = open.plus(interval);

//     let id = candleId(feed.id, type, open);
//     createCandle(id, type, price, open, open.plus(interval));
//   }
// }

export function createCandle(id: string, type: string, price: Price, open: BigInt, close: BigInt): Candle {
  let aggregate = useAggregate(type, aggregateId(type, open));

  let candle = new Candle(id);
  candle.aggregate = aggregate.id;
  candle.openTimestamp = open;
  candle.closeTimestamp = close;
  candle.assetPair = price.assetPair;
  candle.priceFeed = usePriceFeed(price.priceFeed).id;
  candle.averagePrice = price.price;
  candle.medianPrice = price.price;
  candle.openPrice = price.price;
  candle.closePrice = price.price;
  candle.highPrice = price.price;
  candle.lowPrice = price.price;
  candle.includedPrices = [usePrice(price.id).id];
  candle.save(type);

  aggregate.candles = arrayUnique<string>(aggregate.candles.concat([candle.id]));
  aggregate.save(type);

  return candle;
}

export function updateCandle(type: string, interval: BigInt, adjustment: BigInt, price: Price): Candle {
  let excess = price.timestamp.minus(adjustment).mod(interval);
  let open = price.timestamp.minus(excess);
  let close = open.plus(interval);

  let id = candleId(price.priceFeed, type, open);
  let candle = Candle.load(type, id) as Candle;

  if (!candle) {
    candle = createCandle(id, type, price, open, close);
  } else {
    candle.includedPrices = candle.includedPrices.concat([price.id]);
    let prices = candle.includedPrices.map<BigInt>((id) => (Price.load(id) as Price).price);

    candle.averagePrice = calculateAverage(prices);
    candle.medianPrice = calculateMedian(prices);
    candle.closePrice = price.price;

    if (price.price.lt(candle.lowPrice)) {
      candle.lowPrice = price.price;
    }

    if (price.price.gt(candle.highPrice)) {
      candle.highPrice = price.price;
    }
    candle.save(type);
  }

  return candle;
}
