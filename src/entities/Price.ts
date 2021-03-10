import { BigDecimal } from '@graphprotocol/graph-ts';
import { AnswerUpdated } from '../types/EthUsdRate/AggregatorInterface';
import { Bundle, Price, PriceFeed } from '../types/schema'
import { logCritical } from '../utils/logCritical';
import { updateDailyCandle, updateHourlyCandle, updateWeeklyCandle } from './Candle';

export function priceId(event: AnswerUpdated): string {
  let address = event.address.toHex();
  let block = event.block.number.toString();
  let log = event.logIndex.toString();
  return address + '/' + block + '/' + log;
}

export function createPrice(event: AnswerUpdated, feed: PriceFeed): Price {
  let id = priceId(event);
  let price = Price.load(id) as Price;
  if (price != null) {
    return price;
  }

  let previous: Price | null = feed.latestPrice != '' ? usePrice(feed.latestPrice) : null;
  let deviation: BigDecimal | null = null;

  if (previous != null) {
    let difference = event.params.current.minus(previous.price).toBigDecimal();
    deviation = difference.div(previous.price.toBigDecimal()).times(BigDecimal.fromString('100'));
  }

  price = new Price(id);
  price.blockNumber = event.block.number;
  price.blockHash = event.block.hash.toHex();
  price.transactionHash = event.transaction.hash.toHex();
  price.assetPair = feed.assetPair;
  price.priceFeed = feed.id;
  price.timestamp = event.block.timestamp;
  price.price = event.params.current;
  price.priceDeviation = deviation;
  price.priceDeviationAbsolute = deviation != null && deviation.lt(BigDecimal.fromString('0')) ? deviation.neg() : deviation;
  price.previousPrice = previous != null ? previous.id : null;
  price.timeSincePreviousPrice = previous != null ? price.timestamp.minus(previous.timestamp) : null;
  price.save();

  let hourly = updateHourlyCandle(price);
  let daily = updateDailyCandle(price);
  let weekly = updateWeeklyCandle(price);

  feed.latestPrice = price.id;
  feed.latestHourlyCandle = hourly.id;
  feed.latestDailyCandle = daily.id;
  feed.latestWeeklyCandle = weekly.id;
  feed.save();

  let bundle = Bundle.load('1');
  let decimalPrice = new BigDecimal(event.params.current);
  let priceDivider = BigDecimal.fromString('100000000');
  let roundedPrice = decimalPrice.div(priceDivider);
  bundle.ethPrice = roundedPrice;
  bundle.save();

  return price;
}

export function usePrice(id: string): Price {
  let price = Price.load(id) as Price;
  if (price == null) {
    logCritical('price {} does not exist', [id]);
  }
  return price;
}
