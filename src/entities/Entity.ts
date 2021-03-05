import { BigInt, Entity, Value, store } from '@graphprotocol/graph-ts';

export class Aggregate extends Entity {
  constructor(id: string) {
    super();
    this.set('id', Value.fromString(id));
  }

  save(type: string): void {
    store.set(type + 'Aggregate', this.get('id').toString(), this);
  }

  static load(type: string, id: string): Aggregate | null {
    return store.get(type + 'Aggregate', id) as Aggregate | null;
  }

  get id(): string {
    let value = this.get('id');
    return value.toString();
  }

  set id(value: string) {
    this.set('id', Value.fromString(value));
  }

  get openTimestamp(): BigInt {
    let value = this.get('openTimestamp');
    return value.toBigInt();
  }

  set openTimestamp(value: BigInt) {
    this.set('openTimestamp', Value.fromBigInt(value));
  }

  get closeTimestamp(): BigInt {
    let value = this.get('closeTimestamp');
    return value.toBigInt();
  }

  set closeTimestamp(value: BigInt) {
    this.set('closeTimestamp', Value.fromBigInt(value));
  }

  get candles(): Array<string> {
    let value = this.get('candles');
    return value.toStringArray();
  }

  set candles(value: Array<string>) {
    this.set('candles', Value.fromStringArray(value));
  }
}

export class Candle extends Entity {
  constructor(id: string) {
    super();
    this.set('id', Value.fromString(id));
  }

  save(type: string): void {
    store.set(type + 'Candle', this.get('id').toString(), this);
  }

  static load(type: string, id: string): Candle | null {
    return store.get(type + 'Candle', id) as Candle | null;
  }

  get id(): string {
    let value = this.get('id');
    return value.toString();
  }

  set id(value: string) {
    this.set('id', Value.fromString(value));
  }

  get aggregate(): string {
    let value = this.get('aggregate');
    return value.toString();
  }

  set aggregate(value: string) {
    this.set('aggregate', Value.fromString(value));
  }

  get priceFeed(): string {
    let value = this.get('priceFeed');
    return value.toString();
  }

  set priceFeed(value: string) {
    this.set('priceFeed', Value.fromString(value));
  }

  get assetPair(): string {
    let value = this.get('assetPair');
    return value.toString();
  }

  set assetPair(value: string) {
    this.set('assetPair', Value.fromString(value));
  }

  get openTimestamp(): BigInt {
    let value = this.get('openTimestamp');
    return value.toBigInt();
  }

  set openTimestamp(value: BigInt) {
    this.set('openTimestamp', Value.fromBigInt(value));
  }

  get closeTimestamp(): BigInt {
    let value = this.get('closeTimestamp');
    return value.toBigInt();
  }

  set closeTimestamp(value: BigInt) {
    this.set('closeTimestamp', Value.fromBigInt(value));
  }

  get averagePrice(): BigInt {
    let value = this.get('averagePrice');
    return value.toBigInt();
  }

  set averagePrice(value: BigInt) {
    this.set('averagePrice', Value.fromBigInt(value));
  }

  get medianPrice(): BigInt {
    let value = this.get('medianPrice');
    return value.toBigInt();
  }

  set medianPrice(value: BigInt) {
    this.set('medianPrice', Value.fromBigInt(value));
  }

  get openPrice(): BigInt {
    let value = this.get('openPrice');
    return value.toBigInt();
  }

  set openPrice(value: BigInt) {
    this.set('openPrice', Value.fromBigInt(value));
  }

  get closePrice(): BigInt {
    let value = this.get('closePrice');
    return value.toBigInt();
  }

  set closePrice(value: BigInt) {
    this.set('closePrice', Value.fromBigInt(value));
  }

  get lowPrice(): BigInt {
    let value = this.get('lowPrice');
    return value.toBigInt();
  }

  set lowPrice(value: BigInt) {
    this.set('lowPrice', Value.fromBigInt(value));
  }

  get highPrice(): BigInt {
    let value = this.get('highPrice');
    return value.toBigInt();
  }

  set highPrice(value: BigInt) {
    this.set('highPrice', Value.fromBigInt(value));
  }

  get includedPrices(): Array<string> {
    let value = this.get('includedPrices');
    return value.toStringArray();
  }

  set includedPrices(value: Array<string>) {
    this.set('includedPrices', Value.fromStringArray(value));
  }
}
