import { CoinMetadata,SuiClient } from '@mysten/sui.js/client';
import {
  TransactionBlock,
  TransactionObjectArgument,
  TransactionResult,
} from '@mysten/sui.js/transactions';
import { normalizeStructTag,normalizeSuiObjectId } from '@mysten/sui.js/utils';
import invariant from 'tiny-invariant';

import {
  BurnArgs,
  CoinConstructorArgs,
  DestroyZero,
  DivideIntoN,
  GetCoinArgs,
  GetCoinOfValueArgs,
  GetCoinsArgs,
  GetSuiCoinArgs,
  JoinArgs,
  MintArgs,
  SplitArgs,
  TotalSupplyArgs,
  TreasuryIntoSupplyArgs,
  TxbConstructorArgs,
  UpdateMetadataArgs,
  ValueArgs,
  ZeroArgs,
} from './coin.types';
import {
  devInspectAndGetResults,
  devInspectAndGetReturnValues,
  getAllCoins,
  getCoinOfValue,
  getCoins,
} from './coin.utils.ts';

const cache = new Map<string, CoinMetadata | null>();

class Txb {
  #client: SuiClient;
  #txb: TransactionBlock;
  #result: TransactionResult | undefined;

  constructor({ client, txb, result }: TxbConstructorArgs) {
    this.#client = client;
    this.#txb = txb;
    this.#result = result;
  }

  txb() {
    return {
      txb: this.#txb,
      result: this.#result,
    };
  }

