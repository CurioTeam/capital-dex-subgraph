import { ethereum } from '@graphprotocol/graph-ts';
import { PriceFeed } from '../types/schema';
import { logCritical } from '../utils/logCritical';
import { PriceFeedId } from '../constants/priceFeedId'

export function ensurePriceFeed(event: ethereum.Event, pair: string): PriceFeed {
  let feed = PriceFeed.load(PriceFeedId.ETH_USD as string) as PriceFeed;
  if (feed) {
    return feed;
  }

  feed = new PriceFeed(PriceFeedId.ETH_USD as string);
  feed.assetPair = pair;
  feed.latestPrice = '';
  feed.latestHourlyCandle = '';
  feed.latestDailyCandle = '';
  feed.latestWeeklyCandle = '';
  feed.save();

  return feed;
}

export function usePriceFeed(): PriceFeed {
  let priceFeed = PriceFeed.load(PriceFeedId.ETH_USD as string) as PriceFeed;
  if (priceFeed == null) {
    logCritical('Failed to load price feed {}.', [PriceFeedId.ETH_USD as string]);
  }
  return priceFeed;
}
