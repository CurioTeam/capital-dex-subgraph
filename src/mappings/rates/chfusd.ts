import { AnswerUpdated } from '../../types/EthUsdRate/AggregatorInterface';
import { updatePairPrices } from '../pricing'
import { Bundle } from '../../types/schema'
import { BigDecimal } from '@graphprotocol/graph-ts'

export function updateBundle(event: AnswerUpdated): void {
  let decimalPrice = new BigDecimal(event.params.current);
  let priceDivider = BigDecimal.fromString('100000000');
  let roundedPrice = decimalPrice.div(priceDivider);

  let bundle = Bundle.load('1');
  bundle.chfPrice = roundedPrice;
  bundle.save()
}

export function handleAnswerUpdated(event: AnswerUpdated): void {
  updateBundle(event);
  updatePairPrices();
}