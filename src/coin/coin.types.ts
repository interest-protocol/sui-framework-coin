import { GetAllCoinsParams,SuiClient } from '@mysten/sui.js/client';
import {
  TransactionBlock,
  TransactionObjectArgument,
  TransactionResult,
} from '@mysten/sui.js/transactions';

export type MoveObjectArgument = string | TransactionObjectArgument;

export interface CoinConstructorArgs {
  client: SuiClient;
}

export interface TxbConstructorArgs extends CoinConstructorArgs {
  txb: TransactionBlock;
  result?: TransactionResult;
}

export interface MaybeTxb {
  txb?: TransactionBlock;
}

export interface TotalSupplyArgs extends MaybeTxb {
  treasury: MoveObjectArgument;
  coinType: string;
}

export type TreasuryIntoSupplyArgs = TotalSupplyArgs;

export interface ValueArgs extends MaybeTxb {
  coin: MoveObjectArgument;
  coinType: string;
}

export interface JoinArgs extends MaybeTxb {
  coinType: string;
  coinA: MoveObjectArgument;
  coinB: MoveObjectArgument;
}

export interface SplitArgs extends MaybeTxb {
  coinType: string;
  coin: MoveObjectArgument;
  amount: bigint;
}

export type DivideIntoN = SplitArgs;

export interface ZeroArgs extends MaybeTxb {
  coinType: string;
}

export interface DestroyZero extends MaybeTxb {
  coinType: string;
  coin: MoveObjectArgument;
}

export interface MintArgs extends MaybeTxb {
  coinType: string;
  treasury: MoveObjectArgument;
  amount: bigint;
}

export interface BurnArgs extends MaybeTxb {
  treasury: MoveObjectArgument;
  coinType: string;
  coin: MoveObjectArgument;
}

export interface UpdateMetadataArgs extends MaybeTxb {
  treasury: MoveObjectArgument;
  coinType: string;
  value: string;
}

export interface GetCoinOfValueArgs extends MaybeTxb {
  coinValue: bigint;
  account: GetAllCoinsParams['owner'];
  coinType: string;
}

export interface GetSuiCoinArgs extends MaybeTxb {
  amount: bigint;
}

export interface GetCoinArgs extends MaybeTxb {
  coins: MoveObjectArgument[];
  amount: bigint;
}

export interface GetCoinsArgs {
  account: GetAllCoinsParams['owner'];
  coinType: string;
}
