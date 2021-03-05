import { ethereum } from '@graphprotocol/graph-ts';
import { PriceFeed } from '../types/schema';
import { logCritical } from '../utils/logCritical';

export function ensurePriceFeed(event: ethereum.Event, pair: string): PriceFeed {
  let id = event.address.toHex();
  let feed = PriceFeed.load(id) as PriceFeed;
  if (feed) {
    return feed;
  }

  feed = new PriceFeed(id);
  feed.assetPair = pair;
  feed.latestPrice = '';
  feed.latestHourlyCandle = '';
  feed.latestDailyCandle = '';
  feed.latestWeeklyCandle = '';
  feed.save();

  return feed;
}

export function usePriceFeed(id: string): PriceFeed {
  let priceFeed = PriceFeed.load(id) as PriceFeed;
  if (priceFeed == null) {
    logCritical('Failed to load price feed {}.', [id]);
  }
  return priceFeed;
}
