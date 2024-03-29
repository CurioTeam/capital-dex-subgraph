/* eslint-disable prefer-const */
import { Bundle, Factory, Pair, Price, PriceFeed, SpotterBundle, Token } from '../types/schema'
import { BigDecimal, log } from '@graphprotocol/graph-ts'
import { CAPITAL_DEX_FACTORY_ADDRESS, ONE_BD, ZERO_BD } from './helpers'
import { PriceFeedId } from '../constants/priceFeedId'
import { syncEthPricesForPair } from './core'
import { CT1Ilk } from './rates/ct1usd'

const WETH_ADDRESS = '0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2'
const DAI_ADDRESS = '0x6b175474e89094c44da98b954eedeac495271d0f'
const CSC_ADDRESS = '0xfdcdfa378818ac358739621ddfa8582e6ac1adcb'
const XCHF_ADDRESS = '0xb4272071ecadd69d933adcd19ca99fe80664fc08'
export const WCT1_ADDRESS = '0x46683747b55c4a0ff783b1a502ce682eb819eb75'

export function getEthPriceInUSD(): BigDecimal {
  let ethPriceFeed = PriceFeed.load(PriceFeedId.ETH_USD as string)

  if (ethPriceFeed) {
    log.debug('Getting ETH price feed with id: {}', [ethPriceFeed.id])

    let latestPriceId = ethPriceFeed.latestPrice
    log.debug('Getting the latest price id: {}', [latestPriceId])

    if (latestPriceId != '') {
      let latestPrice = Price.load(latestPriceId)

      if (latestPrice) {
        let latestPriceValue = new BigDecimal(latestPrice.price)
        log.debug('Getting the latest ETH price: {}', [latestPriceValue.toString()])

        let priceDivider = BigDecimal.fromString('100000000')
        let roundedPrice = latestPriceValue.div(priceDivider)
        log.debug('Getting the rounded price: {}', [roundedPrice.toString()])

        return roundedPrice
      }
    }
  }

  return ZERO_BD
}

export function calculateWCT1PriceInEth(): BigDecimal {
  let bundle = Bundle.load('1')
  let spotterBundle = SpotterBundle.load(CT1Ilk)
  if (bundle !== null && spotterBundle !== null) {
    let ethPrice = bundle.ethPrice
    if (ethPrice.notEqual(ZERO_BD)) {
      return spotterBundle.price.div(ethPrice)
    }
  }

  return ZERO_BD
}

/**
* Search through graph to find derived Eth per token.
**/
export function findEthPerToken(token: Token, pair: Pair): BigDecimal {
  log.info('[ETH per token]: Token: {}', [token.id])
  log.info('[ETH per token]: Pair: {}', [pair.id])

  if (token.id == WETH_ADDRESS) {
    log.info('[ETH per token]: This is WETH token', [])
    return ONE_BD
  }

  if (token.id == DAI_ADDRESS || token.id == CSC_ADDRESS) {
    log.info('[ETH per token]: This is a stablecoin', [])

    let bundle = Bundle.load('1')

    if (bundle !== null) {
      let decimalOne = BigDecimal.fromString('1')
      let ethPrice = bundle.ethPrice

      if (ethPrice.notEqual(ZERO_BD)) {
        return decimalOne.div(ethPrice)
      }
    }

    return ZERO_BD
  }

  if (token.id == XCHF_ADDRESS) {
    log.info('[ETH per token]: This is XCHF token', [])

    let bundle = Bundle.load('1')

    if (bundle !== null) {
      let chfPrice = bundle.chfPrice
      let ethPrice = bundle.ethPrice

      if (ethPrice.notEqual(ZERO_BD)) {
        return chfPrice.div(ethPrice)
      }
    }

    return ZERO_BD
  }

  if (token.id == WCT1_ADDRESS) {
    log.info('[ETH per token]: This is wCT1 token', [])

    return calculateWCT1PriceInEth()
  }

  if (token.id == pair.token0) {
    log.info('[ETH per token]: This is token 0', [])

    let token1 = Token.load(pair.token1)
    return pair.token1Price.times(token1.derivedETH as BigDecimal) // return token1 per our token * Eth per token 1
  }

  if (token.id == pair.token1) {
    log.info('[ETH per token]: This is token 1', [])

    let token0 = Token.load(pair.token0)
    return pair.token0Price.times(token0.derivedETH as BigDecimal) // return token0 per our token * ETH per token 0
  }

  log.info('[ETH per token]: Returning zero for token: {}', [token.id])

  return ZERO_BD // nothing was found return 0
}

/**
 * Accepts tokens and amounts, return tracked amount based on token whitelist
 * If one token on whitelist, return amount in that token converted to USD.
 * If both are, return average of two amounts
 * If neither is, return 0
 */
export function getTrackedVolumeUSD(
  tokenAmount0: BigDecimal,
  token0: Token,
  tokenAmount1: BigDecimal,
  token1: Token
): BigDecimal {
  let bundle = Bundle.load('1')
  let price0 = token0.derivedETH.times(bundle.ethPrice)
  let price1 = token1.derivedETH.times(bundle.ethPrice)

  return tokenAmount0
    .times(price0)
    .plus(tokenAmount1.times(price1))
    .div(BigDecimal.fromString('2'))
}

/**
 * Accepts tokens and amounts, return tracked amount based on token whitelist
 * If one token on whitelist, return amount in that token converted to USD * 2.
 * If both are, return sum of two amounts
 * If neither is, return 0
 */
export function getTrackedLiquidityUSD(
  tokenAmount0: BigDecimal,
  token0: Token,
  tokenAmount1: BigDecimal,
  token1: Token
): BigDecimal {
  let bundle = Bundle.load('1')
  let price0 = token0.derivedETH.times(bundle.ethPrice)
  let price1 = token1.derivedETH.times(bundle.ethPrice)

  log.info('[Tracked liquidity USD]: Token prices: {}, {}', [price0.toString(), price1.toString()])

  return tokenAmount0.times(price0).plus(tokenAmount1.times(price1))
}

export function updatePairPrices(): void {
  let factory = Factory.load(CAPITAL_DEX_FACTORY_ADDRESS)
  if (factory) {
    let pairs = factory.pairs;
    for (let i = 0; i < pairs.length; i++) {
      let pair = Pair.load(pairs[i])
      if (pair) {
        syncEthPricesForPair(pair as Pair)
      }
    }
  }
}

