/* eslint-disable prefer-const */
import { Bundle, Pair, Price, PriceFeed, Token } from '../types/schema'
import { Address, BigDecimal, BigInt, log } from '@graphprotocol/graph-ts/index'
import { ADDRESS_ZERO, ONE_BD, ZERO_BD } from './helpers'
import { Factory as FactoryContract } from '../types/templates/Pair/Factory'

export const ETH_PRICE_AGGREGATOR_ADDRESS = '0x00c7a37b03690fb9f41b5c5af8131735c7275446'

const WETH_ADDRESSES: string[] = [
  '0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2',
  '0xd0a1e359811322d97991e03f863a0c30c2cf029c'
]

export function getEthPriceInUSD(): BigDecimal {
  let ethPriceFeed = PriceFeed.load(ETH_PRICE_AGGREGATOR_ADDRESS)

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

// token where amounts should contribute to tracked volume and liquidity
let WHITELIST: string[] = [
  '0xF56b164efd3CFc02BA739b719B6526A6FA1cA32a', // CGT
  '0x13339fD07934CD674269726EdF3B5ccEE9DD93de', // CUR
  // '0x6b175474e89094c44da98b954eedeac495271d0f', // DAI
  '0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2', // WETH
  '0x2f4d4cFAb714e4573189B300293944673Fe0efF7', // CGT
  '0x558FC7FA5471Ff77c56b9cB37207d099EAcE8379', // CSC
  '0x42Bbfc77Ee4Ed0efC608634859a672D0cf49e1b4', // CUR
  // '0x330294de10bAd15f373BA7429Ab9685eDe43c13f', // DAI
  '0xd0A1E359811322d97991E03f863a0C30C2cF029C', // WETH
  '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48', // USDC
  '0xdac17f958d2ee523a2206206994597c13d831ec7', // USDT
]

// minimum liquidity required to count towards tracked volume for pairs with small # of Lps
let MINIMUM_USD_THRESHOLD_NEW_PAIRS = BigDecimal.fromString('400000')

// minimum liquidity for price to get tracked
let MINIMUM_LIQUIDITY_THRESHOLD_ETH = BigDecimal.fromString('2')

/**
 * Search through graph to find derived Eth per token.
 * @todo update to be derived ETH (add stablecoin estimates)
 **/
export function findEthPerToken(token: Token, factoryAddress: string): BigDecimal {
  if (WETH_ADDRESSES.includes(token.id)) {
    return ONE_BD
  }

  // loop through whitelist and check if paired with any
  for (let i = 0; i < WHITELIST.length; ++i) {
    let factoryContract = FactoryContract.bind(Address.fromString(factoryAddress))
    let pairAddress = factoryContract.getPair(Address.fromString(token.id), Address.fromString(WHITELIST[i]))
    if (pairAddress.toHexString() != ADDRESS_ZERO) {
      let pair = Pair.load(pairAddress.toHexString())
      if (pair.token0 == token.id && pair.reserveETH.gt(MINIMUM_LIQUIDITY_THRESHOLD_ETH)) {
        let token1 = Token.load(pair.token1)
        return pair.token1Price.times(token1.derivedETH as BigDecimal) // return token1 per our token * Eth per token 1
      }
      if (pair.token1 == token.id && pair.reserveETH.gt(MINIMUM_LIQUIDITY_THRESHOLD_ETH)) {
        let token0 = Token.load(pair.token0)
        return pair.token0Price.times(token0.derivedETH as BigDecimal) // return token0 per our token * ETH per token 0
      }
    }
  }
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

  return tokenAmount0.times(price0).plus(tokenAmount1.times(price1))
}
