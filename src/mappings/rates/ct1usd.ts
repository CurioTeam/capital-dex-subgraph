import { SpotterBundle, Token } from '../../types/schema'
import { Poke } from '../../types/Ct1UsdRate/Spotter'
import { BigInt, Bytes } from '@graphprotocol/graph-ts'
import { bigDecimalExp18 } from '../helpers'
import { calculateWCT1PriceInEth, WCT1_ADDRESS } from '../pricing'

export const CT1Ilk = '0x4354312d41000000000000000000000000000000000000000000000000000000'

export function updateWCT1Price(): void {
  let wct1 = Token.load(WCT1_ADDRESS)
  if (wct1 !== null) {
    wct1.derivedETH = calculateWCT1PriceInEth()
    wct1.save()
  }
}

export function updateSpotterBundle(event: Poke): void {
  let bundle = SpotterBundle.load(event.params.ilk.toHex())
  if (bundle == null) {
    bundle = new SpotterBundle(event.params.ilk.toHex())
  }
  bundle.price = BigInt.fromUnsignedBytes(event.params.val.reverse() as Bytes).toBigDecimal().div(bigDecimalExp18())
  bundle.spot = event.params.spot
  bundle.save()
}

export function handlePoke(event: Poke): void {
  updateSpotterBundle(event);
  updateWCT1Price();
}