  async inspect() {
    return devInspectAndGetReturnValues(this.#client, this.#txb);
  }

  async inspectResults() {
    return devInspectAndGetResults(this.#client, this.#txb);
  }
}

export class Coin {
  #client: SuiClient;

  constructor({ client }: CoinConstructorArgs) {
    this.#client = client;
  }

  totalSupply({
    txb = new TransactionBlock(),
    treasury,
    coinType,
  }: TotalSupplyArgs): Txb {
    const result = txb.moveCall({
      target: '0x2::coin::total_supply',
      typeArguments: [normalizeStructTag(coinType)],
      arguments: [this.#object(txb, treasury)],
    });

    return this.#txb(txb, result);
  }

  treasuryIntoSupply({
    txb = new TransactionBlock(),
    treasury,
    coinType,
  }: TreasuryIntoSupplyArgs): Txb {
    const result = txb.moveCall({
      target: '0x2::coin::treasury_into_supply',
      typeArguments: [normalizeStructTag(coinType)],
      arguments: [this.#object(txb, treasury)],
    });

    return this.#txb(txb, result);
  }

  value({ txb = new TransactionBlock(), coin, coinType }: ValueArgs) {
    const result = txb.moveCall({
      target: '0x2::coin::value',
      typeArguments: [normalizeStructTag(coinType)],
      arguments: [this.#object(txb, coin)],
    });

    return this.#txb(txb, result);
  }

  join({ txb = new TransactionBlock(), coinA, coinB, coinType }: JoinArgs) {
    txb.moveCall({
      target: '0x2::coin::join',
      typeArguments: [normalizeStructTag(coinType)],
      arguments: [this.#object(txb, coinA), this.#object(txb, coinB)],
    });

    return this.#txb(txb);
  }

  split({ txb = new TransactionBlock(), coin, amount, coinType }: SplitArgs) {
    const result = txb.moveCall({
      target: '0x2::coin::split',
      typeArguments: [normalizeStructTag(coinType)],
      arguments: [this.#object(txb, coin), txb.pure.u64(amount)],
    });

    return this.#txb(txb, result);
  }

  divideIntoN({
    txb = new TransactionBlock(),
    coin,
    amount,
    coinType,
  }: DivideIntoN) {
    const result = txb.moveCall({
      target: '0x2::coin::divide_into_n',
      typeArguments: [normalizeStructTag(coinType)],
      arguments: [this.#object(txb, coin), txb.pure.u64(amount)],
    });

    return this.#txb(txb, result);
  }

  zero({ txb = new TransactionBlock(), coinType }: ZeroArgs) {
    const result = txb.moveCall({
      target: '0x2::coin::zero',
      typeArguments: [normalizeStructTag(coinType)],
    });

    return this.#txb(txb, result);
  }

  destroyZero({ txb = new TransactionBlock(), coin, coinType }: DestroyZero) {
    txb.moveCall({
      target: '0x2::coin::destroy_zero',
      typeArguments: [normalizeStructTag(coinType)],
      arguments: [this.#object(txb, coin)],
    });

    return this.#txb(txb);
  }

  mint({ txb = new TransactionBlock(), treasury, coinType, amount }: MintArgs) {
    const result = txb.moveCall({
      target: '0x2::coin::mint',
      typeArguments: [normalizeStructTag(coinType)],
      arguments: [this.#object(txb, treasury), txb.pure.u64(amount)],
    });

    return this.#txb(txb, result);
  }

  burn({ txb = new TransactionBlock(), treasury, coinType, coin }: BurnArgs) {
    const result = txb.moveCall({
      target: '0x2::coin::burn',
      typeArguments: [normalizeStructTag(coinType)],
      arguments: [this.#object(txb, treasury), this.#object(txb, coin)],
    });

    return this.#txb(txb, result);
  }

  async updateName({
    txb = new TransactionBlock(),
    treasury,
    coinType,
    value,
  }: UpdateMetadataArgs) {
    const metadata = await this.getCoinMetadata(coinType);

    invariant(metadata, 'This coin does not have a metadata');
    invariant(metadata.id, 'This coin is missing a coin metadata id');

    txb.moveCall({
      target: '0x2::coin::update_name',
      typeArguments: [normalizeStructTag(coinType)],
      arguments: [
        this.#object(txb, treasury),
        this.#object(txb, metadata.id),
        txb.pure(value),
      ],
    });

    return this.#txb(txb);
  }

  async updateSymbol({
    txb = new TransactionBlock(),
    treasury,
    coinType,
    value,
  }: UpdateMetadataArgs) {
    const metadata = await this.getCoinMetadata(coinType);

    invariant(metadata, 'This coin does not have a metadata');
    invariant(metadata.id, 'This coin is missing a coin metadata id');

    txb.moveCall({
      target: '0x2::coin::update_symbol',
      typeArguments: [normalizeStructTag(coinType)],
      arguments: [
        this.#object(txb, treasury),
        this.#object(txb, metadata.id),
        txb.pure(value),
      ],
    });

    return this.#txb(txb);
  }

  async updateDescription({
    txb = new TransactionBlock(),
    treasury,
    coinType,
    value,
  }: UpdateMetadataArgs) {
    const metadata = await this.getCoinMetadata(coinType);

    invariant(metadata, 'This coin does not have a metadata');
    invariant(metadata.id, 'This coin is missing a coin metadata id');

    txb.moveCall({
      target: '0x2::coin::update_description',
      typeArguments: [normalizeStructTag(coinType)],
      arguments: [
        this.#object(txb, treasury),
        this.#object(txb, metadata.id),
        txb.pure(value),
      ],
    });

    return this.#txb(txb);
  }

  async updateIconUrl({
    txb = new TransactionBlock(),
    treasury,
    coinType,
    value,
  }: UpdateMetadataArgs) {
    const metadata = await this.getCoinMetadata(coinType);

    invariant(metadata, 'This coin does not have a metadata');
    invariant(metadata.id, 'This coin is missing a coin metadata id');

    txb.moveCall({
      target: '0x2::coin::update_icon_url',
      typeArguments: [normalizeStructTag(coinType)],
      arguments: [
        this.#object(txb, treasury),
        this.#object(txb, metadata.id),
        txb.pure(value),
      ],
    });

    return this.#txb(txb);
  }

  getSuiCoin({ txb = new TransactionBlock(), amount }: GetSuiCoinArgs) {
    const result = txb.splitCoins(txb.gas, [txb.pure.u64(amount)]);
    return this.#txb(txb, result);
  }

  getCoin({ txb = new TransactionBlock(), coins, amount }: GetCoinArgs) {
    const [firstCoin, ...otherCoins] = coins;

    const firstCoinInput = this.#object(txb, firstCoin);
    if (otherCoins.length > 0) {
      txb.mergeCoins(
        firstCoinInput,
        otherCoins.map(coin => this.#object(txb, coin)),
      );
    }

    const result = txb.splitCoins(firstCoinInput, [txb.pure.u64(amount)]);

    return this.#txb(txb, result);
  }

  async getAllCoins(account: string) {
    return getAllCoins(this.#client, account);
  }

  async getCoins({ coinType, account }: GetCoinsArgs) {
    return getCoins(this.#client, account, coinType);
  }

  async getCoinOfValue({
    txb = new TransactionBlock(),
    coinValue,
    coinType,
    account,
  }: GetCoinOfValueArgs) {
    return getCoinOfValue(this.#client, txb, coinValue, account, coinType);
  }

  async getCoinMetadata(coinType: string) {
    if (cache.has(coinType)) return cache.get(coinType)!;

    const metadata = await this.#client.getCoinMetadata({ coinType });

    cache.set(coinType, metadata);
    return metadata;
  }

  #txb(txb: TransactionBlock, result?: TransactionResult): Txb {
    return new Txb({ client: this.#client, txb, result });
  }

  #object(txb: TransactionBlock, id: string | TransactionObjectArgument) {
    return typeof id === 'string' ? txb.object(normalizeSuiObjectId(id)) : id;
  }
}
