import { AnswerUpdated } from '../../types/EthUsdRate/AggregatorInterface';
import { updateAggregates } from '../../entities/Aggregate';
import { createPrice } from '../../entities/Price';
import { ensurePriceFeed } from '../../entities/PriceFeed';
import { getEthPriceInUSD, syncPairsUpdatingWithEthPrice } from '../pricing'
import { Bundle } from '../../types/schema'

export function updateBundle(): void {
  let bundle = Bundle.load('1')
  bundle.ethPrice = getEthPriceInUSD()
  bundle.save()
}

export function handleAnswerUpdatedForPair(pair: string, event: AnswerUpdated): void {
  updateAggregates(event);
  createPrice(event, ensurePriceFeed(event, pair));
  updateBundle();
  syncPairsUpdatingWithEthPrice();
}

export function handleAnswerUpdated(event: AnswerUpdated): void {
  handleAnswerUpdatedForPair('ethusd', event);
}