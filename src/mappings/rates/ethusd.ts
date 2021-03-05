import { AnswerUpdated } from '../../types/EthUsdRate/AggregatorInterface';
import { updateAggregates } from '../../entities/Aggregate';
import { createPrice } from '../../entities/Price';
import { ensurePriceFeed } from '../../entities/PriceFeed';

export function handleAnswerUpdatedForPair(pair: string, event: AnswerUpdated): void {
  updateAggregates(event);
  createPrice(event, ensurePriceFeed(event, pair));
}

export function handleAnswerUpdated(event: AnswerUpdated): void {
  handleAnswerUpdatedForPair('ethusd', event);
}