import { bcs } from '@mysten/sui.js/bcs';
import {
  CoinStruct,
  GetAllCoinsParams,
  SuiClient,
  SuiExecutionResult,
} from '@mysten/sui.js/client';
import {
  TransactionBlock,
  TransactionResult,
} from '@mysten/sui.js/transactions';
import {
  normalizeStructTag,
  normalizeSuiAddress,
  SUI_TYPE_ARG,
} from '@mysten/sui.js/utils';
export const ZERO_ADDRESS = normalizeSuiAddress('0x0');

export async function devInspectAndGetResults(
  suiClient: SuiClient,
  txb: TransactionBlock,
  sender = ZERO_ADDRESS,
): Promise<SuiExecutionResult[]> {
  const resp = await suiClient.devInspectTransactionBlock({
    sender: sender,
    transactionBlock: txb,
  });
  if (resp.error) {
    throw Error(`response error: ${JSON.stringify(resp, null, 2)}`);
  }
  if (!resp.results?.length) {
    throw Error(`response has no results: ${JSON.stringify(resp, null, 2)}`);
  }
  return resp.results;
}

export async function devInspectAndGetReturnValues(
  suiClient: SuiClient,
  txb: TransactionBlock,
  sender = ZERO_ADDRESS,
): Promise<unknown[][]> {
  const results = await devInspectAndGetResults(suiClient, txb, sender);
  /** The values returned from each of the transactions in the TransactionBlock. */
  const blockReturnValues: unknown[][] = [];
  for (const txnResult of results) {
    if (!txnResult.returnValues?.length) {
      throw Error(
        `transaction didn't return any values: ${JSON.stringify(txnResult, null, 2)}`,
      );
    }
    /** The values returned from the transaction (a function can return multiple values). */
    const txnReturnValues: unknown[] = [];
    for (const value of txnResult.returnValues) {
      const valueData = Uint8Array.from(value[0]);
      const valueType = value[1];
      let valueDeserialized: unknown;
      if (valueType === '0x1::string::String') {
        valueDeserialized = bcs.string().parse(valueData);
      } else if (valueType === 'vector<0x1::string::String>') {
        valueDeserialized = bcs.vector(bcs.string()).parse(valueData);
      } else {
        valueDeserialized = bcs.de(valueType, valueData, 'hex');
      }
      txnReturnValues.push(valueDeserialized);
    }
    blockReturnValues.push(txnReturnValues);
  }
  return blockReturnValues;
}

export const getAllCoins = async (
  client: SuiClient,
  account: GetAllCoinsParams['owner'],
  cursor: GetAllCoinsParams['cursor'] = null,
): Promise<CoinStruct[]> => {
  const { data, nextCursor, hasNextPage } = await client.getAllCoins({
    owner: account,
    cursor,
  });

  if (!hasNextPage) return data;

  const newData = await getAllCoins(client, account, nextCursor);

  return [...data, ...newData];
};

export const getCoins = async (
  client: SuiClient,
  account: GetAllCoinsParams['owner'],
  coinType: string,
  cursor: GetAllCoinsParams['cursor'] = null,
): Promise<CoinStruct[]> => {
  const { data, nextCursor, hasNextPage } = await client.getCoins({
    owner: account,
    coinType,
    cursor,
  });

  if (!hasNextPage) return data;

  const newData = await getCoins(client, account, coinType, nextCursor);

  return [...data, ...newData];
};

export async function getCoinOfValue(
  client: SuiClient,
  txb = new TransactionBlock(),
  coinValue: bigint,
  account: GetAllCoinsParams['owner'],
  coinType: string,
): Promise<TransactionResult> {
  if (normalizeStructTag(coinType) === normalizeStructTag(SUI_TYPE_ARG))
    return txb.splitCoins(txb.gas, [txb.pure(coinValue)]);

  const [firstCoin, ...otherCoins] = await getCoins(client, account, coinType);

  const firstCoinInput = txb.object(firstCoin.coinObjectId);
  if (otherCoins.length > 0) {
    txb.mergeCoins(
      firstCoinInput,
      otherCoins.map(coin => coin.coinObjectId),
    );
  }
  return txb.splitCoins(firstCoinInput, [txb.pure.u64(coinValue)]);
}
