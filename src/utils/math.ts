import { BigInt } from '@graphprotocol/graph-ts';

export function calculateAverage(prices: BigInt[]): BigInt {
  let sum = BigInt.fromI32(0);
  for (let i = 0; i < prices.length; i++) {
    sum = sum.plus(prices[i]);
  }

  return sum.div(BigInt.fromI32(prices.length));
}

export function calculateMedian(prices: BigInt[]): BigInt {
  let sorted = prices.sort((a, b) => {
    return a.equals(b) ? 0 : a.gt(b) ? 1 : -1;
  });

  let mid = Math.ceil(sorted.length / 2) as i32;
  if (sorted.length % 2 == 0) {
    return sorted[mid].plus(sorted[mid - 1]).div(BigInt.fromI32(2));
  }

  return sorted[mid - 1];
}
